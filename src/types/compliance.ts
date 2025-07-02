// Compliance and Safety System Types

export interface ComplianceConfig {
  id: string;
  organizationId: string;
  regulations: RegulationCompliance[];
  contentModerationRules: ContentModerationRule[];
  dataPrivacySettings: DataPrivacySettings;
  auditSettings: AuditSettings;
  rateLimits: RateLimitConfig;
  lastUpdated: Date;
  isActive: boolean;
}

export interface RegulationCompliance {
  type: RegulationType;
  isEnabled: boolean;
  requirements: ComplianceRequirement[];
  reportingFrequency: ReportingFrequency;
  lastAssessment: Date;
  complianceScore: number;
  violations: ComplianceViolation[];
}

export enum RegulationType {
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  COPPA = 'coppa',
  SOX = 'sox',
  HIPAA = 'hipaa',
  PIPEDA = 'pipeda',
  LGPD = 'lgpd',
  CUSTOM = 'custom'
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: ComplianceCategory;
  priority: Priority;
  status: ComplianceStatus;
  evidence: Evidence[];
  deadline?: Date;
  responsible: string;
  lastReviewed: Date;
}

export enum ComplianceCategory {
  DATA_PROTECTION = 'data-protection',
  USER_CONSENT = 'user-consent',
  DATA_RETENTION = 'data-retention',
  CROSS_BORDER_TRANSFER = 'cross-border-transfer',
  BREACH_NOTIFICATION = 'breach-notification',
  USER_RIGHTS = 'user-rights',
  SECURITY_MEASURES = 'security-measures',
  DOCUMENTATION = 'documentation'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non-compliant',
  PARTIAL = 'partial',
  IN_PROGRESS = 'in-progress',
  NOT_ASSESSED = 'not-assessed'
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  url?: string;
  uploadedBy: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

export enum EvidenceType {
  DOCUMENT = 'document',
  SCREENSHOT = 'screenshot',
  CERTIFICATE = 'certificate',
  AUDIT_REPORT = 'audit-report',
  POLICY = 'policy',
  PROCEDURE = 'procedure'
}

export interface ComplianceViolation {
  id: string;
  type: ViolationType;
  severity: Severity;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: ViolationStatus;
  affectedUsers?: number;
  remediationSteps: RemediationStep[];
  reportedToAuthorities: boolean;
}

export enum ViolationType {
  DATA_BREACH = 'data-breach',
  UNAUTHORIZED_ACCESS = 'unauthorized-access',
  CONSENT_VIOLATION = 'consent-violation',
  RETENTION_VIOLATION = 'retention-violation',
  TRANSFER_VIOLATION = 'transfer-violation',
  NOTIFICATION_FAILURE = 'notification-failure'
}

export enum ViolationStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface RemediationStep {
  id: string;
  action: string;
  responsible: string;
  deadline: Date;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: Date;
}

// Content Moderation
export interface ContentModerationRule {
  id: string;
  name: string;
  description: string;
  category: ModerationCategory;
  ruleType: RuleType;
  conditions: ModerationCondition[];
  actions: ModerationAction[];
  severity: Severity;
  isActive: boolean;
  platforms: string[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export enum ModerationCategory {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate-speech',
  VIOLENCE = 'violence',
  ADULT_CONTENT = 'adult-content',
  PERSONAL_INFO = 'personal-info',
  COPYRIGHTED = 'copyrighted',
  MISINFORMATION = 'misinformation',
  PHISHING = 'phishing',
  INAPPROPRIATE_LANGUAGE = 'inappropriate-language'
}

export enum RuleType {
  KEYWORD_FILTER = 'keyword-filter',
  REGEX_PATTERN = 'regex-pattern',
  AI_CLASSIFIER = 'ai-classifier',
  IMAGE_ANALYSIS = 'image-analysis',
  SENTIMENT_ANALYSIS = 'sentiment-analysis',
  USER_BEHAVIOR = 'user-behavior'
}

export interface ModerationCondition {
  field: string;
  operator: 'contains' | 'matches' | 'equals' | 'greater_than' | 'less_than';
  value: any;
  caseSensitive: boolean;
}

export interface ModerationAction {
  type: ActionType;
  parameters: Record<string, any>;
  notify: boolean;
  escalate: boolean;
}

export enum ActionType {
  BLOCK_CONTENT = 'block-content',
  FLAG_FOR_REVIEW = 'flag-for-review',
  AUTO_RESPOND = 'auto-respond',
  NOTIFY_ADMIN = 'notify-admin',
  QUARANTINE_USER = 'quarantine-user',
  LOG_INCIDENT = 'log-incident',
  SEND_WARNING = 'send-warning'
}

// Content Analysis
export interface ContentAnalysis {
  id: string;
  contentId: string;
  platform: string;
  contentType: ContentType;
  text?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  analyzedAt: Date;
  results: AnalysisResult[];
  overallRisk: RiskLevel;
  moderationDecision: ModerationDecision;
  reviewRequired: boolean;
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  MIXED = 'mixed'
}

export interface AnalysisResult {
  category: ModerationCategory;
  confidence: number;
  details: string;
  flaggedElements: string[];
  suggestions: string[];
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ModerationDecision {
  action: ActionType;
  reason: string;
  automatedDecision: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  appealable: boolean;
}

// Data Privacy
export interface DataPrivacySettings {
  dataRetentionPeriod: number; // days
  anonymizationEnabled: boolean;
  encryptionEnabled: boolean;
  crossBorderTransferAllowed: boolean;
  allowedCountries: string[];
  consentManagement: ConsentSettings;
  userRights: UserRightsSettings;
  cookiePolicy: CookieSettings;
}

export interface ConsentSettings {
  requireExplicitConsent: boolean;
  consentExpiryDays: number;
  granularConsent: boolean;
  consentWithdrawalEnabled: boolean;
  minorConsentRequired: boolean;
  consentTypes: ConsentType[];
}

export interface ConsentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: ConsentCategory;
  retentionPeriod: number;
}

export enum ConsentCategory {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  SOCIAL_MEDIA = 'social-media'
}

export interface UserRightsSettings {
  dataPortabilityEnabled: boolean;
  rightToErasureEnabled: boolean;
  rightToRectificationEnabled: boolean;
  rightToAccessEnabled: boolean;
  rightToObjectEnabled: boolean;
  dataProcessingInfoEnabled: boolean;
}

export interface CookieSettings {
  essentialCookiesOnly: boolean;
  cookieBannerEnabled: boolean;
  cookieCategories: CookieCategory[];
  thirdPartyCookiesAllowed: boolean;
}

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies: CookieInfo[];
}

export interface CookieInfo {
  name: string;
  purpose: string;
  domain: string;
  duration: string;
  type: 'session' | 'persistent';
}

// Audit Logging
export interface AuditSettings {
  enabledEvents: AuditEventType[];
  retentionPeriod: number; // days
  encryptLogs: boolean;
  realTimeMonitoring: boolean;
  alertingEnabled: boolean;
  alertThresholds: AlertThreshold[];
  exportFormats: ExportFormat[];
}

export enum AuditEventType {
  USER_LOGIN = 'user-login',
  USER_LOGOUT = 'user-logout',
  DATA_ACCESS = 'data-access',
  DATA_MODIFICATION = 'data-modification',
  DATA_DELETION = 'data-deletion',
  DATA_EXPORT = 'data-export',
  SYSTEM_CONFIG_CHANGE = 'system-config-change',
  SECURITY_EVENT = 'security-event',
  COMPLIANCE_VIOLATION = 'compliance-violation',
  MODERATION_ACTION = 'moderation-action'
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource: string;
  oldValue?: any;
  newValue?: any;
  success: boolean;
  errorMessage?: string;
  severity: Severity;
  metadata: Record<string, any>;
}

export interface AlertThreshold {
  eventType: AuditEventType;
  count: number;
  timeWindow: number; // minutes
  action: AlertAction;
}

export enum AlertAction {
  EMAIL_NOTIFICATION = 'email-notification',
  SMS_NOTIFICATION = 'sms-notification',
  SLACK_NOTIFICATION = 'slack-notification',
  WEBHOOK = 'webhook',
  BLOCK_USER = 'block-user',
  ESCALATE_TO_ADMIN = 'escalate-to-admin'
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
  PDF = 'pdf'
}

// Rate Limiting
export interface RateLimitConfig {
  globalLimits: RateLimit[];
  userLimits: RateLimit[];
  ipLimits: RateLimit[];
  platformLimits: PlatformRateLimit[];
  emergencyMode: EmergencyModeConfig;
}

export interface RateLimit {
  resource: string;
  requests: number;
  window: number; // seconds
  action: RateLimitAction;
  whitelist: string[];
  blacklist: string[];
}

export enum RateLimitAction {
  THROTTLE = 'throttle',
  REJECT = 'reject',
  QUEUE = 'queue',
  WARN = 'warn'
}

export interface PlatformRateLimit {
  platform: string;
  limits: PlatformSpecificLimit[];
  respectPlatformLimits: boolean;
  bufferPercentage: number;
}

export interface PlatformSpecificLimit {
  endpoint: string;
  requests: number;
  window: number;
  resetTime?: Date;
}

export interface EmergencyModeConfig {
  enabled: boolean;
  triggerConditions: EmergencyTrigger[];
  restrictions: EmergencyRestriction[];
  notificationChannels: string[];
}

export interface EmergencyTrigger {
  condition: string;
  threshold: number;
  timeWindow: number;
}

export interface EmergencyRestriction {
  action: string;
  scope: 'global' | 'user' | 'platform';
  duration: number;
}

// Reporting
export interface ComplianceReport {
  id: string;
  type: ReportType;
  period: ReportingPeriod;
  generatedAt: Date;
  generatedBy: string;
  status: ReportStatus;
  sections: ReportSection[];
  attachments: ReportAttachment[];
  recipients: string[];
  scheduledDelivery?: Date;
}

export enum ReportType {
  COMPLIANCE_OVERVIEW = 'compliance-overview',
  GDPR_REPORT = 'gdpr-report',
  SECURITY_AUDIT = 'security-audit',
  DATA_PROCESSING = 'data-processing',
  INCIDENT_SUMMARY = 'incident-summary',
  MODERATION_REPORT = 'moderation-report',
  RISK_ASSESSMENT = 'risk-assessment'
}

export enum ReportingPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export enum ReportingFrequency {
  ON_DEMAND = 'on-demand',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export enum ReportStatus {
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

export interface ReportSection {
  title: string;
  content: string;
  charts: ChartData[];
  tables: TableData[];
  recommendations: string[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  labels: string[];
}

export interface TableData {
  title: string;
  headers: string[];
  rows: any[][];
}

export interface ReportAttachment {
  filename: string;
  type: string;
  size: number;
  url: string;
}

// Common Enums
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Dashboard Analytics
export interface ComplianceMetrics {
  overallComplianceScore: number;
  regulationScores: Record<RegulationType, number>;
  recentViolations: ComplianceViolation[];
  riskLevel: RiskLevel;
  pendingActions: number;
  lastAssessment: Date;
  trendsData: ComplianceTrend[];
}

export interface ComplianceTrend {
  date: Date;
  score: number;
  violations: number;
  riskLevel: RiskLevel;
}

export interface ModerationMetrics {
  totalContentAnalyzed: number;
  contentBlocked: number;
  falsePositives: number;
  averageResponseTime: number;
  topViolationCategories: CategoryCount[];
  platformBreakdown: PlatformModerationStats[];
}

export interface CategoryCount {
  category: ModerationCategory;
  count: number;
  percentage: number;
}

export interface PlatformModerationStats {
  platform: string;
  analyzed: number;
  blocked: number;
  flagged: number;
  accuracy: number;
}

export interface SecurityMetrics {
  threatLevel: RiskLevel;
  blockedThreats: number;
  suspiciousActivities: number;
  securityScore: number;
  lastSecurityScan: Date;
  vulnerabilities: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: Severity;
  description: string;
  affectedSystems: string[];
  discoveredAt: Date;
  status: 'open' | 'in-progress' | 'resolved';
}

// Incident Management
export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  category: IncidentCategory;
  detectedAt: Date;
  reportedBy: string;
  assignedTo?: string;
  resolvedAt?: Date;
  affectedSystems: string[];
  affectedUsers: number;
  timeline: IncidentTimelineEvent[];
  containmentActions: ContainmentAction[];
  rootCause?: string;
  preventionMeasures: string[];
}

export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum IncidentCategory {
  DATA_BREACH = 'data-breach',
  SYSTEM_COMPROMISE = 'system-compromise',
  MALWARE = 'malware',
  PHISHING = 'phishing',
  DENIAL_OF_SERVICE = 'denial-of-service',
  INSIDER_THREAT = 'insider-threat',
  PRIVACY_VIOLATION = 'privacy-violation'
}

export interface IncidentTimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
  actor: string;
}

export interface ContainmentAction {
  action: string;
  implementedAt: Date;
  implementedBy: string;
  effectiveness: 'low' | 'medium' | 'high';
  description: string;
}

// Security Alerts (moved from auditLogService.ts for better organization)
export interface SecurityAlert {
  id: string;
  triggeredAt: Date;
  threshold: AlertThreshold;
  eventCount: number;
  timeWindow: number;
  affectedUser?: string;
  description: string;
  severity: Severity;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}
