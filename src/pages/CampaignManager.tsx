import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Play, 
  Pause, 
  Calendar as CalendarIcon,
  Target,
  BarChart3,
  Settings,
  Copy,
  ExternalLink,
  Clock,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { usePlatforms } from '@/contexts/PlatformContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  platforms: string[];
  targetKeywords: string[];
  budget?: number;
  startDate: Date;
  endDate?: Date;
  responseTemplate: string;
  createdAt: Date;
  stats: {
    reach: number;
    responses: number;
    clicks: number;
    conversions: number;
  };
}

interface CampaignFormData {
  name: string;
  description: string;
  platforms: string[];
  targetKeywords: string[];
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  responseTemplate: string;
}

const CreateCampaignDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreateCampaign: (data: CampaignFormData) => void;
}> = ({ isOpen, onClose, onCreateCampaign }) => {
  const { platforms } = usePlatforms();
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    platforms: [],
    targetKeywords: [],
    responseTemplate: '',
  });
  const [keywordInput, setKeywordInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.platforms.length || !formData.targetKeywords.length) {
      toast.error('Please fill in all required fields');
      return;
    }
    onCreateCampaign(formData);
    onClose();
    setFormData({
      name: '',
      description: '',
      platforms: [],
      targetKeywords: [],
      responseTemplate: '',
    });
    setKeywordInput('');
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.targetKeywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        targetKeywords: [...prev.targetKeywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      targetKeywords: prev.targetKeywords.filter(k => k !== keyword)
    }));
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a multi-platform monitoring and response campaign
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., React Developer Outreach"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your campaign objectives..."
                rows={3}
              />
            </div>

            <div>
              <Label>Target Platforms *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {platforms.map(platform => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Switch
                      id={platform.id}
                      checked={formData.platforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                      disabled={!platform.connected}
                    />
                    <Label htmlFor={platform.id} className={cn(
                      "text-sm",
                      !platform.connected && "text-muted-foreground"
                    )}>
                      {platform.name}
                      {!platform.connected && " (Not Connected)"}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Target Keywords *</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add keyword..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.targetKeywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Monthly budget in USD"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="template">Response Template</Label>
              <Textarea
                id="template"
                value={formData.responseTemplate}
                onChange={(e) => setFormData(prev => ({ ...prev, responseTemplate: e.target.value }))}
                placeholder="Hi! I'm interested in this opportunity. I have {experience} years of experience with {keywords}. Would love to discuss further!"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use placeholders like {'{experience}'}, {'{keywords}'}, {'{name}'} for dynamic content
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'React Developer Outreach',
      description: 'Target React development opportunities across multiple platforms',
      status: 'active',
      platforms: ['linkedin', 'twitter', 'reddit'],
      targetKeywords: ['React', 'Frontend', 'JavaScript', 'TypeScript'],
      budget: 500,
      startDate: new Date(2024, 5, 1),
      endDate: new Date(2024, 5, 30),
      responseTemplate: 'Hi! I\'m a React developer with 5+ years of experience. I\'d love to discuss this opportunity!',
      createdAt: new Date(2024, 4, 25),
      stats: {
        reach: 15420,
        responses: 42,
        clicks: 156,
        conversions: 8
      }
    },
    {
      id: '2',
      name: 'Full-Stack Opportunities',
      description: 'Monitor full-stack development positions',
      status: 'paused',
      platforms: ['linkedin', 'facebook'],
      targetKeywords: ['Full-stack', 'Node.js', 'MERN', 'MEAN'],
      startDate: new Date(2024, 4, 15),
      responseTemplate: 'Hello! I\'m a full-stack developer interested in this role.',
      createdAt: new Date(2024, 4, 10),
      stats: {
        reach: 8930,
        responses: 18,
        clicks: 67,
        conversions: 3
      }
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleCreateCampaign = (data: CampaignFormData) => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      ...data,
      status: 'draft',
      startDate: data.startDate || new Date(),
      createdAt: new Date(),
      stats: {
        reach: 0,
        responses: 0,
        clicks: 0,
        conversions: 0
      }
    };
    setCampaigns(prev => [...prev, newCampaign]);
    toast.success('Campaign created successfully!');
  };

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { 
            ...campaign, 
            status: campaign.status === 'active' ? 'paused' : 'active' 
          }
        : campaign
    ));
    const campaign = campaigns.find(c => c.id === campaignId);
    toast.success(`Campaign ${campaign?.status === 'active' ? 'paused' : 'activated'}`);
  };

  const deleteCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    toast.success('Campaign deleted');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalReach = campaigns.reduce((sum, c) => sum + c.stats.reach, 0);
  const totalResponses = campaigns.reduce((sum, c) => sum + c.stats.responses, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.stats.conversions, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaign Manager</h1>
          <p className="text-muted-foreground">Create and manage multi-platform outreach campaigns</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responses Sent</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              {totalResponses > 0 ? ((totalConversions / totalResponses) * 100).toFixed(1) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>
            Manage your active and draft campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No campaigns yet</h3>
              <p className="text-muted-foreground">Create your first campaign to start monitoring opportunities</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.targetKeywords.slice(0, 3).map(keyword => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {campaign.targetKeywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{campaign.targetKeywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCampaignStatus(campaign.id)}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteCampaign(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign.stats.reach.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Reach</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign.stats.responses}</p>
                      <p className="text-xs text-muted-foreground">Responses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign.stats.clicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign.stats.conversions}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                  </div>

                  {/* Platform Info */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Platforms:</span>
                      <div className="flex space-x-1">
                        {campaign.platforms.map(platform => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(campaign.startDate, 'MMM d, yyyy')}
                      </span>
                      {campaign.budget && (
                        <span>${campaign.budget}/mo</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCampaignDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateCampaign={handleCreateCampaign}
      />
    </div>
  );
};