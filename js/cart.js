// Shopping cart management

let cart = [];

// Initialize cart with proper validation
function initializeCart() {
  try {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      // Ensure it's an array
      if (Array.isArray(parsedCart)) {
        cart = parsedCart;
      } else {
        console.warn("Invalid cart data in localStorage, resetting cart");
        cart = [];
        localStorage.removeItem("cart");
      }
    } else {
      cart = [];
    }
  } catch (error) {
    console.error("Error parsing cart from localStorage:", error);
    cart = [];
    localStorage.removeItem("cart");
  }
}

// Initialize cart on script load
initializeCart();

// Add product to cart
async function addToCart(productId) {
  console.log("Adding product to cart:", productId);

  // Ensure cart is always an array
  if (!Array.isArray(cart)) {
    console.warn("Cart is not an array, reinitializing...");
    initializeCart();
  }

  // Check if Firebase is initialized
  if (!productsCollection) {
    showMessage("System not ready. Please try again.", "error");
    return;
  }

  try {
    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      showMessage("Product not found", "error");
      return;
    }

    const product = productDoc.data();
    console.log("Product data:", product);

    // Check if product is already in cart
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showMessage("Cannot add more items - insufficient stock", "error");
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        vendorId: product.vendorId,
        quantity: 1,
        maxStock: product.stock,
      });
    }

    console.log("Cart after adding:", cart);
    saveCart();
    updateCartUI();
    showMessage("Product added to cart!", "success");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showMessage("Error adding product to cart: " + error.message, "error");
  }
}

// Remove product from cart
function removeFromCart(productId) {
  // Ensure cart is an array
  if (!Array.isArray(cart)) {
    initializeCart();
  }

  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCartUI();
  if (document.getElementById("cartPage")) {
    showCart();
  }
}

// Update quantity in cart
function updateCartQuantity(productId, newQuantity) {
  // Ensure cart is an array
  if (!Array.isArray(cart)) {
    initializeCart();
  }

  const item = cart.find((item) => item.id === productId);
  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity <= item.maxStock) {
      item.quantity = newQuantity;
      saveCart();
      updateCartUI();
      if (document.getElementById("cartPage")) {
        showCart();
      }
    } else {
      showMessage("Insufficient stock available", "error");
    }
  }
}

// Save cart to localStorage
function saveCart() {
  try {
    // Ensure cart is an array before saving
    if (!Array.isArray(cart)) {
      console.error("Attempting to save non-array cart:", cart);
      cart = [];
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("Cart saved to localStorage:", cart);
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
}

// Update cart UI (cart count badge)
function updateCartUI() {
  try {
    // Ensure cart is an array
    if (!Array.isArray(cart)) {
      initializeCart();
    }

    const cartCount = document.getElementById("cartCount");
    if (!cartCount) {
      console.warn("Cart count element not found");
      return;
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
      cartCount.textContent = totalItems;
      cartCount.classList.remove("hidden");
    } else {
      cartCount.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error updating cart UI:", error);
  }
}

// Show cart page
function showCart() {
  console.log("Showing cart. Current cart contents:", cart);

  const content = `
        <div class="max-w-4xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold mb-8">Shopping Cart</h1>
            
            <div id="cartPage">
                ${
                  cart.length === 0
                    ? `
                    <div class="text-center py-12">
                        <div class="text-gray-500">
                            <i class="fas fa-shopping-cart text-6xl mb-4"></i>
                            <p class="text-xl mb-4">Your cart is empty</p>
                            <button onclick="showProducts()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                `
                    : `
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-6">
                            <div class="space-y-4">
                                ${cart
                                  .map(
                                    (item) => `
                                    <div class="flex items-center space-x-4 p-4 border-b border-gray-200">
                                        <img src="${
                                          item.imageUrl ||
                                          "https://via.placeholder.com/80x80"
                                        }" 
                                             alt="${
                                               item.name
                                             }" class="w-20 h-20 object-cover rounded">
                                        <div class="flex-1">
                                            <h3 class="font-semibold">${
                                              item.name
                                            }</h3>
                                            <p class="text-gray-600">₹${item.price.toFixed(
                                              2
                                            )} each</p>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <button onclick="updateCartQuantity('${
                                              item.id
                                            }', ${item.quantity - 1})" 
                                                    class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                                                <i class="fas fa-minus text-sm"></i>
                                            </button>
                                            <span class="w-12 text-center">${
                                              item.quantity
                                            }</span>
                                            <button onclick="updateCartQuantity('${
                                              item.id
                                            }', ${item.quantity + 1})" 
                                                    class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                                                <i class="fas fa-plus text-sm"></i>
                                            </button>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-semibold">₹${(
                                              item.price * item.quantity
                                            ).toFixed(2)}</p>
                                            <button onclick="removeFromCart('${
                                              item.id
                                            }')" 
                                                    class="text-red-600 hover:text-red-800 text-sm mt-1">
                                                <i class="fas fa-trash mr-1"></i>Remove
                                            </button>
                                        </div>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                            
                            <div class="mt-6 pt-6 border-t border-gray-200">
                                <div class="flex justify-between items-center mb-4">
                                    <span class="text-xl font-semibold">Total: ₹${getCartTotal().toFixed(
                                      2
                                    )}</span>
                                </div>
                                
                                <div class="flex gap-4">
                                    <button onclick="showProducts()" 
                                            class="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
                                        Continue Shopping
                                    </button>
                                    <button onclick="proceedToCheckout()" 
                                            class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
                }
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
}

