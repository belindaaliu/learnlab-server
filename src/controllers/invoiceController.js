const path = require("path");
const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');


exports.generateInvoice = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = BigInt(req.user.userId);

    const payment = await prisma.payments.findUnique({
      where: { id: BigInt(paymentId) },
      include: { 
        SubscriptionPlans: true, 
        Courses: true,
        Users: true 
      }
    });

    if (!payment || payment.user_id !== userId) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${paymentId}.pdf`);
    doc.pipe(res);


    // === HEADER: LOGO + COMPANY INFO ===
    // Logo (top-left)
    const logoPath = path.join(__dirname, "../../public/logo.png");
    try {
      doc.image(logoPath, 50, 45, { width: 80 });
    } catch (e) {
      console.warn("Invoice logo not found or failed to load:", e.message);
    }

    // Company / Invoice meta (top-right)
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE", 0, 50, { align: "right" });

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("LearnLab Inc.", { align: "right" })
      .text("Montreal, QC, Canada", { align: "right" });

    // Transaction / invoice meta
    const invoiceDate = new Date(payment.created_at);
    doc.moveDown();
    doc
      .fontSize(10)
      .text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, {
        align: "right",
      })
      .text(`Transaction #: ${payment.transaction_id}`, { align: "right" })
      .text(`Payment Method: ${payment.method.toUpperCase()}`, {
        align: "right",
      });

    doc.moveDown(2);

    // Bill To
    doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", 50);
    doc.font("Helvetica").text(payment.Users.email, 50);
    doc.moveDown();

    // Horizontal Line
    doc.moveTo(50, 230).lineTo(550, 230).stroke();
    doc.moveDown();

    // Table Header
    doc.font('Helvetica-Bold').text('Description', 50, 250);
    doc.text('Date', 300, 250);
    doc.text('Amount', 450, 250, { align: 'right' });

    // Table Row
    const description = payment.SubscriptionPlans?.name || payment.Courses?.title || "Course Purchase";
    doc.font('Helvetica').text(description, 50, 280);
    doc.text(new Date(payment.created_at).toLocaleDateString(), 300, 280);
    doc.text(`CA$${Number(payment.amount).toFixed(2)}`, 450, 280, { align: 'right' });

    // Footer
    doc.fontSize(10).text('Status: PAID', 50, 380, { color: 'green' });
    doc.text('Thank you for your business!', 50, 400, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error("Invoice Gen Error:", error);
    res.status(500).send("Error generating PDF");
  }
};