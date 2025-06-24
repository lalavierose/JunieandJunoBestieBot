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
    where,
    updateDoc,
    serverTimestamp,
    doc, deleteDoc, orderBy, limit
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

async function loadJournal() {
    const userId = auth.currentUser.uid;
    const todayDate = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "mood"), where("ID", "==", userId), where("date", "==", todayDate));
    const querySnapshot = await getDocs(q);

    const container = document.getElementById("dayOverview");
    container.innerHTML = ""; // clear previous content

    if (querySnapshot.empty) {
        container.textContent = "No journal entry for today.";
        return;
    }

    querySnapshot.forEach((docSnap) => {
        const overview = docSnap.data();

        const overviewEl = document.createElement("div");
        overviewEl.classList = "moodJournal";

        // Title
        const title = document.createElement("h2");
        title.textContent = "Today's Overview";
        overviewEl.appendChild(title);

        // Mood
        const mood = document.createElement("p");
        mood.innerHTML = `<strong>Emotional Stress:</strong> ${overview.emotionIntensity || "Not specified"}`;
        overviewEl.appendChild(mood);

        // Intensity
        const intensity = document.createElement("p");
        intensity.innerHTML = `<strong>Physical Stress:</strong> ${overview.physicalIntensity || "N/A"}`;
        overviewEl.appendChild(intensity);

        // Summary
        const summary = document.createElement("p");
        summary.innerHTML = `<strong>Day Summary:</strong> ${overview.daySummary || "No summary provided."}`;
        overviewEl.appendChild(summary);

        // Optional: timestamp
        const time = document.createElement("p");
        time.innerHTML = `<small>${overview.updatedAt?.toDate().toLocaleString() || ""}</small>`;
        overviewEl.appendChild(time);

        container.appendChild(overviewEl);

    });
}


window.authSignOut = function () {
    signOut(auth)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Sign out error:", error);
        });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Logged in as:", user.email);
        loadJournal()
        moodData()
    } else {
        console.log("❌ No user logged in");
        window.location.href = "index.html";
    }
});

async function moodData(){
    const q = query(
        collection(db, "mood"),
        where("ID", "==", auth.currentUser.uid),
        orderBy("date", "asc"),
        limit(30)
    );

    const snapshot = await getDocs(q);

    const data = [];

    snapshot.forEach((doc) =>{
        const entry = doc.data();
        data.push({date: entry.date, moodScore: entry.emotionIntensity});
    });

    drawMoodGraph(data);

}

function drawMoodGraph(){
    const ctx = document.getElementById('myChart');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d=>d.date),
            datasets: [{
                label: 'Mood Over Time',
                data: data.map(d=> d.moodScore),
                borderColor: '#ff6fa1',
                fill: false,
                tension: 0.3,
            }]
        },
        options: {
            scales: {
                y: {
                    suggestedMin: 1,
                    suggestedMax: 10
                }
            }
        }
    });
}