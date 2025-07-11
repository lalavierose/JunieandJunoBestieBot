import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    updateProfile,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc, setDoc,
    getDocs, getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
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
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

function authCreateAccountWithEmail() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("passwordUp").value;
    const name = document.getElementById("userName").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            updateProfile(auth.currentUser, {
                displayName: name,
            }).then(() => {
                document.getElementById("errorMsg").innerHTML = "User Created Successfully";
                window.location.href = "home.html";
            });
        })
        .catch((error) => {
            document.getElementById("errorMsg").innerHTML = error.message;
        });
}

function authSignInWithEmail() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("passwordIn").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            document.getElementById("errorMsg").innerHTML = "Signed In Successfully";
            window.location.href = "home.html";
        })
        .catch((error) => {
            document.getElementById("errorMsg").innerHTML = error.message;
        });
}

function authSignOut() {
    signOut(auth)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.log(error);
        });
}

function authSignInWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            document.getElementById("errorMsg").innerHTML = "User Login Successfully";
            window.location.href = "home.html";
        })
        .catch((error) => {
            document.getElementById("errorMsg").innerHTML = error.message;
        });
}

window.authCreateAccountWithEmail = authCreateAccountWithEmail;
window.authSignInWithEmail = authSignInWithEmail;
window.authSignOut = authSignOut;
window.authSignInWithGoogle = authSignInWithGoogle;

// Handle user sending message
async function outGoingMessageHuman() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();

    if (message === "") return;

    // Display it in the chat
    const div = document.createElement("div");
    div.classList.add("messageBubble", "human");

    const h3 = document.createElement("h3");
    h3.classList.add("messageContent");
    h3.textContent = message;

    div.appendChild(h3);
    document.getElementById("chatArea").appendChild(div);
    input.value = "";

    const chatArea = document.getElementById("chatArea");
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        await addDoc(collection(db, "messages"), {
            name: auth.currentUser.displayName,
            message: message,
            ID: auth.currentUser.uid,
            TO: "Juno",
            WHO: "Human",
            time: serverTimestamp(),
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }

    getBotReply(message);
    addToHistory("user", message);
}

