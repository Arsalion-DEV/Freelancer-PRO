// Advanced Job Matching Engine with AI Integration

import { 
  EnhancedJob,
  JobMatchingProfile,
  JobAnalysis,
  JobMatchScore,
  JobClassification,
  JobRecommendation,
  AutoResponse,
  ResponseTemplate,
  JobStatus,
  JobInteraction,
  InteractionType,
  MatchingAnalytics,
  ImprovementSuggestion
} from '../types/jobMatching';
import { geminiService, GeminiJobAnalysisRequest } from './geminiService';

export interface ProcessJobRequest {
  id: string;
  platform: string;
  title: string;
  description: string;
  company: string;
  location: string;
  postedAt: Date;
  url: string;
  userProfile: JobMatchingProfile;
}

export interface JobProcessingResult {
  enhancedJob: EnhancedJob;
  shouldAutoRespond: boolean;
  autoResponse?: AutoResponse;
  recommendations: JobRecommendation[];
}

export class AdvancedJobMatcher {
  private static instance: AdvancedJobMatcher;
  
  // In-memory storage for demo purposes
  private enhancedJobs: Map<string, EnhancedJob> = new Map();
  private userProfiles: Map<string, JobMatchingProfile> = new Map();
  private responseTemplates: Map<string, ResponseTemplate> = new Map();
  
  public static getInstance(): AdvancedJobMatcher {
    if (!AdvancedJobMatcher.instance) {
      AdvancedJobMatcher.instance = new AdvancedJobMatcher();
    }
    return AdvancedJobMatcher.instance;
  }

