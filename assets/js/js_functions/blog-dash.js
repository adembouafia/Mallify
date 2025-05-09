// Global variables
let currentBlogId = null;
let blogs = [];
let categories = [];
let tags = [];
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 6;

// Function to initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Update page title and headings
  updatePageText();
  
  // Load blogs
  loadAllBlogs();

  // Load categories and tags
  loadCategories();
  loadTags();

  // Initialize event listeners
  initEventListeners();

  // Initialize pagination
  initPagination();
});

// Function to update page text elements
function updatePageText() {
  // Update main heading
  const mainHeading = document.querySelector("h1");
  if (mainHeading && mainHeading.textContent === "Gestion des Blogs") {
    mainHeading.textContent = "Blog Management";
  }
  
  // Update add button
  const addButton = document.querySelector(".btn-primary");
  if (addButton && addButton.textContent.includes("Ajouter un article")) {
    addButton.innerHTML = '<i class="bi bi-plus"></i> Add an article';
  }
  
  // Update stats cards
  const statsLabels = document.querySelectorAll(".stat-card .stat-info p");
  statsLabels.forEach(label => {
    if (label.textContent === "Total des articles") {
      label.textContent = "Total articles";
    } else if (label.textContent === "Vues totales") {
      label.textContent = "Total views";
    } else if (label.textContent === "Commentaires") {
      label.textContent = "Comments";
    } else if (label.textContent === "Brouillons") {
      label.textContent = "Drafts";
    }
  });
  
  // Update search placeholder
  const searchInput = document.querySelector("input[type='text']");
  if (searchInput && searchInput.placeholder === "Rechercher un article...") {
    searchInput.placeholder = "Search for an article...";
  }
  
  // Update filter dropdowns
  const categoryDropdown = document.querySelector(".blog-filter select:nth-child(1)");
  if (categoryDropdown && categoryDropdown.options[0].text === "Toutes les catégories") {
    categoryDropdown.options[0].text = "All categories";
  }
  
  const statusDropdown = document.querySelector(".blog-filter select:nth-child(2)");
  if (statusDropdown && statusDropdown.options[0].text === "Tous les statuts") {
    statusDropdown.options[0].text = "All statuses";
  }
  
  // Update filter button
  const filterButton = document.querySelector(".blog-filter button");
  if (filterButton && filterButton.textContent === "Filtrer") {
    filterButton.textContent = "Filter";
  }
  
  // Update table headers
  const tableHeaders = document.querySelectorAll("th");
  tableHeaders.forEach(header => {
    switch (header.textContent) {
      case "Titre":
        header.textContent = "Title";
        break;
      case "Catégorie":
        header.textContent = "Category";
        break;
      case "Date":
        header.textContent = "Date";
        break;
      case "Commentaires":
        header.textContent = "Comments";
        break;
      case "Actions":
        header.textContent = "Actions";
        break;
      case "Image":
        header.textContent = "Image";
        break;
    }
  });
  
  // Update pagination buttons
  const prevButton = document.querySelector(".pagination .page-item:first-child .page-link");
  if (prevButton && prevButton.textContent.trim() === "Précédent") {
    prevButton.textContent = "Previous";
  }
  
  const nextButton = document.querySelector(".pagination .page-item:last-child .page-link");
  if (nextButton && nextButton.textContent.trim() === "Suivant") {
    nextButton.textContent = "Next";
  }
}

