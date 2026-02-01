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


    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text('LearnLab Inc.', { align: 'left' });
    doc.text('Montreal, QC, Canada');
    doc.moveDown();

    // Bill To
    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
    doc.font('Helvetica').text(payment.Users.email);
    doc.moveDown();

    // Horizontal Line
    doc.moveTo(50, 200).lineTo(550, 200).stroke();
    doc.moveDown();

    // Table Header
    doc.font('Helvetica-Bold').text('Description', 50, 220);
    doc.text('Date', 300, 220);
    doc.text('Amount', 450, 220, { align: 'right' });

    // Table Row
    const description = payment.SubscriptionPlans?.name || payment.Courses?.title || "Course Purchase";
    doc.font('Helvetica').text(description, 50, 250);
    doc.text(new Date(payment.created_at).toLocaleDateString(), 300, 250);
    doc.text(`CA$${Number(payment.amount).toFixed(2)}`, 450, 250, { align: 'right' });

    // Footer
    doc.fontSize(10).text('Status: PAID', 50, 350, { color: 'green' });
    doc.text('Thank you for your business!', 50, 370, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error("Invoice Gen Error:", error);
    res.status(500).send("Error generating PDF");
  }
};