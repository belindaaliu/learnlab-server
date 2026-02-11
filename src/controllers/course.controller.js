const prisma = require('../lib/prisma');


BigInt.prototype.toJSON = function () { return this.toString() }

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

    // Format Response
    const formattedCourses = courses.map(course => ({
      ...course, // Copy all fields (Ids represent automatically as string now)
      price: parseFloat(course.price), // ✅ Fix Decimal to Float
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
    
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid Course ID" });
    }
    
    const course = await prisma.courses.findUnique({
      where: { id: courseId }, 
      include: {
        Categories: true,
        Users: {
          select: { 
            id: true,
            first_name: true, 
            last_name: true, 
            photo_url: true, 
            headline: true, 
            biography: true 
          }
        },
        CourseContent: {
          orderBy: { order_index: 'asc' }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Default image if missing
    if (!course.thumbnail_url) {
        course.thumbnail_url = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
    }

    // ✅ Fix Decimal Price
    const responseData = {
        ...course,
        price: parseFloat(course.price)
    };

    res.json(responseData);

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
        instructor_id: BigInt(instructorId)
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        Categories: true,
      }
    });

    // ✅ Fix Decimal Price
    const serializedCourses = courses.map(course => ({
        ...course,
        price: parseFloat(course.price)
    }));

    res.json(serializedCourses);
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
    // ✅ Added 'language' to destructuring
    const { title, description, price, category_id, level, thumbnail_url, language } = req.body;
    
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
        language: language || "English",
        views: 0
      }
    });

    // Return with decimal fix
    res.status(201).json({
        ...newCourse,
        price: parseFloat(newCourse.price)
    });

  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Server Error creating course" });
  }
};

// ==========================================
// 5. SOFT DELETE (Move to Archive)
// ==========================================
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    await prisma.courses.update({
      where: { id: courseId },
      data: { 
        is_deleted: true,
        deleted_at: new Date() // ثبت زمان حذف
      } 
    });

    res.json({ message: "Course moved to archive" });
  } catch (error) {
    console.error("Error archiving course:", error);
    res.status(500).json({ message: "Could not archive course" });
  }
};

