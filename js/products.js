// Products management functions

// Show products page
function showProducts() {
  const content = `
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold">Products</h1>
                ${
                  userRole === "vendor"
                    ? `
                    <button onclick="showAddProduct()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Product
                    </button>
                `
                    : ""
                }
            </div>



            <!-- Products Grid -->
            <div id="productsGrid" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <!-- Products will be loaded here -->
            </div>

            <!-- No products message -->
            <div id="noProducts" class="hidden text-center py-12">
                <div class="text-gray-500">
                    <i class="fas fa-box-open text-6xl mb-4"></i>
                    <p class="text-xl">No products found</p>
                </div>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
  loadProducts();
}

// Show add product form (for vendors)
function showAddProduct() {
  const content = `
        <div class="max-w-2xl mx-auto px-4 py-8">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-2xl font-bold mb-6">Add New Product</h2>
                <form id="addProductForm" onsubmit="handleAddProduct(event)">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                            <input type="text" id="productName" required
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        

                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                            <input type="number" id="productPrice" step="0.01" min="0" required
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                            <input type="number" id="productStock" min="0" required
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                            <input type="file" id="productImage" accept="image/*"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea id="productDescription" rows="4" required
                                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </div>
                    
                    <div class="flex gap-4 mt-6">
                        <button type="submit" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                            Add Product
                        </button>
                        <button type="button" onclick="showProducts()" class="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
}

