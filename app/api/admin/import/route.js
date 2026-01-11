import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import csv from 'csv-parser';
import { Readable } from 'stream';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        const results = [];
        const errors = [];
        let successCount = 0;
        let failureCount = 0;

        // Parse CSV
        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        // Process users
        for (const row of results) {
            const email = row.email?.trim();
            const name = row.name?.trim() || 'User';

            if (!email) continue;

            try {
                // Check if user exists in Auth
                let userRecord;
                try {
                    userRecord = await adminAuth.getUserByEmail(email);
                } catch (e) {
                    if (e.code === 'auth/user-not-found') {
                        // Create new user
                        userRecord = await adminAuth.createUser({
                            email,
                            emailVerified: false, // Start unverified
                            displayName: name,
                            password: 'kickstart2026!' // Temporary password
                        });

                        // Send welcome email (Log to console for now, or implement nodemailer)
                        console.log(`[Email Sent] Welcome to Kickstart, ${name}! Your temp password is kickstart2026!`);

                    } else {
                        throw e;
                    }
                }

                // Create/Update Firestore Profile
                await adminDb.collection('users').doc(userRecord.uid).set({
                    email,
                    name,
                    role: 'active_student',
                    cohort: 'Jan 2026', // Default cohort
                    createdAt: new Date().toISOString(),
                    legacy_import: true
                }, { merge: true });

                successCount++;

            } catch (error) {
                console.error(`Failed to import ${email}:`, error);
                failureCount++;
                errors.push({ email, error: error.message });
            }
        }

        return NextResponse.json({
            summary: {
                total: results.length,
                success: successCount,
                failed: failureCount,
                errors
            }
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
