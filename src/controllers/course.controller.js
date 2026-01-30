// Import the Prisma instance
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