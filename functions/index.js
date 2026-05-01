const functionsV1 = require('firebase-functions/v1');
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const APP_ID = 'test-schema-v2';

// ============================================================================
// 🛠️ HJÄLPFUNKTION: Skickar notis till ALLA anslutna enheter
// ============================================================================
async function sendToAdrian(title, body) {
    try {
        const tokenDoc = await db.doc(`artifacts/gaming-schema-app-light/public/data/device_tokens/adrians_telefon`).get();
        
        if (tokenDoc.exists) {
            const data = tokenDoc.data();
            const tokens = data.tokens; 

            if (tokens && Array.isArray(tokens) && tokens.length > 0) {
                console.log(`Försöker skicka till ${tokens.length} enheter...`);
                
                const messages = tokens.map(t => ({
                    token: t,
                    notification: { title: title, body: body },
                    // VIKTIGT: Denna del väcker Android-telefonen när den ligger i fickan!
                    android: {
                        priority: 'high',
                        notification: { sound: 'default' }
                    },
                    webpush: { notification: { icon: '/icon-270.png' } }
                }));

                const response = await admin.messaging().sendEach(messages);
                console.log("Svar från Google Firebase:", JSON.stringify(response));
                return response;
            }
        }
        
        console.log("Kunde inte skicka notis. Hittade ingen lista med tokens.");
        return null;
    } catch (error) {
        console.error("Kritiskt fel vid skickande av notis:", error);
        return null;
    }
}

// ============================================================================
// 1. KLOCKAN: Kollar schemat varje minut och skickar larm (V2)
// ============================================================================
exports.checkScheduleAndNotify = onSchedule({
  schedule: "* * * * *",
  timeZone: "Europe/Stockholm"
}, async (event) => {
  const now = Date.now();
  
  // Hämtar schemat (använder test-schema-v2 precis som i din React-kod)
  const scheduleSnap = await db.collection('artifacts/test-schema-v2/public/data/schedule_items').get();
  const notificationsToSend = [];

  scheduleSnap.forEach((doc) => {
    const activity = doc.data();
    if (!activity.startTime) return;

    const prepStart = activity.startTime - ((activity.prepTime || 0) * 60000);
    const startDiff = activity.startTime - now;
    const prepDiff = prepStart - now;

    // Kollar om aktiviteten startar inom 60 sekunder
    const isStartTime = startDiff > 0 && startDiff <= 60000;
    const isPrepTime = activity.prepTime > 0 && prepDiff > 0 && prepDiff <= 60000;

    if (isPrepTime) {
      notificationsToSend.push({ title: "Snart dags! ⏳", body: `Förbered dig för: ${activity.title}` });
    } else if (isStartTime) {
      notificationsToSend.push({ title: "Dags nu! 🚨", body: `Nu börjar: ${activity.title}` });
    }
  });

  // Skickar larmen med din egna hjälpfunktion!
  for (const notif of notificationsToSend) {
    await sendToAdrian(notif.title, notif.body); 
  }

  return null;
});

// ============================================================================
// 2. DOPAMIN: Notis när ett NYTT UPPDRAG läggs till (V1)
// ============================================================================
exports.onNewTask = functionsV1.firestore
    .document(`artifacts/${APP_ID}/public/data/schedule_items/{itemId}`)
    .onCreate(async (snap, context) => {
        const task = snap.data();
        let title = "📅 Nytt uppdrag!";
        let body = `Du har ett nytt uppdrag: ${task.title}. In och kika!`;

        if (task.isLiveEvent) {
            title = "🚨 LIVE EVENT ALERT!";
            body = "Ett Steal a brainroth-event har dykt upp! Skynda dig in i appen!";
        }
        return sendToAdrian(title, body);
    });

