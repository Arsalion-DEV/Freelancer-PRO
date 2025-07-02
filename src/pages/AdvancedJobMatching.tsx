import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Star,
  ArrowRight,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Bot,
  Eye,
  RefreshCw
} from 'lucide-react';
import { advancedJobMatcher } from '@/services/advancedJobMatcher';
import { EnhancedJob, JobMatchScore, JobStatus } from '@/types/jobMatching';
import { toast } from 'sonner';

interface MockJob {
  id: string;
  platform: string;
  title: string;
  description: string;
  company: string;
  location: string;
  postedAt: Date;
  url: string;
}

export const AdvancedJobMatching: React.FC = () => {
  const [enhancedJobs, setEnhancedJobs] = useState<EnhancedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<EnhancedJob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customJob, setCustomJob] = useState({
    title: '',
    description: '',
    company: '',
    location: ''
  });

  // Mock jobs for demonstration
  const mockJobs: MockJob[] = [
    {
      id: '1',
      platform: 'linkedin',
      title: 'Senior React Developer',
      description: `We're looking for a Senior React Developer with 5+ years of experience to join our growing team. 

Requirements:
- 5+ years of React development experience
- Strong TypeScript skills
- Experience with Node.js and Express
- Familiarity with AWS and Docker
- Remote-first company culture

We offer competitive salary ($120k-$150k), excellent benefits, and unlimited PTO. This is a permanent, full-time position with opportunities for growth.`,
      company: 'TechCorp Solutions',
      location: 'Remote',
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      url: 'https://example.com/job/1'
    },
    {
      id: '2',
      platform: 'upwork',
      title: 'Full-Stack Developer for E-commerce Platform',
      description: `Looking for an experienced full-stack developer to build a modern e-commerce platform.

Skills needed:
- React/Next.js frontend
- Node.js backend with GraphQL
- PostgreSQL database design
- Payment integration (Stripe)
- 3-6 months project timeline
- Budget: $15k-$25k

This is a contract position with potential for ongoing work. Must be available for overlap with PST timezone.`,
      company: 'RetailCo Startup',
      location: 'Remote (PST timezone)',
      postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      url: 'https://example.com/job/2'
    },
    {
      id: '3',
      platform: 'freelancer',
      title: 'Junior Frontend Developer Needed ASAP',
      description: `Need junior developer for simple React website. Must know HTML, CSS, JavaScript. Very easy project, just need someone to copy existing design. $500 budget, need done in 2 days. Must work for cheap as we are startup with no money.`,
      company: 'QuickWeb LLC',
      location: 'Any',
      postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      url: 'https://example.com/job/3'
    }
  ];

  useEffect(() => {
    // Load any existing enhanced jobs
    const existingJobs = mockJobs.map(job => advancedJobMatcher.getEnhancedJob(job.id)).filter(Boolean) as EnhancedJob[];
    setEnhancedJobs(existingJobs);
  }, []);

  const analyzeJob = async (mockJob: MockJob) => {
    setIsAnalyzing(true);
    try {
      const userProfile = advancedJobMatcher.getUserProfile('demo-user');
      if (!userProfile) {
        toast.error('User profile not found');
        return;
      }

      const result = await advancedJobMatcher.processJob({
        ...mockJob,
        userProfile
      });

      setEnhancedJobs(prev => {
        const existing = prev.find(job => job.id === mockJob.id);
        if (existing) {
          return prev.map(job => job.id === mockJob.id ? result.enhancedJob : job);
        }
        return [...prev, result.enhancedJob];
      });

      setSelectedJob(result.enhancedJob);
      
      toast.success(`Job analyzed! Match score: ${result.enhancedJob.matchScore.overall}%`);
      
      if (result.shouldAutoRespond) {
        toast.info('Auto-response generated and ready to send!');
      }
    } catch (error) {
      toast.error('Failed to analyze job');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeCustomJob = async () => {
    if (!customJob.title || !customJob.description) {
      toast.error('Please fill in title and description');
      return;
    }

    const mockJobData: MockJob = {
      id: `custom-${Date.now()}`,
      platform: 'custom',
      title: customJob.title,
      description: customJob.description,
      company: customJob.company || 'Unknown Company',
      location: customJob.location || 'Not specified',
      postedAt: new Date(),
      url: '#'
    };

    await analyzeJob(mockJobData);
    
    // Clear form
    setCustomJob({
      title: '',
      description: '',
      company: '',
      location: ''
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="mr-3 h-8 w-8 text-blue-600" />
            Advanced Job Matching
          </h1>
          <p className="text-muted-foreground">AI-powered job analysis and intelligent matching system</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">Powered by Gemini AI</span>
        </div>
      </div>

      <Tabs defaultValue="analyze" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">Job Analysis</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          {/* Sample Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Sample Job Postings
              </CardTitle>
              <CardDescription>
                Try our AI analysis on these sample job postings to see the advanced matching in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockJobs.map(job => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge variant="outline">{job.platform}</Badge>
                        <Badge variant="secondary">{job.company}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description.substring(0, 150)}...
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {Math.floor((Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60))}h ago
                        </span>
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {enhancedJobs.find(ej => ej.id === job.id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedJob(enhancedJobs.find(ej => ej.id === job.id)!)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View Analysis
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => analyzeJob(job)}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="mr-1 h-4 w-4" />
                        )}
                        {enhancedJobs.find(ej => ej.id === job.id) ? 'Re-analyze' : 'Analyze with AI'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Custom Job Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Analyze Custom Job
              </CardTitle>
              <CardDescription>
                Paste any job posting to see our AI analysis in action
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-title">Job Title</Label>
                  <Input
                    id="custom-title"
                    value={customJob.title}
                    onChange={(e) => setCustomJob(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Senior React Developer"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-company">Company Name</Label>
                  <Input
                    id="custom-company"
                    value={customJob.company}
                    onChange={(e) => setCustomJob(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g., TechCorp Inc."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="custom-location">Location</Label>
                <Input
                  id="custom-location"
                  value={customJob.location}
                  onChange={(e) => setCustomJob(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Remote, New York, San Francisco"
                />
              </div>
              <div>
                <Label htmlFor="custom-description">Job Description</Label>
                <Textarea
                  id="custom-description"
                  value={customJob.description}
                  onChange={(e) => setCustomJob(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Paste the full job description here..."
                  rows={6}
                />
              </div>
              <Button 
                onClick={analyzeCustomJob}
                disabled={isAnalyzing || !customJob.title || !customJob.description}
                className="w-full"
              >
                {isAnalyzing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="mr-2 h-4 w-4" />
                )}
                Analyze with AI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {selectedJob ? (
            <div className="space-y-6">
              {/* Match Score Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Target className="mr-2 h-5 w-5" />
                      Job Match Analysis
                    </span>
                    <div className={`flex items-center px-3 py-1 rounded-full ${getMatchScoreBg(selectedJob.matchScore.overall)}`}>
                      <Star className={`mr-1 h-4 w-4 ${getMatchScoreColor(selectedJob.matchScore.overall)}`} />
                      <span className={`font-bold ${getMatchScoreColor(selectedJob.matchScore.overall)}`}>
                        {selectedJob.matchScore.overall}% Match
                      </span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {selectedJob.title} at {selectedJob.company}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Skills Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.skillsMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.skillsMatch * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Experience Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.experienceMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.experienceMatch * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Salary Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.salaryMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.salaryMatch * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Location Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.locationMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.locationMatch * 100} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Work Style Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.workStyleMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.workStyleMatch * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Company Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.companyMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.companyMatch * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Industry Match</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.industryMatch * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.industryMatch * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Cultural Fit</span>
                          <span>{Math.round(selectedJob.matchScore.breakdown.culturalFit * 100)}%</span>
                        </div>
                        <Progress value={selectedJob.matchScore.breakdown.culturalFit * 100} />
                      </div>
                    </div>
                  </div>

                  {/* AI Explanations */}
                  <div>
                    <h4 className="font-semibold mb-2">AI Analysis Summary</h4>
                    <ul className="space-y-1">
                      {selectedJob.matchScore.explanation.map((explanation, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{explanation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5" />
                    Skills & Requirements Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Extracted Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.analysis.extractedSkills.map(skill => (
                          <Badge 
                            key={skill.name} 
                            variant={skill.importance === 'required' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {skill.name}
                            {skill.importance === 'required' && ' *'}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">* Required skills</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Experience Requirements</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Minimum Years:</strong> {selectedJob.analysis.experienceRequirement.minimumYears}</p>
                          <p><strong>Seniority Level:</strong> {selectedJob.analysis.experienceRequirement.seniorityLevel}</p>
                          <p><strong>Confidence:</strong> {Math.round(selectedJob.analysis.experienceRequirement.confidence * 100)}%</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Salary Analysis</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Salary Mentioned:</strong> {selectedJob.analysis.salaryAnalysis.hasSalary ? 'Yes' : 'No'}</p>
                          {selectedJob.analysis.salaryAnalysis.range && (
                            <p><strong>Range:</strong> ${selectedJob.analysis.salaryAnalysis.range.min.toLocaleString()} - ${selectedJob.analysis.salaryAnalysis.range.max.toLocaleString()}</p>
                          )}
                          <p><strong>Market Position:</strong> {selectedJob.analysis.salaryAnalysis.marketComparison}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedJob.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge variant={rec.priority === 'high' ? 'default' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                            <p className="text-xs text-muted-foreground italic">{rec.reasoning}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Auto Response */}
              {selectedJob.autoResponse && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bot className="mr-2 h-5 w-5" />
                      AI-Generated Response
                      <Badge className="ml-2" variant={selectedJob.autoResponse.shouldRespond ? 'default' : 'secondary'}>
                        {selectedJob.autoResponse.shouldRespond ? 'Ready to Send' : 'Not Recommended'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Confidence: {Math.round(selectedJob.autoResponse.confidence * 100)}% | 
                      Reasoning: {selectedJob.autoResponse.reasoning}
                    </CardDescription>
                  </CardHeader>
                  {selectedJob.autoResponse.shouldRespond && (
                    <CardContent>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {selectedJob.autoResponse.personalizedContent}
                        </pre>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">
                          Scheduled for: {selectedJob.autoResponse.scheduledFor?.toLocaleString()}
                        </span>
                        <Button>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Response
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Red Flags */}
              {selectedJob.analysis.redFlags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Red Flags Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedJob.analysis.redFlags.map((flag, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-red-800">{flag.description}</p>
                            <p className="text-sm text-red-600">{flag.details}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {flag.severity} severity
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Job Selected</h3>
                  <p className="text-muted-foreground">Analyze a job to see detailed AI insights</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                AI Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Performance insights and intelligent recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{enhancedJobs.length}</div>
                  <p className="text-sm text-muted-foreground">Jobs Analyzed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {enhancedJobs.length > 0 
                      ? Math.round(enhancedJobs.reduce((sum, job) => sum + job.matchScore.overall, 0) / enhancedJobs.length)
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Match Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {enhancedJobs.filter(job => job.autoResponse?.shouldRespond).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Auto-Responses</p>
                </div>
              </div>

              {enhancedJobs.length === 0 && (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Analytics Data Yet</h3>
                  <p className="text-muted-foreground">Analyze some jobs to see AI-powered insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};