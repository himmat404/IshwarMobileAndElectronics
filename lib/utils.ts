export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getStockStatus(quantity: number): {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  label: string;
  color: string;
} {
  if (quantity === 0) {
    return {
      status: 'out-of-stock',
      label: 'Out of Stock',
      color: 'text-red-600',
    };
  }
  if (quantity <= 5) {
    return {
      status: 'low-stock',
      label: `Only ${quantity} left`,
      color: 'text-orange-600',
    };
  }
  return {
    status: 'in-stock',
    label: 'In Stock',
    color: 'text-green-600',
  };
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}