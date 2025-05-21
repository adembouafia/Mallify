// Helper function to make XHR requests
function makeXHRRequest(url, method, headers, callback) {
  const xhr = new XMLHttpRequest();

  // Set timeout to prevent hanging requests
  xhr.timeout = 30000; // 30 seconds timeout

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          callback(null, data);
        } catch (error) {
          console.error("Failed to parse response:", error);
          callback(new Error("Failed to parse response: " + error.message));
        }
      } else {
        console.error(
          `Request failed with status ${xhr.status}: ${xhr.statusText}`
        );
        callback(
          new Error(
            `Request failed with status ${xhr.status}: ${xhr.statusText}`
          )
        );
      }
    }
  };

  // Handle network errors
  xhr.onerror = () => {
    console.error("Network error occurred");
    callback(
      new Error("Network error occurred. Please check your connection.")
    );
  };

  // Handle timeout
  xhr.ontimeout = () => {
    console.error("Request timed out");
    callback(new Error("Request timed out. Please try again."));
  };

  try {
    xhr.open(method, url, true);

    // Set headers
    if (headers) {
      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });
    }

    xhr.send();
  } catch (error) {
    console.error("Error sending request:", error);
    callback(new Error("Error sending request: " + error.message));
  }
}

// In the updateDashboardUI function, ensure all data is properly displayed
function updateDashboardUI(dashboardData) {
  console.log("Updating dashboard UI with data:", dashboardData);

  // 1. Update info boxes at the top
  updateInfoBoxes(dashboardData.metrics);

  // 2. Update best-selling products
  updateBestSellingProducts(dashboardData.bestSellingProducts);

  // 3. Update sales metrics in the footer
  updateSalesMetrics(dashboardData.metrics);

  // 4. Update sales by category table
  updateCategoryTable(dashboardData.salesByCategory);

  // 5. Update recent orders table
  updateRecentOrders(dashboardData.recentOrders);

  // 6. Update recently added products
  updateRecentProducts(dashboardData.recentProducts);

  // 7. Initialize charts
  initializeCharts(dashboardData);

  // 8. Update sidebar badges (products, orders, invoices)
  updateSidebarBadges(dashboardData.metrics);
}

// Fix the updateInfoBoxes function to display actual data
function updateInfoBoxes(metrics) {
  if (!metrics) {
    console.error("No metrics data available to update info boxes");
    return;
  }

  // Log the metrics data to verify what we're receiving
  console.log("Updating info boxes with metrics:", metrics);

  // Use a more robust approach to find info boxes by their text content
  const allInfoBoxes = document.querySelectorAll(".info-box");
  let productsBox, ordersBox, incomesBox, avgRatingBox;

  allInfoBoxes.forEach((box) => {
    const textElement = box.querySelector(".info-box-text");
    if (!textElement) return;

    const text = textElement.textContent.trim();
    const numberElement = box.querySelector(".info-box-number");

    if (!numberElement) return;

    if (text === "All Products") {
      productsBox = numberElement;
    } else if (text === "All Orders") {
      ordersBox = numberElement;
    } else if (text === "Incomes") {
      incomesBox = numberElement;
    } else if (text === "Avg. Product Rating") {
      avgRatingBox = numberElement;
    }
  });

  // Update All Products box
  if (productsBox) {
    productsBox.innerHTML = `${metrics.totalProducts || 0} <small>items</small>`;
    console.log("Updated products box with:", metrics.totalProducts);
  } else {
    console.error("Products box element not found");
  }

  // Update All Orders box
  if (ordersBox) {
    ordersBox.innerHTML = `${metrics.totalOrders || 0}`;
    console.log("Updated orders box with:", metrics.totalOrders);
  } else {
    console.error("Orders box element not found");
  }
  // Update Incomes box
  if (incomesBox) {
    incomesBox.innerHTML = `${(metrics.totalRevenue || 0).toLocaleString()} TND`;
    console.log("Updated incomes box with:", metrics.totalRevenue);
  } else {
    console.error("Incomes box element not found");
  }
  // Update Avg. Product Rating box
  if (avgRatingBox) {
    const rating = metrics.avgRating !== undefined ? metrics.avgRating : "N/A";
    
    // Format the rating display with stars if it's a numeric value
    if (rating !== "N/A") {
      const numericRating = parseFloat(rating);
      const stars = '★'.repeat(Math.round(numericRating)) + '☆'.repeat(5 - Math.round(numericRating));
      avgRatingBox.innerHTML = `${rating} <small>${stars}</small>`;
    } else {
      avgRatingBox.innerHTML = rating;
    }
    
    console.log("Updated avg rating box with:", rating);
  } else {
    console.error("Avg rating box element not found");
  }
}

