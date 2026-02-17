const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto');

// Use your existing environment variable names
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const s3AudioService = {
  /**
   * Upload audio buffer to S3
   */
  async uploadAudio(audioBuffer, contentId, userId) {
    try {
      // Check if userId exists
      const userIdentifier = userId || 'anonymous';
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const key = `audio/${contentId}/${userIdentifier}-${timestamp}-${randomString}.mp3`;
      
      console.log(`📤 Uploading audio to S3: ${key}`);
      console.log(`📊 Audio size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🔑 Using AWS Key: ${process.env.AWS_ACCESS_KEY ? 'Present' : 'Missing'}`);
      
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        ACL: 'private',
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      
      // Construct the URL
      const audioUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      console.log(`✅ Audio uploaded successfully: ${audioUrl}`);
      return audioUrl;
      
    } catch (error) {
      console.error("❌ S3 audio upload error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode
      });
      throw error;
    }
  },

  /**
   * Test S3 connection
   */
  async testConnection() {
    try {
      console.log("Testing S3 connection...");
      console.log("Bucket:", process.env.AWS_BUCKET_NAME);
      console.log("Region:", process.env.AWS_REGION);
      console.log("Access Key:", process.env.AWS_ACCESS_KEY ? "Present" : "Missing");
      
      // Try to list buckets (requires additional permissions)
      const { ListBucketsCommand } = require("@aws-sdk/client-s3");
      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);
      console.log("✅ S3 connection successful");
      return true;
    } catch (error) {
      console.error("❌ S3 connection failed:", error.message);
      return false;
    }
  }
};

module.exports = s3AudioService;