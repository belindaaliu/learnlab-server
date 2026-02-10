const prisma = require("../lib/prisma");

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
        CourseContent: true
      }
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Get all course content (lessons)
    const allContent = await prisma.courseContent.findMany({
      where: { course_id: BigInt(courseId) }
    });

    // Initialize progress records for each content item
    // Only for non-section content (videos, notes, assessments)
    const lessons = allContent.filter(content => content.type !== "section");
    
    for (const lesson of lessons) {
      // Check if progress record exists
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(lesson.id)
        }
      });

      // If no progress record exists, create one (default: not completed)
      if (!existingProgress) {
        await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(lesson.id),
            is_completed: false,
            completed_at: null
          }
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
          type: { not: "section" } // Only count non-section content
        }
      }
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
        photo: course.Users.photo_url
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
      completed_lessons: completedLessons
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
        course_id: BigInt(courseId) 
      },
      orderBy: { order_index: "asc" }
    });

    // Convert BigInt to Number for frontend
    const content = allContent.map(item => ({
      id: Number(item.id),
      parent_id: item.parent_id ? Number(item.parent_id) : null,
      title: item.title,
      type: item.type,
      video_url: item.video_url,
      note_content: item.note_content,
      duration_seconds: item.duration_seconds,
      order_index: item.order_index,
      is_preview: item.is_preview
    }));

    // Organize into sections and lessons
    const sections = content.filter(item => item.type === "section");
    const lessons = content.filter(item => item.type !== "section");

    // Create organized structure
    const organized = [];

    // Add standalone lessons first (no parent)
    const standaloneLessons = lessons.filter(lesson => !lesson.parent_id);
    if (standaloneLessons.length > 0) {
      organized.push({
        id: "standalone",
        title: "Course Content",
        type: "standalone-section",
        children: standaloneLessons
      });
    }

    // Add sections with their children
    sections.forEach(section => {
      const sectionLessons = lessons.filter(lesson => lesson.parent_id === section.id);
      organized.push({
        ...section,
        children: sectionLessons
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
      where: { id: lessonId }
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      video_url: lesson.video_url,
      time: lesson.duration,
      note_content: lesson.note_content
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

    // Check if progress record already exists
    const existingProgress = await prisma.lessonProgress.findFirst({
      where: {
        user_id: BigInt(userId),
        content_id: BigInt(lessonId)
      }
    });

    if (existingProgress) {
      // Update existing record
      await prisma.lessonProgress.update({
        where: {
          id: existingProgress.id
        },
        data: {
          is_completed: true,
          completed_at: new Date()
        }
      });
    } else {
      // Create new record
      await prisma.lessonProgress.create({
        data: {
          user_id: BigInt(userId),
          content_id: BigInt(lessonId),
          is_completed: true,
          completed_at: new Date()
        }
      });
    }

    res.json({ message: "Lesson marked complete" });
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
        content_id: BigInt(lessonId)
      }
    });

    if (existingProgress) {
      // Update the record to mark as incomplete
      await prisma.lessonProgress.update({
        where: {
          id: existingProgress.id
        },
        data: {
          is_completed: false,
          completed_at: null
        }
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
        review
      }
    });

    res.json(newReview);

  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// GET next uncompleted lesson
const getNextLesson = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const courseId = Number(req.params.courseId);

    // Get all video lessons ordered
    const lessons = await prisma.courseContent.findMany({
      where: { course_id: courseId },
      orderBy: { order_index: "asc" }
    });

    // Get completed lessons for this user
    const progress = await prisma.lessonProgress.findMany({
      where: { user_id: userId }
    });

    const completedIds = progress
      .filter(p => p.is_completed)
      .map(p => p.content_id);

    // Find first uncompleted lesson
    const nextLesson = lessons.find(l => !completedIds.includes(l.id));

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
        type: { not: "section" } // Only non-section content
      }
    });

    for (const content of allContent) {
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(content.id)
        }
      });

      if (!existingProgress) {
        await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(content.id),
            is_completed: false,
            completed_at: null
          }
        });
      }
    }

    // Now get completed lessons
    const completedProgress = await prisma.lessonProgress.findMany({
      where: {
        user_id: BigInt(userId),
        is_completed: true,
        CourseContent: { course_id: BigInt(courseId) }
      },
      select: {
        content_id: true
      }
    });

    const completedLessonIds = completedProgress.map(p => Number(p.content_id));
    
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
        type: { not: "section" }
      }
    });

    const initialized = [];
    
    for (const content of allContent) {
      // Check if progress record already exists
      const existingProgress = await prisma.lessonProgress.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(content.id)
        }
      });

      // If no progress record exists, create one
      if (!existingProgress) {
        const progress = await prisma.lessonProgress.create({
          data: {
            user_id: BigInt(userId),
            content_id: BigInt(content.id),
            is_completed: false,
            completed_at: null
          }
        });
        initialized.push({
          content_id: Number(content.id),
          title: content.title,
          progress_id: Number(progress.id)
        });
      }
    }

    res.json({ 
      message: "Course progress initialized",
      initialized: initialized,
      totalLessons: allContent.length
    });

  } catch (error) {
    console.error("Error initializing course progress:", error);
    res.status(500).json({ message: "Server error" });
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
  initializeCourseProgress
};