function outGoingMessagesBot(response) {
    const div = document.createElement("div");
    div.classList.add("messageBubble", "bot");

    const h3 = document.createElement("h3");
    h3.classList.add("messageContent");
    h3.textContent = response;

    div.appendChild(h3);
    document.getElementById("chatArea").appendChild(div);

    const chatArea = document.getElementById("chatArea");
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function getBotReply(prompt) {

    const container = document.getElementById("chatArea");

    const thinkingBubble = document.createElement("div");
    thinkingBubble.className = "bot-bubble thinking";
    thinkingBubble.innerHTML = `
  <span class="dot"></span>
  <span class="dot"></span>
  <span class="dot"></span>
`;

    container.appendChild(thinkingBubble);

// Then, after 2 seconds (or when your bot finishes thinking), remove it:
    setTimeout(() => {
        thinkingBubble.remove();
    }, 3000);

    const chatArea = document.getElementById("chatArea");
    chatArea.scrollTop = chatArea.scrollHeight;

    const twin = "juno";
    const userId = auth.currentUser.uid;

    try {
        const res = await fetch("https://junieandjunobestiebot.onrender.com/api/genai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, twin, userId, history: shortTermHistory }),
        });

        const data = await res.json();
        const reply = data.reply|| "No reply received.";
        const jsonData = data.json || null;
        const infoJSON = data.info || null;

        console.log(infoJSON)
        console.log(jsonData)

        outGoingMessagesBot(reply);

        await addDoc(collection(db, "messages"), {
            message: reply,
            ID: auth.currentUser.uid,
            WHO: "Juno",
            time: serverTimestamp(),
        });

        try {
            if (jsonData) {
                console.log("Structured data to save:", jsonData);
                const {event, list, mood} = jsonData;

                if (event && event.title && event.timestamp ){
                    await addDoc(collection(db, "events"),{
                        ID: auth.currentUser.uid,
                        title: event.title,
                        timestamp: event.timestamp,
                        emotion: event.emotion,
                        createdAt: serverTimestamp()
                    })
                }

                if(list && list.title && Array.isArray(list.tasks)){
                    const listQuery = query(
                        collection(db, "lists"),
                        where("ID", "==", userId),
                        where("title", "==", list.title)
                    );

                    const listSnap = await getDocs(listQuery);

                    if(!listSnap.empty){
                        const listDoc = listSnap.docs[0];
                        const oldTasks = listDoc.data().tasks ?? [];
                        const newTasks = [...new Set([...oldTasks, ...list.tasks])];
                        await setDoc(doc(db, "lists", listDoc.id),{
                            title: list.title,
                            tasks: newTasks,
                            ID: userId,
                            updatedAt: serverTimestamp()
                        })
                    }else {
                        await addDoc(collection(db, "lists"), {
                            title: list.title,
                            tasks: list.tasks,
                            ID: userId,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        });
                    }
                }

                //Save or update mood
                if(mood && mood.date){
                    const moodId = `${userId}-${mood.date}`;
                    const moodRef = doc(db, "mood", moodId);
                    const moodSnap = await getDoc(moodRef);

                    let oldSummary = ""

                    if(moodSnap.exists()){
                        oldSummary = moodSnap.data().daySummary || " ";
                    }

                    const newSummary = mood?.daySummary || " ";

                    await setDoc(moodRef,{
                        ...mood,
                        daySummary: oldSummary + newSummary,
                        ID: userId,
                        updatedAt: serverTimestamp()
                    });
                }

            }
        } catch (e) {
            console.error("Failed to save structured data:", e);
        }

        if (infoJSON && infoJSON.userInfo) {
            // Filter out all null values so you don't overwrite with nulls
            const filteredUserInfo = {};
            for (const [key, value] of Object.entries(infoJSON.userInfo)) {
                if (value !== null && value !== undefined) {
                    filteredUserInfo[key] = value;
                }
            }

            // Only update if there is some info to update
            if (Object.keys(filteredUserInfo).length > 0) {
                await setDoc(
                    doc(db, "userInfo", auth.currentUser.uid),
                    {
                        userInfo: filteredUserInfo,
                        updatedAt: serverTimestamp(),
                    },
                    { merge: true } // This merges with existing data instead of overwriting
                );
            }
        }





    } catch (error) {
        console.error("Error fetching reply:", error);
        outGoingMessagesBot("Sorry, something went wrong.");
    }
}

window.outGoingMessageHuman = outGoingMessageHuman;

document.getElementById("messageInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        outGoingMessageHuman();
    }
});

// Load chat history for Juno
async function loadChatHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const chatArea = document.getElementById("chatArea");
    if (!chatArea) {
        console.error("Chat area element not found");
        return;
    }

    chatArea.innerHTML = "";

    const q = query(
        collection(db, "messages"),
        where("ID", "==", user.uid),
        orderBy("time")
    );

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();

            if (data.WHO === "Human" && data.TO === "Juno") {
                const div = document.createElement("div");
                div.classList.add("messageBubble", "human");
                const h3 = document.createElement("h3");
                h3.classList.add("messageContent");
                h3.textContent = data.message;
                div.appendChild(h3);
                chatArea.appendChild(div);
            } else if (data.WHO === "Juno") {
                outGoingMessagesBot(data.message);
            }
        });

        chatArea.scrollTop = chatArea.scrollHeight;
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.uid);
        loadChatHistory();
    } else {
        console.log("No user signed in. Redirecting to login.");
        window.location.href = "index.html";
    }
});

let shortTermHistory = [];

function addToHistory(role, message) {
    shortTermHistory.push({ role, message });
    if (shortTermHistory.length > 30) {
    }
}