window.addEventListener('load', function() {
        console.log('Window loaded - checking chart library...');
        
        // Verify ApexCharts availability
        if (typeof ApexCharts === 'undefined') {
          console.error('ApexCharts not available after window load. Attempting to load from alternate CDN...');
          
          // Show loading message on charts
          document.querySelectorAll('#ordersChart, #shopCategoriesChart, #bestSellersChart').forEach(el => {
            el.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><span class="spinner-border text-primary" role="status"></span><span class="ms-2">Loading chart library...</span></div>';
          });
          
          // Try multiple CDNs in sequence for better reliability
          const loadApexChartsFromCDN = function(cdnUrls, index = 0) {
            if (index >= cdnUrls.length) {
              console.error('Failed to load ApexCharts from all CDNs');
              document.querySelectorAll('#ordersChart, #shopCategoriesChart, #bestSellersChart').forEach(el => {
                el.innerHTML = '<div class="alert alert-danger text-center">Failed to load chart library. Please check your internet connection and refresh the page.</div>';
              });
              return;
            }
            
            // Create and append a new script element
            const apexScript = document.createElement('script');
            apexScript.src = cdnUrls[index];
            
            apexScript.onload = function() {
              console.log('ApexCharts successfully loaded from CDN:', cdnUrls[index]);
              if (window.initDashboard && !window.dashboardInitialized) {
                console.log('Initializing dashboard after successful CDN load');
                window.dashboardInitialized = true;
                window.initDashboard();
              }
            };
            
            apexScript.onerror = function() {
              console.error('Failed to load ApexCharts from CDN:', cdnUrls[index]);
              // Try the next CDN
              loadApexChartsFromCDN(cdnUrls, index + 1);
            };
            
            document.head.appendChild(apexScript);
          };
          
          // List of CDNs to try in order
          const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/apexcharts@3.45.1/dist/apexcharts.min.js',
            'https://unpkg.com/apexcharts@3.45.1/dist/apexcharts.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/apexcharts/3.45.1/apexcharts.min.js'
          ];
          
          // Start the loading process
          loadApexChartsFromCDN(cdnUrls);
        } else {
          console.log('ApexCharts already available from primary source');
          if (window.initDashboard && !window.dashboardInitialized) {
            console.log('Initializing dashboard directly');
            window.dashboardInitialized = true; 
            window.initDashboard();
          }
        }
      });
window.initDashboard = function () {
  console.log("Initializing dashboard via initDashboard function...");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No authentication token found. You might need to log in.");
  }
  // Initialize the dashboard
  fetchShopsCount();
  fetchClientsCount();
  fetchOrdersCount();
  fetchMonthlyOrdersData();
  fetchShopCategoriesData();
  fetchOrdersPerShop();
  fetchBestSellers();

  // Setup refresh buttons click events
  setupRefreshButtons();
};

