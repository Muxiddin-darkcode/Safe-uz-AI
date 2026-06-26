import { Firestore } from '@google-cloud/firestore';

const db = new Firestore({
  projectId: "formidable-glider-c6d0h",
  databaseId: "ai-studio-52863e51-7050-4a2c-a472-0f656145191d"
});

async function test() {
  try {
    console.log("Testing @google-cloud/firestore directly...");
    const snapshot = await db.collection("users").limit(1).get();
    console.log("Success! Found users count:", snapshot.size);
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

test();
