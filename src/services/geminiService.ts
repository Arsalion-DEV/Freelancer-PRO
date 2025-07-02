// Gemini AI Integration Service for Advanced Job Matching

import { 
  JobAnalysis, 
  ExtractedSkill, 
  SalaryAnalysis, 
  ExperienceRequirement,
  WorkArrangementAnalysis,
  SentimentAnalysis,
  RedFlag,
  JobClassification,
  JobMatchScore,
  JobRecommendation,
  AutoResponse,
  ResponseTemplate,
  JobMatchingProfile,
  SkillCategory,
  SkillLevel,
  SeniorityLevel,
  WorkStyle,
  UrgencyLevel,
  CompetitivenessLevel,
  DifficultyLevel,
  TimeCommitment,
  CareerLevel,
  RecommendationType,
  RedFlagType,
  JobCategory
} from '../types/jobMatching';

export interface GeminiJobAnalysisRequest {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  location: string;
  platform: string;
  userProfile?: JobMatchingProfile;
}

export interface GeminiResponseRequest {
  jobAnalysis: JobAnalysis;
  userProfile: JobMatchingProfile;
  template: ResponseTemplate;
  additionalContext?: string;
}

export class GeminiService {
  private static instance: GeminiService;
  private readonly baseModel = 'gemini-2.5-pro';
  private readonly contextWindow = 1000000; // 1M tokens
  
  // Mock configuration - In production, this would use actual Gemini CLI
  private readonly mockMode = true;
  
  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private constructor() {
    // Initialize Gemini CLI connection
    // In production: this.initializeGeminiCLI();
  }

  /**
   * Analyze a job posting using Gemini AI
   */
  public async analyzeJob(request: GeminiJobAnalysisRequest): Promise<JobAnalysis> {
    if (this.mockMode) {
      return this.mockJobAnalysis(request);
    }
    
    const prompt = this.buildJobAnalysisPrompt(request);
    
    try {
      // In production: const response = await this.callGeminiCLI(prompt);
      // return this.parseJobAnalysisResponse(response);
      return this.mockJobAnalysis(request);
    } catch (error) {
      console.error('Gemini job analysis failed:', error);
      throw new Error('Failed to analyze job with Gemini AI');
    }
  }

  /**
   * Calculate job match score using AI
   */
  public async calculateMatchScore(
    jobAnalysis: JobAnalysis, 
    userProfile: JobMatchingProfile
  ): Promise<JobMatchScore> {
    if (this.mockMode) {
      return this.mockMatchScore(jobAnalysis, userProfile);
    }

    const prompt = this.buildMatchScorePrompt(jobAnalysis, userProfile);
    
    try {
      // In production: const response = await this.callGeminiCLI(prompt);
      // return this.parseMatchScoreResponse(response);
      return this.mockMatchScore(jobAnalysis, userProfile);
    } catch (error) {
      console.error('Gemini match score calculation failed:', error);
      throw new Error('Failed to calculate match score with Gemini AI');
    }
  }

  /**
   * Generate personalized response using AI
   */
  public async generateResponse(request: GeminiResponseRequest): Promise<AutoResponse> {
    if (this.mockMode) {
      return this.mockAutoResponse(request);
    }

    const prompt = this.buildResponseGenerationPrompt(request);
    
    try {
      // In production: const response = await this.callGeminiCLI(prompt);
      // return this.parseResponseGenerationResponse(response);
      return this.mockAutoResponse(request);
    } catch (error) {
      console.error('Gemini response generation failed:', error);
      throw new Error('Failed to generate response with Gemini AI');
    }
  }

  /**
   * Classify job using AI
   */
  public async classifyJob(jobAnalysis: JobAnalysis): Promise<JobClassification> {
    if (this.mockMode) {
      return this.mockJobClassification(jobAnalysis);
    }

    const prompt = this.buildJobClassificationPrompt(jobAnalysis);
    
    try {
      // In production: const response = await this.callGeminiCLI(prompt);
      // return this.parseJobClassificationResponse(response);
      return this.mockJobClassification(jobAnalysis);
    } catch (error) {
      console.error('Gemini job classification failed:', error);
      throw new Error('Failed to classify job with Gemini AI');
    }
  }

