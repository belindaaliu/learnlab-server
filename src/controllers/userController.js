const prisma = require("../lib/prisma");
const crypto = require("crypto");
const s3 = require("../lib/s3");

// GET CURRENT USER (STUDENT OR INSTRUCTOR)
const getProfile = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
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
        instructor_application_status: true,
        instructor_admin_comment: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE CURRENT USER
const updateProfile = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

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
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- APPLY AS INSTRUCTOR ----------------
const applyAsInstructor = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        instructor_application_status: true,
        instructor_application_submitted_at: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.instructor_application_status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your application is already under review.",
      });
    }

    if (user.instructor_application_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "You are already approved as an instructor.",
      });
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        instructor_application_status: "pending",
        instructor_application_submitted_at: new Date(),
      },
      select: {
        instructor_application_status: true,
      },
    });

    res.json({
      success: true,
      message: "Instructor application submitted.",
      data: updated,
    });
  } catch (error) {
    console.error("applyAsInstructor error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- UPLOAD PHOTO ----------------
const uploadPhoto = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = req.file.originalname.split(".").pop();
    const randomName = crypto.randomBytes(16).toString("hex");

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `profile_photos/${randomName}.${ext}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    const updated = await prisma.users.update({
      where: { id: userId },
      data: { photo_url: uploadResult.Location },
    });

    res.json(updated);
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- UPLOAD RESUME ----------------
const uploadResume = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // MANUAL S3 UPLOAD - Same as photo upload pattern
    const ext = req.file.originalname.split(".").pop();
    const randomName = crypto.randomBytes(16).toString("hex");
    const key = `resumes/${randomName}.${ext}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();

    // Update user with resume URL
    const updated = await prisma.users.update({
      where: { id: userId },
      data: { 
        resume_url: uploadResult.Location 
      },
    });

    // Get user details for display name
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { first_name: true, last_name: true }
    });

    // Generate display name for response
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const displayName = `${user.first_name || 'User'}_${user.last_name || 'Profile'}_Resume_${formattedDate}.${ext}`;

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      data: {
        resume_url: uploadResult.Location,
        display_name: displayName
      }
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ---------------- DOWNLOAD RESUME ----------------
const downloadResume = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        resume_url: true,
        first_name: true,
        last_name: true 
      }
    });

    if (!user?.resume_url) {
      return res.status(404).json({ message: "No resume found" });
    }

    // Extract S3 key from URL
    const url = new URL(user.resume_url);
    const key = url.pathname.substring(1); // Remove leading '/'
    
    const ext = key.split('.').pop();

    // Generate display name
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const displayName = `${user.first_name || 'User'}_${user.last_name || 'Profile'}_Resume_${formattedDate}.${ext}`;

    // Get file from S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    const file = await s3.getObject(params).promise();

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(displayName)}"`);
    res.setHeader('Content-Type', file.ContentType);
    res.setHeader('Content-Length', file.ContentLength);

    // Send file
    res.send(file.Body);
  } catch (error) {
    console.error("Resume download error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- DELETE RESUME ----------------
const deleteResume = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { resume_url: true }
    });

    if (user?.resume_url) {
      // Extract S3 key from URL
      const urlParts = user.resume_url.split('/');
      const key = urlParts.slice(urlParts.indexOf('resumes')).join('/');

      // Delete from S3
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      };

      await s3.deleteObject(params).promise();
    }

    // Remove resume_url from database
    await prisma.users.update({
      where: { id: userId },
      data: { resume_url: null },
    });

    res.status(200).json({ 
      success: true, 
      message: "Resume deleted successfully" 
    });
  } catch (error) {
    console.error("Resume delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET RESUME INFO ----------------
const getResumeInfo = async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        resume_url: true,
        first_name: true,
        last_name: true
      }
    });

    if (!user?.resume_url) {
      return res.status(200).json({
        success: true,
        data: { hasResume: false }
      });
    }

    // Generate display name
    const ext = user.resume_url.split('.').pop();
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const displayName = `${user.first_name || 'User'}_${user.last_name || 'Profile'}_Resume_${formattedDate}.${ext}`;

    res.status(200).json({
      success: true,
      data: {
        hasResume: true,
        resume_url: user.resume_url,
        display_name: displayName
      }
    });
  } catch (error) {
    console.error("Get resume info error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- SEARCH USERS ----------------
const searchUsers = async (req, res) => {
  try {
    const { q, type } = req.query; // Add type parameter
    const currentUserId = Number(req.user?.userId);

    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }

    const searchTerm = q.trim().toLowerCase();
    
    // Build role filter based on type
    let roleFilter = {};
    if (type === 'learners') {
      roleFilter = { role: 'student' };
    } else if (type === 'instructors') {
      roleFilter = { role: 'instructor' };
    } else {
      // Search both by default
      roleFilter = { role: { in: ['student', 'instructor'] } };
    }

    // Get users based on role filter
    const users = await prisma.users.findMany({
      where: {
        ...roleFilter,
        ...(currentUserId ? { id: { not: currentUserId } } : {})
      },
      select: {
        id: true,
        role: true,
        first_name: true,
        last_name: true,
        email: true,
        photo_url: true,
        occupation: true,
        headline: true
      },
      take: 50
    });

    // Filter in JavaScript (case-insensitive search)
    const filteredUsers = users.filter(user => {
      const firstName = (user.first_name || '').toLowerCase();
      const lastName = (user.last_name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      
      return (
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        fullName.includes(searchTerm)
      );
    });

    // Format response
    const formattedUsers = filteredUsers.slice(0, 10).map(user => ({
      id: user.id,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      photo_url: user.photo_url,
      occupation: user.occupation,
      headline: user.headline,
      userType: user.role === 'instructor' ? 'Instructor' : 'Learner'
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- GET INSTRUCTOR COURSES ----------------
const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = Number(req.params.id);

    // Check if instructor exists
    const instructor = await prisma.users.findUnique({
      where: { id: instructorId },
      select: { 
        id: true, 
        first_name: true, 
        last_name: true,
        role: true
      }
    });

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    // Get courses with proper relations - FIXED: Use 'Users' not 'instructor'
    const courses = await prisma.courses.findMany({
      where: {
        instructor_id: instructorId,
        is_deleted: false
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        thumbnail_url: true,
        price: true,
        level: true,
        category_id: true,
        views: true,
        enrollments_count: true,
        created_at: true,
        updated_at: true,
        language: true,
        long_description: true,
        requirements: true,
        target_audience: true,
        // FIXED: Use 'Users' not 'instructor'
        Users: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        Categories: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            CourseContent: true,
            Enrollments: true,
            Reviews: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Calculate total hours from course content
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        try {
          // Get all video content to calculate total duration
          const videoContents = await prisma.courseContent.findMany({
            where: {
              course_id: course.id,
              type: 'video'
            },
            select: {
              duration_seconds: true
            }
          });

          // Calculate total hours
          const totalSeconds = videoContents.reduce((acc, content) => {
            return acc + (content.duration_seconds || 0);
          }, 0);
          const totalHours = totalSeconds > 0 
            ? Math.round((totalSeconds / 3600) * 10) / 10 
            : 0;

          // Get average rating from reviews
          const reviews = await prisma.reviews.aggregate({
            where: { 
              course_id: course.id 
            },
            _avg: { 
              rating: true 
            }
          });

          return {
            id: course.id,
            title: course.title,
            subtitle: course.subtitle,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            price: course.price,
            level: course.level,
            category: course.Categories?.name || "Uncategorized",
            language: course.language,
            // FIXED: Use 'Users' not 'instructor'
            instructor_name: course.Users 
              ? `${course.Users.first_name} ${course.Users.last_name}`
              : `${instructor.first_name} ${instructor.last_name}`,
            students_enrolled: course._count?.Enrollments || 0,
            reviews_count: course._count?.Reviews || 0,
            rating: reviews._avg.rating || 0,
            hours: totalHours,
            lectures: course._count?.CourseContent || 0,
            created_at: course.created_at,
            views: course.views || 0
          };
        } catch (err) {
          console.error(`Error processing course ${course.id}:`, err);
          return {
            id: course.id,
            title: course.title,
            subtitle: course.subtitle,
            description: course.description,
            thumbnail_url: course.thumbnail_url,
            price: course.price,
            level: course.level,
            category: course.Categories?.name || "Uncategorized",
            language: course.language,
            instructor_name: course.Users 
              ? `${course.Users.first_name} ${course.Users.last_name}`
              : `${instructor.first_name} ${instructor.last_name}`,
            students_enrolled: 0,
            reviews_count: 0,
            rating: 0,
            hours: 0,
            lectures: 0,
            created_at: course.created_at,
            views: course.views || 0
          };
        }
      })
    );

    res.status(200).json(coursesWithDetails);
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ---------------- GET PUBLIC PROFILE (FOR ANY USER) ----------------
const getPublicProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        first_name: true,
        last_name: true,
        headline: true,
        biography: true,
        occupation: true,
        field_of_learning: true,
        skills: true,
        interests: true,
        photo_url: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("GET PUBLIC PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { 
  getProfile, 
  updateProfile, 
  uploadPhoto,
  uploadResume,
  downloadResume,
  deleteResume,
  getResumeInfo,
  searchUsers,
  getInstructorCourses,
  applyAsInstructor,
  getPublicProfile 
};