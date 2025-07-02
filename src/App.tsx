import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import PlatformConnections from '@/pages/PlatformConnections';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlatformProvider } from '@/contexts/PlatformContext';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    return (typeof window !== 'undefined' && window.location?.pathname) || '/';
  });

  useEffect(() => {
    // Listen for URL changes
    const handleUrlChange = () => {
      const newPath = window.location?.pathname || '/';
      setCurrentPath(newPath);
    };

    // Poll for URL changes since we're using manual navigation
    const intervalId = setInterval(handleUrlChange, 50);

    // Also listen for browser back/forward buttons
    const handlePopState = () => {
      handleUrlChange();
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Create a global function for navigation
  useEffect(() => {
    (window as any).navigateToPage = (path: string) => {
      if (path && typeof path === 'string') {
        window.history.pushState(null, '', path);
        setCurrentPath(path);
      }
    };
  }, []);

  const renderPage = () => {
    console.log('Current path:', currentPath);
    
    if (currentPath === '/platforms') {
      return <PlatformConnections />;
    }
    return <Dashboard />;
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="social-monitor-theme">
      <AuthProvider>
        <PlatformProvider>
          <div className="min-h-screen bg-background">
            <Layout>
              {renderPage()}
            </Layout>
            <Toaster />
          </div>
        </PlatformProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
