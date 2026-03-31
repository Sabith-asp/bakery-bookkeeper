export const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
