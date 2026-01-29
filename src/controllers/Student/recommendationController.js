import prisma from "../lib/prisma.js";

export const getRecommendations = async (req, res) => {
  const userId = Number(req.params.userId);

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      occupation: true,
      skills: true,
      interests: true,
    }
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  const keywords = [
    ...(user.skills || []),
    ...(user.interests || []),
    user.occupation
  ].filter(Boolean);

  const courses = await prisma.courses.findMany({
    where: {
      OR: [
        { title: { contains: keywords.join(" "), mode: "insensitive" } },
        { description: { contains: keywords.join(" "), mode: "insensitive" } },
        {
          CourseTags: {
            some: {
              tag_name: { in: keywords, mode: "insensitive" }
            }
          }
        }
      ]
    },
    include: {
      CourseTags: true,
      Users: true
    },
    take: 10
  });

  res.json({ recommended: courses });
};
