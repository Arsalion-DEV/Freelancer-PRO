import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock,
  MessageSquare,
  Eye,
  Star
} from 'lucide-react';
import { usePlatforms } from '@/contexts/PlatformContext';

export const Analytics: React.FC = () => {
  const { jobs, platforms } = usePlatforms();

  // Mock analytics data
  const analytics = {
    totalJobs: jobs.length,
    responseRate: 67,
    avgMatchScore: 84,
    interviewRate: 23,
    weeklyTrend: 12,
    platformPerformance: [
      { platform: 'LinkedIn', jobs: 45, responses: 32, interviews: 8 },
      { platform: 'Facebook', jobs: 23, responses: 18, interviews: 4 },
      { platform: 'Twitter', jobs: 12, responses: 8, interviews: 2 },
    ],
    keywordPerformance: [
      { keyword: 'React', matches: 34, responses: 28, score: 82 },
      { keyword: 'JavaScript', matches: 29, responses: 21, score: 72 },
      { keyword: 'Node.js', matches: 18, responses: 14, score: 78 },
      { keyword: 'Frontend', matches: 15, responses: 10, score: 67 },
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your job search performance and optimize your strategy.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Found</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalJobs}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analytics.weeklyTrend}% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate}%</div>
            <Progress value={analytics.responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgMatchScore}%</div>
            <Progress value={analytics.avgMatchScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.interviewRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +5% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platforms">Platform Performance</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Analysis</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>Compare job opportunities and success rates across platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.platformPerformance.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{platform.platform}</h3>
                        <p className="text-sm text-muted-foreground">
                          {platform.jobs} jobs found
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Response Rate:</span>
                        <Badge variant="secondary">
                          {Math.round((platform.responses / platform.jobs) * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Interviews:</span>
                        <Badge variant="outline">{platform.interviews}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Performance</CardTitle>
              <CardDescription>Analyze which keywords are bringing the best job matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.keywordPerformance.map((keyword) => (
                  <div key={keyword.keyword} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-sm">{(keyword.keyword keyword.keyword.slice(0, 2).toUpperCase()keyword.keyword.slice(0, 2).toUpperCase() keyword.keyword.length >= 2 ? keyword.keyword.slice(0, 2).toUpperCase() : "KW")}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{keyword.keyword}</h3>
                        <p className="text-sm text-muted-foreground">
                          {keyword.matches} matches found
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Success Score:</span>
                        <Badge variant={keyword.score >= 80 ? 'default' : keyword.score >= 70 ? 'secondary' : 'outline'}>
                          {keyword.score}%
                        </Badge>
                      </div>
                      <Progress value={keyword.score} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Job search activity over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: '2024-01-15', jobs: 8, responses: 6, type: 'high' },
                  { date: '2024-01-14', jobs: 5, responses: 3, type: 'medium' },
                  { date: '2024-01-13', jobs: 12, responses: 9, type: 'high' },
                  { date: '2024-01-12', jobs: 3, responses: 2, type: 'low' },
                  { date: '2024-01-11', jobs: 7, responses: 5, type: 'medium' },
                ].map((day) => (
                  <div key={day.date} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      day.type === 'high' ? 'bg-green-500' : 
                      day.type === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{day.jobs} jobs</span>
                          <span>{day.responses} responses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};