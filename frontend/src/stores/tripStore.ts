import { create } from 'zustand';
import * as tripService from '../services/tripService';

export interface Trip {
    id: string;
    userId: string;
    startAddress: string;
    startLat?: number | null;
    startLng?: number | null;
    destAddress: string;
    destLat?: number | null;
    destLng?: number | null;
    requiredArrivalTime: string;
    reminderLeadMinutes: number;
    status: 'pending' | 'reminded' | 'completed' | 'cancelled';
    recommendedTransit?: 'bus' | 'car' | null;
    selectedTransit?: 'bus' | 'car' | null;
    busEtaMinutes?: number | null;
    carEtaMinutes?: number | null;
    bufferMinutes?: number;
    busLeaveBy?: string | null;
    carLeaveBy?: string | null;
    departureTime?: string | null;
    createdAt: string;
}

interface TripState {
    upcomingTrips: Trip[];
    historyTrips: Trip[];
    currentTrip: Trip | null;
    isLoading: boolean;
    error: string | null;
    fetchTrips: () => Promise<void>;
    fetchTrip: (id: string) => Promise<void>;
    selectTransit: (id: string, mode: string) => Promise<void>;
    addTrip: (tripData: Omit<Trip, 'id' | 'createdAt' | 'status' | 'userId' | 'requiredArrivalTime' | 'reminderLeadMinutes'> & { arrivalTime: string, reminderLeadMinutes?: number }) => Promise<{ success: boolean; error?: string; field?: string; data?: Trip }>;
    deleteTrip: (id: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set) => ({
    upcomingTrips: [],
    historyTrips: [],
    currentTrip: null,
    isLoading: false,
    error: null,
    fetchTrips: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripService.getTrips();
            if (response.success) {
                set({
                    upcomingTrips: response.data.upcoming,
                    historyTrips: response.data.history,
                    isLoading: false
                });
            } else {
                set({ error: response.error || 'Failed to fetch trips', isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.response?.data?.error || 'Failed to fetch trips', isLoading: false });
        }
    },
    fetchTrip: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripService.getTrip(id);
            if (response.success && response.data) {
                set({ currentTrip: response.data, isLoading: false });
            } else {
                set({ error: response.error || 'Failed to fetch trip details', isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.response?.data?.error || 'Failed to fetch trip details', isLoading: false });
        }
    },
    selectTransit: async (id: string, mode: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripService.updateTripTransit(id, mode);
            if (response.success && response.data) {
                set({ currentTrip: response.data, isLoading: false });
                const store = useTripStore.getState();
                await store.fetchTrips();
            } else {
                set({ error: response.error || 'Failed to update transit mode', isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.response?.data?.error || 'Failed to update transit mode', isLoading: false });
        }
    },
    addTrip: async (tripData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripService.createTrip({
                startAddress: tripData.startAddress,
                destAddress: tripData.destAddress,
                arrivalTime: new Date(tripData.arrivalTime).toISOString(),
                reminderLeadMinutes: tripData.reminderLeadMinutes || 60,
            });
            if (response.success && response.data) {
                // To keep it simple, just re-fetch all trips after adding instead of doing logic locally
                set({ isLoading: false, currentTrip: response.data });
                const store = useTripStore.getState();
                await store.fetchTrips();
                return { success: true, data: response.data };
            } else {
                set({ error: response.error || 'Failed to create trip', isLoading: false });
                return { success: false, error: response.error || 'Failed to create trip', field: response.field };
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to create trip';
            const errorField = err.response?.data?.field;
            set({ error: errorMsg, isLoading: false });
            return { success: false, error: errorMsg, field: errorField };
        }
    },
    deleteTrip: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await tripService.deleteTrip(id);
            if (response.success) {
                set({ isLoading: false });
                const store = useTripStore.getState();
                await store.fetchTrips();
            } else {
                set({ error: response.error || 'Failed to delete trip', isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.response?.data?.error || 'Failed to delete trip', isLoading: false });
        }
    },
}));
