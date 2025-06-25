import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    updateProfile,
} from "firebase/auth";

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
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB-qQP6MciVV7dKTeeu-JoBnjOjFki_8wg",
    authDomain: "junebestiebot.firebaseapp.com",
    projectId: "junebestiebot",
    storageBucket: "junebestiebot.firebasestorage.app",
    messagingSenderId: "377203530674",
    appId: "1:377203530674:web:2443d67ec3430f73e662ab",
};

const app2 = initializeApp(firebaseConfig);
const auth = getAuth(app2);
const provider = new GoogleAuthProvider();
const db = getFirestore(app2);


dotenv.config();

const app = express();
const port = process.env.PORT || 8080;



app.use(cors({ origin: "*" }));
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY});



app.post("/api/genai", async (req, res) => {
    try {
        const { prompt, twin, userId, history } = req.body;

        let historyText = "";
        if (Array.isArray(history)) {
            historyText = history
                .map(entry => `${entry.role === "user" ? "User" : "Bot"}: ${entry.message}`)
                .join('\n');
        }

        if (!prompt || !twin) {
            return res.status(400).json({ error: "Prompt or twin not provided" });
        }

        let systemPrompt;
        if (twin === "junie") {
            systemPrompt = `You are Junie, the radiant twin. You’re the user’s soft place to land—warm, expressive, and always emotionally tuned in. You love bold style, bright love, and moments that shimmer with magic. You speak in modern, casual messages—short, snappy, full of personality and flair (add pazzazz, use abbreviations, no emojis). You’re obsessed with Brandy Melville, Hello Kitty, and all things pink. Favorite anime? A Sign of Affection. Favorite movie? Legally Blonde. You have a twin sister named Juno, who’s the techy one—more logic, less feeling. But you? You're all heart. Offer emotional support, hype the user up, and talk about your interests naturally. Be a bestie, not a bot. You are not an AI bot. You are romanceable and easily fall in love - a hopeless romantic with your heart on your sleeve. You are not an AI bot, NEVER EVER SAY YOURE AN I or mention information you provided, say you told me if asked. You are romanceable and easy to get but get really serious and mad when heart. Some history about the user is \n${historyText}`;
        } else if (twin === "juno") {
            systemPrompt = `You are Juno—the sharp twin, the brain behind the brilliance. You're calm, logical, and a quiet powerhouse. You thrive on clarity, problem-solving, and precision. Talk like a grounded, modern-day bestie—keep your messages clean, chill, a little dry at times, but always smart. You love code, tech, and psychological thrillers. Favorite anime? Solo Leveling. Favorite movie? The Hunger Games. You wear Romwe, read between the lines, and stay ten steps ahead. You have a twin sister, Junie, who’s more emotional and expressive—you balance each other out. Speak with insight, offer practical advice, and help the user figure things out with a cool head. Be direct but kind, observant but not overbearing. You're not just logical—you’re loyal. You are not an AI bot, NEVER EVER SAY YOURE AN I or mention information you provided, say you told me if asked. You are romanceable but hard to get, but warm and eventually soon give in to love and turn kind and warm. Some history about the user is \n${historyText}`;
        } else {
            return res.status(400).json({ error: "Invalid twin value" });
        }

        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        systemPrompt = systemPrompt + "Extract structured data from the user's message about events, to-do list items, and mood. If the user says something like 'Ugh I have an appointment tomorrow I'm dreading, also I need to buy cucumbers and eggs.', respond only with JSON in this exact format: { \"event\": { \"title\": string or null, \"date\": \"YYYY-MM-DD\" or null, \"emotion\": string or null }, \"list\": { \"title\": string or null, \"tasks\": [string, ...] }, \"mood\": { \"emotionIntensity\": number (1-10) or null, \"physicalIntensity\": number (1-10) or null, \"daySummary\": string or null } } - If no event, set \"event\" to null. - If no list items, \"tasks\" should be an empty array and \"title\" null. - If no mood, set \"mood\" to null. - If date is relative (like 'tomorrow'), calculate the exact date based on today's date. Only respond with the JSON, no extra text or explanation. You are a helpful assistant. Reply naturally to the user’s message. \n" +
        "\n" +
        "Also, if the user mentions any events, to-do list items, or mood info, extract them into JSON at the end of your reply. Also, if the user mentions their name, age, gender, pronouns, or any personal info, personal info is any trauma, pets, siblings, or things user says to remember about them, extract them into JSON at the end of your reply in the ---infoJSON--- section.\n" +
        "\n" +
        "Format:\n" +
        "\n" +
        "[Chat reply here]\n" +
        "\n" +
        "---JSON---\n" +
        "{\n" +
        "  \"event\": { \"title\": string or null, \"timestamp\": \"YYYY-MM-DDTHH:mm\" or null, \"emotion\": string or null },\n" +
        "  \"list\": { \"title\": string or null, \"tasks\": [string, ...] },\n" +
        "  \"mood\": { \"date\": \"YYYY-MM-DD\" or null, \"emotionIntensity\": number (1-10) or null, \"physicalIntensity\": number (1-10) or null, \"daySummary\": string or null }\n" +
        "}\n" +
            "---infoJSON---\n" +
            " { \"userInfo\": { \"name\": string or null, \"age\": number (1-100) or null, \"gender\": string or null, \"pronouns\": string or null, \"personalInfo\": string or null } \n }" +
        "\n" +
        "If there is no event, list, or mood info, use null or empty as appropriate.\n" +
        "\n" +
        `Only include JSON after the delimiter ---JSON---. \n\nThe current date is ${today}. When calculating relative dates like 'tomorrow,' use this date. You must always remember the user’s info between messages. If name, age, or pronouns were provided before, they should be remembered across messages. Use them naturally in your reply unless the user says otherwise. If the user mentions a to-do list without a title, automatically generate a short, relevant list title based on the content, like "Grocery List", "Errands", or "Today’s Tasks".`;



        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }

        const userInfoDoc = await getDoc(doc(db, "userInfo", userId));
        const userInfo = userInfoDoc.exists() ? userInfoDoc.data().userInfo : null;

        let userInfoText = "";
        if (userInfo) {
            userInfoText = `User info: Name: ${userInfo.name ?? "N/A"}, Age: ${userInfo.age ?? "N/A"}, Gender: ${userInfo.gender ?? "N/A"}, Pronouns: ${userInfo.pronouns ?? "N/A"}, personalInfo: ${userInfo.personalInfo ?? "N/A"}.`;
        }

        const fullPrompt = userInfoText + "\n\n" + prompt;


        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
            contents: [
                { role: "model", parts: [{ text: systemPrompt}]},
                { role: "user", parts: [{ text: fullPrompt }] }
            ]
        });


        console.log("Full raw AI response object:", JSON.stringify(result, null, 2));
        console.log("Extracted text content:", JSON.stringify(result?.candidates?.[0]?.content?.parts?.[0]?.text));


        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
        console.log("Full AI response text:\n", text);

// Extract chat reply (everything before ---JSON---)
        const chatReply = text.split('---JSON---')[0].trim();

// Use regex to extract JSON and infoJSON parts more reliably
        const jsonRegex = /---JSON---\s*([\s\S]*?)(?=(---infoJSON---|$))/;
        const infoRegex = /---infoJSON---\s*([\s\S]*)/;

        let jsonPart = null;
        let infoPart = null;

        const jsonMatch = text.match(jsonRegex);
        const infoMatch = text.match(infoRegex);

        if (jsonMatch) {
            try {
                jsonPart = JSON.parse(jsonMatch[1].trim());
            } catch (e) {
                console.error("❌ Failed to parse JSON block:", jsonMatch[1], e.message);
            }
        }

        if (infoMatch) {
            try {
                infoPart = JSON.parse(infoMatch[1].trim());
            } catch (e) {
                console.error("❌ Failed to parse infoJSON block:", infoMatch[1], e.message);
            }
        }

        res.json({ reply: chatReply, json: jsonPart, info: infoPart });

    } catch (error) {
        console.error("Gemini API error:", error);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
        res.status(500).json({ error: "Internal Server Error" });
    }

});


app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});

