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
    
    console.log("🔍 Request for Course ID:", id); 

    const course = await prisma.courses.findUnique({
      where: { id: id }, 
      include: {
        Categories: true,
        Users: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      }
    });

    if (!course) {
      console.log("❌ Course not found in DB.");
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.thumbnail_url) {
        course.thumbnail_url = "https://images.unsplash.com/photo-1587620962725-abab7fe55159?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";
    }

    console.log("✅ Course found:", course.title);
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