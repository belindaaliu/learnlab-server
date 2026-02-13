const prisma = require("../lib/prisma");
const { checkAndIssueCertificate } = require("../utils/certificateHelper");
const { notifyCertificateIssued } = require("../utils/notificationHelpers");

// =======================
// GET COURSE PLAYER DATA
// =======================
const getCoursePlayerData = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = Number(req.user.userId);

    // Fetch course info
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      include: {
        Users: true,
        Categories: true,
        Reviews: true,
        CourseContent: true,
      },
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Get all course content (lessons)
    const allContent = await prisma.courseContent.findMany({
      where: { course_id: BigInt(courseId) },
    });

    // Initialize progress records for each content item
    // Only for non-section content (videos, notes, assessments)
    const lessons = allContent.filter((content) => content.type !== "section");

    for (const lesson of lessons) {
      // Check if progress record exists
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(lesson.id),
        },
      });

      // If no progress record exists, create one (default: not completed)
      if (!existingProgress) {
        await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(lesson.id),
            is_completed: false,
            completed_at: null,
          },
        });
      }
    }

    // COUNT TOTAL VIDEO LESSONS (non-section content)
    const totalLessons = lessons.length;

    // COUNT COMPLETED LESSONS FOR THIS USER
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        user_id: BigInt(userId),
        is_completed: true,
        CourseContent: {
          course_id: BigInt(courseId),
          type: { not: "section" }, // Only count non-section content
        },
      },
    });

    // Format response
    const formatted = {
      id: Number(course.id),
      title: course.title,
      description: course.description,
      image: course.thumbnail_url,
      updated_at: course.updated_at,
      instructor: {
        name: `${course.Users.first_name} ${course.Users.last_name}`,
        headline: course.Users.headline,
        biography: course.Users.biography,
        photo: course.Users.photo_url,
      },
      category: course.Categories?.name,
      rating: course.Reviews.length
        ? (
            course.Reviews.reduce((a, b) => a + b.rating, 0) /
            course.Reviews.length
          ).toFixed(1)
        : null,
      reviews: course.Reviews.length,
      students: course.views,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
    };

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching course player data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET ALL LESSONS
// =======================
// const getCourseLessons = async (req, res) => {
//   try {
//     const courseId = Number(req.params.courseId);

//     const lessons = await prisma.courseContent.findMany({
//     where: { course_id: courseId },
//     orderBy: { order_index: "asc" }
//     });

//     const formatted = lessons.map(l => ({
//     id: l.id,
//     title: l.title,
//     time: l.duration_seconds,
//     video_url: l.video_url,
//     type: l.type,
//     note_content: l.note_content
//     }));

//     res.json(formatted);

//   } catch (error) {
//     console.error("Error fetching lessons:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// =======================
// GET ALL LESSONS (organized by sections)
// =======================
const getCourseLessons = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    const allContent = await prisma.courseContent.findMany({
      where: {
        course_id: BigInt(courseId),
      },
      orderBy: { order_index: "asc" },
    });

    // Convert BigInt to Number for frontend
    const content = allContent.map((item) => ({
      id: Number(item.id),
      parent_id: item.parent_id ? Number(item.parent_id) : null,
      title: item.title,
      type: item.type,
      video_url: item.video_url,
      note_content: item.note_content,
      duration_seconds: item.duration_seconds,
      order_index: item.order_index,
      is_preview: item.is_preview,
    }));

    // Organize into sections and lessons
    const sections = content.filter((item) => item.type === "section");
    const lessons = content.filter((item) => item.type !== "section");

    // Create organized structure
    const organized = [];

    // Add standalone lessons first (no parent)
    const standaloneLessons = lessons.filter((lesson) => !lesson.parent_id);
    if (standaloneLessons.length > 0) {
      organized.push({
        id: "standalone",
        title: "Course Content",
        type: "standalone-section",
        children: standaloneLessons,
      });
    }

    // Add sections with their children
    sections.forEach((section) => {
      const sectionLessons = lessons.filter(
        (lesson) => lesson.parent_id === section.id,
      );
      organized.push({
        ...section,
        children: sectionLessons,
      });
    });

    res.json(organized);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET SINGLE LESSON
