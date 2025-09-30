// Orders management functions

// Show orders page
function showOrders() {
  if (!currentUser) {
    showMessage("Please login to view orders", "error");
    showLogin();
    return;
  }

  const content = `
        <div class="max-w-6xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-8">
                ${userRole === "vendor" ? "Vendor Orders" : "My Orders"}
            </h1>
            
            <!-- Order Status Filter -->
            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <div class="flex gap-4 items-center">
                    <label class="text-sm font-medium text-gray-700">Filter by status:</label>
                    <select id="orderStatusFilter" onchange="filterOrders()" 
                            class="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            
            <!-- Orders List -->
            <div id="ordersList">
                <!-- Orders will be loaded here -->
            </div>
            
            <!-- No orders message -->
            <div id="noOrders" class="hidden text-center py-12">
                <div class="text-gray-500">
                    <i class="fas fa-receipt text-6xl mb-4"></i>
                    <p class="text-xl">No orders found</p>
                </div>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
  loadOrders();
}

// Load orders based on user role
async function loadOrders(statusFilter = "") {
  showLoading();

  try {
    // Check if Firebase is initialized
    if (!ordersCollection) {
      throw new Error("Firebase not initialized");
    }

    // Check if user is logged in
    if (!currentUser) {
      throw new Error("User not logged in");
    }

    let query;

    // Filter by user role
    if (userRole === "customer") {
      // For customers, filter first then order (avoids composite index requirement)
      query = ordersCollection.where("customerId", "==", currentUser.uid);
    } else if (userRole === "vendor") {
      // For vendors, we need to get orders containing their products
      // This requires a different approach due to Firestore limitations
      query = ordersCollection;
      const allOrdersSnapshot = await query.get();
      const vendorOrders = [];

      allOrdersSnapshot.forEach((doc) => {
        try {
          const order = doc.data();
          // Safely check if items array exists and has vendor items
          if (Array.isArray(order.items)) {
            const hasVendorItems = order.items.some(
              (item) => item && item.vendorId === currentUser.uid
            );
            if (hasVendorItems) {
              vendorOrders.push({ id: doc.id, data: order });
            }
          }
        } catch (docError) {
          console.error("Error processing order document:", doc.id, docError);
        }
      });

      // Sort vendor orders by date (client-side sorting)
      vendorOrders.sort((a, b) => {
        const dateA = getOrderTimestamp(a.data.createdAt);
        const dateB = getOrderTimestamp(b.data.createdAt);
        return dateB - dateA; // Descending order (newest first)
      });

      displayOrders(vendorOrders, statusFilter);
      hideLoading();
      return;
    }

    const snapshot = await query.get();
    const orders = [];
    snapshot.forEach((doc) => {
      try {
        const orderData = doc.data();
        orders.push({ id: doc.id, data: orderData });
      } catch (docError) {
        console.error("Error processing order document:", doc.id, docError);
      }
    });

    // Sort orders by date in JavaScript (client-side sorting)
    orders.sort((a, b) => {
      const dateA = getOrderTimestamp(a.data.createdAt);
      const dateB = getOrderTimestamp(b.data.createdAt);
      return dateB - dateA; // Descending order (newest first)
    });

    displayOrders(orders, statusFilter);
  } catch (error) {
    console.error("Error loading orders:", error);
    showMessage(`Error loading orders: ${error.message}`, "error");

    // Show fallback UI
    const ordersList = document.getElementById("ordersList");
    const noOrders = document.getElementById("noOrders");
    if (ordersList && noOrders) {
      ordersList.innerHTML = "";
      noOrders.classList.remove("hidden");
    }
  } finally {
    hideLoading();
  }
}

// Display orders in the UI
function displayOrders(orders, statusFilter = "") {
  try {
    const ordersList = document.getElementById("ordersList");
    const noOrders = document.getElementById("noOrders");

    if (!ordersList || !noOrders) {
      console.error("Required DOM elements not found for displaying orders");
      return;
    }

    // Ensure orders is an array
    if (!Array.isArray(orders)) {
      console.error("Orders is not an array:", orders);
      orders = [];
    }

    // Filter by status if specified
    let filteredOrders = orders;
    if (statusFilter) {
      filteredOrders = orders.filter(
        (order) => order && order.data && order.data.status === statusFilter
      );
    }

    if (filteredOrders.length === 0) {
      ordersList.innerHTML = "";
      noOrders.classList.remove("hidden");
      return;
    }

    noOrders.classList.add("hidden");
    ordersList.innerHTML = "";

    filteredOrders.forEach((order) => {
      try {
        if (order && order.id && order.data) {
          const orderCard = createOrderCard(order.id, order.data);
          if (orderCard) {
            ordersList.appendChild(orderCard);
          }
        } else {
          console.warn("Invalid order data:", order);
        }
      } catch (cardError) {
        console.error("Error creating order card:", cardError);
      }
    });
  } catch (error) {
    console.error("Error displaying orders:", error);
    showMessage("Error displaying orders", "error");
  }
}

// Create order card element
function createOrderCard(orderId, order) {
  try {
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow mb-6";

    // Safely handle date conversion
    let orderDate = "N/A";
    try {
      if (order.createdAt && typeof order.createdAt.toDate === "function") {
        orderDate = new Date(order.createdAt.toDate()).toLocaleDateString();
      } else if (order.createdAt && order.createdAt.seconds) {
        // Handle Firestore timestamp format
        orderDate = new Date(
          order.createdAt.seconds * 1000
        ).toLocaleDateString();
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt).toLocaleDateString();
      }
    } catch (dateError) {
      console.warn("Error parsing order date:", dateError);
      orderDate = "N/A";
    }

    const statusColor = getStatusColor(order.status || "pending");

    // Safely handle items array
    let displayItems = [];
    try {
      if (Array.isArray(order.items)) {
        displayItems = order.items;
        if (userRole === "vendor") {
          displayItems = order.items.filter(
            (item) => item.vendorId === currentUser.uid
          );
        }
      } else {
        console.warn("Order items is not an array:", order.items);
        displayItems = [];
      }
    } catch (itemsError) {
      console.error("Error processing order items:", itemsError);
      displayItems = [];
    }

    card.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-semibold">Order #${orderId.substring(
                      0,
                      8
                    )}</h3>
                    <p class="text-gray-600">Placed on ${orderDate}</p>
                    ${order.deliveryType ? `<p class="text-sm font-medium ${order.deliveryType === 'express' ? 'text-orange-600' : 'text-blue-600'}"><i class="fas fa-${order.deliveryType === 'express' ? 'bolt' : 'truck'} mr-1"></i>${order.deliveryType === 'express' ? 'Express' : 'Normal'} Delivery</p>` : ''}
                    ${
                      userRole === "vendor"
                        ? `<p class="text-gray-600">Customer: ${order.customerEmail}</p>`
                        : ""
                    }
                </div>
                <div class="text-right">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                        ${
                          order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)
                        }
                    </span>
                    <p class="text-lg font-bold mt-2">₹${order.total.toFixed(
                      2
                    )}</p>
                </div>
            </div>
            
            <!-- Order Items -->
            <div class="border-t pt-4">
                <h4 class="font-medium mb-3">Items:</h4>
                <div class="space-y-2">
                    ${displayItems
                      .map(
                        (item) => {
                          const itemStatus = item.itemStatus || 'pending';
                          const itemStatusColor = getStatusColor(itemStatus);
                          
                          return `
                        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <img src="${
                              item.imageUrl ||
                              "https://via.placeholder.com/50x50"
                            }" 
                                 alt="${
                                   item.name
                                 }" class="w-12 h-12 object-cover rounded">
                            <div class="flex-1">
                                <p class="font-medium">${item.name}</p>
                                <p class="text-gray-600 text-sm">Quantity: ${
                                  item.quantity
                                } × ₹${item.price.toFixed(2)}</p>
                                ${userRole === "customer" ? `
                                <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${itemStatusColor} mt-1">
                                    ${itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)}
                                </span>
                                ` : ''}
                            </div>
                            <p class="font-semibold">₹${(
                              item.price * item.quantity
                            ).toFixed(2)}</p>
                        </div>
                    `;
                        }
                      )
                      .join("")}
                </div>
                ${userRole === "customer" ? `
                <div class="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm font-medium text-blue-800">Order Progress: ${getOrderStatusSummary(displayItems)}</p>
                </div>
                ` : ''}
            </div>
            
            <!-- Shipping Information -->
            <div class="border-t pt-4 mt-4">
                <h4 class="font-medium mb-2">Shipping Address:</h4>
                <div class="text-gray-600 text-sm">
                    <p>${order.shippingInfo.name}</p>
                    <p>${order.shippingInfo.address}</p>
                    <p>${order.shippingInfo.city}, ${order.shippingInfo.zip}</p>
                    <p>Phone: ${order.shippingInfo.phone}</p>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="border-t pt-4 mt-4 flex gap-3">
                <button onclick="viewOrderDetails('${orderId}')" 
                        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    View Details
                </button>
                ${
                  userRole === "vendor" && order.status === "pending"
                    ? `
                    <button onclick="updateOrderStatus('${orderId}', 'processing')" 
                            class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                        Mark as Processing
                    </button>
                `
                    : ""
                }
                ${
                  userRole === "vendor" && order.status === "processing"
                    ? `
                    <button onclick="updateOrderStatus('${orderId}', 'shipped')" 
                            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Mark as Shipped
                    </button>
                `
                    : ""
                }
                ${
                  userRole === "customer" &&
                  ["pending", "processing"].includes(order.status)
                    ? `
                    <button onclick="cancelOrder('${orderId}')" 
                            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        Cancel Order
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `;

    return card;
  } catch (error) {
    console.error("Error creating order card:", error);
    // Return a simple error card
    const errorCard = document.createElement("div");
    errorCard.className =
      "bg-red-50 border border-red-200 rounded-lg shadow mb-6 p-6";
    errorCard.innerHTML = `
            <div class="text-red-600">
                <h3 class="font-semibold">Error displaying order</h3>
                <p class="text-sm mt-1">Order ID: ${orderId}</p>
            </div>
        `;
    return errorCard;
  }
}

// Get status color classes
function getStatusColor(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Update order status (for vendors)
async function updateOrderStatus(orderId, newStatus) {
  showLoading();

  try {
    await ordersCollection.doc(orderId).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage(`Order status updated to ${newStatus}`, "success");
    loadOrders();
  } catch (error) {
    console.error("Error updating order status:", error);
    showMessage("Error updating order status", "error");
  } finally {
    hideLoading();
  }
}

// Cancel order (for customers)
async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  showLoading();

  try {
    const orderDoc = await ordersCollection.doc(orderId).get();
    const order = orderDoc.data();

    // Restore product stock
    for (const item of order.items) {
      await productsCollection.doc(item.id).update({
        stock: firebase.firestore.FieldValue.increment(item.quantity),
      });
    }

    // Update order status
    await ordersCollection.doc(orderId).update({
      status: "cancelled",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage("Order cancelled successfully", "success");
    loadOrders();
  } catch (error) {
    console.error("Error cancelling order:", error);
    showMessage("Error cancelling order", "error");
  } finally {
    hideLoading();
  }
}

// Get order status summary for display
function getOrderStatusSummary(items) {
  if (!items || items.length === 0) return 'No items';
  
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
  
  const parts = [];
  if (statusCounts.delivered > 0) parts.push(`${statusCounts.delivered} delivered`);
  if (statusCounts.shipped > 0) parts.push(`${statusCounts.shipped} shipped`);
  if (statusCounts.processing > 0) parts.push(`${statusCounts.processing} processing`);
  if (statusCounts.pending > 0) parts.push(`${statusCounts.pending} pending`);
  if (statusCounts.cancelled > 0) parts.push(`${statusCounts.cancelled} cancelled`);
  
  return parts.join(', ') || 'No status available';
}

// Filter orders by status
function filterOrders() {
  const statusFilter = document.getElementById("orderStatusFilter").value;
  loadOrders(statusFilter);
}

// View order details
async function viewOrderDetails(orderId) {
  showLoading();

  try {
    const orderDoc = await ordersCollection.doc(orderId).get();
    if (!orderDoc.exists) {
      showMessage("Order not found", "error");
      return;
    }

    const order = orderDoc.data();

    // Check if user has permission to view this order
    const canView =
      (userRole === "customer" && order.customerId === currentUser.uid) ||
      (userRole === "vendor" &&
        order.items.some((item) => item.vendorId === currentUser.uid)) ||
      userRole === "admin";

    if (!canView) {
      showMessage("You do not have permission to view this order", "error");
      return;
    }

    // Get vendor information for items
    const vendorInfoCache = {};
    for (const item of order.items) {
      if (item.vendorId && !vendorInfoCache[item.vendorId]) {
        try {
          const vendorDoc = await usersCollection.doc(item.vendorId).get();
          if (vendorDoc.exists) {
            vendorInfoCache[item.vendorId] =
              vendorDoc.data().name || "Unknown Vendor";
          } else {
            vendorInfoCache[item.vendorId] = "Unknown Vendor";
          }
        } catch (error) {
          console.error("Error loading vendor info:", error);
          vendorInfoCache[item.vendorId] = "Unknown Vendor";
        }
      }
    }

    // Format date safely
    let orderDate = "N/A";
    try {
      if (order.createdAt && typeof order.createdAt.toDate === "function") {
        orderDate = new Date(order.createdAt.toDate()).toLocaleString();
      } else if (order.createdAt && order.createdAt.seconds) {
        orderDate = new Date(order.createdAt.seconds * 1000).toLocaleString();
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt).toLocaleString();
      }
    } catch (dateError) {
      console.warn("Error parsing order date:", dateError);
    }

    const statusColor = getStatusColor(order.status || "pending");

    // Filter items for vendor view
    let displayItems = order.items || [];
    if (userRole === "vendor") {
      displayItems = displayItems.filter(
        (item) => item.vendorId === currentUser.uid
      );
    }

    const content = `
            <div class="max-w-4xl mx-auto px-4 py-8">
                <!-- Back Button -->
                <button onclick="showOrders()" class="mb-6 flex items-center text-blue-600 hover:text-blue-800">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Orders
                </button>
                
                <!-- Order Header -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">Order Details</h1>
                            <p class="text-gray-600 mt-1">Order #${orderId
                              .substring(0, 8)
                              .toUpperCase()}</p>
                        </div>
                        <div class="text-right">
                            <span class="inline-block px-4 py-2 rounded-full text-sm font-medium ${statusColor}">
                                ${
                                  (order.status || "pending")
                                    .charAt(0)
                                    .toUpperCase() +
                                  (order.status || "pending").slice(1)
                                }
                            </span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">Order Date</h3>
                            <p class="text-gray-600">${orderDate}</p>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">Customer</h3>
                            <p class="text-gray-600">${
                              order.customerEmail || "N/A"
                            }</p>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-2">Total Amount</h3>
                            <p class="text-2xl font-bold text-green-600">₹${(
                              order.total || 0
                            ).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Order Items -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">Order Items</h2>
                    <div class="space-y-4">
                        ${displayItems
                          .map(
                            (item) => `
                            <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                                <img src="${
                                  item.imageUrl ||
                                  "https://via.placeholder.com/80x80"
                                }" 
                                     alt="${
                                       item.name || "Product"
                                     }" class="w-20 h-20 object-cover rounded">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-lg">${
                                      item.name || "Unknown Product"
                                    }</h3>
                                    <p class="text-gray-600">Sold by: ${
                                      vendorInfoCache[item.vendorId] ||
                                      "Unknown Vendor"
                                    }</p>
                                    <div class="flex items-center space-x-4 mt-2">
                                        <span class="text-gray-600">Price: ₹${(
                                          item.price || 0
                                        ).toFixed(2)}</span>
                                        <span class="text-gray-600">Quantity: ${
                                          item.quantity || 1
                                        }</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-xl font-bold">₹${(
                                      (item.price || 0) * (item.quantity || 1)
                                    ).toFixed(2)}</p>
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
                
                <!-- Order Summary -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal:</span>
                            <span class="font-medium">₹${(
                              order.subtotal || 0
                            ).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Shipping:</span>
                            <span class="font-medium">₹${(
                              order.shippingCost || 0
                            ).toFixed(2)}</span>
                        </div>
                        <div class="border-t pt-3">
                            <div class="flex justify-between items-center">
                                <span class="text-lg font-semibold">Total:</span>
                                <span class="text-2xl font-bold text-green-600">₹${(
                                  order.total || 0
                                ).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Shipping Information -->
                ${
                  order.shippingInfo
                    ? `
                    <div class="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 class="text-xl font-semibold mb-4">Shipping Information</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                                <div class="text-gray-600">
                                    <p class="font-medium">${
                                      order.shippingInfo.name || "N/A"
                                    }</p>
                                    <p>${
                                      order.shippingInfo.address || "N/A"
                                    }</p>
                                    <p>${order.shippingInfo.city || "N/A"}, ${
                        order.shippingInfo.zip || "N/A"
                      }</p>
                                </div>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">Contact Information</h3>
                                <div class="text-gray-600">
                                    <p>Email: ${
                                      order.shippingInfo.email ||
                                      order.customerEmail ||
                                      "N/A"
                                    }</p>
                                    <p>Phone: ${
                                      order.shippingInfo.phone || "N/A"
                                    }</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `
                    : ""
                }
                
                <!-- Order Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-semibold mb-4">Actions</h2>
                    <div class="flex flex-wrap gap-3">
                        ${
                          userRole === "vendor" && order.status === "pending"
                            ? `
                            <button onclick="updateOrderStatus('${orderId}', 'processing')" 
                                    class="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700">
                                <i class="fas fa-clock mr-2"></i>Mark as Processing
                            </button>
                        `
                            : ""
                        }
                        ${
                          userRole === "vendor" && order.status === "processing"
                            ? `
                            <button onclick="updateOrderStatus('${orderId}', 'shipped')" 
                                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-shipping-fast mr-2"></i>Mark as Shipped
                            </button>
                        `
                            : ""
                        }
                        ${
                          userRole === "vendor" && order.status === "shipped"
                            ? `
                            <button onclick="updateOrderStatus('${orderId}', 'delivered')" 
                                    class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                                <i class="fas fa-check-circle mr-2"></i>Mark as Delivered
                            </button>
                        `
                            : ""
                        }
                        ${
                          userRole === "customer" &&
                          ["pending", "processing"].includes(order.status)
                            ? `
                            <button onclick="cancelOrderFromDetails('${orderId}')" 
                                    class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                                <i class="fas fa-times mr-2"></i>Cancel Order
                            </button>
                        `
                            : ""
                        }
                        <button onclick="printOrder('${orderId}')" 
                                class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                            <i class="fas fa-print mr-2"></i>Print Order
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.getElementById("mainContent").innerHTML = content;
  } catch (error) {
    console.error("Error loading order details:", error);
    showMessage("Error loading order details: " + error.message, "error");
  } finally {
    hideLoading();
  }
}

// Helper function to safely get timestamp from Firestore date
function getOrderTimestamp(createdAt) {
  try {
    if (createdAt && typeof createdAt.toDate === "function") {
      return createdAt.toDate().getTime();
    } else if (createdAt && createdAt.seconds) {
      return createdAt.seconds * 1000;
    } else if (createdAt) {
      return new Date(createdAt).getTime();
    }
  } catch (error) {
    console.warn("Error parsing timestamp:", error);
  }
  return 0; // Default to epoch if can't parse
}

// Cancel order from details page
async function cancelOrderFromDetails(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  showLoading();

  try {
    const orderDoc = await ordersCollection.doc(orderId).get();
    const order = orderDoc.data();

    // Restore product stock
    for (const item of order.items) {
      await productsCollection.doc(item.id).update({
        stock: firebase.firestore.FieldValue.increment(item.quantity),
      });
    }

    // Update order status
    await ordersCollection.doc(orderId).update({
      status: "cancelled",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage("Order cancelled successfully", "success");

    // Refresh the order details page
    viewOrderDetails(orderId);
  } catch (error) {
    console.error("Error cancelling order:", error);
    showMessage("Error cancelling order", "error");
  } finally {
    hideLoading();
  }
}

// Print order functionality
function printOrder(orderId) {
  // Create a print-friendly version of the order details
  const printContent = document.querySelector("#mainContent").innerHTML;
  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order #${orderId.substring(0, 8).toUpperCase()}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .bg-white { background: white; }
                .rounded-lg { border-radius: 8px; }
                .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .p-6 { padding: 24px; }
                .mb-6 { margin-bottom: 24px; }
                .text-3xl { font-size: 1.875rem; }
                .text-xl { font-size: 1.25rem; }
                .text-lg { font-size: 1.125rem; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .text-gray-600 { color: #6b7280; }
                .text-green-600 { color: #059669; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .gap-6 { gap: 24px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .space-y-4 > * + * { margin-top: 16px; }
                .border-t { border-top: 1px solid #e5e7eb; }
                .pt-3 { padding-top: 12px; }
                button, .bg-yellow-600, .bg-blue-600, .bg-green-600, .bg-red-600, .bg-gray-600 { display: none; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);

  printWindow.document.close();
  printWindow.focus();

  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

// Order Management Functions

async function loadOrders() {
  try {
    const ordersSnapshot = await ordersCollection
      .orderBy("createdAt", "desc")
      .get();
    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    renderOrdersTable(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    const ordersContainer = document.getElementById("ordersList");
    if (ordersContainer) {
      ordersContainer.innerHTML = '<p class="text-red-500">Error loading orders.</p>';
    }
  }
}

function renderOrdersTable(orders) {
  let tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
    `;

  if (orders.length === 0) {
    tableHtml +=
      '<tr><td colspan="7" class="text-center py-4">No orders found.</td></tr>';
  } else {
    orders.forEach((order) => {
      const date = order.createdAt
        ? new Date(order.createdAt.toDate()).toLocaleDateString()
        : "N/A";
      tableHtml += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.id.substring(
                      0,
                      8
                    )}...</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                      order.customerEmail || "N/A"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹${
                      order.total ? order.total.toFixed(2) : "0.00"
                    }</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          order.deliveryType === 'express' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }">
                            <i class="fas fa-${order.deliveryType === 'express' ? 'bolt' : 'truck'} mr-1"></i>
                            ${order.deliveryType === 'express' ? 'Express' : order.deliveryType === 'normal' ? 'Normal' : 'Standard'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          order.status
                        )}">
                            ${order.status || "pending"}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="showEditOrderModal('${
                          order.id
                        }')" class="text-blue-600 hover:text-blue-900">Edit</button>
                        <button onclick="deleteOrder('${
                          order.id
                        }')" class="text-red-600 hover:text-red-900 ml-4">Delete</button>
                    </td>
                </tr>
            `;
    });
  }

  tableHtml += `
                </tbody>
            </table>
        </div>
    `;
  const ordersContainer = document.getElementById("ordersList");
  if (ordersContainer) {
    ordersContainer.innerHTML = tableHtml;
  }
}

function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-indigo-100 text-indigo-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function showAddOrderModal() {
  // Check if modal elements exist (admin dashboard only)
  const modalTitle = document.getElementById("orderModalTitle");
  const orderForm = document.getElementById("orderForm");
  const orderModal = document.getElementById("orderModal");
  const submitButton = document.getElementById("orderFormSubmit");
  const orderIdField = document.getElementById("orderId");
  
  if (!modalTitle || !orderForm || !orderModal || !submitButton || !orderIdField) {
    console.warn("Order add modal not available on this page");
    const message = "Order creation is only available in the admin dashboard";
    if (typeof showMessage === 'function') {
      showMessage(message, "warning");
    } else {
      alert(message);
    }
    return;
  }
  
  modalTitle.textContent = "Add New Order";
  orderForm.reset();
  orderIdField.value = "";
  submitButton.textContent = "Create Order";
  orderForm.onsubmit = handleAddOrder;
  orderModal.classList.remove("hidden");
}

async function showEditOrderModal(orderId) {
  try {
    // Check if modal elements exist (admin dashboard only)
    const modalTitle = document.getElementById("orderModalTitle");
    const orderForm = document.getElementById("orderForm");
    const orderModal = document.getElementById("orderModal");
    
    if (!modalTitle || !orderForm || !orderModal) {
      console.warn("Order edit modal not available on this page");
      const message = "Order editing is only available in the admin dashboard";
      if (typeof showMessage === 'function') {
        showMessage(message, "warning");
      } else {
        alert(message);
      }
      return;
    }
    
    const orderDoc = await ordersCollection.doc(orderId).get();
    if (!orderDoc.exists) {
      const message = "Order not found";
      if (typeof showMessage === 'function') {
        showMessage(message, "error");
      } else {
        alert(message);
      }
      return;
    }
    
    const order = orderDoc.data();
    
    // Safely set element values with null checks
    modalTitle.textContent = "Edit Order";
    orderForm.reset();
    
    const orderIdField = document.getElementById("orderId");
    const customerEmailField = document.getElementById("orderCustomerEmailInput");
    const totalField = document.getElementById("orderTotalInput");
    const statusField = document.getElementById("orderStatusSelect");
    const submitButton = document.getElementById("orderFormSubmit");
    
    if (orderIdField) orderIdField.value = orderId;
    if (customerEmailField) customerEmailField.value = order.customerEmail || "";
    if (totalField) totalField.value = order.total || 0;
    if (statusField) statusField.value = order.status || "pending";
    if (submitButton) submitButton.textContent = "Save Changes";
    
    orderForm.onsubmit = handleUpdateOrder;
    orderModal.classList.remove("hidden");
    
  } catch (error) {
    console.error("Error fetching order for edit:", error);
    const message = "Failed to load order data: " + error.message;
    if (typeof showMessage === 'function') {
      showMessage(message, "error");
    } else {
      alert(message);
    }
  }
}

function closeOrderModal() {
  const orderModal = document.getElementById("orderModal");
  if (orderModal) {
    orderModal.classList.add("hidden");
  }
}

async function handleAddOrder(event) {
  event.preventDefault();
  const customerEmail = document.getElementById(
    "orderCustomerEmailInput"
  ).value;
  const total = parseFloat(document.getElementById("orderTotalInput").value);
  const status = document.getElementById("orderStatusSelect").value;

  try {
    await ordersCollection.add({
      customerEmail,
      total,
      status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    alert("Order created successfully!");
    closeOrderModal();
    loadOrders();
  } catch (error) {
    console.error("Error creating order:", error);
    alert("Failed to create order: " + error.message);
  }
}

async function handleUpdateOrder(event) {
  event.preventDefault();
  const orderId = document.getElementById("orderId").value;
  const customerEmail = document.getElementById(
    "orderCustomerEmailInput"
  ).value;
  const total = parseFloat(document.getElementById("orderTotalInput").value);
  const status = document.getElementById("orderStatusSelect").value;

  try {
    await ordersCollection.doc(orderId).update({
      customerEmail,
      total,
      status,
    });
    alert("Order updated successfully!");
    closeOrderModal();
    loadOrders();
  } catch (error) {
    console.error("Error updating order:", error);
    alert("Failed to update order.");
  }
}

async function deleteOrder(orderId) {
  if (
    confirm(
      `Are you sure you want to delete this order? This action cannot be undone.`
    )
  ) {
    try {
      await ordersCollection.doc(orderId).delete();
      alert("Order deleted successfully.");
      loadOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order.");
    }
  }
}
