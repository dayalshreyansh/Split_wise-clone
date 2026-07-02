import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters long")
});

export const addMemberSchema = z.object({
  email: z.string().email("Please provide a valid email address of the user to add")
});