// Fix the updateBestSellingProducts function to handle empty or single product data
function updateBestSellingProducts(products) {
  if (!products || products.length === 0) return;

  const progressGroups = document.querySelectorAll(".progress-group");
  if (progressGroups.length === 0) return;

  // Get the maximum units sold for percentage calculation
  const maxSold = Math.max(...products.map((p) => p.totalSold));

  // Clear all progress groups first
  progressGroups.forEach((group) => {
    // Find the text node or span for the product name
    const nameElement = group.querySelector(".progress-text");
    if (nameElement) {
      nameElement.textContent = "";
    } else {
      // If there's no specific element, find the first text node
      const firstNode = Array.from(group.childNodes).find(
        (node) =>
          node.nodeType === Node.TEXT_NODE ||
          (node.nodeType === Node.ELEMENT_NODE &&
            !node.classList.contains("float-end") &&
            !node.classList.contains("progress"))
      );

      if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
        firstNode.textContent = "";
      }
    }

    // Update units sold
    const unitsElement = group.querySelector(".float-end");
    if (unitsElement) {
      unitsElement.innerHTML = `<b>0</b> units`;
    }

    // Update progress bar width
    const progressBar = group.querySelector(".progress-bar");
    if (progressBar) {
      progressBar.style.width = "0%";
    }
  });

  // Update each progress group with product data
  products.forEach((product, index) => {
    if (index < progressGroups.length) {
      const progressGroup = progressGroups[index];

      // Find the text node or span for the product name
      const nameElement = progressGroup.querySelector(".progress-text");
      if (!nameElement) {
        // If there's no specific element, update the first text node
        const firstNode = Array.from(progressGroup.childNodes).find(
          (node) =>
            node.nodeType === Node.TEXT_NODE ||
            (node.nodeType === Node.ELEMENT_NODE &&
              !node.classList.contains("float-end") &&
              !node.classList.contains("progress"))
        );

        if (firstNode) {
          if (firstNode.nodeType === Node.TEXT_NODE) {
            firstNode.textContent = product.name;
          } else {
            firstNode.innerHTML = product.name;
          }
        } else {
          // If we can't find a suitable node, prepend a new text node
          const textNode = document.createTextNode(product.name);
          progressGroup.prepend(textNode);
        }
      } else {
        nameElement.textContent = product.name;
      }

      // Update units sold
      const unitsElement = progressGroup.querySelector(".float-end");
      if (unitsElement) {
        unitsElement.innerHTML = `<b>${product.totalSold}</b> units`;
      }

      // Update progress bar width
      const progressBar = progressGroup.querySelector(".progress-bar");
      if (progressBar) {
        const percentage = Math.round((product.totalSold / maxSold) * 100);
        progressBar.style.width = `${percentage}%`;
      }
    }
  });
}

// Fix the updateSalesMetrics function to use actual data
function updateSalesMetrics(metrics) {
  // Update revenue (TOTAL REVENUE)
  const revenueElement = document.querySelector(
    ".card-footer .col-md-3:nth-child(1) h5"
  );
  if (revenueElement) {
    revenueElement.textContent = `${(metrics.totalRevenue || 0).toLocaleString()} TND`;
  }
  // Update cost (TOTAL COST) - assuming 40% of revenue for demo
  const costElement = document.querySelector(
    ".card-footer .col-md-3:nth-child(2) h5"
  );
  if (costElement) {
    const cost = Math.round((metrics.totalRevenue || 0) * 0.4);
    costElement.textContent = `${cost.toLocaleString()} TND`;
  }
  // Update profit (TOTAL PROFIT) - revenue minus cost
  const profitElement = document.querySelector(
    ".card-footer .col-md-3:nth-child(3) h5"
  );
  if (profitElement) {
    const profit = Math.round((metrics.totalRevenue || 0) * 0.6); // 60% profit margin
    profitElement.textContent = `${profit.toLocaleString()} TND`;
  }
  // Update orders count (ORDERS)
  const ordersElement = document.querySelector(
    ".card-footer .col-md-3:nth-child(4) h5"
  );
  if (ordersElement) {
    ordersElement.textContent = (metrics.totalOrders || 0).toString();
  }
}

// Function to update percentage indicators
function updatePercentageIndicators(metrics) {
  const indicators = [
    document.querySelector(
      ".card-footer .col-md-3:nth-child(1) .text-success, .card-footer .col-md-3:nth-child(1) .text-danger"
    ),
    document.querySelector(
      ".card-footer .col-md-3:nth-child(2) .text-success, .card-footer .col-md-3:nth-child(2) .text-danger"
    ),
    document.querySelector(
      ".card-footer .col-md-3:nth-child(3) .text-success, .card-footer .col-md-3:nth-child(3) .text-danger"
    ),
    document.querySelector(
      ".card-footer .col-md-3:nth-child(4) .text-success, .card-footer .col-md-3:nth-child(4) .text-danger"
    ),
  ];

  indicators.forEach((indicator) => {
    if (!indicator) return;

    const percentage = Math.floor(Math.random() * 50) - 20; // Random between -20 and +30

    if (percentage >= 0) {
      indicator.className = "text-success";
      indicator.innerHTML = `<i class="bi bi-caret-up-fill"></i> ${percentage}%`;
    } else {
      indicator.className = "text-danger";
      indicator.innerHTML = `<i class="bi bi-caret-down-fill"></i> ${Math.abs(percentage)}%`;
    }
  });
}

// Fix the updateCategoryTable function to handle empty or single category data
function updateCategoryTable(categories) {
  if (!categories || categories.length === 0) return;

  let tableBody = null;
  const salesDistributionCard = Array.from(
    document.querySelectorAll(".card-title")
  ).find((el) => el.textContent.includes("Sales Distribution by Category"));

  if (salesDistributionCard) {
    const card = salesDistributionCard.closest(".card");
    if (card) {
      const table = card.querySelector(".table");
      if (table) {
        tableBody = table.querySelector("tbody");
      }
    }
  }

  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = "";

  // Add new rows for each category
  categories.forEach((category) => {
    const row = document.createElement("tr");

    // Determine badge color based on percentage
    let badgeClass = "text-bg-primary";
    if (category.percentage >= 30) badgeClass = "text-bg-primary";
    else if (category.percentage >= 20) badgeClass = "text-bg-success";
    else if (category.percentage >= 15) badgeClass = "text-bg-info";
    else if (category.percentage >= 10) badgeClass = "text-bg-warning";
    else badgeClass = "text-bg-danger";
    row.innerHTML = `
      <td>${category.category}</td>
      <td>${Math.round(category.amount).toLocaleString()} TND</td>
      <td><span class="badge ${badgeClass}">${category.percentage}%</span></td>
    `;

    tableBody.appendChild(row);
  });
}

