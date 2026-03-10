import api from './api';

// Convert base64 VAPID public key to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const registerAndSubscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported.');
        return;
    }

    try {
        // 1. Register Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        // 2. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission denied.');
            return;
        }

        // 3. Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        // 4. Subscribe if none exists
        if (!subscription) {
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) {
                console.error('VAPID public key not found in env vars');
                return;
            }

            const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
            console.log('Subscribed to Push notifications');
        }

        // 5. Send subscription to backend
        await api.post('/users/setup-push', { subscription });
        console.log('Push subscription sent to backend successfully');

    } catch (error) {
        console.error('Error during service worker registration or push subscription:', error);
    }
};
