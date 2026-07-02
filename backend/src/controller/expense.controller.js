import { prisma } from '../config/db.js';
import { notifyUser } from "../services/notification.service.js"; // Import the service
export const addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, totalAmount, splitType, splits } = req.body;
    const paidById = req.user.id;

    // --- PHASE 1: THE SMART MATH ENGINE ---
    let finalSplits = [];

    if (splitType === 'EQUAL') {
      const baseAmount = Math.floor((totalAmount / splits.length) * 100) / 100;
      let leftoverPennies = Math.round((totalAmount - (baseAmount * splits.length)) * 100);

      finalSplits = splits.map((split) => {
        let assignedAmount = baseAmount;
        if (leftoverPennies > 0) {
          assignedAmount += 0.01;
          leftoverPennies -= 1;
        }
        return {
          userId: split.userId,
          owedAmount: parseFloat(assignedAmount.toFixed(2))
        };
      });

    } else if (splitType === 'PERCENTAGE') {
      const totalPercentage = splits.reduce((sum, split) => sum + (split.owedAmount || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ error: 'Percentages must add up to exactly 100%' });
      }

      let runningTotal = 0;
      finalSplits = splits.map((split, index) => {
        if (index === splits.length - 1) {
          return {
            userId: split.userId,
            owedAmount: parseFloat((totalAmount - runningTotal).toFixed(2))
          };
        }
        const calculatedAmount = Math.floor(((split.owedAmount / 100) * totalAmount) * 100) / 100;
        runningTotal += calculatedAmount;
        
        return { userId: split.userId, owedAmount: calculatedAmount };
      });

    } else if (splitType === 'SHARE') {
      const totalShares = splits.reduce((sum, split) => sum + (split.owedAmount || 0), 0);
      if (totalShares <= 0) {
        return res.status(400).json({ error: 'Total shares must be greater than 0' });
      }

      let runningTotal = 0;
      finalSplits = splits.map((split, index) => {
        if (index === splits.length - 1) {
          return {
            userId: split.userId,
            owedAmount: parseFloat((totalAmount - runningTotal).toFixed(2))
          };
        }
        const calculatedAmount = Math.floor(((split.owedAmount / totalShares) * totalAmount) * 100) / 100;
        runningTotal += calculatedAmount;

        return { userId: split.userId, owedAmount: calculatedAmount };
      });

    } else if (splitType === 'EXACT') {
      const calculatedTotal = splits.reduce((sum, split) => sum + (split.owedAmount || 0), 0);
      if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        return res.status(400).json({ error: 'Exact split amounts do not add up to the total' });
      }
      finalSplits = splits;
    } else {
      return res.status(400).json({ error: 'Invalid split type' });
    }
    // --------------------------------------

    // --- PHASE 2: DATABASE VALIDATION ---
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidById } }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You must be a member of this group to add an expense' });
    }

    // --- PHASE 3: THE ATOMIC TRANSACTION ---
    const newExpense = await prisma.expense.create({
      data: {
        groupId,
        description,
        totalAmount,
        splitType,
        paidById,
        splits: {
          create: finalSplits.map(split => ({
            userId: split.userId,
            owedAmount: split.owedAmount
          }))
        }
      },
      include: {
        splits: { include: { user: { select: { id: true, name: true } } } },
        paidBy: { select: { name: true } }
      }
    });

    // --- PHASE 4: PERSISTENT NOTIFICATIONS & WEBSOCKET PUSH ---
    const message = `${req.user.name} added a new expense: "${description}" for $${totalAmount}.`;
    const io = req.app.get('io');

    // 1. Persistent DB Notifications (Using the Service)
    for (const split of newExpense.splits) {
      if (split.userId !== paidById) {
        // This is the clean, reusable service call!
        await notifyUser(split.userId, message, 'EXPENSE_ADDED');
      }
    }

    // 2. Real-time WebSocket Push
    if (io) {
      io.to(groupId).emit('new_expense_alert', {
        groupId,
        expenseId: newExpense.id,
        title: "New Expense Added!",
        message,
        timestamp: new Date()
      });
    }

    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });

  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ error: 'Server error while adding expense' });
  }
};
export const settleUp = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await prisma.settlement.findUnique({
      where: {
        id: settlementId,
      },
      include: {
        payer: true,
        payee: true,
      },
    });

    if (!settlement) {
      return res.status(404).json({
        message: "Settlement not found",
      });
    }

    // only debtor can mark as paid
    if (req.user.id !== settlement.payerId) {
      return res.status(403).json({
        message: "Only the debtor can settle this payment.",
      });
    }

    if (settlement.status !== "PENDING") {
      return res.status(400).json({
        message: "Settlement is already processed.",
      });
    }

    const updatedSettlement = await prisma.settlement.update({
      where: {
        id: settlementId,
      },
      data: {
        status: "PENDING_CONFIRMATION",
      },
    });

    await notifyUser(
      settlement.payeeId,
      `${req.user.name} marked ₹${settlement.amount} as paid. Please confirm receipt.`,
      "SETTLEMENT_CONFIRMATION"
    );

    res.status(200).json({
      message: "Payment marked as completed. Waiting for confirmation.",
      settlement: updatedSettlement,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Settlement failed",
      error: error.message,
    });
  }
};
export const confirmSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await prisma.settlement.findUnique({
      where: {
        id: settlementId,
      },
    });

    if (!settlement) {
      return res.status(404).json({
        message: "Settlement not found",
      });
    }

    // only creditor can confirm
    if (req.user.id !== settlement.payeeId) {
      return res.status(403).json({
        message: "Only the creditor can confirm receipt.",
      });
    }

    if (settlement.status !== "PENDING_CONFIRMATION") {
      return res.status(400).json({
        message: "Settlement is not awaiting confirmation.",
      });
    }

    const updatedSettlement = await prisma.settlement.update({
      where: {
        id: settlementId,
      },
      data: {
        status: "CONFIRMED",
      },
    });

    await notifyUser(
      settlement.payerId,
      `${req.user.name} confirmed your payment.`,
      "SETTLEMENT_CONFIRMED"
    );

    const io = req.app.get("io");

    if (io) {
      io.to(settlement.payerId).emit(
        "settlement_finalized",
        updatedSettlement
      );

      io.to(settlement.payeeId).emit(
        "settlement_finalized",
        updatedSettlement
      );
    }

    res.status(200).json({
      message: "Settlement confirmed.",
      settlement: updatedSettlement,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Confirmation failed",
      error: error.message,
    });
  }
};
export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Parse pagination parameters from the URL query string (e.g., ?page=1&limit=10)
    // Default to page 1 and 10 items per page if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. Verify the group exists
    const groupExists = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!groupExists) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 2. Fetch the paginated expenses along with relation details
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      orderBy: {
        createdAt: 'desc' // Newest transactions first
      },
      skip: skip,
      take: limit,
      include: {
        paidBy: {
          select: { id: true, name: true, email: true }
        },
        splits: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    // 3. Get total count of expenses for this group to help the frontend calculate total pages
    const totalExpenses = await prisma.expense.count({
      where: { groupId }
    });

    res.status(200).json({
      meta: {
        totalItems: totalExpenses,
        currentPage: page,
        totalPages: Math.ceil(totalExpenses / limit),
        itemsPerPage: limit
      },
      expenses
    });

  } catch (error) {
    console.error("Fetch Group Expenses Error:", error);
    res.status(500).json({ error: 'Server error while fetching expense history' });
  }
};