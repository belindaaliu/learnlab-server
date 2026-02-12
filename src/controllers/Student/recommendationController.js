const prisma = require("../../lib/prisma");

const getRecommendations = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        skills: true,
        interests: true,
        field_of_learning: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const skills = Array.isArray(user.skills)
      ? user.skills.map((s) => s.toLowerCase())
      : [];
    const interests = Array.isArray(user.interests)
      ? user.interests.map((i) => i.toLowerCase())
      : [];
    const field = user.field_of_learning?.toLowerCase() || "";

    // Fetch purchased courses
    const purchased = await prisma.enrollments.findMany({
      where: { user_id: userId },
      select: {
        Courses: { select: { title: true } },
        course_id: true,
      },
    });

    const purchasedIds = purchased.map((p) => p.course_id);
    const purchasedTitles = purchased.map(
      (p) => p.Courses.title?.toLowerCase() || "",
    );

    // Build keyword list
    const keywords = [
      ...skills,
      ...interests,
      field,
      ...purchasedTitles,
    ].filter(Boolean);

    // Fetch all courses except purchased
    const allCourses = await prisma.courses.findMany({
      where: { id: { notIn: purchasedIds } },
      include: {
        CourseTags: true,
        Categories: true,
        Users: { select: { first_name: true, last_name: true } },
        SubscriptionPlans: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter in JS
    const recommended = allCourses.filter((course) => {
      const titleMatch =
        course.title?.toLowerCase().includes(field) ||
        keywords.some((k) => course.title?.toLowerCase().includes(k));
      const descriptionMatch = keywords.some((k) =>
        course.description?.toLowerCase().includes(k),
      );
      const categoryMatch = keywords.some((k) =>
        course.Categories?.name?.toLowerCase().includes(k),
      );
      const tagMatch = course.CourseTags?.some((tag) =>
        keywords.includes(tag.tag_name?.toLowerCase()),
      );
      const instructorMatch = keywords.some(
        (k) =>
          course.Users &&
          (course.Users.first_name?.toLowerCase().includes(k) ||
            course.Users.last_name?.toLowerCase().includes(k)),
      );

      return (
        titleMatch ||
        descriptionMatch ||
        categoryMatch ||
        tagMatch ||
        instructorMatch
      );
    });

    // Limit to 12
    const topRecommended = recommended.slice(0, 12);

    // Fallback: If nothing matched, show popular courses
    if (topRecommended.length === 0) {
      const popular = await prisma.courses.findMany({
        orderBy: { enrollments_count: "desc" },
        take: 6,
        include: {
          SubscriptionPlans: {
            select: { id: true, name: true },
          },
        },
      });
      return res.json(popular);
    }

    // res.json(topRecommended);

    const formatted = topRecommended.map((course) => {
      const basePrice = Number(course.price || 0);

      // compute final price with discount
      let finalPrice = basePrice;
      let hasActiveDiscount = false;
      let discountPercent = 0;

      if (
        course.discount_active &&
        course.discount_type &&
        course.discount_value != null
      ) {
        const now = new Date();
        const starts = course.discount_starts_at
          ? new Date(course.discount_starts_at)
          : null;
        const ends = course.discount_ends_at
          ? new Date(course.discount_ends_at)
          : null;

        const inWindow = (!starts || starts <= now) && (!ends || ends >= now);

        if (inWindow) {
          if (course.discount_type === "percent") {
            discountPercent = Number(course.discount_value);
            finalPrice = Number(
              (basePrice * (1 - discountPercent / 100)).toFixed(2),
            );
          } else if (course.discount_type === "fixed") {
            const discountValue = Number(course.discount_value);
            finalPrice = Math.max(
              0,
              Number((basePrice - discountValue).toFixed(2)),
            );
            discountPercent =
              basePrice > 0
                ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
                : 0;
          }
          if (finalPrice < basePrice) hasActiveDiscount = true;
        }
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: basePrice,
        // NEW: pass all discount data so CourseCard logic works
        discount_active: course.discount_active,
        discount_type: course.discount_type,
        discount_value: course.discount_value,
        discount_starts_at: course.discount_starts_at,
        discount_ends_at: course.discount_ends_at,
        finalPrice, // optional, if you want to use it later
        discountPercent, // optional
        thumbnail_url:
          course.thumbnail_url ||
          "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
        rating: 4.8,
        reviews: course.views || 0,
        level: course.level,
        Categories: course.Categories ? { name: course.Categories.name } : null,
        Users: course.Users
          ? {
              first_name: course.Users.first_name,
              last_name: course.Users.last_name,
            }
          : null,
        SubscriptionPlans: course.SubscriptionPlans
          ? {
              id: course.SubscriptionPlans.id,
              name: course.SubscriptionPlans.name,
            }
          : null,
        required_plan_name: course.required_plan_name || null,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getRecommendations };
