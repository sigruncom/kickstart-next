import admin from 'firebase-admin';

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Use service account if available (preferred for production)
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', e);
        }
    } else {
        // Fallback for local dev without service account json (limited privileges, might fail for auth admin)
        // Or assume Application Default Credentials if running on GCP
        // For this local migration, we really need the service account.
        // We will try to rely on the fact that we are mocking or waiting for the user to provide it.
        // BUT, actually, for CSV Import (creating users), we ABSOLUTELY need admin privileges.

        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin features might fail.');
        admin.initializeApp();
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
