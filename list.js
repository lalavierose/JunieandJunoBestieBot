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
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {serverTimestamp} from "firebase/firestore";

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
        const q = query(collection(db, "lists"), where("ID", "==", userId));
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

            const editBtn = document.createElement("button");
            editBtn.className = "button";
            editBtn.textContent = "Edit";
            editBtn.onclick = () => editList(docSnap.id); // pass Firestore doc ID

            listEl.appendChild(editBtn);

            const clearBtn = document.createElement("button");
            clearBtn.className = "button";
            clearBtn.textContent = "Clear List";
            clearBtn.onclick = () => clearList(docSnap.id); // pass Firestore doc ID

            listEl.appendChild(clearBtn);



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

async function editList(listID){

}

async function clearList(docId){
    try{
    await updateDoc(listRef,{
        tasks: [],
        updatedAt: serverTimestamp()
    });
    loadLists()
    } catch (e){
        console.error("❌ Error clearing list:", error);
    }
}

window.clearList = clearList;