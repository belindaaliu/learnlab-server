const prisma = require('../lib/prisma');

// Get all notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId; // CHANGED from req.user.id
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await prisma.notifications.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const unreadCount = await prisma.notifications.count({
      where: { 
        user_id: BigInt(userId), 
        is_read: false 
      }
    });

    // Convert BigInt to Number for JSON serialization
    const formattedNotifications = notifications.map(n => ({
      ...n,
      id: Number(n.id),
      user_id: Number(n.user_id)
    }));

    res.json({
      notifications: formattedNotifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId; // CHANGED from req.user.id

    const count = await prisma.notifications.count({
      where: { 
        user_id: BigInt(userId), 
        is_read: false 
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // CHANGED from req.user.id

    const notification = await prisma.notifications.findFirst({
      where: { 
        id: BigInt(id), 
        user_id: BigInt(userId) 
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notifications.update({
      where: { id: BigInt(id) },
      data: { is_read: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId; // CHANGED from req.user.id

    await prisma.notifications.updateMany({
      where: { 
        user_id: BigInt(userId), 
        is_read: false 
      },
      data: { is_read: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // CHANGED from req.user.id

    const notification = await prisma.notifications.findFirst({
      where: { 
        id: BigInt(id), 
        user_id: BigInt(userId) 
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notifications.delete({
      where: { id: BigInt(id) }
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// Helper function stays the same
exports.createNotification = async ({ userId, type, title, message, link, metadata }) => {
  try {
    await prisma.notifications.create({
      data: {
        user_id: BigInt(userId),
        type: type,
        title: title,
        message: message,
        link: link,
        metadata: metadata
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};