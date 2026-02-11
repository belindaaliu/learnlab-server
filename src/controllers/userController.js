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

module.exports = { 
  getProfile, 
  updateProfile, 
  uploadPhoto,
  uploadResume,
  downloadResume,
  deleteResume,
  getResumeInfo 
};