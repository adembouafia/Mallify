/**
 * Deal of the Week initialization script
 * This script initializes the Deal of the Week section on page load
 */
document.addEventListener("DOMContentLoaded", function () {
  // The container where we'll add the Deal of the Week section
  // Change this to match your page's container ID
  const containerId = "main-content";

  // API endpoint for deal products - change to your actual API endpoint
  const apiEndpoint = "http://localhost:3000/product/get";

  // Load deal products - this will either load from API or use sample data as fallback
  loadDealOfWeekProducts(apiEndpoint, containerId);

  // If you prefer to use static sample products directly without API call, use this instead:
  /*
  const sampleProducts = [
    {
      _id: 'sample1',
      productName: '"Old Money" Oversized Sweat-shirt - Beige',
      mainImage: 'oversize.png',
      averageRating: 4.8,
      reviewCount: 12000,
      productPrice: 78,
      originalPrice: 110,
      fulfilledBy: 'Fulfilled by Mallify'
    },
    {
      _id: 'sample2',
      productName: 'Premium Cotton T-shirt - White',
      mainImage: 'tshirt.jpg',
      averageRating: 4.5,
      reviewCount: 8500,
      productPrice: 35,
      originalPrice: 50,
      fulfilledBy: 'Fulfilled by Mallify'
    },
    {
      _id: 'sample3',
      productName: 'Leather Crossbody Bag - Brown',
      mainImage: 'bag.jpg',
      averageRating: 4.7,
      reviewCount: 6200,
      productPrice: 120,
      originalPrice: 180,
      fulfilledBy: 'Fulfilled by Mallify'
    },
    {
      _id: 'sample4',
      productName: 'Wireless Bluetooth Headphones',
      mainImage: 'headphones.jpg',
      averageRating: 4.6,
      reviewCount: 9300,
      productPrice: 95,
      originalPrice: 140,
      fulfilledBy: 'Fulfilled by Mallify'
    }
  ];
  
  createDealOfWeekSection(containerId, sampleProducts);
  */
});
