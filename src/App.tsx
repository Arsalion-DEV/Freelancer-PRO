import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import PlatformConnections from '@/pages/PlatformConnections';
import { AuthProvider } from '@/contexts/AuthContext';

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
    
    try {
      if (currentPath === '/platforms') {
        console.log('Rendering PlatformConnections');
        return <PlatformConnections />;
      }
      console.log('Rendering Dashboard');
      return <Dashboard />;
    } catch (error) {
      console.error('Error rendering page:', error);
      return <div>Error loading page</div>;
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="social-monitor-theme">
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Layout>
            {renderPage()}
          </Layout>
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