// ==========================================
// 6. UPDATE COURSE
// ==========================================
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      price, 
      category_id, 
      thumbnail_url,

      requirements, 
      target_audience, 
      long_description, 
      language 
    } = req.body;

    const instructorId = req.user.userId;

    // 1. Check Ownership
    const course = await prisma.courses.findUnique({ where: { id: parseInt(id) } });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Access denied. You are not the instructor of this course." });
    }

    // 2. Update Course
    const updatedCourse = await prisma.courses.update({
      where: { id: parseInt(id) },
      data: {
        title: title || undefined,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        category_id: category_id ? parseInt(category_id) : undefined,
        thumbnail_url: thumbnail_url || undefined,
        
        requirements: requirements ? (Array.isArray(requirements) ? JSON.stringify(requirements) : requirements) : undefined,
        target_audience: target_audience ? (Array.isArray(target_audience) ? JSON.stringify(target_audience) : target_audience) : undefined,
        long_description: long_description || undefined,
        language: language || undefined
      }
    });

    res.json({
        ...updatedCourse,
        price: parseFloat(updatedCourse.price)
    });

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

    // 3. Using Transaction for clean update
    await prisma.$transaction(async (tx) => {
      await tx.assessmentQuestions.deleteMany({
        where: { assessment_id: assessment.id }
      });

      for (const q of questions) {
        const newQuestion = await tx.assessmentQuestions.create({
          data: {
            assessment_id: assessment.id,
            question_text: q.question_text,
            question_type: q.question_type 
          }
        });

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

// ==========================================
// 15. GET INSTRUCTOR DASHBOARD STATS (FIXED)
// ==========================================
exports.getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user.userId;

    // 1. Receive all active courses from the teacher
    const courses = await prisma.courses.findMany({
      where: { 
        instructor_id: BigInt(instructorId),
        is_deleted: false 
      },
      select: {
        id: true,
        price: true,
        views: true,
        _count: { select: { Enrollments: true } }
      }
    });

    // Calculating overall statistics
    let totalCourses = courses.length;
    let totalStudents = 0;
    let totalRevenue = 0;
    let totalViews = 0;

    const courseIds = courses.map(c => c.id);

    courses.forEach(course => {
      const studentCount = course._count.Enrollments;
      const price = parseFloat(course.price);
      totalStudents += studentCount;
      totalViews += course.views;
      totalRevenue += (studentCount * price);
    });

    // ---------------------------------------------------------
    // 2. Calculating Monthly Chart Data
    // ---------------------------------------------------------
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentEnrollments = await prisma.enrollments.findMany({
      where: {
        course_id: { in: courseIds },
        enrolled_at: { gte: sixMonthsAgo }
      },
      include: {
        Courses: { select: { price: true } }
      }
    });

    // The basic structure of the months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' }); 
      months.push({ name: monthName, revenue: 0, students: 0, rawDate: d.getMonth() });
    }

    // Filling in the data
    recentEnrollments.forEach(enrollment => {

      if (!enrollment.enrolled_at) return;


      const date = new Date(enrollment.enrolled_at); 
      const monthIndex = date.getMonth();
      
      const monthEntry = months.find(m => m.rawDate === monthIndex);
      
      if (monthEntry) {
        monthEntry.students += 1;
        monthEntry.revenue += parseFloat(enrollment.Courses.price);
      }
    });

    const chartData = months.map(({ rawDate, ...rest }) => rest);

    res.json({
      totalCourses,
      totalStudents,
      totalRevenue,
      totalViews,
      chartData
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Server Error fetching stats" });
  }
};

// ==========================================
// 16. GET ARCHIVED COURSES
// ==========================================
exports.getArchivedCourses = async (req, res) => {
  try {
    const instructorId = req.user.userId;
    const courses = await prisma.courses.findMany({
      where: {
        instructor_id: BigInt(instructorId),
        is_deleted: true
      },
      orderBy: { deleted_at: 'desc' },
      include: { Categories: true }
    });

    const formatted = courses.map(c => {

      const deletedDate = new Date(c.deleted_at);
        const expireDate = new Date(deletedDate.setDate(deletedDate.getDate() + 30));
        const daysLeft = Math.ceil((expireDate - new Date()) / (1000 * 60 * 60 * 24));

        return {
            ...c,
            price: parseFloat(c.price),
            daysLeft: daysLeft > 0 ? daysLeft : 0
        };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching archived courses:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ==========================================
// 17. RESTORE COURSE (Recovery)
// ==========================================
exports.restoreCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.courses.update({
      where: { id: parseInt(id) },
      data: { 
        is_deleted: false,
        deleted_at: null 
      }
    });
    res.json({ message: "Course restored successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error restoring course" });
  }
};

// ==========================================
// 18. PERMANENT DELETE (Hard Delete)
// ==========================================
exports.permanentDeleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    // Actual removal of all dependencies (transaction)
    await prisma.$transaction([
      prisma.courseContent.deleteMany({ where: { course_id: courseId } }),
      prisma.enrollments.deleteMany({ where: { course_id: courseId } }),
      prisma.shoppingCart.deleteMany({ where: { course_id: courseId } }),
      prisma.userSavedCourses.deleteMany({ where: { course_id: courseId } }),
      prisma.courseTags.deleteMany({ where: { course_id: courseId } }),
      prisma.certificates.deleteMany({ where: { course_id: courseId } }),
      prisma.courses.delete({ where: { id: courseId } }) // Final elimination
    ]);

    res.json({ message: "Course permanently deleted" });
  } catch (error) {
    console.error("Error deleting course permanently:", error);
    res.status(500).json({ message: "Could not delete course" });
  }
<<<<<<< Updated upstream
};
=======
};


// ==========================================
// 19. REORDER LESSONS
// ==========================================
exports.reorderLessons = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { lessonIds } = req.body;
    const instructorId = req.user.userId;

    if (!lessonIds || !Array.isArray(lessonIds)) {
      return res.status(400).json({ message: "Invalid data: lessonIds array is required" });
    }

    const section = await prisma.courseContent.findFirst({
      where: {
        id: parseInt(sectionId),
        type: 'section',
        Courses: {
          instructor_id: BigInt(instructorId)
        }
      }
    });

    if (!section) {
      return res.status(403).json({ message: "Access denied or section not found." });
    }

    await prisma.$transaction(
      lessonIds.map((id, index) =>
        prisma.courseContent.update({
          where: { id: parseInt(id) },
          data: { 
            order_index: index, 
            parent_id: parseInt(sectionId)
          }
        })
      )
    );

    res.json({ success: true, message: "Lessons reordered successfully" });

  } catch (error) {
    console.error("Error reordering lessons:", error);
    res.status(500).json({ message: "Server Error reordering lessons", error: error.message });
  }
};

// ==========================================
// 20. FIX COURSE ORDER INDEX
// ==========================================
exports.fixCourseOrderIndex = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.userId;

    const course = await prisma.courses.findUnique({ 
      where: { id: parseInt(id) } 
    });

    if (!course || course.instructor_id.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Access denied." });
    }

    const result = await recalculateOrderIndex(parseInt(id));
    
    res.json({
      success: true,
      message: `Order index fixed for course ${id}`,
      ...result
    });

  } catch (error) {
    console.error("Error fixing order index:", error);
    res.status(500).json({ message: "Server Error fixing order index" });
  }
};
>>>>>>> Stashed changes
