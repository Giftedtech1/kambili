import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Helper to "decode" keys (prevents simple bot scraping)
const _d = (s) => s.split('').reverse().join('');

// Cloudinary Configuration (Obfuscated)
const CLOUDINARY_CLOUD_NAME = _d("szygqdzzd"); // Corrected reversal of dzzdqgyzs
const CLOUDINARY_UPLOAD_PRESET = _d("ilibmak");

const adminPasscode = prompt("Please enter the admin passcode to access this page:");
if (adminPasscode !== "Kambili@Secure!2024") {
  alert("Incorrect passcode. Redirecting...");
  window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const addProductBtn = document.getElementById('add-product-btn');
  const productFormCard = document.getElementById('product-form-card');
  const productForm = document.getElementById('product-form');
  const cancelBtn = document.getElementById('cancel-btn');
  const productsTbody = document.getElementById('products-tbody');
  const noProductsMsg = document.getElementById('no-products-msg');
  const formTitle = document.getElementById('form-title');
  const toastContainer = document.getElementById('toast-container');

  // Form Inputs
  const idInput = document.getElementById('product-id');
  const nameInput = document.getElementById('product-name');
  const priceInput = document.getElementById('product-price');
  const categoryInput = document.getElementById('product-category');
  const stockInput = document.getElementById('product-stock');
  const imageInput = document.getElementById('product-image');
  const imageUrlInput = document.getElementById('product-image-url');
  const uploadStatus = document.getElementById('image-upload-status');

  // Load products from Firestore
  let products = [];

  // Initialize Event Listeners
  addProductBtn.addEventListener('click', () => {
    resetForm();
    formTitle.textContent = 'Add New Product';
    productFormCard.style.display = 'block';
    window.scrollTo({ top: productFormCard.offsetTop - 30, behavior: 'smooth' });
  });

  cancelBtn.addEventListener('click', () => {
    productFormCard.style.display = 'none';
    resetForm();
  });

  productForm.addEventListener('submit', handleFormSubmit);

  // Initial Render (Real-time listener)
  const productsCol = collection(db, 'products');
  const q = query(productsCol, orderBy('createdAt', 'desc'));
  
  onSnapshot(q, (snapshot) => {
    products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderProducts();
  });

  // Handle Image Upload
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = 'Uploading to Cloudinary...';
    uploadStatus.style.color = 'var(--primary)';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Cloudinary upload failed');

      const data = await response.json();
      const downloadURL = data.secure_url;
      
      imageUrlInput.value = downloadURL;
      uploadStatus.textContent = 'Image uploaded successfully!';
      uploadStatus.style.color = 'var(--success)';
      showToast('Image uploaded!', 'success');
    } catch (error) {
      console.error("Upload failed:", error);
      uploadStatus.textContent = 'Upload failed. Try again.';
      uploadStatus.style.color = 'var(--danger)';
      showToast('Upload failed', 'error');
    }
  });

  // Handle Form Submit
  async function handleFormSubmit(e) {
    e.preventDefault();

    const id = idInput.value;
    const productData = {
      name: nameInput.value.trim(),
      price: parseFloat(priceInput.value),
      category: categoryInput.value,
      stock: stockInput.value,
      image: imageUrlInput.value.trim(),
      updatedAt: new Date()
    };

    if (!productData.image) {
      alert("Please upload an image first.");
      return;
    }

    try {
      if (id) {
        // Update existing product
        const productRef = doc(db, 'products', id);
        await updateDoc(productRef, productData);
        showToast('Product updated successfully!', 'success');
      } else {
        // Add new product
        productData.createdAt = new Date();
        await addDoc(collection(db, 'products'), productData);
        showToast('Product added successfully!', 'success');
      }

      productFormCard.style.display = 'none';
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      showToast('Error saving product', 'error');
    }
  }

  // Render Products Table
  function renderProducts() {
    productsTbody.innerHTML = '';
    productsTbody.parentElement.style.display = 'table';
    noProductsMsg.style.display = 'none';
    
    // Render Skeletons First
    const skeletonCount = 3;
    for (let i = 0; i < skeletonCount; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="skeleton" style="width: 60px; height: 60px; border-radius: var(--border-radius-sm);"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 80%;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 50%;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 60%;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 40%;"></div></td>
        <td><div class="skeleton" style="width: 120px; height: 32px; border-radius: var(--border-radius-sm);"></div></td>
      `;
      productsTbody.appendChild(tr);
    }
    
    setTimeout(() => {
      productsTbody.innerHTML = '';
      
      if (products.length === 0) {
        productsTbody.parentElement.style.display = 'none';
        noProductsMsg.style.display = 'block';
        return;
      }

      products.forEach(product => {
        const tr = document.createElement('tr');
        const stockColor = product.stock === 'in' ? 'var(--success)' : 'var(--danger)';
        const stockText = product.stock === 'in' ? 'In Stock' : 'Out of Stock';

        tr.innerHTML = `
          <td><img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'"></td>
          <td><strong>${product.name}</strong></td>
          <td>₦${product.price.toLocaleString()}</td>
          <td>${product.category}</td>
          <td><span style="color: ${stockColor}; font-weight: 600; font-size: 0.85rem; text-transform: uppercase;">${stockText}</span></td>
          <td>
            <div class="action-btns">
              <button class="btn btn-outline btn-small" onclick="window.editProduct('${product.id}')">Edit</button>
              <button class="btn btn-outline btn-small" onclick="window.toggleStock('${product.id}')">Toggle Stock</button>
              <button class="btn btn-danger btn-small" onclick="window.deleteProduct('${product.id}')">Delete</button>
            </div>
          </td>
        `;
        productsTbody.appendChild(tr);
      });
    }, 800);
  }

  // Expose functions globally for inline onclick handlers
  window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    idInput.value = product.id;
    nameInput.value = product.name;
    priceInput.value = product.price;
    categoryInput.value = product.category;
    stockInput.value = product.stock;
    imageUrlInput.value = product.image;
    uploadStatus.textContent = 'Existing image loaded';
    uploadStatus.style.color = 'var(--success)';

    formTitle.textContent = 'Edit Product';
    productFormCard.style.display = 'block';
    window.scrollTo({ top: productFormCard.offsetTop - 30, behavior: 'smooth' });
  };

  window.deleteProduct = async function(id) {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        showToast('Product deleted!', 'success');
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast('Error deleting product', 'error');
      }
    }
  };

  window.toggleStock = async function(id) {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStock = product.stock === 'in' ? 'out' : 'in';
      try {
        await updateDoc(doc(db, 'products', id), { stock: newStock });
        showToast(`Marked as ${newStock === 'in' ? 'In Stock' : 'Out of Stock'}`, 'success');
      } catch (error) {
        console.error("Error toggling stock:", error);
        showToast('Error toggling stock', 'error');
      }
    }
  };

  function resetForm() {
    productForm.reset();
    idInput.value = '';
    imageUrlInput.value = '';
    uploadStatus.textContent = '';
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> <span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
});
