// Authentication functions

// Show login form
function showLogin() {
  const content = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Or
                        <button onclick="showRegister()" class="font-medium text-blue-600 hover:text-blue-500">
                            create a new account
                        </button>
                    </p>
                </div>
                <form id="loginForm" class="mt-8 space-y-6" onsubmit="handleLogin(event)">
                    <div class="space-y-4">
                        <div>
                            <label for="loginEmail" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input id="loginEmail" name="email" type="email" autocomplete="email" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter your email">
                        </div>
                        <div>
                            <label for="loginPassword" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input id="loginPassword" name="password" type="password" autocomplete="current-password" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter your password">
                        </div>
                    </div>

                    <div>
                        <button type="submit"
                                class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                            Sign in
                        </button>
                    </div>
                    
                    <!-- Admin Quick Login Section -->
                    <div class="border-t pt-4">
                        <p class="text-gray-600 text-sm text-center mb-3">Quick Admin Access</p>
                        <button type="button" onclick="adminQuickLogin()" 
                                class="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors">
                            <i class="fas fa-shield-alt mr-2"></i>Login as Admin
                        </button>
                    </div>
                    
                    <div class="text-center">
                        <button type="button" onclick="showHome()" class="text-blue-600 hover:text-blue-500">
                            ← Back to Home
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
}

// Show registration form
function showRegister() {
  const content = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Or
                        <button onclick="showLogin()" class="font-medium text-blue-600 hover:text-blue-500">
                            sign in to existing account
                        </button>
                    </p>
                </div>
                <form id="registerForm" class="mt-8 space-y-6" onsubmit="handleRegister(event)">
                    <div class="rounded-md shadow-sm space-y-4">
                        <div>
                            <input id="registerName" name="name" type="text" required
                                   class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                   placeholder="Full Name">
                        </div>
                        <div>
                            <input id="registerEmail" name="email" type="email" autocomplete="email" required
                                   class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                   placeholder="Email address">
                        </div>
                        <div>
                            <input id="registerPassword" name="password" type="password" autocomplete="new-password" required
                                   class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                   placeholder="Password">
                        </div>
                        <div>
                            <select id="registerRole" name="role" required
                                    class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm">
                                <option value="">Select Account Type</option>
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <button type="submit"
                                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Create Account
                        </button>
                    </div>
                    
                    <div class="text-center">
                        <button type="button" onclick="showHome()" class="text-blue-600 hover:text-blue-500">
                            ← Back to Home
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
  document.getElementById("mainContent").innerHTML = content;
}

// Handle login
async function handleLogin(event) {
  event.preventDefault(); // Prevent form submission
  showLoading(); // Show loading indicator

  const email = document.getElementById("loginEmail").value; // Get email input
  const password = document.getElementById("loginPassword").value; // Get password input

  try {
    await auth.signInWithEmailAndPassword(email, password); // Sign in with Firebase Auth

    // Wait for user data to load and then redirect based on role
    const user = auth.currentUser; // Get current user
    if (user) {
      const userDoc = await usersCollection.doc(user.uid).get(); // Fetch user data from Firestore
      if (userDoc.exists) {
        const userData = userDoc.data(); // Get user data
        userRole = userData.role; // Set user role

        showMessage("Login successful!", "success");

        // Redirect based on user role
        if (userRole === "vendor") {
          showVendorDashboard();
        } else {
          showHome();
        }
      } else {
        showHome();
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessage(error.message, "error");
  } finally {
    hideLoading();
  }
}

// Admin quick login function
async function adminQuickLogin() {
  showLoading();

  const adminEmail = "admin@minimart.com";
  const adminPassword = "MSB@1234$$";

  try {
    // Try to sign in first
    await auth.signInWithEmailAndPassword(adminEmail, adminPassword); // Sign in with Firebase Auth

    // Wait for user data to load and then redirect
    const user = auth.currentUser;
    if (user) {
      const userDoc = await usersCollection.doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userRole = userData.role;

        showMessage("Admin login successful!", "success");

        // Redirect to admin dashboard
        if (userRole === "admin") {
          window.location.href = "pages/admin-dashboard.html";
        } else {
          showMessage("Access denied. Admin role required.", "error");
        }
      } else {
        showMessage("Admin user not found in database.", "error");
      }
    }
  } catch (error) {
    console.error("Admin login error:", error);

    // If login fails with invalid credentials, try to create the admin user
    if (
      error.code === "auth/invalid-login-credentials" ||
      error.code === "auth/user-not-found"
    ) {
      try {
        showMessage("Creating admin user...", "info");

        // Create admin user
        const userCredential = await auth.createUserWithEmailAndPassword(
          adminEmail,
          adminPassword
        );
        const user = userCredential.user;

        // Save admin data to Firestore
        await usersCollection.doc(user.uid).set({
          name: "System Administrator",
          email: adminEmail,
          role: "admin",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          isActive: true,
        });

        userRole = "admin";
        showMessage(
          "Admin user created and logged in successfully!",
          "success"
        );

        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.href = "pages/admin-dashboard.html";
        }, 1000);
      } catch (createError) {
        console.error("Admin creation error:", createError);
        showMessage(
          "Failed to create admin user: " + createError.message,
          "error"
        );
      }
    } else {
      showMessage("Admin login failed: " + error.message, "error");
    }
  } finally {
    hideLoading();
  }
}

// Handle registration
async function handleRegister(event) {
  event.preventDefault(); // Prevent form submission
  showLoading(); // Show loading indicator

  // Get form values
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const role = document.getElementById("registerRole").value;

  try {
    const userCredential = await auth.createUserWithEmailAndPassword( // Create user with Firebase Auth
      email,
      password
    );
    const user = userCredential.user; // Get created user

    // Save user data to Firestore
    await usersCollection.doc(user.uid).set({
      name: name,
      email: email,
      role: role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true,
    });

    // Set the userRole immediately for redirection
    userRole = role; // Set user role

    showMessage("Account created successfully!", "success");

    // Redirect based on user role
    if (role === "vendor") {
      showVendorDashboard();
    } else {
      showHome();
    }
  } catch (error) {
    console.error("Registration error:", error);
    showMessage(error.message, "error");
  } finally {
    hideLoading();
  }
}

// Logout function
async function logout() {
  try {
    await auth.signOut(); // Sign out from Firebase Auth
    showMessage("Logged out successfully", "success");
    showHome();
  } catch (error) {
    console.error("Logout error:", error);
    showMessage("Error logging out", "error");
  }
}

// Toggle user menu dropdown
function toggleUserMenu() {
  const dropdown = document.getElementById("userDropdown");
  dropdown.classList.toggle("hidden");
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const userMenu = document.getElementById("userMenu");
  const dropdown = document.getElementById("userDropdown");
  if (userMenu && !userMenu.contains(event.target)) {
    dropdown.classList.add("hidden");
  }
});

// Show message to user
function showMessage(message, type = "info") {
  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  messageDiv.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  document.body.appendChild(messageDiv);

  // Remove after 5 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}
