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

async function loadLists(){
        const userId = auth.currentUser.uid
        const q = query(collection(db, "lists"), where("ID", "==", userId), orderBy("updatedAt", "desc"), limit(4));
        const querySnapshot = await getDocs(q);

        const container = document.getElementById("allLists");

        querySnapshot.forEach((docSnap) => {
            const list = docSnap.data();
            const listEl = document.createElement("div");

            const div1 = document.getElementById("list1");
            const div2 = document.getElementById("list2");
            const div3 = document.getElementById("list3");
            const div4 = document.getElementById("list4");

            if(div1.innerHTML === ""){
                listEl.classList = "list1";
                div1.appendChild(listEl)
            } else if (div2.innerHTML === ""){
                listEl.classList = "list2";
                div2.appendChild(listEl)
            } else if (div3.innerHTML === ""){
                listEl.classList = "list3";
                div3.appendChild(listEl)
            } else if (div4.innerHTML === ""){
                listEl.classList = "list4";
                div4.appendChild(listEl)
            }

            listEl.classList = "listBox"


            const title = document.createElement("h2");
            title.textContent = list.title;
            listEl.appendChild(title);

            const ul = document.createElement("ul");
            list.tasks.forEach((task) => {
                const li = document.createElement("li");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "task-checkbox";

                const label = document.createElement("label");
                label.textContent = task;

                li.appendChild(checkbox);
                li.appendChild(label);
                ul.appendChild(li);
            });

            listEl.appendChild(ul);

            const clearBtn = document.createElement("button");
            clearBtn.className = "button";
            clearBtn.textContent = "Clear List";
            clearBtn.onclick = () => clearList(docSnap.id); // pass Firestore doc ID

            listEl.appendChild(clearBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "button";
            deleteBtn.textContent = "Delete List";
            deleteBtn.onclick = () => deleteList(docSnap.id); // pass Firestore doc ID

            listEl.appendChild(deleteBtn);



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
        loadLists(); // 🌟 THIS is what was missing
    } else {
        console.log("❌ No user logged in");
        window.location.href = "index.html";
    }
});

async function clearList(docId) {
    try {
        const listRef = doc(db, "lists", docId); // ✅ define it here

        await updateDoc(listRef, {
            title: "",
            tasks: [],
            updatedAt: serverTimestamp()
        });
        clearListContainers();
        loadLists(); // 🔁 refresh the lists
    } catch (e) {
        console.error("❌ Error clearing list:", e); // ✅ correct variable name
    }
}

function clearListContainers() {
    ["list1", "list2", "list3", "list4"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
    });
}

async function deleteList(docId, listEl) {
    try {
        const listRef = doc(db, "lists", docId); // ✅ define it here

        await deleteDoc(listRef);
        clearListContainers();
        loadLists(); // 🔁 refresh the lists


    } catch (e) {
        console.error("❌ Error deleting list:", e); // ✅ correct variable name
    } }

window.clearList = clearList;
window.deleteList = deleteList;