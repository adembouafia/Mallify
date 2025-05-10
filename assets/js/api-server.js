const API_URL = "http://localhost:3000"

function getFilteredProducts(filters) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.subcategory) queryParams.append("subcategory", filters.subcategory);
    if (filters.name) queryParams.append("name", filters.name);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.minRating) queryParams.append("minRating", filters.minRating);
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
    if (filters.sort) queryParams.append("sort", filters.sort);
    if (filters.page) queryParams.append("page", filters.page);
    if (filters.limit) queryParams.append("limit", filters.limit);
    if (filters.shop) queryParams.append("shop", filters.shop); // Add shop parameter
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `http://localhost:3000/product/filter?${queryParams.toString()}`, true);
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          console.error("Error parsing filtered products data:", error);
          reject(error);
        }
      } else {
        console.error("Failed to fetch filtered products:", xhr.status);
        reject(new Error("Failed to load filtered products"));
      }
    };
    
    xhr.onerror = () => {
      console.error("Network error occurred while fetching filtered products");
      reject(new Error("Network error"));
    };
    
    xhr.send();
  });
}