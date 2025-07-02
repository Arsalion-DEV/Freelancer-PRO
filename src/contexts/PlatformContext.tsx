import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// CRITICAL: Safe platform data types with strict validation
export type PlatformType = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'reddit' | 'telegram' | 'discord';

export interface Platform {
  id: string;
  type: PlatformType;
  name: string;
  status: 'connected' | 'disconnected';
  followers?: number;
  engagement?: number;
}

// CRITICAL: Safe string operations to prevent charAt errors
const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return String(value);
  } catch {
    return '';
  }
};

const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

// CRITICAL: Platform data sanitizer to prevent all undefined errors
const sanitizePlatformData = (rawData: any): Platform => {
  if (!rawData || typeof rawData !== 'object') {
    return {
      id: 'unknown',
      name: 'Unknown Platform',
      type: 'facebook',
      status: 'disconnected',
      followers: 0,
      engagement: 0
    };
  }

  // Safe type mapping
  const typeMap: Record<string, PlatformType> = {
    'facebook': 'facebook',
    'twitter': 'twitter', 
    'linkedin': 'linkedin',
    'instagram': 'instagram',
    'reddit': 'reddit',
    'telegram': 'telegram',
    'discord': 'discord',
    'social': 'facebook',
    'professional': 'linkedin',
    'visual': 'instagram',
    'community': 'reddit',
    'messaging': 'telegram',
    'gaming': 'discord'
  };

  const rawType = safeString(rawData.type || rawData.name || 'facebook').toLowerCase();
  const platformType = typeMap[rawType] || 'facebook';

  return {
    id: safeString(rawData.id || rawData.name || 'unknown'),
    name: safeString(rawData.name || 'Unknown Platform'),
    type: platformType,
    status: safeString(rawData.status) === 'connected' ? 'connected' : 'disconnected',
    followers: safeNumber(rawData.followers),
    engagement: safeNumber(rawData.engagement)
  };
};

interface PlatformContextType {
  platforms: Platform[];
  loading: boolean;
  error: string | null;
  refreshPlatforms: () => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Multiple endpoint fallbacks for reliability
      const endpoints = [
        '/api/v1/platforms',
        'https://34.205.71.160/api/v1/platforms',
        '/api/platforms'
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000
          } as RequestInit);
          
          if (response.ok) break;
        } catch (err) {
          lastError = err as Error;
          continue;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All API endpoints failed');
      }

      const data = await response.json();
      
      // CRITICAL: Safe data processing with comprehensive validation
      let platformData: any[] = [];
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data)) {
          platformData = data;
        } else if (Array.isArray(data.data)) {
          platformData = data.data;
        } else if (Array.isArray(data.platforms)) {
          platformData = data.platforms;
        }
      }

      // Sanitize each platform to prevent charAt errors
      const safePlatforms = platformData.map(platform => sanitizePlatformData(platform));
      
      // Ensure we always have the expected 7 platforms
      const expectedPlatforms: PlatformType[] = ['facebook', 'twitter', 'linkedin', 'instagram', 'reddit', 'telegram', 'discord'];
      const finalPlatforms: Platform[] = [];

      expectedPlatforms.forEach(type => {
        const existing = safePlatforms.find(p => p.type === type);
        if (existing) {
          finalPlatforms.push(existing);
        } else {
          finalPlatforms.push({
            id: type,
            name: type && type.length > 0 ? (type.charAt(0).toUpperCase() + type.slice(1)) : "Unknown",
            type: type,
            status: 'disconnected',
            followers: 0,
            engagement: 0
          });
        }
      });

      setPlatforms(finalPlatforms);
      
    } catch (err) {
      console.error('Platform fetch error:', err);
      setError('Failed to load platforms');
      
      // CRITICAL: Fallback to default platforms to prevent blank page
      const fallbackPlatforms: Platform[] = [
        { id: '1', name: 'Facebook', type: 'facebook', status: 'disconnected', followers: 0, engagement: 0 },
        { id: '2', name: 'Twitter', type: 'twitter', status: 'disconnected', followers: 0, engagement: 0 },
        { id: '3', name: 'LinkedIn', type: 'linkedin', status: 'disconnected', followers: 0, engagement: 0 },
        { id: '4', name: 'Instagram', type: 'instagram', status: 'disconnected', followers: 0, engagement: 0 },
        { id: '5', name: 'Reddit', type: 'reddit', status: 'disconnected', followers: 0, engagement: 0 },
        { id: '6', name: 'Telegram', type: 'telegram', status: 'disconnected', followers: 0, engagement: 0 },
        { id: '7', name: 'Discord', type: 'discord', status: 'disconnected', followers: 0, engagement: 0 }
      ];
      
      setPlatforms(fallbackPlatforms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const refreshPlatforms = () => {
    fetchPlatforms();
  };

  return (
    <PlatformContext.Provider value={{ platforms, loading, error, refreshPlatforms }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatforms() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatforms must be used within a PlatformProvider');
  }
  return context;
}
