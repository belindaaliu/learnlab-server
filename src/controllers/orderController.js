const prisma = require('../lib/prisma');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Initiates the Stripe payment process
 * Generates a clientSecret to be used by the frontend CardElement
 */
exports.createPaymentIntent = async (req, res) => {
  const { cartItems } = req.body;
  const userId = req.user.id; 

  try {
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Security: Fetch courses from DB to get the true price, ignore frontend prices
    const courseIds = cartItems.map(item => BigInt(item.course_id || item.id));

    const courses = await prisma.courses.findMany({
      where: { id: { in: courseIds } }
    });

    const totalAmount = courses.reduce((sum, course) => {
      return sum + Number(course.price);
    }, 0);

    // Create Stripe Payment Intent (Stripe uses cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'cad',
      metadata: { 
        userId: userId.toString(),
        courseIds: courseIds.join(',') 
      },
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      totalAmount: totalAmount
    });

  } catch (error) {
    console.error("Payment Intent Error:", error);
    res.status(500).json({ message: "Internal server error during payment initiation" });
  }
};

/**
 * Stripe Webhook Listener
 * Asynchronously handles payment success to ensure order fulfillment 
 * even if the user closes their browser.
 */
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify that the event actually came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payments
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    const userId = paymentIntent.metadata.userId;
    const courseIds = paymentIntent.metadata.courseIds.split(',');
    const transactionId = paymentIntent.id;
    const amount = paymentIntent.amount / 100;

    try {
      await fulfillOrder(userId, courseIds, transactionId, amount);
      console.log(`Order fulfilled successfully for User ID: ${userId}`);
    } catch (error) {
      console.error("Fulfillment Error via Webhook:", error);
      // Stripe will retry the webhook if we don't return a 200-series status
      return res.status(500).json({ error: "Fulfillment failed" });
    }
  }

  res.status(200).json({ received: true });
};

/**
 *  Fulfillment Helper
 * Uses a Prisma Transaction to ensure data integrity
 */
exports.fulfillOrder = async (userId, courseIds, transactionId, amount) => {
  const uId = BigInt(userId);
  
  return await prisma.$transaction(async (tx) => {
    const results = [];

    for (const cId of courseIds) {
      const courseId = BigInt(cId);

      // Create Payment Record (mapped to your schema.prisma)
      const payment = await tx.payments.create({
        data: {
          user_id: uId,
          course_id: courseId,
          amount: amount / courseIds.length,
          currency: 'CAD',
          method: 'stripe',
          status: 'paid',
          transaction_id: transactionId
        }
      });

      // Create Enrollment record
      await tx.enrollments.create({
        data: {
          user_id: uId,
          course_id: courseId
        }
      });
      
      results.push(payment);
    }

    // Clear the User's Shopping Cart after successful purchase
    await tx.shoppingCart.deleteMany({
      where: { user_id: uId }
    });

    return results;
  });
};