// Load products
async function loadProducts() {
  showLoading();
  try {
    let query = productsCollection.where("isActive", "==", true); // Only active products

    // If vendor, show only their products
    if (userRole === "vendor") {
      query = query.where("vendorId", "==", currentUser.uid); // Filter by vendor ID
    }

    const snapshot = await query.get();
    const productsGrid = document.getElementById("productsGrid");
    const noProducts = document.getElementById("noProducts");

    if (snapshot.empty) {
      productsGrid.innerHTML = "";
      noProducts.classList.remove("hidden");
      return;
    }

    noProducts.classList.add("hidden");
    productsGrid.innerHTML = "";

    // Reset the products title to default
    const productsTitle = document.querySelector("#mainContent h1");
    if (productsTitle) {
      productsTitle.textContent = "Products";
    }

    snapshot.forEach((doc) => {
      const product = doc.data();
      const productCard = createProductCard(doc.id, product);
      productsGrid.appendChild(productCard);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    showMessage("Error loading products", "error");
  } finally {
    hideLoading();
  }
}

// Create product card element
function createProductCard(productId, product) {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300";

  card.innerHTML = `
        <div class="relative">
            <img src="${
              product.imageUrl || "https://via.placeholder.com/300x200"
            }" 
                 alt="${product.name}" 
                 class="w-full h-48 object-cover rounded-t-lg">
            ${
              product.stock <= 0
                ? '<div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">Out of Stock</div>'
                : ""
            }
        </div>
        <div class="p-4">
            <h3 class="font-semibold text-lg mb-2 truncate">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-2 line-clamp-2">${
              product.description
            }</p>
            <div class="flex justify-between items-center mb-3">
                <span class="text-2xl font-bold text-blue-600">₹${
                  product.price
                }</span>
                <span class="text-sm text-gray-500">Stock: ${
                  product.stock
                }</span>
            </div>
            <div class="flex gap-2">
                <button onclick="viewProduct('${productId}')" 
                        class="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                    View Details
                </button>
                ${
                  userRole === "customer" && product.stock > 0
                    ? `
                    <button onclick="addToCart('${productId}')" 
                            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                `
                    : ""
                }
                ${
                  userRole === "vendor" && product.vendorId === currentUser.uid
                    ? `
                    <button onclick="editProduct('${productId}')" 
                            class="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct('${productId}')" 
                            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `;

  return card;
}

// Handle add product form submission
async function handleAddProduct(event) {
  event.preventDefault();
  showLoading();

  try {
    const name = document.getElementById("productName").value; 
    const price = parseFloat(document.getElementById("productPrice").value);
    const stock = parseInt(document.getElementById("productStock").value);
    const description = document.getElementById("productDescription").value;
    const imageFile = document.getElementById("productImage").files[0];

    let imageUrl = "";

    // Upload image if provided
    if (imageFile) { // Check if image file is selected
      const storageRef = storage // Create a storage reference
        .ref() 
        .child(`products/${Date.now()}_${imageFile.name}`); // Unique path
      const snapshot = await storageRef.put(imageFile); // Upload the file
      imageUrl = await snapshot.ref.getDownloadURL(); // Get the download URL
    }

    // Add product to Firestore
    await productsCollection.add({
      name: name,
      description: description,
      price: price,
      stock: stock,
      imageUrl: imageUrl,
      vendorId: currentUser.uid,
      isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage("Product added successfully!", "success");
    showProducts();
  } catch (error) {
    console.error("Error adding product:", error);
    showMessage("Error adding product", "error");
  } finally {
    hideLoading();
  }
}

// Search products
function searchProducts() {
  const searchInput = document.getElementById("searchInput"); // Get search input
  if (!searchInput) { // Check if input exists
    console.error("Search input not found");
    return;
  }

  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm.trim() === "") { // 
    // If we're on products page, reload products
    if (document.getElementById("productsGrid")) {
      loadProducts();
    }
    return;
  }

  // If not on products page, navigate to products first
  const productsGrid = document.getElementById("productsGrid");
  if (!productsGrid) {
    showProducts();
    // Wait for products page to load, then search
    setTimeout(() => {
      performSearch(searchTerm);
    }, 500);
    return;
  }

  performSearch(searchTerm);
}

// Perform the actual search
function performSearch(searchTerm) {
  showLoading();

  try {
    productsCollection
      .where("isActive", "==", true)
      .get()
      .then((snapshot) => { // Get all active products
        const productsGrid = document.getElementById("productsGrid"); // Get products grid
        if (!productsGrid) { // Check if grid exists
          console.error("Products grid not found");
          hideLoading();
          return;
        }

        productsGrid.innerHTML = ""; // Clear existing products
        let hasResults = false; // Flag to track if any results are found


        snapshot.forEach((doc) => { // Loop through each product
          const product = doc.data(); // Get product data
          if (
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) // Check name and description
          ) {
            const productCard = createProductCard(doc.id, product); // Create product card
            productsGrid.appendChild(productCard); // Add to grid
            hasResults = true; // Set flag to true
          }
        });

        // Handle no results display
        const noProducts = document.getElementById("noProducts");
        if (noProducts) {
          if (!hasResults) {
            noProducts.innerHTML = `
                            <div class="text-center py-12">
                                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                                <h2 class="text-2xl font-semibold text-gray-600 mb-2">No products found</h2>
                                <p class="text-gray-500">No products match your search term "${searchTerm}"</p>
                                <button onclick="loadProducts()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                    Show All Products
                                </button>
                            </div>
                        `;
            noProducts.classList.remove("hidden");
          } else {
            noProducts.classList.add("hidden");
          }
        }

        // Update products section title to show search results
        const productsTitle = document.querySelector("#mainContent h1");
        if (productsTitle && hasResults) {
          productsTitle.textContent = `Search Results for "${searchTerm}"`;
        }
      })
      .catch((error) => {
        console.error("Error searching products:", error);
        showMessage("Error searching products: " + error.message, "error");
      })
      .finally(() => {
        hideLoading();
      });
  } catch (error) {
    console.error("Search error:", error);
    showMessage("Search failed: " + error.message, "error");
    hideLoading();
  }
}

// View product details
async function viewProduct(productId) {
  showLoading();

  try {
    const productDoc = await productsCollection.doc(productId).get(); // Fetch product document
    if (!productDoc.exists) {
      showMessage("Product not found", "error");
      return;
    }

    const product = productDoc.data(); // Get product data

    // Get vendor information
    let vendorName = "Unknown Vendor";
    try {
      const vendorDoc = await usersCollection.doc(product.vendorId).get(); // Fetch vendor document
      if (vendorDoc.exists) {
        vendorName = vendorDoc.data().name || "Unknown Vendor"; // Get vendor name
      }
    } catch (error) {
      console.error("Error loading vendor info:", error);
    }

    const content = `
            <div class="max-w-6xl mx-auto px-4 py-8">
                <!-- Back Button -->
                <button onclick="showProducts()" class="mb-6 flex items-center text-blue-600 hover:text-blue-800">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Products
                </button>
                
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Product Image -->
                        <div class="p-6">
                            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img src="${
                                  product.imageUrl ||
                                  "https://via.placeholder.com/500x500"
                                }" 
                                     alt="${product.name}" 
                                     class="w-full h-full object-cover">
                            </div>
                        </div>
                        
                        <!-- Product Information -->
                        <div class="p-6">

                            
                            <h1 class="text-3xl font-bold text-gray-900 mb-4">${
                              product.name
                            }</h1>
                            
                            <div class="flex items-center mb-6">
                                <span class="text-4xl font-bold text-blue-600">₹${product.price.toFixed(
                                  2
                                )}</span>
                                <div class="ml-4">
                                    ${
                                      product.stock > 0
                                        ? `<span class="text-green-600 font-medium">✓ In Stock (${product.stock} available)</span>`
                                        : `<span class="text-red-600 font-medium">✗ Out of Stock</span>`
                                    }
                                </div>
                            </div>
                            
                            <!-- Vendor Information -->
                            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 class="font-semibold text-gray-900 mb-2">Sold by:</h3>
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        ${vendorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="ml-3">
                                        <p class="font-medium">${vendorName}</p>
                                        <p class="text-sm text-gray-600">Verified Vendor</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Quantity Selector -->
                            ${
                              userRole === "customer" && product.stock > 0
                                ? `
                                <div class="mb-6">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                                    <div class="flex items-center space-x-3">
                                        <button onclick="decreaseQuantity()" class="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                                            <i class="fas fa-minus text-sm"></i>
                                        </button>
                                        <input type="number" id="productQuantity" value="1" min="1" max="${product.stock}" 
                                               class="w-20 text-center border border-gray-300 rounded-lg py-2">
                                        <button onclick="increaseQuantity(${product.stock})" class="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                                            <i class="fas fa-plus text-sm"></i>
                                        </button>
                                    </div>
                                </div>
                            `
                                : ""
                            }
                            
                            <!-- Action Buttons -->
                            <div class="flex gap-4 mb-6">
                                ${
                                  userRole === "customer" && product.stock > 0
                                    ? `
                                    <button onclick="addToCartFromDetails('${productId}')" 
                                            class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                                        <i class="fas fa-cart-plus mr-2"></i>
                                        Add to Cart
                                    </button>
                                    <button onclick="buyNow('${productId}')" 
                                            class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">
                                        <i class="fas fa-bolt mr-2"></i>
                                        Buy Now
                                    </button>
                                `
                                    : userRole === "vendor" &&
                                      product.vendorId === currentUser.uid
                                    ? `
                                    <button onclick="editProduct('${productId}')" 
                                            class="flex-1 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-medium">
                                        <i class="fas fa-edit mr-2"></i>
                                        Edit Product
                                    </button>
                                    <button onclick="deleteProduct('${productId}')" 
                                            class="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium">
                                        <i class="fas fa-trash mr-2"></i>
                                        Delete Product
                                    </button>
                                    <button onclick="toggleProductStatus('${productId}', ${!product.isActive})" 
                                            class="flex-1 ${
                                              product.isActive
                                                ? "bg-gray-600 hover:bg-gray-700"
                                                : "bg-green-600 hover:bg-green-700"
                                            } text-white px-6 py-3 rounded-lg font-medium">
                                        <i class="fas fa-${
                                          product.isActive ? "eye-slash" : "eye"
                                        } mr-2"></i>
                                        ${
                                          product.isActive
                                            ? "Deactivate"
                                            : "Activate"
                                        }
                                    </button>
                                `
                                    : ""
                                }
                            </div>
                            
                            <!-- Product Description -->
                            <div class="border-t pt-6">
                                <h3 class="text-lg font-semibold mb-3">Product Description</h3>
                                <div class="text-gray-600 leading-relaxed">
                                    ${product.description
                                      .split("\n")
                                      .map(
                                        (paragraph) =>
                                          `<p class="mb-3">${paragraph}</p>`
                                      )
                                      .join("")}
                                </div>
                            </div>
                            
                            <!-- Product Details -->
                            <div class="border-t pt-6 mt-6">
                                <h3 class="text-lg font-semibold mb-3">Product Details</h3>
                                <div class="grid grid-cols-2 gap-4 text-sm">

                                    <div>
                                        <span class="text-gray-600">Stock:</span>
                                        <span class="ml-2 font-medium">${
                                          product.stock
                                        } units</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Added:</span>
                                        <span class="ml-2 font-medium">${
                                          product.createdAt
                                            ? new Date(
                                                product.createdAt.toDate()
                                              ).toLocaleDateString()
                                            : "N/A"
                                        }</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">Vendor:</span>
                                        <span class="ml-2 font-medium">${vendorName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.getElementById("mainContent").innerHTML = content;
  } catch (error) {
    console.error("Error loading product details:", error);
    showMessage("Error loading product details", "error");
  } finally {
    hideLoading();
  }
}

// Product details page helper functions
function increaseQuantity(maxStock) {
  const quantityInput = document.getElementById("productQuantity");
  const currentValue = parseInt(quantityInput.value);
  if (currentValue < maxStock) {
    quantityInput.value = currentValue + 1;
  }
}

function decreaseQuantity() {
  const quantityInput = document.getElementById("productQuantity");
  const currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
}

// Add to cart from product details page
async function addToCartFromDetails(productId) {
  const quantityInput = document.getElementById("productQuantity");
  const quantity = parseInt(quantityInput.value) || 1;

  try {
    const productDoc = await productsCollection.doc(productId).get();
    if (!productDoc.exists) {
      showMessage("Product not found", "error");
      return;
    }

    const product = productDoc.data();

    // Check if product is already in cart
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        showMessage("Cannot add more items - insufficient stock", "error");
        return;
      }
      existingItem.quantity = newQuantity;
    } else {
      if (quantity > product.stock) {
        showMessage("Cannot add more items - insufficient stock", "error");
        return;
      }
      cart.push({
        id: productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        vendorId: product.vendorId,
        quantity: quantity,
        maxStock: product.stock,
      });
    }

    saveCart();
    updateCartUI();
    showMessage(`${quantity} item(s) added to cart!`, "success");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showMessage("Error adding product to cart", "error");
  }
}

