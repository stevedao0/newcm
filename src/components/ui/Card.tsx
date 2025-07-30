import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'modern' | 'interactive';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'modern',
  hover = false 
}) => {
  const variantClasses = {
    default: 'bg-white rounded-xl shadow-sm border border-slate-200',
    modern: 'card-modern',
    interactive: 'card-interactive'
  };
  
  const baseClasses = variantClasses[variant];
  const hoverClasses = hover ? 'hover-lift' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-5 border-b border-secondary-200 bg-gradient-to-r from-secondary-50/50 to-white ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-5 border-t border-secondary-200 bg-gradient-to-r from-white to-secondary-50/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;