const prisma = require("../lib/prisma");

// =======================
// GET COURSE PLAYER DATA
// =======================
const getCoursePlayerData = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);
    const userId = Number(req.user.userId); // important

    // Fetch course info
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      include: {
        Users: { select: { first_name: true, last_name: true } },
        Categories: true,
        CourseReviews: true,
      }
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // COUNT TOTAL VIDEO LESSONS
    const totalLessons = await prisma.courseContent.count({
      where: { course_id: courseId, type: "video" }
    });

    // COUNT COMPLETED LESSONS FOR THIS USER
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        user_id: userId,
        is_completed: true,
        CourseContent: { course_id: courseId }
      }
    });

    // Format response
    const formatted = {
      id: course.id,
      title: course.title,
      description: course.description,
      image: course.thumbnail_url,
      instructor: `${course.Users.first_name} ${course.Users.last_name}`,
      category: course.Categories?.name,
      rating: course.CourseReviews.length
        ? (course.CourseReviews.reduce((a, b) => a + b.rating, 0) / course.CourseReviews.length).toFixed(1)
        : 4.8,
      reviews: course.CourseReviews.length,
      students: course.views,

      // ⭐ ADD THESE TWO
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
const getCourseLessons = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    const lessons = await prisma.courseContent.findMany({
    where: { course_id: courseId },
    orderBy: { order_index: "asc" }
    });

    const formatted = lessons.map(l => ({
    id: l.id,
    title: l.title,
    time: l.duration_seconds,
    video_url: l.video_url,
    type: l.type
    }));


    res.json(formatted);

  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: "Server error" });
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
      video_url: lesson.video_url,
      time: lesson.duration
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
  const userId = Number(req.user.userId);
  const lessonId = Number(req.params.lessonId);

  await prisma.lessonProgress.upsert({
    where: {
      user_id_content_id: { user_id: userId, content_id: lessonId }
    },
    update: { is_completed: true, completed_at: new Date() },
    create: {
      user_id: userId,
      content_id: lessonId,
      is_completed: true,
      completed_at: new Date()
    }
  });

  res.json({ message: "Lesson marked complete" });
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
      where: { course_id: courseId, type: "video" },
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






module.exports = {
  getCoursePlayerData,
  getCourseLessons,
  getLessonById,
  markLessonComplete,
  submitCourseReview,
  getNextLesson
};
