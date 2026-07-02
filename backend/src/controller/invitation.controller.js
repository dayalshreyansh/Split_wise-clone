import { prisma } from "../config/db.js"; // Ensure .js extension for ESM
import crypto from 'crypto';

export const inviteMember = async (req, res) => {
    try {
        const { email } = req.body;
        const { groupId } = req.params; // Changed req.param to req.params

        const userToInvite = await prisma.user.findUnique({ where: { email } });
        
        // Return immediately if user doesn't exist
        if (!userToInvite) {
            return res.status(404).json({ message: "User does not exist" });
        }

        const existingMember = await prisma.groupMember.findFirst({ 
            where: { groupId, userId: userToInvite.id } 
        });
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        const pendingInvite = await prisma.invitation.findFirst({ 
            where: { groupId, inviteeEmail: email, status: 'PENDING' } 
        });
        if (pendingInvite) {
            return res.status(400).json({ message: "An invitation is already pending" });
        }

        const token = crypto.randomBytes(32).toString('hex');

        // FIXED: Changed 'date' to 'data'
        const invite = await prisma.invitation.create({
            data: {
                groupId,
                inviterId: req.user.id,
                inviteeEmail: email,
                token,
                status: 'PENDING'
            }
        });
        res.status(201).json({ message: "Invitation sent successfully", invite });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const acceptInvite = async (req, res) => {
    try {
        const { token } = req.params; // Changed req.param to req.params

        const invite = await prisma.invitation.findUnique({ where: { token } });
        if (!invite || invite.status !== 'PENDING') {
            return res.status(404).json({ message: "Invalid or expired invitation" });
        }

        // FIXED: Changed '/' to '.' and ensured data structure is correct
        await prisma.$transaction([
            prisma.groupMember.create({
                data: { groupId: invite.groupId, userId: req.user.id }
            }),
            prisma.invitation.update({
                where: { id: invite.id },
                data: { status: 'ACCEPTED' }
            })
        ]);
        res.status(200).json({ message: "Successfully joined the group!" });
    } catch (error) {
        res.status(500).json({ message: "Error joining group", error: error.message });
    }
};

export const getPendingRequest = async (req, res) => {
    try {
        // Using req.user.email from the protect middleware
        const pendingInvites = await prisma.invitation.findMany({
            where: {
                inviteeEmail: req.user.email,
                status: 'PENDING'
            },
            include: {
                group: { select: { name: true } },
                inviter: { select: { name: true } }
            }
        });
        res.status(200).json(pendingInvites);
    } catch (error) {
        res.status(500).json({ message: "Error fetching invites", error: error.message });
    }
};
export const getGroupPendingInvites = async (req, res) => {
  try {
    const { groupId } = req.params;

    const pendingInvites = await prisma.invitation.findMany({
      where: {
        groupId,
        status: "PENDING",
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(pendingInvites);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch pending invitations",
      error: error.message,
    });
  }
};