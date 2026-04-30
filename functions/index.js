const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Starta koppling till din databas
admin.initializeApp();

// Denna funktion körs automatiskt VARJE MINUT (* * * * *)
exports.checkScheduleAndNotify = functions.pubsub
  .schedule("* * * * *")
  .timeZone("Europe/Stockholm")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();

    // 1. Hämta Adrians specifika Android-token
    const tokenDoc = await db.doc('artifacts/gaming-schema-app-light/public/data/device_tokens/adrians_telefon').get();
    
    if (!tokenDoc.exists) {
      console.log("Hittade ingen sparad mobil (token).");
      return null;
    }
    
    const tokens = tokenDoc.data().tokens;
    if (!tokens || tokens.length === 0) return null;
    const androidToken = tokens[tokens.length - 1]; // Tar den senast sparade tokenen

    // 2. Hämta schemat
    const scheduleSnap = await db.collection('artifacts/test-schema-v2/public/data/schedule_items').get();
    const notificationsToSend = [];

    scheduleSnap.forEach((doc) => {
      const activity = doc.data();
      if (!activity.startTime) return;

      const prepStart = activity.startTime - ((activity.prepTime || 0) * 60000);
      
      // Räkna ut hur många millisekunder det är kvar
      const startDiff = activity.startTime - now;
      const prepDiff = prepStart - now;

      // Eftersom funktionen körs varje minut, kollar vi om aktiviteten 
      // startar inom de kommande 60 sekunderna.
      const isStartTime = startDiff > 0 && startDiff <= 60000;
      const isPrepTime = activity.prepTime > 0 && prepDiff > 0 && prepDiff <= 60000;

      if (isPrepTime) {
        notificationsToSend.push({
          title: "Snart dags! ⏳",
          body: `Förbered dig för: ${activity.title}`
        });
      } else if (isStartTime) {
        notificationsToSend.push({
          title: "Dags nu! 🚨",
          body: `Nu börjar: ${activity.title}`
        });
      }
    });

    // 3. Skicka iväg notiserna via Firebase Cloud Messaging
    for (const notif of notificationsToSend) {
      try {
        await admin.messaging().send({
          token: androidToken,
          notification: {
            title: notif.title,
            body: notif.body,
          },
          android: {
            priority: 'high', // Tvingar Android att vakna ur strömspar-läge
            notification: {
              sound: 'default'
            }
          }
        });
        console.log("Skickade push-notis:", notif.title);
      } catch (error) {
        console.error("Kunde inte skicka notis:", error);
      }
    }

    return null;
  });