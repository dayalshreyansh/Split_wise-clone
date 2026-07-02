// tasks/monthlySummary.js
import cron from 'node-cron';
import { prisma } from "../config/db.js";
import { notifyUser } from "../services/notification.service.js";

export const initMonthlySummaryTask = () => {
  // Run at 00:00 on the 1st day of every month
  cron.schedule('0 0 1 * *', async () => {
    try {
      const groups = await prisma.group.findMany({ include: { members: true } });

      for (const group of groups) {
        const totalSpent = await prisma.expense.aggregate({
          where: { groupId: group.id }, 
          _sum: { totalAmount: true }
        });

        for (const member of group.members) {
          await notifyUser(
            member.userId,
            `Monthly Report: You were part of group "${group.name}" which spent a total of $${totalSpent._sum.totalAmount || 0} this month.`,
            'MONTHLY_SUMMARY'
          );
        }
      }
    } catch (error) {
      console.error("Monthly summary cron job failed:", error);
    }
  });
};