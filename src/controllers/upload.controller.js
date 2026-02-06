exports.uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      message: "File uploaded successfully",
      url: req.file.location,
      key: req.file.key,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server Error during upload" });
  }
};