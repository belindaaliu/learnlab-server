const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCourses = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Filter conditions
    const where = {};

    // 1. Search
    if (search) {
      where.title = { contains: search }; // In MySQL, insensitive mode may need to be configured.
    }

    // 2. Category
    if (category && category !== 'All') {
      where.Categories = {
        name: category
      };
    }

    // 3. Sorting
    let orderBy = { created_at: 'desc' }; // Default: Newest
    
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating_desc') orderBy = { views: 'desc' }; // Currently, based on views, we don't have any reviews yet.

    // Query execution
    const courses = await prisma.courses.findMany({
      where,
      orderBy,
      include: {
        Categories: true, // Categories table
        Users: {          // We also get the teacher's information.
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Data mapping to clean up the output (optional but recommended))
    const formattedCourses = courses.map(course => ({
      id: course.id, // It will automatically be converted to String because of that code in step 1.
      title: course.title,
      price: course.price,
      image: course.thumbnail_url,
      category: course.Categories.name,
      instructor: `${course.Users.first_name} ${course.Users.last_name}`,
      rating: 4.8, // Fake for now
      reviews: course.views, // We'll leave the view for now.
      level: course.level
    }));

    res.json(formattedCourses);

  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server Error" });
  }
};