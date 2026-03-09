import { create } from 'zustand';

export interface Trip {
    id: string;
    startAddress: string;
    destAddress: string;
    arrivalTime: string;
    status: 'pending' | 'reminded' | 'completed' | 'cancelled';
    recommendedTransit?: 'bus' | 'uber';
    busEtaMinutes?: number;
    uberEtaMinutes?: number;
    departureTime?: string;
    createdAt: string;
}

interface TripState {
    trips: Trip[];
    addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'status'>) => void;
    // We will expand these when backend integration happens.
    // For now, these are just synchronous local operations.
}

export const useTripStore = create<TripState>((set) => ({
    trips: [], // Start empty
    addTrip: (tripData) => {
        // Simulate adding a trip with mock ETAs and a random ID
        const newTrip: Trip = {
            id: Math.random().toString(36).substring(7),
            ...tripData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            // Mocking recommendations for UI demonstration
            recommendedTransit: Math.random() > 0.5 ? 'bus' : 'uber',
            busEtaMinutes: Math.floor(Math.random() * 30) + 15, // 15-45 mins
            uberEtaMinutes: Math.floor(Math.random() * 20) + 10, // 10-30 mins
        };

        // Compute pseudo departure time (arrival - assumed max ETA - buffer)
        // Just mocking roughly 1 hour before arrival for now
        const arrivalDate = new Date(tripData.arrivalTime);
        arrivalDate.setHours(arrivalDate.getHours() - 1);
        newTrip.departureTime = arrivalDate.toISOString();

        set((state) => ({
            trips: [...state.trips, newTrip].sort(
                (a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime()
            ),
        }));
    },
}));
