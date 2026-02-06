// const prisma = require("../lib/prisma");

// const subscriptionController = {
//   getPlans: async (req, res) => {
//     try {
//       const plans = await prisma.subscriptionPlans.findMany();
//       console.log("Database Query Result:", plans);
//       orderBy: { price: "asc" }

//       const formattedPlans = plans.map((plan) => {
//         let parsedFeatures = plan.features;
//         if (typeof plan.features === "string") {
//           try {
//             parsedFeatures = JSON.parse(plan.features);
//           } catch (e) {
//             parsedFeatures = [];
//           }
//         }

//         return {
//           ...plan,
//           id: plan.id.toString(),
//           price: Number(plan.price),
//           features: parsedFeatures || [],
//         };
//       });

//       res.json({ success: true, data: formattedPlans });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   // Get current student subscription status
//   getOverview: async (req, res) => {
//     try {
//       const userId = BigInt(req.user.userId);
//       const subscription = await prisma.subscriptions.findFirst({
//         where: { user_id: userId, status: "active" },
//         include: { SubscriptionPlans: true },
//       });

//       if (!subscription) {
//         return res.json({
//           success: true,
//           data: { hasActiveSubscription: false },
//         });
//       }

//       res.json({
//         success: true,
//         data: {
//           hasActiveSubscription: true,
//           planName: subscription.SubscriptionPlans.name,
//           endDate: subscription.end_date,
//           status: subscription.status,
//         },
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   getHistory: async (req, res) => {
//     try {
//       const userId = BigInt(req.user.userId);
//       const payments = await prisma.payments.findMany({
//         where: { user_id: userId },
//         include: {
//           SubscriptionPlans: true,
//           Courses: true,
//         },
//         orderBy: { created_at: "desc" },
//       });

//       const formattedHistory = payments.map((p) => ({
//         id: p.id.toString(),
//         amount: Number(p.amount),
//         status: p.status,
//         date: p.created_at,

//         description:
//           p.SubscriptionPlans?.name || p.Courses?.title || "Course Purchase",
//         type: p.subscription_plan_id ? "Subscription" : "Course",
//       }));

//       res.json({ success: true, data: formattedHistory });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   subscribe: async (req, res) => {
//     try {
//       const { planId } = req.body;
//       const userId = BigInt(req.user.userId);

//       const plan = await prisma.subscriptionPlans.findUnique({
//         where: { id: BigInt(planId) },
//       });

//       if (!plan)
//         return res
//           .status(404)
//           .json({ success: false, message: "Plan not found" });

//       // Create the subscription and payment in a transaction
//       const result = await prisma.$transaction(async (tx) => {
//         const endDate = new Date();
//         endDate.setDate(endDate.getDate() + plan.duration_days);

//         const newSub = await tx.subscriptions.create({
//           data: {
//             user_id: userId,
//             plan_id: BigInt(planId),
//             status: "active",
//             start_date: new Date(),
//             end_date: endDate,
//           },
//         });

//         await tx.payments.create({
//           data: {
//             user_id: userId,
//             subscription_plan_id: BigInt(planId),
//             amount: plan.price,
//             currency: "CAD",
//             method: "stripe",
//             status: "paid",
//             transaction_id: `sub_${Date.now()}`,
//           },
//         });

//         return newSub;
//       });

//       res.json({
//         success: true,
//         message: "Subscribed successfully!",
//         data: result,
//       });
//     } catch (error) {
//       console.error("Subscription Error:", error);
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },

//   cancelSubscription: async (req, res) => {
//     try {
//       const userId = BigInt(req.user.userId);

//       const updated = await prisma.subscriptions.updateMany({
//         where: {
//           user_id: userId,
//           status: "active",
//         },
//         data: {
//           status: "cancelled",
//         },
//       });

//       if (updated.count === 0) {
//         return res
//           .status(404)
//           .json({ success: false, message: "No active subscription found" });
//       }

//       res.json({
//         success: true,
//         message: "Subscription cancelled successfully",
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   },
// };

// module.exports = subscriptionController;

const prisma = require("../lib/prisma");

