import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberToIndianWords(num: number): string {
  if (num === 0) return 'ZERO RUPEES ONLY';

  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convertBlock = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'HUNDRED ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' : '');
      n %= 10;
    }
    if (n > 0) {
      str += a[n];
    }
    return str;
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let str = '';

  if (rupees > 0) {
    if (rupees > 9999999) {
      str += convertBlock(Math.floor(rupees / 10000000)) + 'CRORE ';
    }
    if (rupees > 99999) {
      str += convertBlock(Math.floor((rupees % 10000000) / 100000)) + 'LAKH ';
    }
    if (rupees > 999) {
      str += convertBlock(Math.floor((rupees % 100000) / 1000)) + 'THOUSAND ';
    }
    str += convertBlock(rupees % 1000);
    str += 'RUPEES';
  }

  if (paise > 0) {
    str += (rupees > 0 ? ' AND ' : '') + convertBlock(paise) + 'PAISE';
  }

  return str.trim() + ' ONLY';
}