  /**
   * Generate job recommendations using AI
   */
  public async generateRecommendations(
    jobAnalysis: JobAnalysis,
    matchScore: JobMatchScore,
    userProfile: JobMatchingProfile
  ): Promise<JobRecommendation[]> {
    if (this.mockMode) {
      return this.mockJobRecommendations(jobAnalysis, matchScore, userProfile);
    }

    const prompt = this.buildRecommendationsPrompt(jobAnalysis, matchScore, userProfile);
    
    try {
      // In production: const response = await this.callGeminiCLI(prompt);
      // return this.parseRecommendationsResponse(response);
      return this.mockJobRecommendations(jobAnalysis, matchScore, userProfile);
    } catch (error) {
      console.error('Gemini recommendations generation failed:', error);
      throw new Error('Failed to generate recommendations with Gemini AI');
    }
  }

  // Prompt Building Methods
  
  private buildJobAnalysisPrompt(request: GeminiJobAnalysisRequest): string {
    return `
You are an expert job analyst AI. Analyze the following job posting and provide a comprehensive analysis.

JOB POSTING:
Title: ${request.jobTitle}
Company: ${request.companyName}
Location: ${request.location}
Platform: ${request.platform}

Description:
${request.jobDescription}

Please analyze this job posting and extract the following information in JSON format:

1. SKILLS ANALYSIS:
   - Extract all required and preferred technical skills
   - Categorize skills (frontend, backend, fullstack, mobile, devops, etc.)
   - Determine importance level (required, preferred, nice-to-have)
   - Provide confidence scores (0-1)

2. SALARY ANALYSIS:
   - Detect if salary/rate is mentioned
   - Extract salary range if available
   - Assess if compensation is competitive
   - Provide market comparison if possible

3. EXPERIENCE REQUIREMENTS:
   - Extract minimum/maximum years of experience
   - Determine seniority level required
   - Identify specific experience requirements

4. WORK ARRANGEMENT:
   - Determine if remote, hybrid, or onsite
   - Extract location requirements
   - Identify schedule and time zone requirements
   - Assess travel requirements

5. SENTIMENT ANALYSIS:
   - Overall sentiment (positive, neutral, negative)
   - Analyze company culture indicators
   - Assess role attractiveness
   - Evaluate benefits and perks

6. RED FLAGS DETECTION:
   - Identify unrealistic requirements
   - Detect potential scams or suspicious postings
   - Flag discrimination or bias
   - Assess job posting quality

7. URGENCY AND COMPETITIVENESS:
   - Determine urgency level
   - Assess competitiveness
   - Estimate application deadline pressure

Provide the analysis in structured JSON format following the JobAnalysis interface.
    `;
  }

  private buildMatchScorePrompt(jobAnalysis: JobAnalysis, userProfile: JobMatchingProfile): string {
    return `
You are an expert job matching AI. Calculate a comprehensive match score between a job posting and a user profile.

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

Calculate a detailed match score (0-100) with the following breakdown:

1. SKILLS MATCH (30%):
   - Compare required vs user skills
   - Weight by skill importance and proficiency
   - Consider skill gaps and overlaps

2. EXPERIENCE MATCH (25%):
   - Compare years of experience
   - Match seniority levels
   - Assess industry experience

3. SALARY MATCH (15%):
   - Compare job salary with user expectations
   - Consider negotiation potential
   - Factor in location cost of living

4. LOCATION MATCH (10%):
   - Remote vs onsite preferences
   - Geographic compatibility
   - Time zone considerations

5. WORK STYLE MATCH (10%):
   - Contract type preferences
   - Schedule flexibility
   - Company size preferences

6. COMPANY MATCH (5%):
   - Industry alignment
   - Company size preference
   - Culture indicators

7. INDUSTRY MATCH (3%):
   - Domain expertise alignment
   - Previous industry experience

8. CULTURAL FIT (2%):
   - Work style compatibility
   - Values alignment

Provide the score breakdown and detailed explanations for each component.
Return as JSON following the JobMatchScore interface.
    `;
  }

