import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Link as LinkIcon, 
  Search, 
  BarChart3, 
  Zap, 
  Megaphone, 
  Settings,
  Menu,
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatforms } from '@/contexts/PlatformContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Platforms', href: '/platforms', icon: LinkIcon },
  { name: 'Job Monitoring', href: '/jobs', icon: Search },
  { name: 'AI Matching', href: '/ai-matching', icon: Search },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

// Safe navigation function to prevent charAt errors
const navigateTo = (href: string) => {
  if (href && typeof href === "string") {
    if ((window as any).navigateToPage) (window as any).navigateToPage(href);
  }
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Use window.location safely to prevent charAt errors
  const currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) || '/';
  const { user, logout } = useAuth();
  const { jobs } = usePlatforms();

  const newJobsCount = jobs ? jobs.filter(job => job && job.status === 'new').length : 0;

  const Sidebar = ({ className = '' }: { className?: string }) => (
    <div className={cn('flex h-full flex-col bg-card border-r', className)}>
      <div className="flex h-16 items-center px-6 border-b">
        <button 
          onClick={() => navigateTo('/')} 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
        >
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Search className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">SocialMonitor</span>
        </button>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <button
              key={item.name}
              onClick={() => navigateTo(item.href)}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full text-left',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              {item.name === 'Job Monitoring' && newJobsCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {newJobsCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {newJobsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {newJobsCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                    <AvatarFallback>
                      {user?.name ? user.name.split(' ').map(n => (n {user?.name ? user.name.split(' ').map(n => n[0] || '').join('') : 'U'}{user?.name ? user.name.split(' ').map(n => n[0] || '').join('') : 'U'} n.length > 0 ? n[0] : '')).join('') : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
