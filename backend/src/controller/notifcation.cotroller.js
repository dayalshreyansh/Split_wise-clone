import { prisma } from "../config/db.js";

//What will notification handle
//1. Request selletment toditfications
//2. Experns addition 
//3.Settlement confirmed
//3.group Invitations
//4.monthly summaries

export const getAllNotification = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        
        res.status(200).json(notifications); 
        
    } catch (error) {
        console.error("Fetch Error:", error); 
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    
    const notification = await prisma.notification.updateMany({
      where: { 
        id: id,
        recipientId: req.user.id 
      },
      data: { status: 'READ' }
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: "Notification not found or access denied" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};