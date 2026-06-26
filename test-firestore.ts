import { adminDb } from "./src/backend/firebaseAdmin.js";

async function test() {
  try {
    console.log("Testing firestore adminDb access...");
    const snapshot = await adminDb.collection("users").limit(1).get();
    console.log("Success! Found users count:", snapshot.size);
  } catch (error) {
    console.error("Firestore test failed:", error);
  }
}

test();
