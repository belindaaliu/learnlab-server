const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// 1. GET ALL CATEGORIES
// ==========================================
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' } 
    });

    const serializedCategories = categories.map(cat => ({
      ...cat,
      id: cat.id.toString()
    }));

    res.json(serializedCategories);

  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server Error fetching categories" });
  }
};

// ==========================================
// 2. CREATE NEW CATEGORY
// ==========================================
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await prisma.categories.findFirst({
      where: { name: name.trim() }
    });

    if (existing) {

        return res.json({ 
        ...existing, 
        id: existing.id.toString(),
        message: "Category already existed, selected automatically." 
      });
    }


    const newCategory = await prisma.categories.create({
      data: { name: name.trim() }
    });

    res.status(201).json({
      ...newCategory,
      id: newCategory.id.toString()
    });

  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server Error creating category" });
  }
};