  private buildResponseGenerationPrompt(request: GeminiResponseRequest): string {
    return `
You are an expert freelance/job application response generator. Create a personalized, compelling response to a job opportunity.

JOB ANALYSIS:
${JSON.stringify(request.jobAnalysis, null, 2)}

USER PROFILE:
${JSON.stringify(request.userProfile, null, 2)}

TEMPLATE:
${JSON.stringify(request.template, null, 2)}

ADDITIONAL CONTEXT:
${request.additionalContext || 'None'}

Generate a personalized response that:

1. PERSONALIZATION:
   - Uses user's specific skills and experience
   - References relevant projects and achievements
   - Matches the tone and style of the job posting

2. RELEVANCE:
   - Addresses specific requirements mentioned in the job
   - Highlights most relevant skills and experience
   - Shows understanding of the role and company

3. ENGAGEMENT:
   - Creates a compelling narrative
   - Demonstrates genuine interest
   - Includes relevant questions or next steps

4. PROFESSIONALISM:
   - Maintains appropriate tone and format
   - Includes proper grammar and structure
   - Follows best practices for the platform

5. CALL TO ACTION:
   - Suggests next steps
   - Provides contact information
   - Shows availability and enthusiasm

The response should be ready to send with minimal editing.
Return as JSON following the AutoResponse interface with shouldRespond boolean, confidence score, and the generated content.
    `;
  }

  private buildJobClassificationPrompt(jobAnalysis: JobAnalysis): string {
    return `
You are an expert job classifier. Classify the following job based on its analysis.

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

Classify this job with:

1. PRIMARY CATEGORY: Main job category (frontend-development, backend-development, etc.)
2. SECONDARY CATEGORIES: Additional relevant categories
3. TAGS: Relevant technology and skill tags
4. DIFFICULTY LEVEL: beginner, intermediate, advanced, expert
5. TIME COMMITMENT: short-term, medium-term, long-term, ongoing
6. CAREER LEVEL: entry, junior, mid, senior, lead, executive

Return as JSON following the JobClassification interface.
    `;
  }

  private buildRecommendationsPrompt(
    jobAnalysis: JobAnalysis, 
    matchScore: JobMatchScore, 
    userProfile: JobMatchingProfile
  ): string {
    return `
You are an expert career advisor AI. Generate actionable recommendations for this job opportunity.

JOB ANALYSIS:
${JSON.stringify(jobAnalysis, null, 2)}

MATCH SCORE:
${JSON.stringify(matchScore, null, 2)}

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

Generate 3-5 specific recommendations with:

1. RECOMMENDATION TYPE: apply-now, apply-later, skip, negotiate-terms, request-info, improve-skills, network-first
2. PRIORITY: low, medium, high
3. REASONING: Detailed explanation
4. ACTIONABLE STEPS: Specific actions to take
5. TIMELINE: When to act
6. RESOURCES: Helpful resources if applicable

Return as JSON array following the JobRecommendation interface.
    `;
  }

  // Mock Implementation (to be replaced with actual Gemini CLI calls)
  
  private async mockJobAnalysis(request: GeminiJobAnalysisRequest): Promise<JobAnalysis> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const skills = this.extractSkillsFromDescription(request.jobDescription, request.jobTitle);
    
