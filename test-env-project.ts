import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize with default environment credentials/project ID
const app = getApps().length === 0 ? initializeApp() : getApp();

const adminDb = getFirestore(app, "ai-studio-52863e51-7050-4a2c-a472-0f656145191d");

async function test() {
  try {
    console.log("Testing with environment's default project ID...");
    const snapshot = await adminDb.collection("users").limit(1).get();
    console.log("Success! Found users count:", snapshot.size);
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

test();
