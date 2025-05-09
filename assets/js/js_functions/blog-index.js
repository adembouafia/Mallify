// Global variables
const API_BASE_URL = ""; // Adjust according to your configuration
let currentPage = 1;
let totalPages = 1;
const ITEMS_PER_PAGE = 6;

// Wait for the page to load
document.addEventListener("DOMContentLoaded", function () {
  // Load blogs at startup
  loadBlogs();

  // Load recent posts
  loadRecentPosts();
});

// Function to load blogs from the API
function loadBlogs(page = 1) {
  // Display a loading indicator
  document.querySelector(".blog-item-wrapper").innerHTML =
    '<div class="text-center py-5">Loading...</div>';

  // Create a new XHR request
  var xhr = new XMLHttpRequest();

  // Configure the request to only retrieve published blogs
  xhr.open(
    "GET",
    "/blog?page=" + page + "&limit=" + ITEMS_PER_PAGE + "&status=published",
    true
  );

  // Add authentication headers
  xhr.withCredentials = true; // Send cookies for session authentication

  // If you're using a JWT token, add it to the headers
  // Retrieve the token from localStorage or sessionStorage
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", "Bearer " + token);
  }

  // Define what happens on success
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      // Convert the response to a JavaScript object
      var response = JSON.parse(xhr.responseText);

      // Update pagination variables
      currentPage = parseInt(response.currentPage) || 1;
      totalPages = parseInt(response.totalPages) || 1;

      // Display the blogs
      displayBlogs(response.blogs || []);

      // Update pagination
      displayPagination();
    } else {
      // Handle errors
      if (xhr.status === 401) {
        // Redirect to login page if not authenticated
        document.querySelector(".blog-item-wrapper").innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        You must be logged in to view blogs. <a href="login.html" class="alert-link">Log in</a>
                    </div>
                `;
      } else {
        document.querySelector(".blog-item-wrapper").innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        Error loading blogs. (${xhr.status}: ${xhr.statusText})
                    </div>
                `;
      }
      console.error("Error:", xhr.statusText);
    }
  };

  // Define what happens in case of error
  xhr.onerror = function () {
    document.querySelector(".blog-item-wrapper").innerHTML =
      '<div class="alert alert-danger">Network error while loading blogs.</div>';
    console.error("Network error");
  };

  // Send the request
  xhr.send();
}

// Function to display blogs on the page
function displayBlogs(blogs) {
    // Get the blog container
    var container = document.querySelector(".blog-item-wrapper");
  
    // If no blogs are found
    if (!blogs || blogs.length === 0) {
      container.innerHTML =
        '<div class="text-center py-5">No blogs found</div>';
      return;
    }
  
    // Create HTML for all blogs
    var html = "";
  
    // Loop through all blogs
    for (var i = 0; i < blogs.length; i++) {
      var blog = blogs[i];
  
      // Format the date
      var date = new Date(blog.createdAt);
      var formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  
      // Create HTML for this blog
      html += `
      <div class="blog-item-wrapper mb-48"> <!-- Added margin -->
          <div class="blog-item"> 
              <a href="blog_details.html?id=${blog._id}" class="rounded-16 overflow-hidden">
                  <img src="/${blog.mainImageBlog.replace(/\\\\\\\\/g, "/")}"
                      alt="${blog.title}" class="cover-img" 
                      onerror="this.src='../../assets/images/blog/img1.png'; this.onerror=null;">
              </a>
              <div class="blog-item__content mt-24">
                  <span class="bg-main-50 text-main-600 py-4 px-24 rounded-8 mb-16">${blog.category}</span>`;
  
              // Handle tags with or without spaces
              if (blog.tags && blog.tags.length > 0) {
                html += '<div class="mb-16">';
                for (var j = 0; j < blog.tags.length; j++) {
                  var tag = blog.tags[j];
                  var words = tag.trim().split(/\s+/);
                  for (var k = 0; k < words.length; k++) {
                    var word = words[k];
                    if (word) {
                      html += `<span class="bg-primary-50 text-primary-600 py-2 px-12 rounded-4 me-8 mb-8 d-inline-block">#${word}</span>`;
                    }
                  }
                }
                html += "</div>";
              }
  
      html += `     
                  <h6 class="text-2xl mb-24">
                      <a href="blog_details.html?id=${blog._id}" class="">${blog.title}</a>
                  </h6>
                  <p class="text-gray-700 text-line-2">${blog.description}</p>
  
                  <div class="flex-align flex-wrap gap-24 pt-24 border-bottom border-gray-100">
                      <div class="flex-align flex-wrap gap-8">
                          <span class="text-lg text-main-600"><i class="ph ph-calendar-dots"></i></span>
                          <span class="text-sm text-gray-500">
                              <a href="blog_details.html?id=${blog._id}" class="text-gray-500 hover-text-main-600">${formattedDate}</a>
                          </span>
                      </div>
                      <div class="flex-align flex-wrap gap-8">
                          <span class="text-lg text-main-600"><i class="ph ph-chats-circle"></i></span>
                          <span class="text-sm text-gray-500">
                              <a href="blog_details.html?id=${blog._id}" class="text-gray-500 hover-text-main-600">
                                  ${blog.comments ? blog.comments.length : 0} Comments
                              </a>
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      `;
    }
  
    // Update the container content
    container.innerHTML = html;
}
  

