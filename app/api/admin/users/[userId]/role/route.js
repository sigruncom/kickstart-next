import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebase-admin';

export async function PUT(request, { params }) {
    const { userId } = await params;
    const { role } = await request.json();

    if (!userId || !role) {
        return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    try {
        await adminDb.collection('users').doc(userId).update({ role });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating role:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