  private constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultProfile();
  }

  /**
   * Process a job posting with AI analysis and matching
   */
  public async processJob(request: ProcessJobRequest): Promise<JobProcessingResult> {
    try {
      console.log(`Processing job: ${request.title} from ${request.platform}`);
      
      // Step 1: Analyze job with Gemini AI
      const analysisRequest: GeminiJobAnalysisRequest = {
        jobTitle: request.title,
        jobDescription: request.description,
        companyName: request.company,
        location: request.location,
        platform: request.platform,
        userProfile: request.userProfile
      };
      
      const analysis = await geminiService.analyzeJob(analysisRequest);
      console.log(`Job analysis completed with quality score: ${analysis.qualityScore}`);
      
      // Step 2: Calculate match score
      const matchScore = await geminiService.calculateMatchScore(analysis, request.userProfile);
      console.log(`Match score calculated: ${matchScore.overall}%`);
      
      // Step 3: Classify job
      const classification = await geminiService.classifyJob(analysis);
      console.log(`Job classified as: ${classification.primary}`);
      
      // Step 4: Generate recommendations
      const recommendations = await geminiService.generateRecommendations(
        analysis, 
        matchScore, 
        request.userProfile
      );
      console.log(`Generated ${recommendations.length} recommendations`);
      
      // Step 5: Generate auto-response if applicable
      let autoResponse: AutoResponse | undefined;
      const shouldAutoRespond = this.shouldGenerateAutoResponse(analysis, matchScore, request.userProfile);
      
      if (shouldAutoRespond) {
        const template = this.selectBestTemplate(analysis, classification, request.userProfile);
        if (template) {
          autoResponse = await geminiService.generateResponse({
            jobAnalysis: analysis,
            userProfile: request.userProfile,
            template: template
          });
          console.log(`Auto-response generated with confidence: ${autoResponse.confidence}`);
        }
      }
      
      // Step 6: Create enhanced job object
      const enhancedJob: EnhancedJob = {
        id: request.id,
        platform: request.platform,
        title: request.title,
        description: request.description,
        company: request.company,
        location: request.location,
        postedAt: request.postedAt,
        url: request.url,
        analysis,
        matchScore,
        classification,
        recommendations,
        autoResponse,
        status: JobStatus.ANALYZED,
        interactions: [{
          id: Date.now().toString(),
          type: InteractionType.ANALYZED,
          timestamp: new Date(),
          details: `AI analysis completed with ${matchScore.overall}% match score`
        }],
        lastProcessed: new Date()
      };
      
      // Store enhanced job
      this.enhancedJobs.set(request.id, enhancedJob);
      
      return {
        enhancedJob,
        shouldAutoRespond: shouldAutoRespond && autoResponse?.shouldRespond === true,
        autoResponse,
        recommendations
      };
      
    } catch (error) {
      console.error('Error processing job:', error);
      throw new Error(`Failed to process job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get enhanced job by ID
   */
  public getEnhancedJob(jobId: string): EnhancedJob | undefined {
    return this.enhancedJobs.get(jobId);
  }

  /**
   * Get all enhanced jobs for a user
   */
  public getEnhancedJobs(userId: string, filters?: {
    status?: JobStatus;
    platform?: string;
    minMatchScore?: number;
    maxMatchScore?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }): EnhancedJob[] {
    let jobs = Array.from(this.enhancedJobs.values());
    
    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      if (filters.platform) {
        jobs = jobs.filter(job => job.platform === filters.platform);
      }
      if (filters.minMatchScore !== undefined) {
        jobs = jobs.filter(job => job.matchScore.overall >= filters.minMatchScore!);
      }
      if (filters.maxMatchScore !== undefined) {
        jobs = jobs.filter(job => job.matchScore.overall <= filters.maxMatchScore!);
      }
      if (filters.dateFrom) {
        jobs = jobs.filter(job => job.postedAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        jobs = jobs.filter(job => job.postedAt <= filters.dateTo!);
      }
    }
    
    return jobs.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
  }

  /**
   * Update job status and add interaction
   */
  public updateJobStatus(jobId: string, status: JobStatus, details?: string): boolean {
    const job = this.enhancedJobs.get(jobId);
    if (!job) return false;
    
    job.status = status;
    job.interactions.push({
      id: Date.now().toString(),
      type: InteractionType.STATUS_CHANGED,
      timestamp: new Date(),
      details: details || `Status changed to ${status}`
    });
    
    return true;
  }

  /**
   * Add interaction to job
   */
  public addJobInteraction(jobId: string, type: InteractionType, details: string): boolean {
    const job = this.enhancedJobs.get(jobId);
    if (!job) return false;
    
    job.interactions.push({
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      details
    });
    
    return true;
  }

  /**
   * Get user profile
   */
  public getUserProfile(userId: string): JobMatchingProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Update user profile
   */
  public updateUserProfile(profile: JobMatchingProfile): void {
    this.userProfiles.set(profile.userId, {
      ...profile,
      lastUpdated: new Date()
    });
  }

  /**
   * Get response templates for user
   */
  public getResponseTemplates(userId: string): ResponseTemplate[] {
    return Array.from(this.responseTemplates.values())
      .filter(template => template.isActive);
  }

  /**
   * Add or update response template
   */
  public saveResponseTemplate(template: ResponseTemplate): void {
    this.responseTemplates.set(template.id, template);
  }

  /**
   * Delete response template
   */
  public deleteResponseTemplate(templateId: string): boolean {
    return this.responseTemplates.delete(templateId);
  }

  /**
   * Generate analytics for user's job matching performance
   */
  public generateAnalytics(userId: string, dateFrom?: Date, dateTo?: Date): MatchingAnalytics {
    const userJobs = this.getEnhancedJobs(userId, {
      dateFrom,
      dateTo
    });
    
    const totalJobs = userJobs.length;
    const averageMatchScore = totalJobs > 0 
      ? userJobs.reduce((sum, job) => sum + job.matchScore.overall, 0) / totalJobs 
      : 0;
    
    const respondedJobs = userJobs.filter(job => 
      job.status === JobStatus.RESPONDED || job.status === JobStatus.APPLIED
    );
    const responseRate = totalJobs > 0 ? respondedJobs.length / totalJobs : 0;
    
    const successfulJobs = userJobs.filter(job => 
      job.status === JobStatus.ACCEPTED || job.status === JobStatus.INTERVIEWING
    );
    const successRate = respondedJobs.length > 0 ? successfulJobs.length / respondedJobs.length : 0;
    
    // Analyze skill demand
    const skillDemand = this.analyzeSkillDemand(userJobs);
    
    // Platform performance
    const platformMetrics = this.analyzePlatformPerformance(userJobs);
    
    return {
      totalJobsAnalyzed: totalJobs,
      averageMatchScore: Math.round(averageMatchScore),
      responseRate: Math.round(responseRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      topSkillsInDemand: skillDemand,
      salaryTrends: [], // Would be implemented with historical data
      platformPerformance: platformMetrics,
      improvementSuggestions: this.generateImprovementSuggestions(userJobs)
    };
  }

  // Private helper methods

  private shouldGenerateAutoResponse(
    analysis: JobAnalysis, 
    matchScore: JobMatchScore, 
    userProfile: JobMatchingProfile
  ): boolean {
    return matchScore.overall >= userProfile.preferences.autoResponseThreshold &&
           analysis.redFlags.length === 0 &&
           analysis.qualityScore > 0.7 &&
           userProfile.preferences.minimumMatchScore <= matchScore.overall;
  }

  private selectBestTemplate(
    analysis: JobAnalysis,
    classification: JobClassification,
    userProfile: JobMatchingProfile
  ): ResponseTemplate | undefined {
    const templates = this.getResponseTemplates(userProfile.userId);
    
    if (templates.length === 0) return undefined;
    
    // Score templates based on job classification and conditions
    const scoredTemplates = templates.map(template => {
      let score = 0;
      
      // Check category match
      if (template.category.toString() === classification.primary.toString()) {
        score += 50;
      }
      
      // Check conditions
      template.conditions.forEach(condition => {
        // Simple condition matching logic
        if (condition.field === 'matchScore' && condition.operator === 'greater_than') {
          if (analysis.qualityScore > condition.value) score += 20;
        }
      });
      
      // Prefer templates with higher success rates
      if (template.successRate) {
        score += template.successRate * 30;
      }
      
      return { template, score };
    });
    
    // Return template with highest score
    const bestTemplate = scoredTemplates.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestTemplate.score > 0 ? bestTemplate.template : templates[0];
  }

  private analyzeSkillDemand(jobs: EnhancedJob[]) {
    const skillCounts: Record<string, number> = {};
    const skillSalaries: Record<string, number[]> = {};
    
    jobs.forEach(job => {
      job.analysis.extractedSkills.forEach(skill => {
        skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1;
        
        if (job.analysis.salaryAnalysis.range) {
          const avgSalary = (job.analysis.salaryAnalysis.range.min + job.analysis.salaryAnalysis.range.max) / 2;
          if (!skillSalaries[skill.name]) skillSalaries[skill.name] = [];
          skillSalaries[skill.name].push(avgSalary);
        }
      });
    });
    
    return Object.entries(skillCounts)
      .map(([skill, count]) => ({
        skill,
        category: jobs.find(job => 
          job.analysis.extractedSkills.some(s => s.name === skill)
        )?.analysis.extractedSkills.find(s => s.name === skill)?.category || 'other' as any,
        demandCount: count,
        averageSalary: skillSalaries[skill] 
          ? skillSalaries[skill].reduce((sum, salary) => sum + salary, 0) / skillSalaries[skill].length 
          : 0,
        growthRate: 0 // Would be calculated with historical data
      }))
      .sort((a, b) => b.demandCount - a.demandCount)
      .slice(0, 10);
  }

  private analyzePlatformPerformance(jobs: EnhancedJob[]) {
    const platformData: Record<string, {
      jobs: EnhancedJob[];
      totalScore: number;
      responses: number;
    }> = {};
    
    jobs.forEach(job => {
      if (!platformData[job.platform]) {
        platformData[job.platform] = { jobs: [], totalScore: 0, responses: 0 };
      }
      
      platformData[job.platform].jobs.push(job);
      platformData[job.platform].totalScore += job.matchScore.overall;
      
      if (job.status === JobStatus.RESPONDED || job.status === JobStatus.APPLIED) {
        platformData[job.platform].responses++;
      }
    });
    
    return Object.entries(platformData).map(([platform, data]) => ({
      platform,
      jobCount: data.jobs.length,
      averageMatchScore: Math.round(data.totalScore / data.jobs.length),
      responseRate: Math.round((data.responses / data.jobs.length) * 100) / 100,
      qualityScore: data.jobs.reduce((sum, job) => sum + job.analysis.qualityScore, 0) / data.jobs.length
    }));
  }

  private generateImprovementSuggestions(jobs: EnhancedJob[]) {
    const suggestions: ImprovementSuggestion[] = [];
    
    const lowMatchJobs = jobs.filter(job => job.matchScore.overall < 60);
    if (lowMatchJobs.length > jobs.length * 0.3) {
      suggestions.push({
        type: 'profile' as const,
        priority: 'high' as const,
        title: 'Improve Profile Match',
        description: 'Many jobs have low match scores. Consider updating your skills or preferences.',
        potentialImpact: 'Could improve match scores by 15-25%'
      });
    }
    
    const skillGaps = this.identifySkillGaps(jobs);
    if (skillGaps.length > 0) {
      suggestions.push({
        type: 'skill' as const,
        priority: 'medium' as const,
        title: 'Learn In-Demand Skills',
        description: `Consider learning: ${skillGaps.slice(0, 3).join(', ')}`,
        potentialImpact: 'Could increase job opportunities by 20-30%',
        resources: ['Online courses', 'Practice projects', 'Certifications']
      });
    }
    
    return suggestions;
  }

  private identifySkillGaps(jobs: EnhancedJob[]): string[] {
    const requiredSkills = new Set<string>();
    const userSkills = new Set<string>();
    
    jobs.forEach(job => {
      job.analysis.extractedSkills
        .filter(skill => skill.importance === 'required')
        .forEach(skill => requiredSkills.add(skill.name));
    });
    
    // In a real implementation, this would compare with user profile skills
    return Array.from(requiredSkills).slice(0, 5);
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: ResponseTemplate[] = [
      {
        id: 'general-1',
        name: 'General Professional Response',
        body: `Hello,

I'm very interested in this opportunity. With {experience} years of experience in {keywords}, I believe I would be a valuable addition to your team.

I'd love to discuss how my expertise can contribute to your project's success.

Best regards,
[Your Name]`,
        variables: [
          { name: 'experience', type: 'number', defaultValue: 5, description: 'Years of experience' },
          { name: 'keywords', type: 'text', defaultValue: 'relevant technologies', description: 'Key skills for the job' }
        ],
        conditions: [],
        category: 'general' as any,
        isActive: true,
        successRate: 0.65
      },
      {
        id: 'technical-1',
        name: 'Technical Role Response',
        body: `Hi there,

This role caught my attention because it aligns perfectly with my {experience} years of experience in {keywords}. 

I've successfully delivered similar projects and would welcome the opportunity to discuss how my technical background can help achieve your goals.

Looking forward to hearing from you.

Best,
[Your Name]`,
        variables: [
          { name: 'experience', type: 'number', defaultValue: 3, description: 'Years of experience' },
          { name: 'keywords', type: 'text', defaultValue: 'technical skills', description: 'Relevant technical skills' }
        ],
        conditions: [
          { field: 'matchScore', operator: 'greater_than', value: 70 }
        ],
        category: 'technical' as any,
        isActive: true,
        successRate: 0.72
      }
    ];

    defaultTemplates.forEach(template => {
      this.responseTemplates.set(template.id, template);
    });
  }

  private initializeDefaultProfile(): void {
    // Create a default user profile for demo purposes
    const defaultProfile: JobMatchingProfile = {
      id: 'default-profile',
      userId: 'demo-user',
      skills: [
        {
          name: 'React',
          category: 'frontend' as any,
          proficiency: 'advanced' as any,
          yearsOfExperience: 5,
          keywords: ['react', 'reactjs', 'jsx']
        },
        {
          name: 'TypeScript',
          category: 'frontend' as any,
          proficiency: 'advanced' as any,
          yearsOfExperience: 4,
          keywords: ['typescript', 'ts']
        },
        {
          name: 'Node.js',
          category: 'backend' as any,
          proficiency: 'intermediate' as any,
          yearsOfExperience: 3,
          keywords: ['node', 'nodejs', 'javascript']
        }
      ],
      experience: {
        totalYears: 6,
        seniorityLevel: 'senior' as any,
        industries: ['Technology', 'Startups'],
        companySize: ['startup' as any, 'medium' as any],
        workStyle: ['remote' as any, 'fulltime' as any],
        availability: 'two-weeks' as any
      },
      preferences: {
        salaryRange: {
          min: 80000,
          max: 120000,
          currency: 'USD',
          period: 'yearly'
        },
        preferredLocations: ['Remote', 'New York', 'San Francisco'],
        remoteAllowed: true,
        contractTypes: ['permanent' as any, 'contract' as any],
        excludeKeywords: ['blockchain', 'crypto'],
        minimumMatchScore: 60,
        autoResponseThreshold: 75
      },
      responseTemplates: [
        this.responseTemplates.get('general-1')!,
        this.responseTemplates.get('technical-1')!
      ],
      lastUpdated: new Date()
    };

    this.userProfiles.set(defaultProfile.userId, defaultProfile);
  }
}

export const advancedJobMatcher = AdvancedJobMatcher.getInstance();