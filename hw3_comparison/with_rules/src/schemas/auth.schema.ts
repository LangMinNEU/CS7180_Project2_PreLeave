import { z } from 'zod';

// FR-01: bcrypt cost >= 12 enforced server-side; client validates >= 8 chars + complexity
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

export const signUpSchema = z
    .object({
        fullName: z
            .string()
            .min(1, 'Full name is required')
            .min(2, 'Name must be at least 2 characters'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Enter a valid email address'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
        // Zod v4: use message string directly, not errorMap object
        agreeTerms: z.literal(true, 'You must accept the Terms of Service'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
