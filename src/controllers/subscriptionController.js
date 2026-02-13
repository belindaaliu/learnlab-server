const prisma = require("../lib/prisma");
const { Prisma, Subscriptions_status } = require("@prisma/client");
const { applyDiscount, getPlanPricing } = require("../utils/discount");

const subscriptionController = {
  /* ----------------------------------------------------
   * GET ALL PLANS
   * --------------------------------------------------*/
  getPlans: async (req, res) => {
    try {
      const plans = await prisma.subscriptionPlans.findMany({
        orderBy: { price: "asc" },
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
          discount_active: plan.discount_active,
          discount_type: plan.discount_type,
          discount_value: plan.discount_value,
          discount_starts_at: plan.discount_starts_at,
          discount_ends_at: plan.discount_ends_at,
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
        courseIds,
        discount_active,
        discount_type,
        discount_value,
        discount_starts_at,
        discount_ends_at,
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Create the plan
        const newPlan = await tx.subscriptionPlans.create({
          data: {
            name,
            price: Number(price),
            duration_days: Number(duration_days),
            description,
            plan_type,
            button_text,
            slug,
            features,
            discount_active: !!discount_active,
            discount_type: discount_type || null,
            discount_value:
              discount_value != null && discount_value !== ""
                ? new Prisma.Decimal(discount_value)
                : null,
            discount_starts_at: discount_starts_at
              ? new Date(discount_starts_at)
              : null,
            discount_ends_at: discount_ends_at
              ? new Date(discount_ends_at)
              : null,
          },
        });

        // Link selected courses to this new plan
        if (courseIds && courseIds.length > 0) {
          await tx.courses.updateMany({
            where: { id: { in: courseIds.map((id) => Number(id)) } },
            data: { plan_id: newPlan.id },
          });
        }

        return newPlan;
      });

      res.json({
        success: true,
        message: "Subscription plan created",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

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
        courseIds = [],
        discount_active,
        discount_type,
        discount_value,
        discount_starts_at,
        discount_ends_at,
      } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Update Plan Details
        const updatedPlan = await tx.subscriptionPlans.update({
          where: { id: planId },
          data: {
            name,
            price: Number(price),
            duration_days: Number(duration_days),
            description,
            plan_type,
            button_text,
            slug,
            features,
            discount_active: !!discount_active,
            discount_type: discount_type || null,
            discount_value:
              discount_value != null && discount_value !== ""
                ? new Prisma.Decimal(discount_value)
                : null,
            discount_starts_at: discount_starts_at
              ? new Date(discount_starts_at)
              : null,
            discount_ends_at: discount_ends_at
              ? new Date(discount_ends_at)
              : null,
          },
        });

        // Reset existing links
        await tx.courses.updateMany({
          where: { plan_id: planId },
          data: { plan_id: null },
        });

        // Update with NEW links
        if (courseIds.length > 0) {
          const bigIntCourseIds = courseIds.map((id) => BigInt(id));

          await tx.courses.updateMany({
            where: { id: { in: bigIntCourseIds } },
            data: { plan_id: planId },
          });
        }

        return updatedPlan;
      });

      res.json({
        success: true,
        message: "Subscription plan updated",
        data: result,
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
        where: { user_id: userId, status: Subscriptions_status.active },
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
          features: subscription.SubscriptionPlans.features,
          autoRenew: subscription.auto_renew,
          nextPlanId: subscription.next_plan_id,
          nextAutoRenew: subscription.next_auto_renew,
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
      const { planId, autoRenew } = req.body;
      const userId = BigInt(req.user.userId);

      const plan = await prisma.subscriptionPlans.findUnique({
        where: { id: BigInt(planId) },
      });

      if (!plan) {
        return res
          .status(404)
          .json({ success: false, message: "Plan not found" });
      }

      const pricing = getPlanPricing(plan);
      const originalPrice = new Prisma.Decimal(pricing.originalPrice);
      const discountAmount = new Prisma.Decimal(pricing.discountAmount);
      const finalAmount = new Prisma.Decimal(pricing.finalPrice);

      const result = await prisma.$transaction(async (tx) => {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        const newSub = await tx.subscriptions.create({
          data: {
            user_id: userId,
            plan_id: BigInt(planId),
            status: Subscriptions_status.active,
            start_date: new Date(),
            end_date: endDate,
            auto_renew: !!autoRenew,
          },
        });

        await tx.payments.create({
          data: {
            user_id: userId,
            subscription_plan_id: BigInt(planId),
            amount: finalAmount,
            original_amount: originalPrice,
            discount_amount: discountAmount,
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
          status: Subscriptions_status.active, // enum, not "active"
        },
        data: {
          status: Subscriptions_status.canceled, // enum, matches schema spelling
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
        where: { plan_id: planId, status: Subscriptions_status.active },
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

  toggleAutoRenew: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const { autoRenew } = req.body;

      const updated = await prisma.subscriptions.updateMany({
        where: { user_id: userId, status: Subscriptions_status.active },
        data: { auto_renew: !!autoRenew },
      });

      if (updated.count === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No active subscription found" });
      }

      res.json({ success: true, data: { autoRenew: !!autoRenew } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // STUDENT: SCHEDULE PLAN CHANGE AT RENEWAL
  schedulePlanChange: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const { planId, autoRenew } = req.body;

      // validate target plan
      const targetPlan = await prisma.subscriptionPlans.findUnique({
        where: { id: BigInt(planId) },
      });
      if (!targetPlan) {
        return res
          .status(404)
          .json({ success: false, message: "Target plan not found" });
      }

      // find active subscription
      const subscription = await prisma.subscriptions.findFirst({
        where: { user_id: userId, status: Subscriptions_status.active },
      });

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "No active subscription to schedule a change on.",
        });
      }

      // store scheduled change
      const updated = await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          next_plan_id: BigInt(planId),
          next_auto_renew:
            autoRenew != null ? !!autoRenew : subscription.auto_renew,
        },
      });

      res.json({
        success: true,
        message: "Plan change scheduled for next billing period.",
        data: {
          nextPlanId: updated.next_plan_id?.toString(),
          nextAutoRenew: updated.next_auto_renew,
        },
      });
    } catch (error) {
      console.error("Schedule plan change error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = subscriptionController;
