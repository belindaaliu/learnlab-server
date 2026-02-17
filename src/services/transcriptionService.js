const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const stream = require('stream');
const s3AudioService = require('./s3AudioService');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const fs = require('fs');
const path = require('path');
const os = require('os');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const transcriptionService = {
  /**
   * Main function to transcribe video
   */
  async transcribeVideo(videoUrl, contentId, userId) {
    try {
      console.log(`🎬 Starting transcription for video ${contentId}`);
      
      // Download video to memory
      const videoBuffer = await this.downloadVideoToBuffer(videoUrl);
      console.log(`✅ Video downloaded: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Extract audio to memory
      const audioBuffer = await this.extractAudioToBuffer(videoBuffer);
      console.log(`✅ Audio extracted: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Upload audio to S3 using your service
      const audioUrl = await s3AudioService.uploadAudio(
        audioBuffer, 
        contentId, 
        userId
      );
      console.log(`✅ Audio uploaded to S3: ${audioUrl}`);
      
      // Transcribe with Gemini
      const transcript = await this.transcribeWithGemini(audioBuffer);
      console.log(`✅ Transcript generated (${transcript.length} characters)`);
      
      return {
        transcript,
        audioUrl
      };
      
    } catch (error) {
      console.error("❌ Transcription error:", error);
      throw error;
    }
  },

  /**
   * Download video to buffer
   */
  async downloadVideoToBuffer(videoUrl) {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return Buffer.from(response.data);
  },

  /**
   * Extract audio to buffer using ffmpeg
   */
extractAudioToBuffer(videoBuffer) {
  return new Promise((resolve, reject) => {
    console.log(`🎵 Starting audio extraction with ffmpeg...`);
    
    // Create temporary file paths
    const tempVideoPath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);
    const tempAudioPath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
    
    // Write video buffer to temp file
    fs.writeFileSync(tempVideoPath, videoBuffer);
    console.log(`📁 Temp video file: ${tempVideoPath}`);
    
    // Use ffmpeg with files (more reliable than streams)
    ffmpeg(tempVideoPath)
      .toFormat('mp3')
      .audioBitrate(128)
      .audioChannels(1)
      .audioFrequency(16000)
      .on('start', (cmd) => {
        console.log('FFmpeg command started');
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err);
        // Clean up temp files
        try { fs.unlinkSync(tempVideoPath); } catch (e) {}
        try { fs.unlinkSync(tempAudioPath); } catch (e) {}
        reject(err);
      })
      .on('end', () => {
        console.log('✅ FFmpeg finished');
        
        // Read the audio file
        const audioBuffer = fs.readFileSync(tempAudioPath);
        console.log(`✅ Audio extracted: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Clean up temp files
        try { fs.unlinkSync(tempVideoPath); } catch (e) {}
        try { fs.unlinkSync(tempAudioPath); } catch (e) {}
        
        resolve(audioBuffer);
      })
      .save(tempAudioPath);
  });
},

  /**
   * Transcribe with Gemini
   */
async transcribeWithGemini(audioBuffer) {
  try {
    if (audioBuffer.length > 50 * 1024 * 1024) {
      throw new Error("Audio too large for Gemini (max 50MB)");
    }
    
    const audioBase64 = audioBuffer.toString('base64');
    
    // Use the same model that works in your other routes
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Changed to match your working config
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 8192 
      }
    });

    const prompt = `You are an expert transcriptionist. Transcribe this educational audio accurately.
    
Requirements:
- Transcribe EVERY word spoken
- Include proper punctuation and capitalization
- Format with paragraphs
- If multiple speakers, label them as [Speaker 1], [Speaker 2]
- Return ONLY the transcript, no additional comments`;

    console.log("🔄 Sending to Gemini 2.5 Flash...");
    
    const result = await model.generateContent([
      prompt,
      { 
        inlineData: { 
          data: audioBase64, 
          mimeType: "audio/mp3" 
        } 
      }
    ]);

    const transcript = result.response.text();
    console.log(`✅ Transcript generated: ${transcript.length} chars`);
    return transcript;
    
  } catch (error) {
    console.error("❌ Gemini error:", error);
    throw error;
  }
},

  /**
   * For YouTube videos - get transcript directly
   */
  async getYouTubeTranscript(videoId) {
    try {
      const { YoutubeTranscript } = require('youtube-transcript');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      return transcript.map(item => item.text).join(' ');
    } catch (error) {
      console.log("YouTube transcript not available, falling back to audio transcription");
      return null;
    }
  },

  isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
  },

  extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
};

module.exports = transcriptionService;