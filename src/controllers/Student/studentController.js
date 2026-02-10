const prisma = require("../../lib/prisma");
const crypto = require("crypto");
const s3 = require("../../lib/s3");

// ---------------- GET CURRENT USER ----------------
const getCurrentUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true,
        headline: true,
        biography: true,
        occupation: true,
        field_of_learning: true,
        skills: true,
        interests: true,
        resume_url: true,
        photo_url: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET PURCHASED COURSES ----------------
const getPurchasedCourses = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const enrollments = await prisma.enrollments.findMany({
      where: { user_id: userId },
      include: {
        Courses: {
          include: {
            Users: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            // Include CourseContent to count total lessons
            CourseContent: {
              where: {
                type: { not: "section" } // Only count actual lessons, not sections
              },
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    // Get completed lessons count for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (e) => {
        const course = e.Courses;
        
        // Count completed lessons for this user in this course
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            user_id: userId,
            is_completed: true,
            CourseContent: {
              course_id: course.id,
              type: { not: "section" } // Only count non-section content
            }
          }
        });

        // Count total lessons (non-section content)
        const totalLessons = course.CourseContent.length;

        return {
          id: course.id,
          title: course.title,
          thumbnail_url: course.thumbnail_url,
          price: course.price,
          instructor: course.Users
            ? `${course.Users.first_name} ${course.Users.last_name}`
            : "Unknown Instructor",
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          // Add additional fields for frontend
          description: course.description,
          level: course.level,
          rating: 4.5, // You might want to calculate this from Reviews
          reviews: course.views || 0,
          // Calculate duration if available in CourseContent
          duration: course.CourseContent.reduce((total, content) => {
            return total + (content.duration_seconds || 0);
          }, 0) / 60, // Convert to minutes
          category: course.category_id // You might want to include category name
        };
      })
    );

    res.json(coursesWithProgress);

  } catch (error) {
    console.error("Error fetching purchased courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET WISHLIST COURSES ----------------
const getWishlistCourses = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    console.log("Fetching wishlist for user:", userId);

    const saved = await prisma.userSavedCourses.findMany({
      where: { user_id: userId },
      include: {
        Courses: {
          include: {
            Users: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
            Categories: {
              select: {
                name: true
              }
            }
          },
        },
      }
    });

    console.log("Found saved courses:", saved.length);

    // Format clean response for frontend
    const courses = saved.map((s) => ({
      id: s.Courses.id,
      title: s.Courses.title,
      description: s.Courses.description,
      price: s.Courses.price,
      thumbnail_url: s.Courses.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      instructor: s.Courses.Users
        ? `${s.Courses.Users.first_name} ${s.Courses.Users.last_name}`
        : "Unknown Instructor",
      category: s.Courses.Categories?.name || "Uncategorized",
      rating: 4.8,
      reviews: s.Courses.views || 0,
      level: s.Courses.level
    }));

    console.log("Returning courses:", courses);

    res.json(courses);

  } catch (error) {
    console.error("Error fetching wishlist courses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- UPDATE CURRENT USER ----------------
const updateCurrentUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const {
      first_name,
      last_name,
      headline,
      biography,
      occupation,
      field_of_learning,
      skills,
      interests,
      resume_url,
    } = req.body;

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name,
        last_name,
        headline,
        biography,
        occupation,
        field_of_learning,
        skills,
        interests,
        resume_url,
      },
      select: {
        first_name: true,
        last_name: true,
        headline: true,
        biography: true,
        occupation: true,
        field_of_learning: true,
        skills: true,
        interests: true,
        resume_url: true,
      }
    });

    res.json(updatedUser);

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------- SEARCH COURSES ----------------
const searchCourses = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const query = q.trim().toLowerCase();

    const courses = await prisma.courses.findMany({
      include: {
        Categories: true,
        Users: {
          select: { first_name: true, last_name: true },
        },
        CourseTags: true,
      },
    });

    const filteredCourses = courses.filter((course) => {
      const titleMatch = course.title?.toLowerCase().includes(query);
      const subtitleMatch = course.subtitle?.toLowerCase().includes(query);
      const descriptionMatch = course.description?.toLowerCase().includes(query);
      const categoryMatch = course.Categories?.name?.toLowerCase().includes(query);
      const teacherMatch =
        (course.Users?.first_name?.toLowerCase().includes(query) ||
         course.Users?.last_name?.toLowerCase().includes(query));
      const tagMatch =
        course.CourseTags?.some(tag => tag.tag_name?.toLowerCase().includes(query));

      return titleMatch || subtitleMatch || descriptionMatch || categoryMatch || teacherMatch || tagMatch;
    });

    const formattedCourses = filteredCourses.map((course) => ({
      id: course.id,
      title: course.title,
      price: course.price,
      image: course.thumbnail_url || "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
      category: course.Categories ? course.Categories.name : "Uncategorized",
      instructor: course.Users ? `${course.Users.first_name} ${course.Users.last_name}` : "Unknown Instructor",
      tags: course.CourseTags?.map(tag => tag.tag_name) || [],
      rating: 4.8,
      reviews: course.views,
      level: course.level,
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error("Error searching courses:", error);
    res.status(500).json({ message: "Server error searching courses" });
  }
};

// ---------------- ADD COURSE TO WISHLIST ----------------
const addCourseToWishlist = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { courseId, course_id } = req.body;

    const finalCourseId = courseId || course_id;

    if (!finalCourseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    // Check if already in wishlist
    const exists = await prisma.userSavedCourses.findFirst({
      where: { 
        user_id: userId, 
        course_id: Number(finalCourseId) 
      },
    });

    if (exists) {
      return res.status(400).json({ message: "Course already in wishlist" });
    }

    // Check if already enrolled
    const enrollment = await prisma.enrollments.findFirst({
      where: {
        user_id: userId,
        course_id: Number(finalCourseId)
      }
    });

    if (enrollment) {
      return res.status(400).json({ message: "You already own this course" });
    }

    const savedCourse = await prisma.userSavedCourses.create({
      data: {
        user_id: userId,
        course_id: Number(finalCourseId),
      },
    });

    res.status(201).json({
      success: true,
      message: "Course added to wishlist",
      data: savedCourse
    });

  } catch (error) {
    console.error("Error adding course to wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- REMOVE FROM WISHLIST ----------------
const removeFromWishlist = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const courseId = Number(req.params.courseId);

    const deleted = await prisma.userSavedCourses.deleteMany({
      where: {
        user_id: userId,
        course_id: courseId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: "Course not found in wishlist" });
    }

    res.json({ 
      success: true, 
      message: "Course removed from wishlist" 
    });

  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- ENROLL IN COURSE ----------------
const enrollCourse = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // Check if already enrolled
    const alreadyEnrolled = await prisma.enrollments.findFirst({
      where: { user_id: userId, course_id: Number(course_id) },
    });

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "User already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await prisma.enrollments.create({
      data: {
        user_id: userId,
        course_id: Number(course_id),
      },
    });

    // Fetch all course content
    const contents = await prisma.courseContent.findMany({
      where: { course_id: Number(course_id) },
    });

    // Create LessonProgress entries
    const progressPromises = contents.map((content) =>
      prisma.lessonProgress.create({
        data: {
          user_id: userId,
          content_id: content.id,
        },
      })
    );

    await Promise.all(progressPromises);

    res.status(201).json({
      enrollment,
      lesson_progress_created: contents.length,
    });

  } catch (error) {
    console.error("Error enrolling course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- EXPORT ALL CONTROLLERS ----------------
module.exports = {
  getCurrentUser,
  getPurchasedCourses,
  getWishlistCourses,
  updateCurrentUser,
  searchCourses,
  addCourseToWishlist,
  removeFromWishlist,
  enrollCourse,
};