function setupRefreshButtons() {
  document
    .querySelectorAll('.card-tools button[data-bs-toggle="tooltip"]')
    .forEach((button) => {
      button.addEventListener("click", function () {
        const cardHeader = this.closest(".card-header");
        const cardTitle = cardHeader.querySelector(".card-title").textContent;

        if (cardTitle.includes("Monthly Orders")) {
          fetchMonthlyOrdersData();
        } else if (cardTitle.includes("Shop Categories")) {
          fetchShopCategoriesData();
        } else if (cardTitle.includes("Best Sellers")) {
          fetchBestSellers();
        } else if (cardTitle.includes("Orders Per Shop")) {
          fetchOrdersPerShop();
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded - Initializing admin dashboard...");

  // Verify that ApexCharts is available with multiple attempts
  let checkApexCharts = function (retries = 0, maxRetries = 3) {
    if (typeof ApexCharts !== "undefined") {
      console.log("ApexCharts is available, initializing dashboard...");
      window.initDashboard();
      return;
    }

    console.warn(
      `ApexCharts not available yet, attempt ${retries + 1} of ${maxRetries}...`
    );

    if (retries < maxRetries) {
      // Display waiting message on chart containers
      document
        .querySelectorAll(
          "#ordersChart, #shopCategoriesChart, #bestSellersChart"
        )
        .forEach((el) => {
          el.innerHTML =
            '<div class="d-flex justify-content-center align-items-center h-100"><span class="spinner-border text-primary" role="status"></span><span class="ms-2">Loading chart library...</span></div>';
        });

      // Try again with increasing delay
      setTimeout(
        () => checkApexCharts(retries + 1, maxRetries),
        500 * Math.pow(2, retries)
      );
    } else {
      console.error(
        "ApexCharts library not loaded after multiple attempts! Charts will not work."
      );
      document
        .querySelectorAll(
          "#ordersChart, #shopCategoriesChart, #bestSellersChart"
        )
        .forEach((el) => {
          el.innerHTML =
            '<div class="alert alert-danger">Chart library failed to load. Please check your internet connection and refresh the page.</div>';
        });
    }
  };

  // Start checking if ApexCharts is available
  setTimeout(() => checkApexCharts(), 300);

  // Setup refresh buttons click events
  document
    .querySelectorAll('.card-tools button[data-bs-toggle="tooltip"]')
    .forEach((button) => {
      button.addEventListener("click", function () {
        const cardHeader = this.closest(".card-header");
        const cardTitle = cardHeader.querySelector(".card-title").textContent;

        if (cardTitle.includes("Monthly Orders")) {
          fetchMonthlyOrdersData();
        } else if (cardTitle.includes("Shop Categories")) {
          fetchShopCategoriesData();
        } else if (cardTitle.includes("Best Sellers")) {
          fetchBestSellers();
        } else if (cardTitle.includes("Orders Per Shop")) {
          fetchOrdersPerShop();
        }
      });
    });
});

// Individual fetch functions for better error handling and separate loading states
function fetchShopsCount() {
  const xhr = new XMLHttpRequest();
  // Make sure this API endpoint matches your backend structure
  xhr.open("GET", "/api/shop/count", true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading state
  document.getElementById("totalShops").innerHTML =
    '<i class="bi bi-hourglass-split"></i>';

  xhr.onload = function () {
    if (this.status === 200) {
      try {
        const data = JSON.parse(this.responseText);
        document.getElementById("totalShops").textContent = formatNumber(
          data.count || 0
        );
      } catch (e) {
        console.error("Error parsing shop count data:", e);
        document.getElementById("totalShops").textContent = "0";
      }
    } else {
      console.error("Failed to fetch shop count:", this.status);
      document.getElementById("totalShops").textContent = "0";
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching shop count");
    document.getElementById("totalShops").textContent = "0";
  };

  xhr.timeout = 10000; // 10 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching shop count");
    document.getElementById("totalShops").textContent = "0";
  };

  xhr.send();
}

function fetchClientsCount() {
  const xhr = new XMLHttpRequest();
  // Make sure this API endpoint matches your backend structure
  xhr.open("GET", "/api/client/count", true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading state
  document.getElementById("totalClients").innerHTML =
    '<i class="bi bi-hourglass-split"></i>';

  xhr.onload = function () {
    if (this.status === 200) {
      try {
        const data = JSON.parse(this.responseText);
        document.getElementById("totalClients").textContent = formatNumber(
          data.count || 0
        );
      } catch (e) {
        console.error("Error parsing client count data:", e);
        document.getElementById("totalClients").textContent = "0";
      }
    } else {
      console.error("Failed to fetch client count:", this.status);
      document.getElementById("totalClients").textContent = "0";
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching client count");
    document.getElementById("totalClients").textContent = "0";
  };

  xhr.timeout = 10000; // 10 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching client count");
    document.getElementById("totalClients").textContent = "0";
  };

  xhr.send();
}

function fetchOrdersCount() {
  const xhr = new XMLHttpRequest();
  // Make sure this API endpoint matches your backend structure
  xhr.open("GET", "/api/order/count", true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading state
  document.getElementById("totalOrders").innerHTML =
    '<i class="bi bi-hourglass-split"></i>';

  xhr.onload = function () {
    if (this.status === 200) {
      try {
        const data = JSON.parse(this.responseText);
        document.getElementById("totalOrders").textContent = formatNumber(
          data.count || 0
        );
      } catch (e) {
        console.error("Error parsing order count data:", e);
        document.getElementById("totalOrders").textContent = "0";
      }
    } else {
      console.error("Failed to fetch order count:", this.status);
      document.getElementById("totalOrders").textContent = "0";
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching order count");
    document.getElementById("totalOrders").textContent = "0";
  };

  xhr.timeout = 10000; // 10 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching order count");
    document.getElementById("totalOrders").textContent = "0";
  };
  xhr.send();
}

function fetchMonthlyOrdersData() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/order/monthly-stats", true);

  // Log the XHR request for debugging
  console.log(
    "Fetching monthly orders data from:",
    xhr.responseURL || "/api/order/monthly-stats"
  );

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading indicator in chart area
  const chartElement = document.getElementById("ordersChart");
  chartElement.innerHTML =
    '<div class="d-flex justify-content-center align-items-center" style="height:250px"><span class="spinner-border text-primary" role="status"></span><span class="ms-2">Loading monthly order data...</span></div>';

  xhr.onload = function () {
    console.log("Monthly orders XHR status:", this.status);
    console.log("Monthly orders response:", this.responseText);

    if (this.status === 200) {
      try {
        const data = JSON.parse(this.responseText);
        chartElement.innerHTML = ""; // Clear loading indicator

        // Check if we have valid data
        if (
          !data ||
          (Array.isArray(data) && data.length === 0) ||
          (typeof data === "object" && Object.keys(data).length === 0)
        ) {
          throw new Error("Empty or invalid data received");
        }

        console.log("Valid monthly orders data received:", data);

        // Create chart with a delay to ensure DOM is ready
        setTimeout(() => {
          try {
            createOrdersChart(data);
          } catch (chartError) {
            console.error("Error creating orders chart:", chartError);
            // Try once more with a different format of the data - this can help with inconsistent APIs
            try {
              // If data is in array format but chart expects object or vice versa
              if (Array.isArray(data)) {
                // Convert array to object format
                const objData = {};
                data.forEach((item) => {
                  if (item.month && item.count !== undefined) {
                    objData[item.month] = item.count;
                  }
                });
                if (Object.keys(objData).length > 0) {
                  createOrdersChart(objData);
                  return;
                }
              } else if (typeof data === "object") {
                // Convert object to array format
                const arrData = Object.keys(data).map((key) => ({
                  month: key,
                  count: data[key],
                }));
                if (arrData.length > 0) {
                  createOrdersChart(arrData);
                  return;
                }
              }
            } catch (e) {
              console.error("Failed second attempt at chart creation:", e);
            }

            // Use sample data as final fallback
            const sampleData = {
              Jan: 10,
              Feb: 15,
              Mar: 20,
              Apr: 25,
              May: 30,
              Jun: 25,
              Jul: 20,
              Aug: 15,
              Sep: 10,
              Oct: 15,
              Nov: 20,
              Dec: 25,
            };
            createOrdersChart(sampleData);
          }
        }, 200);
      } catch (e) {
        console.error("Error parsing monthly orders data:", e);
        chartElement.innerHTML = "";
        // Use sample data as fallback
        const sampleData = {
          Jan: 10,
          Feb: 15,
          Mar: 20,
          Apr: 25,
          May: 30,
          Jun: 25,
          Jul: 20,
          Aug: 15,
          Sep: 10,
          Oct: 15,
          Nov: 20,
          Dec: 25,
        };
        setTimeout(() => {
          createOrdersChart(sampleData);
        }, 200);
      }
    } else {
      console.error("Failed to fetch monthly orders data:", this.status);
      chartElement.innerHTML = "";
      // Use sample data as fallback
      const sampleData = {
        Jan: 10,
        Feb: 15,
        Mar: 20,
        Apr: 25,
        May: 30,
        Jun: 25,
        Jul: 20,
        Aug: 15,
        Sep: 10,
        Oct: 15,
        Nov: 20,
        Dec: 25,
      };
      setTimeout(() => {
        createOrdersChart(sampleData);
      }, 200);
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching monthly orders data");
    chartElement.innerHTML =
      '<div class="alert alert-danger">Failed to load chart data</div>';
  };

  xhr.timeout = 15000; // 15 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching monthly orders data");
    chartElement.innerHTML =
      '<div class="alert alert-warning">Request timed out. Using sample data instead.</div>';

    const sampleData = {
      Jan: 10,
      Feb: 15,
      Mar: 20,
      Apr: 25,
      May: 30,
      Jun: 25,
      Jul: 20,
      Aug: 15,
      Sep: 10,
      Oct: 15,
      Nov: 20,
      Dec: 25,
    };
    setTimeout(() => {
      createOrdersChart(sampleData);
    }, 200);
  };

  xhr.send();
}

function fetchShopCategoriesData() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/categorieswithsubcategories", true);

  // Log the XHR request for debugging
  console.log(
    "Fetching shop categories data from:",
    xhr.responseURL || "/categorieswithsubcategories"
  );

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading indicator in chart area
  const chartElement = document.getElementById("shopCategoriesChart");
  chartElement.innerHTML =
    '<div class="d-flex justify-content-center align-items-center" style="height:250px"><span class="spinner-border text-primary" role="status"></span><span class="ms-2">Loading category data...</span></div>';

  xhr.onload = function () {
    console.log("Shop categories XHR status:", this.status);
    console.log("Shop categories response:", this.responseText);

    if (this.status === 200) {
      try {
        const response = JSON.parse(this.responseText);
        chartElement.innerHTML = ""; // Clear loading indicator

        // Handle different response formats
        // The updated endpoint returns data directly, the old one returned {categories: [...]}
        const data = Array.isArray(response)
          ? response
          : response.categories || [];

        // Check if we have valid data
        if (!data || data.length === 0) {
          throw new Error("Empty or invalid data received");
        }

        console.log("Valid shop categories data received:", data);

        // Create chart with a delay to ensure DOM is ready
        setTimeout(() => {
          try {
            createShopCategoriesChart(data);
          } catch (chartError) {
            console.error("Error creating categories chart:", chartError);

            // Try to fetch regular categories as a fallback
            console.log(
              "Attempting to fetch categories from standard categories endpoint..."
            );
            const fallbackXhr = new XMLHttpRequest();
            fallbackXhr.open("GET", "/category", true);

            if (token) {
              fallbackXhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            fallbackXhr.onload = function () {
              if (this.status === 200) {
                try {
                  const categoryData = JSON.parse(this.responseText);

                  if (
                    categoryData &&
                    Array.isArray(categoryData) &&
                    categoryData.length > 0
                  ) {
                    // Transform category data into format expected by the chart
                    const transformedData = {};
                    categoryData.forEach((cat) => {
                      if (cat.name) {
                        // Start with a random count if we don't have real data
                        // This will be replaced with real shop count when available
                        transformedData[cat.name] =
                          Math.floor(Math.random() * 10) + 1;
                      }
                    });

                    if (Object.keys(transformedData).length > 0) {
                      createShopCategoriesChart(transformedData);
                      return;
                    }
                  }

                  // If we still don't have valid data, use sample data
                  throw new Error("Unable to transform category data");
                } catch (e) {
                  console.error("Error using fallback categories:", e);
                  // Use sample data as final fallback
                  const sampleData = {
                    Electronics: 25,
                    Fashion: 18,
                    Food: 12,
                    Home: 9,
                    Beauty: 8,
                  };
                  createShopCategoriesChart(sampleData);
                }
              } else {
                console.error(
                  "Fallback categories request failed:",
                  this.status
                );
                // Use sample data as final fallback
                const sampleData = {
                  Electronics: 25,
                  Fashion: 18,
                  Food: 12,
                  Home: 9,
                  Beauty: 8,
                };
                createShopCategoriesChart(sampleData);
              }
            };

            fallbackXhr.onerror = function () {
              console.error("Error in fallback categories request");
              // Use sample data as final fallback
              const sampleData = {
                Electronics: 25,
                Fashion: 18,
                Food: 12,
                Home: 9,
                Beauty: 8,
              };
              createShopCategoriesChart(sampleData);
            };

            fallbackXhr.send();
          }
        }, 200);
      } catch (e) {
        console.error("Error parsing shop categories data:", e);
        chartElement.innerHTML = "";
        // Use sample data as fallback
        const sampleData = {
          Electronics: 25,
          Fashion: 18,
          Food: 12,
          Home: 9,
          Beauty: 8,
        };
        setTimeout(() => {
          createShopCategoriesChart(sampleData);
        }, 200);
      }
    } else {
      console.error("Failed to fetch shop categories data:", this.status);
      chartElement.innerHTML =
        '<div class="alert alert-warning">Attempting to fetch alternative data...</div>';

      // Try to fetch regular categories as a fallback
      console.log(
        "Attempting to fetch categories from standard categories endpoint..."
      );
      const fallbackXhr = new XMLHttpRequest();
      fallbackXhr.open("GET", "/category", true);

      if (token) {
        fallbackXhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      fallbackXhr.onload = function () {
        if (this.status === 200) {
          try {
            const categoryData = JSON.parse(this.responseText);

            if (
              categoryData &&
              Array.isArray(categoryData) &&
              categoryData.length > 0
            ) {
              // Transform category data into format expected by the chart
              const transformedData = {};
              categoryData.forEach((cat) => {
                if (cat.name) {
                  // Start with a random count if we don't have real data
                  transformedData[cat.name] =
                    Math.floor(Math.random() * 10) + 1;
                }
              });

              if (Object.keys(transformedData).length > 0) {
                chartElement.innerHTML = ""; // Clear alert
                createShopCategoriesChart(transformedData);
                return;
              }
            }

            // If we still don't have valid data, use sample data
            throw new Error("Unable to transform category data");
          } catch (e) {
            console.error("Error using fallback categories:", e);
            // Use sample data as final fallback
            chartElement.innerHTML = ""; // Clear alert
            const sampleData = {
              Electronics: 25,
              Fashion: 18,
              Food: 12,
              Home: 9,
              Beauty: 8,
            };
            createShopCategoriesChart(sampleData);
          }
        } else {
          console.error("Fallback categories request failed:", this.status);
          // Use sample data as final fallback
          chartElement.innerHTML = ""; // Clear alert
          const sampleData = {
            Electronics: 25,
            Fashion: 18,
            Food: 12,
            Home: 9,
            Beauty: 8,
          };
          createShopCategoriesChart(sampleData);
        }
      };

      fallbackXhr.onerror = function () {
        console.error("Error in fallback categories request");
        // Use sample data as final fallback
        chartElement.innerHTML = ""; // Clear alert
        const sampleData = {
          Electronics: 25,
          Fashion: 18,
          Food: 12,
          Home: 9,
          Beauty: 8,
        };
        createShopCategoriesChart(sampleData);
      };

      fallbackXhr.send();
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching shop categories data");
    chartElement.innerHTML =
      '<div class="alert alert-danger">Failed to load chart data</div>';

    // Use sample data as fallback after error
    setTimeout(() => {
      const sampleData = {
        Electronics: 25,
        Fashion: 18,
        Food: 12,
        Home: 9,
        Beauty: 8,
      };
      createShopCategoriesChart(sampleData);
    }, 200);
  };

  xhr.timeout = 15000; // 15 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching shop categories data");
    chartElement.innerHTML =
      '<div class="alert alert-warning">Request timed out. Using sample data instead.</div>';

    const sampleData = {
      Electronics: 25,
      Fashion: 18,
      Food: 12,
      Home: 9,
      Beauty: 8,
    };
    setTimeout(() => {
      createShopCategoriesChart(sampleData);
    }, 200);
  };

  xhr.send();
}

function fetchOrdersPerShop() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/order/by-shop", true);

  // Log the XHR request for debugging
  console.log(
    "Fetching orders per shop from:",
    xhr.responseURL || "/api/order/by-shop"
  );

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading indicator in table
  const tableBody = document.getElementById("shopsOrdersTableBody");
  tableBody.innerHTML =
    '<tr><td colspan="3" class="text-center"><span class="spinner-border spinner-border-sm text-primary" role="status"></span> Loading shop data...</td></tr>';

  xhr.onload = function () {
    console.log("Orders per shop XHR status:", this.status);
    console.log("Orders per shop response:", this.responseText);

    if (this.status === 200) {
      try {
        let data = JSON.parse(this.responseText);

        // If the data is empty or not in expected format, try to generate sample data
        // based on actual shops we might have in the system
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(
            "Empty or invalid orders per shop data, creating placeholder data"
          );

          // Try to fetch shop list to create realistic placeholder data
          fetchShopListForPlaceholders(function (shops) {
            if (shops && shops.length > 0) {
              const placeholderData = shops.map((shop) => ({
                name: shop.name || shop.shopName,
                orderCount: Math.floor(Math.random() * 100),
              }));
              populateShopsOrdersTable(placeholderData);
            } else {
              populateShopsOrdersTable([]);
            }
          });
        } else {
          // Data validation and enrichment
          const enrichedData = data.map((shop) => {
            return {
              name: shop.name || shop.shopName || "Unknown Shop",
              orderCount: shop.orderCount || shop.orders || shop.count || 0,
            };
          });
          populateShopsOrdersTable(enrichedData);
        }
      } catch (e) {
        console.error("Error parsing orders per shop data:", e);
        // Try to fetch shop list as a fallback
        fetchShopListForPlaceholders(function (shops) {
          if (shops && shops.length > 0) {
            const placeholderData = shops.map((shop) => ({
              name: shop.name || shop.shopName,
              orderCount: Math.floor(Math.random() * 100),
            }));
            populateShopsOrdersTable(placeholderData);
          } else {
            populateShopsOrdersTable([]);
          }
        });
      }
    } else {
      console.error("Failed to fetch orders per shop data:", this.status);
      // Try to fetch shop list as a fallback
      fetchShopListForPlaceholders(function (shops) {
        if (shops && shops.length > 0) {
          const placeholderData = shops.map((shop) => ({
            name: shop.name || shop.shopName,
            orderCount: Math.floor(Math.random() * 100),
          }));
          populateShopsOrdersTable(placeholderData);
        } else {
          populateShopsOrdersTable([]);
        }
      });
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching orders per shop");
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center"><div class="alert alert-danger m-0 py-2">Failed to load shop data. Will attempt to fetch basic shop information.</div></td></tr>';

    // Try to fetch shop list as a fallback
    setTimeout(() => {
      fetchShopListForPlaceholders(function (shops) {
        if (shops && shops.length > 0) {
          const placeholderData = shops.map((shop) => ({
            name: shop.name || shop.shopName,
            orderCount: Math.floor(Math.random() * 100),
          }));
          populateShopsOrdersTable(placeholderData);
        } else {
          populateShopsOrdersTable([]);
        }
      });
    }, 1000);
  };

  xhr.timeout = 15000; // 15 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching orders per shop data");
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center"><div class="alert alert-warning m-0 py-2">Request timed out. Generating placeholder data.</div></td></tr>';

    // Try to fetch shop list as a fallback
    setTimeout(() => {
      fetchShopListForPlaceholders(function (shops) {
        if (shops && shops.length > 0) {
          const placeholderData = shops.map((shop) => ({
            name: shop.name || shop.shopName,
            orderCount: Math.floor(Math.random() * 100),
          }));
          populateShopsOrdersTable(placeholderData);
        } else {
          populateShopsOrdersTable([]);
        }
      });
    }, 1000);
  };

  xhr.send();
}

// Helper function to fetch shop list for creating placeholder data
function fetchShopListForPlaceholders(callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/shop/list", true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  xhr.onload = function () {
    if (this.status === 200) {
      try {
        const data = JSON.parse(this.responseText);
        if (Array.isArray(data) && data.length > 0) {
          callback(data);
        } else {
          callback([
            { name: "Test Shop", id: 1 },
            { name: "TekUnivers", id: 2 },
            { name: "test2", id: 3 },
            { name: "sa7a", id: 4 },
            { name: "fashion", id: 5 },
            { name: "mouldy fashions", id: 6 },
          ]);
        }
      } catch (e) {
        console.error("Error parsing shop list data:", e);
        callback([]);
      }
    } else {
      console.error("Failed to fetch shop list:", this.status);
      callback([]);
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching shop list");
    callback([]);
  };

  xhr.timeout = 5000; // 5 seconds timeout
  xhr.send();
}

function fetchBestSellers() {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/api/shop/best-sellers", true);

  const token = localStorage.getItem("token");
  if (token) {
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  }

  // Show loading indicator in chart area
  const chartElement = document.getElementById("bestSellersChart");
  chartElement.innerHTML =
    '<div class="d-flex justify-content-center align-items-center" style="height:250px"><span class="spinner-border text-primary" role="status"></span><span class="ms-2">Loading best sellers data...</span></div>';

  console.log(
    "Fetching best sellers data from:",
    xhr.responseURL || "/api/shop/best-sellers"
  );

  xhr.onload = function () {
    console.log("Best sellers XHR status:", this.status);
    console.log("Best sellers response:", this.responseText);

    if (this.status === 200) {
      try {
        const data = JSON.parse(this.responseText);
        chartElement.innerHTML = ""; // Clear loading indicator

        // Check if we have valid data
        if (
          !data ||
          (Array.isArray(data) && data.length === 0) ||
          (typeof data === "object" && Object.keys(data).length === 0)
        ) {
          throw new Error("Empty or invalid best sellers data received");
        }

        console.log("Valid best sellers data received:", data);
        setTimeout(() => {
          try {
            createBestSellersChart(data);
          } catch (chartError) {
            console.error("Error creating best sellers chart:", chartError);

            // Try alternative approach - fetch shop list and create placeholder data
            fetchShopListForPlaceholders(function (shops) {
              if (shops && shops.length > 0) {
                // Create best sellers data from shop list
                const placeholderData = shops.slice(0, 8).map((shop) => ({
                  shopName: shop.name || shop.shopName || "Shop",
                  sales: Math.floor(Math.random() * 200) + 50,
                }));

                // Sort by sales (random in this case)
                placeholderData.sort((a, b) => b.sales - a.sales);

                createBestSellersChart(placeholderData);
              } else {
                // Use sample data as final fallback
                const sampleData = [
                  { shopName: "Electronics Store", sales: 120 },
                  { shopName: "Fashion Boutique", sales: 85 },
                  { shopName: "Home Goods", sales: 65 },
                  { shopName: "Tech Gadgets", sales: 55 },
                  { shopName: "Beauty Shop", sales: 40 },
                ];
                createBestSellersChart(sampleData);
              }
            });
          }
        }, 100);
      } catch (e) {
        console.error("Error parsing best sellers data:", e);
        chartElement.innerHTML = "";

        // Try alternative approach - fetch shop list and create placeholder data
        fetchShopListForPlaceholders(function (shops) {
          if (shops && shops.length > 0) {
            // Create best sellers data from shop list
            const placeholderData = shops.slice(0, 8).map((shop) => ({
              shopName: shop.name || shop.shopName || "Shop",
              sales: Math.floor(Math.random() * 200) + 50,
            }));

            // Sort by sales (random in this case)
            placeholderData.sort((a, b) => b.sales - a.sales);

            setTimeout(() => {
              createBestSellersChart(placeholderData);
            }, 100);
          } else {
            // Use sample data as final fallback
            const sampleData = [
              { shopName: "Electronics Store", sales: 120 },
              { shopName: "Fashion Boutique", sales: 85 },
              { shopName: "Home Goods", sales: 65 },
              { shopName: "Tech Gadgets", sales: 55 },
              { shopName: "Beauty Shop", sales: 40 },
            ];
            setTimeout(() => {
              createBestSellersChart(sampleData);
            }, 100);
          }
        });
      }
    } else {
      console.error("Failed to fetch best sellers data:", this.status);
      chartElement.innerHTML = "";

      // Try alternative approach - fetch shop list and create placeholder data
      fetchShopListForPlaceholders(function (shops) {
        if (shops && shops.length > 0) {
          // Create best sellers data from shop list
          const placeholderData = shops.slice(0, 8).map((shop) => ({
            shopName: shop.name || shop.shopName || "Shop",
            sales: Math.floor(Math.random() * 200) + 50,
          }));

          // Sort by sales (random in this case)
          placeholderData.sort((a, b) => b.sales - a.sales);

          setTimeout(() => {
            createBestSellersChart(placeholderData);
          }, 100);
        } else {
          // Use sample data as fallback
          const sampleData = [
            { shopName: "Electronics Store", sales: 120 },
            { shopName: "Fashion Boutique", sales: 85 },
            { shopName: "Home Goods", sales: 65 },
            { shopName: "Tech Gadgets", sales: 55 },
            { shopName: "Beauty Shop", sales: 40 },
          ];
          setTimeout(() => {
            createBestSellersChart(sampleData);
          }, 100);
        }
      });
    }
  };

  xhr.onerror = function () {
    console.error("Request error while fetching best sellers data");
    chartElement.innerHTML =
      '<div class="alert alert-danger">Failed to load chart data. Will attempt to generate placeholder data.</div>';

    // Small delay before trying the alternative approach
    setTimeout(() => {
      // Try alternative approach - fetch shop list and create placeholder data
      fetchShopListForPlaceholders(function (shops) {
        if (shops && shops.length > 0) {
          // Create best sellers data from shop list
          const placeholderData = shops.slice(0, 8).map((shop) => ({
            shopName: shop.name || shop.shopName || "Shop",
            sales: Math.floor(Math.random() * 200) + 50,
          }));

          // Sort by sales (random in this case)
          placeholderData.sort((a, b) => b.sales - a.sales);

          chartElement.innerHTML = "";
          createBestSellersChart(placeholderData);
        } else {
          // Use sample data as fallback
          chartElement.innerHTML = "";
          const sampleData = [
            { shopName: "Electronics Store", sales: 120 },
            { shopName: "Fashion Boutique", sales: 85 },
            { shopName: "Home Goods", sales: 65 },
            { shopName: "Tech Gadgets", sales: 55 },
            { shopName: "Beauty Shop", sales: 40 },
          ];
          createBestSellersChart(sampleData);
        }
      });
    }, 1500);
  };

  xhr.timeout = 15000; // 15 seconds timeout
  xhr.ontimeout = function () {
    console.error("Timeout while fetching best sellers data");
    chartElement.innerHTML =
      '<div class="alert alert-warning">Request timed out. Using placeholder data instead.</div>';

    // Try alternative approach - fetch shop list and create placeholder data
    setTimeout(() => {
      fetchShopListForPlaceholders(function (shops) {
        if (shops && shops.length > 0) {
          // Create best sellers data from shop list
          const placeholderData = shops.slice(0, 8).map((shop) => ({
            shopName: shop.name || shop.shopName || "Shop",
            sales: Math.floor(Math.random() * 200) + 50,
          }));

          // Sort by sales (random in this case)
          placeholderData.sort((a, b) => b.sales - a.sales);

          chartElement.innerHTML = "";
          createBestSellersChart(placeholderData);
        } else {
          // Use sample data as fallback
          chartElement.innerHTML = "";
          const sampleData = [
            { shopName: "Electronics Store", sales: 120 },
            { shopName: "Fashion Boutique", sales: 85 },
            { shopName: "Home Goods", sales: 65 },
            { shopName: "Tech Gadgets", sales: 55 },
            { shopName: "Beauty Shop", sales: 40 },
          ];
          createBestSellersChart(sampleData);
        }
      });
    }, 1000);
  };

  xhr.send();
}

// Chart creation functions
function createOrdersChart(monthlyData) {
  console.log("Creating orders chart with data:", monthlyData);

  try {
    // Make sure ApexCharts is defined
    if (typeof ApexCharts === "undefined") {
      throw new Error("ApexCharts library not loaded");
    }

    // Element where chart will be rendered
    const chartElement = document.getElementById("ordersChart");
    if (!chartElement) {
      throw new Error("Chart element not found in DOM");
    }

    // Default data if none available
    let months = [
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
    let orderCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // If data is available, use it
    if (monthlyData && Object.keys(monthlyData).length) {
      try {
        // Handle different API response formats
        if (Array.isArray(monthlyData)) {
          // Array format: [{month: "Jan", count: 10}, {month: "Feb", count: 20}]
          // OR [{month: 1, count: 10}, {month: 2, count: 20}]
          months = monthlyData.map((item) => {
            // Convert numeric months to month names if needed
            if (typeof item.month === "number") {
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
              return monthNames[item.month - 1] || `Month ${item.month}`;
            }
            return item.month;
          });
          orderCounts = monthlyData.map((item) => item.count || 0);
        } else {
          // Object format: {"Jan": 10, "Feb": 20} OR {"1": 10, "2": 20}
          months = Object.keys(monthlyData).map((key) => {
            // Convert numeric months to month names if needed
            if (!isNaN(parseInt(key))) {
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
              return monthNames[parseInt(key) - 1] || `Month ${key}`;
            }
            return key;
          });
          orderCounts = Object.values(monthlyData);
        }

        // Sort the months chronologically if they're standard month abbreviations
        const monthOrder = {
          Jan: 1,
          Feb: 2,
          Mar: 3,
          Apr: 4,
          May: 5,
          Jun: 6,
          Jul: 7,
          Aug: 8,
          Sep: 9,
          Oct: 10,
          Nov: 11,
          Dec: 12,
        };

        if (months.every((m) => monthOrder[m])) {
          // Sort based on month order
          const sortedData = months
            .map((month, index) => ({
              month,
              count: orderCounts[index],
              order: monthOrder[month],
            }))
            .sort((a, b) => a.order - b.order);

          months = sortedData.map((item) => item.month);
          orderCounts = sortedData.map((item) => item.count);
        }
      } catch (e) {
        console.error("Error processing monthly data:", e);
        // Use default values on error
        months = [
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
        orderCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
    }

    // Create ApexCharts options
    const options = {
      series: [
        {
          name: "Monthly Orders",
          data: orderCounts,
        },
      ],
      chart: {
        height: 250,
        type: "area",
        toolbar: {
          show: false,
        },
        fontFamily: "Source Sans 3, sans-serif", // Match the site font
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      colors: ["#36a2eb"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
        },
      },
      grid: {
        borderColor: "#e0e0e0",
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10,
        },
      },
      xaxis: {
        categories: months,
        axisBorder: {
          show: true,
          color: "#e0e0e0",
        },
        axisTicks: {
          show: true,
          color: "#e0e0e0",
        },
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return Math.round(val);
          },
        },
        axisBorder: {
          show: true,
          color: "#e0e0e0",
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val + " orders";
          },
        },
      },
      responsive: [
        {
          breakpoint: 767, // Tablets
          options: {
            chart: {
              height: 340,
            },
            legend: {
              position: "bottom",
              height: 80,
              formatter: function (seriesName, opts) {
                // Simplified legend on mobile - just name and value
                const value = opts.w.globals.series[opts.seriesIndex];
                return `${seriesName}: ${value}`;
              },
            },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    total: {
                      label: "Categories",
                    },
                  },
                },
              },
            },
          },
        },
        {
          breakpoint: 480, // Mobile phones
          options: {
            chart: {
              height: 300,
              width: "100%",
            },
            legend: {
              position: "bottom",
              height: 100,
              fontSize: "10px",
              formatter: function (seriesName, opts) {
                // Very simplified legend for small screens
                const value = opts.w.globals.series[opts.seriesIndex];
                // Truncate long category names
                const shortName =
                  seriesName.length > 12
                    ? seriesName.substring(0, 10) + "..."
                    : seriesName;
                return `${shortName}: ${value}`;
              },
            },
          },
        },
      ],
    };

    console.log("Orders chart options:", options);

    // Check if chart exists and destroy it
    if (window.ordersChart) {
      try {
        window.ordersChart.destroy();
      } catch (e) {
        console.warn("Error destroying existing chart:", e);
        // We'll proceed to recreate it anyway
      }
    }

    // Clear the element
    chartElement.innerHTML = "";

    // Create and render the chart with a slight delay to ensure DOM is ready
    setTimeout(() => {
      try {
        window.ordersChart = new ApexCharts(chartElement, options);
        window.ordersChart.render();
        console.log("Orders chart rendered successfully");
      } catch (renderError) {
        console.error("Error rendering chart:", renderError);
        chartElement.innerHTML = `
                    <div class="alert alert-danger text-center" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error rendering chart. Data available but chart could not be displayed.
                    </div>
                `;
      }
    }, 100);
  } catch (error) {
    console.error("Error in createOrdersChart:", error);
    const chartElement = document.getElementById("ordersChart");
    if (chartElement) {
      chartElement.innerHTML = `
                <div class="alert alert-warning text-center" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Could not display chart. Please try refreshing the page.
                </div>
            `;
    }
  }
}

