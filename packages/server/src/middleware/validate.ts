import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const sendSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  amountSats: z.number().int().positive("Amount must be a positive integer"),
});

export const invoiceSchema = z.object({
  amountSats: z.number().int().positive("Amount must be a positive integer"),
  description: z.string().optional(),
});

export const tokenIssueSchema = z.object({
  name: z.string().min(1).max(64),
  ticker: z.string().min(1).max(8),
  amount: z.number().int().positive(),
  decimals: z.number().int().min(0).max(18).optional(),
});

export const tokenTransferSchema = z.object({
  address: z.string().min(1),
  assetId: z.string().min(1),
  amount: z.number().int().positive(),
});

export const importWalletSchema = z.object({
  mnemonic: z.string().min(1),
});

/**
 * Express middleware factory for Zod validation
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation error",
        details: result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