// Fix the updateRecentOrders function to handle empty or single order data
function updateRecentOrders(orders) {
  if (!orders || orders.length === 0) return;

  // Find the latest orders table
  let tableBody = null;
  const latestOrdersCard = Array.from(
    document.querySelectorAll(".card-title")
  ).find((el) => el.textContent.includes("Latest Orders"));

  if (latestOrdersCard) {
    const card = latestOrdersCard.closest(".card");
    if (card) {
      tableBody = card.querySelector("table tbody");
    }
  }

  if (!tableBody) return;

  // Clear existing rows
  tableBody.innerHTML = "";

  // Add new rows for each order
  orders.forEach((order, index) => {
    const row = document.createElement("tr");

    // Determine badge class based on status
    let badgeClass = "text-bg-secondary";
    let statusText = order.status;

    switch (order.status.toLowerCase()) {
      case "completed":
        badgeClass = "text-bg-success";
        statusText = "Completed";
        break;
      case "pending":
        badgeClass = "text-bg-warning";
        statusText = "Pending";
        break;
      case "shipped":
        badgeClass = "text-bg-info";
        statusText = "Shipped";
        break;
      case "cancelled":
        badgeClass = "text-bg-danger";
        statusText = "Cancelled";
        break;
      default:
        badgeClass = "text-bg-secondary";
    }

    // Get product name from the first item in the order
    let productName = "Unknown Product";
    if (order.items && order.items.length > 0) {
      productName = order.items[0].productName || "Unknown Product";
    }

    row.innerHTML = `
      <td>
        <a href="pages/examples/invoice.html" class="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">
          ${order.id.substring(0, 6)}
        </a>
      </td>
      <td>${productName}</td>
      <td>
        <span class="badge ${badgeClass}">
          ${statusText}
        </span>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// Fix the updateRecentProducts function to handle empty or limited product data
function updateRecentProducts(products) {
  if (!products || products.length === 0) return;

  // Find the recently added products container
  let productsContainer = null;
  const recentProductsCard = Array.from(
    document.querySelectorAll(".card-title")
  ).find((el) => el.textContent.includes("Recently Added Products"));

  if (recentProductsCard) {
    const card = recentProductsCard.closest(".card");
    if (card) {
      productsContainer = card.querySelector(".px-2");
    }
  }

  if (!productsContainer) return;

  // Clear existing products
  productsContainer.innerHTML = "";

  // Add new products
  products.forEach((product) => {
    const productDiv = document.createElement("div");
    productDiv.className = "d-flex border-top py-2 px-1";

    // Determine badge class based on price
    let badgeClass = "text-bg-info";
    if (product.price > 1000) badgeClass = "text-bg-warning";
    else if (product.price > 500) badgeClass = "text-bg-danger";
    else if (product.price > 300) badgeClass = "text-bg-success";
    productDiv.innerHTML = `
      <div class="col-2">
        <img
          src="${product.image || "../../dist/assets/img/default-150x150.png"}"
          alt="Product Image"
          class="img-size-50"
        />
      </div>
      <div class="col-10">
        <a href="javascript:void(0)" class="fw-bold">
          ${product.name}
          <span class="badge ${badgeClass} float-end">
            ${product.price} TND
          </span>
        </a>
        <div class="text-truncate">
          ${product.description}
        </div>
      </div>
    `;

    productsContainer.appendChild(productDiv);
  });
}

// Function to update sidebar badges
function updateSidebarBadges(metrics) {
  // Update Products badge
  const productsBadge = document.querySelector(
    '.nav-item a[href="products.html"] '
  );
  if (productsBadge) {
    productsBadge.textContent = metrics.totalProducts;
  }

  // Update Orders badge
  const ordersBadge = document.querySelector(
    '.nav-item a[href="orders.html"] '
  );
  if (ordersBadge) {
    ordersBadge.textContent = metrics.totalOrders;
  }

  // Update Invoice badge
  const invoiceBadge = document.querySelector(
    '.nav-item a[href="invoice.html"] '
  );
  if (invoiceBadge) {
    invoiceBadge.textContent = metrics.totalInvoices || metrics.totalOrders; // Assuming all orders have invoices
  }
} // Function to initialize charts
function initializeCharts(dashboardData) {
  console.log("Initializing charts with data:", {
    monthlySales: dashboardData.monthlySales,
    salesByCategory: dashboardData.salesByCategory,
  });

  // Store orders data globally for filter usage
  window.ordersData = dashboardData.orders;

  // Initialize sales chart with monthly view as default
  initializeSalesChart(dashboardData.monthlySales, "monthly");

  // Set up filter buttons event listeners
  setupSalesChartFilters();

  // Initialize category chart
  initializeCategoryChart(dashboardData.salesByCategory);

  // Initialize pie chart for sales by category
  initializePieChart(dashboardData.salesByCategory);
}

// Function to set up sales chart filter buttons
function setupSalesChartFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  if (!filterButtons.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-outline-secondary");
      });

      // Add active class to clicked button
      this.classList.add("active");
      this.classList.remove("btn-outline-secondary");
      this.classList.add("btn-primary");

      const filterType = this.getAttribute("data-filter");
      updateSalesChart(filterType);
    });
  });
}

// Function to update sales chart based on selected filter
function updateSalesChart(filterType) {
  if (!window.ordersData) return;

  let salesData;
  switch (filterType) {
    case "daily":
      salesData = calculateDailySales(window.ordersData);
      break;
    case "yearly":
      salesData = calculateYearlySales(window.ordersData);
      break;
    case "monthly":
    default:
      salesData = calculateMonthlySales(window.ordersData);
  }

  // Re-initialize chart with the new data and view type
  initializeSalesChart(salesData, filterType);
}
// Fix the initializeSalesChart function to handle different time period views (daily, monthly, yearly)
function initializeSalesChart(salesData, viewType = "monthly") {
  if (!salesData || salesData.length === 0) return;

  const salesChartElement = document.getElementById("sales-chart");
  if (!salesChartElement) return;

  // If we only have one data point, add a dummy point to make the chart look better
  const chartData = [...salesData];
  if (chartData.length === 1) {
    // Handle single data point based on view type
    if (viewType === "monthly") {
      const [month, year] = chartData[0].day.split("/");
      const prevMonth = Number.parseInt(month) - 1 || 12;
      const prevYear = prevMonth === 12 ? Number.parseInt(year) - 1 : year;
      chartData.unshift({
        day: `${prevMonth}/${prevYear}`,
        amount: 0,
      });
    } else if (viewType === "daily") {
      const [day, month, year] = chartData[0].day.split("/");
      const prevDate = new Date(`${year}-${month}-${day}`);
      prevDate.setDate(prevDate.getDate() - 1);
      chartData.unshift({
        day: `${prevDate.getDate()}/${prevDate.getMonth() + 1}/${prevDate.getFullYear()}`,
        amount: 0,
      });
    } else if (viewType === "yearly") {
      // Use current year from the system
      const currentYear = new Date().getFullYear();
      const year = Number.parseInt(chartData[0].day);
      // If the year in the data is the current year, use previous year
      // Otherwise use the appropriate adjacent year
      const prevYear =
        year === currentYear
          ? year - 1
          : year < currentYear
            ? year + 1
            : year - 1;
      chartData.unshift({
        day: prevYear.toString(),
        amount: 0,
      });
    }
  }

  let sortedDates, sortedAmounts, formattedLabels;

  if (viewType === "daily") {
    // Format dates for daily view
    const dateCategories = chartData.map((item) => {
      const [day, month, year] = item.day.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    });

    // Sort dates chronologically
    const sortedIndices = dateCategories
      .map((date, index) => ({ date, index }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => item.index);

    sortedDates = sortedIndices.map((i) => dateCategories[i]);
    sortedAmounts = sortedIndices.map((i) => chartData[i].amount);

    // Format labels as "DD Mon" (e.g., "15 Jan")
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    formattedLabels = sortedDates.map((date) => {
      const dateObj = new Date(date);
      return `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;
    });
  } else if (viewType === "monthly") {
    // Format dates for monthly view
    const dateCategories = chartData.map((item) => {
      const [month, year] = item.day.split("/");
      return `${year}-${month.padStart(2, "0")}-01`;
    });

    // Sort dates chronologically
    const sortedIndices = dateCategories
      .map((date, index) => ({ date, index }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => item.index);

    sortedDates = sortedIndices.map((i) => dateCategories[i]);
    sortedAmounts = sortedIndices.map((i) => chartData[i].amount);

    // Format labels as month names (e.g., "Jan")
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    formattedLabels = sortedDates.map((date) => {
      const dateObj = new Date(date);
      return monthNames[dateObj.getMonth()];
    });
  } else if (viewType === "yearly") {
    // For yearly view, no need to convert dates
    sortedDates = chartData.map((item) => item.day).sort();
    const sortedIndices = chartData
      .map((item, index) => ({ year: item.day, index }))
      .sort((a, b) => a.year - b.year)
      .map((item) => item.index);

    sortedAmounts = sortedIndices.map((i) => chartData[i].amount);
    formattedLabels = sortedDates;
  }

  // Create chart title and series name based on view type
  let chartTitle, seriesName; // Get current year for dynamic titles
  const currentYear = new Date().getFullYear();

  switch (viewType) {
    case "daily":
      chartTitle = "Daily Sales (Last 30 Days)";
      seriesName = "Daily Sales";
      break;
    case "monthly":
      chartTitle = `Monthly Sales (${currentYear})`;
      seriesName = "Monthly Sales";
      break;
    case "yearly":
      chartTitle = `Yearly Sales (${currentYear - 4} - ${currentYear})`;
      seriesName = "Annual Sales";
      break;
  }

  // Create chart configuration
  const sales_chart_options = {
    series: [
      {
        name: seriesName,
        data: sortedAmounts,
      },
    ],
    chart: {
      height: 300,
      type: "area",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      background: "#fff",
      animations: {
        enabled: true,
        easing: "smooth",
        speed: 800,
      },
    },
    legend: {
      show: false,
    },
    colors: ["#36A2EB"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.4,
        opacityFrom: 0.8,
        opacityTo: 0.2,
        stops: [0, 90, 100],
      },
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    markers: {
      size: 0,
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: formattedLabels,
      tickAmount: viewType === "daily" ? 7 : viewType === "monthly" ? 12 : 5,
      labels: {
        rotate: viewType === "daily" ? -45 : 0,
        style: {
          colors: "#777",
          fontSize: "12px",
          fontFamily: "Source Sans 3, sans-serif",
        },
      },
      axisBorder: {
        show: true,
        color: "#e0e0e0",
      },
      axisTicks: {
        show: false,
      },
      title: {
        text: "",
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val;
        },
        style: {
          fontSize: "12px",
          fontFamily: "Source Sans 3, sans-serif",
        },
      },
      title: {
        text: "",
      },
      min: 0,
      forceNiceScale: true,
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: false,
      y: {
        formatter: function (val) {
          return val.toLocaleString() + " TND";
        },
      },
      x: {
        show: true,
      },
      marker: {
        show: false,
      },
      theme: "light",
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 5,
      row: {
        colors: ["transparent", "transparent"],
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
          opacity: 0.5,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
  };

  // Clear previous chart if exists
  salesChartElement.innerHTML = "";

  // Create chart title element
  const titleElement = document.createElement("div");
  titleElement.className = "chart-title";
  titleElement.style.cssText =
    "font-size: 16px; font-weight: bold; padding-left: 10px; margin-bottom: 10px;";
  titleElement.textContent = chartTitle;

  // Add the title before rendering chart
  salesChartElement.appendChild(titleElement);
  // Create and render the chart
  // First, destroy any existing chart instance to prevent memory leaks
  if (window.salesChart) {
    window.salesChart.destroy();
  }

  // Create new chart instance and store it globally
  window.salesChart = new window.ApexCharts(
    salesChartElement,
    sales_chart_options
  );
  window.salesChart.render();
}
// Fix the initializeCategoryChart function to handle empty or single category data
function initializeCategoryChart(categories) {
  if (!categories || categories.length === 0) return;

  const categoryChartElement = document.getElementById("sales-category-chart");
  if (!categoryChartElement) return;

  // Format data for ApexCharts
  const categoryNames = categories.map((item) => item.category);
  const amounts = categories.map((item) => item.amount);

  const options = {
    series: [
      {
        name: "Sales",
        data: amounts,
      },
    ],
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categoryNames,
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: {
        text: "TND (sales)",
      },
      labels: {
        formatter: (val) => val.toLocaleString() + " TND",
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString() + " TND",
      },
    },
    colors: ["#0d6efd"],
    grid: {
      borderColor: "#f1f1f1",
      row: {
        colors: ["transparent", "transparent"],
      },
    },
  };

  // Clear previous chart if exists
  categoryChartElement.innerHTML = "";

  const chart = new window.ApexCharts(categoryChartElement, options);
  chart.render();
} // Function to initialize pie chart
// Fix the initializePieChart function to handle empty or single category data
function initializePieChart(categories) {
  const pieChartElement = document.getElementById("pie-chart");
  if (!pieChartElement) return;

  // If categories data is available, use it; otherwise use default data
  let series = [];
  let labels = [];

  // Check if we have category data to use
  if (categories && categories.length > 0) {
    // Take top 4 categories by percentage
    const topCategories = [...categories]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);
    series = topCategories.map((cat) => cat.percentage);
    labels = topCategories.map((cat) => cat.category);

    // Update category trends in footer
    updateCategoryTrends(categories.slice(0, 3));
  } else {
    // If no data, show a message instead of an empty chart
    pieChartElement.innerHTML =
      '<div class="text-center p-4">No category data available</div>';
    return;
  }
  const options = {
    series: series,
    chart: {
      type: "pie",
      height: 320,
      width: "100%",
    },
    labels: labels,
    tooltip: {
      y: {
        formatter: function (value) {
          return value + "% of total sales";
        },
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 260,
          },
          legend: {
            position: "bottom",
            fontSize: "12px",
          },
        },
      },
    ],
    colors: ["#0d6efd", "#dc3545", "#ffc107", "#20c997"],
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(1) + "%";
      },
    },
  };
  // Clear previous chart if exists
  pieChartElement.innerHTML = "";

  // Store chart reference globally to access it for window resize
  if (window.pieChart) {
    window.pieChart.destroy();
  }

  window.pieChart = new window.ApexCharts(pieChartElement, options);
  window.pieChart.render();

  // Make sure chart resizes when window is resized
  window.addEventListener("resize", function () {
    if (window.pieChart) {
      window.pieChart.updateOptions({
        chart: {
          width: "100%",
        },
      });
    }
  });
}
// Function to create sparkline charts
function createSparklineChart(selector, data) {
  const element = document.querySelector(selector);
  if (!element) return;

  const options = {
    series: [
      {
        data: data,
      },
    ],
    chart: {
      type: "line",
      width: 100,
      height: 35,
      sparkline: {
        enabled: true,
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    tooltip: {
      fixed: {
        enabled: false,
      },
      x: {
        show: false,
      },
      y: {
        title: {
          formatter: (seriesName) => "",
        },
      },
      marker: {
        show: false,
      },
    },
    colors: ["#0d6efd"],
  };

  // Clear previous chart if exists
  element.innerHTML = "";

  const chart = new window.ApexCharts(element, options);
  chart.render();
}

// Function to initialize sparklines for orders
function initializeOrderSparklines(count) {
  // Generate random data for sparklines
  for (let i = 1; i <= count; i++) {
    const element = document.getElementById(`table-sparkline-${i}`);
    if (element) {
      const data = Array.from(
        { length: 10 },
        () => Math.floor(Math.random() * 50) + 10
      );
      createSparklineChart(`#table-sparkline-${i}`, data);
    }
  }
}

// Function to update shop information
function updateShopInfo(shopData) {
  if (!shopData) return;

  // Get user data from localStorage for shop name
  const userDataString = localStorage.getItem("userData");
  let userData = null;

  try {
    if (userDataString) {
      userData = JSON.parse(userDataString);
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  // Use the correct shop name from userData if available
  const shopName =
    userData && userData.shopName
      ? userData.shopName
      : shopData.shopName || "Dashboard Shop";

  // Update shop name in the header
  const shopNameElements = document.querySelectorAll(
    ".user-menu .d-none.d-md-inline, .user-header p"
  );
  shopNameElements.forEach((element) => {
    if (element) element.textContent = shopName;
  });

  // Update shop name in sidebar
  const sidebarShopName = document.querySelector(".brand-text");
  if (sidebarShopName) {
    sidebarShopName.textContent = shopName;
  }

  // Update founded date if available
  const foundedElement = document.querySelector(".user-header p small");
  if (foundedElement && shopData.foundedDate) {
    foundedElement.textContent = `Founded In ${new Date(shopData.foundedDate).getFullYear() || "2025"}`;
  }

  // Update shop logo if available
  if (shopData.logo) {
    const logoElements = document.querySelectorAll(
      ".user-image, .user-header img, .brand-image"
    );
    logoElements.forEach((element) => {
      if (element) element.src = shopData.logo;
    });
  }
}

// Function to fetch dashboard data
function fetchDashboardData() {
  console.log("Fetching dashboard data...");

  // Get token from localStorage using the correct key 'token'
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Authentication token not found in localStorage");
    // Show fallback UI with dummy data
    showFallbackDashboard();
    return;
  }

  console.log("Token retrieved from localStorage");

  // Add loading indicators to UI elements
  showLoadingState();

  // Headers for authenticated requests
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Get user data from localStorage
  const userDataString = localStorage.getItem("userData");
  let userData = null;

  try {
    if (userDataString) {
      userData = JSON.parse(userDataString);
      console.log("User data retrieved from localStorage:", userData);
    }
  } catch (error) {
    console.error("Error parsing user data:", error);
  }
  // 1. Fetch vendor's products data
  console.log("Fetching products data...");
  makeXHRRequest(
    "http://localhost:3000/product/get/myProducts",
    "GET",
    headers,
    (error, productsData) => {
      if (error) {
        console.error("Failed to fetch products:", error);
        handleFetchError(error, fetchDashboardData);
        return;
      }

      console.log("Products data:", {
        totalProducts: productsData.results,
        shopId: productsData.data.shopId,
      }); // 2. Fetch orders data
      console.log("Fetching orders data...");
      makeXHRRequest(
        "http://localhost:3000/order",
        "GET",
        headers,
        (error, ordersData) => {
          if (error) {
            console.error("Failed to fetch orders:", error);
            // Create a partial dashboard with just product data
            const partialDashboardData = {
              metrics: {
                totalProducts: productsData.results,
                totalOrders: 0,
                totalRevenue: 0,
                completedOrders: 0,
                pendingOrders: 0,
                shippedOrders: 0,
                totalInvoices: 0,
                avgRating: "N/A",
              },
              monthlySales: [],
              bestSellingProducts: [],
              salesByCategory: [],
              recentOrders: [],
              recentProducts: productsData.data.products
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                )
                .slice(0, 4)
                .map((product) => ({
                  id: product._id,
                  name: product.productName,
                  price: product.productPrice,
                  description:
                    product.description ||
                    product.productDetails ||
                    "No description available",
                  image: product.mainImage
                    ? `../../uploads/${product.mainImage}`
                    : null,
                })),
            };

            updateDashboardUI(partialDashboardData);

            handleFetchError(error, fetchDashboardData);
            return;
          }

          const orders = ordersData.orders;

          console.log("Orders data:", {
            totalOrders: orders.length,
            orders: orders.map((order) => ({
              id: order._id,
              client: order.idClient
                ? `${order.idClient.firstname} ${order.idClient.lastname}`
                : "Unknown",
              total: order.orderTotal,
              status: order.orderStatus,
              date: new Date(order.dateCommande).toLocaleDateString(),
            })),
          });

          // 3. Fetch category counts
          console.log("Fetching category counts...");
          makeXHRRequest(
            "http://localhost:3000/product/category-counts",
            "GET",
            headers,
            (error, categoryCountsData) => {
              if (error) {
                console.error("Failed to fetch category counts:", error);
                return;
              }

              console.log(
                "Category counts:",
                categoryCountsData.categoryCounts
              );

              // 4. Calculate sales metrics
              console.log("Calculating sales metrics...");

              // Total revenue
              const totalRevenue = orders.reduce(
                (sum, order) => sum + (order.orderTotal || 0),
                0
              );

              // Completed orders count
              const completedOrders = orders.filter(
                (order) => order.orderStatus === "completed"
              ).length;

              // Pending orders count
              const pendingOrders = orders.filter(
                (order) => order.orderStatus === "pending"
              ).length;

              // Shipped orders count
              const shippedOrders = orders.filter(
                (order) => order.orderStatus === "shipped"
              ).length;

              // Calculate monthly sales data for chart
              const monthlySales = calculateMonthlySales(orders);

              // 5. Calculate best-selling products
              console.log("Calculating best-selling products...");
              const bestSellingProducts = calculateBestSellingProducts(orders);

              // 6. Calculate sales by category
              console.log("Calculating sales by category...");
              const salesByCategory = calculateSalesByCategory(
                orders,
                productsData.data.products
              );

              // 7. Prepare recent orders data
              const recentOrders = orders
                .sort(
                  (a, b) => new Date(b.dateCommande) - new Date(a.dateCommande)
                )
                .slice(0, 7)
                .map((order) => ({
                  id: order._id,
                  client: order.idClient
                    ? `${order.idClient.firstname} ${order.idClient.lastname}`
                    : "Unknown",
                  total: order.orderTotal,
                  status: order.orderStatus,
                  date: new Date(order.dateCommande).toLocaleDateString(),
                  items:
                    order.cartData && order.cartData.items
                      ? order.cartData.items.map((item) => ({
                          productId: item.productId._id,
                          productName: item.productId.productName,
                          quantity: item.quantity,
                        }))
                      : [],
                }));

              // 8. Prepare recent products data
              const recentProducts = productsData.data.products
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                )
                .slice(0, 4)
                .map((product) => ({
                  id: product._id,
                  name: product.productName,
                  price: product.productPrice,
                  description:
                    product.description ||
                    product.productDetails ||
                    "No description available",
                  image: product.mainImage
                    ? `../../uploads/${product.mainImage}`
                    : null,
                })); // Calculate average product rating if available
              let avgRating = "N/A";
              let totalRatings = 0;
              let sumRatings = 0;              // Check if we have products with ratings
              if (
                productsData.data.products &&
                productsData.data.products.length > 0
              ) {
                productsData.data.products.forEach((product) => {
                  // Use averageRating from the product model instead of avgRating
                  if (
                    product.averageRating !== undefined &&
                    product.averageRating !== null
                  ) {
                    sumRatings += parseFloat(product.averageRating);
                    totalRatings++;
                  }
                });

                if (totalRatings > 0) {
                  avgRating = (sumRatings / totalRatings).toFixed(1);
                  console.log(
                    "Calculated average rating:",
                    avgRating,
                    "from",
                    totalRatings,
                    "products with ratings"
                  );
                }
              } // Combine all dashboard data - use EXACTLY the data from API with no modifications
              const dashboardData = {
                metrics: {
                  totalProducts: productsData.results,
                  totalOrders: orders.length,
                  totalRevenue: totalRevenue,
                  completedOrders: completedOrders,
                  pendingOrders: pendingOrders,
                  shippedOrders: shippedOrders,
                  totalInvoices: completedOrders + shippedOrders,
                  avgRating: avgRating,
                },
                monthlySales,
                bestSellingProducts,
                salesByCategory,
                categoryCounts: categoryCountsData.categoryCounts,
                recentOrders,
                recentProducts,
                orders, // Add the raw orders data for filtering
              };

              // Log the complete dashboard data
              console.log("Complete dashboard data:");
              console.log(JSON.stringify(dashboardData, null, 2));

              // Update the UI with the fetched data
              updateDashboardUI(dashboardData);

              // Update shop information if available
              if (userData) {
                updateShopInfo(shopData);
              }
            }
          );
        }
      );
    }
  );
}
// Helper function to calculate monthly sales
function calculateMonthlySales(orders) {
  const monthlySales = {};

  // Define all months to ensure we have entries for each month
  const allMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Always use current system year for consistency
  const currentYear = new Date().getFullYear();
  allMonths.forEach((_, monthIndex) => {
    const monthKey = `${monthIndex + 1}/${currentYear}`;
    monthlySales[monthKey] = 0;
  });

  orders.forEach((order) => {
    if (!order.dateCommande) return;

    const date = new Date(order.dateCommande);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

    if (!monthlySales[monthYear]) {
      monthlySales[monthYear] = 0;
    }

    monthlySales[monthYear] += order.orderTotal || 0;
  });

  // Convert to array format for chart
  return (
    Object.entries(monthlySales)
      .map(([day, amount]) => ({
        day,
        amount,
      }))
      // Sort by date to ensure chronological order
      .sort((a, b) => {
        const [aMonth, aYear] = a.day.split("/");
        const [bMonth, bYear] = b.day.split("/");
        return (
          new Date(`${aYear}-${aMonth}-01`) - new Date(`${bYear}-${bMonth}-01`)
        );
      })
  );
}

// Helper function to calculate best-selling products
function calculateBestSellingProducts(orders) {
  const productSales = {};

  orders.forEach((order) => {
    if (order.cartData && order.cartData.items) {
      order.cartData.items.forEach((item) => {
        if (!item.productId) return;

        const productId = item.productId._id;
        const productName = item.productId.productName;
        const quantity = item.quantity || 1;

        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: productName || "Unknown Product",
            totalSold: 0,
          };
        }

        productSales[productId].totalSold += quantity;
      });
    }
  });

  // Convert to array and sort by totalSold
  return Object.values(productSales)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);
}
// Helper function to calculate sales by category
function calculateSalesByCategory(orders, products) {
  // Create a map of product IDs to categories
  const productCategories = {};
  if (products && Array.isArray(products)) {
    products.forEach((product) => {
      if (product._id) {
        // Get the category properly from the product data
        let categoryName = "Uncategorized";

        if (product.subCategory && product.subCategory.name) {
          categoryName = product.subCategory.name;
        } else if (product.category && product.category.name) {
          categoryName = product.category.name;
        } else if (product.categoryName) {
          categoryName = product.categoryName;
        }

        productCategories[product._id] = categoryName;
      }
    });
  }

  // Calculate sales by category
  const categorySales = {};

  orders.forEach((order) => {
    if (order.cartData && order.cartData.items) {
      order.cartData.items.forEach((item) => {
        if (!item.productId || !item.productId._id) return;

        const productId = item.productId._id;
        const category = productCategories[productId] || "Uncategorized";
        // Calculate the correct amount using price * quantity
        const price = item.productId.productPrice || 0;
        const quantity = item.quantity || 1;
        const amount = price * quantity;

        if (!categorySales[category]) {
          categorySales[category] = 0;
        }

        categorySales[category] += amount;
      });
    }
  });

  // Calculate total sales
  const totalSales = Object.values(categorySales).reduce(
    (sum, amount) => sum + amount,
    0
  );

  // Convert to array format for chart with percentages
  return (
    Object.entries(categorySales)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0,
      }))
      // Sort by amount descending to prioritize most important categories
      .sort((a, b) => b.amount - a.amount)
  );
}

