importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD32139sl-MYBnStg5FsGA5tIXS9wQ15JI",
    authDomain: "adrians-schema.firebaseapp.com",
    projectId: "adrians-schema",
    storageBucket: "adrians-schema.firebasestorage.app",
    messagingSenderId: "956492068542",
    appId: "1:956492068542:web:ee1473b9c1d6ed5a1e90ef"
});

const messaging = firebase.messaging();

// Denna kod lyssnar efter meddelanden när appen ligger i bakgrunden eller är stängd
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Tog emot bakgrundsmeddelande: ', payload);

  // Anpassa vad som ska stå i notisen
  const notificationTitle = payload.notification.title || 'Nytt från Adrian!';
  const notificationOptions = {
    body: payload.notification.body || 'Dags att kolla schemat.',
    icon: '/icon-270.png', // Här används din ikon!
    badge: '/icon-270.png',
    vibrate: [200, 100, 200]
  };

  // Skicka upp notisen på skärmen
  self.registration.showNotification(notificationTitle, notificationOptions);
});