// ============================================================================
// 3. KA-CHING: Notis när banken uppdateras (V1)
// ============================================================================
exports.onBankUpdate = functionsV1.firestore
    .document(`artifacts/${APP_ID}/public/data/bank/adrian`)
    .onUpdate(async (change, context) => {
        const oldData = change.before.data();
        const newData = change.after.data();

        if (newData.balance > oldData.balance) {
            const diff = newData.balance - oldData.balance;
            return sendToAdrian(
                "💰 Ka-ching! Ny insättning!", 
                `Du fick precis +${diff} kr! Ditt nya saldo är ${newData.balance} kr.`
            );
        }

        if (newData.dailyMessage && newData.dailyMessage !== oldData.dailyMessage) {
            const adminName = newData.adminName || "Din kompis";
            return sendToAdrian(
                `💬 Meddelande från ${adminName}`, 
                newData.dailyMessage
            );
        }
        return null;
    });

// ============================================================================
// 4. INBOX: Notis när Admin skickar vanligt meddelande (V1)
// ============================================================================
exports.onNewMessage = functionsV1.firestore
    .document(`artifacts/${APP_ID}/public/data/messages/{msgId}`)
    .onCreate(async (snap, context) => {
        const msg = snap.data();
        if (msg.text && msg.text.includes("har köpt:")) return null; 
        return sendToAdrian("📬 Nytt meddelande!", msg.text);
    });
    // ============================================================================
// 5. TRÄNINGSPÅMINNELSE: Skickas varje eftermiddag (kl 15:30)
// ============================================================================
exports.dailyTrainingReminder = onSchedule({
  schedule: "30 15 * * *", // Körs 15:30 varje dag
  timeZone: "Europe/Stockholm"
}, async (event) => {
  
  // Vi lägger in flera olika texter så det inte blir tjatigt!
  const titles = ["Dags att levla upp! 🚀", "Hjärngympa! 🧠", "Speldags! 🎮", "W Rizz väntar! 😎"];
  const bodies = [
    "Hoppa in och testa ett spel och pröva dina färdigheter!",
    "Dina badges väntar på dig! In och kör lite Ord-Detektiv eller Mening-Fixare.",
    "Har du hållit din tränings-streak vid liv idag? Gå in och kör en runda!",
    "Dags för lite AFK-träning. Visa vem som är bossen över månaderna!"
  ];
  
  // Välj en slumpmässig text
  const randomIdx = Math.floor(Math.random() * titles.length);
  
  console.log("Skickar daglig träningspåminnelse...");
  return sendToAdrian(titles[randomIdx], bodies[randomIdx]);
});

// ============================================================================
// 6. SMART STREAK-RÄDDARE: Kollar kl 19:00 om han glömt träna
// ============================================================================
exports.smartStreakReminder = onSchedule({
  schedule: "0 19 * * *", // Körs 19:00 varje dag
  timeZone: "Europe/Stockholm"
}, async (event) => {
  try {
    const bankDoc = await db.doc(`artifacts/${APP_ID}/public/data/bank/adrian`).get();
    
    if (bankDoc.exists) {
      const data = bankDoc.data();
      
      // Eftersom React-klienten sparar datumet som midnatt (lokal tid)
      // skapar vi samma tidsstämpel här för att jämföra.
      const now = new Date();
      // Konvertera till svensk tidszon för säkerhets skull
      const swedishTimeStr = now.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" });
      const swedishDate = new Date(swedishTimeStr);
      swedishDate.setHours(0, 0, 0, 0);
      const todayMs = swedishDate.getTime();
      
      // Om hans senast sparade träningstid INTE är idag...
      if (data.lastTrainingDate !== todayMs && data.trainingStreak > 0) {
        console.log("Adrian har inte tränat idag! Skickar streak-varning.");
        return sendToAdrian(
          "⚠️ Rädda din Streak!", 
          `Din streak på ${data.trainingStreak} 🔥 håller på att brytas! Gå in och kör en snabb runda innan dagen är slut.`
        );
      } else {
        console.log("Adrian har redan tränat idag. Skickar ingen varning.");
      }
    }
  } catch (error) {
    console.error("Fel vid smart streak reminder:", error);
  }
  return null;
});