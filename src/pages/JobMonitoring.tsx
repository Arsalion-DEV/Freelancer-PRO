import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Heart, 
  Clock, 
  MapPin, 
  DollarSign,
  ExternalLink,
  RefreshCw,
  Star,
  Send
} from 'lucide-react';
import { usePlatforms } from '@/contexts/PlatformContext';
import { toast } from 'sonner';

interface JobDetailsDialogProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: any) => void;
}

const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({ job, isOpen, onClose, onUpdateStatus }) => {
  const [response, setResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const handleRespond = async () => {
    setIsResponding(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      onUpdateStatus(job.id, 'responded');
      toast.success('Response sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const generateResponse = () => {
    const template = `Hi ${job.company},

I'm very interested in the ${job.title} position. With my experience in ${job.keywords.join(', ')}, I believe I would be a great fit for this role.

I'd love to discuss how I can contribute to your team. Please let me know if you'd like to schedule a call to discuss further.

Best regards,
[Your Name]`;
    
    setResponse(template);
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
          <DialogDescription>{job.company}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Platform</h4>
              <Badge variant="outline" className="capitalize">{job.platform}</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Match Score</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${job.matchScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{job.matchScore}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{job.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {job.location && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </h4>
                <p className="text-sm">{job.location}</p>
              </div>
            )}
            {job.salary && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Salary</span>
                </h4>
                <p className="text-sm">{job.salary}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {job.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary">{keyword}</Badge>
              ))}
            </div>
          </div>

          {job.status === 'new' && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Quick Response</h4>
                <Button variant="outline" size="sm" onClick={generateResponse}>
                  Generate Template
                </Button>
              </div>
              <Textarea
                placeholder="Write your response here..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleRespond} 
                  disabled={!response.trim() || isResponding}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isResponding ? 'Sending...' : 'Send Response'}
                </Button>
                <Button variant="outline" onClick={() => onUpdateStatus(job.id, 'saved')}>
                  <Star className="h-4 w-4 mr-2" />
                  Save for Later
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" asChild>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Posted {new Date(job.postedAt).toLocaleDateString()} at {new Date(job.postedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const JobMonitoring: React.FC = () => {
  const { jobs, updateJobStatus, refreshJobs, isLoading } = usePlatforms();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || job.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const jobStats = {
    new: jobs.filter(j => j.status === 'new').length,
    responded: jobs.filter(j => j.status === 'responded').length,
    saved: jobs.filter(j => j.status === 'saved').length,
    ignored: jobs.filter(j => j.status === 'ignored').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'saved': return 'bg-yellow-100 text-yellow-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-100 text-blue-800';
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'twitter': return 'bg-sky-100 text-sky-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Monitoring</h1>
          <p className="text-muted-foreground">
            Track and respond to job opportunities from all your connected platforms.
          </p>
        </div>
        <Button onClick={refreshJobs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Jobs
        </Button>
      </div>

      {/* Job Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{jobStats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Responded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{jobStats.responded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{jobStats.saved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ignored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{jobStats.ignored}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Job Opportunities ({filteredJobs.length})</CardTitle>
          <CardDescription>Latest job opportunities from your monitored platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{job.title}</h3>
                        <p className="text-muted-foreground">{job.company}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPlatformColor(job.platform)}>
                          {job.platform}
                        </Badge>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{job.location}</span>
                        </span>
                      )}
                      {job.salary && (
                        <span className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{job.salary}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                      </span>
                      <span>Match: {job.matchScore}%</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {job.keywords.slice(0, 3).map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {job.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.keywords.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedJob(job)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {job.status === 'new' && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedJob(job);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No jobs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new opportunities.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onUpdateStatus={updateJobStatus}
      />
    </div>
  );
};