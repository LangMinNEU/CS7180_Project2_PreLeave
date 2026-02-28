import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpFormData } from '../../schemas/auth.schema';
import { Input } from '../../components/Input';
import { PasswordInput } from '../../components/PasswordInput';
import { Button } from '../../components/Button';
import { useAuthStore } from './auth.store';

interface Props {
    onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: Props) {
    const setAuth = useAuthStore((s) => s.setAuth);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
    });

    const passwordValue = watch('password', '');

    const onSubmit = async (data: SignUpFormData) => {
        // Simulate POST /api/auth/register — replace with real Axios call
        await new Promise((r) => setTimeout(r, 1200));
        setAuth('mock-access-token', { id: '1', email: data.email });
        onSuccess?.();
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Sign up form"
            className="flex flex-col gap-5"
        >
            <Input
                id="signup-fullname"
                label="Full name"
                type="text"
                placeholder="Jane Doe"
                autoComplete="name"
                error={errors.fullName}
                {...register('fullName')}
            />

            <Input
                id="signup-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email}
                {...register('email')}
            />

            <PasswordInput
                id="signup-password"
                label="Password"
                placeholder="min. 8 characters"
                autoComplete="new-password"
                error={errors.password}
                showStrength
                watchValue={passwordValue}
                {...register('password')}
            />

            <PasswordInput
                id="signup-confirm"
                label="Confirm password"
                placeholder="Repeat password"
                autoComplete="new-password"
                error={errors.confirmPassword}
                {...register('confirmPassword')}
            />

            <label className="flex items-start gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    id="signup-terms"
                    aria-describedby={errors.agreeTerms ? 'terms-error' : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/8 accent-violet-500 cursor-pointer"
                    {...register('agreeTerms')}
                />
                <span className="text-xs text-white/55 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-violet-400 hover:text-violet-300 underline">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-violet-400 hover:text-violet-300 underline">
                        Privacy Policy
                    </a>
                </span>
            </label>
            {errors.agreeTerms && (
                <p id="terms-error" role="alert" className="text-xs text-red-400 -mt-3">
                    {errors.agreeTerms.message}
                </p>
            )}

            <Button type="submit" isLoading={isSubmitting}>
                {isSubmitting ? 'Creating Account…' : 'Create Account'}
            </Button>
        </form>
    );
}
