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
    let originalAmount = 0;
    let metadata = {
      userId: userId.toString(),
      type: checkoutType,
    };

    // --- Look up active subscription for extra % off additional content ---
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

      extraDiscountPercent = Number(
        features?.discount_percent ?? features?.discountpercent ?? 0,
      );

      const planCourses = await prisma.courses.findMany({
        where: { plan_id: activeSub.SubscriptionPlans.id },
        select: { id: true },
      });

      includedCourseIds = new Set(planCourses.map((c) => c.id.toString()));
    }

    // --- CART CHECKOUT ---
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

      let totalCourseDiscount = 0;
      let totalSubscriptionDiscount = 0;

      for (const course of courses) {
        const pricing = getCoursePricing(course);

        const courseOriginal = pricing.originalPrice;
        const courseFinalBase = pricing.finalPrice;
        let courseFinal = courseFinalBase;

        const isIncludedInPlan = includedCourseIds.has(course.id.toString());

        // subscription extra discount only on non-included courses
        let subscriptionDiscountForCourse = 0;
        if (extraDiscountPercent > 0 && !isIncludedInPlan) {
          subscriptionDiscountForCourse =
            courseFinalBase * (extraDiscountPercent / 100);
          subscriptionDiscountForCourse = Number(
            subscriptionDiscountForCourse.toFixed(2),
          );
          courseFinal = Number(
            (courseFinalBase - subscriptionDiscountForCourse).toFixed(2),
          );
        }

        const courseDiscount = courseOriginal - courseFinalBase;

        originalAmount += courseOriginal;
        amount += courseFinal;
        totalCourseDiscount += courseDiscount;
        totalSubscriptionDiscount += subscriptionDiscountForCourse;
      }

      metadata.courseIds = courseIds.join(",");
      metadata.originalAmount = originalAmount.toString();
      metadata.courseDiscount = totalCourseDiscount.toString();
      metadata.subscriptionDiscount = totalSubscriptionDiscount.toString();
    }
    // --- SUBSCRIPTION CHECKOUT ---
    else if (checkoutType === "subscription") {
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

      const planDiscount = 0;

      metadata.planId = planId.toString();
      metadata.originalAmount = originalAmount.toString();
      metadata.subscriptionDiscount = planDiscount.toString();
    } else {
      return res.status(400).json({ message: "Invalid checkout type" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "cad",
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    const subscriptionDiscount = Math.max(0, originalAmount - amount);

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

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook constructEvent Error:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      const {
        type,
        userId,
        courseIds,
        planId,
        originalAmount,
        courseDiscount,
        subscriptionDiscount,
      } = intent.metadata;

      const finalAmount = intent.amount / 100;
      const origAmount = originalAmount ? Number(originalAmount) : finalAmount;
      const courseDisc = courseDiscount ? Number(courseDiscount) : 0;
      const subDisc = subscriptionDiscount ? Number(subscriptionDiscount) : 0;

      if (type === "cart") {
        await exports.fulfillOrder(
          userId,
          courseIds.split(","),
          intent.id,
          finalAmount,
          origAmount,
          courseDisc,
          subDisc,
        );
      } else if (type === "subscription") {
        await exports.fulfillSubscription(
          userId,
          planId,
          intent.id,
          finalAmount,
          origAmount,
          subDisc,
        );
      } 
    }
    return res.status(200).send({ received: true });
  } catch (err) {
    console.error("Webhook handler Error:", err);
    return res.status(500).send("Webhook handler error");
  }
};

// Course Fulfillment
exports.fulfillOrder = async (
  userId,
  courseIds,
  transactionId,
  finalAmount,
  originalAmount,
  totalCourseDiscount,
  totalSubscriptionDiscount,
) => {
  const uId = BigInt(userId);

  return await prisma.$transaction(async (tx) => {
    const count = courseIds.length;

    const perCourseFinal = finalAmount / count;
    const perCourseOriginal = originalAmount / count;
    const perCourseCourseDiscount = totalCourseDiscount / count;
    const perCourseSubDiscount = totalSubscriptionDiscount / count;

    for (const cId of courseIds) {
      const courseId = BigInt(cId);

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
          discount_amount:
            perCourseCourseDiscount + perCourseSubDiscount > 0
              ? perCourseCourseDiscount + perCourseSubDiscount
              : 0,
          course_discount_amount:
            perCourseCourseDiscount > 0 ? perCourseCourseDiscount : 0,
          subscription_discount_amount:
            perCourseSubDiscount > 0 ? perCourseSubDiscount : 0,
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
  subscriptionDiscount,
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
    const totalDiscount = orig - finalAmount;
    const subDisc =
      typeof subscriptionDiscount === "number"
        ? subscriptionDiscount
        : totalDiscount;

    await tx.payments.create({
      data: {
        user_id: uId,
        subscription_plan_id: pId,
        amount: finalAmount,
        original_amount: orig,
        discount_amount: totalDiscount > 0 ? totalDiscount : 0,
        course_discount_amount: 0,
        subscription_discount_amount: subDisc > 0 ? subDisc : 0,
        currency: "CAD",
        method: "stripe",
        status: "paid",
        transaction_id: transactionId,
      },
    });
  });
};
