const prisma = require("../../lib/prisma");
const crypto = require("crypto");
const s3 = require("../../lib/s3");
const { notifyWishlistAdd } = require('../../utils/notificationHelpers');

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
            CourseContent: {
              where: {
                type: { not: "section" }
              },
              select: {
                id: true
              }
            },
            Reviews: {
              select: {
                rating: true
              }
            },
            _count: {
              select: {
                Enrollments: true
              }
            }
          }
        }
      }
    });

    const coursesWithProgress = await Promise.all(
      enrollments.map(async (e) => {
        const course = e.Courses;
        
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            user_id: userId,
            is_completed: true,
            CourseContent: {
              course_id: course.id,
              type: { not: "section" }
            }
          }
        });

        const totalLessons = course.CourseContent.length;

        // Calculate rating
        let averageRating = 0;
        let reviewCount = 0;

        if (course.Reviews && course.Reviews.length > 0) {
          const totalRating = course.Reviews.reduce((sum, review) => sum + review.rating, 0);
          averageRating = Number((totalRating / course.Reviews.length).toFixed(1));
          reviewCount = course.Reviews.length;
        }

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
          description: course.description,
          level: course.level,
          rating: averageRating,
          reviews_count: reviewCount,
          enrollments_count: course._count?.Enrollments || 0,
          duration: course.CourseContent.reduce((total, content) => {
            return total + (content.duration_seconds || 0);
          }, 0) / 60,
          category: course.category_id
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
            },
            Reviews: {
              select: {
                rating: true
              }
            },
            _count: {
              select: {
                Enrollments: true
              }
            }
          },
        },
      }
    });

    console.log("Found saved courses:", saved.length);

    const courses = saved.map((s) => {
      const course = s.Courses;
      
      // Calculate rating
      let averageRating = 0;
      let reviewCount = 0;

      if (course.Reviews && course.Reviews.length > 0) {
        const totalRating = course.Reviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = Number((totalRating / course.Reviews.length).toFixed(1));
        reviewCount = course.Reviews.length;
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        thumbnail_url: course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        instructor: course.Users
          ? `${course.Users.first_name} ${course.Users.last_name}`
          : "Unknown Instructor",
        category: course.Categories?.name || "Uncategorized",
        rating: averageRating,
        reviews_count: reviewCount,
        enrollments_count: course._count?.Enrollments || 0,
        level: course.level
      };
    });

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
      where: {
        is_deleted: false
      },
      include: {
        Categories: true,
        Users: {
          select: { first_name: true, last_name: true },
        },
        CourseTags: true,
        Reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            Enrollments: true
          }
        }
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

    const formattedCourses = filteredCourses.map((course) => {
      // Calculate rating
      let averageRating = 0;
      let reviewCount = 0;

      if (course.Reviews && course.Reviews.length > 0) {
        const totalRating = course.Reviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = Number((totalRating / course.Reviews.length).toFixed(1));
        reviewCount = course.Reviews.length;
      }

      return {
        id: course.id,
        title: course.title,
        price: course.price,
        image: course.thumbnail_url || "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
        category: course.Categories ? course.Categories.name : "Uncategorized",
        instructor: course.Users ? `${course.Users.first_name} ${course.Users.last_name}` : "Unknown Instructor",
        tags: course.CourseTags?.map(tag => tag.tag_name) || [],
        rating: averageRating,
        reviews_count: reviewCount,
        enrollments_count: course._count?.Enrollments || 0,
        level: course.level,
      };
    });

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

    const exists = await prisma.userSavedCourses.findFirst({
      where: { 
        user_id: userId, 
        course_id: Number(finalCourseId) 
      },
    });

    if (exists) {
      return res.status(400).json({ message: "Course already in wishlist" });
    }

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

    const course = await prisma.courses.findUnique({
      where: { id: Number(finalCourseId) }
    });

    if (course) {
      await notifyWishlistAdd(userId, course.title, finalCourseId);
    }
    
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

    const alreadyEnrolled = await prisma.enrollments.findFirst({
      where: { user_id: userId, course_id: Number(course_id) },
    });

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "User already enrolled in this course" });
    }

    const enrollment = await prisma.enrollments.create({
      data: {
        user_id: userId,
        course_id: Number(course_id),
      },
    });

    const contents = await prisma.courseContent.findMany({
      where: { course_id: Number(course_id) },
    });

    const progressPromises = contents.map((content) =>
      prisma.lessonProgress.create({
        data: {
          user_id: userId,
          content_id: content.id,
        },
      })
    );

    await Promise.all(progressPromises);

    await prisma.userSavedCourses.deleteMany({
      where: {
        user_id: userId,
        course_id: Number(course_id)
      }
    });

    await prisma.cartItems.deleteMany({
      where: {
        user_id: BigInt(userId),
        course_id: BigInt(course_id)
      }
    });

    res.status(201).json({
      enrollment,
      lesson_progress_created: contents.length,
    });

  } catch (error) {
    console.error("Error enrolling course:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET ENROLLED COURSES WITH NEXT CONTENT FOR DASHBOARD ----------------
const getEnrolledCoursesWithNextContent = async (req, res) => {
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
                last_name: true,
                photo_url: true
              }
            },
            CourseContent: {
              where: {
                type: { not: "section" }
              },
              orderBy: { order_index: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                duration_seconds: true,
                order_index: true
              }
            }
          }
        }
      },
      orderBy: { enrolled_at: 'desc' }
    });

    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.Courses;
        const contents = course.CourseContent;
        
        const completedLessons = await prisma.lessonProgress.findMany({
          where: {
            user_id: userId,
            is_completed: true,
            content_id: { in: contents.map(c => c.id) }
          },
          select: {
            content_id: true
          }
        });

        const completedIds = completedLessons.map(p => Number(p.content_id));
        const progress = contents.length > 0 
          ? Math.round((completedIds.length / contents.length) * 100)
          : 0;

        if (progress === 100) {
          return null;
        }

        let nextContent = null;
        for (const content of contents) {
          if (!completedIds.includes(Number(content.id))) {
            nextContent = {
              id: content.id,
              title: content.title,
              type: content.type,
              order: content.order_index,
              duration: content.duration_seconds ? Math.round(content.duration_seconds / 60) : null
            };
            break;
          }
        }

        if (!nextContent && contents.length > 0) {
          nextContent = {
            id: contents[0].id,
            title: contents[0].title,
            type: contents[0].type,
            order: contents[0].order_index,
            duration: contents[0].duration_seconds ? Math.round(contents[0].duration_seconds / 60) : null
          };
        }

        return {
          id: course.id,
          title: course.title,
          thumbnail_url: course.thumbnail_url,
          instructor: course.Users
            ? {
                name: `${course.Users.first_name} ${course.Users.last_name}`,
                photo: course.Users.photo_url
              }
            : null,
          progress,
          completedContent: completedIds.length,
          totalContent: contents.length,
          nextContent,
          enrolled_at: enrollment.enrolled_at
        };
      })
    );

    const uncompletedCourses = coursesWithProgress
      .filter(course => course !== null)
      .slice(0, 3);

    res.json(uncompletedCourses);

  } catch (error) {
    console.error("Error fetching enrolled courses with next content:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
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
  getEnrolledCoursesWithNextContent,
};