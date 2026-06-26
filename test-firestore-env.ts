import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_DATABASE = "ai-studio-52863e51-7050-4a2c-a472-0f656145191d";

const app = getApps().length === 0 ? initializeApp({
  projectId: "formidable-glider-c6d0h",
  storageBucket: "formidable-glider-c6d0h.firebasestorage.app"
}) : getApp();

const adminDb = getFirestore(app);

async function test() {
  try {
    console.log("Testing firestore access with FIRESTORE_DATABASE env var...");
    const snapshot = await adminDb.collection("users").limit(1).get();
    console.log("Success! Found users count:", snapshot.size);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