// Helper function to calculate daily sales
function calculateDailySales(orders) {
  const dailySales = {};

  // Get date range for the past 30 days - always use current system date
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Initialize each day with zero sales
  for (
    let d = new Date(thirtyDaysAgo);
    d <= today;
    d.setDate(d.getDate() + 1)
  ) {
    const dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    dailySales[dateKey] = 0;
  }

  orders.forEach((order) => {
    if (!order.dateCommande) return;

    const date = new Date(order.dateCommande);
    // Skip if order is older than 30 days
    if (date < thirtyDaysAgo) return;

    const dateKey = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    if (!dailySales[dateKey]) {
      dailySales[dateKey] = 0;
    }

    dailySales[dateKey] += order.orderTotal || 0;
  });

  // Convert to array format for chart
  return (
    Object.entries(dailySales)
      .map(([day, amount]) => ({
        day,
        amount,
      }))
      // Sort by date to ensure chronological order
      .sort((a, b) => {
        const [aDay, aMonth, aYear] = a.day.split("/");
        const [bDay, bMonth, bYear] = b.day.split("/");
        return (
          new Date(`${aYear}-${aMonth}-${aDay}`) -
          new Date(`${bYear}-${bMonth}-${bDay}`)
        );
      })
  );
}

// Helper function to calculate yearly sales
function calculateYearlySales(orders) {
  const yearlySales = {};

  // Define years to include (past 5 years) - always use current system year
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4; // Include 5 years including current

  // Initialize all years with zero sales
  for (let year = startYear; year <= currentYear; year++) {
    yearlySales[year.toString()] = 0;
  }

  orders.forEach((order) => {
    if (!order.dateCommande) return;

    const date = new Date(order.dateCommande);
    const year = date.getFullYear().toString();

    // Skip if order is from earlier than our start year
    if (date.getFullYear() < startYear) return;

    if (!yearlySales[year]) {
      yearlySales[year] = 0;
    }

    yearlySales[year] += order.orderTotal || 0;
  });

  // Convert to array format for chart
  return (
    Object.entries(yearlySales)
      .map(([year, amount]) => ({
        day: year, // Using 'day' as the key to maintain consistency with other functions
        amount,
      }))
      // Sort by date to ensure chronological order
      .sort((a, b) => a.day - b.day)
  );
}

