import { z } from 'zod';

export const planTripSchema = z.object({
    startAddress: z.string().min(1, 'Start address is required'),
    destAddress: z.string().min(1, 'Destination address is required'),
    arrivalTime: z.string().min(1, 'Arrival time is required').refine((val) => {
        const selectedTime = new Date(val).getTime();
        const currentTime = new Date().getTime();
        return selectedTime > currentTime;
    }, 'Arrival time must be in the future'),
});

export type PlanTripFormData = z.infer<typeof planTripSchema>;
