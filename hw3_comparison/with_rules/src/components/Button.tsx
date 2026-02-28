import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    isLoading?: boolean;
    variant?: 'primary' | 'ghost';
}

export function Button({
    children,
    isLoading = false,
    variant = 'primary',
    className = '',
    disabled,
    ...rest
}: Props) {
    const base =
        'w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer';

    const variants = {
        primary:
            'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        ghost:
            'border border-white/15 bg-white/8 text-white/80 hover:bg-white/12 hover:border-white/25 disabled:opacity-60 disabled:cursor-not-allowed',
    };

    return (
        <button
            disabled={disabled ?? isLoading}
            aria-busy={isLoading}
            className={[base, variants[variant], className].join(' ')}
            {...rest}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    {children}
                </span>
            ) : (
                children
            )}
        </button>
    );
}
