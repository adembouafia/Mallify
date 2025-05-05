document.addEventListener("DOMContentLoaded", () => {


  function isUserLoggedIn() {
    return !!getAuthToken()
  }

  function getAuthToken() {
    return localStorage.getItem("token")
  }

  function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  function getRatingStars(rating) {
    let starsHtml = ""
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        starsHtml += '<i class="bi bi-star-fill text-warning"></i>'
      } else {
        starsHtml += '<i class="bi bi-star text-secondary"></i>'
      }
    }
    return starsHtml
  }  

  // Show alert message
  function showAlert(container, type, message) {
    const alertDiv = document.createElement("div")
    alertDiv.className = `alert alert-${type}`
    alertDiv.textContent = message

    // Insert alert at the top of the container
    if (container.firstChild) {
      container.insertBefore(alertDiv, container.firstChild)
    } else {
      container.appendChild(alertDiv)
    }

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      alertDiv.remove()
    }, 5000)
  }

  // Extract product ID from URL query parameters
  function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)

    const productId = urlParams.get("id")

    console.log("Extracted product ID from URL:", productId)

    return productId
  }

  const reviewsTab = document.getElementById("reviews-tab")
  const productIdElement = document.getElementById("product-id")
  const vendorReviewsContainer = document.getElementById("vendor-reviews-container")
  const vendorReviewStats = document.getElementById("vendor-review-stats")

  if (reviewsTab && vendorReviewsContainer) {
    console.log("Reviews tab and container found, initializing reviews functionality")
    reviewsTab.addEventListener("click", () => {
      console.log("Reviews tab clicked, loading reviews")
      loadVendorReviews()
    })
    if (reviewsTab.classList.contains("active")) {
      console.log("Reviews tab is active on page load, loading reviews")
      loadVendorReviews()
    }
    function loadVendorReviews() {
      const productId = getProductIdFromUrl()

      // If we found a product ID, update the hidden input
      if (productId && productIdElement) {
        productIdElement.value = productId
        console.log("Updated hidden product ID input with:", productId)
      }

      if (!productId) {
        vendorReviewsContainer.innerHTML =
          '<div class="alert alert-warning">Product ID not found. Please make sure you\'re viewing a specific product.</div>'
        console.error("No product ID found in URL")
        return
      }

      vendorReviewsContainer.innerHTML = '<div class="text-center py-4">Loading reviews...</div>'

      const xhr = new XMLHttpRequest()
      const reviewsUrl = `/product/${productId}/reviews`
      console.log("Fetching reviews from:", reviewsUrl)
      xhr.open("GET", reviewsUrl, true)

      // Add auth token if user is logged in
      if (isUserLoggedIn()) {
        xhr.setRequestHeader("Authorization", `Bearer ${getAuthToken()}`)
        console.log("Added auth token to request")
      }

      xhr.onload = () => {
        console.log("Reviews API response received:", xhr.status, xhr.statusText)

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            console.log("Parsed API response:", response)

            if (response.status === "success") {
              displayVendorReviews(response.data.reviews)
              updateVendorReviewStats(response.data.averageRating, response.data.reviewCount)
              console.log("Successfully displayed reviews")
            } else {
              vendorReviewsContainer.innerHTML =
                '<div class="alert alert-danger">Failed to load reviews: ' +
                (response.message || "Unknown error") +
                "</div>"
              console.error("API returned error:", response.message)
            }
          } catch (error) {
            vendorReviewsContainer.innerHTML = '<div class="alert alert-danger">Error parsing review data</div>'
            console.error("Error parsing review data:", error, "Raw response:", xhr.responseText)
          }
        } else {
          vendorReviewsContainer.innerHTML =
            '<div class="alert alert-danger">Error loading reviews: ' + xhr.status + " " + xhr.statusText + "</div>"
          console.error("API request failed:", xhr.status, xhr.statusText)
        }
      }

      xhr.onerror = () => {
        vendorReviewsContainer.innerHTML = '<div class="alert alert-danger">Network error while loading reviews</div>'
        console.error("Network error while loading reviews")
      }

      xhr.send()
    }

    function displayVendorReviews(reviews) {
      if (!reviews || reviews.length === 0) {
        vendorReviewsContainer.innerHTML = '<div class="alert alert-info">No reviews yet for this product</div>'
        return
      }

      console.log("Displaying", reviews.length, "reviews")

      let html = `
        <div class="mb-4">
          <h3 class="h5">Reviews (${reviews.length})</h3>
        </div>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
      `

      reviews.forEach((review) => {
        const date = formatDate(review.createdAt)

        html += `
          <tr>
            <td>${review.clientName}</td>
            <td>${getRatingStars(review.rating)}</td>
            <td>${review.comment}</td>
            <td>${date}</td>
            <td>
              <button 
                class="btn btn-sm btn-danger delete-review" 
                data-review-id="${review._id}" 
                data-product-id="${getProductIdFromUrl()}"
              >
                Delete
              </button>
            </td>
          </tr>
        `
      })

      html += `
            </tbody>
          </table>
        </div>
      `

      vendorReviewsContainer.innerHTML = html

      const deleteButtons = vendorReviewsContainer.querySelectorAll(".delete-review")
      console.log("Found", deleteButtons.length, "delete buttons")

      deleteButtons.forEach((button) => {
        // Log the data attributes for debugging
        console.log("Delete button data:", {
          reviewId: button.dataset.reviewId,
          productId: button.dataset.productId,
        })

        button.addEventListener("click", handleDeleteReview)
      })
    }

    // Update review statistics in the vendor dashboard
    function updateVendorReviewStats(avgRating, reviewCount) {
      if (!vendorReviewStats) {
        console.warn("Vendor review stats element not found")
        return
      }

      const displayRating = avgRating ? avgRating.toFixed(1) : "0.0"
      console.log("Updating review stats:", displayRating, "average from", reviewCount, "reviews")

      vendorReviewStats.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <div class="fw-bold">${displayRating}</div>
          <div class="rating">
            ${getRatingStars(Math.round(avgRating || 0))}
          </div>
          <div class="text-muted">(${reviewCount || 0} ${reviewCount === 1 ? "review" : "reviews"})</div>
        </div>
      `
    }

    // Handle delete review button click
    function handleDeleteReview(event) {
      const reviewId = event.target.dataset.reviewId
      const productId = event.target.dataset.productId

      if (!confirm("Are you sure you want to delete this review?")) {
        return
      }

      // Disable the button
      event.target.disabled = true
      event.target.textContent = "Deleting..."

      // Make XHR request to delete review
      const xhr = new XMLHttpRequest()
      xhr.open("DELETE", `/product/${productId}/review/${reviewId}`, true)
      xhr.setRequestHeader("Authorization", `Bearer ${getAuthToken()}`)

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)

            if (response.status === "success") {
              // Reload reviews to update the list
              loadVendorReviews()
              showAlert(vendorReviewsContainer.parentNode, "success", "Review deleted successfully")
            } else {
              showAlert(vendorReviewsContainer.parentNode, "danger", response.message || "Failed to delete review")
              // Re-enable the button
              event.target.disabled = false
              event.target.textContent = "Delete"
            }
          } catch (error) {
            showAlert(vendorReviewsContainer.parentNode, "danger", "Error parsing response")
            // Re-enable the button
            event.target.disabled = false
            event.target.textContent = "Delete"
          }
        } else {
          showAlert(vendorReviewsContainer.parentNode, "danger", "Error deleting review")
          // Re-enable the button
          event.target.disabled = false
          event.target.textContent = "Delete"
        }
      }

      xhr.onerror = () => {
        showAlert(vendorReviewsContainer.parentNode, "danger", "Network error while deleting review")
        // Re-enable the button
        event.target.disabled = false
        event.target.textContent = "Delete"
      }

      xhr.send()
    }
  }

})