// Show loading state for dashboard
function showLoadingState() {
  // Add loading indicator to info boxes
  document.querySelectorAll(".info-box-number").forEach((box) => {
    box.innerHTML =
      '<small><i class="bi bi-hourglass-split"></i> Loading...</small>';
  });

  console.log("Set loading state for dashboard");
}

// Show fallback dashboard UI
function showFallbackDashboard() {
  // Create a simple fallback dashboard with dummy data
  const fallbackData = {
    metrics: {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      completedOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      totalInvoices: 0,
      avgRating: "N/A",
    },
    monthlySales: [],
    bestSellingProducts: [],
    salesByCategory: [],
    recentOrders: [],
    recentProducts: [],
  };

  // Show a warning message to the user
  Swal.fire({
    icon: "warning",
    title: "Connection issue",
    text: "Could not load dashboard data. Please check your connection or try again later.",
    confirmButtonText: "Retry",
  }).then((result) => {
    if (result.isConfirmed) {
      // Retry fetching
      window.location.reload();
    }
  });

  // Update UI with fallback data
  updateDashboardUI(fallbackData);
  console.log("Displayed fallback dashboard");
}

// Function to handle fetch errors and retry
function handleFetchError(error, retryFn) {
  console.error("Error fetching data:", error);

  Swal.fire({
    icon: "error",
    title: "Data loading error",
    text: error.message || "An error occurred loading your dashboard data.",
    showCancelButton: true,
    confirmButtonText: "Retry",
    cancelButtonText: "Continue with limited data",
  }).then((result) => {
    if (result.isConfirmed) {
      // Retry the fetch
      retryFn();
    } else {
      // Show fallback
      showFallbackDashboard();
    }
  });
}