// Buy now functionality
async function buyNow(productId) {
  // Add to cart first
  await addToCartFromDetails(productId);

  // Then redirect to cart
  setTimeout(() => {
    showCart();
  }, 1000);
}

// Toggle product status (for vendors)
async function toggleProductStatus(productId, newStatus) {
  if (
    !confirm(
      `Are you sure you want to ${
        newStatus ? "activate" : "deactivate"
      } this product?`
    )
  ) {
    return;
  }

  showLoading();

  try {
    await productsCollection.doc(productId).update({
      isActive: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage(
      `Product ${newStatus ? "activated" : "deactivated"} successfully!`,
      "success"
    );

    // Refresh the product details page
    viewProduct(productId);
  } catch (error) {
    console.error("Error updating product status:", error);
    showMessage("Error updating product status", "error");
  } finally {
    hideLoading();
  }
}

// Edit product function
async function editProduct(productId) {
  showLoading();

  try {
    // Get product data
    const productDoc = await productsCollection.doc(productId).get(); // Fetch product document
    if (!productDoc.exists) {
      showMessage("Product not found", "error");
      return;
    }

    const product = productDoc.data(); // Get product data

    // Check if user is the owner
    if (product.vendorId !== currentUser.uid) {
      showMessage("You can only edit your own products", "error");
      return;
    }

    const content = `
            <div class="max-w-2xl mx-auto px-4 py-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h1 class="text-3xl font-bold">Edit Product</h1>
                        <button onclick="showProducts()" class="text-gray-600 hover:text-gray-800">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    
                    <form id="editProductForm" onsubmit="handleEditProduct(event, '${productId}')" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                            <input type="text" id="editProductName" value="${
                              product.name
                            }" required
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        

                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                                <input type="number" id="editProductPrice" value="${
                                  product.price
                                }" min="0" step="0.01" required
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
                                <input type="number" id="editProductStock" value="${
                                  product.stock
                                }" min="0" required
                                       class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea id="editProductDescription" rows="4" required
                                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">${
                                        product.description
                                      }</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Current Image</label>
                            ${
                              product.imageUrl
                                ? `
                                <div class="mb-3">
                                    <img src="${product.imageUrl}" alt="Current product image" class="w-32 h-32 object-cover rounded-lg border">
                                </div>
                            `
                                : '<p class="text-gray-500 mb-3">No current image</p>'
                            }
                            <label class="block text-sm font-medium text-gray-700 mb-2">Update Image (optional)</label>
                            <input type="file" id="editProductImage" accept="image/*"
                                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <p class="text-sm text-gray-500 mt-1">Leave empty to keep current image</p>
                        </div>
                        
                        <div class="flex gap-4">
                            <button type="submit" 
                                    class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium">
                                <i class="fas fa-save mr-2"></i>Update Product
                            </button>
                            <button type="button" onclick="showProducts()" 
                                    class="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 font-medium">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    document.getElementById("mainContent").innerHTML = content;
  } catch (error) {
    console.error("Error loading edit form:", error);
    showMessage("Error loading edit form", "error");
  } finally {
    hideLoading();
  }
}

// Handle edit product form submission
async function handleEditProduct(event, productId) {
  event.preventDefault();
  showLoading();

  try {
    const name = document.getElementById("editProductName").value;
    const price = parseFloat(document.getElementById("editProductPrice").value);
    const stock = parseInt(document.getElementById("editProductStock").value);
    const description = document.getElementById("editProductDescription").value;
    const imageFile = document.getElementById("editProductImage").files[0];

    // Get current product data
    const productDoc = await productsCollection.doc(productId).get();
    const currentProduct = productDoc.data();

    let imageUrl = currentProduct.imageUrl; // Keep current image by default

    // Upload new image if provided
    if (imageFile) {
      const storageRef = storage
        .ref()
        .child(`products/${Date.now()}_${imageFile.name}`); // Unique path
      const snapshot = await storageRef.put(imageFile); // storageRef.put(imageFile); uploads the file
      imageUrl = await snapshot.ref.getDownloadURL(); // Get the download URL

      // Delete old image if it exists and is not a placeholder
      if (
        currentProduct.imageUrl &&
        !currentProduct.imageUrl.includes("placeholder") // Simple check to avoid deleting placeholder images
      ) {
        try {
          const oldImageRef = storage.refFromURL(currentProduct.imageUrl); // Get reference to old image
          await oldImageRef.delete(); // Delete old image
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError);
        }
      }
    }

    // Update product in Firestore
    await productsCollection.doc(productId).update({
      name: name,
      description: description,
      price: price,
      stock: stock,
      imageUrl: imageUrl,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage("Product updated successfully!", "success");

    // Redirect back to products after a short delay
    setTimeout(() => {
      showProducts();
    }, 1500);
  } catch (error) {
    console.error("Error updating product:", error);
    showMessage("Error updating product: " + error.message, "error");
  } finally {
    hideLoading();
  }
}

// Delete product function
async function deleteProduct(productId) {
  if (!currentUser) {
    showMessage("Please login first", "error");
    return;
  }

  if (userRole !== "vendor") {
    showMessage("Only vendors can delete products", "error");
    return;
  }

  try {
    // Get product details first to verify ownership
    const productDoc = await productsCollection.doc(productId).get(); // Fetch product document

    if (!productDoc.exists) {
      showMessage("Product not found", "error");
      return;
    }

    const product = productDoc.data(); // Get product data

    // Verify that the current user owns this product
    if (product.vendorId !== currentUser.uid) {
      showMessage("You can only delete your own products", "error");
      return;
    }

    // Show confirmation dialog
    const isConfirmed = await showDeleteConfirmation(product.name); // Await user confirmation
    if (!isConfirmed) { // If user cancels
      return;
    }

    showLoading();

    // Delete the product document
    await productsCollection.doc(productId).delete(); // Delete product from Firestore

    // If the product has an image, delete it from storage
    if (product.imageUrl && product.imageUrl.includes("firebase")) {
      try {
        const imageRef = firebase.storage().refFromURL(product.imageUrl); // Get reference to the image
        await imageRef.delete(); // Delete the image
      } catch (storageError) {
        console.warn("Could not delete product image:", storageError);
        // Continue even if image deletion fails
      }
    }

    showMessage("Product deleted successfully!", "success");

    // Refresh the products page
    setTimeout(() => {
      showProducts();
    }, 1500);
  } catch (error) {
    console.error("Error deleting product:", error);
    showMessage("Error deleting product: " + error.message, "error");
  } finally {
    hideLoading();
  }
}

// Show delete confirmation dialog
function showDeleteConfirmation(productName) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-4">Delete Product</h3>
                    <p class="text-gray-600 mb-6">
                        Are you sure you want to delete "<strong>${productName}</strong>"? 
                        This action cannot be undone.
                    </p>
                    <div class="flex gap-4 justify-center">
                        <button id="cancelDelete" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-300">
                            Cancel
                        </button>
                        <button id="confirmDelete" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300">
                            Delete Product
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    document.getElementById("cancelDelete").onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };

    document.getElementById("confirmDelete").onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };

    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(false);
      }
    };
  });
}