// Get cart total
function getCartTotal() {
  // Ensure cart is an array
  if (!Array.isArray(cart)) {
    initializeCart();
  }
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Proceed to checkout
function proceedToCheckout() {
  if (!currentUser) {
    showMessage("Please login to proceed to checkout", "error");
    showLogin();
    return;
  }

  if (cart.length === 0) {
    showMessage("Your cart is empty", "error");
    return;
  }

  showCheckout();
}

// Show checkout page
function showCheckout() {
  if (!currentUser) {
    showMessage("Please login to proceed with checkout", "error");
    showLogin();
    return;
  }

  if (cart.length === 0) {
    showMessage("Your cart is empty", "error");
    return;
  }

  const subtotal = getCartTotal();

  const content = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Checkout</h1>
      
      <form id="checkoutForm" class="space-y-6">
        <!-- Shipping Information -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Shipping Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" id="shippingName" placeholder="Full Name" required 
                   class="border rounded-lg px-4 py-2 w-full">
            <input type="email" id="shippingEmail" placeholder="Email" value="${currentUser.email}" required 
                   class="border rounded-lg px-4 py-2 w-full">
            <input type="tel" id="shippingPhone" placeholder="Phone Number" required 
                   class="border rounded-lg px-4 py-2 w-full">
            <input type="text" id="shippingCity" placeholder="City" required 
                   class="border rounded-lg px-4 py-2 w-full">
          </div>
          <div class="mt-4">
            <textarea id="shippingAddress" placeholder="Complete Address" required 
                      class="border rounded-lg px-4 py-2 w-full h-24"></textarea>
            <input type="text" id="shippingZip" placeholder="ZIP Code" required 
                   class="border rounded-lg px-4 py-2 w-full mt-4">
          </div>
        </div>

        <!-- Delivery Options -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Delivery Options</h2>
          <div class="space-y-4">
            <!-- Normal Delivery -->
            <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="radio" name="deliveryType" value="normal" checked 
                     onchange="updateDeliveryCost()" class="mr-4 h-4 w-4 text-blue-600">
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-medium text-gray-900">Normal Delivery</h3>
                    <p class="text-sm text-gray-600">3-5 business days</p>
                  </div>
                  <span class="font-medium text-gray-900">₹50</span>
                </div>
              </div>
            </label>

            <!-- Express Delivery -->
            <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-orange-200 bg-orange-50">
              <input type="radio" name="deliveryType" value="express" 
                     onchange="updateDeliveryCost()" class="mr-4 h-4 w-4 text-orange-600">
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-medium text-orange-900 flex items-center">
                      <i class="fas fa-bolt mr-2 text-orange-600"></i>
                      Express Delivery
                    </h3>
                    <p class="text-sm text-orange-700">1-2 business days • Priority Processing</p>
                  </div>
                  <span class="font-medium text-orange-900">₹150</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
          <div class="space-y-3 mb-4">
            ${cart
              .map(
                (item) => `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-medium">${item.name}</p>
                        <p class="text-sm text-gray-600">${
                          item.quantity
                        } × ₹${item.price.toFixed(2)}</p>
                    </div>
                    <p class="font-semibold">₹${(
                      item.price * item.quantity
                    ).toFixed(2)}</p>
                </div>
            `
              )
              .join("")}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span>Delivery:</span>
              <span id="deliveryCost">₹50.00</span>
            </div>
            <div class="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span id="totalAmount">₹${(subtotal + 50).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Place Order Button -->
        <button type="button" onclick="placeOrderWithDelivery()" 
                class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Place Order
        </button>
      </form>
    </div>
  `;
  document.getElementById("mainContent").innerHTML = content;
}

// Update delivery cost based on selected option
function updateDeliveryCost() {
  const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
  const deliveryCost = deliveryType === 'express' ? 150 : 50;
  const subtotal = getCartTotal();
  const total = subtotal + deliveryCost;

  document.getElementById('deliveryCost').textContent = `₹${deliveryCost.toFixed(2)}`;
  document.getElementById('totalAmount').textContent = `₹${total.toFixed(2)}`;
}

// Enhanced place order function with delivery priority
async function placeOrderWithDelivery() {
  const form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  showLoading();

  try {
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const deliveryCost = deliveryType === 'express' ? 150 : 50;
    
    const shippingInfo = {
      name: document.getElementById("shippingName").value,
      email: document.getElementById("shippingEmail").value,
      phone: document.getElementById("shippingPhone").value,
      address: document.getElementById("shippingAddress").value,
      city: document.getElementById("shippingCity").value,
      zip: document.getElementById("shippingZip").value,
    };

    // Add individual item status to each cart item
    const itemsWithStatus = cart.map(item => ({
      ...item,
      itemStatus: "pending", // Individual item status
      statusUpdatedAt: new Date(), // Use regular Date instead of serverTimestamp in array
      statusUpdatedBy: null
    }));

    const orderData = {
      customerId: currentUser.uid,
      customerEmail: currentUser.email,
      items: itemsWithStatus,
      shippingInfo: shippingInfo,
      subtotal: getCartTotal(),
      deliveryType: deliveryType,
      deliveryCost: deliveryCost,
      total: getCartTotal() + deliveryCost,
      status: "pending", // Overall order status
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      estimatedDelivery: deliveryType === 'express' ? 
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : // 2 days
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)   // 5 days
    };

    const orderRef = await ordersCollection.add(orderData);

    // Add to delivery priority queue
    deliveryQueue.enqueue({
      id: orderRef.id,
      ...orderData,
      createdAt: { toMillis: () => Date.now(), toDate: () => new Date() }
    });

    // Update product stock
    for (const item of cart) {
      const productRef = productsCollection.doc(item.id);
      await productRef.update({
        stock: firebase.firestore.FieldValue.increment(-item.quantity),
      });
    }

    // Clear cart and redirect
    cart = [];
    saveCart();
    updateCartUI();

    showMessage(`Order placed successfully! Order ID: ${orderRef.id}`, "success");
    
    // Show order confirmation
    showOrderConfirmationWithDelivery(orderRef.id, orderData);

  } catch (error) {
    console.error("Error placing order:", error);
    showMessage("Error placing order: " + error.message, "error");
  } finally {
    hideLoading();
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
  
  return parts.join(', ');
}

// Show order confirmation with delivery details
function showOrderConfirmationWithDelivery(orderId, orderData) {
  const deliveryText = orderData.deliveryType === 'express' ? 
    'Express Delivery (1-2 business days)' : 
    'Normal Delivery (3-5 business days)';
    
  const content = `
    <div class="max-w-2xl mx-auto px-4 py-8 text-center">
      <div class="bg-green-50 border border-green-200 rounded-lg p-8">
        <i class="fas fa-check-circle text-green-600 text-6xl mb-4"></i>
        <h1 class="text-3xl font-bold text-green-800 mb-4">Order Confirmed!</h1>
        <p class="text-lg text-gray-700 mb-6">
          Your order has been placed successfully and added to our delivery queue.
        </p>
        
        <div class="bg-white rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Order Details</h2>
          <div class="text-left space-y-2">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.total.toFixed(2)}</p>
            <p><strong>Delivery:</strong> ${deliveryText}</p>
            <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery.toLocaleDateString()}</p>
          </div>
        </div>
        
        <div class="space-x-4">
          <button onclick="showOrders()" 
                  class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            View My Orders
          </button>
          <button onclick="showProducts()" 
                  class="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById("mainContent").innerHTML = content;
}

