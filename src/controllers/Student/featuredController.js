const prisma = require("../../lib/prisma");

// Get featured courses based on different criteria
const getFeaturedCourses = async (req, res) => {
  try {
    const { tab = 'popular' } = req.query;
    const userId = req.params.id ? Number(req.params.id) : null;
    
    let courses = [];
    let purchasedIds = [];

    // Get user's purchased courses if userId exists
    if (userId) {
      const purchased = await prisma.enrollments.findMany({
        where: { user_id: userId },
        select: { course_id: true }
      });
      purchasedIds = purchased.map(p => p.course_id);
    }

    // Base query - exclude purchased courses and deleted courses
    const baseWhere = {
      is_deleted: false,
      ...(purchasedIds.length > 0 ? { id: { notIn: purchasedIds } } : {})
    };

    // Common include for all queries
    const commonInclude = {
      Categories: { select: { name: true } },
      Users: { select: { first_name: true, last_name: true } },
      SubscriptionPlans: { select: { id: true, name: true } },
      Reviews: {
        select: { rating: true }
      },
      _count: {
        select: {
          Enrollments: true
        }
      }
    };

    switch (tab) {
      case 'popular':
        // Most popular by enrollment count
        courses = await prisma.courses.findMany({
          where: baseWhere,
          orderBy: [
            { enrollments_count: 'desc' },
            { views: 'desc' }
          ],
          include: commonInclude,
          take: 20
        });
        break;

      case 'new':
        // Newest courses
        courses = await prisma.courses.findMany({
          where: baseWhere,
          orderBy: { created_at: 'desc' },
          include: commonInclude,
          take: 20
        });
        break;

      case 'intermediate-advanced':
        // Intermediate and advanced level courses
        courses = await prisma.courses.findMany({
          where: {
            ...baseWhere,
            level: {
              in: ['intermediate', 'advanced']
            }
          },
          orderBy: [
            { enrollments_count: 'desc' },
            { created_at: 'desc' }
          ],
          include: commonInclude,
          take: 20
        });
        break;

      default:
        courses = [];
    }

    // Calculate ratings from Reviews array
    const coursesWithRatings = courses.map((course) => {
      // Calculate average rating
      let averageRating = 0;
      let reviewCount = 0;

      if (course.Reviews && course.Reviews.length > 0) {
        const totalRating = course.Reviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = Number((totalRating / course.Reviews.length).toFixed(1));
        reviewCount = course.Reviews.length;
      }

      // Calculate discount if applicable
      const basePrice = Number(course.price || 0);
      let finalPrice = basePrice;
      let discountPercent = 0;

      if (
        course.discount_active &&
        course.discount_type &&
        course.discount_value != null
      ) {
        const now = new Date();
        const starts = course.discount_starts_at ? new Date(course.discount_starts_at) : null;
        const ends = course.discount_ends_at ? new Date(course.discount_ends_at) : null;
        const inWindow = (!starts || starts <= now) && (!ends || ends >= now);

        if (inWindow) {
          if (course.discount_type === "percent") {
            discountPercent = Number(course.discount_value);
            finalPrice = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
          } else if (course.discount_type === "fixed") {
            const discountValue = Number(course.discount_value);
            finalPrice = Math.max(0, Number((basePrice - discountValue).toFixed(2)));
            discountPercent = basePrice > 0 ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;
          }
        }
      }

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        price: basePrice,
        // Include discount data
        discount_active: course.discount_active,
        discount_type: course.discount_type,
        discount_value: course.discount_value,
        discount_starts_at: course.discount_starts_at,
        discount_ends_at: course.discount_ends_at,
        thumbnail_url: course.thumbnail_url || "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
        level: course.level,
        category: course.Categories?.name || "Uncategorized",
        Categories: course.Categories ? { name: course.Categories.name } : null,
        instructor: course.Users 
          ? `${course.Users.first_name} ${course.Users.last_name}`
          : "Unknown Instructor",
        Users: course.Users ? {
          first_name: course.Users.first_name,
          last_name: course.Users.last_name
        } : null,
        rating: averageRating,
        reviews_count: reviewCount,
        enrollments_count: course._count?.Enrollments || 0,
        created_at: course.created_at,
        updated_at: course.updated_at,
        requirements: course.requirements,
        SubscriptionPlans: course.SubscriptionPlans,
        isPremium: !!course.SubscriptionPlans,
        plan_id: course.plan_id
      };
    });

    res.json({
      success: true,
      tab,
      courses: coursesWithRatings
    });

  } catch (error) {
    console.error("Error fetching featured courses:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

module.exports = {
  getFeaturedCourses
};