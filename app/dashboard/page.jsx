'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainContent from '../../components/MainContent';
import { useAuth } from '../../components/AuthContext';

export default function DashboardPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && userProfile?.role === 'admin') {
            router.replace('/dashboard/admin');
        }
    }, [userProfile, loading, router]);

    if (loading) return null; // or a spinner

    return <MainContent />;
}
