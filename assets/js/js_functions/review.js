document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const reviewForm = document.getElementById("review-form");
    const ratingStars = document.querySelectorAll(".rating-stars i");
    const ratingInput = document.getElementById("rating-input");
    const reviewTitle = document.getElementById("review-title");
    const reviewComment = document.getElementById("review-comment");
    const submitReviewBtn = document.getElementById("submit-review");
    const reviewStats = document.getElementById("review-stats");
    const reviewsContainer = document.getElementById("reviews-container");
    const productId = document.getElementById("product-id").value;
  
    let currentRating = 0;
  
    // Initialize star rating system
    function initStarRating() {
      // Set up event listeners for stars
      ratingStars.forEach((star, index) => {
        // Hover effect
        star.addEventListener("mouseenter", () => {
          // Fill this star and all previous stars
          for (let i = 0; i <= index; i++) {
            ratingStars[i].classList.remove("text-gray-300");
            ratingStars[i].classList.add("text-warning-600");
          }
        });
  
        // Mouse leave effect
        star.addEventListener("mouseleave", () => {
          // If no rating is selected, clear all stars
          if (currentRating === 0) {
            ratingStars.forEach((s) => {
              s.classList.remove("text-warning-600");
              s.classList.add("text-gray-300");
            });
          } else {
            // Otherwise, reset to current rating
            ratingStars.forEach((s, i) => {
              if (i < currentRating) {
                s.classList.remove("text-gray-300");
                s.classList.add("text-warning-600");
              } else {
                s.classList.remove("text-warning-600");
                s.classList.add("text-gray-300");
              }
            });
          }
        });
  
        // Click to set rating
        star.addEventListener("click", () => {
          currentRating = index + 1;
          ratingInput.value = currentRating;
  
          // Update visual state
          ratingStars.forEach((s, i) => {
            if (i < currentRating) {
              s.classList.remove("text-gray-300");
              s.classList.add("text-warning-600");
            } else {
              s.classList.remove("text-warning-600");
              s.classList.add("text-gray-300");
            }
          });
        });
      });
    }
  
    // Load reviews for a product
    function loadReviews() {
      if (!productId) return;
  
      // Show loading state
      reviewsContainer.innerHTML = '<div class="text-center py-24">Loading reviews...</div>';
  
      // Make XHR request to get reviews
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `/product/${productId}/reviews`, true);
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
  
          if (response.status === "success") {
            displayReviews(response.data.reviews);
            updateReviewStats(response.data.averageRating, response.data.reviewCount);
  
            // Check if user has already reviewed
            checkUserReview();
          } else {
            reviewsContainer.innerHTML = '<div class="alert alert-danger">Failed to load reviews</div>';
          }
        } else {
          reviewsContainer.innerHTML = '<div class="alert alert-danger">Error loading reviews</div>';
        }
      };
  
      xhr.onerror = () => {
        reviewsContainer.innerHTML = '<div class="alert alert-danger">Network error while loading reviews</div>';
      };
  
      xhr.send();
    }
  
    // Display reviews in the container
    function displayReviews(reviews) {
      if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML =
          '<div class="text-center py-24">No reviews yet. Be the first to review this product!</div>';
        return;
      }
  
      let html = "";
  
      reviews.forEach((review) => {
        const date = new Date(review.createdAt).toLocaleDateString();
  
        html += `
          <div class="review-item border-bottom pb-16 mb-16">
            <div class="d-flex justify-content-between align-items-center mb-8">
              <div>
                <strong>${review.userName}</strong>
                <div class="text-muted small">${date}</div>
              </div>
              <div class="rating">
                ${getRatingStars(review.rating)}
              </div>
            </div>
            <h6 class="mb-8">${review.title || ""}</h6>
            <p>${review.comment}</p>
          </div>
        `;
      });
  
      reviewsContainer.innerHTML = html;
    }
  
    // Generate HTML for rating stars
    function getRatingStars(rating) {
      let starsHtml = "";
  
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          starsHtml += '<i class="ph-fill ph-star text-warning-600"></i>';
        } else {
          starsHtml += '<i class="ph-fill ph-star text-gray-300"></i>';
        }
      }
  
      return starsHtml;
    }
  
    // Update review statistics
    function updateReviewStats(avgRating, reviewCount) {
      if (!reviewStats) return;
  
      reviewStats.innerHTML = `
        <div class="d-flex align-items-center gap-8">
          <div class="fw-bold">${avgRating}</div>
          <div class="rating">
            ${getRatingStars(Math.round(avgRating))}
          </div>
          <div class="text-muted">(${reviewCount} ${reviewCount === 1 ? "review" : "reviews"})</div>
        </div>
      `;
    }
  
    // Check if the current user has already reviewed this product
    function checkUserReview() {
      // Only check if user is logged in
      if (!isUserLoggedIn()) return;
  
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `/product/${productId}/user-review`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${getAuthToken()}`);
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
  
          if (response.status === "success" && response.data.review) {
            // User has already reviewed, pre-fill the form
            const review = response.data.review;
            currentRating = review.rating;
            ratingInput.value = currentRating;
            reviewTitle.value = review.title || "";
            reviewComment.value = review.comment;
  
            // Update star display
            ratingStars.forEach((star, index) => {
              if (index < currentRating) {
                star.classList.remove("text-gray-300");
                star.classList.add("text-warning-600");
              }
            });
  
            // Change button text
            submitReviewBtn.textContent = "Update Review";
          }
        }
      };
  
      xhr.send();
    }
  
    // Submit a review
    function submitReview(event) {
      event.preventDefault();
  
      if (!isUserLoggedIn()) {
        // Redirect to login or show login modal
        alert("Please log in to submit a review");
        return;
      }
  
      if (currentRating === 0) {
        alert("Please select a rating");
        return;
      }
  
      if (!reviewComment.value.trim()) {
        alert("Please enter a comment");
        return;
      }
  
      // Disable button and show loading state
      submitReviewBtn.disabled = true;
      submitReviewBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
  
      // Prepare review data
      const reviewData = {
        rating: currentRating,
        title: reviewTitle.value.trim(),
        comment: reviewComment.value.trim(),
      };
  
      // Send review to server using XHR
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/product/${productId}/review`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${getAuthToken()}`);
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
  
          if (response.status === "success") {
            // Reload reviews to show the new one
            loadReviews();
  
            // Reset form if it's a new review
            if (submitReviewBtn.textContent !== "Update Review") {
              resetReviewForm();
            } else {
              // Just update the button text
              submitReviewBtn.disabled = false;
              submitReviewBtn.textContent = "Update Review";
            }
  
            // Show success message
            showAlert("success", "Your review has been submitted successfully!");
          } else {
            showAlert("danger", response.message || "Failed to submit review");
            submitReviewBtn.disabled = false;
            submitReviewBtn.textContent = currentRating ? "Update Review" : "Submit Review";
          }
        } else {
          showAlert("danger", "Failed to submit review");
          submitReviewBtn.disabled = false;
          submitReviewBtn.textContent = currentRating ? "Update Review" : "Submit Review";
        }
      };
  
      xhr.onerror = () => {
        showAlert("danger", "Network error while submitting review");
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = currentRating ? "Update Review" : "Submit Review";
      };
  
      xhr.send(JSON.stringify(reviewData));
    }
  
    // Reset review form
    function resetReviewForm() {
      currentRating = 0;
      ratingInput.value = "";
      reviewTitle.value = "";
      reviewComment.value = "";
  
      // Reset stars
      ratingStars.forEach((star) => {
        star.classList.remove("text-warning-600");
        star.classList.add("text-gray-300");
      });
  
      // Reset button
      submitReviewBtn.disabled = false;
      submitReviewBtn.textContent = "Submit Review";
    }
  
    // Show alert message
    function showAlert(type, message) {
      const alertDiv = document.createElement("div");
      alertDiv.className = `alert alert-${type}`;
      alertDiv.textContent = message;
  
      // Insert alert before the form
      reviewForm.parentNode.insertBefore(alertDiv, reviewForm);
  
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        alertDiv.remove();
      }, 5000);
    }
  
    // Helper function to check if user is logged in
    function isUserLoggedIn() {
      return !!getAuthToken();
    }
  
    // Helper function to get auth token from localStorage
    function getAuthToken() {
      return localStorage.getItem("token");
    }
  
    // Event listeners
    if (reviewForm) {
      reviewForm.addEventListener("submit", submitReview);
    }
  
    // Initialize star rating
    initStarRating();
    
    // Load reviews on page load
    loadReviews();
  });



  document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const reviewsTab = document.getElementById("reviews-tab")
    const reviewsContainer = document.getElementById("vendor-reviews-container")
    const reviewStats = document.getElementById("vendor-review-stats")
    const ratingFilter = document.getElementById("rating-filter")
    const sortBy = document.getElementById("sort-by")
    
    // Get product ID from hidden input or data attribute
    const productId = document.getElementById("product-id").value
    
    let reviews = []
    let filteredReviews = []
    
    // Load reviews for a product
    function loadReviews() {
      if (!productId) return
      
      // Show loading state
      reviewsContainer.innerHTML = '<div class="text-center py-24">Loading reviews...</div>'
      
      // Make XHR request to get reviews
      const xhr = new XMLHttpRequest()
      xhr.open("GET", `/product/${productId}/reviews`, true)
      xhr.setRequestHeader("Authorization", `Bearer ${getAuthToken()}`)
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          
          if (response.status === "success") {
            reviews = response.data.reviews
            filteredReviews = [...reviews]
            updateReviewStats(response.data.averageRating, response.data.reviewCount)
            applyFiltersAndSort()
          } else {
            reviewsContainer.innerHTML = '<div class="alert alert-danger">Failed to load reviews</div>'
          }
        } else {
          reviewsContainer.innerHTML = '<div class="alert alert-danger">Error loading reviews</div>'
        }
      }
      
      xhr.onerror = () => {
        reviewsContainer.innerHTML = '<div class="alert alert-danger">Network error while loading reviews</div>'
      }
      
      xhr.send()
    }
    
    // Apply filters and sort
    function applyFiltersAndSort() {
      // Apply rating filter
      const ratingValue = ratingFilter.value
      if (ratingValue !== "all") {
        filteredReviews = reviews.filter(review => review.rating === parseInt(ratingValue))
      } else {
        filteredReviews = [...reviews]
      }
      
      // Apply sorting
      const sortValue = sortBy.value
      switch (sortValue) {
        case "newest":
          filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case "oldest":
          filteredReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          break
        case "highest":
          filteredReviews.sort((a, b) => b.rating - a.rating)
          break
        case "lowest":
          filteredReviews.sort((a, b) => a.rating - b.rating)
          break
      }
      
      displayReviews(filteredReviews)
    }
    
    // Display reviews in the container
    function displayReviews(reviews) {
      if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = '<div class="text-center py-24">No reviews yet for this product.</div>'
        return
      }
      
      let html = ''
      
      reviews.forEach(review => {
        const date = new Date(review.createdAt).toLocaleDateString()
        
        html += `
          <div class="card mb-16">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div>
                <strong>${review.userName}</strong>
                <small class="text-muted ms-8">${date}</small>
              </div>
              <div class="rating">
                ${getRatingStars(review.rating)}
              </div>
            </div>
            <div class="card-body">
              ${review.title ? `<h6 class="mb-8">${review.title}</h6>` : ''}
              <p class="card-text">${review.comment}</p>
            </div>
            <div class="card-footer d-flex justify-content-end">
              <button class="btn btn-danger btn-sm delete-review" data-review-id="${review._id}">
                <i class="ph-fill ph-trash"></i> Delete
              </button>
            </div>
          </div>
        `
      })
      
      reviewsContainer.innerHTML = html
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-review').forEach(button => {
        button.addEventListener('click', function() {
          const reviewId = this.dataset.reviewId
          if (confirm('Are you sure you want to delete this review?')) {
            deleteReview(reviewId)
          }
        })
      })
    }
    
    // Generate HTML for rating stars
    function getRatingStars(rating) {
      let starsHtml = ""
      
      for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
          starsHtml += '<i class="ph-fill ph-star text-warning-600"></i>'
        } else {
          starsHtml += '<i class="ph-fill ph-star text-gray-300"></i>'
        }
      }
      
      return starsHtml
    }
    
    // Update review statistics
    function updateReviewStats(avgRating, reviewCount) {
      if (!reviewStats) return
      
      reviewStats.innerHTML = `
        <div class="fw-bold">${avgRating}</div>
        <div class="rating">
          ${getRatingStars(Math.round(avgRating))}
        </div>
        <div class="text-muted">(${reviewCount} ${reviewCount === 1 ? "review" : "reviews"})</div>
      `
    }
    
    // Delete a review
    function deleteReview(reviewId) {
      const xhr = new XMLHttpRequest()
      xhr.open("DELETE", `/product/${productId}/review/${reviewId}`, true)
      xhr.setRequestHeader("Authorization", `Bearer ${getAuthToken()}`)
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          
          if (response.status === "success") {
            // Remove the review from our arrays
            reviews = reviews.filter(review => review._id !== reviewId)
            filteredReviews = filteredReviews.filter(review => review._id !== reviewId)
            
            // Update review stats
            updateReviewStats(response.data.averageRating, response.data.reviewCount)
            
            // Re-display the reviews
            applyFiltersAndSort()
            
            // Show success message
            showAlert("success", "Review deleted successfully")
          } else {
            showAlert("danger", response.message || "Failed to delete review")
          }
        } else {
          showAlert("danger", "Error deleting review")
        }
      }
      
      xhr.onerror = () => {
        showAlert("danger", "Network error while deleting review")
      }
      
      xhr.send()
    }
    
    // Show alert message
    function showAlert(type, message) {
      const alertDiv = document.createElement("div")
      alertDiv.className = `alert alert-${type}`
      alertDiv.textContent = message
      
      // Insert alert at the top of the reviews container
      reviewsContainer.insertAdjacentElement('beforebegin', alertDiv)
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        alertDiv.remove()
      }, 5000)
    }
    
    // Helper function to get auth token from localStorage
    function getAuthToken() {
      return localStorage.getItem("token")
    }
    
    // Event listeners
    if (reviewsTab) {
      reviewsTab.addEventListener("click", () => {
        // Load reviews when the tab is clicked
        loadReviews()
      })
    }
    
    if (ratingFilter) {
      ratingFilter.addEventListener("change", applyFiltersAndSort)
    }
    
    if (sortBy) {
      sortBy.addEventListener("change", applyFiltersAndSort)
    }
    
    // If reviews tab is active on page load, load reviews
    if (document.querySelector(".tab-pane.active#reviews")) {
      loadReviews()
    }
  })