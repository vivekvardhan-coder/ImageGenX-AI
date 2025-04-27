// API Configuration (Replace with your own)
// API Configuration (Replace with your own)
const API_BASE_URL = window.location.origin;

// DOM Elements - Main Interface
const generateForm = document.querySelector(".generate-form");
const galleryGrid = document.querySelector(".gallery-grid");
const searchHistoryContainer = document.querySelector(".search-history");
const generateBtn = document.querySelector(".generate-btn");
const promptInput = document.querySelector(".prompt-input");
const imgQuantity = document.querySelector(".img-quantity");
const imgStyle = document.querySelector(".img-style");
const filterButtons = document.querySelectorAll(".filter-btn");
const viewButtons = document.querySelectorAll(".view-btn");
const sortButtons = document.querySelectorAll(".sort-btn");
const loadMoreBtn = document.querySelector(".load-more-btn");
const suggestionItems = document.querySelectorAll(".suggestion-item");
const themeToggle = document.querySelector(".theme-toggle");
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const navMenu = document.querySelector(".nav-menu");

// DOM Elements - Modals
const modalOverlays = document.querySelectorAll(".modal-overlay");
const closeModalBtns = document.querySelectorAll(".close-modal");
const switchModalBtns = document.querySelectorAll(".switch-modal");
const imagePreviewModal = document.getElementById("imagePreviewModal");
const previewImage = document.getElementById("previewImage");
const previewPrompt = document.getElementById("previewPrompt");

// DOM Elements - Reviews
const reviewsContainer = document.querySelector(".reviews-container");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const paginationDots = document.querySelectorAll(".pagination-dot");

// DOM Elements - Toast & Loading
const toastContainer = document.querySelector(".toast-container");
const loadingOverlay = document.querySelector(".loading-overlay");

// State Management
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
let currentImages = [];
let currentReviewIndex = 0;
let currentPage = 1;
let isGenerating = false;
let currentFilter = 'all';
let currentView = 'grid';
let currentSort = 'recent';
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateSearchHistory();
  showReview(currentReviewIndex);
  loadSampleImages();
  initializeParticles();
  
  if (isDarkMode) {
document.body.classList.add('dark-theme');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
  }
});

// Event Listeners - Main Interface
generateForm.addEventListener("submit", handleGenerate);
filterButtons.forEach(btn => btn.addEventListener("click", handleFilter));
viewButtons.forEach(btn => btn.addEventListener("click", handleViewChange));
sortButtons.forEach(btn => btn.addEventListener("click", handleSort));
loadMoreBtn.addEventListener("click", handleLoadMore);
suggestionItems.forEach(item => item.addEventListener("click", handleSuggestion));
themeToggle.addEventListener("click", toggleTheme);
mobileMenuBtn.addEventListener("click", toggleMobileMenu);

// Event Listeners - Modals
closeModalBtns.forEach(btn => btn.addEventListener("click", closeModal));
switchModalBtns.forEach(btn => btn.addEventListener("click", switchModal));
document.querySelectorAll(".user-actions .btn").forEach(btn => {
  if (btn.textContent.trim() === "Sign In") {
    btn.addEventListener("click", () => openModal("loginModal"));
  }
});

// Event Listeners - Reviews
prevBtn.addEventListener("click", () => navigateReviews(-1));
nextBtn.addEventListener("click", () => navigateReviews(1));
paginationDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    currentReviewIndex = index;
    showReview(currentReviewIndex);
  });
});

// Event Listeners - Document
document.addEventListener("click", (e) => {
  // Close modals when clicking outside
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e);
  }
});

// Functions - Image Generation
async function handleGenerate(e) {
  e.preventDefault();
  
  const userPrompt = promptInput.value.trim();
  const userQuantity = parseInt(imgQuantity.value);
  const userStyle = imgStyle.value;
  
  if (!userPrompt || isGenerating) return;
  
  // Show loading state
  isGenerating = true;
  generateBtn.classList.add("loading");
  
  try {
    // Save to search history
    addToSearchHistory(userPrompt);
    
    // Generate images
    const images = [];
for (let i = 0; i < userQuantity; i++) {
  const image = await generateAiImage(userPrompt, userStyle);
  images.push({
    id: Date.now() + i,
    urls: {
      regular: image,
      full: image
    },
    alt_description: userPrompt,
    style: userStyle,
    prompt: userPrompt,
    likes: Math.floor(Math.random() * 1000),
    timestamp: Date.now()
  });
}
    
    currentImages = images;
    displayImages(images);
    showToast(`Successfully generated ${userQuantity} ${userStyle} images!`, "success");
    
  } catch (error) {
    console.error("Error generating images:", error);
    showToast(error.message || "Failed to generate images. Please try again.", "error");
  } finally {
    isGenerating = false;
    generateBtn.classList.remove("loading");
  }
}

