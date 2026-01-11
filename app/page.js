'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard (which handles auth redirect if needed)
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}
