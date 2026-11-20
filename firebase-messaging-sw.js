// Service Worker לקבלת התראות פוש (Firebase Cloud Messaging)
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDQdVZy5STaT7oOlzXcH2NbN6eoAIyWNSI",
    authDomain: "home-budget-app-4d311.firebaseapp.com",
    databaseURL: "https://home-budget-app-4d311-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "home-budget-app-4d311",
    storageBucket: "home-budget-app-4d311.firebasestorage.app",
    messagingSenderId: "96787067118",
    appId: "1:96787067118:web:13c2ce5aa7872d193983ff"
});

// הודעות עם שדה notification מוצגות אוטומטית ע"י ה-SDK כשהאפליקציה ברקע.
const messaging = firebase.messaging();

// לחיצה על ההתראה - פתיחת האפליקציה
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.fcmOptions && event.notification.data.FCM_MSG.fcmOptions.link) || self.registration.scope;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus(); }
            return clients.openWindow(url);
        })
    );
});
