import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const HERE_API_KEY = process.env.HERE_API_KEY;

if (!HERE_API_KEY) {
    console.error('HERE_API_KEY is not defined in the environment variables.');
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface TransitInfo {
    etaMinutes: number;
    routeOptions?: any;
}

/**
 * Geocodes an address string to coordinates using HERE Geocoding API.
 */
export const geocodeAddress = async (address: string): Promise<Coordinates> => {
    if (!HERE_API_KEY) throw new Error('HERE_API_KEY missing');

    const url = new URL('https://geocode.search.hereapi.com/v1/geocode');
    url.searchParams.append('q', address);
    url.searchParams.append('apiKey', HERE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error(`Address not found: ${address}`);
    }

    const position = data.items[0].position;
    return {
        lat: position.lat,
        lng: position.lng,
    };
};

/**
 * Gets the ETA in minutes for a specific transport mode and arrival time using HERE Routing API v8.
 */
const getEta = async (origin: Coordinates, dest: Coordinates, arrivalTime: Date, transportMode: 'car' | 'pedestrian' | 'publicTransit'): Promise<number> => {
    if (!HERE_API_KEY) throw new Error('HERE_API_KEY missing');

    const url = new URL('https://router.hereapi.com/v8/routes');
    url.searchParams.append('origin', `${origin.lat},${origin.lng}`);
    url.searchParams.append('destination', `${dest.lat},${dest.lng}`);
    url.searchParams.append('transportMode', transportMode);

    // Format arrivalTime to ISO string required by HERE API (e.g., 2026-03-10T15:30:00+02:00)
    // Using simple toISOString, making sure it encodes properly.
    url.searchParams.append('arrivalTime', arrivalTime.toISOString());
    url.searchParams.append('return', 'summary');
    url.searchParams.append('apiKey', HERE_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
        // Some routes may not be possible (e.g. public transit across ocean relative to time).
        // Better to return a fallback or throw a specific error depending on status.
        if (response.status === 204 || response.status === 400 || response.status === 404) {
            throw new Error(`No route found for ${transportMode}`);
        }
        throw new Error(`Routing failed for ${transportMode}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
        throw new Error(`No route found for ${transportMode}`);
    }

    // The duration is in seconds. Convert to minutes.
    const durationSeconds = data.routes[0].sections.reduce((acc: number, section: any) => acc + section.summary.duration, 0);
    return Math.ceil(durationSeconds / 60);
};

export const getCarEta = async (origin: Coordinates, dest: Coordinates, arrivalTime: Date): Promise<number> => {
    return getEta(origin, dest, arrivalTime, 'car');
};

export const getTransitEta = async (origin: Coordinates, dest: Coordinates, arrivalTime: Date): Promise<number> => {
    return getEta(origin, dest, arrivalTime, 'publicTransit');
};
