const prisma = require("../lib/prisma");

// =======================
// GET STUDENT PROGRESS SUMMARY
// =======================
const getStudentProgressSummary = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = Number(req.params.studentId);
    const instructorId = Number(req.user.userId);

    // Verify instructor owns this course
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      select: { instructor_id: true, title: true }
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (Number(course.instructor_id) !== instructorId) {
      return res.status(403).json({ message: "You don't have permission to view this student's progress" });
    }

    // Get student info
    const student = await prisma.users.findUnique({
      where: { id: BigInt(studentId) },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        photo_url: true,
        created_at: true
      }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student is enrolled
    const enrollment = await prisma.enrollments.findFirst({
      where: {
        user_id: BigInt(studentId),
        course_id: BigInt(courseId)
      }
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Student is not enrolled in this course" });
    }

    // Get all non-section content
    const allContent = await prisma.courseContent.findMany({
      where: {
        course_id: BigInt(courseId),
        type: { not: "section" }
      },
      orderBy: { order_index: "asc" }
    });

    // Get student's progress
    const progress = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(studentId),
        content_id: { in: allContent.map(c => BigInt(c.id)) }
      }
    });

    // Create progress map
    const progressMap = {};
    progress.forEach(p => {
      progressMap[Number(p.content_id)] = {
        is_completed: p.is_completed,
        completed_at: p.completed_at,
        time_spent: p.time_spent || 0
      };
    });

    // Calculate statistics
    const totalLessons = allContent.length;
    const completedLessons = progress.filter(p => p.is_completed).length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Get enrollment date
    const enrollmentDate = enrollment.enrolled_at || enrollment.created_at;

    // Calculate days since enrollment
    const daysSinceEnrollment = Math.ceil((new Date() - new Date(enrollmentDate)) / (1000 * 60 * 60 * 24));

    // Calculate average progress per day
    const avgProgressPerDay = daysSinceEnrollment > 0 
      ? (completionPercentage / daysSinceEnrollment).toFixed(1) 
      : 0;

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempts.findMany({
      where: {
        user_id: BigInt(studentId),
        Assessments: {
          CourseContent: {
            course_id: BigInt(courseId)
          }
        }
      },
      include: {
        Assessments: {
          include: {
            CourseContent: {
              select: {
                title: true,
                id: true
              }
            }
          }
        }
      },
      orderBy: { completed_at: "desc" }
    });

    // Calculate quiz statistics
    const totalQuizzes = quizAttempts.length;
    const passedQuizzes = quizAttempts.filter(q => q.score >= 55).length;
    const averageQuizScore = totalQuizzes > 0 
      ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / totalQuizzes) 
      : 0;

    // Get recent activity
    const recentActivity = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(studentId),
        content_id: { in: allContent.map(c => BigInt(c.id)) },
        is_completed: true,
        completed_at: { not: null }
      },
      include: {
        CourseContent: {
          select: {
            title: true,
            type: true,
            id: true
          }
        }
      },
      orderBy: { completed_at: "desc" },
      take: 10
    });

    res.json({
      student: {
        id: Number(student.id),
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        photo: student.photo_url,
        joined_date: student.created_at
      },
      course: {
        id: courseId,
        title: course.title
      },
      enrollment: {
        date: enrollmentDate,
        days_enrolled: daysSinceEnrollment
      },
      progress: {
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        completion_percentage: completionPercentage,
        avg_progress_per_day: avgProgressPerDay
      },
      quizzes: {
        total_attempts: totalQuizzes,
        passed_quizzes: passedQuizzes,
        average_score: averageQuizScore,
        pass_rate: totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0
      },
      recent_activity: recentActivity.map(activity => ({
        lesson_id: Number(activity.CourseContent.id),
        lesson_title: activity.CourseContent.title,
        lesson_type: activity.CourseContent.type,
        completed_at: activity.completed_at
      })),
      last_active: recentActivity.length > 0 ? recentActivity[0].completed_at : enrollmentDate
    });

  } catch (error) {
    console.error("Error fetching student progress summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET DETAILED LESSON PROGRESS
// =======================
const getDetailedLessonProgress = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = Number(req.params.studentId);
    const instructorId = Number(req.user.userId);

    // Verify instructor owns this course
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      select: { instructor_id: true }
    });

    if (!course || Number(course.instructor_id) !== instructorId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get all course content organized by sections
    const allContent = await prisma.courseContent.findMany({
      where: { 
        course_id: BigInt(courseId) 
      },
      orderBy: { order_index: "asc" }
    });

    // Get student's progress
    const progress = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(studentId),
        content_id: { in: allContent.map(c => BigInt(c.id)) }
      }
    });

    // Create progress map
    const progressMap = {};
    progress.forEach(p => {
      progressMap[Number(p.content_id)] = {
        is_completed: p.is_completed,
        completed_at: p.completed_at,
        time_spent: p.time_spent || 0
      };
    });

    // Convert BigInt to Number
    const content = allContent.map(item => ({
      id: Number(item.id),
      parent_id: item.parent_id ? Number(item.parent_id) : null,
      title: item.title,
      type: item.type,
      duration_seconds: item.duration_seconds,
      order_index: item.order_index
    }));

    // Organize into sections
    const sections = content.filter(item => item.type === "section");
    const lessons = content.filter(item => item.type !== "section");

    const organized = [];

    // Standalone lessons
    const standaloneLessons = lessons.filter(lesson => !lesson.parent_id);
    if (standaloneLessons.length > 0) {
      organized.push({
        id: "standalone",
        title: "Course Content",
        type: "standalone-section",
        children: standaloneLessons.map(lesson => ({
          ...lesson,
          progress: progressMap[lesson.id] || { is_completed: false, completed_at: null, time_spent: 0 }
        }))
      });
    }

    // Sections with their children
    sections.forEach(section => {
      const sectionLessons = lessons.filter(lesson => lesson.parent_id === section.id);
      organized.push({
        ...section,
        children: sectionLessons.map(lesson => ({
          ...lesson,
          progress: progressMap[lesson.id] || { is_completed: false, completed_at: null, time_spent: 0 }
        }))
      });
    });

    res.json(organized);

  } catch (error) {
    console.error("Error fetching detailed lesson progress:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET QUIZ ATTEMPT HISTORY (FIXED)
// =======================
const getStudentQuizHistory = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = Number(req.params.studentId);
    const instructorId = Number(req.user.userId);

    // Verify instructor owns this course
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      select: { instructor_id: true }
    });

    if (!course || Number(course.instructor_id) !== instructorId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get all quiz attempts for this student in this course
    const quizAttempts = await prisma.quizAttempts.findMany({
      where: {
        user_id: BigInt(studentId),
        Assessments: {
          CourseContent: {
            course_id: BigInt(courseId)
          }
        }
      },
      include: {
        Assessments: {
          include: {
            CourseContent: {
              select: {
                title: true,
                id: true
              }
            },
            AssessmentQuestions: {
              select: {
                id: true
              }
            }
          }
        },
        UserAnswers: {
          include: {
            AssessmentOptions: {
              select: {
                is_correct: true
              }
            }
          }
        }
      },
      orderBy: { completed_at: "desc" }
    });

    const formattedAttempts = quizAttempts.map(attempt => {
      const totalQuestions = attempt.Assessments.AssessmentQuestions.length;
      
      // Remove answeredQuestions variable and use attempt.UserAnswers.length
      const answeredQuestionsCount = attempt.UserAnswers.length;
      
      // Calculate correct answers properly
      const correctAnswers = attempt.UserAnswers.filter(answer => 
        answer.AssessmentOptions?.is_correct === true
      ).length;
      
      return {
        attempt_id: Number(attempt.id),
        quiz_title: attempt.Assessments.title || attempt.Assessments.CourseContent.title,
        lesson_id: Number(attempt.Assessments.CourseContent.id),
        score: attempt.score || 0,
        passed: (attempt.score || 0) >= 55,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        time_taken: attempt.completed_at && attempt.started_at 
          ? Math.round((new Date(attempt.completed_at) - new Date(attempt.started_at)) / 1000)
          : null,
        total_questions: totalQuestions,
        answered_questions: answeredQuestionsCount,
        correct_answers: correctAnswers
      };
    });

    res.json(formattedAttempts);

  } catch (error) {
    console.error("Error fetching student quiz history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET STUDENT COURSE ACTIVITY
// =======================
const getStudentActivity = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const studentId = Number(req.params.studentId);
    const instructorId = Number(req.user.userId);
    const { days = 30 } = req.query;

    // Verify instructor owns this course
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      select: { instructor_id: true }
    });

    if (!course || Number(course.instructor_id) !== instructorId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - parseInt(days));

    // Get lesson completions in date range
    const lessonCompletions = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(studentId),
        CourseContent: {
          course_id: BigInt(courseId)
        },
        is_completed: true,
        completed_at: {
          gte: sinceDate
        }
      },
      include: {
        CourseContent: {
          select: {
            title: true,
            type: true
          }
        }
      },
      orderBy: { completed_at: "desc" }
    });

    // Get quiz attempts in date range
    const quizAttempts = await prisma.quizAttempts.findMany({
      where: {
        user_id: BigInt(studentId),
        Assessments: {
          CourseContent: {
            course_id: BigInt(courseId)
          }
        },
        completed_at: {
          gte: sinceDate
        }
      },
      include: {
        Assessments: {
          include: {
            CourseContent: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { completed_at: "desc" }
    });

    // Combine and format activities
    const activities = [];

    lessonCompletions.forEach(completion => {
      activities.push({
        id: `lesson-${completion.id}`,
        type: 'lesson_completion',
        title: `Completed: ${completion.CourseContent.title}`,
        lesson_type: completion.CourseContent.type,
        timestamp: completion.completed_at,
        details: {
          content_id: Number(completion.content_id)
        }
      });
    });

    quizAttempts.forEach(attempt => {
      activities.push({
        id: `quiz-${attempt.id}`,
        type: 'quiz_attempt',
        title: `Quiz: ${attempt.Assessments.CourseContent.title}`,
        timestamp: attempt.completed_at || attempt.started_at,
        score: attempt.score,
        passed: attempt.score >= 55,
        details: {
          attempt_id: Number(attempt.id),
          score: attempt.score
        }
      });
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Group activities by date
    const groupedByDate = {};
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(activity);
    });

    res.json({
      period_days: parseInt(days),
      total_activities: activities.length,
      grouped_activities: groupedByDate
    });

  } catch (error) {
    console.error("Error fetching student activity:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET ENROLLED STUDENTS WITH PROGRESS (FIXED)
// =======================
const getCourseStudents = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const instructorId = Number(req.user.userId);

    // Verify instructor owns this course
    const course = await prisma.courses.findUnique({
      where: { id: BigInt(courseId) },
      select: { instructor_id: true, title: true }
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (Number(course.instructor_id) !== instructorId) {
      return res.status(403).json({ message: "You don't own this course" });
    }

    // Get all enrollments for this course
    const enrollments = await prisma.enrollments.findMany({
      where: { 
        course_id: BigInt(courseId)
      },
      include: {
        Users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            photo_url: true,
            created_at: true
          }
        }
      }
    });

    // Get total lessons count for this course
    const totalLessons = await prisma.courseContent.count({
      where: {
        course_id: BigInt(courseId),
        type: { not: "section" }
      }
    });

    // For each student, get their progress
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userId = Number(enrollment.Users.id);
        
        // Get completed lessons count
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            user_id: BigInt(userId),
            is_completed: true,
            CourseContent: {
              course_id: BigInt(courseId),
              type: { not: "section" }
            }
          }
        });

        const lastProgress = await prisma.lessonProgress.findFirst({
          where: {
            user_id: BigInt(userId),
            CourseContent: {
              course_id: BigInt(courseId)
            }
          },
          orderBy: {
            completed_at: "desc"  
          }
        });

        // Get quiz average
        const quizAttempts = await prisma.quizAttempts.findMany({
          where: {
            user_id: BigInt(userId),
            Assessments: {
              CourseContent: {
                course_id: BigInt(courseId)
              }
            }
          }
        });

        const avgQuizScore = quizAttempts.length > 0
          ? Math.round(quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length)
          : 0;

        const progress = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;

        return {
          id: userId,
          name: `${enrollment.Users.first_name || ''} ${enrollment.Users.last_name || ''}`.trim() || 'Student',
          email: enrollment.Users.email || 'No email',
          photo: enrollment.Users.photo_url,
          enrolled_at: enrollment.created_at || enrollment.enrolled_at,
          progress: progress,
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          quiz_average: avgQuizScore,
          last_active: lastProgress?.completed_at || enrollment.created_at || enrollment.enrolled_at
        };
      })
    );

    // Sort by enrollment date (newest first)
    studentsWithProgress.sort((a, b) => 
      new Date(b.enrolled_at) - new Date(a.enrolled_at)
    );

    res.json(studentsWithProgress);

  } catch (error) {
    console.error("Error fetching course students:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET QUIZ ATTEMPT DETAILS FOR INSTRUCTOR
// =======================
const getInstructorQuizReview = async (req, res) => {
  try {
    const attemptId = Number(req.params.attemptId);
    const instructorId = Number(req.user.userId);

    // Get quiz attempt with all related data
    const attempt = await prisma.quizAttempts.findUnique({
      where: { id: BigInt(attemptId) },
      include: {
        Users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            photo_url: true
          }
        },
        Assessments: {
          include: {
            CourseContent: {
              include: {
                Courses: {
                  select: {
                    id: true,
                    title: true,
                    instructor_id: true
                  }
                }
              }
            },
            AssessmentQuestions: {
              include: {
                AssessmentOptions: true,
                UserAnswers: {
                  where: { attempt_id: BigInt(attemptId) },
                  include: {
                    AssessmentOptions: true
                  }
                }
              }
            }
          }
        },
        UserAnswers: {
          include: {
            AssessmentQuestions: true,
            AssessmentOptions: true
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // Verify instructor owns this course
    if (Number(attempt.Assessments.CourseContent.Courses.instructor_id) !== instructorId) {
      return res.status(403).json({ message: "You don't have permission to view this attempt" });
    }

    // Format questions with answers
    const questions = attempt.Assessments.AssessmentQuestions.map(question => {
      const userAnswer = attempt.UserAnswers.find(
        answer => Number(answer.question_id) === Number(question.id)
      );

      const correctOptions = question.AssessmentOptions.filter(opt => opt.is_correct);
      
      let isCorrect = false;
      if (userAnswer) {
        if (question.question_type === 'text') {
          isCorrect = !!userAnswer.answer_text; // You might want to implement better text matching
        } else {
          isCorrect = correctOptions.some(opt => 
            Number(opt.id) === Number(userAnswer.selected_option_id)
          );
        }
      }

      return {
        id: Number(question.id),
        question_text: question.question_text,
        question_type: question.question_type,
        is_correct: isCorrect,
        user_answer: userAnswer ? {
          selected_option_id: userAnswer.selected_option_id ? Number(userAnswer.selected_option_id) : null,
          selected_option_text: userAnswer.AssessmentOptions?.option_text || null,
          answer_text: userAnswer.answer_text
        } : null,
        correct_options: correctOptions.map(opt => ({
          id: Number(opt.id),
          option_text: opt.option_text
        })),
        all_options: question.AssessmentOptions.map(opt => ({
          id: Number(opt.id),
          option_text: opt.option_text,
          is_correct: opt.is_correct
        }))
      };
    });

    // Calculate correct answers count
    const correctAnswers = questions.filter(q => q.is_correct).length;

    const response = {
      attempt_id: Number(attempt.id),
      quiz_title: attempt.Assessments.title || attempt.Assessments.CourseContent.title,
      score: attempt.score || 0,
      passed: (attempt.score || 0) >= 55,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      time_taken: attempt.completed_at && attempt.started_at 
        ? Math.round((new Date(attempt.completed_at) - new Date(attempt.started_at)) / 1000)
        : null,
      total_questions: attempt.Assessments.AssessmentQuestions.length,
      correct_answers: correctAnswers,
      student: {
        id: Number(attempt.Users.id),
        name: `${attempt.Users.first_name || ''} ${attempt.Users.last_name || ''}`.trim() || 'Student',
        email: attempt.Users.email,
        photo: attempt.Users.photo_url
      },
      course: {
        id: Number(attempt.Assessments.CourseContent.Courses.id),
        title: attempt.Assessments.CourseContent.Courses.title
      },
      questions: questions
    };

    res.json(response);

  } catch (error) {
    console.error("Error fetching quiz review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getStudentProgressSummary,
  getDetailedLessonProgress,
  getStudentQuizHistory,
  getStudentActivity,
  getCourseStudents,
  getInstructorQuizReview
};