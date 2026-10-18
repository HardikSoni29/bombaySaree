import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Currency in Indian Rupees (₹)
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format exact precision for financial calculations
export function formatINRWithDecimals(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format Date
export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Format Date & Time
export function formatDateTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate unique barcode string
export function generateBarcodeString(prefix = 'BS'): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}`;
}

export const FALLBACK_SAREE_IMAGE =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80';

// Safe Product Image Resolver (handles string, object, or arrays from DB)
export function getProductImage(product?: any, index = 0): string {
  if (!product) return FALLBACK_SAREE_IMAGE;

  // 1. Check primary_image_url
  if (product.primary_image_url && typeof product.primary_image_url === 'string') {
    return product.primary_image_url;
  }

  // 2. Check images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const item = product.images[index] ?? product.images[0];
    if (typeof item === 'string' && item.startsWith('http')) return item;
    if (item && typeof item === 'object') {
      const url = item.image_url || item.url || item.src;
      if (typeof url === 'string' && url.startsWith('http')) return url;
    }
  }

  // 3. Check product_images from raw DB query
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const item = product.product_images[index] ?? product.product_images[0];
    if (item?.image_url && typeof item.image_url === 'string') return item.image_url;
  }

  return FALLBACK_SAREE_IMAGE;
}

