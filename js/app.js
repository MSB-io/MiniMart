// Main application logic and routing

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Show home page by default
  showHome();

  // Update cart UI
  updateCartUI();
}

// Show home page
function showHome() {
  const content = `
        <!-- Home Page Content -->
        <div id="homePage" class="page-content">
            <!-- Hero Section -->
            <div class="py-12 px-4">
                <div class="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 px-8 rounded-3xl shadow-2xl">
                    <div class="text-center">
                        <h1 class="text-5xl font-bold mb-4">Welcome to MiniMart</h1>
                        <p class="text-xl mb-8">Discover products from multiple vendors in one place</p>
                        <button onclick="showProducts()" class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105">
                            Shop Now
                        </button>
                    </div>
                </div>
            </div>

            <!-- Featured Products -->
            <div class="max-w-7xl mx-auto px-4 py-16">
                <h2 class="text-3xl font-bold text-center mb-12">Featured Products</h2>
                <div id="featuredProducts" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- Featured products will be loaded here -->
                </div>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;

  // Load featured products
  loadFeaturedProducts();
}

// Load featured products for home page
async function loadFeaturedProducts() {
  try {
    const snapshot = await productsCollection
      .where("isActive", "==", true)
      .limit(8)
      .get();

    const featuredProducts = document.getElementById("featuredProducts");

    if (!featuredProducts) return;

    featuredProducts.innerHTML = "";

    if (snapshot.empty) {
      featuredProducts.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <i class="fas fa-box-open text-6xl mb-4"></i>
                    <p class="text-xl">No products available yet</p>
                </div>
            `;
      return;
    }

    snapshot.forEach((doc) => {
      const product = doc.data();
      const productCard = createProductCard(doc.id, product);
      featuredProducts.appendChild(productCard);
    });
  } catch (error) {
    console.error("Error loading featured products:", error);
  }
}

// Show dashboard based on user role
function showDashboard() {
  if (!currentUser) {
    showMessage("Please login first", "error");
    showLogin();
    return;
  }

  switch (userRole) {
    case "admin":
      window.open("pages/admin-dashboard.html", "_blank");
      break;
    case "vendor":
      showVendorDashboard();
      break;
    case "customer":
      showCustomerDashboard();
      break;
    default:
      showMessage("Invalid user role", "error");
  }
}