// Initialize event listeners
function initEventListeners() {
  // Blog add/edit form
  const blogForm = document.getElementById("blogForm");
  if (blogForm) {
    blogForm.addEventListener("submit", handleBlogSubmit);
  }

  // Add blog button
  const addBlogBtn = document.getElementById("addBlogBtn");
  if (addBlogBtn) {
    addBlogBtn.addEventListener("click", () => {
      // Show the form
      const formContainer = document.getElementById("blogFormContainer");
      if (formContainer) {
        formContainer.classList.add("active");
        formContainer.style.display = "block";
      }
      resetBlogForm();
    });
  }

  // Form close button
  const closeFormBtn = document.getElementById("closeFormBtn");
  if (closeFormBtn) {
    closeFormBtn.addEventListener("click", () => {
      const formContainer = document.getElementById("blogFormContainer");
      if (formContainer) {
        formContainer.classList.remove("active");
        formContainer.style.display = "none";
      }
    });
  }

  // Form cancel button
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      const formContainer = document.getElementById("blogFormContainer");
      if (formContainer) {
        formContainer.classList.remove("active");
        formContainer.style.display = "none";
      }
    });
  }

  // Main image preview
  const mainImageInput = document.getElementById("mainImageBlog");
  if (mainImageInput) {
    mainImageInput.addEventListener("change", function () {
      const preview = document.getElementById("mainImagePreview");
      if (preview && this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // Additional images preview
  const otherImagesInput = document.getElementById("otherImagesBlog");
  if (otherImagesInput) {
    otherImagesInput.addEventListener("change", function () {
      const previewContainer = document.getElementById("otherImagesPreview");
      if (previewContainer && this.files && this.files.length > 0) {
        previewContainer.innerHTML = "";

        for (let i = 0; i < this.files.length; i++) {
          const reader = new FileReader();
          const file = this.files[i];

          reader.onload = (e) => {
            const imgWrapper = document.createElement("div");
            imgWrapper.className = "border rounded p-1 bg-light";

            const img = document.createElement("img");
            img.src = e.target.result;
            img.className = "img-fluid";
            img.style.maxHeight = "80px";

            imgWrapper.appendChild(img);
            previewContainer.appendChild(imgWrapper);
          };

          reader.readAsDataURL(file);
        }
      }
    });
  }

  // Blog search
  const searchInput = document.querySelector(".blog-filter input[type='text']");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim();
      if (searchTerm.length > 2) {
        searchBlogs(searchTerm);
      } else if (searchTerm.length === 0) {
        loadAllBlogs();
      }
    });
  }

  // Category and status filters
  const categoryFilter = document.querySelector(
    ".blog-filter select:nth-child(1)"
  );
  const statusFilter = document.querySelector(
    ".blog-filter select:nth-child(2)"
  );
  const filterBtn = document.querySelector(".blog-filter button");

  if (filterBtn && categoryFilter && statusFilter) {
    filterBtn.addEventListener("click", () => {
      const category = categoryFilter.value;
      const status = statusFilter.value;

      filterBlogs(category, status);
    });
  }

  // Add event listener for click on drafts stats card
  const draftStatsCard = document.querySelector(
    ".blog-stats .stat-card:nth-child(4)"
  ); // Card for drafts
  if (draftStatsCard) {
    draftStatsCard.style.cursor = "pointer";
    draftStatsCard.title = "Click to view drafts";

    draftStatsCard.addEventListener("click", () => {
      filterBlogs(null, "draft");

      // Update the status filter in the UI
      const statusFilter = document.querySelector(
        ".blog-filter select:nth-child(2)"
      );
      if (statusFilter) {
        for (let i = 0; i < statusFilter.options.length; i++) {
          if (statusFilter.options[i].value === "draft") {
            statusFilter.selectedIndex = i;
            break;
          }
        }
      }
    });
  }
}

// Initialize pagination
function initPagination() {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  // Add event listeners to pagination buttons
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const pageText = this.textContent.trim();

      if (pageText === "Previous") {
        if (currentPage > 1) {
          loadBlogs(currentPage - 1);
        }
      } else if (pageText === "Next") {
        if (currentPage < totalPages) {
          loadBlogs(currentPage + 1);
        }
      } else {
        const pageNum = Number.parseInt(pageText);
        if (!isNaN(pageNum)) {
          loadBlogs(pageNum);
        }
      }
    });
  });
}

