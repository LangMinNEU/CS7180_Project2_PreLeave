import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';

export default function NotificationToast() {
    const [notifications, setNotifications] = useState<{ id: string; title: string; body: string }[]>([]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                const newNotification = {
                    id: Date.now().toString() + Math.random(),
                    title: event.data.title,
                    body: event.data.body,
                };
                setNotifications(prev => [...prev, newNotification]);
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
        }

        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            }
        };
    }, []);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            {notifications.map((notif) => (
                <div key={notif.id} className="bg-white border rounded-lg shadow-2xl p-4 max-w-sm w-80 flex items-start flex-col relative transition-all duration-300 transform translate-x-0">
                    <button
                        onClick={() => removeNotification(notif.id)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent hover:bg-gray-100 rounded-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-start gap-3 w-full mt-1">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-0.5">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div className="pr-4 flex-1">
                            <h4 className="text-base font-bold text-gray-900 leading-tight">{notif.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 leading-snug">{notif.body}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
