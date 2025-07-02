// Audit Logging Service for Security and Compliance Tracking

import {
  AuditLog,
  AuditEventType,
  AuditSettings,
  AlertThreshold,
  AlertAction,
  Severity,
  ExportFormat,
  SecurityAlert
} from '../types/compliance';

export interface LogEvent {
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  oldValue?: any;
  newValue?: any;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  eventTypes?: AuditEventType[];
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  success?: boolean;
  severity?: Severity;
  resource?: string;
  limit?: number;
  offset?: number;
}

export interface AuditExportOptions {
  format: ExportFormat;
  query: AuditQuery;
  filename?: string;
  includeMetadata?: boolean;
}


export class AuditLogService {
  private static instance: AuditLogService;
  private logs: Map<string, AuditLog> = new Map();
  private settings!: AuditSettings;
  private alerts: Map<string, SecurityAlert> = new Map();
  private eventCounters: Map<string, { count: number; resetTime: Date }> = new Map();

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  private constructor() {
    this.initializeSettings();
    this.startPeriodicCleanup();
  }

  /**
   * Log an audit event
   */
  public logEvent(event: LogEvent, ipAddress: string, userAgent: string): AuditLog {
    // Check if event type is enabled
    if (!this.settings.enabledEvents.includes(event.eventType)) {
      return {} as AuditLog; // Skip logging if event type is disabled
    }

    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType: event.eventType,
      userId: event.userId,
      sessionId: event.sessionId,
      ipAddress: this.sanitizeIpAddress(ipAddress),
      userAgent: this.sanitizeUserAgent(userAgent),
      action: event.action,
      resource: event.resource,
      oldValue: event.oldValue,
      newValue: event.newValue,
      success: event.success,
      errorMessage: event.errorMessage,
      severity: this.determineSeverity(event),
      metadata: {
        ...event.metadata,
        source: 'audit-service',
        version: '1.0'
      }
    };

    // Encrypt sensitive data if encryption is enabled
    if (this.settings.encryptLogs) {
      auditLog.oldValue = this.encryptSensitiveData(auditLog.oldValue);
      auditLog.newValue = this.encryptSensitiveData(auditLog.newValue);
    }

    // Store the log
    this.logs.set(auditLog.id, auditLog);

    // Check for real-time monitoring alerts
    if (this.settings.realTimeMonitoring && this.settings.alertingEnabled) {
      this.checkAlertThresholds(auditLog);
    }

    // Log to console for debugging
    console.log(`Audit Log: ${auditLog.eventType} - ${auditLog.action} by ${auditLog.userId || 'anonymous'}`);

