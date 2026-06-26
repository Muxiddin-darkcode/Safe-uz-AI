import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length === 0 ? initializeApp({
  projectId: "formidable-glider-c6d0h",
  storageBucket: "formidable-glider-c6d0h.firebasestorage.app"
}) : getApp();

// Use the default database (default)
const defaultDb = getFirestore(app);

async function test() {
  try {
    console.log("Testing default database firestore access...");
    const snapshot = await defaultDb.collection("users").limit(1).get();
    console.log("Success on default db! Found users count:", snapshot.size);
  } catch (error) {
    console.error("Default db test failed:", error);
  }
}

test();
