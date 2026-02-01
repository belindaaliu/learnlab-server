const { createCanvas, loadImage } = require('canvas');

exports.generateSocialShareImage = async (studentName, courseTitle) => {
  const width = 1200;
  const height = 630; // Standard Open Graph size
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background (Gradient)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a365d'); 
  gradient.addColorStop(1, '#2b6cb0'); 
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Decorative Border
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  //  Text Styling
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  // Badge/Icon 
  ctx.font = 'bold 40px Helvetica';
  ctx.fillText('🏆 CERTIFICATE EARNED', width / 2, 150);

  // Student Name
  ctx.font = 'bold 80px Helvetica';
  ctx.fillText(studentName, width / 2, 320);

  // Course Title
  ctx.font = '35px Helvetica';
  ctx.fillStyle = '#cbd5e0';
  ctx.fillText('successfully completed', width / 2, 400);
  
  ctx.font = 'bold 50px Helvetica';
  ctx.fillStyle = '#ffffff';
  // Wrap text if course title is too long
  ctx.fillText(`"${courseTitle}"`, width / 2, 480);

  // 4. Branding
  ctx.font = 'bold 30px Helvetica';
  ctx.fillStyle = '#ffffff88';
  ctx.fillText('YourLearningPlatform.com', width / 2, 580);

  return canvas.toBuffer('image/png');
};