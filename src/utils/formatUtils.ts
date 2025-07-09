// Utility functions for formatting data
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

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Handle different date formats
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY format
      return dateStr;
    }
  }
  
  try {
    // ISO format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return dateStr;
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