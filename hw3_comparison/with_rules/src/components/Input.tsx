import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: FieldError;
    id: string;
}

export function Input({ label, error, id, className = '', ...rest }: Props) {
    const hasError = Boolean(error);
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
                {label}
            </label>
            <input
                id={id}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${id}-error` : undefined}
                className={[
                    'w-full rounded-xl border bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200',
                    hasError
                        ? 'border-red-400 input-error-glow'
                        : 'border-white/15 hover:border-white/25 input-glow focus:border-violet-400',
                    className,
                ].join(' ')}
                {...rest}
            />
            {hasError && (
                <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
                    {error.message}
                </p>
            )}
        </div>
    );
}