// Function to display pagination
function displayPagination() {
  // Get the pagination container
  var paginationContainer = document.querySelector(".pagination");

  // If only one page, hide pagination
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  // Create HTML for pagination
  var html = `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link h-64 w-64 flex-center text-xxl rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)" onclick="changePage(${currentPage - 1})">
                <i class="ph-bold ph-arrow-left"></i>
            </a>
        </li>
    `;

  // Add page numbers
  for (var i = 1; i <= totalPages; i++) {
    html += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link h-64 w-64 flex-center text-md rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)" onclick="changePage(${i})">${i < 10 ? "0" + i : i}</a>
            </li>
        `;
  }

  html += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link h-64 w-64 flex-center text-xxl rounded-8 fw-medium text-neutral-600 border border-gray-100" href="javascript:void(0)" onclick="changePage(${currentPage + 1})">
                <i class="ph-bold ph-arrow-right"></i>
            </a>
        </li>
    `;

  // Update the container content
  paginationContainer.innerHTML = html;
}

// Function to change page
function changePage(page) {
  // Check that the page is valid
  if (page < 1 || page > totalPages || page === currentPage) {
    return;
  }

  // Update the current page
  currentPage = page;

  // Load blogs for the new page
  loadBlogs(page);

  // Scroll to the top of the page
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Load recent posts for the sidebar
function loadRecentPosts() {
  // Get the recent posts container
  var container = document.querySelector(".blog-sidebar:nth-of-type(2)");

  // If the container doesn't exist, do nothing
  if (!container) return;

  // Create a new XHR request
  var xhr = new XMLHttpRequest();

  // Configure the request
  xhr.open("GET", "/blog/recent?limit=3", true);

  // Add authentication headers
  xhr.withCredentials = true; // Send cookies for session authentication

  // If you're using a JWT token, add it to the headers
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", "Bearer " + token);
  }

  // Define what happens on success
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      // Convert the response to a JavaScript object
      var recentPosts = JSON.parse(xhr.responseText);

      // If no recent posts are found, do nothing
      if (!recentPosts || recentPosts.length === 0) return;

      // Create HTML for recent posts
      var html = `<h6 class="text-xl mb-32 pb-32 border-bottom border-gray-100">Recent Posts</h6>`;

      // Loop through all recent posts
      for (var i = 0; i < recentPosts.length; i++) {
        var post = recentPosts[i];

        // Format the date
        var date = new Date(post.createdAt);
        var formattedDate = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Create HTML for this post
        html += `
                    <div class="d-flex align-items-center flex-sm-nowrap flex-wrap gap-24 mb-16">
                        <a href="blog_details.html?id=${post._id}" class="w-100 h-100 rounded-4 overflow-hidden w-120 h-120 flex-shrink-0">
                            <img src="${post.mainImageBlog}" alt="${post.title}" class="cover-img">
                        </a>
                        <div class="flex-grow-1">
                            <h6 class="text-lg">
                                <a href="blog_details.html?id=${post._id}" class="text-line-3">${post.title}</a>
                            </h6>
                            <div class="flex-align flex-wrap gap-8">
                                <span class="text-lg text-main-600"><i class="ph ph-calendar-dots"></i></span>
                                <span class="text-sm text-gray-500">
                                    <a href="blog_details.html?id=${post._id}" class="text-gray-500 hover-text-main-600">${formattedDate}</a>
                                </span>
                            </div>
                        </div>
                    </div>
                `;
      }

      // Update the container content
      container.innerHTML = html;
    } else {
      // Handle errors silently
      console.error(
        "Error loading recent posts:",
        xhr.statusText
      );
    }
  };

  // Define what happens in case of error
  xhr.onerror = function () {
    console.error("Network error while loading recent posts");
  };

  // Send the request
  xhr.send();
}