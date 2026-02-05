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

    // 1. Setup Filters
    const dateFilter = {};
    const enrollmentDateFilter = {}; // Specific for Enrollments table

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (!isNaN(startDate) && !isNaN(endDate)) {
        // Tables using 'created_at'
        dateFilter.created_at = { gte: startDate, lte: endDate };
        // Enrollment table using 'enrolled_at'
        enrollmentDateFilter.enrolled_at = { gte: startDate, lte: endDate };
      }
    }

    // 2. Setup SQL Filters for Raw Queries
    const hasDates = start && end;
    const sqlFilter = hasDates
      ? `AND created_at BETWEEN '${start}' AND '${end}'`
      : "";
    const sqlFilterCs = hasDates
      ? `AND cs.created_at BETWEEN '${start}' AND '${end}'`
      : "";

    // 3. Fetch Core Metrics (Prisma Client)
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
      prisma.enrollments.count({ where: enrollmentDateFilter }), // Uses correct column
    ]);

    // 4. Fetch Visual/Chart Data (Raw SQL)
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

    // 5. Fetch Activity Feed (Recent items)
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

    // 6. Return Serialized JSON
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
    ] = await Promise.all([
      prisma.$queryRaw`SELECT cs.id, cs.title, COUNT(e.id) AS enrollments FROM Courses cs LEFT JOIN Enrollments e ON e.course_id = cs.id GROUP BY cs.id, cs.title ORDER BY enrollments DESC LIMIT 10`,
      prisma.$queryRaw`SELECT cs.id, cs.title, AVG(r.rating) AS avg_rating FROM Courses cs JOIN Reviews r ON r.course_id = cs.id GROUP BY cs.id, cs.title ORDER BY avg_rating DESC LIMIT 10`,
      prisma.$queryRaw`SELECT cs.id, cs.title, CAST(SUM(CASE WHEN lp.is_completed = 0 THEN 1 ELSE 0 END) AS UNSIGNED) AS incomplete, CAST(COUNT(lp.id) AS UNSIGNED) AS total FROM Courses cs JOIN CourseContent cc ON cc.course_id = cs.id JOIN LessonProgress lp ON lp.content_id = cc.id GROUP BY cs.id, cs.title ORDER BY incomplete DESC LIMIT 10`,
      prisma.$queryRaw`SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) AS name, COUNT(lp.id) AS completed_lessons FROM Users u JOIN LessonProgress lp ON lp.user_id = u.id WHERE lp.is_completed = 1 GROUP BY u.id, u.first_name, u.last_name ORDER BY completed_lessons DESC LIMIT 10`,
      prisma.$queryRaw`SELECT c.name AS category, SUM(p.amount) AS total FROM Payments p JOIN Courses cs ON cs.id = p.course_id JOIN Categories c ON c.id = cs.category_id WHERE p.status = 'paid' GROUP BY c.name`,
      prisma.payments.count({ where: { status: "refunded" } }),
      prisma.payments.count(),
      prisma.$queryRaw`SELECT a.id, a.title, CAST(COUNT(qa.id) AS UNSIGNED) AS attempts, AVG(qa.score) AS avg_score FROM Assessments a LEFT JOIN QuizAttempts qa ON qa.assessment_id = a.id GROUP BY a.id, a.title`,
      prisma.$queryRaw`SELECT q.id, q.question_text, AVG(CASE WHEN o.is_correct = 1 THEN 1.0 ELSE 0.0 END) AS correct_rate FROM AssessmentQuestions q JOIN UserAnswers ua ON ua.question_id = q.id LEFT JOIN AssessmentOptions o ON ua.selected_option_id = o.id GROUP BY q.id, q.question_text ORDER BY correct_rate ASC LIMIT 10`,
    ]);

    res.json(
      serialize({
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
        },
        engagementAnalytics: { quizStats, difficultQuestions },
      }),
    );
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: error.message });
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
