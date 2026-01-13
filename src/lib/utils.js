import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper function to format payment type for display
export function formatPaymentType(paymentType) {
  switch (paymentType?.toLowerCase()) {
    case 'upi':
      return 'Online'
    case 'cash':
      return 'Cash'
    case 'card':
      return 'Card'
    case 'other':
      return 'Other'
    default:
      return paymentType || 'Cash'
  }
}
