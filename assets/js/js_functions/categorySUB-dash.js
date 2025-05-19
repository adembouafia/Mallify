
const API_BASE_URL = ''; 

const showAlertEarly = (title, message, icon) => {
    if (window.Swal) {
        window.Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonColor: '#3085d6'
        });
    } else {
        // Fallback if SweetAlert2 is not loaded yet
        console.warn(`${icon.toUpperCase()}: ${title} - ${message}`);
        alert(`${title}\n\n${message}`);
    }
};

// Get authentication token from localStorage
const getAuthToken = () => localStorage.getItem('token') || '';

// Helper function to check if token is expired
const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
        // JWT tokens are in format: header.payload.signature
        // We need the payload part
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        
        return Date.now() >= expirationTime;
    } catch (e) {
        console.error('Error checking token expiration:', e);
        return true; // If we can't parse the token, assume it's expired
    }
};

// Helper function to add auth headers to XHR requests
const addAuthHeader = (xhr) => {
    const token = getAuthToken();
    if (token) {
        // Check if token is expired
        if (isTokenExpired(token)) {
            // Token is expired, redirect to login page or show message
            showAlertEarly('Session Expired', 'Your session has expired. Please log in again.', 'warning');

            return false;
        }
        
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        return true;
    }
    return false;
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addSubcategoryBtn = document.getElementById('addSubcategoryBtn');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    const saveSubcategoryBtn = document.getElementById('saveSubcategoryBtn');

    // Table bodies
    const categoryTableBody = document.getElementById('categoryTableBody');
    const subcategoryTableBody = document.getElementById('subcategoryTableBody');
      // Stat elements
    const categoriesCount = document.getElementById('categoriesCount');
    const subCategoriesCount = document.getElementById('subCategoriesCount');
    
    // Form elements
    const categoryForm = document.getElementById('categoryForm');
    const subcategoryForm = document.getElementById('subcategoryForm');
    const subcategoryParent = document.getElementById('subcategoryParent');
    
    // Modals (Bootstrap)
    const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    const subcategoryModal = new bootstrap.Modal(document.getElementById('subcategoryModal'));    // Check if user is logged in
    if (!getAuthToken()) {
        showAlertEarly('Warning', 'You are not logged in or your session has expired. Some features may be limited.', 'warning');
    }
    
    // Initialize the page
    initialize();
      // Event listeners
    addCategoryBtn.addEventListener('click', () => openCategoryModal());
    addSubcategoryBtn.addEventListener('click', () => openSubcategoryModal());
    saveCategoryBtn.addEventListener('click', saveCategory);
    saveSubcategoryBtn.addEventListener('click', saveSubcategory);
    
    // Reset filter button
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetSubcategoryFilter);
    }
    
    /**
     * Initialize the page - load all data
     */
    function initialize() {
        loadCategoriesWithSubcategories();
    }    /**
     * Load categories with their subcategories
     */
    function loadCategoriesWithSubcategories() {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${API_BASE_URL}/categorieswithsubcategories`, true);
        
        // Add authentication header
        addAuthHeader(xhr);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                displayCategories(response.categories);                displaySubcategories(response.categories);
                updateCategoryDropdown(response.categories);
                updateStatistics(response.categories);
            } else if (xhr.status === 401) {
                showAlert('Authentication Error', 'You are not authorized to access this resource. Please log in again.', 'error');
            } else {
                showAlert('Error', 'Unable to load categories.', 'error');
            }
        };
        
        xhr.onerror = function() {
            showAlert('Error', 'Server connection problem.', 'error');
        };
        
        xhr.send();
    }
      /**
     * Display categories in the categories table
     * @param {Array} categories - Array of category objects
     */
    function displayCategories(categories) {
        categoryTableBody.innerHTML = '';
        
        if (categories.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" class="text-center">No categories found</td>`;
            categoryTableBody.appendChild(tr);
            return;
        }
        
        categories.forEach((category, index) => {
            const tr = document.createElement('tr');
            tr.className = 'category-row';
            tr.dataset.categoryId = category._id;
            tr.dataset.categoryName = category.categoryName;
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td class="category-name-cell" style="cursor: pointer;">${category.categoryName}</td>
                <td class="text-center"><span class="badge bg-info">${category.subCategories.length}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary edit-category-btn" data-id="${category._id}" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-category-btn" data-id="${category._id}" data-name="${category.categoryName}" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            categoryTableBody.appendChild(tr);
            
            // Add event listeners for edit and delete buttons
            const editBtn = tr.querySelector('.edit-category-btn');
            const deleteBtn = tr.querySelector('.delete-category-btn');
            
            // Add click event on the category name cell to filter subcategories
            const categoryNameCell = tr.querySelector('.category-name-cell');
            categoryNameCell.addEventListener('click', () => filterSubcategoriesByCategory(category._id, category.categoryName));
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click
                openCategoryModal(category);
            });
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click
                confirmDeleteCategory(category._id, category.categoryName);
            });
        });
    }
      /**
     * Display subcategories in the subcategories table
     * @param {Array} categories - Array of category objects with subcategories
     * @param {string} filterCategoryId - Optional category ID to filter by
     */
    function displaySubcategories(categories, filterCategoryId = null) {
        subcategoryTableBody.innerHTML = '';
        
        // Flatten subcategories array
        const subcategories = [];
        categories.forEach(category => {
            // Apply filter if a category ID is provided
            if (filterCategoryId && category._id !== filterCategoryId) {
                return; // Skip this category if filtering is active
            }
            
            category.subCategories.forEach(subCat => {
                subcategories.push({
                    ...subCat,
                    categoryId: category._id,
                    categoryName: category.categoryName
                });
            });
        });
        
        if (subcategories.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" class="text-center">No subcategories found</td>`;
            subcategoryTableBody.appendChild(tr);
            return;
        }
          subcategories.forEach((subcategory, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${subcategory.name}</td>
                <td>${subcategory.categoryName}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary edit-subcategory-btn" data-id="${subcategory._id}" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-subcategory-btn" data-id="${subcategory._id}" data-name="${subcategory.name}" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            subcategoryTableBody.appendChild(tr);
            
            // Add event listeners for edit and delete buttons
            const editBtn = tr.querySelector('.edit-subcategory-btn');
            const deleteBtn = tr.querySelector('.delete-subcategory-btn');
            
            editBtn.addEventListener('click', () => openSubcategoryModal(subcategory, categories));
            deleteBtn.addEventListener('click', () => confirmDeleteSubcategory(subcategory._id, subcategory.name));
        });
    }
    
    /**
     * Update the category dropdown in subcategory modal
     * @param {Array} categories - Array of category objects
     */
    function updateCategoryDropdown(categories) {
        subcategoryParent.innerHTML = '<option value="">Select a category</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.categoryName;
            subcategoryParent.appendChild(option);
        });
    }    /**
     * Update the statistics display
     * @param {Array} categories - Array of category objects with subcategories
     */
    function updateStatistics(categories) {
        const catCount = categories.length;
        let subCatCount = 0;
        
        categories.forEach(category => {
            subCatCount += category.subCategories.length;
        });
        
        categoriesCount.textContent = catCount;
        subCategoriesCount.textContent = subCatCount;
    }
    
    /**
     * Filter subcategories by category
     * @param {string} categoryId - Category ID to filter by
     * @param {string} categoryName - Category name for display
     */
    function filterSubcategoriesByCategory(categoryId, categoryName) {
        // Highlight the selected category
        const allCategoryRows = document.querySelectorAll('.category-row');
        allCategoryRows.forEach(row => {
            row.classList.remove('table-active');
        });
        
        const selectedRow = document.querySelector(`.category-row[data-category-id="${categoryId}"]`);
        if (selectedRow) {
            selectedRow.classList.add('table-active');
        }
        
        // Update subcategory card title
        const subcategoryCardHeader = document.querySelector('.subcategory-table').closest('.card').querySelector('.card-header h5');
        if (subcategoryCardHeader) {
            subcategoryCardHeader.textContent = `Subcategories for "${categoryName}"`;
        }
        
        // Get all categories data and filter
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${API_BASE_URL}/categorieswithsubcategories`, true);
        
        // Add authentication header
        addAuthHeader(xhr);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                displaySubcategories(response.categories, categoryId);
            } else if (xhr.status === 401) {
                showAlert('Authentication Error', 'You are not authorized to access this resource. Please log in again.', 'error');
            }
        };
        
        xhr.send();
    }
    
    /**
     * Reset subcategory filter
     */
    function resetSubcategoryFilter() {
        // Remove highlight from all category rows
        const allCategoryRows = document.querySelectorAll('.category-row');
        allCategoryRows.forEach(row => {
            row.classList.remove('table-active');
        });
        
        // Reset subcategory card title
        const subcategoryCardHeader = document.querySelector('.subcategory-table').closest('.card').querySelector('.card-header h5');
        if (subcategoryCardHeader) {
            subcategoryCardHeader.textContent = 'Subcategories List';
        }
        
        // Get all categories data and display all subcategories
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${API_BASE_URL}/categorieswithsubcategories`, true);
        
        // Add authentication header
        addAuthHeader(xhr);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                displaySubcategories(response.categories);
            }
        };
        
        xhr.send();
    }
    
    /**
     * Open the category modal for creation or editing
     * @param {Object} category - Category to edit (optional)
     */
    function openCategoryModal(category = null) {
        const categoryId = document.getElementById('categoryId');
        const categoryName = document.getElementById('categoryName');
        const modalTitle = document.getElementById('categoryModalLabel');
        
        // Reset form
        categoryForm.reset();
        
        if (category) {
            // Edit mode
            modalTitle.textContent = 'Edit Category';
            categoryId.value = category._id;
            categoryName.value = category.categoryName;
        } else {
            // Create mode
            modalTitle.textContent = 'Add Category';
            categoryId.value = '';
        }
        
        categoryModal.show();
    }
    
    /**
     * Open the subcategory modal for creation or editing
     * @param {Object} subcategory - Subcategory to edit (optional)
     * @param {Array} categories - Array of categories for parent selection
     */    function openSubcategoryModal(subcategory = null, categories = []) {
        const subcategoryId = document.getElementById('subcategoryId');
        const subcategoryName = document.getElementById('subcategoryName');
        const modalTitle = document.getElementById('subcategoryModalLabel');
        
        // Reset form
        subcategoryForm.reset();
        
        if (subcategory) {
            // Edit mode
            modalTitle.textContent = 'Edit Subcategory';
            subcategoryId.value = subcategory._id;
            subcategoryName.value = subcategory.name;
            
            // Find the parent category
            if (categories.length === 0) {
                // If categories not provided, fetch them
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `${API_BASE_URL}/category`, true);
                
                // Add authentication header
                addAuthHeader(xhr);
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const response = JSON.parse(xhr.responseText);
                        updateCategoryDropdown(response.categories);
                        // Use categoryId if it exists or fallback to category
                        subcategoryParent.value = subcategory.categoryId || subcategory.category;
                    } else if (xhr.status === 401) {
                        showAlert('Authentication Error', 'You are not authorized to access this resource.', 'error');
                    }
                };
                
                xhr.send();
            } else {
                updateCategoryDropdown(categories);
                // Use categoryId if it exists or fallback to category
                subcategoryParent.value = subcategory.categoryId || subcategory.category;
            }
        } else {
            // Create mode
            modalTitle.textContent = 'Add Subcategory';
            subcategoryId.value = '';
        }
        
        subcategoryModal.show();
    }/**
     * Save a category (create or update)
     */
    function saveCategory() {
        const categoryId = document.getElementById('categoryId').value;
        const categoryName = document.getElementById('categoryName').value;
        
        if (!categoryName.trim()) {
            showAlert('Error', 'Category name is required.', 'error');
            return;
        }
        
        const xhr = new XMLHttpRequest();
        const url = categoryId ? `${API_BASE_URL}/category/${categoryId}` : `${API_BASE_URL}/category/create`;
        xhr.open(categoryId ? 'PUT' : 'POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // Add authentication header
        addAuthHeader(xhr);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                categoryModal.hide();
                showAlert('Success', categoryId ? 'Category updated successfully.' : 'Category created successfully.', 'success');
                loadCategoriesWithSubcategories();
            } else if (xhr.status === 401) {
                showAlert('Authentication Error', 'You are not authorized to perform this action.', 'error');
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showAlert('Error', response.message || 'An error occurred.', 'error');
                } catch (e) {
                    showAlert('Error', 'An error occurred while processing the request.', 'error');
                }
            }
        };
        
        xhr.onerror = function() {
            showAlert('Error', 'Server connection problem.', 'error');
        };
        
        const data = JSON.stringify({ categoryName });
        xhr.send(data);
    }    /**
     * Save a subcategory (create or update)
     */
    function saveSubcategory() {
        const subcategoryId = document.getElementById('subcategoryId').value;
        const name = document.getElementById('subcategoryName').value;
        const category = document.getElementById('subcategoryParent').value;
        
        if (!name.trim()) {
            showAlert('Error', 'Subcategory name is required.', 'error');
            return;
        }
        
        if (!category) {
            showAlert('Error', 'Please select a parent category.', 'error');
            return;
        }
        
        const xhr = new XMLHttpRequest();
        const url = subcategoryId ? `${API_BASE_URL}/subcategory/update/${subcategoryId}` : `${API_BASE_URL}/subcategory/create`;
        xhr.open(subcategoryId ? 'PUT' : 'POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // Add authentication header
        if (!addAuthHeader(xhr)) {
            showAlert('Authentication Error', 'You are not authorized to perform this action.', 'error');
            return;
        }
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                subcategoryModal.hide();
                showAlert('Success', subcategoryId ? 'Subcategory updated successfully.' : 'Subcategory created successfully.', 'success');
                loadCategoriesWithSubcategories();
            } else if (xhr.status === 401) {
                showAlert('Authentication Error', 'You are not authorized to perform this action.', 'error');
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showAlert('Error', response.message || 'An error occurred.', 'error');
                } catch (e) {
                    showAlert('Error', 'An error occurred while processing the request.', 'error');
                }
            }
        };
        
        xhr.onerror = function() {
            showAlert('Error', 'Server connection problem.', 'error');
        };
        
        const data = JSON.stringify({ name, category });
        xhr.send(data);
    }
    
    /**
     * Confirm category deletion
     * @param {string} id - Category ID
     * @param {string} name - Category name for confirmation message
     */
    function confirmDeleteCategory(id, name) {
        Swal.fire({
            title: 'Are you sure?',
            html: `You are about to delete the category <strong>${name}</strong>.<br>This action will also delete all associated subcategories.<br>This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCategory(id);
            }
        });
    }    /**
     * Delete a category
     * @param {string} id - Category ID
     */
    function deleteCategory(id) {
        const xhr = new XMLHttpRequest();
        xhr.open('DELETE', `${API_BASE_URL}/category/delete/${id}`, true);
        
        // Add authentication header
        addAuthHeader(xhr);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                showAlert('Success', 'Category deleted successfully.', 'success');
                loadCategoriesWithSubcategories();
            } else if (xhr.status === 401) {
                showAlert('Authentication Error', 'You are not authorized to delete this category.', 'error');
            } else {
                showAlert('Error', 'Unable to delete the category.', 'error');
            }
        };
        
        xhr.onerror = function() {
            showAlert('Error', 'Server connection problem.', 'error');
        };
        
        xhr.send();
    }
    
    /**
     * Confirm subcategory deletion
     * @param {string} id - Subcategory ID
     * @param {string} name - Subcategory name for confirmation message
     */
    function confirmDeleteSubcategory(id, name) {
        Swal.fire({
            title: 'Are you sure?',
            html: `You are about to delete the subcategory <strong>${name}</strong>.<br>This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteSubcategory(id);
            }
        });
    }/**
     * Delete a subcategory
     * @param {string} id - Subcategory ID
     */
    function deleteSubcategory(id) {
        const xhr = new XMLHttpRequest();
        xhr.open('DELETE', `${API_BASE_URL}/subcategory/delete/${id}`, true);
        
        // Add authentication header
        if (!addAuthHeader(xhr)) {
            showAlert('Authentication Error', 'You are not authorized to delete this subcategory.', 'error');
            return;
        }
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                showAlert('Success', 'Subcategory deleted successfully.', 'success');
                loadCategoriesWithSubcategories();
            } else if (xhr.status === 401) {
                showAlert('Authentication Error', 'You are not authorized to delete this subcategory.', 'error');
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showAlert('Error', response.message || 'Unable to delete the subcategory.', 'error');
                } catch (e) {
                    showAlert('Error', 'Unable to delete the subcategory.', 'error');
                }
            }
        };
        
        xhr.onerror = function() {
            showAlert('Error', 'Server connection problem.', 'error');
        };
        
        xhr.send();
    }
    
    /**
     * Show an alert using SweetAlert2
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @param {string} icon - Alert icon (success, error, warning, info)
     */
    function showAlert(title, message, icon) {
        Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonColor: '#3085d6'
        });
    }
});
