import { z } from 'zod';

export const planTripSchema = z.object({
    startAddress: z.string().min(1, 'Start address is required'),
    destAddress: z.string().min(1, 'Destination address is required'),
    arrivalDate: z.string().min(1, 'Arrival date is required'),
    arrivalTime: z.string().min(1, 'Arrival time is required'),
}).refine((data) => {
    const combined = new Date(`${data.arrivalDate}T${data.arrivalTime}`);
    return !isNaN(combined.getTime()) && combined.getTime() > new Date().getTime();
}, {
    message: 'Arrival time must be in the future',
    path: ['arrivalTime']
});

export type PlanTripFormData = z.infer<typeof planTripSchema>;
