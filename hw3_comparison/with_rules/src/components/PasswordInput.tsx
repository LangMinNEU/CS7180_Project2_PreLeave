import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';
import { Input } from './Input';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    error?: FieldError;
    id: string;
    showStrength?: boolean;
    watchValue?: string;
}

function getStrength(val: string): { pct: number; color: string; label: string } {
    if (!val) return { pct: 0, color: '#6b7280', label: '' };
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
        { pct: 20, color: '#ef4444', label: 'Weak' },
        { pct: 45, color: '#f97316', label: 'Fair' },
        { pct: 70, color: '#eab308', label: 'Good' },
        { pct: 100, color: '#22c55e', label: 'Strong' },
    ] as const;
    return levels[Math.min(score - 1, 3)] ?? levels[0];
}

export function PasswordInput({
    label,
    error,
    id,
    showStrength = false,
    watchValue = '',
    ...rest
}: Props) {
    const [visible, setVisible] = useState(false);
    const strength = showStrength ? getStrength(watchValue) : null;

    return (
        <div className="flex flex-col gap-1">
            <div className="relative">
                <Input
                    label={label}
                    id={id}
                    type={visible ? 'text' : 'password'}
                    error={error}
                    className="pr-11"
                    {...rest}
                />
                <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-3 top-[34px] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                >
                    {visible ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-5.373-10-7s4.477-7 10-7c1.396 0 2.73.28 3.949.787M6.1 6.1l11.8 11.8M9.9 9.9A3 3 0 0114.1 14.1" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>

            {showStrength && watchValue && strength && (
                <div className="mt-1" aria-live="polite">
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full strength-bar-inner"
                            style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
                        />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: strength.color }}>
                        {strength.label}
                    </p>
                </div>
            )}
        </div>
    );
}
