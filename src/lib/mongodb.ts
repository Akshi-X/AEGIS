'use server';

import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let cachedClient: MongoClient | null = null;

export async function getDb() {
    if (cachedClient) {
        return cachedClient.db();
    }
    await client.connect();
    cachedClient = client;
    return client.db();
}

// Helper functions to get collections
export async function getStudentsCollection() {
    const db = await getDb();
    return db.collection('students');
}

export async function getPcsCollection() {
    const db = await getDb();
    return db.collection('pcs');
}

export async function getQuestionsCollection() {
    const db = await getDb();
    return db.collection('questions');
}

export async function getExamsCollection() {
    const db = await getDb();
    return db.collection('exams');
}
