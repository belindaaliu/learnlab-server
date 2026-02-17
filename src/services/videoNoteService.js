const { geminiModel } = require("../lib/gemini");

const videoNoteService = {
  /**
   * Generate notes from video transcript using Gemini
   */
  async generateNotes(transcript, videoTitle, options = {}) {
    const { style = "detailed", includeKeyTerms = true } = options;

    const prompt = `
      You are a study assistant. Create ${style} study notes from this educational video.
      
      Video Title: "${videoTitle}"
      
      Transcript:
      ${transcript}
      
      Please provide:
      
      1. **SUMMARY** (2-3 sentences)
      
      2. **MAIN CONCEPTS** (3-5 key ideas with explanations)
      
      3. **DETAILED NOTES** (organized by topic)
      
      ${includeKeyTerms ? '4. **KEY TERMS** (important vocabulary with definitions)' : ''}
      
      5. **KEY TAKEAWAYS** (what to remember)
      
      Format in clear markdown with headings and bullet points.
    `;

    try {
      const result = await geminiModel.generateContent(prompt);
      const notes = result.response.text();
      
      // Extract key terms separately if needed
      let keyTerms = [];
      if (includeKeyTerms) {
        keyTerms = await this.extractKeyTerms(transcript);
      }

      return {
        notes,
        keyTerms,
        summary: this.extractSummary(notes)
      };
    } catch (error) {
      console.error("Note generation error:", error);
      throw error;
    }
  },

  /**
   * Extract key terms separately
   */
  async extractKeyTerms(transcript) {
    const prompt = `
      Extract the 10 most important technical terms from this transcript.
      Return ONLY a JSON array of objects with "term" and "definition".
      
      Transcript: ${transcript.substring(0, 3000)}
    `;

    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      
      // Try to parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      return [];
    }
  },

  /**
   * Quick summary (cheaper/faster)
   */
  async quickSummary(transcript, videoTitle) {
    const prompt = `
      Summarize this video in 3 bullet points:
      
      Title: ${videoTitle}
      Transcript: ${transcript.substring(0, 2000)}
    `;

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  },

  extractSummary(notes) {
    // Extract first paragraph or summary section
    const summaryMatch = notes.match(/\*\*SUMMARY\*\*[\s\n]*([^\n]+)/i);
    return summaryMatch ? summaryMatch[1] : "";
  }
};

module.exports = videoNoteService;