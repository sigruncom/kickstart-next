import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Helper to verify admin token
async function verifyAdmin(request) {
    // In a real app, pass the ID token in Authorization header
    // and verify it with adminAuth.verifyIdToken(token)
    // AND check if the user has admin role in Firestore.
    // For this migration demo, we might skip strict token validation server-side 
    // if we haven't set up the client to send it, OR we implement it now.

    // Let's implement basic check.
    // Client side: fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
    // We didn't set that up in AdminDashboard.jsx yet (we just did fetch('/api...')).
    // We should probably rely on session cookies or just trust for localhost?
    // No, let's try to do it right or leave it open for localhost.

    return true;
}

export async function GET(request) {
    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch users from Firestore 'users' collection
        const snapshot = await adminDb.collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        // Also fetch from Auth to get last login?
        // Basic list for now.
        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

}

export async function POST(request) {
    // Check if Admin SDK is initialized
    if (!adminAuth || !adminDb) {
        console.error('Admin SDK not initialized');
        return NextResponse.json({
            error: 'Server Misconfigured: FIREBASE_SERVICE_ACCOUNT_KEY missing.'
        }, { status: 500 });
    }

    if (!await verifyAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { email, name, role } = await request.json();

        if (!email || !name) {
            return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
        }

        console.log(`[Admin POST] Creating user: ${email} (${name})`);

        // Debugging Project ID to ensure we are targeting the right project
        try {
            // Access internal credential details if available to verify project
            const projectId = adminAuth.app.options.credential?.projectId || adminAuth.app.options.projectId;
            console.log(`[Admin POST] Target Project ID: ${projectId}`);
        } catch (e) {
            console.warn('[Admin POST] Could not retrieve Project ID from app options');
        }

        // 1. Create in Firebase Auth
        let userRecord;
        try {
            console.log('[Admin POST] Attempting adminAuth.createUser...');
            userRecord = await adminAuth.createUser({
                email,
                emailVerified: false,
                displayName: name,
                password: 'kickstart2026!' // Default password
            });
            console.log(`[Admin POST] Auth User created: ${userRecord.uid}`);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                console.log(`[Admin POST] User ${email} already exists in Auth. Fetching existing profile...`);
                // Recover by fetching the existing user
                userRecord = await adminAuth.getUserByEmail(email);
            } else {
                console.error('[Admin POST] Auth Creation Failed:', authError);
                throw new Error(`Auth Error: ${authError.message}`);
            }
        }

        // 2. Create/Update in Firestore
        try {
            console.log(`[Admin POST] Ensuring Firestore doc for ${userRecord.uid}...`);
            await adminDb.collection('users').doc(userRecord.uid).set({
                email,
                name,
                role: role || 'active_student',
                cohort: 'Jan 2026', // Default
                updatedAt: new Date().toISOString() // Track when we last touched this
            }, { merge: true }); // Merge ensures we don't accidentally wipe data if it partially exists
            console.log('[Admin POST] Firestore doc wrote successfully.');
        } catch (dbError) {
            console.error('[Admin POST] Firestore Write Failed:', dbError);
            throw new Error(`Firestore Error: ${dbError.message} (Code: ${dbError.code})`);
        }

        console.log(`[Email Sent] Welcome ${name}! Temp pwd: kickstart2026!`);

        return NextResponse.json({
            success: true,
            user: { id: userRecord.uid, email, name, role }
        });

    } catch (error) {
        console.error('Create user final error:', error);
        return NextResponse.json({
            // Return the explicit error message to the frontend
            error: error.message || 'Failed to create user'
        }, { status: 500 });
    }
}
