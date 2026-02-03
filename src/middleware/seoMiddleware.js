const prisma = require('../lib/prisma');

const seoMiddleware = async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /LinkedInBot|facebookexternalhit|Twitterbot|googlebot/i.test(userAgent);

  // Only run this logic for the verification route when a bot is visiting
  if (isBot && req.path.startsWith('/verify/')) {
    try {
      const certId = req.path.split('/')[2];
      const cert = await prisma.certificates.findUnique({
        where: { id: BigInt(certId) },
        include: { Users: true, Courses: true }
      });

      if (cert) {
        const studentName = `${cert.Users.first_name} ${cert.Users.last_name}`;
        const courseTitle = cert.Courses.title;
        const siteUrl = process.env.FRONTEND_URL;
        
        // Return only the Meta Tags for the crawler
        return res.send(`
          <html>
            <head>
              <meta property="og:title" content="Verified Certificate: ${courseTitle}" />
              <meta property="og:description" content="${studentName} has successfully completed ${courseTitle}." />
              <meta property="og:image" content="${siteUrl}/api/public/certificate-image/${certId}.png" />
              <meta property="og:url" content="${siteUrl}${req.path}" />
              <meta property="og:type" content="website" />
              <meta name="twitter:card" content="summary_large_image" />
            </head>
            <body></body>
          </html>
        `);
      }
    } catch (e) {
      console.error("SEO Middleware Error:", e);
    }
  }
  
  next();
};

module.exports = seoMiddleware;