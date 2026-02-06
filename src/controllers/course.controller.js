const prisma = require('../lib/prisma');

// ==========================================
// 1. GET ALL COURSES (List & Search)
// ==========================================
exports.getAllCourses = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Initialize the filter object
    const where = {};

    // Search Logic
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Category Filter
    if (category && category !== 'All') {
      where.Categories = {
        name: category
      };
    }

    // Sorting Logic
    let orderBy = { created_at: 'desc' }; // Default: Newest first
    
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating_desc') orderBy = { views: 'desc' };

    // Execute Query
    const courses = await prisma.courses.findMany({
      where,
      orderBy,
      include: {
        Categories: true, 
        Users: {          
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Format Response (Fixing Image & Data)
    const formattedCourses = courses.map(course => ({
      id: course.id, 
      title: course.title,
      price: course.price,
      image: course.thumbnail_url || "https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80", 
      category: course.Categories ? course.Categories.name : 'Uncategorized',
      instructor: course.Users ? `${course.Users.first_name} ${course.Users.last_name}` : 'Unknown Instructor',
      rating: 4.8, 
      reviews: course.views, 
      level: course.level
    }));

    res.json(formattedCourses);

  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// 2. GET SINGLE COURSE (Details Page)
// ==========================================
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await prisma.courses.findUnique({
      where: { id: parseInt(id) }, 
      include: {
        Categories: true,
        Users: {
          select: { first_name: true, last_name: true }
        },

        CourseContent: {
          orderBy: { order_index: 'asc' }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.thumbnail_url) {
        course.thumbnail_url = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    }

    res.json(course);

  } catch (error) {
    console.error("🔥 Server Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ==========================================
// 3. GET INSTRUCTOR COURSES (Protected)
// ==========================================
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.userId;

    const courses = await prisma.courses.findMany({
      where: {
        instructor_id: instructorId
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        Categories: true,
        // We will add the number of students or statistics later.
      }
    });

    res.json(courses);
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// 4. CREATE NEW COURSE
// ==========================================
exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, category_id, level, thumbnail_url } = req.body;
    
    const instructor_id = req.user.userId;

    const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

    if (!title || !price || !category_id) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const newCourse = await prisma.courses.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category_id: parseInt(category_id),
        level: level || 'beginner',

        thumbnail_url: (thumbnail_url && thumbnail_url.trim() !== "") ? thumbnail_url : DEFAULT_IMAGE,

        instructor_id: instructor_id,
        views: 0
      }
    });

    res.status(201).json(newCourse);

  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Server Error creating course" });
  }
};

// ==========================================
// 5. DELETE COURSE
// ==========================================
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    console.log(`🗑️ Attempting to delete course with ID: ${courseId}`);

    await prisma.$transaction([

      prisma.courseContent.deleteMany({
        where: { course_id: courseId }
      }),

      prisma.enrollments.deleteMany({
        where: { course_id: courseId }
      }),

      prisma.shoppingCart.deleteMany({
        where: { course_id: courseId }
      }),

      prisma.userSavedCourses.deleteMany({
        where: { course_id: courseId }
      }),

      prisma.courseTags.deleteMany({
        where: { course_id: courseId }
      }),

      prisma.certificates.deleteMany({
        where: { course_id: courseId }
      }),

      prisma.courses.delete({
        where: { id: courseId }
      })
    ]);

    console.log("✅ Course deleted successfully.");
    res.json({ message: "Course deleted successfully" });

  } catch (error) {
    console.error("🔥 Error deleting course:", error);
    res.status(500).json({ 
      message: "Could not delete course.", 
      error: error.message 
    });
  }
};

// ==========================================
// 6. UPDATE COURSE
// ==========================================
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category_id, level, thumbnail_url } = req.body;
    const instructorId = req.user.userId;

    const course = await prisma.courses.findUnique({
      where: { id: parseInt(id) }
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this course." });
    }

    const updatedCourse = await prisma.courses.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        price: parseFloat(price),
        category_id: parseInt(category_id),
        level,
        thumbnail_url,
        updated_at: new Date()
      }
    });

    res.json({ message: "Course updated successfully", course: updatedCourse });

  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Server Error updating course" });
  }
};

// ==========================================
// 7. CREATE SECTION
// ==========================================
exports.createSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const instructorId = req.user.userId;

    const course = await prisma.courses.findUnique({
      where: { id: parseInt(id) }
    });

    if (!course || course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const lastContent = await prisma.courseContent.findFirst({
      where: { course_id: parseInt(id), parent_id: null },
      orderBy: { order_index: 'desc' }
    });

    const newOrderIndex = lastContent ? lastContent.order_index + 1 : 0;

    const newSection = await prisma.courseContent.create({
      data: {
        course_id: parseInt(id),
        title: title,
        type: 'section',
        order_index: newOrderIndex,
        parent_id: null
      }
    });

    res.status(201).json(newSection);

  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({ message: "Server Error creating section" });
  }
};

// ==========================================
// 8. UPDATE SECTION (Rename)
// ==========================================
exports.updateSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { title } = req.body;
    const instructorId = req.user.userId;

    const course = await prisma.courses.findUnique({ where: { id: parseInt(id) } });
    if (!course || course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedSection = await prisma.courseContent.update({
      where: { id: parseInt(sectionId) },
      data: { title }
    });

    res.json(updatedSection);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ message: "Server Error updating section" });
  }
};

