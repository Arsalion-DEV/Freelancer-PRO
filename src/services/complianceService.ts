// Compliance Monitoring and Reporting Service

import {
  ComplianceConfig,
  RegulationCompliance,
  ComplianceRequirement,
  ComplianceViolation,
  ComplianceMetrics,
  ComplianceTrend,
  ComplianceReport,
  RegulationType,
  ComplianceCategory,
  ComplianceStatus,
  Priority,
  Severity,
  ReportType,
  ReportingPeriod,
  ReportStatus,
  ViolationType,
  ViolationStatus,
  RiskLevel
} from '../types/compliance';

export interface ComplianceAssessmentRequest {
  organizationId: string;
  regulations: RegulationType[];
  scope: string[];
  assessmentDate: Date;
}

export interface ComplianceAssessmentResult {
  overallScore: number;
  regulationScores: Record<RegulationType, number>;
  criticalIssues: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  nextAssessmentDate: Date;
}

export interface ComplianceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: ComplianceCategory;
  estimatedEffort: string;
  potentialImpact: string;
  dueDate: Date;
}

export class ComplianceService {
  private static instance: ComplianceService;
  private complianceConfigs: Map<string, ComplianceConfig> = new Map();
  private violations: Map<string, ComplianceViolation> = new Map();
  private reports: Map<string, ComplianceReport> = new Map();
  private assessmentHistory: Map<string, ComplianceAssessmentResult> = new Map();

  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  private constructor() {
    this.initializeDefaultConfig();
    // Only initialize demo violations in development mode
    if (process.env.NODE_ENV === 'development') {
      this.initializeDemoViolations();
    }
  }