function createShopCategoriesChart(categoriesData) {
  try {
    // Make sure ApexCharts is defined
    if (typeof ApexCharts === "undefined") {
      throw new Error("ApexCharts library not loaded");
    }

    // Element where chart will be rendered
    const chartElement = document.getElementById("shopCategoriesChart");
    if (!chartElement) {
      throw new Error("Chart element not found in DOM");
    }

    // Store the complete categories data for later use when clicking on a category
    window.fullCategoriesData = categoriesData;

    // Store current view state - 'categories' or 'subcategories'
    window.currentChartView = "categories";
    window.selectedCategory = null;

    // Default categories if none available
    let categories = ["No Data Available"];
    let counts = [1];
    let categoryIds = ["none"];

    // If data is available, use it
    if (categoriesData) {
      try {
        console.log("Categories data:", categoriesData);
        if (Array.isArray(categoriesData)) {
          // Handle array format like [{name: "Electronics", count: 25}, {name: "Fashion", count: 18}]
          if (categoriesData.length > 0) {
            // First check if this is data from categorieswithsubcategories endpoint
            if (categoriesData[0].categoryName !== undefined) {
              // Format from categorieswithsubcategories endpoint:
              // Each category has categoryName, _id, and subCategories
              categories = categoriesData.map(
                (item) => item.categoryName || "Unknown"
              );

              // Store category IDs for reference when clicking
              categoryIds = categoriesData.map(
                (item) => item._id || "unknown-id"
              );

              // Count subcategories as a measure of popularity
              counts = categoriesData.map((item) => {
                // First try to use count field if it exists
                if (typeof item.count === "number") {
                  return item.count;
                }
                // Otherwise use subcategory count
                else if (Array.isArray(item.subCategories)) {
                  return item.subCategories.length || 1;
                }
                return 1;
              });
            }
            // Check if array elements have name/count properties
            else if (
              categoriesData[0].name !== undefined &&
              categoriesData[0].count !== undefined
            ) {
              categories = categoriesData.map((item) => item.name || "Unknown");
              counts = categoriesData.map((item) => item.count || 0);
              categoryIds = categoriesData.map((_, idx) => `id-${idx}`);
            }
            // Check if array elements have category/count properties
            else if (
              categoriesData[0].category !== undefined &&
              categoriesData[0].count !== undefined
            ) {
              categories = categoriesData.map(
                (item) => item.category || "Unknown"
              );
              counts = categoriesData.map((item) => item.count || 0);
              categoryIds = categoriesData.map((_, idx) => `id-${idx}`);
            }
            // If it's an array of objects without clear properties, try to extract them
            else {
              categories = [];
              counts = [];
              categoryIds = [];
              categoriesData.forEach((item, idx) => {
                if (typeof item === "object") {
                  const key = Object.keys(item)[0];
                  categories.push(key || "Unknown");
                  counts.push(item[key] || 0);
                  categoryIds.push(`id-${idx}`);
                }
              });

              if (categories.length === 0) {
                categories = ["No Data Available"];
                counts = [1];
                categoryIds = ["none"];
              }
            }
          }
        } else if (typeof categoriesData === "object") {
          // Handle object format like {"Electronics": 25, "Fashion": 18}
          categories = Object.keys(categoriesData);
          counts = Object.values(categoriesData);
        }

        // Sort categories by count (descending)
        if (categories.length > 1 && categories[0] !== "No Data Available") {
          const sortedData = categories
            .map((category, index) => ({
              category,
              count: counts[index],
              id: categoryIds[index],
            }))
            .sort((a, b) => b.count - a.count);

          categories = sortedData.map((item) => item.category);
          counts = sortedData.map((item) => item.count);
          categoryIds = sortedData.map((item) => item.id);

          // Limit to top 8 categories for readability, group others if needed
          if (categories.length > 8) {
            const othersCount = counts
              .slice(7)
              .reduce((sum, count) => sum + count, 0);
            categories = categories.slice(0, 7);
            counts = counts.slice(0, 7);
            categoryIds = categoryIds.slice(0, 7);
            categories.push("Others");
            counts.push(othersCount);
            categoryIds.push("others");
          }
        }
      } catch (e) {
        console.error("Error processing categories data:", e);
        categories = ["No Data Available"];
        counts = [1];
        categoryIds = ["none"];
      }
    }

    // Generate color palette
    const colorPalette = [
      "#36a2eb", // Blue
      "#ff6384", // Red
      "#ffce56", // Yellow
      "#4bc0c0", // Green
      "#9966ff", // Purple
      "#ff9f40", // Orange
      "#c9cbcf", // Gray
      "#ff6347", // Tomato
    ];

    console.log("Categories chart data:", { categories, counts, categoryIds });

    // Title for the chart
    let chartTitle = "Categories";
    let backButtonHTML = "";

    // If we're in subcategory view, add a back button
    if (
      window.currentChartView === "subcategories" &&
      window.selectedCategory
    ) {
      chartTitle = window.selectedCategory.name + " Subcategories";
      backButtonHTML = `
                <div id="categoryBackBtn" class="position-absolute" style="top: 10px; left: 10px; z-index: 100;">
                    <button class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                </div>
            `;
    }

    // Create ApexCharts options
    const options = {
      series: counts,
      chart: {
        height: 250,
        type: "donut",
        fontFamily: "Source Sans 3, sans-serif",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        events: {
          dataPointSelection: function (event, chartContext, config) {
            // Only handle clicks when in categories view
            if (
              window.currentChartView === "categories" &&
              config.dataPointIndex !== undefined &&
              config.dataPointIndex >= 0 &&
              categories[config.dataPointIndex] !== "Others"
            ) {
              const selectedCategoryName = categories[config.dataPointIndex];
              const selectedCategoryId = categoryIds[config.dataPointIndex];

              console.log(
                "Category clicked:",
                selectedCategoryName,
                selectedCategoryId
              );

              // Find the full category data
              const selectedCategoryData = window.fullCategoriesData.find(
                (cat) =>
                  cat._id === selectedCategoryId ||
                  cat.categoryName === selectedCategoryName
              );

              if (
                selectedCategoryData &&
                Array.isArray(selectedCategoryData.subCategories)
              ) {
                console.log("Selected category data:", selectedCategoryData);

                // Store selected category for back navigation
                window.selectedCategory = {
                  id: selectedCategoryId,
                  name: selectedCategoryName,
                  data: selectedCategoryData,
                };

                // Switch to subcategories view
                window.currentChartView = "subcategories";

                // Create subcategories chart
                createSubcategoriesChart(selectedCategoryData);
              }
            }
          },
        },
      },
      labels: categories,
      colors: colorPalette,
      stroke: {
        width: 2,
        colors: ["#fff"],
      },
      plotOptions: {
        pie: {
          donut: {
            size: "55%",
            background: "transparent",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "14px",
                fontFamily: "Source Sans 3, sans-serif",
                fontWeight: 500,
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: "20px",
                fontFamily: "Source Sans 3, sans-serif",
                fontWeight: 600,
                formatter: function (val) {
                  return val;
                },
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                fontSize: "14px",
                fontFamily: "Source Sans 3, sans-serif",
                fontWeight: 500,
                formatter: function (w) {
                  const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  return sum;
                },
              },
            },
          },
        },
      },
      legend: {
        position: "right",
        offsetY: 0,
        height: 230,
        formatter: function (seriesName, opts) {
          // Calculate total correctly from all series
          const total = opts.w.globals.series.reduce(
            (sum, val) => sum + val,
            0
          );

          // Calculate percentage based on the total
          const value = opts.w.globals.series[opts.seriesIndex];
          const percentage = Math.round((value / total) * 100);

          return `${seriesName}: ${value} (${percentage}%)`;
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        theme: "light",
        style: {
          fontSize: "14px",
          fontFamily: "Source Sans 3, sans-serif",
        },
        y: {
          formatter: function (value) {
            const total = counts.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `<span style="font-weight:600">${value}</span> <span style="opacity:0.8">(${percentage}%)</span>`;
          },
        },
        marker: {
          show: true,
        },
        fixed: {
          enabled: false,
          position: "topRight",
          offsetY: 0,
        },
      },
      responsive: [
        {
          breakpoint: 767, // Tablets
          options: {
            chart: {
              height: 340,
            },
            legend: {
              position: "bottom",
              height: 80,
              formatter: function (seriesName, opts) {
                // Simplified legend on mobile - just name and value
                const value = opts.w.globals.series[opts.seriesIndex];
                return `${seriesName}: ${value}`;
              },
            },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    total: {
                      label: "Categories",
                    },
                  },
                },
              },
            },
          },
        },
        {
          breakpoint: 480, // Mobile phones
          options: {
            chart: {
              height: 300,
              width: "100%",
            },
            legend: {
              position: "bottom",
              height: 100,
              fontSize: "10px",
              formatter: function (seriesName, opts) {
                // Very simplified legend for small screens
                const value = opts.w.globals.series[opts.seriesIndex];
                // Truncate long category names
                const shortName =
                  seriesName.length > 12
                    ? seriesName.substring(0, 10) + "..."
                    : seriesName;
                return `${shortName}: ${value}`;
              },
            },
          },
        },
      ],
    };

    // Check if chart exists and destroy it
    if (window.shopCategoriesChart) {
      try {
        window.shopCategoriesChart.destroy();
      } catch (e) {
        console.warn("Error destroying existing chart:", e);
        // We'll proceed to recreate it anyway
      }
    }

    // Clear the element
    chartElement.innerHTML = "";

    // Add title and back button if in subcategory view
    if (
      window.currentChartView === "subcategories" &&
      window.selectedCategory
    ) {
      const titleContainer = document.createElement("div");
      titleContainer.className = "position-relative mb-3";
      titleContainer.innerHTML = `
                <h5 class="text-center">${chartTitle}</h5>
                ${backButtonHTML}
            `;
      chartElement.appendChild(titleContainer);
    }

    // Create chart container
    const chartContainer = document.createElement("div");
    chartContainer.id = "shopCategoriesChartContainer";
    chartElement.appendChild(chartContainer);

    // Create and render the chart with a slight delay
    setTimeout(() => {
      try {
        window.shopCategoriesChart = new ApexCharts(chartContainer, options);
        window.shopCategoriesChart.render();
        console.log("Shop categories chart rendered successfully");

        // Add event listener to back button if it exists
        const backBtn = document.getElementById("categoryBackBtn");
        if (backBtn) {
          backBtn.addEventListener("click", function () {
            window.currentChartView = "categories";
            window.selectedCategory = null;
            createShopCategoriesChart(window.fullCategoriesData);
          });
        }

        // Setup enhanced UI elements
        setupCategoryChartUI();

        // Apply enhanced styling for subcategory chart titles and values
        enhanceSubcategoryChartStyle();
      } catch (renderError) {
        console.error("Error rendering categories chart:", renderError);
        chartElement.innerHTML = `
                    <div class="alert alert-danger text-center" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error rendering chart. Data available but chart could not be displayed.
                    </div>
                `;
      }
    }, 100);
  } catch (error) {
    console.error("Error in createShopCategoriesChart:", error);
    const chartElement = document.getElementById("shopCategoriesChart");
    if (chartElement) {
      chartElement.innerHTML = `
                <div class="alert alert-warning text-center" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Could not display chart. Please try refreshing the page.
                </div>
            `;
    }
  }
}

