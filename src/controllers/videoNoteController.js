// controllers/videoNoteController.js
const { PrismaClient } = require('@prisma/client');
const videoNoteService = require("../services/videoNoteService");
const transcriptionService = require("../services/transcriptionService");

// Initialize Prisma directly
const prisma = new PrismaClient();

console.log("✅ Prisma initialized in videoNoteController");

const videoNoteController = {
  /**
   * Generate notes for a video
   */
  async generateNotes(req, res) {
    try {
      const { contentId } = req.body;
      const userId = req.user.userId;

      console.log("Generating notes for:", { userId, contentId });

      // Get video content
      const content = await prisma.courseContent.findUnique({
        where: { id: BigInt(contentId) }
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          message: "Video content not found"
        });
      }

      if (content.type !== 'video') {
        return res.status(400).json({
          success: false,
          message: "This content is not a video"
        });
      }

      // Check if notes already exist
      const existing = await prisma.videoNotes.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(contentId)
        }
      });

      if (existing) {
        // Convert BigInt to string for JSON response
        const serialized = {
          ...existing,
          id: existing.id.toString(),
          user_id: existing.user_id.toString(),
          content_id: existing.content_id.toString()
        };
        
        return res.json({
          success: true,
          data: serialized,
          message: "Notes already exist"
        });
      }

      // Check if transcript exists
      if (!content.transcript) {
        return res.status(400).json({
          success: false,
          message: "No transcript available for this video. Please add transcript first."
        });
      }

      // Generate notes with Gemini
      const { notes, keyTerms, summary } = await videoNoteService.generateNotes(
        content.transcript,
        content.title
      );

      // Save to database
      const savedNotes = await prisma.videoNotes.create({
        data: {
          user_id: BigInt(userId),
          content_id: BigInt(contentId),
          notes,
          transcript: content.transcript,
          key_terms: keyTerms || [],
          summary,
        }
      });

      // Convert BigInt to string for JSON response
      const serialized = {
        ...savedNotes,
        id: savedNotes.id.toString(),
        user_id: savedNotes.user_id.toString(),
        content_id: savedNotes.content_id.toString()
      };

      res.json({
        success: true,
        data: serialized,
        message: "Notes generated successfully"
      });

    } catch (error) {
      console.error("❌ Generate notes error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Failed to generate notes",
        error: error.message
      });
    }
  },

  /**
   * Get notes for a video
   */
  async getNotes(req, res) {
    try {
      const { contentId } = req.params;
      const userId = req.user.userId;

      console.log("Getting notes for:", { userId, contentId });

      const notes = await prisma.videoNotes.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(contentId)
        }
      });

      if (notes) {
        // Convert BigInt to string for JSON response
        const serialized = {
          ...notes,
          id: notes.id.toString(),
          user_id: notes.user_id.toString(),
          content_id: notes.content_id.toString()
        };
        return res.json({
          success: true,
          data: serialized
        });
      }

      res.json({
        success: true,
        data: null
      });

    } catch (error) {
      console.error("❌ Get notes error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notes",
        error: error.message
      });
    }
  },

  /**
   * Get all notes for user
   */
  async getUserNotes(req, res) {
    try {
      const userId = req.user.userId;

      const notes = await prisma.videoNotes.findMany({
        where: { user_id: BigInt(userId) },
        include: {
          course_content: {
            select: {
              id: true,
              title: true,
              courses: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Convert BigInt to string for JSON
      const serialized = notes.map(note => ({
        ...note,
        id: note.id.toString(),
        user_id: note.user_id.toString(),
        content_id: note.content_id.toString(),
        course_content: note.course_content ? {
          ...note.course_content,
          id: note.course_content.id.toString(),
          courses: note.course_content.courses ? {
            ...note.course_content.courses,
            id: note.course_content.courses.id.toString()
          } : null
        } : null
      }));

      res.json({
        success: true,
        data: serialized
      });

    } catch (error) {
      console.error("❌ Get user notes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notes",
        error: error.message
      });
    }
  },

  /**
   * Update notes (user edited)
   */
  async updateNotes(req, res) {
    try {
      const { noteId } = req.params;
      const { notes } = req.body;
      const userId = req.user.userId;

      const updated = await prisma.videoNotes.updateMany({
        where: {
          id: BigInt(noteId),
          user_id: BigInt(userId)
        },
        data: {
          notes,
          updated_at: new Date()
        }
      });

      if (updated.count === 0) {
        return res.status(404).json({
          success: false,
          message: "Notes not found"
        });
      }

      res.json({
        success: true,
        message: "Notes updated successfully"
      });

    } catch (error) {
      console.error("❌ Update notes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update notes",
        error: error.message
      });
    }
  },

  /**
   * Delete notes
   */
  async deleteNotes(req, res) {
    try {
      const { noteId } = req.params;
      const userId = req.user.userId;

      await prisma.videoNotes.deleteMany({
        where: {
          id: BigInt(noteId),
          user_id: BigInt(userId)
        }
      });

      res.json({
        success: true,
        message: "Notes deleted successfully"
      });

    } catch (error) {
      console.error("❌ Delete notes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete notes",
        error: error.message
      });
    }
  },

  /**
   * Add or update transcript for a video
   */
  async addTranscript(req, res) {
    try {
      const { contentId } = req.params;
      const { transcript } = req.body;
      const userId = req.user.userId;

      // Check if user is instructor or admin
      if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Only instructors can add transcripts"
        });
      }

      // Update the course content with transcript
      const updated = await prisma.courseContent.update({
        where: { id: BigInt(contentId) },
        data: { transcript }
      });

      res.json({
        success: true,
        message: "Transcript added successfully",
        data: {
          id: updated.id.toString(),
          title: updated.title,
          hasTranscript: !!updated.transcript
        }
      });

    } catch (error) {
      console.error("Add transcript error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add transcript",
        error: error.message
      });
    }
  },

  /**
   * Get transcript for a video
   */
  async getTranscript(req, res) {
    try {
      const { contentId } = req.params;

      const content = await prisma.courseContent.findUnique({
        where: { id: BigInt(contentId) },
        select: {
          id: true,
          title: true,
          transcript: true
        }
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          message: "Video not found"
        });
      }

      res.json({
        success: true,
        data: {
          id: content.id.toString(),
          title: content.title,
          transcript: content.transcript,
          hasTranscript: !!content.transcript
        }
      });

    } catch (error) {
      console.error("Get transcript error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get transcript"
      });
    }
  },

  /**
   * Auto-transcribe video and generate notes (ONE CLICK SOLUTION)
   */
  async autoTranscribeAndGenerate(req, res) {
    try {
      const { contentId } = req.body;
      const userId = req.user.userId;

      console.log(`🎯 Starting auto transcription for content ${contentId}`);

      // Get video content
      const content = await prisma.courseContent.findUnique({
        where: { id: BigInt(contentId) }
      });

      if (!content) {
        return res.status(404).json({
          success: false,
          message: "Video content not found"
        });
      }

      if (content.type !== 'video') {
        return res.status(400).json({
          success: false,
          message: "This content is not a video"
        });
      }

      if (!content.video_url) {
        return res.status(400).json({
          success: false,
          message: "No video URL found"
        });
      }

      // Check if notes already exist
      const existingNotes = await prisma.videoNotes.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(contentId)
        }
      });

      if (existingNotes) {
        // Convert BigInt to string for JSON response
        const serialized = {
          ...existingNotes,
          id: existingNotes.id.toString(),
          user_id: existingNotes.user_id.toString(),
          content_id: existingNotes.content_id.toString()
        };
        
        return res.json({
          success: true,
          data: serialized,
          message: "Notes already exist for this video"
        });
      }

      // Send immediate response
      res.json({
        success: true,
        message: "Transcription started. This will take a few minutes. The notes will appear when ready.",
        data: { contentId }
      });

      // Process in background - use the function directly
      await videoNoteController.processVideoInBackground(content, userId);

    } catch (error) {
      console.error("❌ Auto transcribe error:", error);
      // Only send error if response hasn't been sent yet
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to start transcription",
          error: error.message
        });
      }
    }
  },

  /**
 * Process video in background
 */