// ==========================================
// 9. DELETE SECTION
// ==========================================
exports.deleteSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const instructorId = req.user.userId;

    const course = await prisma.courses.findUnique({ where: { id: parseInt(id) } });
    if (!course || course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.courseContent.delete({
      where: { id: parseInt(sectionId) }
    });

    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ message: "Server Error deleting section" });
  }
};

// ==========================================
// 10. CREATE LESSON
// ==========================================
exports.createLesson = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { title, type, is_preview } = req.body;
    const instructorId = req.user.userId;


    const course = await prisma.courses.findUnique({ where: { id: parseInt(id) } });
    if (!course || course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Access denied. You are not the instructor of this course." });
    }


    const section = await prisma.courseContent.findFirst({
      where: { 
        id: parseInt(sectionId), 
        course_id: parseInt(id),
        type: 'section' 
      }
    });
    if (!section) {
      return res.status(404).json({ message: "Section not found in this course." });
    }

    const lastLesson = await prisma.courseContent.findFirst({
      where: { parent_id: parseInt(sectionId) },
      orderBy: { order_index: 'desc' }
    });
    const newOrder = lastLesson ? lastLesson.order_index + 1 : 0;


    const newLesson = await prisma.courseContent.create({
      data: {
        course_id: parseInt(id),
        parent_id: parseInt(sectionId),
        title: title,
        type: type || 'video',
        is_preview: is_preview || false,
        order_index: newOrder
      }
    });

    res.status(201).json(newLesson);

  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ message: "Server Error creating lesson" });
  }
};

// ==========================================
// 11. UPDATE LESSON
// ==========================================
exports.updateLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { title, is_preview, video_url, note_content } = req.body;
    const instructorId = req.user.userId;


    const lesson = await prisma.courseContent.findUnique({
      where: { id: parseInt(lessonId) },
      include: { Courses: true } 
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }


    if (lesson.course_id.toString() !== id.toString()) {
      return res.status(400).json({ message: "Lesson does not belong to this course." });
    }


    if (lesson.Courses.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    const updatedLesson = await prisma.courseContent.update({
      where: { id: parseInt(lessonId) },
      data: {
        title: title !== undefined ? title : lesson.title,
        is_preview: is_preview !== undefined ? is_preview : lesson.is_preview,
        video_url: video_url !== undefined ? video_url : lesson.video_url,
        note_content: note_content !== undefined ? note_content : lesson.note_content
      }
    });

    res.json(updatedLesson);

  } catch (error) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ message: "Server Error updating lesson" });
  }
};

// ==========================================
// 12. DELETE LESSON
// ==========================================
exports.deleteLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const instructorId = req.user.userId;


    const lesson = await prisma.courseContent.findUnique({
      where: { id: parseInt(lessonId) },
      include: { Courses: true }
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found." });
    }

    if (lesson.course_id.toString() !== id.toString()) {
      return res.status(400).json({ message: "Lesson mismatch course." });
    }

    if (lesson.Courses.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    await prisma.courseContent.delete({
      where: { id: parseInt(lessonId) }
    });

    res.json({ message: "Lesson deleted successfully" });

  } catch (error) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({ message: "Server Error deleting lesson" });
  }
};

// ==========================================
// 13. UPDATE QUIZ (Manage Questions & Options)
// ==========================================
exports.updateLessonQuiz = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { questions } = req.body;
    const instructorId = req.user.userId;


    const course = await prisma.courses.findUnique({ where: { id: parseInt(id) } });
    if (!course || course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    let assessment = await prisma.assessments.findFirst({
      where: { content_id: parseInt(lessonId) }
    });

    if (!assessment) {
      assessment = await prisma.assessments.create({
        data: {
          content_id: parseInt(lessonId),
          title: "Lesson Quiz"
        }
      });
    }

    // 3. Using Transaction for clean update (deleting old ones and creating new ones)
    await prisma.$transaction(async (tx) => {
      // a) Delete all previous questions of this test (options will cascade automatically)
      await tx.assessmentQuestions.deleteMany({
        where: { assessment_id: assessment.id }
      });

      // b) Creating new questions and their options
      for (const q of questions) {
        const newQuestion = await tx.assessmentQuestions.create({
          data: {
            assessment_id: assessment.id,
            question_text: q.question_text,
            question_type: q.question_type 
          }
        });

        // C) Creating options for each question
        if (q.options && q.options.length > 0) {
          await tx.assessmentOptions.createMany({
            data: q.options.map(opt => ({
              question_id: newQuestion.id,
              option_text: opt.option_text,
              is_correct: opt.is_correct
            }))
          });
        }
      }
    });

    res.json({ message: "Quiz updated successfully" });

  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Server Error updating quiz" });
  }
};

// ==========================================
// 14. GET QUIZ (Load Questions)
// ==========================================
exports.getLessonQuiz = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const assessment = await prisma.assessments.findFirst({
      where: { content_id: parseInt(lessonId) },
      include: {
        AssessmentQuestions: {
          include: { AssessmentOptions: true }
        }
      }
    });

    if (!assessment) {
      return res.json({ questions: [] });
    }

    res.json({ questions: assessment.AssessmentQuestions });

  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ message: "Server Error" });
  }
};