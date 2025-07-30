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
    default: 'rounded-xl shadow-sm border',
    modern: 'card-modern',
    interactive: 'card-interactive'
  };
  
  const baseClasses = variantClasses[variant];
  const hoverClasses = hover ? 'hover-lift' : '';
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`px-6 py-5 border-b ${className}`}
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)'
      }}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`px-6 py-5 ${className}`}
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`px-6 py-5 border-t ${className}`}
      style={{
        borderColor: 'var(--border-primary)',
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)'
      }}
    >
      {children}
    </div>
  );
};

export default Card;