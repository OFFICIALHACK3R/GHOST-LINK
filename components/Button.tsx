import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-mono uppercase tracking-wider transition-all focus:outline-none focus:ring-1 focus:ring-hacker-500 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent";
  
  // Hacker/Terminal Variants
  const variants = {
    primary: "bg-hacker-500 text-hacker-950 hover:bg-hacker-400 border-hacker-500 font-bold",
    secondary: "bg-transparent text-hacker-500 border-hacker-500 hover:bg-hacker-500 hover:text-hacker-950",
    danger: "bg-transparent text-hacker-err border-hacker-err hover:bg-hacker-err hover:text-black",
    ghost: "text-hacker-500 hover:bg-hacker-800 hover:text-hacker-400",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs border",
    md: "px-4 py-2 text-sm border",
    lg: "px-8 py-3 text-base border-2",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};