    return auditLog;
  }

  /**
   * Query audit logs
   */
  public queryLogs(query: AuditQuery): AuditLog[] {
    let filteredLogs = Array.from(this.logs.values());

    // Apply filters
    if (query.eventTypes && query.eventTypes.length > 0) {
      filteredLogs = filteredLogs.filter(log => query.eventTypes!.includes(log.eventType));
    }

    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    if (query.dateFrom) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= query.dateFrom!);
    }

    if (query.dateTo) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= query.dateTo!);
    }

    if (query.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === query.success);
    }

    if (query.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === query.severity);
    }

    if (query.resource) {
      filteredLogs = filteredLogs.filter(log => 
        log.resource.toLowerCase().includes(query.resource!.toLowerCase())
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Export audit logs
   */
  public async exportLogs(options: AuditExportOptions): Promise<string> {
    const logs = this.queryLogs(options.query);
    const filename = options.filename || `audit_export_${Date.now()}`;

    switch (options.format) {
      case ExportFormat.JSON:
        return this.exportAsJSON(logs, filename, options.includeMetadata);
      case ExportFormat.CSV:
        return this.exportAsCSV(logs, filename, options.includeMetadata);
      case ExportFormat.XML:
        return this.exportAsXML(logs, filename, options.includeMetadata);
      case ExportFormat.PDF:
        return this.exportAsPDF(logs, filename, options.includeMetadata);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Get security alerts
   */
  public getSecurityAlerts(acknowledged?: boolean): SecurityAlert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === acknowledged);
    }

    return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Acknowledge security alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    console.log(`Security alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    return true;
  }

  /**
   * Get audit statistics
   */
  public getAuditStatistics(dateFrom?: Date, dateTo?: Date): any {
    const query: AuditQuery = {};
    if (dateFrom) query.dateFrom = dateFrom;
    if (dateTo) query.dateTo = dateTo;

    const logs = this.queryLogs(query);

    // Event type distribution
    const eventTypeStats: Record<string, number> = {};
    logs.forEach(log => {
      eventTypeStats[log.eventType] = (eventTypeStats[log.eventType] || 0) + 1;
    });

    // Success/failure rates
    const successCount = logs.filter(log => log.success).length;
    const failureCount = logs.length - successCount;
    const successRate = logs.length > 0 ? (successCount / logs.length) * 100 : 0;

    // Severity distribution
    const severityStats: Record<string, number> = {};
    logs.forEach(log => {
      severityStats[log.severity] = (severityStats[log.severity] || 0) + 1;
    });

    // Top users by activity
    const userStats: Record<string, number> = {};
    logs.forEach(log => {
      if (log.userId) {
        userStats[log.userId] = (userStats[log.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      totalLogs: logs.length,
      dateRange: {
        from: dateFrom || (logs.length > 0 ? logs[logs.length - 1].timestamp : new Date()),
        to: dateTo || (logs.length > 0 ? logs[0].timestamp : new Date())
      },
      eventTypeStats,
      successRate: Math.round(successRate * 100) / 100,
      successCount,
      failureCount,
      severityStats,
      topUsers,
      alertCount: this.alerts.size,
      unacknowledgedAlerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged).length
    };
  }

  /**
   * Update audit settings
   */
  public updateSettings(newSettings: Partial<AuditSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Audit settings updated');
  }

  /**
   * Get current audit settings
   */
  public getSettings(): AuditSettings {
    return { ...this.settings };
  }

  // Private Methods

  private determineSeverity(event: LogEvent): Severity {
    // Determine severity based on event type and success
    if (!event.success) {
      switch (event.eventType) {
        case AuditEventType.SECURITY_EVENT:
        case AuditEventType.COMPLIANCE_VIOLATION:
          return Severity.CRITICAL;
        case AuditEventType.DATA_DELETION:
        case AuditEventType.SYSTEM_CONFIG_CHANGE:
          return Severity.HIGH;
        case AuditEventType.DATA_MODIFICATION:
        case AuditEventType.DATA_ACCESS:
          return Severity.MEDIUM;
        default:
          return Severity.LOW;
      }
    }

    // Successful events are generally lower severity
    switch (event.eventType) {
      case AuditEventType.SECURITY_EVENT:
        return Severity.MEDIUM;
      case AuditEventType.DATA_DELETION:
      case AuditEventType.SYSTEM_CONFIG_CHANGE:
        return Severity.MEDIUM;
      case AuditEventType.COMPLIANCE_VIOLATION:
        return Severity.HIGH;
      default:
        return Severity.LOW;
    }
  }

  private sanitizeIpAddress(ipAddress: string): string {
    // Basic IP address validation and sanitization
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(ipAddress)) {
      return ipAddress;
    }
    return 'unknown';
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Truncate and sanitize user agent string
    return userAgent ? userAgent.substring(0, 200) : 'unknown';
  }

  private encryptSensitiveData(data: any): any {
    // Mock encryption - in production, use proper encryption
    if (data && typeof data === 'object') {
      return '[ENCRYPTED]';
    }
    if (typeof data === 'string' && data.length > 0) {
      return '[ENCRYPTED]';
    }
    return data;
  }

  private checkAlertThresholds(log: AuditLog): void {
    this.settings.alertThresholds.forEach(threshold => {
      if (threshold.eventType === log.eventType) {
        const countKey = `${threshold.eventType}_${log.userId || 'anonymous'}`;
        const now = new Date();
        const windowStart = new Date(now.getTime() - threshold.timeWindow * 60 * 1000);

        // Count events in the time window
        const recentLogs = Array.from(this.logs.values()).filter(auditLog =>
          auditLog.eventType === threshold.eventType &&
          auditLog.userId === log.userId &&
          auditLog.timestamp >= windowStart
        );

        if (recentLogs.length >= threshold.count) {
          this.triggerAlert(threshold, recentLogs.length, log.userId);
        }
      }
    });
  }

  private triggerAlert(threshold: AlertThreshold, eventCount: number, userId?: string): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: SecurityAlert = {
      id: alertId,
      triggeredAt: new Date(),
      threshold,
      eventCount,
      timeWindow: threshold.timeWindow,
      affectedUser: userId,
      description: `${threshold.eventType} threshold exceeded: ${eventCount} events in ${threshold.timeWindow} minutes`,
      severity: this.getAlertSeverity(threshold.eventType, eventCount),
      acknowledged: false
    };

    this.alerts.set(alertId, alert);

    // Execute alert actions
    this.executeAlertActions(alert);

    console.log(`SECURITY ALERT: ${alert.description}`);
  }

  private getAlertSeverity(eventType: AuditEventType, eventCount: number): Severity {
    if (eventCount > 50) return Severity.CRITICAL;
    if (eventCount > 20) return Severity.HIGH;
    if (eventCount > 10) return Severity.MEDIUM;
    return Severity.LOW;
  }

  private executeAlertActions(alert: SecurityAlert): void {
    // In production, this would trigger actual notifications
    console.log(`Alert action triggered for: ${alert.id}`);
    
    // Mock implementations for different alert actions
    switch (alert.threshold.action) {
      case AlertAction.EMAIL_NOTIFICATION:
        console.log(`Sending email notification for alert: ${alert.id}`);
        break;
      case AlertAction.SLACK_NOTIFICATION:
        console.log(`Sending Slack notification for alert: ${alert.id}`);
        break;
      case AlertAction.WEBHOOK:
        console.log(`Triggering webhook for alert: ${alert.id}`);
        break;
      case AlertAction.BLOCK_USER:
        if (alert.affectedUser) {
          console.log(`Blocking user: ${alert.affectedUser}`);
        }
        break;
      case AlertAction.ESCALATE_TO_ADMIN:
        console.log(`Escalating alert to admin: ${alert.id}`);
        break;
    }
  }

  private exportAsJSON(logs: AuditLog[], filename: string, includeMetadata?: boolean): string {
    const exportData = logs.map(log => {
      const exportLog = { ...log };
      if (!includeMetadata) {
        (exportLog as any).metadata = undefined;
      }
      return exportLog;
    });

    // In production, this would actually create and return a file
    console.log(`Exporting ${logs.length} logs as JSON to ${filename}.json`);
    return JSON.stringify(exportData, null, 2);
  }

  private exportAsCSV(logs: AuditLog[], filename: string, includeMetadata?: boolean): string {
    if (logs.length === 0) return '';

    // CSV headers
    const headers = [
      'id', 'timestamp', 'eventType', 'userId', 'sessionId', 'ipAddress',
      'action', 'resource', 'success', 'severity'
    ];

    if (includeMetadata) {
      headers.push('metadata');
    }

    // CSV rows
    const rows = logs.map(log => {
      const row = [
        log.id,
        log.timestamp.toISOString(),
        log.eventType,
        log.userId || '',
        log.sessionId || '',
        log.ipAddress,
        log.action,
        log.resource,
        log.success.toString(),
        log.severity
      ];

      if (includeMetadata) {
        row.push(JSON.stringify(log.metadata));
      }

      return row.map(cell => `"${cell}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    console.log(`Exporting ${logs.length} logs as CSV to ${filename}.csv`);
    return csvContent;
  }

  private exportAsXML(logs: AuditLog[], filename: string, includeMetadata?: boolean): string {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<audit-logs>\n';
    
    logs.forEach(log => {
      xmlContent += '  <log>\n';
      xmlContent += `    <id>${log.id}</id>\n`;
      xmlContent += `    <timestamp>${log.timestamp.toISOString()}</timestamp>\n`;
      xmlContent += `    <eventType>${log.eventType}</eventType>\n`;
      xmlContent += `    <userId>${log.userId || ''}</userId>\n`;
      xmlContent += `    <action>${log.action}</action>\n`;
      xmlContent += `    <resource>${log.resource}</resource>\n`;
      xmlContent += `    <success>${log.success}</success>\n`;
      xmlContent += `    <severity>${log.severity}</severity>\n`;
      
      if (includeMetadata && log.metadata) {
        xmlContent += `    <metadata>${JSON.stringify(log.metadata)}</metadata>\n`;
      }
      
      xmlContent += '  </log>\n';
    });
    
    xmlContent += '</audit-logs>';
    console.log(`Exporting ${logs.length} logs as XML to ${filename}.xml`);
    return xmlContent;
  }

  private exportAsPDF(logs: AuditLog[], filename: string, includeMetadata?: boolean): string {
    // Mock PDF export - in production, use a PDF library
    console.log(`Exporting ${logs.length} logs as PDF to ${filename}.pdf`);
    return `PDF content for ${logs.length} audit logs`;
  }

  private startPeriodicCleanup(): void {
    // Clean up old logs based on retention period
    setInterval(() => {
      const cutoffDate = new Date(Date.now() - this.settings.retentionPeriod * 24 * 60 * 60 * 1000);
      
      let removedCount = 0;
      this.logs.forEach((log, id) => {
        if (log.timestamp < cutoffDate) {
          this.logs.delete(id);
          removedCount++;
        }
      });

      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} old audit logs`);
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  private initializeSettings(): void {
    this.settings = {
      enabledEvents: [
        AuditEventType.USER_LOGIN,
        AuditEventType.USER_LOGOUT,
        AuditEventType.DATA_ACCESS,
        AuditEventType.DATA_MODIFICATION,
        AuditEventType.DATA_DELETION,
        AuditEventType.SYSTEM_CONFIG_CHANGE,
        AuditEventType.SECURITY_EVENT,
        AuditEventType.COMPLIANCE_VIOLATION
      ],
      retentionPeriod: 2555, // 7 years
      encryptLogs: true,
      realTimeMonitoring: true,
      alertingEnabled: true,
      alertThresholds: [
        {
          eventType: AuditEventType.USER_LOGIN,
          count: 5,
          timeWindow: 5, // 5 minutes
          action: AlertAction.EMAIL_NOTIFICATION
        },
        {
          eventType: AuditEventType.SECURITY_EVENT,
          count: 1,
          timeWindow: 1,
          action: AlertAction.ESCALATE_TO_ADMIN
        },
        {
          eventType: AuditEventType.DATA_DELETION,
          count: 10,
          timeWindow: 60,
          action: AlertAction.SLACK_NOTIFICATION
        }
      ],
      exportFormats: [ExportFormat.JSON, ExportFormat.CSV, ExportFormat.XML, ExportFormat.PDF]
    };
  }
}

export const auditLogService = AuditLogService.getInstance();