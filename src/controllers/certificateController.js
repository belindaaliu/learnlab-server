const PDFDocument = require("pdfkit");
const prisma = require("../lib/prisma");
const QRCode = require("qrcode");
const path = require("path");

const certificateController = {
  // ==========================================
  // GET ALL STUDENT CERTIFICATES
  // ==========================================
  getStudentCertificates: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const certificates = await prisma.certificates.findMany({
        where: { user_id: userId },
        include: {
          Courses: {
            select: { title: true, thumbnail_url: true },
          },
        },
      });

      const formatted = certificates.map((c) => ({
        id: c.id.toString(),
        courseId: c.course_id.toString(),
        courseTitle: c.Courses.title,
        issuedAt: c.issued_at,
        thumbnail: c.Courses.thumbnail_url,
      }));

      res.json({ success: true, data: formatted });
    } catch (error) {
      console.error("Fetch Certificates Error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // ==========================================
  // HELPER: Generate PDF content
  // ==========================================
  _generatePDF: async (cert, dispositionType = "attachment") => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-certificate/${cert.id}`;
    const qrCodeDataUri = await QRCode.toDataURL(verifyUrl);

    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margin: 0,
    });

    const width = doc.page.width;
    const height = doc.page.height;

    // Outer Navy Border
    doc
      .rect(30, 30, width - 60, height - 60)
      .lineWidth(10)
      .stroke("#1a365d");

    // Inner Thin Gold/Light Border
    doc
      .rect(45, 45, width - 90, height - 90)
      .lineWidth(2)
      .stroke("#e2e8f0");

    // LOGO (top center)
    const logoPath = path.join(__dirname, "../../public/logo.png");
    try {
      doc.image(logoPath, width / 2 - 40, 50, { width: 80 });
    } catch (err) {
      console.warn("Logo load error:", err.message);
    }

    // Title
    doc
      .fontSize(42)
      .font("Helvetica-Bold")
      .fillColor("#1a365d")
      .text("CERTIFICATE OF COMPLETION", 0, 100, { align: "center" });

    // Sub-header
    doc
      .fontSize(18)
      .font("Helvetica")
      .fillColor("#4a5568")
      .text("This is to certify that", 0, 175, { align: "center" });

    // Student Name
    doc
      .fontSize(38)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(`${cert.Users.first_name} ${cert.Users.last_name}`, 0, 215, {
        align: "center",
      });

    // Completion Text
    doc
      .fontSize(16)
      .font("Helvetica")
      .fillColor("#4a5568")
      .text("has successfully completed the course", 0, 280, {
        align: "center",
      });

    // Course Title
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#2b6cb0")
      .text(cert.Courses.title, 60, 320, {
        align: "center",
        width: width - 120,
        ellipsis: true,
      });

    // Footer
    const footerY = height - 150;
    const qrSize = 75;

    doc.image(qrCodeDataUri, 80, footerY, { width: qrSize });

    doc
      .fontSize(8)
      .fillColor("#718096")
      .font("Helvetica")
      .text("VERIFIED CERTIFICATE ID", 80, footerY + qrSize + 5);
    doc.text(cert.id.toString(), 80, footerY + qrSize + 15);

    const signatureX = width - 250;
    doc
      .fontSize(14)
      .fillColor("#1a365d")
      .font("Helvetica")
      .text("__________________________", signatureX, footerY + 50);

    doc
      .fontSize(12)
      .fillColor("#000")
      .text("LearnLab Director", signatureX, footerY + 70, {
        width: 180,
        align: "center",
      });

    const dateString = new Date(cert.issued_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc
      .fontSize(10)
      .fillColor("#718096")
      .text(`Issued on: ${dateString}`, 0, height - 60, {
        align: "center",
      });

    doc.end();
    return doc;
  },

  // ==========================================
  // DOWNLOAD SINGLE PAGE PDF (Authenticated)
  // ==========================================
  downloadCertificate: async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = BigInt(req.user.userId);

      const cert = await prisma.certificates.findFirst({
        where: { user_id: userId, course_id: BigInt(courseId) },
        include: {
          Users: true,
          Courses: true,
        },
      });

      if (!cert) return res.status(404).send("Certificate not found.");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Certificate_${cert.id}.pdf`,
      );

      const doc = await certificateController._generatePDF(cert, "attachment");
      doc.pipe(res);
    } catch (error) {
      console.error("Certificate Generation Error:", error);
      if (!res.headersSent) {
        res.status(500).send("Error generating certificate.");
      }
    }
  },

  // ==========================================
  // DOWNLOAD PUBLIC CERTIFICATE (No Auth)
  // ==========================================
  downloadPublicCertificate: async (req, res) => {
    try {
      const { certId } = req.params;

      const cert = await prisma.certificates.findFirst({
        where: { id: BigInt(certId) },
        include: {
          Users: true,
          Courses: true,
        },
      });

      if (!cert) return res.status(404).send("Certificate not found.");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=Certificate_${cert.id}.pdf`,
      );

      const doc = await certificateController._generatePDF(cert, "inline");
      doc.pipe(res);
    } catch (error) {
      console.error("Certificate Generation Error:", error);
      if (!res.headersSent) {
        res.status(500).send("Error generating certificate.");
      }
    }
  },
};

module.exports = certificateController;