// Update pagination display
function updatePagination() {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  // Clear current pagination
  paginationContainer.innerHTML = "";

  // "Previous" button
  const prevItem = document.createElement("li");
  prevItem.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevItem.innerHTML = `<a class="page-link" href="#" tabindex="-1" ${currentPage === 1 ? 'aria-disabled="true"' : ""}>Previous</a>`;
  paginationContainer.appendChild(prevItem);

  // Calculate pages to display
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // Numbered pages
  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement("li");
    pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    paginationContainer.appendChild(pageItem);
  }

  // "Next" button
  const nextItem = document.createElement("li");
  nextItem.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextItem.innerHTML = `<a class="page-link" href="#" ${currentPage === totalPages ? 'aria-disabled="true"' : ""}>Next</a>`;
  paginationContainer.appendChild(nextItem);

  // Reset event listeners
  initPagination();
}

// Filter blogs by category and status
function filterBlogs(category, status) {
  console.log(`Filtering blogs - Category: ${category}, Status: ${status}`);

  // Build filter query
  const queryParams = [];

  if (category) {
    queryParams.push(`category=${encodeURIComponent(category)}`);
  }

  if (status) {
    queryParams.push(`status=${encodeURIComponent(status)}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  console.log(`Query string: ${queryString}`);

  // Load filtered blogs
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/blog${queryString}`, true);

  // Add authentication token to allow access to drafts
  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        console.log("Response received:", xhr.responseText);
        const response = JSON.parse(xhr.responseText);

        if (response.blogs) {
          blogs = response.blogs;
          totalPages = response.totalPages || 1;
          currentPage = response.currentPage || 1;
        } else {
          blogs = Array.isArray(response) ? response : [];
          totalPages = 1;
          currentPage = 1;
        }

        console.log(`Filtered blogs: ${blogs.length} blogs found`);
        renderBlogTable(blogs);
        updateBlogStats();
        updatePagination();
      } catch (error) {
        console.error("Error parsing response:", error);
        showAlert("Error filtering blogs", "error");
      }
    } else {
      console.error("Error filtering blogs:", xhr.statusText);
      showAlert("Error filtering blogs", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Network error while filtering blogs");
    showAlert("Network error while filtering blogs", "error");
  };

  xhr.send();
}

// Load all blogs (including drafts)
function loadAllBlogs() {
  console.log("Loading all blogs...");
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/blog", true);

  // Add authentication token
  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        console.log("Response received:", xhr.responseText);
        const response = JSON.parse(xhr.responseText);

        if (response.blogs) {
          blogs = response.blogs;
          totalPages = response.totalPages || 1;
          currentPage = response.currentPage || 1;
        } else {
          blogs = Array.isArray(response) ? response : [];
          totalPages = 1;
          currentPage = 1;
        }

        console.log(`Loaded ${blogs.length} blogs`);
        renderBlogTable(blogs);
        updateBlogStats();
        updatePagination();

        // Update status options in the filter
        updateStatusFilterOptions();
      } catch (error) {
        console.error("Error parsing response:", error);
        showAlert("Error loading blogs", "error");
      }
    } else {
      console.error("Error loading blogs:", xhr.statusText);
      showAlert("Error loading blogs", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Network error while loading blogs");
    showAlert("Network error while loading blogs", "error");
  };

  xhr.send();
}

// Update status options in the filter
function updateStatusFilterOptions() {
  const statusFilter = document.querySelector(
    ".blog-filter select:nth-child(2)"
  );
  if (!statusFilter) return;

  // Keep current value
  const currentValue = statusFilter.value;

  // Clear existing options except the first (placeholder)
  while (statusFilter.options.length > 1) {
    statusFilter.remove(1);
  }

  // Add status options
  const statuses = [
    { value: "published", text: "Published" },
    { value: "draft", text: "Draft" },
  ];

  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.value;
    option.textContent = status.text;
    statusFilter.appendChild(option);
  });

  // Restore selected value if it exists
  if (currentValue) {
    for (let i = 0; i < statusFilter.options.length; i++) {
      if (statusFilter.options[i].value === currentValue) {
        statusFilter.selectedIndex = i;
        break;
      }
    }
  }
}