const subscriptionController = {
  /* ----------------------------------------------------
   * GET ALL PLANS
   * --------------------------------------------------*/
  getPlans: async (req, res) => {
    try {
      const plans = await prisma.subscriptionPlans.findMany({
        // orderBy: { price: "asc" }
      });

      const formattedPlans = plans.map((plan) => {
        let features = plan.features;

        if (typeof features === "string") {
          try {
            features = JSON.parse(features);
          } catch {
            features = {};
          }
        }

        return {
          ...plan,
          id: plan.id.toString(),
          price: Number(plan.price),
          features: features || {},
        };
      });

      res.json({ success: true, data: formattedPlans });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /* ----------------------------------------------------
   * CREATE NEW SUBSCRIPTION PLAN (ADMIN ONLY)
   * --------------------------------------------------*/
  createPlan: async (req, res) => {
    try {
      const {
        name,
        price,
        duration_days,
        description,
        plan_type,
        features = {},
        button_text,
        slug,
      } = req.body;

      const newPlan = await prisma.subscriptionPlans.create({
        data: {
          name,
          price,
          duration_days,
          description,
          plan_type,
          button_text,
          slug,
          features, // Prisma stores JSON directly
        },
      });

      res.json({
        success: true,
        message: "Subscription plan created",
        data: newPlan,
      });
    } catch (error) {
      console.error("Create Plan Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /* ----------------------------------------------------
   * UPDATE EXISTING PLAN (ADMIN ONLY)
   * --------------------------------------------------*/
  updatePlan: async (req, res) => {
    try {
      const planId = BigInt(req.params.id);

      const {
        name,
        price,
        duration_days,
        description,
        plan_type,
        button_text,
        slug,
        features,
      } = req.body;

      // Fetch existing plan to merge JSON
      const existing = await prisma.subscriptionPlans.findUnique({
        where: { id: planId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
        });
      }

      // Merge features instead of overwriting (optional but recommended)
      let mergedFeatures = existing.features || {};
      if (features && typeof features === "object") {
        mergedFeatures = { ...mergedFeatures, ...features };
      }

      const updatedPlan = await prisma.subscriptionPlans.update({
        where: { id: planId },
        data: {
          name,
          price,
          duration_days,
          description,
          plan_type,
          button_text,
          slug,
          features: mergedFeatures,
        },
      });

      res.json({
        success: true,
        message: "Subscription plan updated",
        data: updatedPlan,
      });
    } catch (error) {
      console.error("Update Plan Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /* ----------------------------------------------------
   * STUDENT: GET ACTIVE SUBSCRIPTION OVERVIEW
   * --------------------------------------------------*/
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

  /* ----------------------------------------------------
   * GET PAYMENT / SUBSCRIPTION HISTORY
   * --------------------------------------------------*/
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

  /* ----------------------------------------------------
   * STUDENT: SUBSCRIBE TO A PLAN
   * --------------------------------------------------*/
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

  /* ----------------------------------------------------
   * STUDENT: CANCEL SUBSCRIPTION
   * --------------------------------------------------*/
  cancelSubscription: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);

      const updated = await prisma.subscriptions.updateMany({
        where: {
          user_id: userId,
          status: "active",
        },
        data: {
          status: "cancelled",
        },
      });

      if (updated.count === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No active subscription found" });
      }

      res.json({
        success: true,
        message: "Subscription cancelled successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /* ----------------------------------------------------
   * DELETE SUBSCRIPTION PLAN (ADMIN ONLY)
   * --------------------------------------------------*/
  deletePlan: async (req, res) => {
    try {
      const planId = BigInt(req.params.id);

      // Check if the plan exists
      const existing = await prisma.subscriptionPlans.findUnique({
        where: { id: planId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Subscription plan not found",
        });
      }

      // Prevent deleting plans that users are currently subscribed to
      const activeUsers = await prisma.subscriptions.count({
        where: { plan_id: planId, status: "active" },
      });

      if (activeUsers > 0) {
        return res.status(400).json({
          success: false,
          message:
            "This plan currently has active subscribers. Cancel or move them before deleting.",
        });
      }

      await prisma.subscriptionPlans.delete({
        where: { id: planId },
      });

      res.json({
        success: true,
        message: "Subscription plan deleted successfully",
      });
    } catch (error) {
      console.error("Delete Plan Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = subscriptionController;