// Show vendor dashboard
function showVendorDashboard() {
  const content = `
        <div class="max-w-7xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-8">Vendor Dashboard</h1>
            
            <!-- Delivery Priority Queue -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-semibold">Delivery Priority Queue</h2>
                    <div class="space-x-3">
                        <button onclick="processNextDelivery()" 
                                class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-play mr-2"></i>Process Next
                        </button>
                        <button onclick="refreshDeliveryQueue()" 
                                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-sync mr-2"></i>Refresh
                        </button>
                    </div>
                </div>
                <div id="deliveryQueueDisplay">
                    <!-- Queue will be populated here -->
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-red-50 p-6 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-bolt text-red-600 text-2xl mr-4"></i>
                        <div>
                            <p class="text-red-600 font-semibold">Express Orders</p>
                            <p class="text-2xl font-bold" id="expressOrdersCount">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 p-6 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-truck text-blue-600 text-2xl mr-4"></i>
                        <div>
                            <p class="text-blue-600 font-semibold">Normal Orders</p>
                            <p class="text-2xl font-bold" id="normalOrdersCount">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 p-6 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-chart-line text-green-600 text-2xl mr-4"></i>
                        <div>
                            <p class="text-green-600 font-semibold">Revenue Today</p>
                            <p class="text-2xl font-bold" id="todayRevenue">₹0</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-50 p-6 rounded-lg">
                    <div class="flex items-center">
                        <i class="fas fa-clock text-purple-600 text-2xl mr-4"></i>
                        <div>
                            <p class="text-purple-600 font-semibold">Avg Process Time</p>
                            <p class="text-2xl font-bold" id="avgProcessTime">0m</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Original Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                            <i class="fas fa-box text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">My Products</p>
                            <p class="text-2xl font-bold" id="vendorProducts">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-500">
                            <i class="fas fa-shopping-cart text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Orders</p>
                            <p class="text-2xl font-bold" id="vendorOrders">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                            <i class="fas fa-clock text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Pending Orders</p>
                            <p class="text-2xl font-bold" id="pendingOrders">0</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100 text-purple-500">
                            <i class="fas fa-dollar-sign text-2xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-gray-500 text-sm">Revenue</p>
                            <p class="text-2xl font-bold" id="vendorRevenue">₹0</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button onclick="showAddProduct()" class="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 text-center">
                    <i class="fas fa-plus text-3xl mb-2"></i>
                    <p class="text-lg font-semibold">Add New Product</p>
                </button>
                <button onclick="showProducts()" class="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 text-center">
                    <i class="fas fa-box text-3xl mb-2"></i>
                    <p class="text-lg font-semibold">Manage Products</p>
                </button>
                <button onclick="showManageOrders()" class="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 text-center">
                    <i class="fas fa-tasks text-3xl mb-2"></i>
                    <p class="text-lg font-semibold">Manage Orders</p>
                </button>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
  loadVendorStats();
  refreshDeliveryQueue();
}

// Show vendor order management page
function showManageOrders() {
  const content = `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">Manage Orders</h1>
        <button onclick="showVendorDashboard()" 
                class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
        </button>
      </div>
      
      <!-- Order Status Tabs -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button onclick="filterOrdersByStatus('all')" 
                    class="order-tab border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    data-status="all">
              All Orders
              <span class="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs" id="count-all">0</span>
            </button>
            <button onclick="filterOrdersByStatus('pending')" 
                    class="order-tab border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    data-status="pending">
              Pending
              <span class="bg-yellow-100 text-yellow-800 ml-2 py-0.5 px-2.5 rounded-full text-xs" id="count-pending">0</span>
            </button>
            <button onclick="filterOrdersByStatus('processing')" 
                    class="order-tab border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    data-status="processing">
              Processing
              <span class="bg-blue-100 text-blue-800 ml-2 py-0.5 px-2.5 rounded-full text-xs" id="count-processing">0</span>
            </button>
            <button onclick="filterOrdersByStatus('shipped')" 
                    class="order-tab border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    data-status="shipped">
              Shipped
              <span class="bg-green-100 text-green-800 ml-2 py-0.5 px-2.5 rounded-full text-xs" id="count-shipped">0</span>
            </button>
            <button onclick="filterOrdersByStatus('delivered')" 
                    class="order-tab border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                    data-status="delivered">
              Delivered
              <span class="bg-purple-100 text-purple-800 ml-2 py-0.5 px-2.5 rounded-full text-xs" id="count-delivered">0</span>
            </button>
          </nav>
        </div>
      </div>
      
      <!-- Orders List -->
      <div id="manageOrdersList" class="space-y-4">
        <!-- Orders will be loaded here -->
      </div>
      
      <!-- Loading and Empty States -->
      <div id="ordersLoading" class="hidden text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">Loading orders...</p>
      </div>
      
      <div id="noOrdersFound" class="hidden text-center py-12">
        <i class="fas fa-inbox text-gray-400 text-6xl mb-4"></i>
        <p class="text-xl text-gray-600">No orders found</p>
        <p class="text-gray-500">Orders will appear here when customers place them</p>
      </div>
    </div>
  `;
  
  document.getElementById("mainContent").innerHTML = content;
  loadVendorOrdersForManagement();
}

// Show customer dashboard
function showCustomerDashboard() {
  const content = `
        <div class="max-w-4xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-8">My Account</h1>
            
            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button onclick="showOrders()" class="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 text-center">
                    <i class="fas fa-receipt text-3xl mb-2"></i>
                    <p class="text-lg font-semibold">My Orders</p>
                </button>
                <button onclick="showCart()" class="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 text-center">
                    <i class="fas fa-shopping-cart text-3xl mb-2"></i>
                    <p class="text-lg font-semibold">Shopping Cart</p>
                </button>
                <button onclick="showProducts()" class="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 text-center">
                    <i class="fas fa-store text-3xl mb-2"></i>
                    <p class="text-lg font-semibold">Browse Products</p>
                </button>
            </div>
            
            <!-- Account Information -->
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-bold mb-4">Account Information</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input type="text" id="customerName" class="w-full p-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="customerEmail" readonly 
                               class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50">
                    </div>
                </div>
                <button onclick="updateProfile()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Update Profile
                </button>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
  loadCustomerProfile();
}

