import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, locale: string = 'en') {
  if (locale === 'ar') {
    return `${price.toLocaleString('ar-EG')} ج.م`;
  }
  return `${price.toLocaleString('en-EG')} EGP`;
}

export function getDir(locale: string): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
