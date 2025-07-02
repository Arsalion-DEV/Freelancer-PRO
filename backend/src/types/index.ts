// Core API Types

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User & Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  ANALYST = 'analyst'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    jobMatches: boolean;
    compliance: boolean;
    security: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
  jobMatching: {
    autoApply: boolean;
    minSalary?: number;
    maxSalary?: number;
    locations: string[];
    remoteOnly: boolean;
  };
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

// Platform Connection Types
export interface PlatformConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  permissions: string[];
  connectedAt: Date;
  lastSyncAt?: Date;
  metadata: Record<string, any>;
}

export enum SocialPlatform {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
  REDDIT = 'reddit',
  TELEGRAM = 'telegram',
  DISCORD = 'discord'
}

export interface PlatformProfile {
  platformUserId: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  verified?: boolean;
  metadata: Record<string, any>;
}

// Job Monitoring Types
export interface Job {
  id: string;
  platform: string;
  externalId: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    type: 'hourly' | 'annual' | 'contract';
  };
  requirements: string[];
  benefits: string[];
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  postedAt: Date;
  expiresAt?: Date;
  url: string;
  status: JobStatus;
  matchScore?: number;
  aiAnalysis?: JobAIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export enum JobStatus {
  ACTIVE = 'active',
  APPLIED = 'applied',
  EXPIRED = 'expired',
  CLOSED = 'closed',
  SAVED = 'saved',
  HIDDEN = 'hidden'
}

export interface JobAIAnalysis {
  skills: {
    required: string[];
    preferred: string[];
    missing: string[];
  };
  experience: {
    level: 'entry' | 'mid' | 'senior' | 'executive';
    years: number;
  };
  salaryAnalysis: {
    competitive: boolean;
    marketAverage?: number;
    percentile?: number;
  };
  redFlags: string[];
  recommendations: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

// Social Media Content Types
export interface SocialContent {
  id: string;
  platform: SocialPlatform;
  externalId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    text?: string;
    images?: string[];
    videos?: string[];
    links?: string[];
  };
  metrics: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
    engagement: number;
  };
  hashtags: string[];
  mentions: string[];
  postedAt: Date;
  fetchedAt: Date;
  sentiment?: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  moderation?: {
    flagged: boolean;
    flags: string[];
    reviewed: boolean;
    approved: boolean;
  };
}

// Campaign Types
export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: CampaignType;
  platforms: SocialPlatform[];
  targets: CampaignTarget[];
  keywords: string[];
  status: CampaignStatus;
  budget?: {
    total: number;
    spent: number;
    currency: string;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export enum CampaignType {
  MONITORING = 'monitoring',
  ENGAGEMENT = 'engagement',
  CONTENT_CURATION = 'content_curation',
  ANALYTICS = 'analytics'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CampaignTarget {
  type: 'keyword' | 'hashtag' | 'user' | 'location';
  value: string;
  weight: number;
}

export interface CampaignMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  costPerClick?: number;
  costPerConversion?: number;
}

// Analytics Types
export interface AnalyticsData {
  metrics: {
    [key: string]: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
  breakdown: {
    [key: string]: number | string;
  }[];
  trends: {
    date: Date;
    value: number;
  }[];
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
  };
  jobs: {
    total: number;
    active: number;
    matched: number;
    applied: number;
  };
  platforms: {
    connected: number;
    active: number;
    errors: number;
  };
  content: {
    analyzed: number;
    flagged: number;
    engagement: number;
  };
  compliance: {
    score: number;
    violations: number;
    resolved: number;
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  requestId?: string;
}

export interface WebSocketResponse {
  type: string;
  data: any;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

// Error Types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  PLATFORM_ERROR = 'PLATFORM_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Audit & Compliance Types
export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ComplianceReport {
  id: string;
  type: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  status: 'generating' | 'completed' | 'failed';
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}