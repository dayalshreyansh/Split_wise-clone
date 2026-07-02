import { prisma } from '../config/db.js';

import { notifyUser } from "../services/notification.service.js"; 

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id; // Securely injected by your 'protect' middleware

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Prisma Magic: Create the Group AND the GroupMember link at the exact same time
    const newGroup = await prisma.group.create({
      data: {
        name,
        members: {
          create: {
            userId: userId
          }
        }
      },
      // Return the members array in the response so we can verify it worked
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Create Group Error:", error);
    res.status(500).json({ error: 'Server error while creating group' });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all memberships for this user, and include the associated group details
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: true
      }
    });

    // Map the result to return a clean array of groups
    const groups = userGroups.map(membership => membership.group);

    res.status(200).json(groups);
  } catch (error) {
    console.error("Fetch Groups Error:", error);
    res.status(500).json({ error: 'Server error while fetching groups' });
  }
};

export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params; // Passed via the URL string
    const { email } = req.body;

    // 1. Verify the user being added actually exists in our database
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User with this email not found in the system' });
    }

    // 2. Verify the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 3. Prevent duplicate memberships (Prisma handles this via the @@unique constraint, but it's good to catch it cleanly here)
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: userToAdd.id
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // 4. Add the user to the group
    const newMember = await prisma.groupMember.create({
      data: {
        groupId: groupId,
        userId: userToAdd.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json({
      message: 'User added to group successfully',
      member: newMember
    });

  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ error: 'Server error while adding member' });
  }
};
export const getSingleGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Fetch the group AND pull in all the member details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            // We only select safe data (no passwords!)
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Fetch Single Group Error:", error);
    res.status(500).json({ error: 'Server error while fetching group details' });
  }
};

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    const [expenses, members, settlements] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId },
        include: { splits: true },
      }),

      prisma.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.settlement.findMany({
        where: { groupId },
      }),
    ]);

    // =========================
    // PHASE 1: RAW BALANCES
    // =========================
    const balances = {};

    members.forEach((member) => {
      balances[member.user.id] = {
        id: member.user.id,
        name: member.user.name,
        balance: 0,
      };
    });

    expenses.forEach((expense) => {
      if (balances[expense.paidById]) {
        balances[expense.paidById].balance += parseFloat(
          expense.totalAmount
        );
      }

      expense.splits.forEach((split) => {
        if (balances[split.userId]) {
          balances[split.userId].balance -= parseFloat(
            split.owedAmount
          );
        }
      });
    });

    // =========================
    // APPLY COMPLETED SETTLEMENTS
    // =========================
    settlements
      .filter((s) => s.status === "CONFIRMED")
      .forEach((s) => {
        const amount = parseFloat(s.amount);

        if (balances[s.payerId]) {
          balances[s.payerId].balance += amount;
        }

        if (balances[s.payeeId]) {
          balances[s.payeeId].balance -= amount;
        }
      });

    const finalBalances = Object.values(balances).map((user) => ({
      userId: user.id,
      name: user.name,
      netBalance: parseFloat(user.balance.toFixed(2)),
    }));

    // =========================
    // PHASE 2: SIMPLIFICATION
    // =========================
    const debtors = [];
    const creditors = [];

    for (const user of finalBalances) {
      if (user.netBalance < -0.01) {
        debtors.push({ ...user });
      } else if (user.netBalance > 0.01) {
        creditors.push({ ...user });
      }
    }

    debtors.sort((a, b) => a.netBalance - b.netBalance);
    creditors.sort((a, b) => b.netBalance - a.netBalance);

    const suggestedTransactions = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amountToSettle = Math.min(
        Math.abs(debtor.netBalance),
        creditor.netBalance
      );

      const settledAmount =
        Math.round(amountToSettle * 100) / 100;

      // Find existing settlement between these users
      const existingSettlement = settlements.find(
        (s) =>
          s.payerId === debtor.userId &&
          s.payeeId === creditor.userId &&
          s.status !== "CONFIRMED"
      );

      suggestedTransactions.push({
        groupId,
        fromUserId: debtor.userId,
        fromName: debtor.name,

        toUserId: creditor.userId,
        toName: creditor.name,

        amount: settledAmount,

        settlementId: existingSettlement?.id || null,
        status: existingSettlement?.status || null,
      });

      debtor.netBalance += settledAmount;
      creditor.netBalance -= settledAmount;

      if (Math.abs(debtor.netBalance) < 0.01) {
        i++;
      }

      if (Math.abs(creditor.netBalance) < 0.01) {
        j++;
      }
    }

    res.status(200).json({
      groupBalances: finalBalances,
      suggestedSettlements: suggestedTransactions,
    });
  } catch (error) {
    console.error("Calculate Balances Error:", error);
    res.status(500).json({
      error: "Server error while calculating balances",
    });
  }
};
export const sendSettlementRequest = async (req, res) => {
  try {
    const { settlementId } = req.body;

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

    if (req.user.id !== settlement.payeeId) {
      return res.status(403).json({
        message: "Only the creditor can request payment.",
      });
    }

    await notifyUser(
      settlement.payerId,
      `${req.user.name} requested payment of ₹${settlement.amount}.`,
      "SETTLEMENT_REQUEST"
    );

    res.status(200).json({
      message: "Payment request sent.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to send request",
      error: error.message,
    });
  }
};