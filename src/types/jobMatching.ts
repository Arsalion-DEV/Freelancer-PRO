// Advanced Job Matching System Types

export interface JobMatchingProfile {
  id: string;
  userId: string;
  skills: SkillProfile[];
  experience: ExperienceProfile;
  preferences: JobPreferences;
  responseTemplates: ResponseTemplate[];
  lastUpdated: Date;
}

export interface SkillProfile {
  name: string;
  category: SkillCategory;
  proficiency: SkillLevel;
  yearsOfExperience: number;
  keywords: string[];
  certifications?: string[];
  projects?: ProjectReference[];
}

export enum SkillCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  MOBILE = 'mobile',
  DEVOPS = 'devops',
  DESIGN = 'design',
  DATA = 'data',
  AI_ML = 'ai-ml',
  BLOCKCHAIN = 'blockchain',
  GAMING = 'gaming',
  OTHER = 'other'
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface ExperienceProfile {
  totalYears: number;
  seniorityLevel: SeniorityLevel;
  industries: string[];
  companySize: CompanySize[];
  workStyle: WorkStyle[];
  availability: AvailabilityStatus;
}

export enum SeniorityLevel {
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  PRINCIPAL = 'principal',
  ARCHITECT = 'architect'
}

export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise'
}

export enum WorkStyle {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  FULLTIME = 'fulltime',
  PARTTIME = 'parttime'
}

export enum AvailabilityStatus {
  IMMEDIATELY = 'immediately',
  TWO_WEEKS = 'two-weeks',
  ONE_MONTH = 'one-month',
  THREE_MONTHS = 'three-months',
  NOT_AVAILABLE = 'not-available'
}

export interface JobPreferences {
  salaryRange: SalaryRange;
  preferredLocations: string[];
  remoteAllowed: boolean;
  contractTypes: ContractType[];
  excludeKeywords: string[];
  minimumMatchScore: number;
  autoResponseThreshold: number;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export enum ContractType {
  PERMANENT = 'permanent',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary'
}

export interface ProjectReference {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  duration: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  category: ResponseCategory;
  isActive: boolean;
  successRate?: number;
  lastUsed?: Date;
}

export enum ResponseCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  CREATIVE = 'creative',
  EXECUTIVE = 'executive',
  STARTUP = 'startup',
  ENTERPRISE = 'enterprise'
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'list';
  defaultValue?: any;
  description: string;
}

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
}

// Enhanced Job Analysis
export interface EnhancedJob {
  // Base job properties
  id: string;
  platform: string;
  title: string;
  description: string;
  company: string;
  location: string;
  postedAt: Date;
  url: string;
  
  // AI-Enhanced Analysis
  analysis: JobAnalysis;
  matchScore: JobMatchScore;
  classification: JobClassification;
  recommendations: JobRecommendation[];
  autoResponse?: AutoResponse;
  
  // Tracking
  status: JobStatus;
  interactions: JobInteraction[];
  lastProcessed: Date;
}

export interface JobAnalysis {
  // Content Analysis
  extractedSkills: ExtractedSkill[];
  salaryAnalysis: SalaryAnalysis;
  experienceRequirement: ExperienceRequirement;
  workArrangement: WorkArrangementAnalysis;
  
  // Semantic Analysis
  sentiment: SentimentAnalysis;
  urgency: UrgencyLevel;
  competitiveness: CompetitivenessLevel;
  
  // Red Flags
  redFlags: RedFlag[];
  qualityScore: number;
}

export interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  importance: 'required' | 'preferred' | 'nice-to-have';
  context: string;
  confidence: number;
}

export interface SalaryAnalysis {
  hasSalary: boolean;
  range?: SalaryRange;
  isCompetitive?: boolean;
  marketComparison?: 'below' | 'at' | 'above';
  confidence: number;
}

export interface ExperienceRequirement {
  minimumYears: number;
  maximumYears?: number;
  seniorityLevel: SeniorityLevel;
  specificRequirements: string[];
  confidence: number;
}

export interface WorkArrangementAnalysis {
  workStyle: WorkStyle[];
  location: LocationAnalysis;
  schedule: ScheduleAnalysis;
  travelRequired: boolean;
}

export interface LocationAnalysis {
  isRemote: boolean;
  specificLocations: string[];
  timeZoneRequirements?: string[];
  relocationRequired: boolean;
}

export interface ScheduleAnalysis {
  hoursPerWeek?: number;
  flexibility: 'none' | 'some' | 'high';
  timeZoneOverlap?: string[];
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  aspects: {
    company: number;
    role: number;
    benefits: number;
    requirements: number;
  };
  confidence: number;
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum CompetitivenessLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very-high'
}

