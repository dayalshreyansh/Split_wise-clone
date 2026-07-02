import { z } from 'zod';

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  totalAmount: z.number().positive("Total amount must be greater than 0"),
  
  // Accept the split type, default to EXACT if they don't provide one
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARE']).default('EXACT'),
  
  splits: z.array(
    z.object({
      userId: z.string().uuid("Invalid user ID format"),
      // This is now OPTIONAL. If they choose EQUAL, we will calculate it for them.
      owedAmount: z.number().nonnegative().optional() 
    })
  ).min(1, "You must include at least one split")
});

export const settleUpSchema = z.object({
  amount: z.number().positive("Settlement amount must be greater than 0"),
  userWhoPaidId: z.string().uuid("Invalid user ID format for the payer"),
  userWhoGotPaidId: z.string().uuid("Invalid user ID format for the receiver")
});