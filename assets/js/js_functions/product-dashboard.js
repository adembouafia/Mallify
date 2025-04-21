document.getElementById("addProductForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const form = e.target;
  
    // Build product object
    const product = {
      productId: form.productId.value,
      productName: form.productName.value,
      productPrice: parseFloat(form.productPrice.value),
      productCategory: form.productCategory.value,
      Availability: form.Availability.value === "true",
      Stock: parseInt(form.Stock.value, 10),
      description: form.description.value,
      mainImageFile: form.mainImage.files[0],
      otherImageFiles: Array.from(form.otherImages.files)
    };
  
    // Create a URL for the main image
    const mainImageURL = URL.createObjectURL(product.mainImageFile);
  
    // (Optional) Store or upload otherImageFiles as needed
    console.log("Other images:", product.otherImageFiles);
  
    // Create new table row
    const tbody = document.getElementById("productTableBody");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="fw-semibold">${product.productId}</td>
      <td>
        <div class="d-flex align-items-center gap-3">
          <div class="bg-light rounded">
            <img src="${mainImageURL}" alt="${product.productName}" style="width:70px; height:70px;">
          </div>
          <div>
            <a href="#!" class="text-dark fw-semibold text-decoration-none">
              ${product.productName}
            </a>
            <p class="text-muted mb-0 mt-1 small">${product.description}</p>
          </div>
        </div>
      </td>
      <td>$${product.productPrice.toFixed(2)}</td>
      <td>
        <div class="text-muted">
          <span class="fw-semibold text-dark">${product.Stock}</span><br> Item Left<br>
          <span>0 Sold</span>
        </div>
      </td>
      <td><span class="badge bg-soft-primary text-primary">${product.productCategory}</span></td>
      <td>
        <div class="d-flex align-items-center gap-1">
          <span class="badge bg-light text-warning">
            <i class="bi bi-star-fill me-1"></i> 0.0
          </span>
          <span class="text-muted small">0 Review</span>
        </div>
      </td>
      <td>
        <a href="detailsProduct.html" class="btn btn-sm bg-light text-secondary" title="View Details">
            <i class="bi bi-eye"></i>
        </a>
        <button class="btn btn-sm bg-light text-warning editProductBtn" title="Edit">
            <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm bg-light text-danger" title="Delete">
            <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
  
    // 🚀 Ici, on insère toujours en haut de la liste
    tbody.insertBefore(tr, tbody.firstElementChild);
  
    // Reset form & close modal
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
  
    // Optionally revoke the image URL later
    // URL.revokeObjectURL(mainImageURL);
  });
  