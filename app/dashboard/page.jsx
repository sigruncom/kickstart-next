import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainContent from '../../components/MainContent';
import { useAuth } from '../../components/AuthContext';

export default function DashboardPage() {
    const { userProfile, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isStudentView = searchParams.get('view') === 'student';

    useEffect(() => {
        if (!loading && userProfile?.role === 'admin' && !isStudentView) {
            router.replace('/dashboard/admin');
        }
    }, [userProfile, loading, router, isStudentView]);

    if (loading) return null; // or a spinner

    return <MainContent />;
}