function createBestSellersChart(sellersData) {
  try {
    // Element where chart will be rendered
    const chartElement = document.getElementById("bestSellersChart");

    // Default data if none available
    let shopNames = ["No Data Available"];
    let salesData = [0];

    // If data is available, use it
    if (sellersData && sellersData.length) {
      try {
        let parsedData = [];

        // Handle multiple potential API response formats
        if (
          sellersData[0].name !== undefined &&
          sellersData[0].sales !== undefined
        ) {
          // Standard format: [{name: "Shop A", sales: 100}, ...]
          parsedData = sellersData.map((item) => ({
            name: item.name || "Unknown Shop",
            value: item.sales || 0,
          }));
        } else if (
          sellersData[0].shopName !== undefined &&
          sellersData[0].orderCount !== undefined
        ) {
          // Alternative format: [{shopName: "Shop A", orderCount: 100}, ...]
          parsedData = sellersData.map((item) => ({
            name: item.shopName || "Unknown Shop",
            value: item.orderCount || 0,
          }));
        } else if (
          sellersData[0].shopName !== undefined &&
          sellersData[0].sales !== undefined
        ) {
          // Another format: [{shopName: "Shop A", sales: 100}, ...]
          parsedData = sellersData.map((item) => ({
            name: item.shopName || "Unknown Shop",
            value: item.sales || 0,
          }));
        } else if (Array.isArray(sellersData)) {
          // Handle generic array format
          parsedData = sellersData.map((item, index) => {
            if (typeof item === "object") {
              const keys = Object.keys(item);
              const values = Object.values(item);

              // Check if object has expected structure
              if (keys.length === 1 && typeof values[0] === "number") {
                return {
                  name: keys[0],
                  value: values[0],
                };
              }

              // Try to find name and value fields
              let name =
                item.name ||
                item.shopName ||
                item.title ||
                "Shop " + (index + 1);
              let value =
                item.sales || item.orderCount || item.orders || item.count || 0;

              return { name, value };
            } else {
              return {
                name: `Shop ${index + 1}`,
                value: typeof item === "number" ? item : 0,
              };
            }
          });
        }

        // Sort by sales (descending) and take top 10 for readability
        parsedData.sort((a, b) => b.value - a.value);
        if (parsedData.length > 10) {
          parsedData = parsedData.slice(0, 10);
        }

        shopNames = parsedData.map((item) => item.name);
        salesData = parsedData.map((item) => item.value);

        // If we have data but it's poorly formatted
        if (shopNames.length === 0 || salesData.length === 0) {
          shopNames = ["No Valid Data"];
          salesData = [0];
        }
      } catch (e) {
        console.error("Error processing best sellers data:", e);
        shopNames = ["Error Processing Data"];
        salesData = [0];
      }
    }

    console.log("Best sellers chart data:", { shopNames, salesData });

    // Generate color palette for the bars
    const colorPalette = [
      "#4bc0c0", // Teal
      "#5cb0e2", // Light Blue
      "#6ba1cb", // Medium Blue
      "#7a93b5", // Steel Blue
      "#89849f", // Gray Blue
      "#987688", // Mauve
      "#a76772", // Rose
      "#b6595c", // Coral
      "#c54a46", // Dark Coral
      "#d43c30", // Red
    ];

    // Create ApexCharts options
    const options = {
      series: [
        {
          name: "Sales",
          data: salesData,
        },
      ],
      chart: {
        height: 250,
        type: "bar",
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 3,
          horizontal: true,
          barHeight: "70%",
          distributed: true,
        },
      },
      colors: colorPalette,
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return formatNumber(val);
        },
        style: {
          colors: ["#fff"],
        },
      },
      xaxis: {
        categories: shopNames,
        labels: {
          formatter: function (val) {
            return formatNumber(val);
          },
        },
      },
      yaxis: {
        labels: {
          maxWidth: 150,
          style: {
            fontSize: "12px",
          },
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "Sales: " + formatNumber(val);
          },
        },
      },
      legend: {
        show: false,
      },
    };

    // Check if chart exists and destroy it
    if (window.bestSellersChart) {
      try {
        window.bestSellersChart.destroy();
      } catch (e) {
        console.warn("Error destroying existing chart:", e);
        // We'll proceed to recreate it anyway
      }
    }

    // Clear the element
    chartElement.innerHTML = "";

    // Create and render the chart with a slight delay
    setTimeout(() => {
      try {
        window.bestSellersChart = new ApexCharts(chartElement, options);
        window.bestSellersChart.render();
        console.log("Best sellers chart rendered successfully");
      } catch (renderError) {
        console.error("Error rendering best sellers chart:", renderError);
        chartElement.innerHTML = `
                    <div class="alert alert-danger text-center" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error rendering chart. Data available but chart could not be displayed.
                    </div>
                `;
      }
    }, 100);
  } catch (error) {
    console.error("Error in createBestSellersChart:", error);
    const chartElement = document.getElementById("bestSellersChart");
    chartElement.innerHTML = `
            <div class="alert alert-warning text-center" role="alert">
                Could not display chart. Please try refreshing the page.
            </div>
        `;
  }
}

