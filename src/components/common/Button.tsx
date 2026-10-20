import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-[#6D28D9] hover:bg-[#7C3AED] text-white focus:ring-[#6D28D9] shadow-sm active:scale-[0.98]',
      secondary:
        'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-purple-500 shadow-xs active:scale-[0.98]',
      success:
        'bg-[#10B981] hover:bg-[#059669] text-white focus:ring-[#10B981] shadow-sm active:scale-[0.98]',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 font-medium',
      md: 'text-sm px-4 py-2 gap-2 font-medium',
      lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
