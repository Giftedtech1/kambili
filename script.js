import { db } from './firebase-config.js';
import { 
  collection, 
  onSnapshot,
  query,
  orderBy,
  limit,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  mobileMenuBtn.setAttribute('aria-expanded', 'false');
  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
    mobileMenuBtn.setAttribute('aria-expanded', isOpen.toString());
  });

  // Close mobile menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuBtn.classList.remove('active');
      navLinks.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
        
        // Update active nav link
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  // Highlight nav links on scroll
  window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });
  });

  // Hero Background Slideshow
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    const heroBgImages = [
      'images/hero bg 1.jpg',
      'images/hero bg 2.jpg',
      'images/hero bg 3.jpg',
      'images/hero bg4.jpg',
      'images/hero bg 5.jpg'
    ];
    
    // Set relative positioning and hide overflow on the hero section for absolutely positioned backgrounds
    heroSection.style.position = 'relative';
    heroSection.style.overflow = 'hidden';

    // Create an overlay to ensure text is readable
    const darkOverlay = document.createElement('div');
    darkOverlay.style.position = 'absolute';
    darkOverlay.style.top = '0';
    darkOverlay.style.left = '0';
    darkOverlay.style.width = '100%';
    darkOverlay.style.height = '100%';
    darkOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    darkOverlay.style.zIndex = '1';
    heroSection.insertBefore(darkOverlay, heroSection.firstChild);
    
    // Ensure hero content is above background elements
    const heroContent = heroSection.querySelector('.hero-content');
    if (heroContent) heroContent.style.zIndex = '2';

    // Create background layers for crossfading
    const bgLayers = [];
    heroBgImages.forEach((imgSrc, index) => {
      const layer = document.createElement('div');
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
      layer.style.width = '100%';
      layer.style.height = '100%';
      layer.style.backgroundImage = `url('${imgSrc}')`;
      layer.style.backgroundSize = 'cover';
      layer.style.backgroundPosition = 'center';
      layer.style.transition = 'opacity 1.5s ease-in-out';
      layer.style.opacity = index === 0 ? '1' : '0';
      layer.style.zIndex = '0'; // Behind the overlay
      heroSection.insertBefore(layer, darkOverlay);
      bgLayers.push(layer);
    });

    let currentHeroBgIndex = 0;

    // Switch background smoothly every 5 seconds
    setInterval(() => {
      bgLayers[currentHeroBgIndex].style.opacity = '0'; // fade out current
      currentHeroBgIndex = (currentHeroBgIndex + 1) % heroBgImages.length;
      bgLayers[currentHeroBgIndex].style.opacity = '1'; // fade in next
    }, 6500);
  }

  // Logo Slideshow Generator
  const logoSlider = document.getElementById('logo-slider');
  if (logoSlider) {
    const track = document.createElement('div');
    track.className = 'logo-track';
    
    // Provide the logos from the images folder
    const brandImages = [
      'images/Tom_Ford_Logo_313c2118-2c03-48ab-bcdb-10bcf5f2d452.avif',
      'images/brand1.avif',
      'images/fenty_8503bec7-997c-4015-b37f-cecc213358b2.avif',
      'images/images_2c09d518-c021-44f3-9f24-46d0c9664aab.avif',
      'images/kayali.png',
      'images/latifa.png',
      'images/vic.png',
      'images/realbrand.png'
    ];

    let content = '';
    // 10 sets will ensure it covers any ultra-wide screen and 10% CSS translate gives a seamless loop
    for(let i = 0; i < 10; i++) {
        brandImages.forEach(img => {
            content += `<img src="${img}" alt="Brand Logo">`;
        });
    }

    track.innerHTML = content;
    logoSlider.appendChild(track);
  }

  // Load and Render Products
  // Load and Render Products
  const productsGrid = document.getElementById('products-grid');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const noProductsMsg = document.getElementById('no-products-user-msg');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadMoreContainer = document.getElementById('load-more-container');

  let products = [];
  let productsLimit = 12;
  let currentCategory = 'All';
  let searchTerm = '';
  let unsubscribeProducts = null;
  let hasLoadedProducts = false;

  function setupProductListener() {
    if (unsubscribeProducts) unsubscribeProducts();

    const productsCol = collection(db, 'products');
    let q;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const isSearching = normalizedSearch.length > 0;

    // Build query with category filter if not "All"
    if (currentCategory === 'All') {
      q = query(productsCol, orderBy('createdAt', 'desc'), limit(isSearching ? 200 : productsLimit + 1));
    } else {
      q = query(
        productsCol,
        where('category', '==', currentCategory),
        orderBy('createdAt', 'desc'),
        limit(isSearching ? 200 : productsLimit + 1)
      );
    }

    unsubscribeProducts = onSnapshot(q, (snapshot) => {
      hasLoadedProducts = true;
      const allFetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const filteredBySearch = allFetched.filter(p =>
        p.name?.toLowerCase().includes(normalizedSearch)
      );

      if (isSearching) {
        products = filteredBySearch;
        loadMoreContainer.style.display = 'none';
      } else if (allFetched.length > productsLimit) {
        products = filteredBySearch.slice(0, productsLimit);
        loadMoreContainer.style.display = 'block';
      } else {
        products = filteredBySearch;
        loadMoreContainer.style.display = 'none';
      }

      renderProducts();
    }, (error) => {
      console.error("Listener failed:", error);
      showToast("Unable to load products. Please refresh or check your Firebase configuration.");
      hasLoadedProducts = true;
      products = [];
      loadMoreContainer.style.display = 'none';
      renderProducts();
    });
  }

  function renderProducts() {
    productsGrid.innerHTML = '';
    noProductsMsg.style.display = 'none';
    productsGrid.style.display = 'grid';

    if (products.length === 0) {
      const searchingOrFiltered = searchTerm || currentCategory !== 'All';
      if (!hasLoadedProducts) {
        renderSkeletons();
      } else {
        noProductsMsg.style.display = 'block';
        productsGrid.style.display = 'none';
        noProductsMsg.innerHTML = `<p>${searchingOrFiltered ? 'No products found matching your search.' : 'No products are available at the moment.'}</p>`;
      }
      return;
    }

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const inStock = product.stock === 'in';
      const stockBadge = inStock ? 
        '<div class="stock-badge in">In Stock</div>' : 
        '<div class="stock-badge out">Out of Stock</div>';

      const buttonHTML = inStock ? 
        `<button class="btn btn-primary add-to-cart-btn" type="button" data-product-id="${product.id}">Add to Cart</button>` : 
        `<button class="btn btn-outline" disabled>Out of Stock</button>`;

      card.innerHTML = `
        <div class="product-img-wrap">
          ${stockBadge}
          <img src="${product.image}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/600x600?text=Kambili'">
        </div>
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">₦${product.price.toLocaleString()}</div>
          ${buttonHTML}
        </div>
      `;
      productsGrid.appendChild(card);
    });
  }

  productsGrid.addEventListener('click', (event) => {
    const button = event.target.closest('.add-to-cart-btn');
    if (!button) return;
    const productId = button.dataset.productId;
    if (productId) addToCart(productId);
  });

  function renderSkeletons() {
    const skeletonCount = 4;
    for (let i = 0; i < skeletonCount; i++) {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-img-wrap skeleton"></div>
        <div class="product-info">
          <div class="skeleton skeleton-text" style="width: 40%; margin: 0 auto 10px;"></div>
          <div class="skeleton skeleton-text" style="height: 1.5rem; width: 80%; margin: 0 auto 10px;"></div>
          <div class="skeleton skeleton-text" style="width: 30%; margin: 0 auto 25px;"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      `;
      productsGrid.appendChild(card);
    }
  }

  // Event Listeners
  loadMoreBtn.addEventListener('click', () => {
    productsLimit += 12;
    setupProductListener();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      productsLimit = 12; // Reset pagination
      setupProductListener();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    setupProductListener(); 
  });

  // Initial call
  setupProductListener();

  // --- Shopping Cart Logic ---
  let cart = JSON.parse(localStorage.getItem('kambiliCart')) || [];
  const cartNavBtn = document.getElementById('cart-nav-btn');
  const cartCountEl = document.getElementById('cart-count');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartModal = document.getElementById('cart-modal');
  const closeCartBtn = document.getElementById('close-cart');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalPriceEl = document.getElementById('cart-total-price');
  const checkoutBtn = document.getElementById('checkout-btn');
  const toastContainer = document.getElementById('toast-container');

  function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 'out') return;
    
    const existing = cart.find(i => i.id === productId);
    if (existing) { existing.quantity += 1; }
    else { cart.push({...product, quantity: 1}); }
    
    updateCartUI();
    showToast(`${product.name} added to cart!`);
    
    if(cartModal) {
      cartModal.classList.add('active');
      cartOverlay.classList.add('active');
    }
  }

  window.addToCart = addToCart;
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 'out') return;
    
    const existing = cart.find(i => i.id === productId);
    if (existing) { existing.quantity += 1; }
    else { cart.push({...product, quantity: 1}); }
    
    updateCartUI();
    showToast(`${product.name} added to cart!`);
    
    // Automatically open modal for visual confirmation
    if(cartModal) {
      cartModal.classList.add('active');
      cartOverlay.classList.add('active');
    }
  };

  window.updateCartQty = function(id, change) {
    const item = cart.find(i => i.id === id);
    if(item) {
      item.quantity += change;
      if(item.quantity <= 0) { cart = cart.filter(i => i.id !== id); }
      updateCartUI();
    }
  };

  window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
  };

  cartItemsContainer.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action][data-id]');
    if (!actionTarget) return;

    const itemId = actionTarget.dataset.id;
    const action = actionTarget.dataset.action;
    if (!itemId || !action) return;

    if (action === 'decrease') updateCartQty(itemId, -1);
    if (action === 'increase') updateCartQty(itemId, 1);
    if (action === 'remove') removeFromCart(itemId);
  });

  function updateCartUI() {
    if (!cartCountEl) return;
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCountEl.textContent = totalItems;
    localStorage.setItem('kambiliCart', JSON.stringify(cart));
    
    cartItemsContainer.innerHTML = '';
    let totalPrice = 0;
    
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="empty-state"><p>Your cart is empty.</p></div>';
      checkoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
      cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60?text=No+Img'">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">₦${item.price.toLocaleString()}</div>
            <div class="cart-item-controls">
              <button class="qty-btn" type="button" data-action="decrease" data-id="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" type="button" data-action="increase" data-id="${item.id}">+</button>
              <button class="cart-item-remove" type="button" data-action="remove" data-id="${item.id}">Remove</button>
            </div>
          </div>
        `;
        cartItemsContainer.appendChild(el);
      });
    }
    cartTotalPriceEl.textContent = `₦${totalPrice.toLocaleString()}`;
  }

  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `<span style="font-size:1.2rem;">✓</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  if (cartNavBtn) {
    cartNavBtn.addEventListener('click', (e) => { e.preventDefault(); cartModal.classList.add('active'); cartOverlay.classList.add('active'); });
    closeCartBtn.addEventListener('click', () => { cartModal.classList.remove('active'); cartOverlay.classList.remove('active'); });
    cartOverlay.addEventListener('click', () => { cartModal.classList.remove('active'); cartOverlay.classList.remove('active'); });
    
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      let text = "Hello Kambili Scents, I would like to place an order:%0A%0A";
      let total = 0;
      cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        text += `${item.quantity}x ${item.name} - ₦${itemTotal.toLocaleString()}%0A`;
      });
      text += `%0A*Total Amount: ₦${total.toLocaleString()}*%0A%0AHere is my payment proof!`;
      window.open(`https://wa.me/2349124438443?text=${text}`, '_blank');
      
      // Optionally clear cart and close modal
      cart = [];
      updateCartUI();
      cartModal.classList.remove('active'); 
      cartOverlay.classList.remove('active');
    });

    updateCartUI();
  }
});
