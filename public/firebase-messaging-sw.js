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

  // HÄR ÄR ÄNDRINGEN: Vi har raderat koden som byggde notisen manuellt.
  // Eftersom servern/Cloud funktionen skickar ett äkta "notification"-paket
  // så bygger Firebase automatiskt en notis åt dig. Om vi har kvar koden här
  // får du dubbla notiser!
});