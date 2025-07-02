import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { usePlatforms } from '@/contexts/PlatformContext';
import { useAuth } from '@/contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { platforms, jobs } = usePlatforms();
  const { user } = useAuth();

  const connectedPlatforms = platforms.filter(p => p.status === "connected");
  const newJobs = jobs.filter(job => job.status === 'new');
  const respondedJobs = jobs.filter(job => job.status === 'responded');
  const todayJobs = jobs.filter(job => {
    const today = new Date();
    const jobDate = new Date(job.postedAt);
    return jobDate.toDateString() === today.toDateString();
  });

  const stats = [
    {
      title: 'Connected Platforms',
      value: connectedPlatforms.length,
      total: platforms.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'New Jobs Today',
      value: todayJobs.length,
      description: `${newJobs.length} pending response`,
      icon: Search,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Auto Responses Sent',
      value: respondedJobs.length,
      description: 'This week',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Success Rate',
      value: '87%',
      description: 'Response to interview ratio',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your job monitoring today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof stat.value === 'number' && stat.total ? (
                  <div className="flex items-center space-x-2">
                    <span>{stat.value}</span>
                    <span className="text-sm text-muted-foreground">/ {stat.total}</span>
                  </div>
                ) : (
                  stat.value
                )}
              </div>
              {stat.description && (
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              )}
              {typeof stat.value === 'number' && stat.total && (
                <Progress 
                  value={(stat.value / stat.total) * 100} 
                  className="mt-2 h-2" 
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Opportunities</CardTitle>
            <CardDescription>Latest jobs found across your connected platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium">{job.title}</h4>
                      <Badge 
                        variant={job.status === 'new' ? 'default' : job.status === 'responded' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                      </span>
                      <span>Match: {job.matchScore}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.status === 'new' && (
                      <Button size="sm" variant="outline">
                        Respond
                      </Button>
                    )}
                    {job.status === 'responded' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
            <CardDescription>Monitor the health of your connected platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${platform.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <h4 className="text-sm font-medium capitalize">{platform.name}</h4>
                      {platform.connected ? (
                        <p className="text-xs text-muted-foreground">
                          Last sync: {platform.lastSync ? new Date(platform.lastSync).toLocaleTimeString() : 'Never'}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {platform.connected ? (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    {platform.groups && (
                      <span className="text-xs text-muted-foreground">
                        {platform.groups.filter(g => g.isMonitored).length} groups
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Connect Platform</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Activity className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <AlertCircle className="h-6 w-6" />
              <span>Setup Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};