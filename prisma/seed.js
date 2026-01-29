const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  try {
    // 1. Creating a teacher (because a lesson cannot be created without a teacher)
    // First, we check if there is one, and if not, we don't create it so that it doesn't give a duplicate error.
    let instructor = await prisma.users.findFirst({ where: { email: "ali@learnlab.ca" } });
    
    if (!instructor) {
      instructor = await prisma.users.create({
        data: {
          email: "ali@learnlab.ca",
          password_hash: "hashed_password_example", // Fack Password
          first_name: "Ali",
          last_name: "Ravanbakhsh",
          role: "instructor",
          headline: "Senior Full-Stack Developer",
          biography: "Teaching coding for 10 years."
        }
      });
      console.log('✅ Instructor created:', instructor.id);
    } else {
      console.log('ℹ️ Instructor already exists.');
    }

    // 2. Creating categories (if they don't exist, we'll create them)
    const categories = ['Development', 'Business', 'Design'];
    const catMap = {};

    for (const catName of categories) {
      let cat = await prisma.categories.findFirst({ where: { name: catName } });
      if (!cat) {
        cat = await prisma.categories.create({ data: { name: catName } });
      }
      catMap[catName] = cat.id;
    }
    console.log('✅ Categories created.');

    // 3. Creating lessons
    const coursesData = [
      {
        title: "Complete React Developer in 2026",
        description: "Master React.js with Hooks, Redux, and GraphQL.",
        price: 89.99,
        level: "intermediate", 
        category_id: catMap['Development'],
        instructor_id: instructor.id,
        thumbnail_url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop",
        views: 1200,
        enrollments_count: 350
      },
      {
        title: "Financial Analysis Masterclass",
        description: "Learn Excel, Accounting, and Financial Modeling.",
        price: 129.99,
        level: "advanced",
        category_id: catMap['Business'],
        instructor_id: instructor.id,
        thumbnail_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop",
        views: 800,
        enrollments_count: 150
      },
      {
        title: "Modern UI/UX Design Bootcamp",
        description: "Design beautiful interfaces with Figma.",
        price: 69.99,
        level: "beginner",
        category_id: catMap['Design'],
        instructor_id: instructor.id,
        thumbnail_url: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop",
        views: 2000,
        enrollments_count: 500
      }
    ];

    for (const course of coursesData) {
      // We check to make sure we don't repeat lessons.
      const exists = await prisma.courses.findFirst({ where: { title: course.title } });
      if (!exists) {
        await prisma.courses.create({ data: course });
      }
    }
    console.log('✅ Courses seeded successfully.');

  } catch (e) {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();