// Load blogs with pagination
function loadBlogs(page = 1) {
  currentPage = page;

  // Build query with pagination
  const queryParams = [`page=${page}`, `limit=${itemsPerPage}`];
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/blog${queryString}`, true);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        if (response.blogs) {
          blogs = response.blogs;
          totalPages = response.totalPages || 1;
          currentPage = response.currentPage || 1;
        } else {
          blogs = Array.isArray(response) ? response : [];
          totalPages = 1;
          currentPage = 1;
        }

        renderBlogTable(blogs);
        updateBlogStats();
        updatePagination();
      } catch (error) {
        console.error("Error parsing response:", error);
        showAlert("Error loading blogs", "error");
      }
    } else {
      console.error("Error loading blogs:", xhr.statusText);
      showAlert("Error loading blogs", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Network error while loading blogs");
    showAlert("Network error while loading blogs", "error");
  };

  xhr.send();
}

// Load categories
function loadCategories() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/categories", true);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        // Parse the categories from the response
        let fetchedCategories = JSON.parse(xhr.responseText);

        // Default categories to use if none are returned from the server
        const defaultCategories = [
          "Technology",
          "Fashion",
          "Health",
          "Food",
          "Travel",
          "Lifestyle",
        ];

        // If no categories were returned, use the default ones
        if (!fetchedCategories || fetchedCategories.length === 0) {
          fetchedCategories = defaultCategories;
        }

        // Update the global categories array
        categories = fetchedCategories;

        // Update the category input in the form
        const categoryInput = document.getElementById("category");
        const categoryFilter = document.querySelector(
          ".blog-filter select:nth-child(1)"
        );

        if (categoryInput) {
          // Save the current value
          const currentValue = categoryInput.value;

          // Clear existing options except the first one (placeholder)
          while (categoryInput.options.length > 1) {
            categoryInput.remove(1);
          }

          // Add the categories as options
          categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryInput.appendChild(option);
          });

          // Add an option for creating a new category
          const newOption = document.createElement("option");
          newOption.value = "new";
          newOption.textContent = "+ Add a new category";
          categoryInput.appendChild(newOption);

          // Restore the selected value if it exists in the new options
          if (currentValue) {
            for (let i = 0; i < categoryInput.options.length; i++) {
              if (categoryInput.options[i].value === currentValue) {
                categoryInput.selectedIndex = i;
                break;
              }
            }
          }

          // Add event listener for the "new category" option
          categoryInput.addEventListener("change", function () {
            if (this.value === "new") {
              // Prompt the user for a new category
              const newCategory = prompt(
                "Enter the name of the new category:"
              );

              if (newCategory && newCategory.trim() !== "") {
                // Add the new category to the dropdown
                const option = document.createElement("option");
                option.value = newCategory.trim();
                option.textContent = newCategory.trim();

                // Insert before the "Add new" option
                this.insertBefore(
                  option,
                  this.options[this.options.length - 1]
                );

                // Select the new option
                option.selected = true;

                // Add to the categories array if not already present
                if (!categories.includes(newCategory.trim())) {
                  categories.push(newCategory.trim());
                }
              } else {
                // If the user cancels or enters an empty string, revert to the first option
                this.selectedIndex = 0;
              }
            }
          });
        }

        // Update the category filter dropdown
        if (categoryFilter) {
          // Save the current value
          const currentValue = categoryFilter.value;

          // Clear existing options except the first one
          while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
          }

          // Add the categories as options
          categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
          });

          // Restore the selected value if it exists in the new options
          if (currentValue) {
            for (let i = 0; i < categoryFilter.options.length; i++) {
              if (categoryFilter.options[i].value === currentValue) {
                categoryFilter.selectedIndex = i;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error parsing categories:", error);

        // In case of error, still populate with default categories
        populateWithDefaultCategories();
      }
    } else {
      console.error(
        "Error loading categories:",
        xhr.statusText
      );

      // In case of error, still populate with default categories
      populateWithDefaultCategories();
    }
  };

  xhr.onerror = () => {
    console.error("Network error while loading categories");

    // In case of network error, still populate with default categories
    populateWithDefaultCategories();
  };

  xhr.send();
}

// Helper function to populate categories with defaults when API fails
function populateWithDefaultCategories() {
  const defaultCategories = [
    "Technology",
    "Fashion",
    "Health",
    "Food",
    "Travel",
    "Lifestyle",
  ];

  categories = defaultCategories;

  const categoryInput = document.getElementById("category");
  const categoryFilter = document.querySelector(
    ".blog-filter select:nth-child(1)"
  );

  if (categoryInput) {
    // Clear existing options except the first one
    while (categoryInput.options.length > 1) {
      categoryInput.remove(1);
    }

    // Add the default categories
    defaultCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryInput.appendChild(option);
    });

    // Add the "new category" option
    const newOption = document.createElement("option");
    newOption.value = "new";
    newOption.textContent = "+ Add a new category";
    categoryInput.appendChild(newOption);
  }

  if (categoryFilter) {
    // Clear existing options except the first one
    while (categoryFilter.options.length > 1) {
      categoryFilter.remove(1);
    }

    // Add the default categories
    defaultCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }
}

// Load tags
function loadTags() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/tags", true);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        tags = JSON.parse(xhr.responseText);

        // You could initialize a tags plugin here if needed
      } catch (error) {
        console.error("Error parsing tags:", error);
      }
    }
  };

  xhr.send();
}

// Search blogs
function searchBlogs(query) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/blog/search?q=${encodeURIComponent(query)}`, true);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        if (response.blogs) {
          blogs = response.blogs;
        } else {
          blogs = Array.isArray(response) ? response : [];
        }

        renderBlogTable(blogs);
        updateBlogStats();
      } catch (error) {
        console.error("Error parsing search results:", error);
        showAlert("Error during search", "error");
      }
    } else {
      console.error("Error during search:", xhr.statusText);
      showAlert("Error during search", "error");
    }
  };

  xhr.send();
}

