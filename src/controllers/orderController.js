const prisma = require("../lib/prisma");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { cartItems, planId, checkoutType } = req.body;

    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let amount = 0;
    let metadata = {
      userId: userId.toString(),
      type: checkoutType,
    };

    if (checkoutType === "cart") {
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const courseIds = cartItems.map((item) => BigInt(item.id));
      const courses = await prisma.courses.findMany({
        where: { id: { in: courseIds } },
      });

      amount = courses.reduce((sum, c) => sum + Number(c.price), 0);
      metadata.courseIds = courseIds.join(",");
    } else if (checkoutType === "subscription") {
      // Check for an existing active subscription
      const existingSub = await prisma.subscriptions.findFirst({
        where: {
          user_id: BigInt(userId),
          status: "active",
          end_date: { gte: new Date() }, 
        },
      });

      if (existingSub) {
        return res.status(400).json({
          message:
            "You already have an active subscription. Please manage your existing plan.",
        });
      }

      const plan = await prisma.subscriptionPlans.findUnique({
        where: { id: BigInt(planId) },
      });

      if (!plan) return res.status(404).json({ message: "Plan not found" });

      amount = Number(plan.price);
      metadata.planId = planId.toString();
    } else {
      return res.status(400).json({ message: "Invalid checkout type" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "cad",
      metadata: metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmount: Number(amount),
    });
  } catch (error) {
    console.error("Stripe Intent Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const { type, userId, courseIds, planId } = intent.metadata;

    try {
      if (type === "cart") {
        await exports.fulfillOrder(
          userId,
          courseIds.split(","),
          intent.id,
          intent.amount / 100,
        );
      } else if (type === "subscription") {
        await exports.fulfillSubscription(
          userId,
          planId,
          intent.id,
          intent.amount / 100,
        );
      }
    } catch (fulfillmentError) {
      console.error("Fulfillment Error:", fulfillmentError);
      return res.status(500).json({ error: "Fulfillment failed" });
    }
  }
  res.status(200).send({ received: true });
};

// Course Fulfillment
exports.fulfillOrder = async (userId, courseIds, transactionId, amount) => {
  const uId = BigInt(userId);

  return await prisma.$transaction(async (tx) => {
    for (const cId of courseIds) {
      const courseId = BigInt(cId);

      await tx.payments.create({
        data: {
          user_id: uId,
          course_id: courseId,
          amount: amount / courseIds.length,
          currency: "CAD",
          method: "stripe",
          status: "paid",
          transaction_id: transactionId,
        },
      });

      await tx.enrollments.create({
        data: {
          user_id: uId,
          course_id: courseId,
        },
      });
    }

    await tx.shoppingCart.deleteMany({
      where: { user_id: uId },
    });
  });
};

// Subscription Fulfillment
exports.fulfillSubscription = async (userId, planId, transactionId, amount) => {
  const uId = BigInt(userId);
  const pId = BigInt(planId);

  return await prisma.$transaction(async (tx) => {
    const plan = await tx.subscriptionPlans.findUnique({
      where: { id: pId },
    });

    if (!plan) throw new Error("Plan not found during fulfillment");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    await tx.subscriptions.create({
      data: {
        user_id: uId,
        plan_id: pId,
        status: "active",
        start_date: startDate,
        end_date: endDate,
      },
    });

    await tx.payments.create({
      data: {
        user_id: uId,
        subscription_plan_id: pId,
        amount: amount,
        currency: "CAD",
        method: "stripe",
        status: "paid",
        transaction_id: transactionId,
      },
    });
  });
};
