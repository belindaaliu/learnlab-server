const prisma = require("../lib/prisma");

function getCoursePricing(course) {
  const basePrice = Number(course.price || 0);

  const hasDiscount =
    course.discount_active &&
    course.discount_type &&
    course.discount_value != null &&
    (!course.discount_starts_at ||
      new Date(course.discount_starts_at) <= new Date()) &&
    (!course.discount_ends_at ||
      new Date(course.discount_ends_at) >= new Date());

  if (!hasDiscount) {
    return {
      originalPrice: basePrice,
      discountAmount: 0,
      finalPrice: basePrice,
    };
  }

  let finalPrice = basePrice;
  let discountAmount = 0;

  if (course.discount_type === "percent") {
    const percent = Number(course.discount_value);
    discountAmount = Number((basePrice * (percent / 100)).toFixed(2));
    finalPrice = Number((basePrice - discountAmount).toFixed(2));
  } else if (course.discount_type === "fixed") {
    const fixed = Number(course.discount_value);
    discountAmount = Math.min(basePrice, fixed);
    finalPrice = Number((basePrice - discountAmount).toFixed(2));
  }

  return {
    originalPrice: basePrice,
    discountAmount,
    finalPrice,
  };
}

async function getCart(userId) {
  try {
    // Load cart items
    const items = await prisma.ShoppingCart.findMany({
      where: { user_id: BigInt(userId) },
      include: {
        Courses: {
          include: { Users: true },
        },
      },
    });

    // Check active subscription and plan features.discountpercent
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

    let extraDiscountPercent = 0;
    let includedCourseIds = new Set();

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

      // courses linked to this plan are considered "included", so no extra discount
      const planCourses = await prisma.courses.findMany({
        where: { plan_id: activeSub.SubscriptionPlans.id },
        select: { id: true },
      });
      includedCourseIds = new Set(planCourses.map((c) => c.id.toString()));
    }

    // Aggregate totals
    let subtotal = 0;
    let discount_total = 0;
    let subscription_discount_total = 0;
    const cartItems = [];

    for (const item of items) {
      if (!item.Courses) continue;

      const course = item.Courses;
      const pricing = getCoursePricing(course);


      subtotal += pricing.originalPrice;
      discount_total += pricing.discountAmount;

      // base final price after course sales
      let finalPrice = pricing.finalPrice;

      // extra subscription discount (only for non-included courses)
      let subscriptionDiscountForCourse = 0;
      const isIncludedInPlan = includedCourseIds.has(course.id.toString());

      if (extraDiscountPercent > 0 && !isIncludedInPlan) {
        subscriptionDiscountForCourse =
          finalPrice * (extraDiscountPercent / 100);
        subscriptionDiscountForCourse = Number(
          subscriptionDiscountForCourse.toFixed(2),
        );
        finalPrice = Number(
          (finalPrice - subscriptionDiscountForCourse).toFixed(2),
        );
        subscription_discount_total += subscriptionDiscountForCourse;
      }

      const instructorUser = course.Users || null;

      cartItems.push({
        id: item.id.toString(),
        user_id: item.user_id.toString(),
        course_id: item.course_id.toString(),
        added_at: item.added_at,
        original_price: pricing.originalPrice,
        discount_amount: pricing.discountAmount,
        final_price: finalPrice,
        course: {
          id: course.id.toString(),
          title: course.title,
          price: finalPrice,
          original_price: pricing.originalPrice,
          discount_amount: pricing.discountAmount,
          thumbnail_url: course.thumbnail_url,
          image: course.thumbnail_url,
          instructor_id: course.instructor_id
            ? course.instructor_id.toString()
            : null,
          instructor_name: instructorUser
            ? `${instructorUser.first_name} ${instructorUser.last_name}`
            : undefined,
          Users: instructorUser || undefined,
          level: course.level,
        },
      });
    }

    const total = subtotal - discount_total - subscription_discount_total;

    return {
      items: cartItems,
      subtotal: Number(subtotal.toFixed(2)),
      discount_total: Number(discount_total.toFixed(2)),
      subscription_discount_total: Number(
        subscription_discount_total.toFixed(2),
      ),
      total: Number(total.toFixed(2)),
      itemCount: cartItems.length,
    };
  } catch (err) {
    console.error("❌ Cart Service Get Error:", err);
    throw err;
  }
}

async function addToCart(userId, courseId) {
  const userIdBig = BigInt(userId);
  const courseIdBig = BigInt(courseId);

  const course = await prisma.Courses.findUnique({
    where: { id: courseIdBig },
    select: { instructor_id: true },
  });

  if (!course) throw new Error("Course not found");

  if (course.instructor_id && userIdBig === course.instructor_id) {
    throw new Error("You cannot add your own course to the cart");
  }

  const existingEnrollment = await prisma.Enrollments.findFirst({
    where: {
      user_id: userIdBig,
      course_id: courseIdBig,
    },
  });

  if (existingEnrollment) {
    throw new Error("You are already enrolled in this course");
  }

  const existing = await prisma.ShoppingCart.findFirst({
    where: {
      user_id: userIdBig,
      course_id: courseIdBig,
    },
  });

  if (existing) {
    return { item: existing, created: false };
  }

  const createdItem = await prisma.ShoppingCart.create({
    data: {
      user_id: userIdBig,
      course_id: courseIdBig,
    },
  });

  return { item: createdItem, created: true };
}

async function removeFromCart(cartItemId, userId) {
  return prisma.ShoppingCart.deleteMany({
    where: {
      id: BigInt(cartItemId),
      user_id: BigInt(userId),
    },
  });
}

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
};
