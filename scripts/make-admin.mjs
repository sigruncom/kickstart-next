import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

// Parse Email Argument
const email = process.argv[2];
if (!email) {
    console.error('Usage: node scripts/make-admin.mjs <your-email>');
    process.exit(1);
}

// 1. Read .env.local manually to get credentials
const envPath = path.resolve(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local not found in current directory.');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
// Naive regex to extract the key. Assumes it's on one line or standard format.
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.*)/);

if (!match) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    process.exit(1);
}

let serviceAccountStr = match[1].trim();

// Handle basic quoting
if ((serviceAccountStr.startsWith('"') && serviceAccountStr.endsWith('"')) ||
    (serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'"))) {
    serviceAccountStr = serviceAccountStr.slice(1, -1);
}
// Handle escaped newlines commonly found in .env
serviceAccountStr = serviceAccountStr.replace(/\\n/g, '\n');

let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountStr);
} catch (e) {
    console.error('Error parsing Service Account JSON:', e.message);
    process.exit(1);
}

// 2. Initialize Firebase Admin
try {
    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (e) {
    if (e.code === 'app/already-exists') {
        // ignore
    } else {
        throw e;
    }
}

const db = getFirestore();
const auth = getAuth();

// 3. Promote User
async function promote() {
    try {
        console.log(`\n🔍 Looking up user: ${email}...`);
        const user = await auth.getUserByEmail(email);
        console.log(`   Found UID: ${user.uid}`);

        console.log(`🔄 Updating Firestore role...`);
        await db.collection('users').doc(user.uid).set({
            role: 'admin',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`\n✅ SUCCESS! User ${email} is now an Admin.`);
        console.log(`   Please refresh the application to see Admin Dashboard.`);

        process.exit(0);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            console.error(`\n❌ Error: User '${email}' not found in Firebase Authentication.`);
            console.error(`   Please sign up first in the app.`);
        } else {
            console.error('\n❌ UNEXPECTED ERROR:', e);
        }
        process.exit(1);
    }
}

promote();
