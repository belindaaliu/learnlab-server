const PDFDocument = require("pdfkit");
const prisma = require("../lib/prisma");
const QRCode = require("qrcode");

const certificateController = {
  getStudentCertificates: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const certificates = await prisma.certificates.findMany({
        where: { user_id: userId },
        include: { Courses: { select: { title: true, thumbnail_url: true } } },
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
      res.status(500).json({ message: error.message });
    }
  },

  downloadCertificate: async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = BigInt(req.user.userId);

    const cert = await prisma.certificates.findFirst({
      where: { user_id: userId, course_id: BigInt(courseId) },
      include: { 
        Users: true, 
        Courses: true 
      }
    });

    if (!cert) return res.status(404).send("Certificate not found.");

    // Generate QR Code Data

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${cert.id}`;
    const qrCodeDataUri = await QRCode.toDataURL(verifyUrl);

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate.pdf`);
    doc.pipe(res);

    // --- Certificate Design ---

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(5).stroke('#1a365d');
    
    doc.moveDown(4);
    doc.fontSize(40).font('Helvetica-Bold').fillColor('#1a365d').text('CERTIFICATE OF COMPLETION', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(15).font('Helvetica').fillColor('#000').text('This is to certify that', { align: 'center' });
    doc.fontSize(30).font('Helvetica-Bold').text(`${cert.Users.first_name} ${cert.Users.last_name}`, { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#2b6cb0').text(cert.Courses.title, { align: 'center' });

    // --- QR CODE SECTION ---

    const qrSize = 80;
    const xPos = 50; 
    const yPos = doc.page.height - 150;

    doc.image(qrCodeDataUri, xPos, yPos, { width: qrSize });
    
    // "Verified ID" label under QR
    doc.fontSize(8)
       .fillColor('#718096')
       .font('Helvetica')
       .text('VERIFIED CERTIFICATE ID', xPos, yPos + qrSize + 5);
    doc.text(cert.id.toString(), xPos, yPos + qrSize + 15);

    // Signatures 
    doc.fontSize(12).fillColor('#000').text('__________________________', 500, 450);
    doc.text('Platform Director', 500, 465);

    doc.end();
  } catch (error) {
    console.error("Certificate Gen Error:", error);
    res.status(500).send("Error generating certificate.");
    }
  },
};

module.exports = certificateController;
