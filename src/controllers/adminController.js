const prisma = require("../lib/prisma");
const { getCoursePricing } = require("../utils/discount");

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
const INSTRUCTOR_SHARE_PCT = 0.85; // 85% to instructors

// --- ANALYTICS ---
exports.getAnalytics = async (req, res) => {
  try {
    const { start, end } = req.query;

    let paymentsDateWhere = { status: "paid" };
    let enrollmentsDateWhere = {};
    let subsDateWhere = {};

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (!isNaN(startDate) && !isNaN(endDate)) {
        paymentsDateWhere.created_at = { gte: startDate, lte: endDate };
        enrollmentsDateWhere.enrolled_at = { gte: startDate, lte: endDate };
        subsDateWhere.start_date = { gte: startDate, lte: endDate };
      }
    }

    const [
      highestRatedCoursesRaw,
      dropOffCourses,
      mostActiveLearners,
      refundRate,
      totalPayments,
      quizStats,
      difficultQuestions,
      revenueTrendLast30Raw,
      courses,
      enrollCounts,
      revenueByCategoryPayments,
      // revenue splits
      rangeRevenueAgg,
      subscriptionRevenueAgg,
      courseRevenueAgg,
      otherRevenueAgg,
      subscriptionRevenueByMonthGroup,
      courseRevenueByMonthGroup,
      subscriptionPopularityGroup,
    ] = await Promise.all([
      // Highest rated courses (all‑time)
      prisma.$queryRaw`
        SELECT cs.id, cs.title, CAST(AVG(r.rating) AS DECIMAL(10,2)) AS avg_rating 
        FROM Courses cs 
        JOIN Reviews r ON r.course_id = cs.id 
        GROUP BY cs.id, cs.title 
        ORDER BY avg_rating DESC 
        LIMIT 10`,

      // Drop-off risk (all‑time)
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

      // Most active learners (all‑time)
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

      // Refund count (all‑time)
      prisma.payments.count({ where: { status: "refunded" } }),

      // Total payments count (all‑time)
      prisma.payments.count(),

      // Quiz performance (all‑time)
      prisma.$queryRaw`
        SELECT 
          a.id, 
          a.title, 
          CAST(COUNT(qa.id) AS UNSIGNED) AS attempts, 
          CAST(AVG(qa.score) AS DECIMAL(10,2)) AS avg_score 
        FROM Assessments a 
        LEFT JOIN QuizAttempts qa ON qa.assessment_id = a.id 
        GROUP BY a.id, a.title`,

      // Difficult questions (all‑time) with course_id + course_title
      prisma.$queryRaw`
        SELECT 
          q.id,
          q.question_text,
          a.id AS assessment_id,
          cs.id AS course_id,
          cs.title AS course_title,
          CAST(
            AVG(
              CASE WHEN o.is_correct = 1 THEN 1.0 ELSE 0.0 END
            ) AS DECIMAL(10,2)
          ) AS correct_rate
        FROM AssessmentQuestions q 
        JOIN UserAnswers ua ON ua.question_id = q.id 
        LEFT JOIN AssessmentOptions o ON ua.selected_option_id = o.id 
        JOIN Assessments a ON a.id = q.assessment_id 
        JOIN CourseContent cc ON cc.id = a.content_id 
        JOIN Courses cs ON cs.id = cc.course_id 
        GROUP BY q.id, q.question_text, a.id, cs.id, cs.title 
        ORDER BY correct_rate ASC 
        LIMIT 10`,

      // Last 30 days vs previous 30 days (global trend, collected)
      prisma.$queryRaw`
        SELECT 
          CAST(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) AS DOUBLE) as currentPeriod,
          CAST(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) AS DOUBLE) as previousPeriod
        FROM Payments 
        WHERE status = 'paid'`,

      // All courses (id + price)
      prisma.courses.findMany({
        select: { id: true, price: true },
      }),

      // Enrollment counts within date range (or all if no range)
      prisma.enrollments.groupBy({
        by: ["course_id"],
        where: enrollmentsDateWhere,
        _count: { id: true },
      }),

      // Payments for revenueByCategory (collected, courses only)
      prisma.payments.findMany({
        where: {
          ...paymentsDateWhere,
          course_id: { not: null },
        },
        select: {
          amount: true,
          Courses: {
            select: {
              Categories: { select: { name: true } },
            },
          },
        },
      }),

      // Total paid in selected range (all collected revenue)
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: paymentsDateWhere,
      }),

      // Subscription revenue in selected range (collected)
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: {
          ...paymentsDateWhere,
          subscription_plan_id: { not: null },
        },
      }),

      // Course revenue in selected range (collected)
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: {
          ...paymentsDateWhere,
          course_id: { not: null },
        },
      }),

      // Other revenue in selected range (collected, no course & no sub plan)
      prisma.payments.aggregate({
        _sum: { amount: true },
        where: {
          ...paymentsDateWhere,
          course_id: null,
          subscription_plan_id: null,
        },
      }),

      // Subscription revenue per payment in selected range (collected)
      prisma.payments.groupBy({
        by: ["created_at"],
        where: {
          ...paymentsDateWhere,
          subscription_plan_id: { not: null },
        },
        _sum: { amount: true },
      }),

      // Course revenue per payment in selected range (collected)
      prisma.payments.groupBy({
        by: ["created_at"],
        where: {
          ...paymentsDateWhere,
          course_id: { not: null },
        },
        _sum: { amount: true },
      }),

      // Subscription popularity within selected range
      prisma.subscriptions.groupBy({
        by: ["plan_id"],
        where: {
          status: "active",
          ...subsDateWhere,
        },
        _count: { id: true },
      }),
    ]);

    const toMonthKey = (d) => {
      const jsDate = new Date(d);
      return `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(
        2,
        "0",
      )}`;
    };

    // Most enrolled courses (date‑filtered)
    const enrollCountMap = enrollCounts.reduce((acc, row) => {
      acc[row.course_id.toString()] = row._count.id;
      return acc;
    }, {});
    const mostEnrolledCourseIds = Object.keys(enrollCountMap).map((id) =>
      BigInt(id),
    );
    const mostEnrolledMeta = mostEnrolledCourseIds.length
      ? await prisma.courses.findMany({
          where: { id: { in: mostEnrolledCourseIds } },
          select: { id: true, title: true },
        })
      : [];
    const courseTitleMap = mostEnrolledMeta.reduce((acc, c) => {
      acc[c.id.toString()] = c.title;
      return acc;
    }, {});
    const mostEnrolledCourses = Object.entries(enrollCountMap)
      .map(([courseId, count]) => ({
        id: BigInt(courseId),
        title: courseTitleMap[courseId] || `Course ${courseId}`,
        enrollments: count,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10);

    const highestRatedCourses = highestRatedCoursesRaw;

    // Revenue by category (collected, courses only)
    const revenueByCategoryMap = {};
    for (const p of revenueByCategoryPayments) {
      const catName = p.Courses?.Categories?.name || "Uncategorized";
      const amt = Number(p.amount || 0);
      revenueByCategoryMap[catName] =
        (revenueByCategoryMap[catName] || 0) + amt;
    }
    const revenueByCategory = Object.entries(revenueByCategoryMap).map(
      ([category, total]) => ({ category, total }),
    );

    // Subscription revenue per month (collected)
    const subscriptionRevenueByMonth = subscriptionRevenueByMonthGroup
      .map((row) => ({
        month: toMonthKey(row.created_at),
        total: Number(row._sum.amount || 0),
      }))
      .reduce((acc, row) => {
        const existing = acc.find((r) => r.month === row.month);
        if (existing) existing.total += row.total;
        else acc.push(row);
        return acc;
      }, []);

    // Course revenue per month (collected)
    const courseMonthMap = {};
    for (const row of courseRevenueByMonthGroup) {
      const key = toMonthKey(row.created_at);
      const val = Number(row._sum.amount || 0);
      courseMonthMap[key] = (courseMonthMap[key] || 0) + val;
    }

    // Subscription month map (collected)
    const subMonthMap = {};
    for (const row of subscriptionRevenueByMonthGroup) {
      const key = toMonthKey(row.created_at);
      const val = Number(row._sum.amount || 0);
      subMonthMap[key] = (subMonthMap[key] || 0) + val;
    }

    const allMonths = Array.from(
      new Set([...Object.keys(courseMonthMap), ...Object.keys(subMonthMap)]),
    ).sort();

    const monthlyRevenueCompare = allMonths.map((month) => ({
      month,
      courseRevenue: courseMonthMap[month] || 0,
      subscriptionRevenue: subMonthMap[month] || 0,
    }));

    // Subscription popularity
    const planIds = subscriptionPopularityGroup.map((s) => s.plan_id);
    const plans =
      planIds.length > 0
        ? await prisma.subscriptionPlans.findMany({
            where: { id: { in: planIds } },
            select: { id: true, name: true },
          })
        : [];
    const planMap = plans.reduce((acc, p) => {
      acc[p.id.toString()] = p.name;
      return acc;
    }, {});
    const subscriptionPopularity = subscriptionPopularityGroup.map((row) => ({
      plan_id: row.plan_id,
      plan_name: planMap[row.plan_id.toString()] || `Plan ${row.plan_id}`,
      active_subscriptions: row._count.id,
    }));

    // Trend based on last 30 vs previous 30 (collected)
    const stats = revenueTrendLast30Raw[0] || {
      currentPeriod: 0,
      previousPeriod: 0,
    };
    const currentPeriodFixed = Number(stats.currentPeriod || 0);
    const previousPeriodFixed = Number(stats.previousPeriod || 0);
    let revenueTrend = 0;
    if (previousPeriodFixed > 0) {
      revenueTrend =
        ((currentPeriodFixed - previousPeriodFixed) / previousPeriodFixed) *
        100;
    } else if (currentPeriodFixed > 0) {
      revenueTrend = 100;
    }

    // Collected revenue splits
    const totalRevenue = Number(rangeRevenueAgg._sum.amount || 0); // all paid
    const totalSubscriptionRevenue = Number(
      subscriptionRevenueAgg._sum.amount || 0,
    ); // subs only
    const collectedCourseRevenue = Number(courseRevenueAgg._sum.amount || 0); // courses only
    const otherRevenue = Number(otherRevenueAgg._sum.amount || 0); // neither

    // Course revenue ceiling = price × enrollments (list‑price)
    const enrollCountForRevenue = enrollCounts.reduce((acc, row) => {
      acc[row.course_id.toString()] = row._count.id;
      return acc;
    }, {});
    const totalCourseRevenueCeiling = courses.reduce((sum, c) => {
      const price = Number(c.price || 0);
      const count = enrollCountForRevenue[c.id.toString()] || 0;
      return sum + price * count;
    }, 0);

    // Projected revenue based on collected totalRevenue
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const projectedRevenue =
      dayOfMonth > 0 ? (totalRevenue / dayOfMonth) * daysInMonth : 0;

    // Instructor & platform share from collected total
    const instructorShare = totalRevenue * INSTRUCTOR_SHARE_PCT;
    const platformShare = totalRevenue - instructorShare;

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
        revenueTrend,
        currentMonthTotal: totalRevenue,
        projectedRevenue,

        totalRevenue, // courses + subs + other
        collectedCourseRevenue,
        totalSubscriptionRevenue,
        otherRevenue,

        totalCourseRevenueCeiling,

        instructorShare,
        platformShare,
        subscriptionRevenueByMonth,
        subscriptionPopularity,
        monthlyRevenueCompare,
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
    const rawStatus = req.query.status;
    const status =
      rawStatus && rawStatus.trim() !== "" ? rawStatus.trim() : null;

    const where = {
      role: { in: ["student", "instructor"] },
    };

    if (status) {
      // specific filter: pending / approved / rejected
      where.instructor_application_status = status;
    } else {
      // "All instructors" = users who have applied (exclude "none")
      where.instructor_application_status = {
        in: ["pending", "approved", "rejected"],
      };
    }

    const instructors = await prisma.users.findMany({
      where,
      orderBy: { instructor_application_submitted_at: "desc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        photo_url: true,
        role: true,
        instructor_application_status: true,
        instructor_application_submitted_at: true,
      },
    });

    res.json(serialize({ success: true, data: instructors }));
  } catch (error) {
    console.error("getInstructors error:", error);
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
          select: { name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(serialize({ success: true, data: courses }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCoursePricing = async (req, res) => {
  try {
    const { courseId } = req.params;
    const id = BigInt(courseId);

    const {
      price,
      discount_active,
      discount_type,
      discount_value,
      discount_starts_at,
      discount_ends_at,
    } = req.body;

    const existing = await prisma.courses.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const updated = await prisma.courses.update({
      where: { id },
      data: {
        price: price !== undefined ? Number(price) : existing.price,
        discount_active: discount_active ?? false,
        discount_type: discount_active ? discount_type : null,
        discount_value:
          discount_active && discount_value !== undefined
            ? Number(discount_value)
            : null,
        discount_starts_at:
          discount_active && discount_starts_at
            ? new Date(discount_starts_at)
            : null,
        discount_ends_at:
          discount_active && discount_ends_at
            ? new Date(discount_ends_at)
            : null,
      },
    });

    return res.json(
      serialize({
        success: true,
        message: "Course pricing updated by admin",
        data: updated,
      }),
    );
  } catch (error) {
    console.error("Admin updateCoursePricing error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update course" });
  }
};

exports.getInstructorCoursesWithRevenue = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const id = Number(instructorId);

    // Ensure instructor exists
    const instructor = await prisma.users.findUnique({
      where: { id },
      select: { id: true, first_name: true, last_name: true },
    });
    if (!instructor) {
      return res
        .status(404)
        .json({ success: false, message: "Instructor not found" });
    }

    // Base courses with counts
    const courses = await prisma.courses.findMany({
      where: { instructor_id: id, is_deleted: false },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        thumbnail_url: true,
        price: true,
        level: true,
        language: true,
        views: true,
        created_at: true,
        Categories: { select: { name: true } },
        Users: { select: { first_name: true, last_name: true } },
        _count: {
          select: {
            CourseContent: true,
            Enrollments: true,
            Reviews: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const courseIds = courses.map((c) => c.id);
    if (courseIds.length === 0) {
      return res.json(JSON.parse(JSON.stringify({ success: true, data: [] })));
    }

    // Revenue per course (paid payments)
    const payments = await prisma.payments.groupBy({
      by: ["course_id"],
      where: {
        status: "paid",
        course_id: { in: courseIds },
      },
      _sum: { amount: true },
    });

    const revenueMap = payments.reduce((acc, row) => {
      acc[row.course_id.toString()] = Number(row._sum.amount || 0);
      return acc;
    }, {});

    //  students_enrolled and totalRevenue
    const result = courses.map((course) => ({
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      thumbnail_url: course.thumbnail_url,
      price: Number(course.price || 0),
      level: course.level,
      language: course.language,
      category: course.Categories?.name || "Uncategorized",
      instructor_name: course.Users
        ? `${course.Users.first_name} ${course.Users.last_name}`
        : `${instructor.first_name} ${instructor.last_name}`,
      students_enrolled: course._count?.Enrollments || 0,
      reviews_count: course._count?.Reviews || 0,
      lectures: course._count?.CourseContent || 0,
      views: course.views || 0,
      totalRevenue: revenueMap[course.id.toString()] || 0,
    }));

    res.json(
      JSON.parse(
        JSON.stringify({ success: true, data: result }, (k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      ),
    );
  } catch (err) {
    console.error("getInstructorCoursesWithRevenue error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get specific course details
exports.getCourseAdminDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { start, end } = req.query;
    const id = BigInt(courseId);

    const course = await prisma.courses.findUnique({
      where: { id },
      include: {
        Users: { select: { first_name: true, last_name: true, email: true } },
        Categories: { select: { name: true } },
      },
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // build date filter
    const enrollmentWhere = { course_id: id };
    const paymentWhere = { course_id: id, status: "paid" };

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (!isNaN(startDate) && !isNaN(endDate)) {
        enrollmentWhere.enrolled_at = {
          gte: startDate,
          lte: endDate,
        };
        paymentWhere.created_at = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const [enrollmentCount, payments, enrollments] = await Promise.all([
      prisma.enrollments.count({
        where: enrollmentWhere,
      }),
      prisma.payments.findMany({
        where: paymentWhere,
        select: { amount: true },
      }),
      prisma.enrollments.findMany({
        where: { course_id: id },
        select: {
          id: true,
          enrolled_at: true,
          Users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const pricing = getCoursePricing(course);

    // compute completion per user: all video lessons for course vs completed ones
    const courseContent = await prisma.courseContent.findMany({
      where: { course_id: id, type: "video" },
      select: { id: true },
    });

    const contentIds = courseContent.map((c) => c.id);

    let completionByUser = {};
    if (contentIds.length > 0) {
      const progress = await prisma.lessonProgress.groupBy({
        by: ["user_id"],
        where: {
          content_id: { in: contentIds },
          is_completed: true,
        },
        _count: { id: true },
      });
      completionByUser = progress.reduce((acc, row) => {
        acc[row.user_id.toString()] = row._count.id;
        return acc;
      }, {});
    }

    const totalLessons = contentIds.length;

    const enrolledStudents = enrollments.map((enr) => {
      const userId = enr.Users.id.toString();
      const completedCount = completionByUser[userId] || 0;
      let status = "not_started";
      if (totalLessons > 0) {
        if (completedCount === 0) status = "not_started";
        else if (completedCount < totalLessons) status = "in_progress";
        else status = "completed";
      }

      return {
        id: enr.id,
        enrolled_at: enr.enrolled_at,
        user: enr.Users,
        status,
        completedLessons: completedCount,
        totalLessons,
      };
    });

    return res.json(
      serialize({
        success: true,
        data: {
          course: {
            ...course,
            price: Number(course.price || 0),
          },
          stats: {
            enrollmentCount,
            totalRevenue,
            pricing,
          },
          enrolledStudents,
        },
      }),
    );
  } catch (error) {
    console.error("Admin course detail error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load course detail",
    });
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

    if (role && role !== "") {
      where.role = role;
    }

    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase();
      where.OR = [
        { first_name: { contains: searchLower } },
        { last_name: { contains: searchLower } },
        { email: { contains: searchLower } },
      ];
    }

    console.log("Fetching users with filters:", { role, search, page, limit });
    console.log("Where clause:", JSON.stringify(where, null, 2));

    const [users, totalCount] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: "desc" },
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

    console.log("Found users:", users.length);
    console.log("Total count:", totalCount);

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
      }),
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
              },
            },
          },
        },
        Payments: {
          where: { status: "paid" },
          select: {
            amount: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Calculate stats
    const totalSpent = user.Payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const enrollmentCount = user.Enrollments.length;

    res.json(
      serialize({
        success: true,
        data: {
          ...user,
          stats: {
            totalSpent,
            enrollmentCount,
          },
        },
      }),
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

    if (!["student", "instructor", "admin"].includes(role)) {
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
      }),
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
