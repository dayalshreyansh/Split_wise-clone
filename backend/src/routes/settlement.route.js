import express from "express";

import { protect } from "../middlewares/authMiddleware.js";
import { sendSettlementRequest } from "../controller/group.controller.js";
import { confirmSettlement, createSettlement, settleUp } from "../controller/settlement.controller.js";

const router = express.Router();

router.patch("/:settlementId/settle", protect, settleUp);

router.patch("/:settlementId/confirm", protect, confirmSettlement);

router.post('/:groupId/settlement-request', protect, sendSettlementRequest);

router.post("/create", protect, createSettlement);
export default router;