// Load vendor statistics
async function loadVendorStats() {
  try {
    // Load vendor products count
    const productsSnapshot = await productsCollection
      .where("vendorId", "==", currentUser.uid)
      .where("isActive", "==", true)
      .get();
    document.getElementById("vendorProducts").textContent =
      productsSnapshot.size;

    // Load vendor orders (simplified approach)
    const allOrdersSnapshot = await ordersCollection.get();
    let vendorOrdersCount = 0;
    let pendingOrdersCount = 0;
    let totalRevenue = 0;

    allOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      const hasVendorItems = order.items.some(
        (item) => item.vendorId === currentUser.uid
      );

      if (hasVendorItems) {
        vendorOrdersCount++;
        if (order.status === "pending") {
          pendingOrdersCount++;
        }

        // Calculate revenue from vendor's items only
        const vendorItems = order.items.filter(
          (item) => item.vendorId === currentUser.uid
        );
        const vendorRevenue = vendorItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        totalRevenue += vendorRevenue;
      }
    });

    document.getElementById("vendorOrders").textContent = vendorOrdersCount;
    document.getElementById("pendingOrders").textContent = pendingOrdersCount;
    document.getElementById(
      "vendorRevenue"
    ).textContent = `₹${totalRevenue.toFixed(2)}`;
  } catch (error) {
    console.error("Error loading vendor stats:", error);
  }
}

// Load customer profile
async function loadCustomerProfile() {
  try {
    const userDoc = await usersCollection.doc(currentUser.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      document.getElementById("customerName").value = userData.name || "";
      document.getElementById("customerEmail").value =
        userData.email || currentUser.email;
    }
  } catch (error) {
    console.error("Error loading customer profile:", error);
  }
}

// Update customer profile
async function updateProfile() {
  const name = document.getElementById("customerName").value;

  if (!name.trim()) {
    showMessage("Please enter your name", "error");
    return;
  }

  showLoading();

  try {
    await usersCollection.doc(currentUser.uid).update({
      name: name.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    document.getElementById("userName").textContent = name.trim();
    showMessage("Profile updated successfully!", "success");
  } catch (error) {
    console.error("Error updating profile:", error);
    showMessage("Error updating profile", "error");
  } finally {
    hideLoading();
  }
}

// Mobile search toggle functionality
function toggleMobileSearch() {
  const mobileSearchBar = document.getElementById("mobileSearchBar");
  if (mobileSearchBar) {
    mobileSearchBar.classList.toggle("hidden");

    // Focus on the mobile search input when opened
    if (!mobileSearchBar.classList.contains("hidden")) {
      const mobileSearchInput = document.getElementById("mobileSearchInput");
      if (mobileSearchInput) {
        setTimeout(() => mobileSearchInput.focus(), 100);
      }
    }
  }
}

// Mobile search function
function searchProductsMobile() {
  const mobileSearchInput = document.getElementById("mobileSearchInput");
  if (mobileSearchInput) {
    const searchTerm = mobileSearchInput.value;
    // Copy the search term to the main search input and trigger search
    const mainSearchInput = document.getElementById("searchInput");
    if (mainSearchInput) {
      mainSearchInput.value = searchTerm;
    }
    searchProducts();
    // Hide mobile search bar after search
    const mobileSearchBar = document.getElementById("mobileSearchBar");
    if (mobileSearchBar) {
      mobileSearchBar.classList.add("hidden");
    }
  }
}

// Handle search on Enter key press for both search inputs
document.addEventListener("keypress", function (event) {
  if (
    event.key === "Enter" &&
    (event.target.id === "searchInput" ||
      event.target.id === "mobileSearchInput")
  ) {
    if (event.target.id === "mobileSearchInput") {
      searchProductsMobile();
    } else {
      searchProducts();
    }
  }
});

// Close mobile search when clicking outside
document.addEventListener("click", function (event) {
  const mobileSearchBar = document.getElementById("mobileSearchBar");
  const searchToggle = event.target.closest('[onclick="toggleMobileSearch()"]');

  if (!mobileSearchBar || !searchToggle) return;

  if (!mobileSearchBar.contains(event.target) && !searchToggle) {
    mobileSearchBar.classList.add("hidden");
  }
});

// Navbar scroll effect
let lastScrollY = window.scrollY;
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar-float");
  if (!navbar) return;

  const currentScrollY = window.scrollY;

  // Add scrolled class when scrolling down
  if (currentScrollY > 50) {
    navbar.classList.add("navbar-scrolled");
  } else {
    navbar.classList.remove("navbar-scrolled");
  }

  lastScrollY = currentScrollY;
});

