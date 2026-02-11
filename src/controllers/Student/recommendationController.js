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

    const skills = Array.isArray(user.skills) ? user.skills.map(s => s.toLowerCase()) : [];
    const interests = Array.isArray(user.interests) ? user.interests.map(i => i.toLowerCase()) : [];
    const field = user.field_of_learning?.toLowerCase() || "";

    // Fetch purchased courses
    const purchased = await prisma.enrollments.findMany({
      where: { user_id: userId },
      select: {
        Courses: { select: { title: true } },
        course_id: true,
      },
    });

    const purchasedIds = purchased.map(p => p.course_id);
    const purchasedTitles = purchased.map(p => p.Courses.title?.toLowerCase() || "");

    // Build keyword list
    const keywords = [...skills, ...interests, field, ...purchasedTitles].filter(Boolean);

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
    const recommended = allCourses.filter(course => {
      const titleMatch = course.title?.toLowerCase().includes(field) || keywords.some(k => course.title?.toLowerCase().includes(k));
      const descriptionMatch = keywords.some(k => course.description?.toLowerCase().includes(k));
      const categoryMatch = keywords.some(k => course.Categories?.name?.toLowerCase().includes(k));
      const tagMatch = course.CourseTags?.some(tag => keywords.includes(tag.tag_name?.toLowerCase()));
      const instructorMatch = keywords.some(k => 
        course.Users && (
          course.Users.first_name?.toLowerCase().includes(k) || 
          course.Users.last_name?.toLowerCase().includes(k)
        )
      );

      return titleMatch || descriptionMatch || categoryMatch || tagMatch || instructorMatch;
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
    
    const formatted = topRecommended.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      thumbnail_url:
        course.thumbnail_url ||
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
      rating: 4.8,
      reviews: course.views || 0,
      level: course.level,
      Categories: course.Categories
        ? { name: course.Categories.name }
        : null,
      Users: course.Users
        ? {
            first_name: course.Users.first_name,
            last_name: course.Users.last_name,
          }
        : null,
      // critical for CourseCard:
      SubscriptionPlans: course.SubscriptionPlans
        ? {
            id: course.SubscriptionPlans.id,
            name: course.SubscriptionPlans.name,
          }
        : null,
      required_plan_name: course.required_plan_name || null,
    }));

    res.json(formatted);

  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getRecommendations };
