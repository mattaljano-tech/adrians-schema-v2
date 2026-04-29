import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging, isSupported } from "firebase/messaging"; // <--- Lade till isSupported

const firebaseConfig = {
  apiKey: "AIzaSyD32139sl-MYBnStg5FsGA5tIXS9wQ15JI",
  authDomain: "adrians-schema.firebaseapp.com",
  projectId: "adrians-schema",
  storageBucket: "adrians-schema.firebasestorage.app",
  messagingSenderId: "956492068542",
  appId: "1:956492068542:web:ee1473b9c1d6ed5a1e90ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Aktiverar P&P:s smarta Offline-läge!
try {
  enableIndexedDbPersistence(db);
} catch (err) {
  console.log("Offline-läge kunde inte aktiveras just nu", err);
}

export { db };

// --- SÄKER INLÄSNING AV NOTISER ---
// Om enheten stöder notiser, aktivera det. Annars, låt bli (så appen inte kraschar).
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});