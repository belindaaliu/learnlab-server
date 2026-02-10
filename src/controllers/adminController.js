const prisma = require("../lib/prisma");

const serialize = (data) =>
  JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

// --- DASHBOARD STATS ---
exports.getDashboardStats = async (req, res) => {
  try {
    const { start, end } = req.query;

    const dateFilter = {};
    const enrollmentDateFilter = {}; 

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (!isNaN(startDate) && !isNaN(endDate)) {
        dateFilter.created_at = { gte: startDate, lte: endDate };
        enrollmentDateFilter.enrolled_at = { gte: startDate, lte: endDate };
      }
    }

    // SQL Filters for Raw Queries
    const hasDates = start && end;
    const sqlFilter = hasDates
      ? `AND created_at BETWEEN '${start}' AND '${end}'`
      : "";
    const sqlFilterCs = hasDates
      ? `AND cs.created_at BETWEEN '${start}' AND '${end}'`
      : "";

    //  Core Metrics (Prisma Client)
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      activePaymentsCount,
      revenueAggregate,
      totalCourses,
      totalEnrollments,
    ] = await Promise.all([
      prisma.users.count({ where: dateFilter }),
      prisma.users.count({ where: { ...dateFilter, role: "student" } }),
      prisma.users.count({ where: { ...dateFilter, role: "instructor" } }),
      prisma.payments.count({ where: { ...dateFilter, status: "paid" } }),
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: { ...dateFilter, status: "paid" },
      }),
      prisma.courses.count({ where: dateFilter }),
      prisma.enrollments.count({ where: enrollmentDateFilter }), 
    ]);

    //  Visual/Chart Data (Raw SQL)
    const [revenueByMonth, usersByMonth, popularCategories] = await Promise.all(
      [
        prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS total 
        FROM Payments 
        WHERE status = 'paid' ${sqlFilter} 
        GROUP BY month 
        ORDER BY month ASC
      `),
        prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total 
        FROM Users 
        WHERE 1=1 ${sqlFilter} 
        GROUP BY month 
        ORDER BY month ASC
      `),
        prisma.$queryRawUnsafe(`
        SELECT c.name, CAST(COUNT(*) AS UNSIGNED) AS total 
        FROM Courses cs 
        JOIN Categories c ON c.id = cs.category_id 
        WHERE 1=1 ${sqlFilterCs}
        GROUP BY cs.category_id 
        ORDER BY total DESC 
        LIMIT 10
      `),
      ],
    );

    // Activity Feed (Recent items)
    const [latestUsers, latestPayments] = await Promise.all([
      prisma.users.findMany({
        where: { role: "student" },
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          created_at: true,
        },
      }),
      prisma.payments.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: {
          Users: { select: { first_name: true, last_name: true } },
          Courses: { select: { title: true } },
        },
      }),
    ]);

    // Serialized JSON
    res.json(
      serialize({
        metrics: {
          totalUsers,
          totalStudents,
          totalInstructors,
          activeSubscriptions: activePaymentsCount,
          totalRevenue: Number(revenueAggregate._sum.amount || 0),
          totalCourses,
          totalEnrollments,
        },
        charts: {
          revenueByMonth,
          usersByMonth,
          popularCategories,
        },
        activity: {
          latestUsers,
          latestPayments,
        },
      }),
    );
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      details: error.message,
    });
  }
};