// Function to update category trends in the pie chart footer
function updateCategoryTrends(topCategories) {
  const categoryTrendsContainer = document.getElementById("category-trends");
  if (!categoryTrendsContainer) return;

  // Clear existing items except the last one (which is the "View all" link)
  const viewAllLink = categoryTrendsContainer.lastElementChild;
  categoryTrendsContainer.innerHTML = "";

  // Add top categories with trend indicators
  topCategories.forEach((category, index) => {
    // Generate a different trend indicator for each category for visual variety
    let trendClass, trendIcon, trendValue;

    switch (index) {
      case 0:
        trendClass = "text-success";
        trendIcon = "bi-arrow-up";
        trendValue = `+${Math.round(category.percentage / 3)}%`;
        break;
      case 1:
        if (category.percentage > 20) {
          trendClass = "text-success";
          trendIcon = "bi-arrow-up";
          trendValue = `+${Math.round(category.percentage / 5)}%`;
        } else {
          trendClass = "text-info";
          trendIcon = "bi-arrow-right";
          trendValue = "Stable";
        }
        break;
      default:
        if (category.percentage < 15) {
          trendClass = "text-danger";
          trendIcon = "bi-arrow-down";
          trendValue = `-${Math.round(5 - category.percentage / 3)}%`;
        } else {
          trendClass = "text-info";
          trendIcon = "bi-arrow-right";
          trendValue = "Stable";
        }
    }

    const listItem = document.createElement("li");
    listItem.className = "nav-item";
    listItem.innerHTML = `
      <a href="products.html?category=${encodeURIComponent(category.category)}" class="nav-link">
        ${category.category}
        <span class="float-end ${trendClass}">
          <i class="bi ${trendIcon} fs-7"></i>
          ${trendValue}
        </span>
      </a>
    `;

    categoryTrendsContainer.appendChild(listItem);
  });

  // Re-add the "View all" link
  if (viewAllLink) {
    categoryTrendsContainer.appendChild(viewAllLink);
  }
}

// Execute the function when the document is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document loaded, fetching dashboard data...");
  fetchDashboardData();
});
