import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../../schemas/auth.schema';
import { Input } from '../../components/Input';
import { PasswordInput } from '../../components/PasswordInput';
import { Button } from '../../components/Button';
import { useAuthStore } from './auth.store';

interface Props {
    onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: Props) {
    const setAuth = useAuthStore((s) => s.setAuth);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        // Simulate POST /api/auth/login — replace with real Axios call
        await new Promise((r) => setTimeout(r, 1200));
        // Stub: store mock token in memory only (never localStorage)
        setAuth('mock-access-token', { id: '1', email: data.email });
        onSuccess?.();
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Log in form"
            className="flex flex-col gap-5"
        >
            <Input
                id="login-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email}
                {...register('email')}
            />

            <div className="flex flex-col gap-1">
                <PasswordInput
                    id="login-password"
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password}
                    {...register('password')}
                />
                <div className="flex justify-end">
                    <a
                        href="#"
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                        Forgot password?
                    </a>
                </div>
            </div>

            <Button type="submit" isLoading={isSubmitting}>
                {isSubmitting ? 'Logging in…' : 'Log In'}
            </Button>
        </form>
    );
}