// --- ANALYTICS ---
exports.getAnalytics = async (req, res) => {
  try {
    const [
      mostEnrolledCourses,
      highestRatedCourses,
      dropOffCourses,
      mostActiveLearners,
      revenueByCategory,
      refundRate,
      totalPayments,
      quizStats,
      difficultQuestions,
      revenueTrendData,
    ] = await Promise.all([
      // Top Courses by Enrollment
      prisma.$queryRaw`
        SELECT cs.id, cs.title, CAST(COUNT(e.id) AS UNSIGNED) AS enrollments 
        FROM Courses cs 
        LEFT JOIN Enrollments e ON e.course_id = cs.id 
        GROUP BY cs.id, cs.title 
        ORDER BY enrollments DESC 
        LIMIT 10`,

      // Highest Rated Courses
      prisma.$queryRaw`
        SELECT cs.id, cs.title, CAST(AVG(r.rating) AS DECIMAL(10,2)) AS avg_rating 
        FROM Courses cs 
        JOIN Reviews r ON r.course_id = cs.id 
        GROUP BY cs.id, cs.title 
        ORDER BY avg_rating DESC 
        LIMIT 10`,

      // Drop-off Risk
      prisma.$queryRaw`
        SELECT 
          cs.id, 
          cs.title, 
          CAST(SUM(CASE WHEN lp.is_completed = 0 THEN 1 ELSE 0 END) AS UNSIGNED) AS incomplete, 
          CAST(COUNT(lp.id) AS UNSIGNED) AS total 
        FROM Courses cs 
        JOIN CourseContent cc ON cc.course_id = cs.id 
        JOIN LessonProgress lp ON lp.content_id = cc.id 
        GROUP BY cs.id, cs.title 
        ORDER BY incomplete DESC 
        LIMIT 10`,

      // Most Active Learners 
      prisma.$queryRaw`
        SELECT 
          u.id, 
          CONCAT(u.first_name, ' ', u.last_name) AS name, 
          CAST(COUNT(lp.id) AS UNSIGNED) AS completed_lessons 
        FROM Users u 
        JOIN LessonProgress lp ON lp.user_id = u.id 
        WHERE lp.is_completed = 1 OR lp.is_completed = true
        GROUP BY u.id, u.first_name, u.last_name 
        ORDER BY completed_lessons DESC 
        LIMIT 10`,

      // Financials: Revenue by Category 
      prisma.$queryRaw`
        SELECT 
          c.name AS category, 
          CAST(SUM(p.amount) AS DOUBLE) AS total 
        FROM Payments p 
        JOIN Courses cs ON cs.id = p.course_id 
        JOIN Categories c ON c.id = cs.category_id 
        WHERE p.status = 'paid' 
        GROUP BY c.name`,

      // Global Refund Count
      prisma.payments.count({ where: { status: "refunded" } }),

      // Total Payment Count
      prisma.payments.count(),

      // General Quiz Performance
      prisma.$queryRaw`
        SELECT 
          a.id, 
          a.title, 
          CAST(COUNT(qa.id) AS UNSIGNED) AS attempts, 
          CAST(AVG(qa.score) AS DECIMAL(10,2)) AS avg_score 
        FROM Assessments a 
        LEFT JOIN QuizAttempts qa ON qa.assessment_id = a.id 
        GROUP BY a.id, a.title`,

      // Identifying Difficult Questions
      prisma.$queryRaw`
        SELECT 
          q.id, 
          q.question_text, 
          CAST(AVG(CASE WHEN o.is_correct = 1 THEN 1.0 ELSE 0.0 END) AS DECIMAL(10,2)) AS correct_rate 
        FROM AssessmentQuestions q 
        JOIN UserAnswers ua ON ua.question_id = q.id 
        LEFT JOIN AssessmentOptions o ON ua.selected_option_id = o.id 
        GROUP BY q.id, q.question_text 
        ORDER BY correct_rate ASC 
        LIMIT 10`,

      // Trend Comparison: Current 30 days vs Previous 30 days
      prisma.$queryRaw`
        SELECT 
          CAST(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) AS DOUBLE) as currentPeriod,
          CAST(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) AS DOUBLE) as previousPeriod
        FROM Payments 
        WHERE status = 'paid'`,
    ]);

    // --- CALCULATE TREND & PREDICTION ---
    const stats = revenueTrendData[0] || {
      currentPeriod: 0,
      previousPeriod: 0,
    };
    const current30Days = Number(stats.currentPeriod || 0);
    const previous30Days = Number(stats.previousPeriod || 0);

    // Calculate Trend Percentage
    let revenueTrend = 0;
    if (previous30Days > 0) {
      revenueTrend = ((current30Days - previous30Days) / previous30Days) * 100;
    } else if (current30Days > 0) {
      revenueTrend = 100;
    }

    // Calculate Predictive Revenue (Run Rate)
    // Formula: (Total Revenue so far / Days passed) * Total days in month
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const projectedRevenue = (current30Days / dayOfMonth) * daysInMonth;

    const analyticsData = {
      courseAnalytics: {
        mostEnrolledCourses,
        highestRatedCourses,
        dropOffCourses,
      },
      userAnalytics: { mostActiveLearners },
      financialAnalytics: {
        revenueByCategory,
        refundRate,
        refundPercentage:
          totalPayments === 0 ? 0 : (refundRate / totalPayments) * 100,
        revenueTrend: revenueTrend,
        currentMonthTotal: current30Days,
        projectedRevenue: projectedRevenue,
      },
      engagementAnalytics: { quizStats, difficultQuestions },
    };

    res.json(serialize(analyticsData));
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- INSTRUCTOR & COURSE MANAGEMENT ---
exports.getInstructors = async (req, res) => {
  try {
    const { status } = req.query;
    const instructors = await prisma.users.findMany({
      where: {
        role: "instructor",
        ...(status && { instructor_application_status: status }),
      },
      orderBy: { instructor_application_submitted_at: "desc" },
    });
    res.json(serialize({ success: true, data: instructors }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reviewInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { status, adminComment } = req.body;

    await prisma.users.update({
      where: { id: BigInt(instructorId) },
      data: {
        instructor_application_status: status,
        instructor_admin_comment: adminComment,
        instructor_reviewed_at: new Date(),
        role: status === "approved" ? "instructor" : "student",
      },
    });

    res.json({ success: true, message: `Instructor ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      include: {
        Users: { select: { first_name: true, last_name: true } },
        Categories: { select: { name: true } },
        SubscriptionPlans: {
          select: { name: true }
        }
      },
      orderBy: { created_at: "desc" },
    });
    res.json(serialize({ success: true, data: courses }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get specific instructor details
exports.getInstructorDetail = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const instructor = await prisma.users.findUnique({
      where: { id: BigInt(instructorId) },
    });
    if (!instructor)
      return res.status(404).json({ message: "Instructor not found" });
    res.json(serialize({ success: true, data: instructor }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get course review data (lessons/content)
exports.getCourseReviewData = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      include: {
        CourseContent: { orderBy: { order_index: "asc" } },
      },
    });
    res.json(serialize({ success: true, data: course }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update course level/status
exports.updateCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { level } = req.body;
    const updatedCourse = await prisma.courses.update({
      where: { id: BigInt(courseId) },
      data: { level: level },
    });
    res.json(
      serialize({
        success: true,
        message: "Course level updated",
        data: updatedCourse,
      }),
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- USER MANAGEMENT ---
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    
    if (role && role !== '') {
      where.role = role;
    }
    
    if (search && search.trim() !== '') {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    console.log('Fetching users with filters:', { role, search, page, limit });
    console.log('Where clause:', JSON.stringify(where, null, 2));

    const [users, totalCount] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          created_at: true,
          // last_login: true,  // REMOVED - field doesn't exist
          photo_url: true,
          instructor_application_status: true,
        },
      }),
      prisma.users.count({ where }),
    ]);

    console.log('Found users:', users.length);
    console.log('Total count:', totalCount);

    res.json(
      serialize({
        success: true,
        data: users,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
        },
      })
    );
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) },
      include: {
        Enrollments: {
          include: {
            Courses: {
              select: {
                id: true,
                title: true,
                price: true,
              }
            }
          }
        },
        Payments: {
          where: { status: 'paid' },
          select: {
            amount: true,
            created_at: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Calculate stats
    const totalSpent = user.Payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const enrollmentCount = user.Enrollments.length;

    res.json(
      serialize({
        success: true,
        data: {
          ...user,
          stats: {
            totalSpent,
            enrollmentCount,
          }
        }
      })
    );
  } catch (error) {
    console.error("Get User Detail Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updatedUser = await prisma.users.update({
      where: { id: BigInt(userId) },
      data: { role },
    });

    res.json(
      serialize({
        success: true,
        message: `User role updated to ${role}`,
        data: updatedUser,
      })
    );
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.users.delete({
      where: { id: BigInt(userId) },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
