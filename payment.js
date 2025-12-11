// Payment System Integration
// This file handles Stripe payment processing

class PaymentSystem {
  constructor() {
    this.stripe = null;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    // Initialize Stripe (you'll need to replace with your actual publishable key)
    if (typeof Stripe !== 'undefined') {
      this.stripe = Stripe('pk_test_51SG8yOFUGYYYMgXhd7RPBqQABBOAU3zYftWipnprQyguAef2HjkxQr6wYEL6sIO0u3JU0KcNjvk7WYd2yZuVuJI900Cm5bROLN');
      this.isInitialized = true;
    } else {
      console.error('Stripe.js not loaded');
    }
  }

  // Create a payment session for an artwork
  async createPaymentSession(artwork) {
    if (!this.isInitialized) {
      console.error('Payment system not initialized');
      return;
    }

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: artwork.id,
          artworkTitle: artwork.title,
          price: artwork.price,
          currency: 'usd',
          successUrl: `${window.location.origin}/success.html?artwork=${encodeURIComponent(artwork.id)}`,
          cancelUrl: `${window.location.origin}/gallery.html`
        })
      });

      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        this.showPaymentError(result.error.message);
      }
    } catch (error) {
      console.error('Payment session creation failed:', error);
      this.showPaymentError('Payment system temporarily unavailable. Please try again later.');
    }
  }

  // Show payment error message
  showPaymentError(message) {
    // Create error modal or notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h3>Payment Error</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  // Handle buy now button click
  handleBuyNow(artwork) {
    if (!artwork.available) {
      alert('This artwork is no longer available for purchase.');
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm(
      `Purchase "${artwork.title}" for ${this.formatPrice(artwork.price)}?\n\n` +
      `This will redirect you to our secure payment page.`
    );

    if (confirmed) {
      this.createPaymentSession(artwork);
    }
  }

  // Format price for display
  formatPrice(price) {
    if (price === null || price === undefined || price === '') return '—';
    return typeof price === 'number' ? `$${price.toLocaleString()}` : price;
  }
}

// Initialize payment system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.paymentSystem = new PaymentSystem();
});

// Utility function to add buy button to artwork modals
function addBuyButton(artwork) {
  const modalActions = document.querySelector('.modal-actions');
  if (!modalActions) return;

  // Check if buy button already exists
  if (document.getElementById('buyNowBtn')) return;

  // Create buy button
  const buyButton = document.createElement('button');
  buyButton.id = 'buyNowBtn';
  buyButton.className = 'btn primary';
  buyButton.textContent = `Buy Now - ${window.paymentSystem?.formatPrice(artwork.price) || '$' + artwork.price}`;
  buyButton.onclick = () => window.paymentSystem?.handleBuyNow(artwork);

  // Insert before the inquire button
  const inquireBtn = modalActions.querySelector('#modalInquireBtn');
  if (inquireBtn) {
    modalActions.insertBefore(buyButton, inquireBtn);
  } else {
    modalActions.appendChild(buyButton);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PaymentSystem, addBuyButton };
}
