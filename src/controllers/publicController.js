const prisma = require('../lib/prisma');

exports.verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    const cert = await prisma.certificates.findUnique({
      where: { id: BigInt(certId) },
      include: {
        Users: {
          select: { 
            first_name: true, 
            last_name: true,
            photo_url: true 
          }
        },
        Courses: {
          select: { 
            title: true,
            instructor_id: true,
            Users: { // This gets the Instructor's name
               select: { first_name: true, last_name: true }
            }
          }
        }
      }
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.json({
      success: true,
      data: {
        id: cert.id,
        studentName: `${cert.Users.first_name} ${cert.Users.last_name}`,
        studentPhoto: cert.Users.photo_url,
        courseTitle: cert.Courses.title,
        instructorName: `${cert.Courses.Users.first_name} ${cert.Courses.Users.last_name}`,
        issuedAt: cert.issued_at
      }
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};