async processVideoInBackground(content, userId) {
  try {
    console.log(`🔄 Processing video ${content.id} in background...`);
    
    let transcript = null;
    let audioUrl = null;  // ✅ Declare audioUrl here

    // Check if it's a YouTube video for faster transcript
    if (transcriptionService.isYouTubeUrl(content.video_url)) {
      const videoId = transcriptionService.extractYouTubeId(content.video_url);
      if (videoId) {
        transcript = await transcriptionService.getYouTubeTranscript(videoId);
      }
    }

    // If no YouTube transcript, use Gemini to transcribe
    if (!transcript) {
      console.log("🎤 Using Gemini for audio transcription...");
      const result = await transcriptionService.transcribeVideo(
        content.video_url,
        content.id,
        userId  // ✅ Make sure userId is passed
      );
      transcript = result.transcript;
      audioUrl = result.audioUrl;  // ✅ Capture the audioUrl from the result
      
      console.log(`🔊 Audio URL received: ${audioUrl}`);
    }

    // ✅ Update content with transcript AND audio_url
    await prisma.courseContent.update({
      where: { id: content.id },
      data: { 
        transcript: transcript,
        audio_url: audioUrl  // ✅ Now this will be saved
      }
    });

    console.log(`✅ CourseContent updated with transcript and audio_url`);

    console.log("📝 Generating notes from transcript...");
    
    // Generate notes for the user
    const { notes, keyTerms, summary } = await videoNoteService.generateNotes(
      transcript,
      content.title
    );

    // Save notes to database
    const savedNotes = await prisma.videoNotes.create({
      data: {
        user_id: BigInt(userId),
        content_id: content.id,
        notes,
        transcript,  // Optional: store transcript here too
        key_terms: keyTerms || [],
        summary,
      }
    });

    console.log(`✅ Notes generated successfully for video ${content.id}`);
    console.log(`📝 Notes saved with ID: ${savedNotes.id}`);
    console.log(`🔊 Audio URL saved: ${audioUrl}`);

  } catch (error) {
    console.error("❌ Background processing error:", error);
    
    console.error("Failed to process video:", {
      contentId: content.id.toString(),
      userId: userId,
      error: error.message
    });
  }
},

  /**
   * Check transcription status
   */
  async checkStatus(req, res) {
    try {
      const { contentId } = req.params;
      const userId = req.user.userId;

      // Check if notes exist
      const notes = await prisma.videoNotes.findFirst({
        where: {
          user_id: BigInt(userId),
          content_id: BigInt(contentId)
        }
      });

      // Check if transcript exists
      const content = await prisma.courseContent.findUnique({
        where: { id: BigInt(contentId) },
        select: { transcript: true }
      });

      let serializedNotes = null;
      if (notes) {
        serializedNotes = {
          ...notes,
          id: notes.id.toString(),
          user_id: notes.user_id.toString(),
          content_id: notes.content_id.toString()
        };
      }

      res.json({
        success: true,
        data: {
          hasNotes: !!notes,
          hasTranscript: !!content?.transcript,
          notes: serializedNotes
        }
      });

    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check status",
        error: error.message
      });
    }
  }
};

module.exports = videoNoteController;