  /**
   * Perform comprehensive compliance assessment
   */
  public async performComplianceAssessment(
    request: ComplianceAssessmentRequest
  ): Promise<ComplianceAssessmentResult> {
    console.log(`Starting compliance assessment for organization: ${request.organizationId}`);

    try {
      const config = this.getComplianceConfig(request.organizationId);
      if (!config) {
        throw new Error('Compliance configuration not found');
      }

      const regulationScores: Record<RegulationType, number> = {} as any;
      const criticalIssues: ComplianceViolation[] = [];
      const recommendations: ComplianceRecommendation[] = [];

      // Assess each regulation
      for (const regulationType of request.regulations) {
        const regulationCompliance = config.regulations.find(r => r.type === regulationType);
        if (regulationCompliance) {
          const score = await this.assessRegulation(regulationCompliance);
          regulationScores[regulationType] = score;

          // Identify critical issues
          const issues = regulationCompliance.violations.filter(v => 
            v.severity === Severity.CRITICAL && v.status !== ViolationStatus.RESOLVED
          );
          criticalIssues.push(...issues);

          // Generate recommendations
          const recs = await this.generateRecommendations(regulationCompliance);
          recommendations.push(...recs);
        }
      }

      // Calculate overall score
      const scores = Object.values(regulationScores);
      const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

      const result: ComplianceAssessmentResult = {
        overallScore: Math.round(overallScore),
        regulationScores,
        criticalIssues,
        recommendations: recommendations.slice(0, 10), // Top 10 recommendations
        nextAssessmentDate: this.calculateNextAssessmentDate(request.assessmentDate)
      };

      // Store assessment result
      this.assessmentHistory.set(`${request.organizationId}_${Date.now()}`, result);

      console.log(`Compliance assessment completed. Overall score: ${result.overallScore}%`);
      return result;

    } catch (error) {
      console.error('Compliance assessment failed:', error);
      throw new Error(`Compliance assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Report a compliance violation
   */
  public reportViolation(violation: Omit<ComplianceViolation, 'id'>): ComplianceViolation {
    const fullViolation: ComplianceViolation = {
      id: `violation_${Date.now()}`,
      ...violation,
      remediationSteps: violation.remediationSteps || []
    };

    this.violations.set(fullViolation.id, fullViolation);
    // Only log violations in development mode to prevent console spam in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`Compliance violation reported: ${fullViolation.type} - ${fullViolation.severity}`);
    }

    // Auto-escalate critical violations
    if (fullViolation.severity === Severity.CRITICAL) {
      this.escalateViolation(fullViolation);
    }

    return fullViolation;
  }

  /**
   * Get compliance metrics for dashboard
   */
  public getComplianceMetrics(organizationId: string): ComplianceMetrics {
    const config = this.getComplianceConfig(organizationId);
    if (!config) {
      throw new Error('Compliance configuration not found');
    }

    // Calculate overall compliance score
    const scores = config.regulations.map(r => this.calculateRegulationScore(r));
    const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

    // Get regulation-specific scores
    const regulationScores: Record<RegulationType, number> = {} as any;
    config.regulations.forEach(regulation => {
      regulationScores[regulation.type] = this.calculateRegulationScore(regulation);
    });

    // Get recent violations
    const recentViolations = Array.from(this.violations.values())
      .filter(v => v.detectedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, 10);

    // Calculate risk level
    const criticalViolations = recentViolations.filter(v => v.severity === Severity.CRITICAL).length;
    const riskLevel = criticalViolations > 0 ? RiskLevel.CRITICAL :
                     recentViolations.length > 5 ? RiskLevel.HIGH :
                     recentViolations.length > 2 ? RiskLevel.MEDIUM : RiskLevel.LOW;

    // Count pending actions
    const pendingActions = config.regulations.reduce((count, regulation) => {
      return count + regulation.requirements.filter(req => 
        req.status === ComplianceStatus.IN_PROGRESS || req.status === ComplianceStatus.NOT_ASSESSED
      ).length;
    }, 0);

    // Generate trends (mock data for demo)
    const trendsData = this.generateComplianceTrends();

    return {
      overallComplianceScore: Math.round(overallScore),
      regulationScores,
      recentViolations,
      riskLevel,
      pendingActions,
      lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      trendsData
    };
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    organizationId: string,
    reportType: ReportType,
    period: ReportingPeriod
  ): Promise<ComplianceReport> {
    console.log(`Generating ${reportType} report for period: ${period}`);

    const reportId = `report_${Date.now()}`;
    const config = this.getComplianceConfig(organizationId);
    
    if (!config) {
      throw new Error('Compliance configuration not found');
    }

    const report: ComplianceReport = {
      id: reportId,
      type: reportType,
      period: this.calculateReportingPeriod(period),
      generatedAt: new Date(),
      generatedBy: 'system',
      status: ReportStatus.GENERATING,
      sections: [],
      attachments: [],
      recipients: ['compliance@company.com', 'legal@company.com']
    };

    // Generate report sections based on type
    switch (reportType) {
      case ReportType.COMPLIANCE_OVERVIEW:
        report.sections = await this.generateComplianceOverviewSections(config);
        break;
      case ReportType.GDPR_REPORT:
        report.sections = await this.generateGDPRReportSections(config);
        break;
      case ReportType.SECURITY_AUDIT:
        report.sections = await this.generateSecurityAuditSections(config);
        break;
      case ReportType.INCIDENT_SUMMARY:
        report.sections = await this.generateIncidentSummarySections();
        break;
      default:
        report.sections = await this.generateComplianceOverviewSections(config);
    }

    report.status = ReportStatus.COMPLETED;
    this.reports.set(reportId, report);

    console.log(`Report generated successfully: ${reportId}`);
    return report;
  }

  /**
   * Get compliance configuration
   */
  public getComplianceConfig(organizationId: string): ComplianceConfig | undefined {
    return this.complianceConfigs.get(organizationId);
  }

  /**
   * Update compliance configuration
   */
  public updateComplianceConfig(config: ComplianceConfig): void {
    config.lastUpdated = new Date();
    this.complianceConfigs.set(config.organizationId, config);
    console.log(`Compliance configuration updated for organization: ${config.organizationId}`);
  }

  /**
   * Get violation by ID
   */
  public getViolation(violationId: string): ComplianceViolation | undefined {
    return this.violations.get(violationId);
  }

  /**
   * Update violation status
   */
  public updateViolationStatus(
    violationId: string, 
    status: ViolationStatus, 
    notes?: string
  ): boolean {
    const violation = this.violations.get(violationId);
    if (!violation) return false;

    violation.status = status;
    if (status === ViolationStatus.RESOLVED) {
      violation.resolvedAt = new Date();
    }

    console.log(`Violation ${violationId} status updated to: ${status}`);
    return true;
  }

  // Private Methods

  private async assessRegulation(regulation: RegulationCompliance): Promise<number> {
    const requirements = regulation.requirements;
    if (requirements.length === 0) return 100;

    const compliantCount = requirements.filter(req => 
      req.status === ComplianceStatus.COMPLIANT
    ).length;

    const partialCount = requirements.filter(req => 
      req.status === ComplianceStatus.PARTIAL
    ).length;

    // Calculate weighted score (partial compliance counts as 50%)
    const score = ((compliantCount + (partialCount * 0.5)) / requirements.length) * 100;
    
    // Update regulation compliance score
    regulation.complianceScore = Math.round(score);
    regulation.lastAssessment = new Date();

    return regulation.complianceScore;
  }

  private async generateRecommendations(
    regulation: RegulationCompliance
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    // Generate recommendations based on non-compliant requirements
    const nonCompliantRequirements = regulation.requirements.filter(req => 
      req.status === ComplianceStatus.NON_COMPLIANT || req.status === ComplianceStatus.NOT_ASSESSED
    );

    for (const requirement of nonCompliantRequirements) {
      recommendations.push({
        id: `rec_${Date.now()}_${Math.random()}`,
        title: `Address ${requirement.title}`,
        description: `Improve compliance for: ${requirement.description}`,
        priority: requirement.priority,
        category: requirement.category,
        estimatedEffort: this.estimateEffort(requirement.priority),
        potentialImpact: this.calculatePotentialImpact(requirement.priority),
        dueDate: requirement.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }

    return recommendations.slice(0, 5); // Top 5 recommendations per regulation
  }

  private calculateRegulationScore(regulation: RegulationCompliance): number {
    if (regulation.requirements.length === 0) return 100;

    const compliantCount = regulation.requirements.filter(req => 
      req.status === ComplianceStatus.COMPLIANT
    ).length;

    return Math.round((compliantCount / regulation.requirements.length) * 100);
  }

  private generateComplianceTrends(): ComplianceTrend[] {
    const trends: ComplianceTrend[] = [];
    const now = new Date();

    // Generate 30 days of mock trend data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date,
        score: 75 + Math.random() * 20, // Score between 75-95
        violations: Math.floor(Math.random() * 5), // 0-4 violations per day
        riskLevel: Math.random() > 0.8 ? RiskLevel.HIGH : 
                  Math.random() > 0.6 ? RiskLevel.MEDIUM : RiskLevel.LOW
      });
    }

    return trends;
  }

  private calculateNextAssessmentDate(currentDate: Date): Date {
    // Next assessment in 90 days
    return new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
  }

  private escalateViolation(violation: ComplianceViolation): void {
    console.log(`CRITICAL VIOLATION ESCALATED: ${violation.type} - ${violation.description}`);
    // In production, this would trigger notifications to compliance team
  }

  private estimateEffort(priority: Priority): string {
    switch (priority) {
      case Priority.CRITICAL: return '1-2 weeks';
      case Priority.HIGH: return '2-4 weeks';
      case Priority.MEDIUM: return '1-2 months';
      case Priority.LOW: return '2-3 months';
      default: return 'TBD';
    }
  }

  private calculatePotentialImpact(priority: Priority): string {
    switch (priority) {
      case Priority.CRITICAL: return 'High regulatory risk, potential fines';
      case Priority.HIGH: return 'Moderate risk, compliance gaps';
      case Priority.MEDIUM: return 'Low risk, process improvements';
      case Priority.LOW: return 'Minimal risk, best practice alignment';
      default: return 'Impact assessment needed';
    }
  }

  private calculateReportingPeriod(period: ReportingPeriod): ReportingPeriod {
    // For simplicity, return the same period
    // In production, this would calculate actual date ranges
    return period;
  }

  private async generateComplianceOverviewSections(config: ComplianceConfig): Promise<any[]> {
    return [
      {
        title: 'Executive Summary',
        content: 'Overall compliance status and key metrics for the reporting period.',
        charts: [{
          type: 'pie',
          title: 'Compliance Status Distribution',
          data: [75, 15, 7, 3],
          labels: ['Compliant', 'Partial', 'Non-Compliant', 'Not Assessed']
        }],
        tables: [],
        recommendations: ['Prioritize non-compliant items', 'Schedule regular assessments']
      },
      {
        title: 'Regulatory Compliance',
        content: 'Status of compliance with various regulations.',
        charts: [{
          type: 'bar',
          title: 'Regulation Compliance Scores',
          data: [85, 78, 92, 67],
          labels: ['GDPR', 'CCPA', 'SOX', 'HIPAA']
        }],
        tables: [{
          title: 'Regulation Details',
          headers: ['Regulation', 'Score', 'Status', 'Last Assessment'],
          rows: [
            ['GDPR', '85%', 'Compliant', '2024-06-15'],
            ['CCPA', '78%', 'Partial', '2024-06-10'],
            ['SOX', '92%', 'Compliant', '2024-06-20'],
            ['HIPAA', '67%', 'Non-Compliant', '2024-06-05']
          ]
        }],
        recommendations: ['Focus on HIPAA compliance improvements']
      }
    ];
  }

  private async generateGDPRReportSections(config: ComplianceConfig): Promise<any[]> {
    return [
      {
        title: 'GDPR Compliance Summary',
        content: 'Detailed analysis of GDPR compliance status.',
        charts: [{
          type: 'line',
          title: 'GDPR Compliance Trend',
          data: [65, 70, 75, 80, 85],
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
        }],
        tables: [{
          title: 'Data Processing Activities',
          headers: ['Activity', 'Legal Basis', 'Data Subjects', 'Retention Period'],
          rows: [
            ['User Registration', 'Consent', '10,000', '3 years'],
            ['Email Marketing', 'Consent', '5,000', '2 years'],
            ['Analytics', 'Legitimate Interest', '15,000', '1 year']
          ]
        }],
        recommendations: ['Review consent mechanisms', 'Update privacy policy']
      }
    ];
  }

  private async generateSecurityAuditSections(config: ComplianceConfig): Promise<any[]> {
    return [
      {
        title: 'Security Posture',
        content: 'Current security status and vulnerabilities.',
        charts: [{
          type: 'area',
          title: 'Security Incidents Over Time',
          data: [2, 1, 3, 0, 1],
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
        }],
        tables: [{
          title: 'Security Controls',
          headers: ['Control', 'Status', 'Last Tested', 'Risk Level'],
          rows: [
            ['Encryption', 'Active', '2024-06-01', 'Low'],
            ['Access Controls', 'Active', '2024-05-15', 'Medium'],
            ['Backup Systems', 'Active', '2024-06-10', 'Low']
          ]
        }],
        recommendations: ['Regular penetration testing', 'Employee security training']
      }
    ];
  }

  private async generateIncidentSummarySections(): Promise<any[]> {
    return [
      {
        title: 'Incident Overview',
        content: 'Summary of security and compliance incidents.',
        charts: [{
          type: 'bar',
          title: 'Incidents by Category',
          data: [2, 5, 1, 3],
          labels: ['Data Breach', 'Access Violation', 'System Compromise', 'Policy Violation']
        }],
        tables: [{
          title: 'Recent Incidents',
          headers: ['Date', 'Type', 'Severity', 'Status'],
          rows: [
            ['2024-06-15', 'Access Violation', 'Medium', 'Resolved'],
            ['2024-06-10', 'Policy Violation', 'Low', 'Investigating'],
            ['2024-06-05', 'Data Breach', 'High', 'Resolved']
          ]
        }],
        recommendations: ['Strengthen access controls', 'Improve incident response time']
      }
    ];
  }

  private initializeDemoViolations(): void {
    // Create some sample violations to populate the dashboard
    const demoViolations = [
      {
        type: ViolationType.CONSENT_VIOLATION,
        severity: Severity.HIGH,
        description: 'Cookie consent banner not properly implemented on marketing pages',
        detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        status: ViolationStatus.INVESTIGATING,
        affectedUsers: 1500,
        remediationSteps: [
          {
            id: 'fix-001',
            action: 'Update cookie consent implementation',
            responsible: 'Frontend Team',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'in-progress' as const
          }
        ],
        reportedToAuthorities: false
      },
      {
        type: ViolationType.DATA_BREACH,
        severity: Severity.MEDIUM,
        description: 'Minor data exposure in API logs - no sensitive data affected',
        detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: ViolationStatus.RESOLVED,
        affectedUsers: 50,
        remediationSteps: [
          {
            id: 'fix-002',
            action: 'Implement log sanitization',
            responsible: 'Security Team',
            deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'completed' as const,
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        reportedToAuthorities: false
      },
      {
        type: ViolationType.RETENTION_VIOLATION,
        severity: Severity.LOW,
        description: 'User data retention period exceeded for inactive accounts',
        detectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        status: ViolationStatus.INVESTIGATING,
        affectedUsers: 800,
        remediationSteps: [
          {
            id: 'fix-003',
            action: 'Implement automated data purging for inactive accounts',
            responsible: 'Data Team',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending' as const
          }
        ],
        reportedToAuthorities: false
      }
    ];
    
    // Add violations to the service
    demoViolations.forEach(violation => {
      this.reportViolation(violation);
    });
  }

  private initializeDefaultConfig(): void {
    const defaultConfig: ComplianceConfig = {
      id: 'default-config',
      organizationId: 'demo-org',
      regulations: [
        {
          type: RegulationType.GDPR,
          isEnabled: true,
          requirements: [
            {
              id: 'gdpr-001',
              title: 'Data Protection Impact Assessment',
              description: 'Conduct DPIA for high-risk processing activities',
              category: ComplianceCategory.DATA_PROTECTION,
              priority: Priority.HIGH,
              status: ComplianceStatus.COMPLIANT,
              evidence: [],
              responsible: 'Data Protection Officer',
              lastReviewed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            {
              id: 'gdpr-002',
              title: 'Consent Management',
              description: 'Implement valid consent mechanisms',
              category: ComplianceCategory.USER_CONSENT,
              priority: Priority.CRITICAL,
              status: ComplianceStatus.PARTIAL,
              evidence: [],
              responsible: 'Legal Team',
              lastReviewed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
            }
          ],
          reportingFrequency: 'monthly' as any,
          lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          complianceScore: 75,
          violations: []
        },
        {
          type: RegulationType.CCPA,
          isEnabled: true,
          requirements: [
            {
              id: 'ccpa-001',
              title: 'Consumer Rights Implementation',
              description: 'Implement right to know, delete, and opt-out',
              category: ComplianceCategory.USER_RIGHTS,
              priority: Priority.HIGH,
              status: ComplianceStatus.IN_PROGRESS,
              evidence: [],
              responsible: 'Privacy Team',
              lastReviewed: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
            }
          ],
          reportingFrequency: 'quarterly' as any,
          lastAssessment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          complianceScore: 65,
          violations: []
        }
      ],
      contentModerationRules: [],
      dataPrivacySettings: {
        dataRetentionPeriod: 1095, // 3 years
        anonymizationEnabled: true,
        encryptionEnabled: true,
        crossBorderTransferAllowed: false,
        allowedCountries: ['US', 'CA', 'EU'],
        consentManagement: {
          requireExplicitConsent: true,
          consentExpiryDays: 365,
          granularConsent: true,
          consentWithdrawalEnabled: true,
          minorConsentRequired: true,
          consentTypes: []
        },
        userRights: {
          dataPortabilityEnabled: true,
          rightToErasureEnabled: true,
          rightToRectificationEnabled: true,
          rightToAccessEnabled: true,
          rightToObjectEnabled: true,
          dataProcessingInfoEnabled: true
        },
        cookiePolicy: {
          essentialCookiesOnly: false,
          cookieBannerEnabled: true,
          cookieCategories: [],
          thirdPartyCookiesAllowed: false
        }
      },
      auditSettings: {
        enabledEvents: ['user-login' as any, 'data-access' as any, 'data-modification' as any],
        retentionPeriod: 2555, // 7 years
        encryptLogs: true,
        realTimeMonitoring: true,
        alertingEnabled: true,
        alertThresholds: [],
        exportFormats: ['json' as any, 'csv' as any]
      },
      rateLimits: {
        globalLimits: [],
        userLimits: [],
        ipLimits: [],
        platformLimits: [],
        emergencyMode: {
          enabled: false,
          triggerConditions: [],
          restrictions: [],
          notificationChannels: []
        }
      },
      lastUpdated: new Date(),
      isActive: true
    };

    this.complianceConfigs.set(defaultConfig.organizationId, defaultConfig);
  }
}

export const complianceService = ComplianceService.getInstance();