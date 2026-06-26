import fs from 'fs';
import path from 'path';

// Local file-based database for reliable, secure storage without permissions issues
const DB_FILE = path.join(process.cwd(), 'db.json');

class LocalDatabase {
  private data: Record<string, Record<string, any>> = {};

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = {
          users: {},
          sessions: {},
          reports: {},
          report_events: {},
          system_settings: {},
          monitoring_sources: {}
        };
        this.save();
      }
    } catch (err) {
      console.error("Failed to load local database, initializing empty:", err);
      this.data = {};
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error("Failed to save local database:", err);
    }
  }

  public getData(collection: string, docId: string): any {
    return this.data[collection]?.[docId];
  }

  public getCollectionDocs(collection: string): Array<{ id: string, data: any }> {
    const col = this.data[collection] || {};
    return Object.entries(col).map(([id, data]) => ({ id, data }));
  }

  public setData(collection: string, docId: string, data: any): void {
    if (!this.data[collection]) {
      this.data[collection] = {};
    }
    // Deep clone to prevent mutations
    this.data[collection][docId] = JSON.parse(JSON.stringify(data));
    this.save();
  }

  public updateData(collection: string, docId: string, update: any): void {
    if (!this.data[collection]) {
      this.data[collection] = {};
    }
    const current = this.data[collection][docId] || {};
    this.data[collection][docId] = {
      ...current,
      ...JSON.parse(JSON.stringify(update))
    };
    this.save();
  }

  public deleteData(collection: string, docId: string): void {
    if (this.data[collection]) {
      delete this.data[collection][docId];
      this.save();
    }
  }
}

const dbInstance = new LocalDatabase();

class LocalDocRef {
  constructor(private collectionName: string, private docId: string) {}

  async get() {
    const data = dbInstance.getData(this.collectionName, this.docId);
    return {
      exists: data !== undefined,
      id: this.docId,
      data: () => data
    };
  }

  async set(data: any) {
    dbInstance.setData(this.collectionName, this.docId, data);
  }

  async update(data: any) {
    dbInstance.updateData(this.collectionName, this.docId, data);
  }

  async delete() {
    dbInstance.deleteData(this.collectionName, this.docId);
  }
}

class LocalQuery {
  private wheres: Array<{ field: string, op: string, val: any }> = [];
  private orderBys: Array<{ field: string, dir: 'asc' | 'desc' }> = [];
  private limitCount: number | null = null;

  constructor(private collectionName: string) {}

  where(field: string, op: string, val: any) {
    this.wheres.push({ field, op, val });
    return this;
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    this.orderBys.push({ field, dir });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async get() {
    let docs = dbInstance.getCollectionDocs(this.collectionName);

    // Apply wheres
    for (const w of this.wheres) {
      docs = docs.filter(doc => {
        const val = doc.data[w.field];
        if (w.op === '==') return val === w.val;
        if (w.op === 'in') return Array.isArray(w.val) && w.val.includes(val);
        // Add support for array-contains if needed
        return true;
      });
    }

    // Apply orderBys
    for (const o of this.orderBys) {
      docs.sort((a, b) => {
        const valA = a.data[o.field];
        const valB = b.data[o.field];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (valA < valB) return o.dir === 'asc' ? -1 : 1;
        if (valA > valB) return o.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      docs = docs.slice(0, this.limitCount);
    }

    const docObjects = docs.map(d => ({
      id: d.id,
      data: () => d.data
    }));

    return {
      empty: docObjects.length === 0,
      size: docObjects.length,
      docs: docObjects,
      forEach: (cb: (doc: any) => void) => docObjects.forEach(cb)
    };
  }
}

class LocalCollection {
  constructor(private collectionName: string) {}

  doc(id: string) {
    return new LocalDocRef(this.collectionName, id);
  }

  where(field: string, op: string, val: any) {
    return new LocalQuery(this.collectionName).where(field, op, val);
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    return new LocalQuery(this.collectionName).orderBy(field, dir);
  }

  limit(count: number) {
    return new LocalQuery(this.collectionName).limit(count);
  }

  async get() {
    return new LocalQuery(this.collectionName).get();
  }
}

// Emulate Firebase Firestore Admin SDK surface
export const adminDb = {
  collection: (name: string) => {
    return new LocalCollection(name);
  }
} as any;

// Emulate Firebase Auth Admin SDK surface
export const adminAuth = {
  createCustomToken: async (uid: string) => {
    // Return a self-contained custom token
    return "custom_session_" + uid + "_" + Math.random().toString(36).substring(2, 10);
  },
  verifyIdToken: async (token: string) => {
    // If it's a local session token, resolve it
    const session = dbInstance.getData("sessions", token);
    if (session) {
      return {
        uid: session.uid,
        email: `${session.uid}@safeuz.ai`
      };
    }
    throw new Error("Invalid or expired session token");
  }
} as any;

// Emulate Firebase Storage Admin SDK surface
export const adminStorage = {
  bucket: () => {
    return {
      name: "local-storage",
      file: (fileName: string) => {
        return {
          save: async (buffer: Buffer, options: any) => {
            const baseName = path.basename(fileName);
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            fs.writeFileSync(path.join(uploadsDir, baseName), buffer);
          }
        };
      }
    };
  }
} as any;

const app = {} as any;
export default app;
