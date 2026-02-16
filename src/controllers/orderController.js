const prisma = require("../lib/prisma");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  notifyCoursePurchase,
  notifyCourseEnrollment,
} = require("../utils/notificationHelpers");
const { getCoursePricing } = require("../utils/discount");
const { Prisma } = require("@prisma/client");

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

    // look up active subscription for extra % off additional content

    let extraDiscountPercent = 0;
    let includedCourseIds = new Set();

    const activeSub = await prisma.subscriptions.findFirst({
      where: {
        user_id: BigInt(userId),
        status: "active",
        end_date: { gte: new Date() },
      },
      include: {
        SubscriptionPlans: true,
      },
    });

    if (activeSub && activeSub.SubscriptionPlans) {
      let features = activeSub.SubscriptionPlans.features;

      if (typeof features === "string") {
        try {
          features = JSON.parse(features);
        } catch {
          features = {};
        }
      }

      // e.g. 10 means 10% off additional content
      extraDiscountPercent = Number(features?.discountpercent || 0);

      const planCourses = await prisma.courses.findMany({
        where: { plan_id: activeSub.SubscriptionPlans.id },
        select: { id: true },
      });

      includedCourseIds = new Set(planCourses.map((c) => c.id.toString()));
    }

    if (checkoutType === "cart") {
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const courseIds = cartItems.map((item) => BigInt(item.id));
      const courses = await prisma.courses.findMany({
        where: { id: { in: courseIds } },
      });

      originalAmount = 0;
      amount = 0;

      // for (const course of courses) {
      //   const pricing = getCoursePricing(course);
      //   originalAmount += pricing.originalPrice;
      //   amount += pricing.finalPrice;
      // }

      for (const course of courses) {
        const pricing = getCoursePricing(course);
        let courseOriginal = pricing.originalPrice;
        let courseFinal = pricing.finalPrice;

        const isIncludedInPlan = includedCourseIds.has(course.id.toString());

        // Apply subscription extra % discount only to non-included courses
        if (extraDiscountPercent > 0 && !isIncludedInPlan) {
          const extraDiscount = courseFinal * (extraDiscountPercent / 100);
          courseFinal = Number((courseFinal - extraDiscount).toFixed(2));
        }

        originalAmount += courseOriginal;
        amount += courseFinal;
      }

      metadata.courseIds = courseIds.join(",");
      metadata.originalAmount = originalAmount.toString();
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

      originalAmount = Number(plan.price);
      amount = originalAmount;

      metadata.planId = planId.toString();
      metadata.originalAmount = originalAmount.toString();
    } else {
      return res.status(400).json({ message: "Invalid checkout type" });
    }

    const subscriptionDiscount = Math.max(0, originalAmount - amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "cad",
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmount: Number(amount),
      originalAmount: Number(originalAmount),
      subscriptionDiscount: Number(subscriptionDiscount),
    });
  } catch (error) {
    console.error("Stripe Intent Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  console.log("Stripe webhook hit, signature:", sig);
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log("Stripe event type:", event.type);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    console.log("payment_intent.succeeded metadata:", intent.metadata);
    const { type, userId, courseIds, planId, originalAmount } = intent.metadata;

    const finalAmount = intent.amount / 100;
    const origAmount = originalAmount ? Number(originalAmount) : finalAmount;

    try {
      if (type === "cart") {
        await exports.fulfillOrder(
          userId,
          courseIds.split(","),
          intent.id, // transactionId
          finalAmount,
          origAmount,
        );
      } else if (type === "subscription") {
        await exports.fulfillSubscription(
          userId,
          planId,
          intent.id,
          finalAmount,
          origAmount,
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
exports.fulfillOrder = async (
  userId,
  courseIds,
  transactionId,
  finalAmount,
  originalAmount,
) => {
  const uId = BigInt(userId);

  return await prisma.$transaction(async (tx) => {
    const perCourseFinal = finalAmount / courseIds.length;
    const perCourseOriginal = originalAmount / courseIds.length;
    const perCourseDiscount = perCourseOriginal - perCourseFinal;

    for (const cId of courseIds) {
      const courseId = BigInt(cId);

      // Get course details for notification
      const course = await tx.courses.findUnique({
        where: { id: courseId },
        select: { title: true },
      });

      await tx.payments.create({
        data: {
          user_id: uId,
          course_id: courseId,
          amount: perCourseFinal,
          original_amount: perCourseOriginal,
          discount_amount: perCourseDiscount > 0 ? perCourseDiscount : 0,
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

      // Send notification for each course purchased
      await notifyCoursePurchase(userId, course.title, cId);
    }

    await tx.shoppingCart.deleteMany({
      where: { user_id: uId },
    });
  });
};

// Subscription Fulfillment
exports.fulfillSubscription = async (
  userId,
  planId,
  transactionId,
  finalAmount,
  originalAmount,
) => {
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

    const orig = originalAmount ?? finalAmount;
    const discount = orig - finalAmount;

    await tx.payments.create({
      data: {
        user_id: uId,
        subscription_plan_id: pId,
        amount: finalAmount,
        original_amount: orig,
        discount_amount: discount > 0 ? discount : 0,
        currency: "CAD",
        method: "stripe",
        status: "paid",
        transaction_id: transactionId,
      },
    });
  });
};
