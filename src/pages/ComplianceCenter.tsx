import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Eye, 
  Download,
  Bell,
  TrendingUp,
  Lock,
  Zap,
  Activity,
  Users,
  BarChart3,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Gavel,
  Database
} from 'lucide-react';
import { complianceService } from '@/services/complianceService';
import { contentModerationService } from '@/services/contentModerationService';
import { auditLogService } from '@/services/auditLogService';
import { 
  ComplianceMetrics, 
  ComplianceViolation, 
  ModerationMetrics,
  SecurityAlert,
  RiskLevel,
  Severity,
  RegulationType,
  ViolationStatus,
  AuditEventType,
  ContentType
} from '@/types/compliance';
import { toast } from 'sonner';

export const ComplianceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics | null>(null);
  const [moderationMetrics, setModerationMetrics] = useState<ModerationMetrics | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock content analysis for demo
  const [contentToAnalyze, setContentToAnalyze] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load compliance metrics
      const compliance = complianceService.getComplianceMetrics('demo-org');
      setComplianceMetrics(compliance);

      // Load moderation metrics
      const moderation = contentModerationService.getMetrics();
      setModerationMetrics(moderation);

      // Load security alerts
      const alerts = auditLogService.getSecurityAlerts(false); // Unacknowledged only
      setSecurityAlerts(alerts);

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeContent = async () => {
    if (!contentToAnalyze.trim()) {
      toast.error('Please enter content to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await contentModerationService.analyzeContent({
        contentId: `demo_${Date.now()}`,
        platform: 'demo',
        contentType: ContentType.TEXT,
        text: contentToAnalyze
      });

      setAnalysisResult(result);
      toast.success('Content analysis completed');
    } catch (error) {
      toast.error('Content analysis failed');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    const success = auditLogService.acknowledgeAlert(alertId, 'current-user');
    if (success) {
      setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alert acknowledged');
    } else {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getRiskLevelColor = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.CRITICAL: return 'text-red-600 bg-red-100';
      case RiskLevel.HIGH: return 'text-orange-600 bg-orange-100';
      case RiskLevel.MEDIUM: return 'text-yellow-600 bg-yellow-100';
      case RiskLevel.LOW: return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL: return 'text-red-600';
      case Severity.HIGH: return 'text-orange-600';
      case Severity.MEDIUM: return 'text-yellow-600';
      case Severity.LOW: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading compliance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="mr-3 h-8 w-8 text-blue-600" />
            Compliance & Safety Center
          </h1>
          <p className="text-muted-foreground">Monitor compliance status, content safety, and security alerts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Alerts Banner */}
      {securityAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              {securityAlerts.length} Active Security Alert{securityAlerts.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm">{alert.description}</span>
                  </div>
                  <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                    Acknowledge
                  </Button>
                </div>
              ))}
              {securityAlerts.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{securityAlerts.length - 3} more alerts...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="moderation">Content Safety</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getComplianceScoreColor(complianceMetrics?.overallComplianceScore || 0)}`}>
                  {complianceMetrics?.overallComplianceScore || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Risk Level: {complianceMetrics?.riskLevel || 'Unknown'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Analyzed</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moderationMetrics?.totalContentAnalyzed.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {moderationMetrics?.contentBlocked || 0} blocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{securityAlerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceMetrics?.pendingActions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Compliance items
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Compliance Trend (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/50">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Compliance trend visualization</p>
                  <p className="text-sm text-muted-foreground">
                    Shows compliance score over time with violation indicators
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Violations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Recent Compliance Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complianceMetrics?.recentViolations && complianceMetrics.recentViolations.length > 0 ? (
                <div className="space-y-3">
                  {complianceMetrics.recentViolations.slice(0, 5).map(violation => (
                    <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                        <div>
                          <p className="font-semibold">{violation.type.replace('-', ' ').toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">{violation.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={violation.status === ViolationStatus.RESOLVED ? 'default' : 'secondary'}>
                          {violation.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {violation.detectedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold">No Recent Violations</h3>
                  <p className="text-muted-foreground">Your compliance status is healthy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Regulation Compliance Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="mr-2 h-5 w-5" />
                Regulatory Compliance Status
              </CardTitle>
              <CardDescription>
                Current compliance status across different regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceMetrics?.regulationScores && Object.entries(complianceMetrics.regulationScores).map(([regulation, score]) => (
                  <div key={regulation} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{regulation.toUpperCase()}</span>
                      <span className={`font-bold ${getComplianceScoreColor(score)}`}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Assessment</CardTitle>
              <CardDescription>
                Run comprehensive compliance assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button className="h-20 flex-col">
                    <Shield className="h-6 w-6 mb-2" />
                    Full Assessment
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Generate Report
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last assessment: {complianceMetrics?.lastAssessment.toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          {/* Content Analysis Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Content Safety Analysis
              </CardTitle>
              <CardDescription>
                Test content moderation and safety filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content-input">Content to Analyze</Label>
                <textarea
                  id="content-input"
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  value={contentToAnalyze}
                  onChange={(e) => setContentToAnalyze(e.target.value)}
                  placeholder="Enter text content to analyze for safety violations..."
                />
              </div>
              <Button onClick={analyzeContent} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Analyze Content
              </Button>

              {analysisResult && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-3">Analysis Results</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Overall Risk Level:</span>
                      <Badge className={getRiskLevelColor(analysisResult.analysis.overallRisk)}>
                        {analysisResult.analysis.overallRisk}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Action:</span>
                      <Badge variant={analysisResult.blocked ? 'destructive' : 'default'}>
                        {analysisResult.decision.action.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Reason:</span>
                      <p className="text-sm text-muted-foreground mt-1">{analysisResult.decision.reason}</p>
                    </div>
                    {analysisResult.analysis.results.length > 0 && (
                      <div>
                        <span className="font-medium">Detected Issues:</span>
                        <div className="mt-2 space-y-1">
                          {analysisResult.analysis.results.map((result: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{result.category.replace('-', ' ')}</span>
                              <span>{Math.round(result.confidence * 100)}% confidence</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Moderation Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Moderation Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{moderationMetrics?.totalContentAnalyzed || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Analyzed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{moderationMetrics?.contentBlocked || 0}</div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{moderationMetrics?.falsePositives || 0}</div>
                  <p className="text-sm text-muted-foreground">False Positives</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{moderationMetrics?.averageResponseTime || 0}ms</div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Violation Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Top Violation Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {moderationMetrics?.topViolationCategories && moderationMetrics.topViolationCategories.length > 0 ? (
                <div className="space-y-3">
                  {moderationMetrics.topViolationCategories.slice(0, 5).map(category => (
                    <div key={category.category} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="capitalize">{category.category.replace('-', ' ')}</span>
                        <span className="font-medium">{category.count} ({category.percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No violation data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Audit Log Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Audit Log Search
              </CardTitle>
              <CardDescription>
                Search and analyze system audit logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="user-login">User Login</SelectItem>
                    <SelectItem value="data-access">Data Access</SelectItem>
                    <SelectItem value="security-event">Security Event</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="User ID" />
                <Input type="date" placeholder="Date From" />
              </div>
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Search Logs
              </Button>
            </CardContent>
          </Card>

          {/* Recent Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Audit Log System Active</h3>
                <p className="text-muted-foreground">
                  Comprehensive logging of all system activities and security events
                </p>
                <Button className="mt-4" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Compliance & Safety Configuration
              </CardTitle>
              <CardDescription>
                Configure compliance rules, moderation settings, and security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Content Moderation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Real-time Content Analysis</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>AI-Powered Classification</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Auto-block High Risk Content</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Data Privacy</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>GDPR Compliance</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Data Encryption</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Audit Logging</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Security</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Real-time Monitoring</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Automated Alerts</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Incident Response</span>
                      <Badge className="bg-green-100 text-green-800">Ready</Badge>
                    </div>
                  </div>
                </div>

                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};