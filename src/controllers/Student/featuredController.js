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

    switch (tab) {
      case 'popular':
        // Most popular by enrollment count
        courses = await prisma.courses.findMany({
          where: baseWhere,
          orderBy: [
            { enrollments_count: 'desc' },
            { views: 'desc' }
          ],
          include: {
            Categories: { select: { name: true } },
            Users: { select: { first_name: true, last_name: true } },
            SubscriptionPlans: { select: { id: true, name: true } },
            _count: {
              select: {
                Enrollments: true,
                Reviews: true
              }
            }
          },
          take: 20
        });
        break;

      case 'new':
        // Newest courses
        courses = await prisma.courses.findMany({
          where: baseWhere,
          orderBy: { created_at: 'desc' },
          include: {
            Categories: { select: { name: true } },
            Users: { select: { first_name: true, last_name: true } },
            SubscriptionPlans: { select: { id: true, name: true } },
            _count: {
              select: {
                Enrollments: true,
                Reviews: true
              }
            }
          },
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
          include: {
            Categories: { select: { name: true } },
            Users: { select: { first_name: true, last_name: true } },
            SubscriptionPlans: { select: { id: true, name: true } },
            _count: {
              select: {
                Enrollments: true,
                Reviews: true
              }
            }
          },
          take: 20
        });
        break;

      default:
        courses = [];
    }

    // Get average ratings for each course
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const reviews = await prisma.reviews.aggregate({
          where: { course_id: course.id },
          _avg: { rating: true }
        });

        return {
          id: course.id,
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          price: course.price,
          thumbnail_url: course.thumbnail_url || "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
          level: course.level,
          category: course.Categories?.name || "Uncategorized",
          instructor: course.Users 
            ? `${course.Users.first_name} ${course.Users.last_name}`
            : "Unknown Instructor",
          rating: reviews._avg.rating || 4.8,
          reviews_count: course._count?.Reviews || 0,
          students_enrolled: course._count?.Enrollments || 0,
          created_at: course.created_at,
          SubscriptionPlans: course.SubscriptionPlans,
          isPremium: !!course.SubscriptionPlans
        };
      })
    );

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