// Display blogs in the table
function renderBlogTable(blogs) {
  const blogTableBody = document.getElementById("blogTableBody");
  if (!blogTableBody) return;

  blogTableBody.innerHTML = "";

  if (!blogs || blogs.length === 0) {
    blogTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No blogs found</td>
      </tr>
    `;
    return;
  }

  blogs.forEach((blog, index) => {
    const date = new Date(blog.createdAt).toLocaleDateString();
    const commentsCount = blog.comments ? blog.comments.length : 0;
    const isDraft = blog.status === "draft";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="align-middle">${index + 1}</td>
      <td class="align-middle">
        <img src="/${blog.mainImageBlog.replace(/\\\\/g, "/")}" alt="${blog.title}" class="preview-image" style="width: 50px; height: 50px;""
          onerror="this.src='../../assets/images/blog/img1.png'; this.onerror=null;">
      </td>
      <td class="align-middle">
        ${blog.title}
        ${isDraft ? '<span class="badge bg-warning ms-2">Draft</span>' : ""}
      </td>
      <td class="align-middle">
        <span class="badge bg-${getCategoryColor(blog.category)}">${blog.category || "Uncategorized"}</span>
      </td>
      <td class="align-middle">${date}</td>
      <td class="align-middle"><span class="badge bg-secondary">${commentsCount}</span></td>
      <td class="blog-actions text-center align-middle">
        <div class="d-flex justify-content-center">
          <a href="/blog/${blog._id}" class="btn btn-sm btn-outline-primary me-1" target="_blank">
            <i class="bi bi-eye"></i>
          </a>
          <button class="btn btn-sm btn-outline-secondary me-1 edit-blog" data-id="${blog._id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-blog" data-id="${blog._id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    blogTableBody.appendChild(row);
  });

  // Add event listeners for edit and delete buttons
  addTableEventListeners();
}

// Update blog statistics
function updateBlogStats() {
  // Total published articles (first stat card)
  const publishedBlogs = blogs.filter((blog) => blog.status === "published");
  const totalPublished = publishedBlogs.length;
  const viewsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(1) .stat-info h3"
  );
  if (viewsElement) {
    viewsElement.textContent = totalPublished;
  }

  // Total views (second stat card)
  // Views are already calculated server-side and stored in the 'views' property of each blog
  // We just sum them here
  const totalViews = blogs.reduce((total, blog) => {
    return total + (blog.views || 0);
  }, 0);
  const viewsStatsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(2) .stat-info h3"
  );
  if (viewsStatsElement) {
    viewsStatsElement.textContent =
      totalViews > 1000 ? (totalViews / 1000).toFixed(1) + "K" : totalViews;
  }

  // Total comments (third stat card)
  const totalComments = blogs.reduce((total, blog) => {
    return total + (blog.comments ? blog.comments.length : 0);
  }, 0);
  const commentsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(3) .stat-info h3"
  );
  if (commentsElement) {
    commentsElement.textContent = totalComments;
  }

  // Draft blogs (fourth stat card)
  const draftBlogs = blogs.filter((blog) => blog.status === "draft");
  const draftBlogsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(4) .stat-info h3"
  );
  if (draftBlogsElement) {
    draftBlogsElement.textContent = draftBlogs.length;
  }
}

// Add event listeners for table buttons
function addTableEventListeners() {
  // Edit buttons
  document.querySelectorAll(".edit-blog").forEach((button) => {
    button.addEventListener("click", function () {
      const blogId = this.getAttribute("data-id");
      editBlog(blogId);
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-blog").forEach((button) => {
    button.addEventListener("click", function () {
      const blogId = this.getAttribute("data-id");
      deleteBlog(blogId);
    });
  });
}

// Edit a blog
function editBlog(blogId) {
  currentBlogId = blogId;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/blog/${blogId}?context=edit`, true); // Added ?context=edit

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const blog = JSON.parse(xhr.responseText);

        // Show the form
        const formContainer = document.getElementById("blogFormContainer");
        if (formContainer) {
          formContainer.classList.add("active");
          formContainer.style.display = "block";
        }

        // Update form title
        const formTitle = document.getElementById("formTitle");
        if (formTitle) {
          formTitle.textContent = "Edit Article";
        }

        // Fill the form with blog data
        document.getElementById("blogId").value = blog._id;
        document.getElementById("title").value = blog.title || "";
        document.getElementById("description").value = blog.description || "";
        document.getElementById("content").value = blog.content || "";

        // Select the category
        const categorySelect = document.getElementById("category");
        if (categorySelect) {
          for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value === blog.category) {
              categorySelect.selectedIndex = i;
              break;
            }
          }
        }

        // Select the status
        const statusSelect = document.getElementById("status");
        if (statusSelect) {
          for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].value === blog.status) {
              statusSelect.selectedIndex = i;
              break;
            }
          }
        }

        // Fill tags
        const tagsInput = document.getElementById("tags");
        if (tagsInput && blog.tags) {
          tagsInput.value = blog.tags.join(", ");
        }

        // Show main image
        const mainImagePreview = document.getElementById("mainImagePreview");
        if (mainImagePreview && blog.mainImageBlog) {
          mainImagePreview.src = blog.mainImageBlog;
        }

        // Show additional images
        const otherImagesPreview =
          document.getElementById("otherImagesPreview");
        if (
          otherImagesPreview &&
          blog.otherImagesBlog &&
          blog.otherImagesBlog.length > 0
        ) {
          otherImagesPreview.innerHTML = "";

          blog.otherImagesBlog.forEach((imgPath) => {
            const imgWrapper = document.createElement("div");
            imgWrapper.className = "border rounded p-1 bg-light";

            const img = document.createElement("img");
            img.src = imgPath;
            img.className = "img-fluid";
            img.style.maxHeight = "80px";

            imgWrapper.appendChild(img);
            otherImagesPreview.appendChild(imgWrapper);
          });
        }
      } catch (error) {
        console.error("Error parsing blog:", error);
        showAlert("Error loading blog", "error");
      }
    } else {
      console.error("Error loading blog:", xhr.statusText);
      showAlert("Error loading blog", "error");
    }
  };

  xhr.send();
}

