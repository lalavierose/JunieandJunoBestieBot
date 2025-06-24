import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB-qQP6MciVV7dKTeeu-JoBnjOjFki_8wg",
    authDomain: "junebestiebot.firebaseapp.com",
    projectId: "junebestiebot",
    storageBucket: "junebestiebot.firebasestorage.app",
    messagingSenderId: "377203530674",
    appId: "1:377203530674:web:2443d67ec3430f73e662ab",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Load events from Firestore
async function loadFirestoreEvents(userId, monthCal, dayCal) {
    const q = query(
        collection(db, "events"),
        where("ID", "==", userId)
    );

    try {
        const snapshot = await getDocs(q);
        const events = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.title && data.timestamp) {
                events.push({
                    title: data.title,
                    start: data.timestamp,
                    extendedProps: {
                        emotion: data.emotion || "none"
                    }
                });
            }
        });

        // Add to both calendars
        if (monthCal) monthCal.addEventSource(events);
        if (dayCal) dayCal.addEventSource(events);
    } catch (err) {
        console.error("❌ Failed to load events:", err);
    }
}

// Sign out
window.authSignOut = function () {
    signOut(auth)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
};

// Wait until DOM and auth are ready
document.addEventListener('DOMContentLoaded', function () {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        // Month view calendar
        const calendarEl = document.getElementById('calendar');
        const monthCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'timeGridWeek,dayGridMonth',
                center: 'title'
            }
        });
        monthCalendar.render();

        // Day view calendar
        const dayCalendarEl = document.getElementById('dayView');
        const dayCalendar = new FullCalendar.Calendar(dayCalendarEl, {
            initialView: 'timeGridDay',
            headerToolbar: {
                right: 'prev,next',
                center: 'today'
            }
        });
        dayCalendar.render();

        // Load events into both
        await loadFirestoreEvents(user.uid, monthCalendar, dayCalendar);
    });
});
