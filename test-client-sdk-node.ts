import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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
    console.log("Testing Web SDK from Node...");
    const testDocRef = doc(db, "test_connections", "test_id");
    await setDoc(testDocRef, { status: "success", timestamp: new Date().toISOString() });
    console.log("Write successful!");
    const snap = await getDoc(testDocRef);
    console.log("Read successful! Data:", snap.data());
    process.exit(0);
  } catch (error) {
    console.error("Web SDK failed:", error);
    process.exit(1);
  }
}

test();