// =======================
const getLessonById = async (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);

    const lesson = await prisma.courseContent.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      video_url: lesson.video_url,
      time: lesson.duration,
      note_content: lesson.note_content,
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// MARK LESSON COMPLETE
// =======================
const markLessonComplete = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const lessonId = Number(req.params.lessonId);
    const courseId = Number(req.params.courseId);

    // Check if progress record already exists
    const existingProgress = await prisma.lessonProgress.findFirst({
      where: {
        user_id: BigInt(userId),
        content_id: BigInt(lessonId),
      },
    });

    if (existingProgress) {
      // Update existing record
      await prisma.lessonProgress.update({
        where: { id: existingProgress.id },
        data: {
          is_completed: true,
          completed_at: new Date(),
        },
      });
    } else {
      // Create new record
      await prisma.lessonProgress.create({
        data: {
          user_id: BigInt(userId),
          content_id: BigInt(lessonId),
          is_completed: true,
          completed_at: new Date(),
        },
      });
    }

    // Check certificate after marking lesson complete
    const certResult = await checkAndIssueCertificate(userId, courseId);

    // Send notification if certificate was issued
    if (certResult.issued && certResult.certificate) {
      const course = await prisma.courses.findUnique({
        where: { id: BigInt(courseId) },
        select: { title: true }
      });
      
      await notifyCertificateIssued(
        userId, 
        course.title, 
        courseId, 
        `/student/certificates`
      );
    }

    res.json({
      message: "Lesson marked complete",
      certificateIssued: certResult.issued,
      reason: certResult.reason,
    });
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// MARK LESSON INCOMPLETE (DELETE COMPLETION)
// =======================
const markLessonIncomplete = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const lessonId = Number(req.params.lessonId);

    // Find the progress record
    const existingProgress = await prisma.lessonProgress.findFirst({
      where: {
        user_id: BigInt(userId),
        content_id: BigInt(lessonId),
      },
    });

    if (existingProgress) {
      // Update the record to mark as incomplete
      await prisma.lessonProgress.update({
        where: {
          id: existingProgress.id,
        },
        data: {
          is_completed: false,
          completed_at: null,
        },
      });
      res.json({ message: "Lesson marked incomplete" });
    } else {
      // No record exists, so nothing to update
      res.json({ message: "Lesson was not completed" });
    }
  } catch (error) {
    console.error("Error marking lesson incomplete:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// SUBMIT REVIEW
// =======================
const submitCourseReview = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const courseId = Number(req.params.courseId);
    const { rating, review } = req.body;

    const newReview = await prisma.courseReviews.create({
      data: {
        user_id: userId,
        course_id: courseId,
        rating,
        review,
      },
    });

    res.json(newReview);
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET next uncompleted lesson (IMPROVED VERSION)
const getNextLesson = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const courseId = Number(req.params.courseId);

    // Get all non-section lessons ordered
    const lessons = await prisma.courseContent.findMany({
      where: {
        course_id: BigInt(courseId),
        type: { not: "section" },
      },
      orderBy: { order_index: "asc" },
    });

    // Get completed lessons for this user
    const progress = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(userId),
        CourseContent: {
          course_id: BigInt(courseId),
        },
      },
    });

    const completedIds = progress
      .filter((p) => p.is_completed)
      .map((p) => Number(p.content_id));

    // Debug: log what we found
    console.log("Total lessons:", lessons.length);
    console.log("Completed lesson IDs:", completedIds);
    console.log(
      "All lessons:",
      lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        order: l.order_index,
      })),
    );

    // Find first uncompleted lesson
    const nextLesson = lessons.find(
      (l) => !completedIds.includes(Number(l.id)),
    );

    console.log(
      "Next lesson found:",
      nextLesson
        ? { id: nextLesson.id, title: nextLesson.title, type: nextLesson.type }
        : "None",
    );

    res.json(nextLesson || lessons[0]); // fallback to first lesson
  } catch (error) {
    console.error("Error fetching next lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET COMPLETED LESSON IDs
// =======================
const getCompletedLessonIds = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const courseId = Number(req.params.courseId);

    // First, ensure all progress records exist
    const allContent = await prisma.courseContent.findMany({
      where: {
        course_id: BigInt(courseId),
        type: { not: "section" }, // Only non-section content
      },
    });

    for (const content of allContent) {
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(content.id),
        },
      });

      if (!existingProgress) {
        await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(content.id),
            is_completed: false,
            completed_at: null,
          },
        });
      }
    }

    // Now get completed lessons
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(userId),
        is_completed: true,
        CourseContent: { course_id: BigInt(courseId) },
      },
      select: {
        content_id: true,
      },
    });

    const completedLessonIds = completedProgress.map((p) =>
      Number(p.content_id),
    );

    res.json({ completedLessonIds });
  } catch (error) {
    console.error("Error fetching completed lesson IDs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// INITIALIZE COURSE PROGRESS
// =======================
const initializeCourseProgress = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = Number(req.user.userId);

    // Get all non-section content for this course
    const allContent = await prisma.courseContent.findMany({
      where: {
        course_id: BigInt(courseId),
        type: { not: "section" },
      },
    });

    const initialized = [];

    for (const content of allContent) {
      // Check if progress record already exists
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(content.id),
        },
      });

      // If no progress record exists, create one
      if (!existingProgress) {
        const progress = await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(content.id),
            is_completed: false,
            completed_at: null,
          },
        });
        initialized.push({
          content_id: Number(content.id),
          title: content.title,
          progress_id: Number(progress.id),
        });
      }
    }

    res.json({
      message: "Course progress initialized",
      initialized: initialized,
      totalLessons: allContent.length,
    });
  } catch (error) {
    console.error("Error initializing course progress:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET FIRST INCOMPLETE LESSON
// =======================
const getFirstIncompleteLesson = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const courseId = Number(req.params.courseId);

    // Get all non-section lessons ordered
    const lessons = await prisma.courseContent.findMany({
      where: {
        course_id: BigInt(courseId),
        type: { not: "section" },
      },
      orderBy: { order_index: "asc" },
    });

    // Get completed lessons for this user
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(userId),
        is_completed: true,
        CourseContent: {
          course_id: BigInt(courseId),
        },
      },
      select: {
        content_id: true,
      },
    });

    const completedIds = completedProgress.map((p) => Number(p.content_id));

    // Find first incomplete lesson
    const firstIncomplete = lessons.find(
      (lesson) => !completedIds.includes(Number(lesson.id)),
    );

    // If all lessons are completed, return first lesson
    const lessonToReturn = firstIncomplete || lessons[0];

    if (!lessonToReturn) {
      return res
        .status(404)
        .json({ message: "No lessons found in this course" });
    }

    res.json({
      lessonId: lessonToReturn.id,
      courseId: courseId,
    });
  } catch (error) {
    console.error("Error getting first incomplete lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
// GET ASSESSMENT DATA
// =======================
const getAssessmentData = async (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const userId = Number(req.user.userId);
    const courseId = Number(req.params.courseId);

    console.log("=== DEBUG: Fetching assessment ===");
    console.log("Lesson ID:", lessonId);
    console.log("Course ID:", courseId);
    console.log("User ID:", userId);

    // First, check if the lesson exists and is an assessment
    const lesson = await prisma.courseContent.findUnique({
      where: { id: BigInt(lessonId) },
      select: {
        id: true,
        title: true,
        type: true,
        course_id: true,
      },
    });

    console.log("Found lesson:", lesson);

    if (!lesson) {
      console.log("ERROR: Lesson not found");
      return res.status(404).json({
        message: "Lesson not found",
        debug: { lessonId, courseId },
      });
    }

    if (lesson.type !== "assessment") {
      console.log("ERROR: Lesson is not an assessment type");
      return res.status(400).json({
        message: "This lesson is not an assessment",
        lessonType: lesson.type,
        expectedType: "assessment",
      });
    }

    if (Number(lesson.course_id) !== courseId) {
      console.log("ERROR: Lesson doesn't belong to course");
      return res.status(403).json({
        message: "Lesson does not belong to this course",
        lessonCourseId: Number(lesson.course_id),
        requestedCourseId: courseId,
      });
    }

    // Get the assessment linked to this course content
    const assessment = await prisma.assessments.findFirst({
      where: { content_id: BigInt(lessonId) },
      include: {
        AssessmentQuestions: {
          include: {
            AssessmentOptions: {
              select: {
                id: true,
                option_text: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    console.log(
      "Found assessment:",
      assessment ? `Yes (ID: ${assessment.id})` : "No",
    );

    if (!assessment) {
      console.log("ERROR: No assessment record found for this lesson");
      return res.status(404).json({
        message: "Assessment not found for this lesson",
        details: "No assessment data exists in the database for this lesson",
        lessonId: lessonId,
        lessonTitle: lesson.title,
        lessonType: lesson.type,
      });
    }

    console.log(
      "Assessment has",
      assessment.AssessmentQuestions?.length || 0,
      "questions",
    );

    // Get user's previous attempt (if any)
    const previousAttempt = await prisma.quizAttempts.findFirst({
      where: {
        user_id: BigInt(userId),
        assessment_id: BigInt(assessment.id),
      },
      orderBy: { started_at: "desc" },
      include: {
        UserAnswers: true,
      },
    });

    console.log(
      "Previous attempt:",
      previousAttempt ? `Yes (Score: ${previousAttempt.score}%)` : "No",
    );

    const questions = assessment.AssessmentQuestions.map((question) => ({
      id: Number(question.id),
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.AssessmentOptions.map((option) => ({
        id: Number(option.id),
        option_text: option.option_text,
      })),
      previous_answer: previousAttempt?.UserAnswers.find(
        (answer) => Number(answer.question_id) === Number(question.id),
      ),
    }));

    const assessmentData = {
      id: Number(assessment.id),
      title: assessment.title || lesson.title || "Quiz",
      instructions:
        assessment.instructions || "Complete the quiz to test your knowledge.",
      total_questions: assessment.AssessmentQuestions.length,
      questions: questions,
      previous_attempt: previousAttempt
        ? {
            id: Number(previousAttempt.id),
            score: previousAttempt.score,
            completed_at: previousAttempt.completed_at,
          }
        : null,
    };

    console.log("=== DEBUG: Sending response ===");
    console.log("Total questions:", assessmentData.total_questions);

    res.json(assessmentData);
  } catch (error) {
    console.error("ERROR in getAssessmentData:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

// =======================
// SUBMIT QUIZ ATTEMPT
// =======================
const submitQuizAttempt = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const lessonId = Number(req.params.lessonId);
    const courseId = Number(req.params.courseId);
    const { answers, time_taken } = req.body;

    // Get assessment data with correct answers
    const assessment = await prisma.assessments.findFirst({
      where: { content_id: BigInt(lessonId) },
      include: {
        AssessmentQuestions: {
          include: {
            AssessmentOptions: {
              where: { is_correct: true },
            },
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = assessment.AssessmentQuestions.length;

    const userAnswers = [];

    for (const answer of answers) {
      const question = assessment.AssessmentQuestions.find(
        (q) => Number(q.id) === Number(answer.question_id),
      );

      let is_correct = false;

      if (question) {
        if (question.question_type === "text") {
          // For text questions, you might want to implement different logic
          // For now, we'll consider all text answers as correct if they exist
          is_correct = !!answer.answer_text;
        } else if (question.question_type === "truefalse") {
          const correctOption = question.AssessmentOptions[0];
          is_correct =
            Number(answer.selected_option_id) === Number(correctOption.id);
        } else if (question.question_type === "mcq") {
          const correctOptions = question.AssessmentOptions;
          is_correct = correctOptions.some(
            (option) => Number(option.id) === Number(answer.selected_option_id),
          );
        }

        if (is_correct) correctCount++;
      }

      userAnswers.push({
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id,
        answer_text: answer.answer_text,
        is_correct,
      });
    }

    const score = Math.round((correctCount / totalQuestions) * 100);

    // Create quiz attempt
    const quizAttempt = await prisma.quizAttempts.create({
      data: {
        user_id: BigInt(userId),
        assessment_id: BigInt(assessment.id),
        score: score,
        started_at: new Date(Date.now() - time_taken * 1000),
        completed_at: new Date(),
      },
    });

    // Save user answers
    for (const answer of userAnswers) {
      await prisma.userAnswers.create({
        data: {
          attempt_id: BigInt(quizAttempt.id),
          question_id: BigInt(answer.question_id),
          selected_option_id: answer.selected_option_id
            ? BigInt(answer.selected_option_id)
            : null,
          answer_text: answer.answer_text,
        },
      });
    }

    // Mark lesson as completed if score meets requirements
    // Assuming passing score is 55% based on your requirements
    const passingScore = 55;
    if (score >= passingScore) {
      // Check if progress record exists
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(lessonId),
        },
      });

      if (existingProgress) {
        await prisma.lessonProgress.update({
          where: { id: existingProgress.id },
          data: {
            is_completed: true,
            completed_at: new Date(),
          },
        });
      } else {
        await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(lessonId),
            is_completed: true,
            completed_at: new Date(),
          },
        });
      }
    }

    const certResult = await checkAndIssueCertificate(userId, courseId);

    res.json({
      attempt_id: Number(quizAttempt.id),
      score: score,
      correct_count: correctCount,
      total_questions: totalQuestions,
      passed: score >= passingScore,
      passing_score: passingScore,
      user_answers: userAnswers,
      certificateIssued: certResult.issued,
      certificateReason: certResult.reason
    });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET QUIZ RESULTS (UPDATED)
// =======================
const getQuizResults = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const userId = Number(req.user.userId);

    const attempt = await prisma.quizAttempts.findUnique({
      where: { id: BigInt(attemptId) },
      include: {
        Assessments: {
          include: {
            AssessmentQuestions: {
              include: {
                AssessmentOptions: true,
              },
            },
            CourseContent: {
              include: {
                Courses: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        UserAnswers: {
          include: {
            AssessmentQuestions: {
              include: {
                AssessmentOptions: true,
              },
            },
            AssessmentOptions: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // Verify user owns this attempt
    if (Number(attempt.user_id) !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get correct answers for comparison
    const questionsWithAnswers = attempt.Assessments.AssessmentQuestions.map(
      (question) => {
        const userAnswer = attempt.UserAnswers.find(
          (answer) => Number(answer.question_id) === Number(question.id),
        );

        const correctOptions = question.AssessmentOptions.filter(
          (option) => option.is_correct,
        );

        return {
          id: Number(question.id),
          question_text: question.question_text,
          question_type: question.question_type,
          correct_options: correctOptions.map((option) => ({
            id: Number(option.id),
            option_text: option.option_text,
          })),
          user_answer: userAnswer
            ? {
                selected_option_id: userAnswer.selected_option_id
                  ? Number(userAnswer.selected_option_id)
                  : null,
                selected_option_text:
                  userAnswer.AssessmentOptions?.option_text || null,
                answer_text: userAnswer.answer_text,
                is_correct: userAnswer.AssessmentOptions?.is_correct || false,
              }
            : null,
        };
      },
    );

    const result = {
      attempt_id: Number(attempt.id),
      assessment_id: Number(attempt.Assessments.id),
      score: attempt.score,
      correct_count: Math.round(
        (attempt.score / 100) * attempt.Assessments.AssessmentQuestions.length,
      ),
      total_questions: attempt.Assessments.AssessmentQuestions.length,
      passed: attempt.score >= 55, // Assuming 55% passing score
      passing_score: 55,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      time_taken:
        attempt.completed_at && attempt.started_at
          ? Math.round(
              (new Date(attempt.completed_at) - new Date(attempt.started_at)) /
                1000,
            )
          : null,
      quiz_title:
        attempt.Assessments.title || attempt.Assessments.CourseContent.title,
      course_title: attempt.Assessments.CourseContent.Courses.title,
      course_id: Number(attempt.Assessments.CourseContent.Courses.id),
      questions: questionsWithAnswers,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET QUIZ INFO
// =======================
const getQuizInfo = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const userId = Number(req.user.userId);

    const attempt = await prisma.quizAttempts.findUnique({
      where: { id: BigInt(attemptId) },
      include: {
        Assessments: {
          include: {
            CourseContent: {
              include: {
                Courses: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // Verify user owns this attempt
    if (Number(attempt.user_id) !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const quizInfo = {
      quiz_title:
        attempt.Assessments.title || attempt.Assessments.CourseContent.title,
      course_title: attempt.Assessments.CourseContent.Courses.title,
      course_id: Number(attempt.Assessments.CourseContent.Courses.id),
      score: attempt.score,
      passed: attempt.score >= 55,
    };

    res.json(quizInfo);
  } catch (error) {
    console.error("Error fetching quiz info:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCoursePlayerData,
  getCourseLessons,
  getLessonById,
  markLessonComplete,
  submitCourseReview,
  getNextLesson,
  markLessonIncomplete,
  getCompletedLessonIds,
  initializeCourseProgress,
  getFirstIncompleteLesson,
  getAssessmentData,
  submitQuizAttempt,
  getQuizResults,
  getQuizInfo,
};