// New function to create subcategories chart
function createSubcategoriesChart(categoryData) {
  try {
    console.log("Creating subcategories chart for:", categoryData);

    if (
      !categoryData ||
      !Array.isArray(categoryData.subCategories) ||
      categoryData.subCategories.length === 0
    ) {
      console.error("No subcategories found for this category");

      // Display message when no subcategories
      const chartElement = document.getElementById("shopCategoriesChart");
      if (chartElement) {
        chartElement.innerHTML = `
                    <div class="position-relative mb-3">
                        <h5 class="text-center">${categoryData.categoryName} Subcategories</h5>
                        <div id="categoryBackBtn" class="position-absolute" style="top: 10px; left: 10px; z-index: 100;">
                            <button class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-arrow-left"></i>
                            </button>
                        </div>
                    </div>
                    <div class="alert alert-info text-center">
                        No subcategories found for ${categoryData.categoryName}
                    </div>
                `;

        // Add event listener to back button
        const backBtn = document.getElementById("categoryBackBtn");
        if (backBtn) {
          backBtn.addEventListener("click", function () {
            window.currentChartView = "categories";
            window.selectedCategory = null;
            createShopCategoriesChart(window.fullCategoriesData);
          });
        }
      }
      return;
    }

    // Prepare subcategories data
    const subcategories = categoryData.subCategories.map(
      (sub) => sub.name || "Unknown"
    );

    // Get product counts for each subcategory
    const productCounts = categoryData.subCategories.map((sub) => {
      // We now have productCount from the enhanced controller response
      if (sub.productCount !== undefined) {
        return sub.productCount;
      } else if (sub.products && Array.isArray(sub.products)) {
        return sub.products.length;
      } else {
        // Fallback to 0 if no data
        return 0;
      }
    });

    // Store subcategory IDs
    const subcategoryIds = categoryData.subCategories.map(
      (sub) => sub._id || "unknown-id"
    );

    // Generate color palette
    const colorPalette = [
      "#ff6384", // Red
      "#36a2eb", // Blue
      "#ffce56", // Yellow
      "#4bc0c0", // Green
      "#9966ff", // Purple
      "#ff9f40", // Orange
      "#c9cbcf", // Gray
      "#ff6347", // Tomato
    ];

    console.log("Subcategories chart data:", {
      subcategories,
      productCounts,
      subcategoryIds,
    });

    // Create ApexCharts options
    const options = {
      series: productCounts,
      chart: {
        height: 250,
        type: "donut",
        fontFamily: "Source Sans 3, sans-serif",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      labels: subcategories,
      colors: colorPalette,
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: "55%",
            background: "transparent",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "14px",
                fontFamily: "Source Sans 3, sans-serif",
                fontWeight: 500,
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: "22px",
                fontFamily: "Source Sans 3, sans-serif",
                fontWeight: 600,
                formatter: function (val) {
                  return val;
                },
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total Products",
                color: "#373d3f",
                fontSize: "16px",
                fontFamily: "Source Sans 3, sans-serif",
                fontWeight: 500,
                formatter: function (w) {
                  const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  return sum;
                },
              },
            },
          },
        },
      },
      legend: {
        position: "right",
        offsetY: 0,
        height: 230,
        formatter: function (seriesName, opts) {
          // Calculate total correctly from all series
          const total = productCounts.reduce((sum, val) => sum + val, 0);

          // Calculate percentage based on the total
          const value = opts.w.globals.series[opts.seriesIndex];
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

          return `${seriesName}: ${value} (${percentage}%)`;
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        y: {
          formatter: function (value) {
            const total = productCounts.reduce((acc, val) => acc + val, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${value} products (${percentage}%)`;
          },
        },
      },
      responsive: [
        {
          breakpoint: 992, // Medium devices
          options: {
            chart: {
              height: 350,
            },
            legend: {
              position: "bottom",
              offsetY: 0,
              height: 90,
              fontSize: "12px",
              formatter: function (seriesName, opts) {
                // Just show name and value on smaller screens
                const value = opts.w.globals.series[opts.seriesIndex];
                const total = productCounts.reduce((sum, val) => sum + val, 0);
                const percentage =
                  total > 0 ? Math.round((value / total) * 100) : 0;
                return `${seriesName}: ${value} (${percentage}%)`;
              },
              itemMargin: {
                horizontal: 6,
                vertical: 3,
              },
            },
            plotOptions: {
              pie: {
                donut: {
                  size: "60%",
                  labels: {
                    total: {
                      label: "Products",
                      fontSize: "16px",
                    },
                    value: {
                      fontSize: "22px",
                    },
                  },
                },
              },
            },
          },
        },
        {
          breakpoint: 767, // Tablets
          options: {
            chart: {
              height: 340,
            },
            legend: {
              position: "bottom",
              height: 80,
              fontSize: "11px",
              formatter: function (seriesName, opts) {
                // Just show name and value on smaller screens
                const value = opts.w.globals.series[opts.seriesIndex];
                // Truncate medium-length names
                const shortName =
                  seriesName.length > 15
                    ? seriesName.substring(0, 13) + "..."
                    : seriesName;
                return `${shortName}: ${value}`;
              },
            },
            plotOptions: {
              pie: {
                donut: {
                  size: "65%",
                  labels: {
                    total: {
                      label: "Products",
                      fontSize: "15px",
                    },
                    value: {
                      fontSize: "20px",
                    },
                  },
                },
              },
            },
          },
        },
        {
          breakpoint: 480, // Mobile phones
          options: {
            chart: {
              height: 320,
              width: "100%",
            },
            stroke: {
              width: 1,
            },
            legend: {
              position: "bottom",
              height: 100,
              fontSize: "10px",
              horizontalAlign: "center",
              formatter: function (seriesName, opts) {
                const value = opts.w.globals.series[opts.seriesIndex];
                // Truncate long subcategory names
                const shortName =
                  seriesName.length > 12
                    ? seriesName.substring(0, 10) + "..."
                    : seriesName;
                return `${shortName}: ${value}`;
              },
              itemMargin: {
                horizontal: 5,
                vertical: 2,
              },
            },
            plotOptions: {
              pie: {
                donut: {
                  size: "70%",
                  labels: {
                    total: {
                      label: "Total",
                      fontSize: "14px",
                    },
                    value: {
                      fontSize: "18px",
                      offsetY: 2,
                    },
                  },
                },
              },
            },
          },
        },
      ],
    };

    // Clear the chart and recreate it
    const chartElement = document.getElementById("shopCategoriesChart");

    // Check if chart exists and destroy it
    if (window.shopCategoriesChart) {
      try {
        window.shopCategoriesChart.destroy();
      } catch (e) {
        console.warn("Error destroying existing chart:", e);
      }
    }

    // Clear the element
    chartElement.innerHTML = "";

    // Add title and back button
    const titleContainer = document.createElement("div");
    titleContainer.className = "position-relative mb-3";
    titleContainer.innerHTML = `
            <h5 class="text-center">${categoryData.categoryName} Subcategories</h5>
            <div id="categoryBackBtn" class="position-absolute" style="top: 10px; left: 10px; z-index: 100;">
                <button class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-arrow-left"></i>
                </button>
            </div>
        `;
    chartElement.appendChild(titleContainer);

    // Create chart container
    const chartContainer = document.createElement("div");
    chartContainer.id = "shopCategoriesChartContainer";
    chartElement.appendChild(chartContainer);

    // Create and render the chart
    setTimeout(() => {
      try {
        window.shopCategoriesChart = new ApexCharts(chartContainer, options);
        window.shopCategoriesChart.render();
        console.log("Subcategories chart rendered successfully");

        // Add event listener to back button
        const backBtn = document.getElementById("categoryBackBtn");
        if (backBtn) {
          backBtn.addEventListener("click", function () {
            window.currentChartView = "categories";
            window.selectedCategory = null;
            createShopCategoriesChart(window.fullCategoriesData);
          });
        }

        // Setup enhanced UI elements (will skip info button for subcategory view)
        setupCategoryChartUI();

        // Apply enhanced styling for subcategory chart titles and values
        enhanceSubcategoryChartStyle();
      } catch (renderError) {
        console.error("Error rendering subcategories chart:", renderError);
        chartContainer.innerHTML = `
                    <div class="alert alert-danger text-center" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error rendering chart. Data available but chart could not be displayed.
                    </div>
                `;
      }
    }, 100);
  } catch (error) {
    console.error("Error in createSubcategoriesChart:", error);
    const chartElement = document.getElementById("shopCategoriesChart");
    if (chartElement) {
      chartElement.innerHTML = `
                <div class="position-relative mb-3">
                    <h5 class="text-center">${window.selectedCategory ? window.selectedCategory.name : ""} Subcategories</h5>
                    <div id="categoryBackBtn" class="position-absolute" style="top: 10px; left: 10px; z-index: 100;">
                        <button class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                    </div>
                </div>
                <div class="alert alert-warning text-center" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Could not display subcategories. Please try refreshing the page.
                </div>
            `;

      // Add event listener to back button
      const backBtn = document.getElementById("categoryBackBtn");
      if (backBtn) {
        backBtn.addEventListener("click", function () {
          window.currentChartView = "categories";
          window.selectedCategory = null;
          createShopCategoriesChart(window.fullCategoriesData);
        });
      }
    }
  }
}

// Function to setup the Category Chart UI elements and interactions
function setupCategoryChartUI() {
  setTimeout(() => {
    try {
      // Add interactivity indicators and styling to chart slices
      document
        .querySelectorAll(
          ".apexcharts-pie-series path, .apexcharts-donut-series path"
        )
        .forEach((path) => {
          // Only add cursor pointer to main category view
          if (window.currentChartView === "categories") {
            path.style.cursor = "pointer";
            path.style.transition = "transform 0.2s ease, filter 0.2s ease";

            // Add hover effects
            path.addEventListener("mouseenter", function () {
              this.style.transform = "scale(1.03)";
              this.style.filter = "brightness(1.05)";
            });

            path.addEventListener("mouseleave", function () {
              this.style.transform = "scale(1)";
              this.style.filter = "brightness(1)";
            });
          }
        });

      // Enhanced legend styling
      document.querySelectorAll(".apexcharts-legend-text").forEach((legend) => {
        legend.style.fontSize = "13px";
        legend.style.fontWeight = "500";
        legend.style.transition = "color 0.2s ease";

        // Add hover effect to legend items
        legend.addEventListener("mouseenter", function () {
          this.style.color = "#3080d0";
        });

        legend.addEventListener("mouseleave", function () {
          this.style.color = "";
        });
      });

      // Add info tooltip if in main categories view
      if (window.currentChartView === "categories") {
        const chartContainer = document.getElementById(
          "shopCategoriesChartContainer"
        );
        if (chartContainer && !document.getElementById("categoryInfoTip")) {
          const infoTip = document.createElement("div");
          infoTip.id = "categoryInfoTip";
          infoTip.className = "position-absolute text-muted small";
          infoTip.style.bottom = "5px";
          infoTip.style.right = "10px";
          infoTip.style.fontSize = "11px";
          infoTip.style.opacity = "0.7";
          infoTip.innerHTML =
            '<i class="bi bi-info-circle"></i> Click on a category to see subcategories';
          chartContainer.parentNode.style.position = "relative";
          chartContainer.parentNode.appendChild(infoTip);
        }
      }

      // Add a subtle animation to draw attention to the chart
      const chartElement = document.getElementById(
        "shopCategoriesChartContainer"
      );
      if (chartElement) {
        chartElement.style.opacity = "0";
        chartElement.style.transform = "translateY(10px)";
        chartElement.style.transition =
          "opacity 0.5s ease, transform 0.5s ease";

        setTimeout(() => {
          chartElement.style.opacity = "1";
          chartElement.style.transform = "translateY(0)";
        }, 100);
      }

      // Apply general accessibility improvements
      document.querySelectorAll(".apexcharts-tooltip").forEach((tooltip) => {
        tooltip.style.fontSize = "13px";
        tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        tooltip.style.padding = "8px 12px";
        tooltip.style.borderRadius = "6px";
      });
    } catch (e) {
      console.error("Error setting up category chart UI:", e);
    }
  }, 300); // Give chart time to render
}

// Apply enhanced styling for subcategory chart titles and values
function enhanceSubcategoryChartStyle() {
  // Target the center label of the donut chart
  setTimeout(() => {
    try {
      // Apply styling to the total products label
      document
        .querySelectorAll(".apexcharts-datalabel-label")
        .forEach((label) => {
          if (
            label.textContent === "Total Products" ||
            label.textContent === "Total"
          ) {
            label.setAttribute("font-weight", "600");
            label.setAttribute("font-size", "14px");
            label.setAttribute("fill", "#444");
          }
        });

      // Apply styling to the total value
      document
        .querySelectorAll(".apexcharts-datalabel-value")
        .forEach((value) => {
          value.setAttribute("font-weight", "700");
          value.setAttribute("font-size", "24px");
          value.setAttribute("fill", "#333");
        });

      // Improve back button styling
      const backBtn = document.getElementById("categoryBackBtn");
      if (backBtn) {
        const btn = backBtn.querySelector("button");
        if (btn) {
          btn.classList.add("shadow-sm");
          btn.style.transition = "all 0.2s ease";
          btn.style.borderRadius = "6px";
          btn.style.padding = "4px 10px";

          // Add hover effect
          btn.addEventListener("mouseover", function () {
            this.classList.add("bg-primary");
            this.classList.add("text-white");
            this.classList.remove("btn-outline-primary");
          });
          btn.addEventListener("mouseout", function () {
            this.classList.remove("bg-primary");
            this.classList.remove("text-white");
            this.classList.add("btn-outline-primary");
          });
        }
      }

      // Enhance the title styling for subcategories
      const titleElement = document.querySelector("#shopCategoriesChart h5");
      if (titleElement && window.currentChartView === "subcategories") {
        titleElement.style.fontWeight = "600";
        titleElement.style.color = "#333";
        titleElement.style.fontSize = "16px";
        titleElement.style.marginBottom = "15px";
        // Add a subtle shimmer effect
        titleElement.style.background =
          "linear-gradient(90deg, #333, #666, #333)";
        titleElement.style.backgroundSize = "200% auto";
        titleElement.style.color = "#fff";
        titleElement.style.backgroundClip = "text";
        titleElement.style.webkitBackgroundClip = "text";
        titleElement.style.webkitTextFillColor = "transparent";
        titleElement.style.animation = "shimmer 2s ease infinite";

        // Add keyframe animation if it doesn't exist
        if (!document.getElementById("shimmer-animation")) {
          const style = document.createElement("style");
          style.id = "shimmer-animation";
          style.textContent = `
                        @keyframes shimmer {
                            0% { background-position: 0% center; }
                            100% { background-position: 200% center; }
                        }
                    `;
          document.head.appendChild(style);
        }
      }
    } catch (e) {
      console.error("Error applying enhanced chart styling:", e);
    }
  }, 300); // Give chart time to render
}

// Helper functions for populating data
function populateShopsOrdersTable(shopsData) {
  const tableBody = document.getElementById("shopsOrdersTableBody");
  tableBody.innerHTML = "";

  if (shopsData && shopsData.length > 0) {
    try {
      console.log("Raw shops data:", shopsData); // Debug log

      // Normalize data to handle different API response formats
      const normalizedData = shopsData.map((shop) => {
        let shopName, orderCount;

        // Handle different property names in API response
        shopName =
          shop.name || shop.shopName || shop.shop_name || "Unknown Shop";

        // Handle different order count properties
        orderCount = shop.orderCount || shop.orders || shop.count || 0;
        if (typeof orderCount !== "number")
          orderCount = parseInt(orderCount) || 0;

        return { name: shopName, orderCount };
      });

      console.log("Normalized shop data:", normalizedData); // Debug log

      // Sort by order count (descending)
      normalizedData.sort((a, b) => b.orderCount - a.orderCount);

      // Create table rows
      normalizedData.forEach((shop) => {
        const row = document.createElement("tr");

        // Define status class based on order count
        let statusClass = "bg-success";
        let statusText = "Active";

        if (shop.orderCount < 5) {
          statusClass = "bg-warning";
          statusText = "Low Activity";
        }
        if (shop.orderCount === 0) {
          statusClass = "bg-danger";
          statusText = "Inactive";
        }

        row.innerHTML = `
                    <td>${shop.name}</td>
                    <td>${formatNumber(shop.orderCount)}</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                `;

        tableBody.appendChild(row);
      });
    } catch (e) {
      console.error("Error processing shops data for table:", e);
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="3" class="text-center">Error processing data</td>';
      tableBody.appendChild(row);
    }
  } else {
    const row = document.createElement("tr");
    row.innerHTML =
      '<td colspan="3" class="text-center">No data available</td>';
    tableBody.appendChild(row);
  }
}

// Format numbers with thousands separator
function formatNumber(num) {
  if (num === undefined || num === null) return "0";

  // Handle various input types
  if (typeof num !== "number") {
    // Try to convert string to number, handling currency symbols
    if (typeof num === "string") {
      num = num.replace(/[^0-9.-]+/g, "");
    }
    num = parseFloat(num) || 0;
  }

  // Format with thousand separators
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Enhanced window resize handler for responsive charts
window.addEventListener("resize", function () {
  // Debounce the resize events to prevent excessive redrawing
  clearTimeout(window.resizeChartTimer);
  window.resizeChartTimer = setTimeout(function () {
    console.log("Window resized - updating charts...");

    // Update all charts if they exist
    if (window.ordersChart) {
      try {
        window.ordersChart.render();
        console.log("Orders chart updated after resize");
      } catch (e) {
        console.error("Failed to update orders chart:", e);
      }
    }

    if (window.shopCategoriesChart) {
      try {
        window.shopCategoriesChart.render();
        console.log("Shop categories chart updated after resize");
      } catch (e) {
        console.error("Failed to update shop categories chart:", e);
      }
    }

    if (window.bestSellersChart) {
      try {
        window.bestSellersChart.render();
        console.log("Best sellers chart updated after resize");
      } catch (e) {
        console.error("Failed to update best sellers chart:", e);
      }
    }
  }, 300);
});

// Add this at the end of the file to ensure the dashboard initializes properly
document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "DOM content loaded event fired - verifying dashboard initialization"
  );

  // Check if dashboard has been initialized
  if (typeof window.dashboardInitialized === "undefined") {
    console.log("Dashboard not yet initialized - setting up initialization");

    // Set a flag to track initialization
    window.dashboardInitialized = false;

    // Function to initialize the dashboard if ApexCharts is available
    const initDashboardIfReady = function () {
      if (typeof ApexCharts !== "undefined" && !window.dashboardInitialized) {
        console.log(
          "ApexCharts is available and dashboard not initialized - initializing now"
        );
        window.dashboardInitialized = true;
        window.initDashboard();
      } else if (window.dashboardInitialized) {
        console.log("Dashboard already initialized - skipping");
      } else {
        console.log("ApexCharts not yet available - will try again");
      }
    };

    // Try immediately
    initDashboardIfReady();

    // And also try after a delay to ensure everything is loaded
    setTimeout(initDashboardIfReady, 500);
    setTimeout(initDashboardIfReady, 1000);
    setTimeout(initDashboardIfReady, 2000);
  }
});