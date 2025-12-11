// Image Optimization and Lazy Loading System
// This file handles image compression, lazy loading, and performance optimization

class ImageOptimizer {
  constructor() {
    this.loadedImages = new Set();
    this.observer = null;
    this.init();
  }

  init() {
    // Initialize Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
              this.observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      );
    }

    // Add lazy loading to existing images
    this.addLazyLoading();
  }

  // Add lazy loading attributes to images
  addLazyLoading() {
    const images = document.querySelectorAll('img[src]');
    images.forEach(img => {
      // Skip critical images (hero and featured)
      if (img.closest('.hero') || img.closest('.featured') || img.hasAttribute('data-critical')) {
        return; // Don't apply lazy loading to critical images
      }
      
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add placeholder for better UX
      if (!img.hasAttribute('data-src')) {
        img.setAttribute('data-src', img.src);
        img.src = this.createPlaceholder(img.width, img.height);
      }
    });
  }

  // Create a lightweight placeholder image
  createPlaceholder(width = 400, height = 300) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Create a subtle gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#2a2a2a');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add loading text
    ctx.fillStyle = '#666';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', width / 2, height / 2);
    
    return canvas.toDataURL();
  }

  // Load image with optimization
  loadImage(img) {
    const src = img.getAttribute('data-src') || img.src;
    if (this.loadedImages.has(src)) return;

    // Create a new image to preload
    const newImg = new Image();
    
    newImg.onload = () => {
      // Add fade-in effect
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
      
      img.src = src;
      img.removeAttribute('data-src');
      
      // Fade in the image
      setTimeout(() => {
        img.style.opacity = '1';
      }, 10);
      
      this.loadedImages.add(src);
    };

    newImg.onerror = () => {
      console.error('Failed to load image:', src);
      // Keep placeholder on error
    };

    newImg.src = src;
  }

  // Optimize image URLs for different screen sizes
  getOptimizedImageUrl(originalUrl, width = 800) {
    // For now, return original URL
    // In production, you could use a service like Cloudinary or ImageKit
    return originalUrl;
  }

  // Preload critical images
  preloadCriticalImages() {
    const criticalImages = [
      'assets/photography/Shape_of_Light_2.jpg', // Hero image
      'assets/images/Memories_of_the_Living_Room.jpg' // Featured image
    ];

    criticalImages.forEach(src => {
      const img = new Image();
      img.onload = () => {
        console.log(`Critical image loaded: ${src}`);
      };
      img.onerror = () => {
        console.error(`Failed to load critical image: ${src}`);
      };
      img.src = src;
    });
  }

  // Add progressive loading effect
  addProgressiveLoading(img) {
    img.style.filter = 'blur(5px)';
    img.style.transition = 'filter 0.3s ease';
    
    img.onload = () => {
      img.style.filter = 'none';
    };
  }
}

// Utility functions for image optimization
const ImageUtils = {
  // Convert MB to readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get image dimensions from URL
  async getImageDimensions(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = src;
    });
  },

  // Create responsive image srcset
  createSrcSet(baseUrl, widths = [400, 800, 1200, 1600]) {
    return widths.map(width => `${baseUrl}?w=${width} ${width}w`).join(', ');
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer = new ImageOptimizer();
  
  // Preload critical images
  window.imageOptimizer.preloadCriticalImages();
  
  // Add error handling for critical images
  const criticalImages = document.querySelectorAll('img[data-critical]');
  criticalImages.forEach(img => {
    img.onerror = () => {
      console.error(`Critical image failed to load: ${img.src}`);
      // Keep the original src, don't replace with placeholder
    };
  });
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImageOptimizer, ImageUtils };
}
