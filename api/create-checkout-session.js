// API endpoint for creating Stripe checkout sessions
// This file should be deployed as a serverless function

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { artworkId, artworkTitle, price, currency, successUrl, cancelUrl } = JSON.parse(event.body);

    // Validate required fields
    if (!artworkId || !artworkTitle || !price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: artworkTitle,
              description: `Original artwork by Mingyi Zou - ${artworkTitle}`,
              images: [`https://mingyizou.com/assets/artworks/${artworkTitle.replace(/\s+/g, '%20')}.jpg`], // Use artwork title for image path
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        artworkId: artworkId,
        artworkTitle: artworkTitle,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'],
      },
      custom_fields: [
        {
          key: 'special_instructions',
          label: {
            type: 'custom',
            custom: 'Special Instructions (Optional)',
          },
          type: 'text',
          optional: true,
        },
      ],
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ id: session.id }),
    };

  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment session creation failed' }),
    };
  }
};
