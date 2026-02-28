import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { useAuthStore } from './auth.store';

type Tab = 'login' | 'signup';

export function AuthPage() {
    const [tab, setTab] = useState<Tab>('login');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const { isAuthenticated, user, clearAuth } = useAuthStore();

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleLoginSuccess = () => {
        showToast('Welcome back! You are now logged in.');
    };

    const handleSignupSuccess = () => {
        showToast('Account created successfully! Welcome aboard 🎉');
        setTimeout(() => setTab('login'), 1800);
    };

    if (isAuthenticated && user) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6 bg-animated">
                <Orbs />
                <section
                    className="glass-card w-full max-w-md rounded-3xl p-10 animate-slide-up text-center"
                    aria-label="Authenticated dashboard"
                >
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-400 text-3xl shadow-lg shadow-violet-500/40">
                            ✦
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">You're signed in!</h1>
                    <p className="mt-2 text-sm text-white/55">Logged in as <span className="text-violet-300 font-medium">{user.email}</span></p>
                    <p className="mt-4 text-xs text-white/40 italic">
                        (Access token is stored in-memory via Zustand — never in localStorage)
                    </p>
                    <button
                        onClick={clearAuth}
                        className="mt-8 w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/12 transition-all cursor-pointer"
                    >
                        Log Out
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6 bg-animated">
            <Orbs />

            <section
                className="glass-card w-full max-w-md rounded-3xl p-8 md:p-10 animate-slide-up"
                aria-label="Authentication"
            >
                {/* Logo */}
                <header className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl shadow-lg shadow-violet-500/40">
                        ✦
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">PreLeave</h1>
                    <p className="mt-1 text-sm text-white/45">Your smart departure assistant</p>
                </header>

                {/* Tabs */}
                <nav aria-label="Authentication options" className="mb-8">
                    <div
                        role="tablist"
                        className="flex gap-1 rounded-xl bg-white/6 p-1"
                    >
                        {(['login', 'signup'] as const).map((t) => (
                            <button
                                key={t}
                                role="tab"
                                id={`tab-${t}`}
                                aria-selected={tab === t}
                                aria-controls={`panel-${t}`}
                                onClick={() => setTab(t)}
                                className={[
                                    'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer',
                                    tab === t
                                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/40'
                                        : 'text-white/50 hover:text-white/75',
                                ].join(' ')}
                            >
                                {t === 'login' ? 'Log In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Form panels */}
                <div
                    id="panel-login"
                    role="tabpanel"
                    aria-labelledby="tab-login"
                    hidden={tab !== 'login'}
                    className="animate-fade-in"
                >
                    <LoginForm onSuccess={handleLoginSuccess} />
                    <p className="mt-6 text-center text-xs text-white/40">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => setTab('signup')}
                            className="text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                        >
                            Sign up free
                        </button>
                    </p>
                </div>

                <div
                    id="panel-signup"
                    role="tabpanel"
                    aria-labelledby="tab-signup"
                    hidden={tab !== 'signup'}
                    className="animate-fade-in"
                >
                    <SignUpForm onSuccess={handleSignupSuccess} />
                    <p className="mt-6 text-center text-xs text-white/40">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => setTab('login')}
                            className="text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                        >
                            Log in
                        </button>
                    </p>
                </div>

                {/* Divider + OAuth stub */}
                <div className="mt-6 flex items-center gap-3 text-xs text-white/25">
                    <span className="flex-1 h-px bg-white/10" />
                    or continue with
                    <span className="flex-1 h-px bg-white/10" />
                </div>
                <button
                    type="button"
                    aria-label="Continue with Google (not available in demo)"
                    onClick={() => showToast('Google OAuth is stubbed — see auth.service.ts TODO: v2', 'error')}
                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white/65 hover:bg-white/10 transition-all cursor-pointer"
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.4C9.8 35.7 16.4 44 24 44z" />
                        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41.5 35.1 44 30 44 24c0-1.3-.1-2.7-.4-3.9z" />
                    </svg>
                    Continue with Google
                </button>
            </section>

            {/* Toast notification */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className={[
                        'fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 rounded-full border px-5 py-3 text-sm backdrop-blur-xl shadow-2xl toast-enter',
                        toast.type === 'success'
                            ? 'border-emerald-500/30 bg-slate-900/90 text-emerald-300'
                            : 'border-red-500/30 bg-slate-900/90 text-red-300',
                    ].join(' ')}
                >
                    <span aria-hidden="true">{toast.type === 'success' ? '✓' : '✕'}</span>
                    {toast.message}
                </div>
            )}
        </main>
    );
}

function Orbs() {
    return (
        <>
            <div
                className="orb"
                style={{ width: 420, height: 420, background: 'radial-gradient(circle, #7c6ef7, transparent)', top: -140, left: -100 }}
                aria-hidden="true"
            />
            <div
                className="orb"
                style={{ width: 340, height: 340, background: 'radial-gradient(circle, #22c55e, transparent)', bottom: -120, right: -80 }}
                aria-hidden="true"
            />
        </>
    );
}
