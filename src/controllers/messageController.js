const prisma = require("../lib/prisma");

const messageController = {
  // Get all conversations (grouped by other user)
  getConversations: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);

      // Get all unique users this person has messaged with
      const sentMessages = await prisma.messages.findMany({
        where: { sender_id: userId },
        select: { receiver_id: true },
        distinct: ['receiver_id'],
      });

      const receivedMessages = await prisma.messages.findMany({
        where: { receiver_id: userId },
        select: { sender_id: true },
        distinct: ['sender_id'],
      });

      // Combine and get unique user IDs
      const userIds = new Set([
        ...sentMessages.map(m => m.receiver_id),
        ...receivedMessages.map(m => m.sender_id),
      ]);

      // Get user details and last message for each conversation
      const conversations = await Promise.all(
        Array.from(userIds).map(async (otherUserId) => {
          const otherUser = await prisma.users.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              photo_url: true,
              role: true,
            },
          });

          const lastMessage = await prisma.messages.findFirst({
            where: {
              OR: [
                { sender_id: userId, receiver_id: otherUserId },
                { sender_id: otherUserId, receiver_id: userId },
              ],
            },
            orderBy: { created_at: 'desc' },
          });

          // Count unread messages
          const unreadCount = await prisma.messages.count({
            where: {
              sender_id: otherUserId,
              receiver_id: userId,
              is_read: false,
            },
          });

          return {
            otherUser: {
              id: otherUser.id.toString(),
              name: `${otherUser.first_name} ${otherUser.last_name}`,
              email: otherUser.email,
              photo_url: otherUser.photo_url,
              role: otherUser.role,
            },
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              isSentByMe: lastMessage.sender_id === userId,
            } : null,
            unreadCount,
          };
        })
      );

      // Sort by last message time
      conversations.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
      });

      res.json({ success: true, data: conversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get messages between current user and another user
  getMessages: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const otherUserId = BigInt(req.params.otherUserId);

      // Get the other user's info
      const otherUser = await prisma.users.findUnique({
        where: { id: otherUserId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          photo_url: true,
          role: true,
        },
      });

      if (!otherUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Get all messages between these two users
      const messages = await prisma.messages.findMany({
        where: {
          OR: [
            { sender_id: userId, receiver_id: otherUserId },
            { sender_id: otherUserId, receiver_id: userId },
          ],
        },
        orderBy: { created_at: 'asc' },
      });

      // Mark received messages as read
      await prisma.messages.updateMany({
        where: {
          sender_id: otherUserId,
          receiver_id: userId,
          is_read: false,
        },
        data: { is_read: true },
      });

      const formattedMessages = messages.map((msg) => ({
        id: msg.id.toString(),
        content: msg.content,
        created_at: msg.created_at,
        isSentByMe: msg.sender_id === userId,
      }));

      res.json({
        success: true,
        data: {
          otherUser: {
            id: otherUser.id.toString(),
            name: `${otherUser.first_name} ${otherUser.last_name}`,
            email: otherUser.email,
            photo_url: otherUser.photo_url,
            role: otherUser.role,
          },
          messages: formattedMessages,
        },
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Send a message
  sendMessage: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);
      const { receiverId, content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: "Message content required" });
      }

      const message = await prisma.messages.create({
        data: {
          sender_id: userId,
          receiver_id: BigInt(receiverId),
          content: content.trim(),
          is_read: false,
        },
      });

      res.json({
        success: true,
        data: {
          id: message.id.toString(),
          content: message.content,
          created_at: message.created_at,
          isSentByMe: true,
        },
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Search for users to message (instructors or students)
  searchUsers: async (req, res) => {
    try {
      const { query } = req.query;
      const currentUserId = BigInt(req.user.userId);

      if (!query || query.trim().length < 2) {
        return res.json({ success: true, data: [] });
      }

      const users = await prisma.users.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } }, // Exclude current user
            {
              OR: [
                { first_name: { contains: query } },
                { last_name: { contains: query } },
                { email: { contains: query } },
              ],
            },
          ],
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          photo_url: true,
          role: true,
        },
        take: 10,
      });

      const formattedUsers = users.map((user) => ({
        id: user.id.toString(),
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        photo_url: user.photo_url,
        role: user.role,
      }));

      res.json({ success: true, data: formattedUsers });
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get unread message count
  getUnreadCount: async (req, res) => {
    try {
      const userId = BigInt(req.user.userId);

      const count = await prisma.messages.count({
        where: {
          receiver_id: userId,
          is_read: false,
        },
      });

      res.json({ success: true, data: { count } });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = messageController;