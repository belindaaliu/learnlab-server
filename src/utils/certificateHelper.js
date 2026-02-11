const prisma = require("../lib/prisma");

exports.checkAndIssueCertificate = async (userId, courseId) => {
  try {
    const uId = BigInt(userId);
    const cId = BigInt(courseId);

    // CONDITION 1: all non-section content completed
    const totalContent = await prisma.courseContent.count({
      where: { 
        course_id: cId,
        type: { not: "section" },
      },
    });

    const completedContent = await prisma.lessonProgress.count({
      where: {
        user_id: uId,
        is_completed: true,
        CourseContent: { course_id: cId, type: { not: "section" } },
      },
    });

    if (totalContent === 0 || completedContent < totalContent) {
      return { issued: false, reason: "Content incomplete" };
    }

    // CONDITION 2: all quizzes for this course passed (score > 55)
    const courseQuizzes = await prisma.assessments.findMany({
      where: {
        CourseContent: { course_id: cId },
      },
      select: { id: true },
    });

    if (courseQuizzes.length > 0) {
      const quizIds = courseQuizzes.map((q) => q.id);

      const passedQuizzes = await prisma.quizAttempts.groupBy({
        by: ["assessment_id"],
        where: {
          user_id: uId,
          assessment_id: { in: quizIds },
          score: { gt: 55 },
        },
      });

      if (passedQuizzes.length < quizIds.length) {
        return { issued: false, reason: "Quizzes not passed" };
      }
    }

    // ISSUE certificate if not already present
    const existingCert = await prisma.certificates.findFirst({
      where: { user_id: uId, course_id: cId },
    });

    if (!existingCert) {
      await prisma.certificates.create({
        data: {
          user_id: uId,
          course_id: cId,
          issued_at: new Date(),
        },
      });

      return { issued: true, reason: "Certificate created" };
    }

    return { issued: false, reason: "Certificate already exists" };
  } catch (error) {
    console.error("Certificate Issue Error:", error);
    return { issued: false, reason: "Internal error" };
  }
};
