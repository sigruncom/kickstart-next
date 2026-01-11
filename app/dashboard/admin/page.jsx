'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthContext';
import AdminDashboard from '../../../components/AdminDashboard';

export default function AdminPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userProfile && userProfile.role !== 'admin') {
            router.push('/dashboard'); // Kick non-admins out
        }
    }, [userProfile, loading, router]);

    if (loading) return <div>Loading...</div>;

    if (!userProfile || userProfile.role !== 'admin') {
        return null; // Will redirect
    }

    return <AdminDashboard />;
}
