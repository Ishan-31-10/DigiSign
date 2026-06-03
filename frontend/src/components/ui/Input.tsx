import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, containerClassName, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
          'placeholder:text-slate-400 shadow-sm',
          'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
          'disabled:bg-slate-50 disabled:text-slate-500',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
          className
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});
