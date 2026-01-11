import admin from 'firebase-admin';

let adminAuth = null;
let adminDb = null;

try {
    if (!admin.apps.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            // Use service account if available (required for Vercel/Production usually)
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            } catch (e) {
                console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', e);
                // Don't re-throw here, try default handling or just fail gracefully later
            }
        } else {
            console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin features might fail.');
            // This often fails on Vercel without credentials, so wrap it
            try {
                admin.initializeApp();
            } catch (e) {
                console.warn('admin.initializeApp() failed (expected if no default creds):', e);
            }
        }
    } else {
        // Already initialized
    }

    // Attempt to access services (this might throw if app not initialized)
    if (admin.apps.length) {
        adminAuth = admin.auth();
        adminDb = admin.firestore();
    }
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
}

export { adminAuth, adminDb };