// Place order (original function - kept for backward compatibility)
async function placeOrder() {
  const form = document.getElementById("checkoutForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  showLoading();

  try {
    const shippingInfo = {
      name: document.getElementById("shippingName").value,
      email: document.getElementById("shippingEmail").value,
      phone: document.getElementById("shippingPhone").value,
      address: document.getElementById("shippingAddress").value,
      city: document.getElementById("shippingCity").value,
      zip: document.getElementById("shippingZip").value,
    };

    const orderData = {
      customerId: currentUser.uid,
      customerEmail: currentUser.email,
      items: cart,
      shippingInfo: shippingInfo,
      subtotal: getCartTotal(),
      shippingCost: 5.0,
      total: getCartTotal() + 5,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Create order
    const orderRef = await ordersCollection.add(orderData);

    // Update product stock
    for (const item of cart) {
      const productRef = productsCollection.doc(item.id);
      await productRef.update({
        stock: firebase.firestore.FieldValue.increment(-item.quantity),
      });
    }

    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();

    showMessage("Order placed successfully!", "success");
    showOrderConfirmation(orderRef.id);
  } catch (error) {
    console.error("Error placing order:", error);
    showMessage("Error placing order", "error");
  } finally {
    hideLoading();
  }
}

// Show order confirmation
function showOrderConfirmation(orderId) {
  const content = `
        <div class="max-w-2xl mx-auto px-4 py-8 text-center">
            <div class="bg-white p-8 rounded-lg shadow">
                <div class="text-green-600 mb-4">
                    <i class="fas fa-check-circle text-6xl"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
                <p class="text-gray-600 mb-6">Thank you for your order. We've received your order and will process it shortly.</p>
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <p class="text-sm text-gray-600 mb-2">Order ID:</p>
                    <p class="font-mono text-lg">${orderId}</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="showOrders()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                        View Orders
                    </button>
                    <button onclick="showProducts()" class="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
}

// Initialize cart on page load
document.addEventListener("DOMContentLoaded", function () {
  // Delay cart UI update to ensure DOM is fully ready
  setTimeout(() => {
    updateCartUI();
  }, 100);
});

// Also update cart UI when window loads (backup)
window.addEventListener("load", function () {
  updateCartUI();
});

// Debug function to test cart functionality
window.testCart = function () {
  console.log("Testing cart functionality...");
  console.log("Current cart:", cart);
  console.log("Cart count element:", document.getElementById("cartCount"));
  console.log("Main content element:", document.getElementById("mainContent"));

  // Test showing cart
  showCart();
};