async function generateAiImage(prompt, style) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ prompt, style })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Image generation failed");
    }

    // Convert the image blob to a data URL
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error("Generation error:", error);
    throw error;
  }
}


// Functions - Gallery Display
function displayImages(images) {
  if (!images || images.length === 0) {
    galleryGrid.innerHTML = `<p class="no-results">No images found. Try a different search term.</p>`;
    return;
  }
  
  // If this is a new search (not load more), clear the gallery
  if (currentPage === 1) {
    galleryGrid.innerHTML = "";
  }
  
  const imageCards = images.map(image => `
    <div class="img-card" data-style="${image.style || 'realistic'}">
      <img src="${image.urls.regular}" alt="${image.alt_description || 'Generated image'}" loading="lazy">
      <div class="img-card-actions">
        <button class="card-action-btn download-btn" title="Download">
          <i class="fas fa-download"></i>
        </button>
        <button class="card-action-btn save-btn" title="Save to collection">
          <i class="fas fa-folder-plus"></i>
        </button>
        <button class="card-action-btn share-btn" title="Share">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
      <div class="image-info">
        <span class="style-tag">${image.style || 'realistic'}</span>
        <span class="likes"><i class="fas fa-heart"></i> ${image.likes}</span>
      </div>
    </div>
  `).join("");
  
  galleryGrid.insertAdjacentHTML('beforeend', imageCards);
  
  // Remove preview button event listeners since preview button is removed
  
  document.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const imgElement = btn.closest('.img-card').querySelector('img');
      
      try {
        const response = await fetch(imgElement.src);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ai-image-${Date.now()}.jpg`;
        link.click();
        showToast("Image downloaded successfully!", "success");
      } catch (error) {
        showToast("Failed to download image.", "error");
      }
    });
  });
  
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showToast("Image saved to your collection!", "success");
    });
  });
  
  document.querySelectorAll(".share-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showToast("Sharing options coming soon!", "info");
    });
  });
  
  // Initialize masonry layout if in masonry view
  if (currentView === 'masonry') {
    initMasonry();
  }
}

function loadSampleImages() {
  // Load some initial images with hardcoded URLs to ensure loading
  const sampleImages = [
    {
      id: Date.now() + 1,
      urls: { regular: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80" },
      alt_description: "colorful landscape",
      style: 'realistic',
      prompt: "colorful landscape",
      likes: 523,
      timestamp: Date.now()
    },
    {
      id: Date.now() + 2,
      urls: { regular: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=300&q=80" },
      alt_description: "abstract art",
      style: 'realistic',
      prompt: "abstract art",
      likes: 312,
      timestamp: Date.now()
    },
    {
      id: Date.now() + 3,
      urls: { regular: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=300&q=80" },
      alt_description: "futuristic city",
      style: 'realistic',
      prompt: "futuristic city",
      likes: 789,
      timestamp: Date.now()
    },
    {
      id: Date.now() + 4,
      urls: { regular: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=80" },
      alt_description: "modern architecture",
      style: 'realistic',
      prompt: "modern architecture",
      likes: 654,
      timestamp: Date.now()
    }
  ];
  
  currentImages = sampleImages;
  displayImages(sampleImages);
}

// Functions - Filtering and Sorting
function handleFilter(e) {
  const filterValue = e.currentTarget.dataset.filter;
  currentFilter = filterValue;
  
  // Update active button
  filterButtons.forEach(btn => btn.classList.remove("active"));
  e.currentTarget.classList.add("active");
  
  // Filter the displayed images
  const imgCards = document.querySelectorAll(".img-card");
  
  imgCards.forEach(card => {
    if (filterValue === 'all' || card.dataset.style === filterValue) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
  
  // Reinitialize masonry if in masonry view
  if (currentView === 'masonry') {
    setTimeout(initMasonry, 100);
  }
}

function handleViewChange(e) {
  const viewValue = e.currentTarget.dataset.view;
  currentView = viewValue;
  
  // Update active button
  viewButtons.forEach(btn => btn.classList.remove("active"));
  e.currentTarget.classList.add("active");
  
  // Change view class on gallery
  galleryGrid.classList.remove("grid-view", "masonry-view");
  galleryGrid.classList.add(viewValue + "-view");
  
  // Initialize masonry if selected
  if (viewValue === 'masonry') {
    initMasonry();
  }
}

function handleSort(e) {
  const sortBy = e.currentTarget.dataset.sort;
  currentSort = sortBy;
  
  // Update active button
  sortButtons.forEach(btn => btn.classList.remove("active"));
  e.currentTarget.classList.add("active");
  
  // Sort images
  let sortedImages = [...currentImages];
  
  if (sortBy === "recent") {
    sortedImages.sort((a, b) => b.timestamp - a.timestamp);
  } else if (sortBy === "popular") {
    sortedImages.sort((a, b) => b.likes - a.likes);
  } else if (sortBy === "oldest") {
    sortedImages.sort((a, b) => a.timestamp - b.timestamp);
  }
  
  currentImages = sortedImages;
  
  // Reset page and redisplay
  currentPage = 1;
  displayImages(sortedImages);
}

function handleLoadMore() {
  currentPage++;
  loadMoreBtn.classList.add("loading");
  
  // In a real app, you'd fetch more images
  // For demo, we'll reuse existing images with slight modifications
  setTimeout(() => {
    const moreImages = currentImages.map(img => ({
      ...img,
      id: img.id + "-" + currentPage,
      timestamp: Date.now() - Math.random() * 10000000
    }));
    
    displayImages(moreImages);
    loadMoreBtn.classList.remove("loading");
    
    // Add new images to current images array
    currentImages = [...currentImages, ...moreImages];
  }, 1000);
}

// Functions - Search History
function addToSearchHistory(query) {
  // Avoid duplicates
  if (!searchHistory.includes(query)) {
    searchHistory.unshift(query);
    // Keep only last 5 searches
    if (searchHistory.length > 5) {
      searchHistory.pop();
    }
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    updateSearchHistory();
  }
}

function updateSearchHistory() {
  searchHistoryContainer.innerHTML = searchHistory
    .map(query => `<div class="history-item">${query}</div>`)
    .join("");
  
  // Add click event to history items
  document.querySelectorAll(".history-item").forEach(item => {
    item.addEventListener("click", () => {
      promptInput.value = item.textContent;
      promptInput.focus();
    });
  });
}

function handleSuggestion(e) {
  const suggestionText = e.currentTarget.textContent;
  promptInput.value = suggestionText;
  generateForm.dispatchEvent(new Event('submit'));
}

// Functions - Reviews
function showReview(index) {
  const reviews = document.querySelectorAll('.review');
  
  // Handle wrap-around
  if (index >= reviews.length) currentReviewIndex = 0;
  if (index < 0) currentReviewIndex = reviews.length - 1;
  
  // Update active review
  reviews.forEach((review, i) => {
    review.classList.toggle('active', i === currentReviewIndex);
  });
  
  // Update pagination dots
  paginationDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentReviewIndex);
  });
}

function navigateReviews(direction) {
  currentReviewIndex += direction;
  showReview(currentReviewIndex);
}

// Functions - UI Elements
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
const icon = themeToggle.querySelector('i');

if (document.body.classList.contains('dark-theme')) {
  icon.classList.replace('fa-moon', 'fa-sun');
  localStorage.setItem('darkMode', 'true');
} else {
  icon.classList.replace('fa-sun', 'fa-moon');
  localStorage.setItem('darkMode', 'false');
}
}

function toggleMobileMenu() {
  navMenu.classList.toggle('mobile-active');
  mobileMenuBtn.querySelector('i').classList.toggle('fa-bars');
  mobileMenuBtn.querySelector('i').classList.toggle('fa-times');
}

// Functions - Modals
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  const modal = e.target.closest('.modal-overlay');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchModal(e) {
  e.preventDefault();
  const targetModalId = e.target.dataset.target;
  const currentModal = e.target.closest('.modal-overlay');
  
  currentModal.classList.remove('active');
  document.getElementById(targetModalId).classList.add('active');
}

function openImagePreview(image) {
  previewImage.src = image.urls.regular;
  previewPrompt.textContent = image.prompt || "No prompt information available";
  imagePreviewModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Set up download button
  document.querySelector('.image-preview-modal .download-btn').addEventListener('click', async () => {
    try {
      const response = await fetch(image.urls.full);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ai-image-${Date.now()}.jpg`;
      link.click();
      showToast("Image downloaded successfully!", "success");
    } catch (error) {
      showToast("Failed to download image.", "error");
    }
  });
}

// Functions - Utilities
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${getToastIcon(type)}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Add dismiss event
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('dismissing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
}

function getToastIcon(type) {
  switch(type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-info-circle';
  }
}

function initMasonry() {
  // Initialize masonry layout
  if (typeof Masonry !== 'undefined') {
    const masonry = new Masonry(galleryGrid, {
      itemSelector: '.img-card',
      columnWidth: '.img-card',
      percentPosition: true,
      gutter: 20
    });
    
    if (typeof imagesLoaded !== 'undefined') {
      imagesLoaded(galleryGrid).on('progress', () => {
        masonry.layout();
      });
    }
  }
}

function initializeParticles() {
  const particles = document.querySelectorAll('.particle');
  
  particles.forEach((particle, index) => {
    // Use GSAP for particle animation
    if (typeof gsap !== 'undefined') {
      gsap.to(particle, {
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        opacity: Math.random() * 0.5 + 0.1,
        scale: Math.random() * 1.5 + 0.5,
        duration: Math.random() * 10 + 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: index * 0.2
      });
    }
  });
}

// Auto-advance reviews
setInterval(() => navigateReviews(1), 5000);
