self.addEventListener('push', function (event) {
    let title = 'PreLeave Trip Reminder';
    let options = {
        body: 'It is time to leave!',
        icon: '/vite.svg', // Replace with your app logo if you have one
        badge: '/vite.svg',
        data: { url: '/' }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            if (data.title) title = data.title;
            options.body = data.body || options.body;
            if (data.url) options.data.url = data.url;
        } catch (e) {
            options.body = event.data.text();
        }
    }

    // Send message to open client windows to trigger in-app toast
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'PUSH_NOTIFICATION',
                    title: title,
                    body: options.body
                });
            });
            // Also show native notification
            return self.registration.showNotification(title, options);
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    // Open the target URL
    const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;
        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
            }
        }

        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
