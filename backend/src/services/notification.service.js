import { prisma } from '../config/db.js';

export const notifyUser = async (recipientId, message, type) => {
  return await prisma.notification.create({
    data: {
      recipientId,
      message,
      type,
      status: 'UNREAD'
    }
  });
};