// CSS for line-clamp utility (since Tailwind CDN might not include it)
const style = document.createElement("style");
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Delivery Queue Management Functions

// Load vendor delivery queue
async function refreshDeliveryQueue() {
  if (userRole !== 'vendor') return;
  
  showLoading();
  
  try {
    // Fetch pending orders containing vendor's products
    const snapshot = await ordersCollection
      .where("status", "==", "pending")
      .get();
    
    // Clear existing queue
    deliveryQueue.heap = []; // Reset the heap
    
    // Convert to array and sort by createdAt locally
    const orders = []; // Temporary array to hold orders
    snapshot.forEach((doc) => {
      const order = doc.data(); // Get order data
      if (Array.isArray(order.items)) { // Ensure items is an array
        const hasVendorItems = order.items.some( // Check if any item belongs to vendor
          (item) => item && item.vendorId === currentUser.uid
        );
        if (hasVendorItems) { // Only include orders with vendor's items
          orders.push({ // Push order with id and createdAt
            id: doc.id,
            ...order,
            createdAt: order.createdAt || { toMillis: () => Date.now(), toDate: () => new Date() }
          });
        }
      }
    });
    
    // Sort orders by created date (newest first) and add to queue
    orders.sort((a, b) => {
      const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : Date.now(); // Handle Firestore Timestamp or fallback
      const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : Date.now(); // Handle Firestore Timestamp or fallback
      return bTime - aTime;
    });
    
    // Add to delivery queue
    orders.forEach(order => {
      deliveryQueue.enqueue(order);
    });
    
    // Update stats
    const { express, normal } = deliveryQueue.getOrdersByType(); // Get counts
    const expressCount = document.getElementById('expressOrdersCount'); // Update UI
    const normalCount = document.getElementById('normalOrdersCount'); // Update UI
    
    if (expressCount) expressCount.textContent = express.length; // Set counts
    if (normalCount) normalCount.textContent = normal.length; // Set counts
    
  } catch (error) {
    console.error("Error loading delivery queue:", error);
    showMessage("Error loading delivery queue: " + error.message, "error");
  } finally {
    hideLoading();
  }
}

// Process next highest priority order
async function processNextDelivery() {
  const nextOrder = deliveryQueue.dequeue(); // Get next order from queue
  if (!nextOrder) {
    showMessage("No orders in queue to process", "info");
    return;
  }
  
  try {
    await ordersCollection.doc(nextOrder.id).update({ // Update order status
      status: "processing",
      processedAt: firebase.firestore.FieldValue.serverTimestamp(),
      processedBy: currentUser.uid
    });
    
    showMessage(`Processing ${nextOrder.deliveryType} order #${nextOrder.id.substring(0, 8)}`, "success"); 
    refreshDeliveryQueue(); 
    
  } catch (error) {
    console.error("Error processing order:", error);
    showMessage("Error processing order: " + error.message, "error");
  }
}

