import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ProjectSchema extends DBSchema {
  projects: {
    key: string; // Manufacturer-Model
    value: {
      id: string;
      manufacturer: string;
      model: string;
      createdAt: Date;
      phase1: {
        script?: Blob;
        youtube?: Blob;
        scriptContent?: string;
        youtubeContent?: string;
      };
      phase2: {
        originalVideo?: Blob;
        mergedVideo?: Blob;
        finalVideo?: Blob;
        outroUsed?: string; // 'default' or 'custom'
        customOutro?: Blob;
        processingStatus?: 'uploaded' | 'merged' | 'final' | 'error';
      };
    };
  };
  outros: {
    key: string;
    value: {
      id: string;
      name: string;
      file: Blob;
      isDefault: boolean;
      createdAt: Date;
    };
  };
}

let db: IDBPDatabase<ProjectSchema> | null = null;

export async function initDB(): Promise<IDBPDatabase<ProjectSchema>> {
  if (db) return db;
  
  db = await openDB<ProjectSchema>('yacht-video-projects', 1, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-vessel', ['manufacturer', 'model']);
        projectStore.createIndex('by-date', 'createdAt');
      }
      
      // Outros store
      if (!db.objectStoreNames.contains('outros')) {
        const outroStore = db.createObjectStore('outros', { keyPath: 'id' });
        outroStore.createIndex('by-default', 'isDefault');
      }
    },
  });
  
  return db;
}

export async function saveProject(project: ProjectSchema['projects']['value']) {
  const database = await initDB();
  return database.put('projects', project);
}

export async function getProject(id: string) {
  const database = await initDB();
  return database.get('projects', id);
}

export async function getAllProjects() {
  const database = await initDB();
  return database.getAll('projects');
}

export async function saveOutro(outro: ProjectSchema['outros']['value']) {
  const database = await initDB();
  
  // If setting as default, unset any existing default
  if (outro.isDefault) {
    const allOutros = await database.getAll('outros');
    const existingDefaults = allOutros.filter(o => o.isDefault);
    for (const existing of existingDefaults) {
      await database.put('outros', { ...existing, isDefault: false });
    }
  }
  
  return database.put('outros', outro);
}

export async function getDefaultOutro() {
  const database = await initDB();
  const allOutros = await database.getAll('outros');
  const defaultOutro = allOutros.find(outro => outro.isDefault);
  return defaultOutro || null;
}

export async function getAllOutros() {
  const database = await initDB();
  return database.getAll('outros');
}

export function generateProjectId(manufacturer: string, model: string): string {
  return `${manufacturer.replace(/\s+/g, '-')}-${model.replace(/\s+/g, '-')}`;
}