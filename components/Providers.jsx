'use client';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';

export default function Providers({ children }) {
    return (
        <AuthProvider>
            <AppProvider>
                {children}
            </AppProvider>
        </AuthProvider>
    );
}
