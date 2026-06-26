import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpVoEJal332L-uJKVX0TuAvmoXJtkstXA",
  authDomain: "formidable-glider-c6d0h.firebaseapp.com",
  projectId: "formidable-glider-c6d0h",
  storageBucket: "formidable-glider-c6d0h.firebasestorage.app",
  messagingSenderId: "414584245282",
  appId: "1:414584245282:web:ebe99fb5449cea7b3b4e7b",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "ai-studio-52863e51-7050-4a2c-a472-0f656145191d");

async function test() {
  try {
    console.log("Testing web SDK firestore access from node...");
    const q = query(collection(db, "users"), limit(1));
    const querySnapshot = await getDocs(q);
    console.log("Success with web SDK! Found users count:", querySnapshot.size);
  } catch (error) {
    console.error("Web SDK test failed:", error);
  }
}

test();
