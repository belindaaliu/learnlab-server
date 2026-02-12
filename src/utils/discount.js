// utils/discount.js
const prisma = require("../lib/prisma");
const { Prisma } = require("@prisma/client");

function applyDiscount(originalPrice, type, value) {
  let discount = new Prisma.Decimal(0);

  if (!type || value == null) {
    return { original: originalPrice, discount, final: originalPrice };
  }

  if (type === "percent") {
    discount = originalPrice.mul(value).div(100);
  } else if (type === "fixed") {
    discount =
      value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  }

  let final = originalPrice.minus(discount);
  if (final.lessThan(0)) final = new Prisma.Decimal(0);

  return { original: originalPrice, discount, final };
}

function isCourseDiscountActive(course) {
  if (!course.discount_active) return false;

  const now = new Date();
  if (course.discount_starts_at && course.discount_starts_at > now)
    return false;
  if (course.discount_ends_at && course.discount_ends_at < now) return false;

  return !!course.discount_type && course.discount_value != null;
}

function getCoursePricing(course) {
  const base = new Prisma.Decimal(course.price || 0);

  if (!isCourseDiscountActive(course)) {
    return {
      originalPrice: Number(base),
      discountAmount: 0,
      finalPrice: Number(base),
    };
  }

  const { original, discount, final } = applyDiscount(
    base,
    course.discount_type,
    course.discount_value,
  );

  return {
    originalPrice: Number(original),
    discountAmount: Number(discount),
    finalPrice: Number(final),
  };
}

function isPlanDiscountActive(plan) {
  if (!plan.discount_active) return false;

  const now = new Date();
  if (plan.discount_starts_at && plan.discount_starts_at > now) return false;
  if (plan.discount_ends_at && plan.discount_ends_at < now) return false;

  return !!plan.discount_type && plan.discount_value != null;
}

function getPlanPricing(plan) {
  const base = new Prisma.Decimal(plan.price || 0);

  if (!isPlanDiscountActive(plan)) {
    return {
      originalPrice: Number(base),
      discountAmount: 0,
      finalPrice: Number(base),
    };
  }

  const { original, discount, final } = applyDiscount(
    base,
    plan.discount_type,
    plan.discount_value,
  );

  return {
    originalPrice: Number(original),
    discountAmount: Number(discount),
    finalPrice: Number(final),
  };
}

module.exports = {
  prisma,
  applyDiscount,
  getCoursePricing,
  isCourseDiscountActive,
  getPlanPricing,
  isPlanDiscountActive,
};