export interface RedFlag {
  type: RedFlagType;
  description: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

export enum RedFlagType {
  UNREALISTIC_REQUIREMENTS = 'unrealistic-requirements',
  LOW_COMPENSATION = 'low-compensation',
  VAGUE_DESCRIPTION = 'vague-description',
  TOO_MANY_REQUIREMENTS = 'too-many-requirements',
  SUSPICIOUS_COMPANY = 'suspicious-company',
  PYRAMID_SCHEME = 'pyramid-scheme',
  UNPAID_WORK = 'unpaid-work',
  DISCRIMINATION = 'discrimination'
}

// Job Matching Score
export interface JobMatchScore {
  overall: number;
  breakdown: ScoreBreakdown;
  explanation: string[];
  confidence: number;
  lastCalculated: Date;
}

export interface ScoreBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  salaryMatch: number;
  locationMatch: number;
  workStyleMatch: number;
  companyMatch: number;
  industryMatch: number;
  culturalFit: number;
}

// Job Classification
export interface JobClassification {
  primary: JobCategory;
  secondary: JobCategory[];
  tags: string[];
  difficultyLevel: DifficultyLevel;
  timeCommitment: TimeCommitment;
  careerLevel: CareerLevel;
}

export enum JobCategory {
  FRONTEND_DEVELOPMENT = 'frontend-development',
  BACKEND_DEVELOPMENT = 'backend-development',
  FULLSTACK_DEVELOPMENT = 'fullstack-development',
  MOBILE_DEVELOPMENT = 'mobile-development',
  DEVOPS_ENGINEERING = 'devops-engineering',
  DATA_SCIENCE = 'data-science',
  MACHINE_LEARNING = 'machine-learning',
  UI_UX_DESIGN = 'ui-ux-design',
  PRODUCT_MANAGEMENT = 'product-management',
  PROJECT_MANAGEMENT = 'project-management',
  TECHNICAL_WRITING = 'technical-writing',
  QA_TESTING = 'qa-testing',
  SECURITY = 'security',
  BLOCKCHAIN = 'blockchain',
  GAME_DEVELOPMENT = 'game-development',
  CONSULTING = 'consulting',
  OTHER = 'other'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum TimeCommitment {
  SHORT_TERM = 'short-term',
  MEDIUM_TERM = 'medium-term',
  LONG_TERM = 'long-term',
  ONGOING = 'ongoing'
}

export enum CareerLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  EXECUTIVE = 'executive'
}

// Recommendations
export interface JobRecommendation {
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action?: RecommendedAction;
  reasoning: string;
}

export enum RecommendationType {
  APPLY_NOW = 'apply-now',
  APPLY_LATER = 'apply-later',
  SKIP = 'skip',
  NEGOTIATE_TERMS = 'negotiate-terms',
  REQUEST_INFO = 'request-info',
  IMPROVE_SKILLS = 'improve-skills',
  NETWORK_FIRST = 'network-first'
}

export interface RecommendedAction {
  type: 'respond' | 'wait' | 'research' | 'skill-up';
  details: string;
  timeline?: string;
  resources?: string[];
}

// Auto Response
export interface AutoResponse {
  shouldRespond: boolean;
  confidence: number;
  template: ResponseTemplate;
  personalizedContent: string;
  scheduledFor?: Date;
  reasoning: string;
  variables: Record<string, any>;
}

// Job Status & Interactions
export enum JobStatus {
  NEW = 'new',
  ANALYZED = 'analyzed',
  INTERESTED = 'interested',
  APPLIED = 'applied',
  RESPONDED = 'responded',
  INTERVIEWING = 'interviewing',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  IGNORED = 'ignored',
  ARCHIVED = 'archived'
}

export interface JobInteraction {
  id: string;
  type: InteractionType;
  timestamp: Date;
  details: string;
  metadata?: Record<string, any>;
}

export enum InteractionType {
  VIEWED = 'viewed',
  ANALYZED = 'analyzed',
  RESPONDED = 'responded',
  SAVED = 'saved',
  SHARED = 'shared',
  NOTED = 'noted',
  STATUS_CHANGED = 'status-changed'
}

// Analytics & Metrics
export interface MatchingAnalytics {
  totalJobsAnalyzed: number;
  averageMatchScore: number;
  responseRate: number;
  successRate: number;
  topSkillsInDemand: SkillDemand[];
  salaryTrends: SalaryTrend[];
  platformPerformance: PlatformMetrics[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface SkillDemand {
  skill: string;
  category: SkillCategory;
  demandCount: number;
  averageSalary: number;
  growthRate: number;
}

export interface SalaryTrend {
  skill: string;
  period: string;
  averageSalary: number;
  change: number;
  sampleSize: number;
}

export interface PlatformMetrics {
  platform: string;
  jobCount: number;
  averageMatchScore: number;
  responseRate: number;
  qualityScore: number;
}

export interface ImprovementSuggestion {
  type: 'skill' | 'profile' | 'template' | 'strategy';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potentialImpact: string;
  resources?: string[];
}