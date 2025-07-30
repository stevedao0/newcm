// Utility functions for formatting data
export const parseExcelDate = (excelDate: number): string => {
  // Excel stores dates as serial numbers starting from 1900-01-01
  const excelEpoch = new Date(1900, 0, 1);
  const date = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseInt(amount.replace(/,/g, '')) : amount;
  
  if (isNaN(num)) return '0 VNĐ';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const formatDate = (dateStr: string | number | Date): string => {
  if (!dateStr && dateStr !== 0) return '';
  
  // Handle Excel serial date numbers
  if (typeof dateStr === 'number') {
    // Excel serial dates are typically > 1 (1900-01-01 is day 1)
    if (dateStr > 1 && dateStr < 100000) {
      return parseExcelDate(dateStr);
    }
    // If it's a timestamp
    if (dateStr > 100000) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    // Fallback for other numbers
    return String(dateStr);
  }
  
  // Convert to string
  const dateString = String(dateStr);
  
  // Handle different date formats
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY format
      return dateString;
    }
  }
  
  try {
    // ISO format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString;
  }
};

export const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY format
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }
  
  return new Date(dateStr);
};