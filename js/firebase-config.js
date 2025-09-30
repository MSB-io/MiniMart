// Firebase Configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB19YvztCXUJTuzQM-14bAwa7-vzQxhCE8",
  authDomain: "mvoms3.firebaseapp.com",
  projectId: "mvoms3",
  storageBucket: "mvoms3.firebasestorage.app",
  messagingSenderId: "371403458907",
  appId: "1:371403458907:web:23ee651cb0d611bf77b27e",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Collections references
const usersCollection = db.collection("users");
const productsCollection = db.collection("products");
const ordersCollection = db.collection("orders");

// Current user state
let currentUser = null;
let userRole = null; // 'customer', 'vendor', or 'admin'

// Initialize app when auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    loadUserData();
    updateNavigation(true);
  } else {
    currentUser = null;
    userRole = null;
    updateNavigation(false);
  }
});

// Load user data and role
async function loadUserData() {
  if (currentUser) {
    try {
      const userDoc = await usersCollection.doc(currentUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userRole = userData.role;

        // Update username in navigation
        const userNameElement = document.getElementById("userName");
        if (userNameElement) {
          userNameElement.textContent = userData.name || currentUser.email;
        }

        // Auto-redirect vendors to dashboard if they're on home page after login
        // Check if we're on the home page (contains homePage element) or login/register forms
        const isOnHomePage = document.getElementById("homePage");
        const isOnLoginForm = document.getElementById("loginForm");
        const isOnRegisterForm = document.getElementById("registerForm");

        if (
          userRole === "vendor" &&
          (isOnHomePage || isOnLoginForm || isOnRegisterForm)
        ) {
          // Small delay to ensure smooth transition
          setTimeout(() => {
            showVendorDashboard();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }
}

// Update navigation based on auth state
function updateNavigation(isLoggedIn) {
  const authButtons = document.getElementById("authButtons");
  const userMenu = document.getElementById("userMenu");

  if (isLoggedIn) {
    authButtons.classList.add("hidden");
    userMenu.classList.remove("hidden");
  } else {
    authButtons.classList.remove("hidden");
    userMenu.classList.add("hidden");
  }
}

// Show/hide loading spinner
function showLoading() {
  document.getElementById("loadingSpinner").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loadingSpinner").classList.add("hidden");
}

// Delivery Priority Queue System
class DeliveryPriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Calculate priority score based on delivery type and order time
  calculatePriority(order) {
    let priority = 0;
    
    // Express delivery gets highest priority
    if (order.deliveryType === 'express') {
      priority += 1000; // High base priority for express
    } else {
      priority += 100; // Lower priority for normal delivery
    }
    
    // Add timestamp-based priority (older orders get slight priority boost)
    const hoursOld = (Date.now() - order.createdAt.toMillis()) / (1000 * 60 * 60);
    priority += Math.min(hoursOld * 5, 50); // Max 50 points for age
    
    // Add order value factor (higher value orders get slight boost)
    priority += Math.min(order.total / 100, 20); // Max 20 points for value
    
    return priority;
  }

  enqueue(order) {
    const priorityOrder = {
      ...order,
      priority: this.calculatePriority(order),
      queuedAt: new Date()
    };
    
    this.heap.push(priorityOrder);
    this.heapifyUp(this.heap.length - 1);
    
    // Update queue display
    this.updateQueueDisplay();
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    
    const highestPriority = this.heap[0];
    const lastElement = this.heap.pop();
    
    if (this.heap.length > 0) {
      this.heap[0] = lastElement;
      this.heapifyDown(0);
    }
    
    this.updateQueueDisplay();
    return highestPriority;
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority >= this.heap[index].priority) break;
      
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  heapifyDown(index) {
    while (true) {
      let maxIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      
      if (leftChild < this.heap.length && 
          this.heap[leftChild].priority > this.heap[maxIndex].priority) {
        maxIndex = leftChild;
      }
      
      if (rightChild < this.heap.length && 
          this.heap[rightChild].priority > this.heap[maxIndex].priority) {
        maxIndex = rightChild;
      }
      
      if (maxIndex === index) break;
      
      [this.heap[index], this.heap[maxIndex]] = [this.heap[maxIndex], this.heap[index]];
      index = maxIndex;
    }
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // Get all orders separated by delivery type
  getOrdersByType() {
    const express = this.heap.filter(order => order.deliveryType === 'express')
                             .sort((a, b) => b.priority - a.priority);
    const normal = this.heap.filter(order => order.deliveryType === 'normal')
                            .sort((a, b) => b.priority - a.priority);
    return { express, normal };
  }

  // Update queue display in vendor dashboard
  updateQueueDisplay() {
    const queueDisplay = document.getElementById('deliveryQueueDisplay');
    if (!queueDisplay) return;

    const { express, normal } = this.getOrdersByType();
    
    queueDisplay.innerHTML = `
      <div class="space-y-6">
        <!-- Express Delivery Queue -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 class="font-semibold text-red-800 mb-3 flex items-center">
            <i class="fas fa-bolt mr-2"></i>
            Express Delivery Queue (${express.length})
          </h3>
          ${express.length > 0 ? 
            express.map(order => this.renderOrderCard(order, 'express')).join('') :
            '<p class="text-red-600 text-sm">No express orders in queue</p>'
          }
        </div>

        <!-- Normal Delivery Queue -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-800 mb-3 flex items-center">
            <i class="fas fa-truck mr-2"></i>
            Normal Delivery Queue (${normal.length})
          </h3>
          ${normal.length > 0 ? 
            normal.map(order => this.renderOrderCard(order, 'normal')).join('') :
            '<p class="text-blue-600 text-sm">No normal orders in queue</p>'
          }
        </div>
      </div>
    `;
  }

  renderOrderCard(order, type) {
    const priorityColor = type === 'express' ? 'text-red-600' : 'text-blue-600';
    const bgColor = type === 'express' ? 'bg-red-100' : 'bg-blue-100';
    
    return `
      <div class="bg-white border rounded-lg p-3 mb-2">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-medium">Order #${order.id.substring(0, 8)}</p>
            <p class="text-sm text-gray-600">₹${order.total.toFixed(2)}</p>
            <p class="text-xs text-gray-500">
              ${new Date(order.createdAt.toDate()).toLocaleString()}
            </p>
          </div>
          <div class="text-right">
            <span class="${bgColor} ${priorityColor} px-2 py-1 rounded text-xs font-medium">
              ${type.toUpperCase()}
            </span>
            <p class="text-xs text-gray-500 mt-1">
              Priority: ${Math.round(order.priority)}
            </p>
          </div>
        </div>
        <div class="mt-3 flex space-x-2">
          <button onclick="processDeliveryOrder('${order.id}')" 
                  class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
            Process
          </button>
          <button onclick="viewOrderDetails('${order.id}')" 
                  class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
            Details
          </button>
        </div>
      </div>
    `;
  }
}

// Global delivery queue instance
const deliveryQueue = new DeliveryPriorityQueue();
