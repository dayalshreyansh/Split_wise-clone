import { prisma } from '../config/db.js';
import { notifyUser } from "../services/notification.service.js";

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

export const createSettlement = async (req, res) => {
  try {
    const { groupId, payerId, payeeId, amount } = req.body;

    if (!groupId || !payerId || !payeeId || !amount) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // prevent duplicate active settlement
    const existingSettlement =
      await prisma.settlement.findUnique({
        where: {
          groupId_payerId_payeeId: {
            groupId,
            payerId,
            payeeId,
          },
        },
      });

    if (existingSettlement) {
      return res.status(200).json({
        message: "Settlement already exists",
        settlement: existingSettlement,
      });
    }

    const settlement =
      await prisma.settlement.create({
        data: {
          groupId,
          payerId,
          payeeId,
          amount,
          status: "PENDING",
        },
      });

    res.status(201).json({
      message: "Settlement created",
      settlement,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create settlement",
      error: error.message,
    });
  }
};