// Delete a blog
function deleteBlog(blogId) {
  // Ask for confirmation
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", `/blog/delete/${blogId}`, true);

        // Add authentication token
        const token = localStorage.getItem("token");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Remove the blog from the list
            blogs = blogs.filter((blog) => blog._id !== blogId);

            // Update the display
            renderBlogTable(blogs);
            updateBlogStats();

            // Show success message
            showAlert("Blog deleted successfully", "success");
          } else {
            console.error(
              "Error deleting blog:",
              xhr.statusText
            );
            showAlert("Error deleting blog", "error");
          }
        };

        xhr.onerror = () => {
          console.error("Network error while deleting blog");
          showAlert("Network error while deleting blog", "error");
        };

        xhr.send();
      }
    });
  } else {
    console.error("SweetAlert2 is not loaded!");
    alert("Please include SweetAlert2 library for this feature.");
  }
}

// Handle blog form submission
function handleBlogSubmit(event) {
  event.preventDefault();

  // Get the form data
  const formData = new FormData(event.target);

  // Log the form data for debugging
  console.log("Form data being submitted:");
  for (const [key, value] of formData.entries()) {
    console.log(
      `${key}: ${value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value}`
    );
  }

  // Get the blog ID for updates
  const blogId = document.getElementById("blogId").value;
  const isUpdate = blogId !== "";

  // Handle tags (convert string to array)
  const tagsInput = document.getElementById("tags");
  if (tagsInput) {
    const tagsValue = tagsInput.value;
    if (tagsValue) {
      // Remove existing tags from FormData
      formData.delete("tags");

      // Add each tag individually
      const tagsArray = tagsValue
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      tagsArray.forEach((tag) => {
        formData.append("tags", tag);
      });
    }
  }

  // Get the authentication token
  const token = localStorage.getItem("token");

  // Create the XHR request
  const xhr = new XMLHttpRequest();

  if (isUpdate) {
    xhr.open("PUT", `/blog/update/${blogId}`, true);
  } else {
    xhr.open("POST", "/blog/create", true);
  }

  // Add authentication token if available
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);

        // Close the form
        const formContainer = document.getElementById("blogFormContainer");
        if (formContainer) {
          formContainer.classList.remove("active");
          formContainer.style.display = "none";
        }

        // Reset the form
        resetBlogForm();

        // Reload blogs and categories
        loadAllBlogs();
        loadCategories(); // Reload categories to include any new ones

        // Show success message
        showAlert(
          isUpdate ? "Blog updated successfully" : "Blog created successfully",
          "success"
        );
      } catch (error) {
        console.error("Error parsing response:", error);
        showAlert("Error submitting form", "error");
      }
    } else {
      // Log the full error response
      console.error(
        "Error submitting form:",
        xhr.statusText
      );
      console.error("Response text:", xhr.responseText);
      showAlert("Error submitting form", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Network error while submitting form");
    showAlert("Network error while submitting form", "error");
  };

  xhr.send(formData);
}

