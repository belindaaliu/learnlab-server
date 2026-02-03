const prisma = require("../lib/prisma");

const subscriptionController = {
  getPlans: async (req, res) => {
    try {
      const plans = await prisma.subscriptionPlans.findMany();
      console.log("Database Query Result:", plans);

      const formattedPlans = plans.map((plan) => {
        let parsedFeatures = plan.features;
        if (typeof plan.features === "string") {
          try {
            parsedFeatures = JSON.parse(plan.features);
          } catch (e) {
            parsedFeatures = [];
          }
        }

        return {
          ...plan,
          id: plan.id.toString(),
          price: Number(plan.price),
          features: parsedFeatures || [],
        };
      });

      res.json({ success: true, data: formattedPlans });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get current student subscription status
  getOverview: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const subscription = await prisma.subscriptions.findFirst({
        where: { user_id: userId, status: "active" },
        include: { SubscriptionPlans: true },
      });

      if (!subscription) {
        return res.json({
          success: true,
          data: { hasActiveSubscription: false },
        });
      }

      res.json({
        success: true,
        data: {
          hasActiveSubscription: true,
          planName: subscription.SubscriptionPlans.name,
          endDate: subscription.end_date,
          status: subscription.status,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const payments = await prisma.payments.findMany({
        where: { user_id: userId },
        include: {
          SubscriptionPlans: true,
          Courses: true, 
        },
        orderBy: { created_at: "desc" },
      });

      const formattedHistory = payments.map((p) => ({
        id: p.id.toString(),
        amount: Number(p.amount),
        status: p.status,
        date: p.created_at,

        description:
          p.SubscriptionPlans?.name || p.Courses?.title || "Course Purchase",
        type: p.subscription_plan_id ? "Subscription" : "Course",
      }));

      res.json({ success: true, data: formattedHistory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  subscribe: async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = BigInt(req.user.userId);

      const plan = await prisma.subscriptionPlans.findUnique({
        where: { id: BigInt(planId) },
      });

      if (!plan)
        return res
          .status(404)
          .json({ success: false, message: "Plan not found" });

      // Create the subscription and payment in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        const newSub = await tx.subscriptions.create({
          data: {
            user_id: userId,
            plan_id: BigInt(planId),
            status: "active",
            start_date: new Date(),
            end_date: endDate,
          },
        });

        await tx.payments.create({
          data: {
            user_id: userId,
            subscription_plan_id: BigInt(planId),
            amount: plan.price,
            currency: "CAD",
            method: "stripe",
            status: "paid",
            transaction_id: `sub_${Date.now()}`,
          },
        });

        return newSub;
      });

      res.json({
        success: true,
        message: "Subscribed successfully!",
        data: result,
      });
    } catch (error) {
      console.error("Subscription Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = subscriptionController;
