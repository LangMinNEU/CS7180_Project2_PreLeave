import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSchema, AuthFormData } from '../schemas/auth.schema';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [globalError, setGlobalError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema),
    });

    const onSubmit = async (data: AuthFormData) => {
        setGlobalError('');
        try {
            // Mocking async submission behavior
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (data.email === 'wrong@example.com') {
                throw new Error('Invalid credentials');
            }

            // Mock success logic here later
            console.log('Success!', data);
        } catch (error: any) {
            setGlobalError(error.message || 'Invalid credentials');
        }
    };

    const toggleMode = () => {
        setIsLogin((prev) => !prev);
        reset();
        setGlobalError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 fade-in">
            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl shadow-black/40 slide-up border border-slate-800">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300 mb-2">
                        PreLeave
                    </h1>
                    <h2 className="text-2xl font-bold text-textMain tracking-tight">
                        {isLogin ? 'Login to your account' : 'Register a new account'}
                    </h2>
                    <p className="text-textMuted mt-2 text-sm">
                        {isLogin
                            ? 'Welcome back! Please enter your details.'
                            : 'Sign up to start planning your perfect departure.'}
                    </p>
                </div>

                {globalError && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/50 rounded-lg text-error text-sm text-center font-medium animate-pulse">
                        {globalError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMain" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-textMain placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-error text-xs font-semibold mt-1 flex items-center">
                                <span>!</span> <span className="ml-1">{errors.email.message}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMain" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-textMain placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-error text-xs font-semibold mt-1 flex items-center">
                                <span>!</span> <span className="ml-1">{errors.password.message}</span>
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primaryHover text-white font-semibold flex justify-center items-center transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                        ) : (
                            isLogin ? 'Login' : 'Sign Up'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-textMuted">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="text-primary hover:text-blue-300 font-semibold transition-colors focus:outline-none focus:underline"
                    >
                        {isLogin ? 'Sign up' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
}
