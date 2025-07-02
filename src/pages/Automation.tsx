import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Zap, 
  Clock, 
  MessageSquare, 
  Filter, 
  Settings, 
  Play, 
  Pause,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  conditions: string[];
  actions: string[];
  lastTriggered?: Date;
}

export const Automation: React.FC = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Auto-respond to React jobs',
      enabled: true,
      trigger: 'new_job_match',
      conditions: ['keyword_contains_react', 'match_score_above_80'],
      actions: ['send_template_response', 'mark_as_responded'],
      lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2', 
      name: 'Save high-paying opportunities',
      enabled: true,
      trigger: 'new_job_match',
      conditions: ['salary_above_100k', 'location_remote'],
      actions: ['mark_as_saved', 'send_notification'],
      lastTriggered: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Weekly summary report',
      enabled: false,
      trigger: 'scheduled_weekly',
      conditions: ['always'],
      actions: ['generate_report', 'send_email'],
    }
  ]);

  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    matchScore: 80,
    keywords: '',
    responseTemplate: '',
    autoRespond: false
  });

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    toast.success('Automation rule updated');
  };

  const deleteRule = (ruleId: string) => {
    setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast.success('Automation rule deleted');
  };

  const createRule = () => {
    if (!newRule.name || !newRule.trigger) {
      toast.error('Please fill in required fields');
      return;
    }

    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      enabled: true,
      trigger: newRule.trigger,
      conditions: [
        `match_score_above_${newRule.matchScore}`,
        ...(newRule.keywords ? [`keywords_contain_${newRule.keywords}`] : [])
      ],
      actions: newRule.autoRespond ? ['send_template_response', 'mark_as_responded'] : ['mark_as_saved']
    };

    setAutomationRules(prev => [...prev, rule]);
    setNewRule({ name: '', trigger: '', matchScore: 80, keywords: '', responseTemplate: '', autoRespond: false });
    toast.success('Automation rule created');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
        <p className="text-muted-foreground">
          Set up automated responses and actions to streamline your job search.
        </p>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="templates">Response Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {/* Active Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Active Automation Rules</CardTitle>
              <CardDescription>Manage your automated job search actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {rule.enabled ? (
                          <Bot className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {rule.trigger.replace('_', ' ')} • 
                          Actions: {rule.actions.length} configured
                        </p>
                        {rule.lastTriggered && (
                          <p className="text-xs text-muted-foreground">
                            Last triggered: {rule.lastTriggered.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create New Rule */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Rule</CardTitle>
              <CardDescription>Set up a new automation rule for your job search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input
                    id="ruleName"
                    placeholder="e.g., Auto-respond to senior developer jobs"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger">Trigger</Label>
                  <Select value={newRule.trigger} onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_job_match">New Job Match</SelectItem>
                      <SelectItem value="high_match_score">High Match Score</SelectItem>
                      <SelectItem value="keyword_match">Keyword Match</SelectItem>
                      <SelectItem value="scheduled_daily">Daily Schedule</SelectItem>
                      <SelectItem value="scheduled_weekly">Weekly Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matchScore">Minimum Match Score</Label>
                  <Input
                    id="matchScore"
                    type="number"
                    min="0"
                    max="100"
                    value={newRule.matchScore}
                    onChange={(e) => setNewRule(prev => ({ ...prev, matchScore: parseInt(e.target.value) || 80 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="react, javascript, senior"
                    value={newRule.keywords}
                    onChange={(e) => setNewRule(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoRespond"
                    checked={newRule.autoRespond}
                    onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, autoRespond: checked }))}
                  />
                  <Label htmlFor="autoRespond">Enable auto-response</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, the system will automatically send a response using your default template
                </p>
              </div>

              {newRule.autoRespond && (
                <div className="space-y-2">
                  <Label htmlFor="responseTemplate">Response Template</Label>
                  <Textarea
                    id="responseTemplate"
                    placeholder="Enter your response template..."
                    value={newRule.responseTemplate}
                    onChange={(e) => setNewRule(prev => ({ ...prev, responseTemplate: e.target.value }))}
                    rows={4}
                  />
                </div>
              )}

              <Button onClick={createRule} className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                Create Automation Rule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>Manage templates for automated responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Default Template',
                    content: 'Hi there! I\'m very interested in this opportunity and believe my skills would be a great fit. I\'d love to discuss further.',
                    usage: 12
                  },
                  {
                    name: 'Senior Developer Template',
                    content: 'Hello! With my extensive experience in software development, I\'m excited about this senior role. Looking forward to connecting.',
                    usage: 8
                  },
                  {
                    name: 'Remote Work Template',
                    content: 'Hi! I\'m particularly interested in remote opportunities and this role seems perfect. Happy to discuss my experience.',
                    usage: 5
                  }
                ].map((template, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant="outline">{template.usage} uses</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.content}</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Duplicate</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>Configure global automation preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Global Automation</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable all automation features
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Safety Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Require manual approval for auto-responses
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Daily Limits</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit automated responses per day
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input type="number" defaultValue="10" className="w-20" />
                  <span className="text-sm text-muted-foreground">per day</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when automation rules trigger
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Important Notes</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automation rules are processed in order of creation</li>
                  <li>• Each job can only trigger one automation rule</li>
                  <li>• Response templates support basic variables like {'{job_title}'} and {'{company}'}</li>
                  <li>• Daily limits reset at midnight in your timezone</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};