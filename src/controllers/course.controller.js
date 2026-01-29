// Import the Prisma instance from the lib folder to prevent multiple connection instances
const prisma = require('../lib/prisma');

exports.getAllCourses = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Initialize the filter object
    const where = {};

    // 1. Search Logic: Filter by Title OR Description
    if (search) {
      where.OR = [
        { 
          title: { 
            contains: search, 
            // mode: 'insensitive' // Uncomment this line if using PostgreSQL. MySQL usually handles case-insensitivity via collation.
          } 
        },
        { 
          description: { 
            contains: search, 
            // mode: 'insensitive' 
          } 
        }
      ];
    }

    // 2. Category Filter
    if (category && category !== 'All') {
      where.Categories = {
        name: category
      };
    }

    // 3. Sorting Logic
    let orderBy = { created_at: 'desc' }; // Default: Newest first
    
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating_desc') orderBy = { views: 'desc' }; // Fallback to views since we don't have reviews yet

    // Execute the query with relations
    const courses = await prisma.courses.findMany({
      where,
      orderBy,
      include: {
        Categories: true, // Include Category details
        Users: {          // Include Instructor (User) details
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Format the response data for the frontend
    const formattedCourses = courses.map(course => ({
      id: course.id, 
      title: course.title,
      price: course.price,
      image: course.thumbnail_url,
      category: course.Categories ? course.Categories.name : 'Uncategorized', // Safety check if category is missing
      instructor: course.Users ? `${course.Users.first_name} ${course.Users.last_name}` : 'Unknown Instructor',
      rating: 4.8, // Hardcoded placeholder for now
      reviews: course.views, 
      level: course.level
    }));

    res.json(formattedCourses);

  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server Error" });
  }
};