// Process specific delivery order
async function processDeliveryOrder(orderId) {
  try {
    await ordersCollection.doc(orderId).update({ // Update order status
      status: "processing",
      processedAt: firebase.firestore.FieldValue.serverTimestamp(),
      processedBy: currentUser.uid
    });
    
    // Remove from queue
    deliveryQueue.heap = deliveryQueue.heap.filter(order => order.id !== orderId); // Remove specific order
    deliveryQueue.updateQueueDisplay(); // Refresh display
    
    showMessage(`Order #${orderId.substring(0, 8)} is now being processed`, "success");
    refreshDeliveryQueue();
    
  } catch (error) {
    console.error("Error processing order:", error);
    showMessage("Error processing order: " + error.message, "error");
  }
}

// View order details
async function viewOrderDetails(orderId) {
  try {
    const orderDoc = await ordersCollection.doc(orderId).get();
    if (!orderDoc.exists) {
      showMessage("Order not found", "error");
      return;
    }
    
    const order = orderDoc.data();
    const deliveryText = order.deliveryType === 'express' ? 
      'Express Delivery (1-2 business days)' : 
      'Normal Delivery (3-5 business days)';
    
    const content = `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Order Details</h1>
            <button onclick="showVendorDashboard()" 
                    class="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back to Dashboard
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 class="text-xl font-semibold mb-4">Order Information</h2>
              <div class="space-y-2">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Status:</strong> <span class="capitalize">${order.status}</span></p>
                <p><strong>Delivery Type:</strong> ${deliveryText}</p>
                <p><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
                <p><strong>Order Date:</strong> ${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <h2 class="text-xl font-semibold mb-4">Shipping Information</h2>
              <div class="space-y-2">
                <p><strong>Name:</strong> ${order.shippingInfo?.name || 'N/A'}</p>
                <p><strong>Email:</strong> ${order.shippingInfo?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${order.shippingInfo?.phone || 'N/A'}</p>
                <p><strong>Address:</strong> ${order.shippingInfo?.address || 'N/A'}</p>
                <p><strong>City:</strong> ${order.shippingInfo?.city || 'N/A'}</p>
                <p><strong>ZIP:</strong> ${order.shippingInfo?.zip || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div class="mt-6">
            <h2 class="text-xl font-semibold mb-4">Order Items</h2>
            <div class="space-y-3">
              ${order.items.map(item => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p class="font-medium">${item.name}</p>
                    <p class="text-sm text-gray-600">Quantity: ${item.quantity} × ₹${item.price.toFixed(2)}</p>
                  </div>
                  <p class="font-semibold">₹${(item.quantity * item.price).toFixed(2)}</p>
                </div>
              `).join('')}
            </div>
          </div>
          
          ${order.status === 'pending' ? `
            <div class="mt-6 flex space-x-3">
              <button onclick="processDeliveryOrder('${orderId}')" 
                      class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Process Order
              </button>
              <button onclick="updateOrderStatus('${orderId}', 'shipped')" 
                      class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Mark as Shipped
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.getElementById("mainContent").innerHTML = content;
    
  } catch (error) {
    console.error("Error loading order details:", error);
    showMessage("Error loading order details: " + error.message, "error");
  }
}

// Update individual item status for vendor
async function updateVendorItemStatus(orderId, itemId, newStatus) { // newStatus can be 'processing', 'shipped', 'delivered', 'cancelled'
  try {
    const orderDoc = await ordersCollection.doc(orderId).get(); // Fetch order document
    if (!orderDoc.exists) {
      showMessage("Order not found", "error");
      return;
    }
    
    const order = orderDoc.data(); // Get order data
    const updatedItems = order.items.map(item => {
      // Only update items belonging to current vendor
      if (item.id === itemId && item.vendorId === currentUser.uid) { // Match item by ID and vendor
        return {
          ...item,
          itemStatus: newStatus,
          statusUpdatedAt: new Date(), // Use regular Date instead of serverTimestamp in array
          statusUpdatedBy: currentUser.uid
        };
      }
      return item;
    });
    
    // Calculate new overall order status
    const overallStatus = calculateOverallOrderStatus(updatedItems); // Determine overall status based on item statuses
    
    await ordersCollection.doc(orderId).update({ // Update order document
      items: updatedItems,
      status: overallStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showMessage(`Item status updated to ${newStatus}`, "success");
    
    // Refresh the order management view
    loadVendorOrdersForManagement(); // Reload orders to reflect changes
    
  } catch (error) {
    console.error("Error updating item status:", error);
    showMessage("Error updating item status: " + error.message, "error");
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) { // newStatus can be 'shipped' or 'delivered'
  try {
    await ordersCollection.doc(orderId).update({ // Update order document
      status: newStatus, 
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: currentUser.uid
    });
    
    showMessage(`Order status updated to ${newStatus}`, "success");
    
    // Refresh the order management view
    loadVendorOrdersForManagement();
    
  } catch (error) {
    console.error("Error updating order status:", error);
    showMessage("Error updating order status: " + error.message, "error");
  }
}

// Calculate overall order status based on individual item statuses
function calculateOverallOrderStatus(items) {
  if (!items || items.length === 0) return 'pending';
  
  const statusCounts = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  items.forEach(item => {
    const status = item.itemStatus || 'pending';
    statusCounts[status]++;
  });
  
  const totalItems = items.length;
  
  // All items delivered
  if (statusCounts.delivered === totalItems) {
    return 'delivered';
  }
  
  // Any item cancelled
  if (statusCounts.cancelled > 0) {
    return 'partially_cancelled';
  }
  
  // All items shipped or delivered
  if (statusCounts.shipped + statusCounts.delivered === totalItems) {
    return 'shipped';
  }
  
  // Any item processing or beyond
  if (statusCounts.processing + statusCounts.shipped + statusCounts.delivered > 0) {
    return 'processing';
  }
  
  // Default to pending
  return 'pending';
}

// Load vendor orders for management page
async function loadVendorOrdersForManagement() {
  const loadingElement = document.getElementById('ordersLoading');
  const ordersListElement = document.getElementById('manageOrdersList');
  const noOrdersElement = document.getElementById('noOrdersFound');
  
  if (loadingElement) loadingElement.classList.remove('hidden');
  if (ordersListElement) ordersListElement.innerHTML = '';
  if (noOrdersElement) noOrdersElement.classList.add('hidden');
  
  try {
    const allOrdersSnapshot = await ordersCollection.get();
    const vendorOrders = [];
    const orderCounts = {
      all: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0
    };
    
    allOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (Array.isArray(order.items)) {
        const vendorItems = order.items.filter(
          (item) => item && item.vendorId === currentUser.uid
        );
        
        if (vendorItems.length > 0) {
          const orderWithId = {
            id: doc.id,
            ...order,
            vendorItems: vendorItems, // Store vendor-specific items
            createdAt: order.createdAt || { toMillis: () => Date.now(), toDate: () => new Date() }
          };
          vendorOrders.push(orderWithId);
          
          // Count orders by vendor item statuses
          orderCounts.all++;
          
          // Determine primary status for counting (most advanced status of vendor items)
          const itemStatuses = vendorItems.map(item => item.itemStatus || 'pending');
          const primaryStatus = getPrimaryItemStatus(itemStatuses);
          
          if (orderCounts.hasOwnProperty(primaryStatus)) {
            orderCounts[primaryStatus]++;
          }
        }
      }
    });
    
    // Update tab counts
    Object.keys(orderCounts).forEach(status => {
      const countElement = document.getElementById(`count-${status}`);
      if (countElement) {
        countElement.textContent = orderCounts[status];
      }
    });
    
    // Sort orders by creation date (newest first)
    vendorOrders.sort((a, b) => {
      const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : Date.now();
      const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : Date.now();
      return bTime - aTime;
    });
    
    // Store orders globally for filtering
    window.vendorOrdersData = vendorOrders;
    
    // Display all orders initially
    displayManageOrders(vendorOrders);
    
    // Set "All Orders" tab as active
    setActiveTab('all');
    
  } catch (error) {
    console.error("Error loading vendor orders:", error);
    showMessage("Error loading orders: " + error.message, "error");
  } finally {
    if (loadingElement) loadingElement.classList.add('hidden');
  }
}

// Get primary status from item statuses for counting purposes
function getPrimaryItemStatus(itemStatuses) {
  if (itemStatuses.includes('delivered')) return 'delivered';
  if (itemStatuses.includes('shipped')) return 'shipped';
  if (itemStatuses.includes('processing')) return 'processing';
  return 'pending';
}

// Filter orders by status (based on vendor item statuses)
function filterOrdersByStatus(status) {
  const allOrders = window.vendorOrdersData || [];
  let filteredOrders = allOrders;
  
  if (status !== 'all') {
    filteredOrders = allOrders.filter(order => {
      const vendorItems = order.items.filter(item => item.vendorId === currentUser.uid);
      const itemStatuses = vendorItems.map(item => item.itemStatus || 'pending');
      
      // Check if any vendor item has the desired status
      return itemStatuses.includes(status);
    });
  }
  
  displayManageOrders(filteredOrders);
  setActiveTab(status);
}

// Set active tab
function setActiveTab(activeStatus) {
  const tabs = document.querySelectorAll('.order-tab');
  tabs.forEach(tab => {
    const status = tab.getAttribute('data-status');
    if (status === activeStatus) {
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('border-blue-500', 'text-blue-600');
    } else {
      tab.classList.add('border-transparent', 'text-gray-500');
      tab.classList.remove('border-blue-500', 'text-blue-600');
    }
  });
}

// Display orders in management view
function displayManageOrders(orders) {
  const ordersListElement = document.getElementById('manageOrdersList');
  const noOrdersElement = document.getElementById('noOrdersFound');
  
  if (!ordersListElement || !noOrdersElement) return;
  
  if (orders.length === 0) {
    ordersListElement.innerHTML = '';
    noOrdersElement.classList.remove('hidden');
    return;
  }
  
  noOrdersElement.classList.add('hidden');
  
  const ordersHTML = orders.map(order => {
    const orderDate = order.createdAt ? 
      new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A';
    
    const deliveryBadge = order.deliveryType ? 
      `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        order.deliveryType === 'express' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
      }">
        <i class="fas fa-${order.deliveryType === 'express' ? 'bolt' : 'truck'} mr-1"></i>
        ${order.deliveryType === 'express' ? 'Express' : 'Normal'}
      </span>` : '';
    
    const vendorItems = order.items.filter(item => item.vendorId === currentUser.uid);
    const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get status summary for vendor items
    const statusSummary = getVendorItemsStatusSummary(vendorItems);
    
    return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Order #${order.id.substring(0, 8)}</h3>
            <p class="text-sm text-gray-600">Placed on ${orderDate}</p>
          </div>
          <div class="flex items-center space-x-2">
            ${deliveryBadge}
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${statusSummary}
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p class="text-sm font-medium text-gray-700">Customer</p>
            <p class="text-sm text-gray-900">${order.customerEmail || 'N/A'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Your Items Total</p>
            <p class="text-sm text-gray-900">₹${vendorTotal.toFixed(2)}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">Items Count</p>
            <p class="text-sm text-gray-900">${vendorItems.length} item(s)</p>
          </div>
        </div>
        
        <!-- Individual Items Management -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Your Items in this Order:</h4>
          <div class="space-y-2">
            ${vendorItems.map(item => {
              const itemStatus = item.itemStatus || 'pending';
              return `
                <div class="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div class="flex-1">
                    <h5 class="font-medium text-gray-900">${item.name}</h5>
                    <p class="text-sm text-gray-600">Qty: ${item.quantity} × ₹${item.price.toFixed(2)}</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(itemStatus)}">
                      ${itemStatus.toUpperCase()}
                    </span>
                    <div class="flex space-x-1">
                      ${itemStatus === 'pending' ? `
                        <button onclick="updateVendorItemStatus('${order.id}', '${item.id}', 'processing')" 
                                class="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700">
                          <i class="fas fa-play mr-1"></i>Process
                        </button>
                      ` : ''}
                      ${itemStatus === 'processing' ? `
                        <button onclick="updateVendorItemStatus('${order.id}', '${item.id}', 'shipped')" 
                                class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">
                          <i class="fas fa-truck mr-1"></i>Ship
                        </button>
                      ` : ''}
                      ${itemStatus === 'shipped' ? `
                        <button onclick="updateVendorItemStatus('${order.id}', '${item.id}', 'delivered')" 
                                class="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700">
                          <i class="fas fa-check mr-1"></i>Deliver
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <button onclick="viewOrderDetails('${order.id}')" 
                  class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            <i class="fas fa-eye mr-2"></i>View Full Order
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  ordersListElement.innerHTML = ordersHTML;
}

// Get status summary for vendor items
function getVendorItemsStatusSummary(vendorItems) {
  if (!vendorItems || vendorItems.length === 0) return 'No items';
  
  const statusCounts = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };
  
  vendorItems.forEach(item => {
    const status = item.itemStatus || 'pending';
    statusCounts[status]++;
  });
  
  const parts = [];
  if (statusCounts.delivered > 0) parts.push(`${statusCounts.delivered} delivered`);
  if (statusCounts.shipped > 0) parts.push(`${statusCounts.shipped} shipped`);
  if (statusCounts.processing > 0) parts.push(`${statusCounts.processing} processing`);
  if (statusCounts.pending > 0) parts.push(`${statusCounts.pending} pending`);
  if (statusCounts.cancelled > 0) parts.push(`${statusCounts.cancelled} cancelled`);
  
  return parts.join(', ') || 'No status';
}

// View order details in a modal
async function viewOrderDetails(orderId) {
  try {
    const orderDoc = await ordersCollection.doc(orderId).get();
    if (!orderDoc.exists) {
      showMessage("Order not found", "error");
      return;
    }
    
    const order = orderDoc.data();
    const vendorItems = order.items.filter(item => item.vendorId === currentUser.uid);
    
    const modalHTML = `
      <div id="orderModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Order Details #${orderId.substring(0, 8)}</h3>
            <button onclick="closeOrderModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p class="text-sm font-medium text-gray-700">Customer Email</p>
              <p class="text-sm text-gray-900">${order.customerEmail || 'N/A'}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">Order Date</p>
              <p class="text-sm text-gray-900">${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">Status</p>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}">
                ${order.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">Delivery Type</p>
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                order.deliveryType === 'express' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
              }">
                <i class="fas fa-${order.deliveryType === 'express' ? 'bolt' : 'truck'} mr-1"></i>
                ${order.deliveryType === 'express' ? 'Express' : 'Normal'}
              </span>
            </div>
          </div>
          
          <div class="mb-6">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Your Items in this Order</h4>
            <div class="space-y-3">
              ${vendorItems.map(item => {
                const itemStatus = item.itemStatus || 'pending';
                return `
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div class="flex-1">
                    <h5 class="font-medium text-gray-900">${item.name}</h5>
                    <p class="text-sm text-gray-600">Quantity: ${item.quantity}</p>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(itemStatus)} mt-1">
                      ${itemStatus.toUpperCase()}
                    </span>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-gray-900">₹${(item.price * item.quantity).toFixed(2)}</p>
                    <p class="text-xs text-gray-500">₹${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
            
            <div class="border-t pt-3 mt-3">
              <div class="flex justify-between">
                <span class="font-semibold text-gray-900">Your Items Total:</span>
                <span class="font-semibold text-gray-900">₹${vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button onclick="closeOrderModal()" 
                    class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
  } catch (error) {
    console.error("Error loading order details:", error);
    showMessage("Error loading order details: " + error.message, "error");
  }
}

// Close order details modal
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.remove();
  }
}

// Get status badge class helper
function getStatusBadgeClass(status) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-green-100 text-green-800';
    case 'delivered': return 'bg-purple-100 text-purple-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