// Reset blog form
function resetBlogForm() {
  currentBlogId = null;

  const form = document.getElementById("blogForm");
  if (form) {
    form.reset();

    // Reset blog ID
    const blogIdInput = document.getElementById("blogId");
    if (blogIdInput) {
      blogIdInput.value = "";
    }

    // Reset form title
    const formTitle = document.getElementById("formTitle");
    if (formTitle) {
      formTitle.textContent = "Add a new article";
    }

    // Reset image previews
    const mainImagePreview = document.getElementById("mainImagePreview");
    if (mainImagePreview) {
      mainImagePreview.src = "../../assets/images/placeholder.jpg";
    }

    const otherImagesPreview = document.getElementById("otherImagesPreview");
    if (otherImagesPreview) {
      otherImagesPreview.innerHTML = "";
    }
  }
}

// Show an alert
function showAlert(message, type) {
  // Check if Swal is defined
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: type === "success" ? "Success!" : "Error!",
      text: message,
      icon: type,
      confirmButtonText: "OK",
    });
  } else {
    console.error(
      "Swal is not defined. Make sure SweetAlert2 is properly imported."
    );
    alert(message); // Fallback to a basic alert
  }
}

// Get category color
function getCategoryColor(category) {
  const categoryColors = {
    Technology: "primary",
    Fashion: "success",
    Lifestyle: "info",
    Food: "warning",
    Travel: "danger",
    Health: "secondary",
  };

  return categoryColors[category] || "primary";
}