    return {
      extractedSkills: skills,
      salaryAnalysis: {
        hasSalary: request.jobDescription.toLowerCase().includes('$') || 
                   request.jobDescription.toLowerCase().includes('salary') ||
                   request.jobDescription.toLowerCase().includes('pay'),
        range: request.jobDescription.includes('$') ? {
          min: 80000,
          max: 120000,
          currency: 'USD',
          period: 'yearly'
        } : undefined,
        isCompetitive: true,
        marketComparison: 'at',
        confidence: 0.8
      },
      experienceRequirement: {
        minimumYears: this.extractExperienceFromDescription(request.jobDescription),
        seniorityLevel: this.determineSeniorityLevel(request.jobTitle, request.jobDescription),
        specificRequirements: ['Frontend frameworks', 'API integration', 'Version control'],
        confidence: 0.85
      },
      workArrangement: {
        workStyle: [request.jobDescription.toLowerCase().includes('remote') ? WorkStyle.REMOTE : WorkStyle.HYBRID],
        location: {
          isRemote: request.jobDescription.toLowerCase().includes('remote'),
          specificLocations: [request.location],
          relocationRequired: false
        },
        schedule: {
          flexibility: 'some' as const
        },
        travelRequired: false
      },
      sentiment: {
        overall: 'positive',
        aspects: {
          company: 0.8,
          role: 0.85,
          benefits: 0.7,
          requirements: 0.75
        },
        confidence: 0.8
      },
      urgency: request.jobDescription.toLowerCase().includes('urgent') || 
              request.jobDescription.toLowerCase().includes('asap') ? UrgencyLevel.HIGH : UrgencyLevel.MEDIUM,
      competitiveness: CompetitivenessLevel.MEDIUM,
      redFlags: this.detectRedFlags(request.jobDescription),
      qualityScore: 0.85
    };
  }

  private async mockMatchScore(
    jobAnalysis: JobAnalysis, 
    userProfile: JobMatchingProfile
  ): Promise<JobMatchScore> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const skillsMatch = this.calculateSkillsMatch(jobAnalysis.extractedSkills, userProfile.skills);
    const experienceMatch = this.calculateExperienceMatch(jobAnalysis.experienceRequirement, userProfile.experience);
    
    const breakdown = {
      skillsMatch: skillsMatch,
      experienceMatch: experienceMatch,
      salaryMatch: 0.8,
      locationMatch: 0.9,
      workStyleMatch: 0.85,
      companyMatch: 0.7,
      industryMatch: 0.75,
      culturalFit: 0.8
    };

    const overall = (
      breakdown.skillsMatch * 0.3 +
      breakdown.experienceMatch * 0.25 +
      breakdown.salaryMatch * 0.15 +
      breakdown.locationMatch * 0.1 +
      breakdown.workStyleMatch * 0.1 +
      breakdown.companyMatch * 0.05 +
      breakdown.industryMatch * 0.03 +
      breakdown.culturalFit * 0.02
    ) * 100;

    return {
      overall: Math.round(overall),
      breakdown,
      explanation: [
        `Strong skills match with ${Math.round(skillsMatch * 100)}% compatibility`,
        `Experience aligns well with requirements`,
        `Location and work style preferences match`,
        overall > 80 ? 'Excellent opportunity - highly recommended' : 
        overall > 60 ? 'Good opportunity with some considerations' :
        'Consider improving skills or profile match'
      ],
      confidence: 0.85,
      lastCalculated: new Date()
    };
  }

  private async mockAutoResponse(request: GeminiResponseRequest): Promise<AutoResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const shouldRespond = this.shouldAutoRespond(request.jobAnalysis);
    
    if (!shouldRespond) {
      return {
        shouldRespond: false,
        confidence: 0.3,
        template: request.template,
        personalizedContent: '',
        reasoning: 'Job score below auto-response threshold or red flags detected',
        variables: {}
      };
    }

    const personalizedContent = this.generatePersonalizedContent(request);

    return {
      shouldRespond: true,
      confidence: 0.88,
      template: request.template,
      personalizedContent,
      scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes delay
      reasoning: 'High match score and no red flags detected. Strong alignment with user profile.',
      variables: {
        experience: request.userProfile.experience.totalYears,
        topSkills: request.userProfile.skills.slice(0, 3).map(s => s.name).join(', '),
        name: request.userProfile.userId // In real implementation, use actual name
      }
    };
  }

  private async mockJobClassification(jobAnalysis: JobAnalysis): Promise<JobClassification> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const primaryCategory = this.determinePrimaryCategory(jobAnalysis.extractedSkills);
    
    return {
      primary: primaryCategory,
      secondary: [JobCategory.FULLSTACK_DEVELOPMENT, JobCategory.FRONTEND_DEVELOPMENT],
      tags: jobAnalysis.extractedSkills.map(skill => skill.name.toLowerCase()),
      difficultyLevel: jobAnalysis.experienceRequirement.minimumYears > 5 ? DifficultyLevel.ADVANCED : 
                      jobAnalysis.experienceRequirement.minimumYears > 2 ? DifficultyLevel.INTERMEDIATE : DifficultyLevel.BEGINNER,
      timeCommitment: TimeCommitment.LONG_TERM,
      careerLevel: jobAnalysis.experienceRequirement.seniorityLevel === SeniorityLevel.SENIOR ? CareerLevel.SENIOR : CareerLevel.MID
    };
  }

  private async mockJobRecommendations(
    jobAnalysis: JobAnalysis,
    matchScore: JobMatchScore,
    userProfile: JobMatchingProfile
  ): Promise<JobRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 900));

    const recommendations: JobRecommendation[] = [];

    if (matchScore.overall >= 80) {
      recommendations.push({
        type: RecommendationType.APPLY_NOW,
        priority: 'high',
        title: 'Apply Immediately',
        description: 'This is an excellent match for your profile. Apply now to maximize your chances.',
        action: {
          type: 'respond',
          details: 'Submit application with personalized cover letter',
          timeline: 'Within 24 hours'
        },
        reasoning: 'High overall match score with strong skills and experience alignment'
      });
    } else if (matchScore.overall >= 60) {
      recommendations.push({
        type: RecommendationType.APPLY_LATER,
        priority: 'medium',
        title: 'Consider After Review',
        description: 'Good match but consider improving certain aspects of your application.',
        action: {
          type: 'research',
          details: 'Research company culture and refine application',
          timeline: 'Within 3 days'
        },
        reasoning: 'Moderate match score with room for improvement in application strategy'
      });
    }

    if (jobAnalysis.redFlags.length > 0) {
      recommendations.push({
        type: RecommendationType.SKIP,
        priority: 'medium',
        title: 'Proceed with Caution',
        description: 'Some red flags detected. Review carefully before applying.',
        reasoning: `Red flags detected: ${jobAnalysis.redFlags.map(flag => flag.type).join(', ')}`
      });
    }

    return recommendations;
  }

  // Helper Methods

  private extractSkillsFromDescription(description: string, title: string): ExtractedSkill[] {
    const commonSkills = [
      { name: 'React', category: SkillCategory.FRONTEND, keywords: ['react', 'reactjs'] },
      { name: 'TypeScript', category: SkillCategory.FRONTEND, keywords: ['typescript', 'ts'] },
      { name: 'Node.js', category: SkillCategory.BACKEND, keywords: ['node', 'nodejs', 'node.js'] },
      { name: 'Python', category: SkillCategory.BACKEND, keywords: ['python'] },
      { name: 'JavaScript', category: SkillCategory.FRONTEND, keywords: ['javascript', 'js'] },
      { name: 'HTML', category: SkillCategory.FRONTEND, keywords: ['html', 'html5'] },
      { name: 'CSS', category: SkillCategory.FRONTEND, keywords: ['css', 'css3'] },
      { name: 'Vue.js', category: SkillCategory.FRONTEND, keywords: ['vue', 'vuejs', 'vue.js'] },
      { name: 'Angular', category: SkillCategory.FRONTEND, keywords: ['angular'] },
      { name: 'Express.js', category: SkillCategory.BACKEND, keywords: ['express', 'expressjs'] },
      { name: 'MongoDB', category: SkillCategory.BACKEND, keywords: ['mongodb', 'mongo'] },
      { name: 'PostgreSQL', category: SkillCategory.BACKEND, keywords: ['postgresql', 'postgres'] },
      { name: 'AWS', category: SkillCategory.DEVOPS, keywords: ['aws', 'amazon web services'] },
      { name: 'Docker', category: SkillCategory.DEVOPS, keywords: ['docker'] },
      { name: 'Git', category: SkillCategory.OTHER, keywords: ['git', 'github', 'gitlab'] }
    ];

    const extractedSkills: ExtractedSkill[] = [];
    const contentToAnalyze = (description + ' ' + title).toLowerCase();

    commonSkills.forEach(skill => {
      const found = skill.keywords.some(keyword => contentToAnalyze.includes(keyword));
      if (found) {
        extractedSkills.push({
          name: skill.name,
          category: skill.category,
          importance: contentToAnalyze.includes('required') || contentToAnalyze.includes('must') ? 'required' : 'preferred',
          context: `Found in job ${contentToAnalyze.includes(title.toLowerCase()) ? 'title' : 'description'}`,
          confidence: 0.8 + Math.random() * 0.2
        });
      }
    });

    return extractedSkills;
  }

  private extractExperienceFromDescription(description: string): number {
    const experienceRegex = /(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi;
    const matches = description.match(experienceRegex);
    
    if (matches && matches.length > 0) {
      const numbers = matches[0].match(/\d+/);
      return numbers ? parseInt(numbers[0]) : 3;
    }
    
    return 3; // Default
  }

  private determineSeniorityLevel(title: string, description: string): SeniorityLevel {
    const content = (title + ' ' + description).toLowerCase();
    
    if (content.includes('senior') || content.includes('lead') || content.includes('principal')) {
      return SeniorityLevel.SENIOR;
    } else if (content.includes('junior') || content.includes('entry')) {
      return SeniorityLevel.JUNIOR;
    } else {
      return SeniorityLevel.MID;
    }
  }

  private detectRedFlags(description: string): RedFlag[] {
    const redFlags: RedFlag[] = [];
    const content = description.toLowerCase();

    if (content.includes('no experience') && content.includes('expert level')) {
      redFlags.push({
        type: RedFlagType.UNREALISTIC_REQUIREMENTS,
        description: 'Contradictory experience requirements',
        severity: 'medium',
        details: 'Job requires both no experience and expert level skills'
      });
    }

    if (content.includes('unpaid') || content.includes('for free') || content.includes('no pay')) {
      redFlags.push({
        type: RedFlagType.UNPAID_WORK,
        description: 'Unpaid work opportunity',
        severity: 'high',
        details: 'Job appears to be unpaid or offers no compensation'
      });
    }

    return redFlags;
  }

  private calculateSkillsMatch(extractedSkills: ExtractedSkill[], userSkills: any[]): number {
    if (extractedSkills.length === 0) return 0.5;
    
    const matchedSkills = extractedSkills.filter(jobSkill => 
      userSkills.some(userSkill => 
        userSkill.name.toLowerCase() === jobSkill.name.toLowerCase() ||
        userSkill.keywords?.some((keyword: string) => 
          keyword.toLowerCase() === jobSkill.name.toLowerCase()
        )
      )
    );

    return Math.min(matchedSkills.length / extractedSkills.length, 1);
  }

  private calculateExperienceMatch(requirement: ExperienceRequirement, userExperience: any): number {
    const userYears = userExperience.totalYears || 0;
    const requiredYears = requirement.minimumYears || 0;
    
    if (userYears >= requiredYears) {
      return Math.min(1, (userYears / (requiredYears + 2))); // Bonus for extra experience
    } else {
      return userYears / requiredYears; // Penalty for insufficient experience
    }
  }

  private shouldAutoRespond(jobAnalysis: JobAnalysis): boolean {
    return jobAnalysis.qualityScore > 0.7 && 
           jobAnalysis.redFlags.length === 0 &&
           jobAnalysis.sentiment.overall === 'positive';
  }

  private generatePersonalizedContent(request: GeminiResponseRequest): string {
    const skills = request.userProfile.skills.slice(0, 3).map(s => s.name).join(', ');
    const experience = request.userProfile.experience.totalYears;
    
    return `Hi there!

I'm excited about this opportunity! With ${experience} years of experience in ${skills}, I believe I'd be a great fit for this role.

${request.template.body.replace('{experience}', experience.toString()).replace('{keywords}', skills)}

I'd love to discuss how my background in ${skills} can contribute to your team's success.

Best regards,
[Your name]`;
  }

  private determinePrimaryCategory(skills: ExtractedSkill[]): JobCategory {
    const frontendSkills = skills.filter(s => s.category === SkillCategory.FRONTEND).length;
    const backendSkills = skills.filter(s => s.category === SkillCategory.BACKEND).length;
    
    if (frontendSkills > backendSkills) {
      return JobCategory.FRONTEND_DEVELOPMENT;
    } else if (backendSkills > frontendSkills) {
      return JobCategory.BACKEND_DEVELOPMENT;
    } else {
      return JobCategory.FULLSTACK_DEVELOPMENT;
    }
  }
}

export const geminiService = GeminiService.getInstance();