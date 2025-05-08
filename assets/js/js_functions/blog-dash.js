// Variables globales
let currentBlogId = null;
let blogs = [];
let categories = [];
let tags = [];
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10;

// Fonction pour initialiser la page
document.addEventListener("DOMContentLoaded", () => {
  // Charger les blogs
  loadAllBlogs();

  // Charger les catégories et tags
  loadCategories();
  loadTags();

  // Initialiser les écouteurs d'événements
  initEventListeners();

  // Initialiser la pagination
  initPagination();
});

// Initialiser les écouteurs d'événements
function initEventListeners() {
  // Formulaire d'ajout/modification de blog
  const blogForm = document.getElementById("blogForm");
  if (blogForm) {
    blogForm.addEventListener("submit", handleBlogSubmit);
  }

  // Bouton d'ajout de blog
  const addBlogBtn = document.getElementById("addBlogBtn");
  if (addBlogBtn) {
    addBlogBtn.addEventListener("click", () => {
      // Afficher le formulaire
      const formContainer = document.getElementById("blogFormContainer");
      if (formContainer) {
        formContainer.classList.add("active");
        formContainer.style.display = "block";
      }
      resetBlogForm();
    });
  }

  // Bouton de fermeture du formulaire
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

  // Bouton d'annulation du formulaire
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

  // Prévisualisation de l'image principale
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

  // Prévisualisation des images supplémentaires
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

  // Recherche de blogs
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

  // Filtres de catégorie et statut
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

  // Ajouter un écouteur d'événement pour le clic sur la carte des brouillons
  const draftStatsCard = document.querySelector(
    ".blog-stats .stat-card:nth-child(3)"
  ); // Corrected selector for the 3rd stat card
  if (draftStatsCard) {
    draftStatsCard.style.cursor = "pointer";
    draftStatsCard.title = "Cliquez pour voir les brouillons";

    draftStatsCard.addEventListener("click", () => {
      filterBlogs(null, "draft");

      // Mettre à jour le filtre de statut dans l'interface
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

// Initialiser la pagination
function initPagination() {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  // Ajouter des écouteurs d'événements aux boutons de pagination
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const pageText = this.textContent.trim();

      if (pageText === "Précédent") {
        if (currentPage > 1) {
          loadBlogs(currentPage - 1);
        }
      } else if (pageText === "Suivant") {
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

// Mettre à jour l'affichage de la pagination
function updatePagination() {
  const paginationContainer = document.querySelector(".pagination");
  if (!paginationContainer) return;

  // Vider la pagination actuelle
  paginationContainer.innerHTML = "";

  // Bouton "Précédent"
  const prevItem = document.createElement("li");
  prevItem.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevItem.innerHTML = `<a class="page-link" href="#" tabindex="-1" ${currentPage === 1 ? 'aria-disabled="true"' : ""}>Précédent</a>`;
  paginationContainer.appendChild(prevItem);

  // Calculer les pages à afficher
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // Pages numérotées
  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement("li");
    pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    paginationContainer.appendChild(pageItem);
  }

  // Bouton "Suivant"
  const nextItem = document.createElement("li");
  nextItem.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextItem.innerHTML = `<a class="page-link" href="#" ${currentPage === totalPages ? 'aria-disabled="true"' : ""}>Suivant</a>`;
  paginationContainer.appendChild(nextItem);

  // Réinitialiser les écouteurs d'événements
  initPagination();
}

// Filtrer les blogs par catégorie et statut
function filterBlogs(category, status) {
  console.log(`Filtering blogs - Category: ${category}, Status: ${status}`);

  // Construire la requête de filtrage
  const queryParams = [];

  if (category) {
    queryParams.push(`category=${encodeURIComponent(category)}`);
  }

  if (status) {
    queryParams.push(`status=${encodeURIComponent(status)}`);
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
  console.log(`Query string: ${queryString}`);

  // Charger les blogs filtrés
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/blog${queryString}`, true);

  // Ajouter le token d'authentification pour permettre l'accès aux brouillons
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
        console.error("Erreur lors du parsing de la réponse:", error);
        showAlert("Erreur lors du filtrage des blogs", "error");
      }
    } else {
      console.error("Erreur lors du filtrage des blogs:", xhr.statusText);
      showAlert("Erreur lors du filtrage des blogs", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Erreur réseau lors du filtrage des blogs");
    showAlert("Erreur réseau lors du filtrage des blogs", "error");
  };

  xhr.send();
}

// Charger tous les blogs (y compris les brouillons)
function loadAllBlogs() {
  console.log("Loading all blogs...");
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/blog", true);

  // Ajouter le token d'authentification
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

        // Mettre à jour les options de statut dans le filtre
        updateStatusFilterOptions();
      } catch (error) {
        console.error("Erreur lors du parsing de la réponse:", error);
        showAlert("Erreur lors du chargement des blogs", "error");
      }
    } else {
      console.error("Erreur lors du chargement des blogs:", xhr.statusText);
      showAlert("Erreur lors du chargement des blogs", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Erreur réseau lors du chargement des blogs");
    showAlert("Erreur réseau lors du chargement des blogs", "error");
  };

  xhr.send();
}

// Mettre à jour les options de statut dans le filtre
function updateStatusFilterOptions() {
  const statusFilter = document.querySelector(
    ".blog-filter select:nth-child(2)"
  );
  if (!statusFilter) return;

  // Conserver la valeur actuelle
  const currentValue = statusFilter.value;

  // Vider les options existantes sauf la première (placeholder)
  while (statusFilter.options.length > 1) {
    statusFilter.remove(1);
  }

  // Ajouter les options de statut
  const statuses = [
    { value: "published", text: "Publié" },
    { value: "draft", text: "Brouillon" },
  ];

  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.value;
    option.textContent = status.text;
    statusFilter.appendChild(option);
  });

  // Restaurer la valeur sélectionnée si elle existe
  if (currentValue) {
    for (let i = 0; i < statusFilter.options.length; i++) {
      if (statusFilter.options[i].value === currentValue) {
        statusFilter.selectedIndex = i;
        break;
      }
    }
  }
}

// Charger les blogs avec pagination
function loadBlogs(page = 1) {
  currentPage = page;

  // Construire la requête avec pagination
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
        console.error("Erreur lors du parsing de la réponse:", error);
        showAlert("Erreur lors du chargement des blogs", "error");
      }
    } else {
      console.error("Erreur lors du chargement des blogs:", xhr.statusText);
      showAlert("Erreur lors du chargement des blogs", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Erreur réseau lors du chargement des blogs");
    showAlert("Erreur réseau lors du chargement des blogs", "error");
  };

  xhr.send();
}

// Charger les catégories
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
          newOption.textContent = "+ Ajouter une nouvelle catégorie";
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
                "Entrez le nom de la nouvelle catégorie:"
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
        console.error("Erreur lors du parsing des catégories:", error);

        // In case of error, still populate with default categories
        populateWithDefaultCategories();
      }
    } else {
      console.error(
        "Erreur lors du chargement des catégories:",
        xhr.statusText
      );

      // In case of error, still populate with default categories
      populateWithDefaultCategories();
    }
  };

  xhr.onerror = () => {
    console.error("Erreur réseau lors du chargement des catégories");

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
    newOption.textContent = "+ Ajouter une nouvelle catégorie";
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

// Charger les tags
function loadTags() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/tags", true);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        tags = JSON.parse(xhr.responseText);

        // Vous pourriez initialiser un plugin de tags ici si nécessaire
      } catch (error) {
        console.error("Erreur lors du parsing des tags:", error);
      }
    }
  };

  xhr.send();
}

// Rechercher des blogs
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
        console.error("Erreur lors du parsing de la recherche:", error);
        showAlert("Erreur lors de la recherche", "error");
      }
    } else {
      console.error("Erreur lors de la recherche:", xhr.statusText);
      showAlert("Erreur lors de la recherche", "error");
    }
  };

  xhr.send();
}

// Afficher les blogs dans le tableau
function renderBlogTable(blogs) {
  const blogTableBody = document.getElementById("blogTableBody");
  if (!blogTableBody) return;

  blogTableBody.innerHTML = "";

  if (!blogs || blogs.length === 0) {
    blogTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Aucun blog trouvé</td>
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
        <img src="${blog.mainImageBlog}" alt="${blog.title}" class="preview-image" 
          onerror="this.src='../../assets/images/blog/img1.png'; this.onerror=null;">
      </td>
      <td class="align-middle">
        ${blog.title}
        ${isDraft ? '<span class="badge bg-warning ms-2">Brouillon</span>' : ""}
      </td>
      <td class="align-middle">
        <span class="badge bg-${getCategoryColor(blog.category)}">${blog.category || "Non catégorisé"}</span>
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

  // Ajouter les écouteurs d'événements pour les boutons d'édition et de suppression
  addTableEventListeners();
}

// Mettre à jour les statistiques des blogs
function updateBlogStats() {
  // Total des vues (première carte stat)
  const totalViews = blogs.reduce((total, blog) => {
    return total + (blog.views || 0);
  }, 0);
  const viewsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(1) .stat-info h3"
  );
  if (viewsElement) {
    viewsElement.textContent =
      totalViews > 1000 ? (totalViews / 1000).toFixed(1) + "K" : totalViews;
  }

  // Total des commentaires (deuxième carte stat)
  const totalComments = blogs.reduce((total, blog) => {
    return total + (blog.comments ? blog.comments.length : 0);
  }, 0);
  const commentsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(2) .stat-info h3"
  );
  if (commentsElement) {
    commentsElement.textContent = totalComments;
  }

  // Blogs en brouillon (troisième carte stat)
  const draftBlogs = blogs.filter((blog) => blog.status === "draft");
  const draftBlogsElement = document.querySelector(
    ".blog-stats .stat-card:nth-child(3) .stat-info h3"
  );
  if (draftBlogsElement) {
    draftBlogsElement.textContent = draftBlogs.length;
  }
}

// Ajouter les écouteurs d'événements pour les boutons du tableau
function addTableEventListeners() {
  // Boutons d'édition
  document.querySelectorAll(".edit-blog").forEach((button) => {
    button.addEventListener("click", function () {
      const blogId = this.getAttribute("data-id");
      editBlog(blogId);
    });
  });

  // Boutons de suppression
  document.querySelectorAll(".delete-blog").forEach((button) => {
    button.addEventListener("click", function () {
      const blogId = this.getAttribute("data-id");
      deleteBlog(blogId);
    });
  });
}

// Éditer un blog
function editBlog(blogId) {
  currentBlogId = blogId;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `/blog/${blogId}`, true);

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const blog = JSON.parse(xhr.responseText);

        // Afficher le formulaire
        const formContainer = document.getElementById("blogFormContainer");
        if (formContainer) {
          formContainer.classList.add("active");
          formContainer.style.display = "block";
        }

        // Mettre à jour le titre du formulaire
        const formTitle = document.getElementById("formTitle");
        if (formTitle) {
          formTitle.textContent = "Modifier un article";
        }

        // Remplir le formulaire avec les données du blog
        document.getElementById("blogId").value = blog._id;
        document.getElementById("title").value = blog.title || "";
        document.getElementById("description").value = blog.description || "";
        document.getElementById("content").value = blog.content || "";

        // Sélectionner la catégorie
        const categorySelect = document.getElementById("category");
        if (categorySelect) {
          for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value === blog.category) {
              categorySelect.selectedIndex = i;
              break;
            }
          }
        }

        // Sélectionner le statut
        const statusSelect = document.getElementById("status");
        if (statusSelect) {
          for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].value === blog.status) {
              statusSelect.selectedIndex = i;
              break;
            }
          }
        }

        // Remplir les tags
        const tagsInput = document.getElementById("tags");
        if (tagsInput && blog.tags) {
          tagsInput.value = blog.tags.join(", ");
        }

        // Afficher l'image principale
        const mainImagePreview = document.getElementById("mainImagePreview");
        if (mainImagePreview && blog.mainImageBlog) {
          mainImagePreview.src = blog.mainImageBlog;
        }

        // Afficher les images supplémentaires
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
        console.error("Erreur lors du parsing du blog:", error);
        showAlert("Erreur lors du chargement du blog", "error");
      }
    } else {
      console.error("Erreur lors du chargement du blog:", xhr.statusText);
      showAlert("Erreur lors du chargement du blog", "error");
    }
  };

  xhr.send();
}

// Supprimer un blog
function deleteBlog(blogId) {
  // Demander confirmation
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Cette action ne peut pas être annulée !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        const xhr = new XMLHttpRequest();
        xhr.open("DELETE", `/blog/delete/${blogId}`, true);

        // Ajouter le token d'authentification
        const token = localStorage.getItem("token");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Supprimer le blog de la liste
            blogs = blogs.filter((blog) => blog._id !== blogId);

            // Mettre à jour l'affichage
            renderBlogTable(blogs);
            updateBlogStats();

            // Afficher un message de succès
            showAlert("Blog supprimé avec succès", "success");
          } else {
            console.error(
              "Erreur lors de la suppression du blog:",
              xhr.statusText
            );
            showAlert("Erreur lors de la suppression du blog", "error");
          }
        };

        xhr.onerror = () => {
          console.error("Erreur réseau lors de la suppression du blog");
          showAlert("Erreur réseau lors de la suppression du blog", "error");
        };

        xhr.send();
      }
    });
  } else {
    console.error("SweetAlert2 is not loaded!");
    alert("Please include SweetAlert2 library for this feature.");
  }
}

// Gérer la soumission du formulaire de blog
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
          isUpdate ? "Blog mis à jour avec succès" : "Blog créé avec succès",
          "success"
        );
      } catch (error) {
        console.error("Erreur lors du parsing de la réponse:", error);
        showAlert("Erreur lors de la soumission du formulaire", "error");
      }
    } else {
      // Log the full error response
      console.error(
        "Erreur lors de la soumission du formulaire:",
        xhr.statusText
      );
      console.error("Response text:", xhr.responseText);
      showAlert("Erreur lors de la soumission du formulaire", "error");
    }
  };

  xhr.onerror = () => {
    console.error("Erreur réseau lors de la soumission du formulaire");
    showAlert("Erreur réseau lors de la soumission du formulaire", "error");
  };

  xhr.send(formData);
}

// Réinitialiser le formulaire de blog
function resetBlogForm() {
  currentBlogId = null;

  const form = document.getElementById("blogForm");
  if (form) {
    form.reset();

    // Réinitialiser l'ID du blog
    const blogIdInput = document.getElementById("blogId");
    if (blogIdInput) {
      blogIdInput.value = "";
    }

    // Réinitialiser le titre du formulaire
    const formTitle = document.getElementById("formTitle");
    if (formTitle) {
      formTitle.textContent = "Ajouter un nouvel article";
    }

    // Réinitialiser les aperçus d'images
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

// Afficher une alerte
function showAlert(message, type) {
  // Check if Swal is defined
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: type === "success" ? "Succès !" : "Erreur !",
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

// Obtenir la couleur de la catégorie
function getCategoryColor(category) {
  const categoryColors = {
    Technologie: "primary",
    Technology: "primary",
    Mode: "success",
    Fashion: "success",
    Lifestyle: "info",
    "Style de vie": "info",
    Alimentation: "warning",
    Food: "warning",
    Voyage: "danger",
    Travel: "danger",
    Santé: "secondary",
    Health: "secondary",
  };

  return categoryColors[category] || "primary";
}
