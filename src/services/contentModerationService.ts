// Content Moderation Service with AI-Powered Safety Analysis

import {
  ContentModerationRule,
  ContentAnalysis,
  ModerationDecision,
  AnalysisResult,
  ModerationCategory,
  RiskLevel,
  ActionType,
  ContentType,
  RuleType,
  Severity,
  ModerationMetrics,
  CategoryCount,
  PlatformModerationStats
} from '../types/compliance';

export interface ModerationRequest {
  contentId: string;
  platform: string;
  contentType: ContentType;
  text?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  authorId?: string;
  metadata?: Record<string, any>;
}

export interface ModerationResult {
  analysis: ContentAnalysis;
  decision: ModerationDecision;
  appliedRules: ContentModerationRule[];
  blocked: boolean;
  flagged: boolean;
  confidence: number;
}

export class ContentModerationService {
  private static instance: ContentModerationService;
  private moderationRules: Map<string, ContentModerationRule> = new Map();
  private analysisHistory: Map<string, ContentAnalysis> = new Map();
  private metrics: ModerationMetrics = {
    totalContentAnalyzed: 0,
    contentBlocked: 0,
    falsePositives: 0,
    averageResponseTime: 150,
    topViolationCategories: [],
    platformBreakdown: []
  };

  public static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService();
    }
    return ContentModerationService.instance;
  }

  private constructor() {
    this.initializeDefaultRules();
    this.initializeMetrics();
  }

  /**
   * Analyze content for safety violations and moderation needs
   */
  public async analyzeContent(request: ModerationRequest): Promise<ModerationResult> {
    console.log(`Analyzing content: ${request.contentId} from ${request.platform}`);

    try {
      // Step 1: Pre-processing
      const preprocessedContent = this.preprocessContent(request);

      // Step 2: Apply moderation rules
      const appliedRules = this.getApplicableRules(request.platform);
      const ruleResults = await this.applyModerationRules(preprocessedContent, appliedRules);

      // Step 3: AI Content Analysis
      const aiAnalysis = await this.performAIAnalysis(preprocessedContent);

      // Step 4: Combine results and make decision
      const combinedAnalysis = this.combineAnalysisResults(ruleResults, aiAnalysis);
      const decision = this.makeModerationDecision(combinedAnalysis, appliedRules);

      // Step 5: Create comprehensive analysis
      const analysis: ContentAnalysis = {
        id: `analysis_${Date.now()}`,
        contentId: request.contentId,
        platform: request.platform,
        contentType: request.contentType,
        text: request.text,
        imageUrls: request.imageUrls,
        videoUrls: request.videoUrls,
        analyzedAt: new Date(),
        results: combinedAnalysis,
        overallRisk: this.calculateOverallRisk(combinedAnalysis),
        moderationDecision: decision,
        reviewRequired: this.requiresHumanReview(combinedAnalysis, decision)
      };

      // Step 6: Store analysis
      this.analysisHistory.set(analysis.id, analysis);
      this.updateMetrics(analysis);

      const result: ModerationResult = {
        analysis,
        decision,
        appliedRules,
        blocked: decision.action === ActionType.BLOCK_CONTENT,
        flagged: decision.action === ActionType.FLAG_FOR_REVIEW,
        confidence: this.calculateConfidence(combinedAnalysis)
      };

      console.log(`Content analysis completed. Risk: ${analysis.overallRisk}, Action: ${decision.action}`);
      return result;

    } catch (error) {
      console.error('Content moderation failed:', error);
      throw new Error(`Content moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add or update moderation rule
   */
  public addModerationRule(rule: ContentModerationRule): void {
    this.moderationRules.set(rule.id, rule);
    console.log(`Added moderation rule: ${rule.name}`);
  }

  /**
   * Remove moderation rule
   */
  public removeModerationRule(ruleId: string): boolean {
    const success = this.moderationRules.delete(ruleId);
    if (success) {
      console.log(`Removed moderation rule: ${ruleId}`);
    }
    return success;
  }

  /**
   * Get all moderation rules
   */
  public getModerationRules(): ContentModerationRule[] {
    return Array.from(this.moderationRules.values());
  }

  /**
   * Get moderation metrics
   */
  public getMetrics(): ModerationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get content analysis by ID
   */
  public getAnalysis(analysisId: string): ContentAnalysis | undefined {
    return this.analysisHistory.get(analysisId);
  }

  /**
   * Get recent analyses
   */
  public getRecentAnalyses(limit: number = 50): ContentAnalysis[] {
    return Array.from(this.analysisHistory.values())
      .sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime())
      .slice(0, limit);
  }

  // Private Methods

  private preprocessContent(request: ModerationRequest): ModerationRequest {
    // Clean and normalize content
    const processed = { ...request };
    
    if (processed.text) {
      // Remove excessive whitespace, normalize encoding
      processed.text = processed.text.trim().replace(/\s+/g, ' ');
    }

    return processed;
  }

  private getApplicableRules(platform: string): ContentModerationRule[] {
    return Array.from(this.moderationRules.values()).filter(rule => 
      rule.isActive && 
      (rule.platforms.includes(platform) || rule.platforms.includes('all'))
    );
  }

  private async applyModerationRules(
    content: ModerationRequest, 
    rules: ContentModerationRule[]
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const rule of rules) {
      const ruleResult = await this.evaluateRule(content, rule);
      if (ruleResult) {
        results.push(ruleResult);
        
        // Update rule statistics
        rule.lastTriggered = new Date();
        rule.triggerCount++;
      }
    }

    return results;
  }

  private async evaluateRule(
    content: ModerationRequest, 
    rule: ContentModerationRule
  ): Promise<AnalysisResult | null> {
    if (!content.text && rule.ruleType !== RuleType.IMAGE_ANALYSIS) {
      return null;
    }

    switch (rule.ruleType) {
      case RuleType.KEYWORD_FILTER:
        return this.evaluateKeywordFilter(content, rule);
      case RuleType.REGEX_PATTERN:
        return this.evaluateRegexPattern(content, rule);
      case RuleType.AI_CLASSIFIER:
        return this.evaluateAIClassifier(content, rule);
      case RuleType.SENTIMENT_ANALYSIS:
        return this.evaluateSentimentAnalysis(content, rule);
      default:
        return null;
    }
  }

  private evaluateKeywordFilter(
    content: ModerationRequest, 
    rule: ContentModerationRule
  ): AnalysisResult | null {
    if (!content.text) return null;

    const text = content.text.toLowerCase();
    const flaggedElements: string[] = [];

    for (const condition of rule.conditions) {
      if (condition.field === 'text' && condition.operator === 'contains') {
        const keywords = Array.isArray(condition.value) ? condition.value : [condition.value];
        
        for (const keyword of keywords) {
          const searchTerm = condition.caseSensitive ? keyword : keyword.toLowerCase();
          if (text.includes(searchTerm)) {
            flaggedElements.push(keyword);
          }
        }
      }
    }

    if (flaggedElements.length > 0) {
      return {
        category: rule.category,
        confidence: 0.9,
        details: `Found prohibited keywords: ${flaggedElements.join(', ')}`,
        flaggedElements,
        suggestions: [`Remove or replace flagged terms: ${flaggedElements.join(', ')}`]
      };
    }

    return null;
  }

  private evaluateRegexPattern(
    content: ModerationRequest, 
    rule: ContentModerationRule
  ): AnalysisResult | null {
    if (!content.text) return null;

    const flaggedElements: string[] = [];

    for (const condition of rule.conditions) {
      if (condition.field === 'text' && condition.operator === 'matches') {
        try {
          const regex = new RegExp(condition.value, condition.caseSensitive ? 'g' : 'gi');
          const matches = content.text.match(regex);
          
          if (matches) {
            flaggedElements.push(...matches);
          }
        } catch (error) {
          console.warn(`Invalid regex pattern: ${condition.value}`);
        }
      }
    }

    if (flaggedElements.length > 0) {
      return {
        category: rule.category,
        confidence: 0.85,
        details: `Content matches prohibited patterns`,
        flaggedElements,
        suggestions: ['Review and modify flagged content patterns']
      };
    }

    return null;
  }

  private async evaluateAIClassifier(
    content: ModerationRequest, 
    rule: ContentModerationRule
  ): Promise<AnalysisResult | null> {
    // Mock AI classification - in production, this would call actual AI services
    if (!content.text) return null;

    const text = content.text.toLowerCase();
    let confidence = 0;
    const flaggedElements: string[] = [];

    // Simple heuristic-based classification for demo
    switch (rule.category) {
      case ModerationCategory.SPAM:
        if (text.includes('click here') || text.includes('limited time') || text.includes('act now')) {
          confidence = 0.75;
          flaggedElements.push('spam-like phrases');
        }
        break;
      case ModerationCategory.HARASSMENT:
        if (text.includes('stupid') || text.includes('idiot') || text.includes('hate you')) {
          confidence = 0.65;
          flaggedElements.push('potentially harassing language');
        }
        break;
      case ModerationCategory.PERSONAL_INFO:
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/g;
        if (emailRegex.test(text) || phoneRegex.test(text)) {
          confidence = 0.9;
          flaggedElements.push('personal information detected');
        }
        break;
    }

    if (confidence > 0.5) {
      return {
        category: rule.category,
        confidence,
        details: `AI classifier detected ${rule.category} with ${Math.round(confidence * 100)}% confidence`,
        flaggedElements,
        suggestions: [`Review content for ${rule.category} violations`]
      };
    }

    return null;
  }

  private async evaluateSentimentAnalysis(
    content: ModerationRequest, 
    rule: ContentModerationRule
  ): Promise<AnalysisResult | null> {
    if (!content.text) return null;

    // Mock sentiment analysis
    const text = content.text.toLowerCase();
    const negativeWords = ['hate', 'angry', 'terrible', 'awful', 'disgusting', 'horrible'];
    const positiveWords = ['love', 'great', 'awesome', 'excellent', 'amazing', 'wonderful'];

    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;

    const sentimentScore = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
    
    // Flag very negative content
    if (sentimentScore < -0.5) {
      return {
        category: ModerationCategory.INAPPROPRIATE_LANGUAGE,
        confidence: Math.abs(sentimentScore),
        details: `Negative sentiment detected (score: ${sentimentScore.toFixed(2)})`,
        flaggedElements: negativeWords.filter(word => text.includes(word)),
        suggestions: ['Consider revising content tone to be more positive']
      };
    }

    return null;
  }

  private async performAIAnalysis(content: ModerationRequest): Promise<AnalysisResult[]> {
    // Mock comprehensive AI analysis
    // In production, this would integrate with advanced AI services like OpenAI Moderation API
    
    const results: AnalysisResult[] = [];

    if (content.text) {
      // Language toxicity analysis
      const toxicityResult = await this.analyzeToxicity(content.text);
      if (toxicityResult) results.push(toxicityResult);

      // Content quality analysis
      const qualityResult = await this.analyzeContentQuality(content.text);
      if (qualityResult) results.push(qualityResult);
    }

    if (content.imageUrls && content.imageUrls.length > 0) {
      // Image safety analysis
      const imageResult = await this.analyzeImages(content.imageUrls);
      if (imageResult) results.push(imageResult);
    }

    return results;
  }

  private async analyzeToxicity(text: string): Promise<AnalysisResult | null> {
    // Mock toxicity analysis
    const toxicPatterns = [
      'kill yourself', 'go die', 'hate you', 'worthless', 'pathetic',
      'loser', 'moron', 'retard', 'bitch', 'asshole'
    ];

    const foundPatterns = toxicPatterns.filter(pattern => 
      text.toLowerCase().includes(pattern)
    );

    if (foundPatterns.length > 0) {
      return {
        category: ModerationCategory.HARASSMENT,
        confidence: 0.85 + (foundPatterns.length * 0.05),
        details: 'Potentially toxic language detected',
        flaggedElements: foundPatterns,
        suggestions: ['Remove or rephrase aggressive language']
      };
    }

    return null;
  }

  private async analyzeContentQuality(text: string): Promise<AnalysisResult | null> {
    // Check for spam indicators
    const spamIndicators = [
      'limited time offer', 'act now', 'guaranteed', 'no risk',
      'make money fast', 'work from home', 'click here', 'free money'
    ];

    const foundIndicators = spamIndicators.filter(indicator =>
      text.toLowerCase().includes(indicator)
    );

    if (foundIndicators.length >= 2) {
      return {
        category: ModerationCategory.SPAM,
        confidence: 0.7 + (foundIndicators.length * 0.1),
        details: 'Content shows characteristics of spam',
        flaggedElements: foundIndicators,
        suggestions: ['Remove promotional language and focus on genuine content']
      };
    }

    return null;
  }

  private async analyzeImages(imageUrls: string[]): Promise<AnalysisResult | null> {
    // Mock image analysis
    // In production, this would use computer vision APIs
    
    return {
      category: ModerationCategory.ADULT_CONTENT,
      confidence: 0.3, // Low confidence for mock
      details: `Analyzed ${imageUrls.length} images`,
      flaggedElements: [],
      suggestions: ['Images appear safe']
    };
  }

  private combineAnalysisResults(
    ruleResults: AnalysisResult[], 
    aiResults: AnalysisResult[]
  ): AnalysisResult[] {
    const combined = [...ruleResults, ...aiResults];
    
    // Merge results for the same category
    const categoryMap = new Map<ModerationCategory, AnalysisResult>();
    
    for (const result of combined) {
      const existing = categoryMap.get(result.category);
      if (existing) {
        // Combine results for the same category
        existing.confidence = Math.max(existing.confidence, result.confidence);
        existing.flaggedElements.push(...result.flaggedElements);
        existing.suggestions.push(...result.suggestions);
      } else {
        categoryMap.set(result.category, { ...result });
      }
    }

    return Array.from(categoryMap.values());
  }

  private makeModerationDecision(
    results: AnalysisResult[], 
    appliedRules: ContentModerationRule[]
  ): ModerationDecision {
    if (results.length === 0) {
      return {
        action: ActionType.LOG_INCIDENT, // Allow but log
        reason: 'Content passed all moderation checks',
        automatedDecision: true,
        appealable: false
      };
    }

    // Find highest risk result
    const highestRisk = results.reduce((max, current) => 
      current.confidence > max.confidence ? current : max
    );

    // Determine action based on confidence and category severity
    let action: ActionType;
    let appealable = true;

    if (highestRisk.confidence >= 0.9) {
      action = ActionType.BLOCK_CONTENT;
    } else if (highestRisk.confidence >= 0.7) {
      action = ActionType.FLAG_FOR_REVIEW;
    } else if (highestRisk.confidence >= 0.5) {
      action = ActionType.SEND_WARNING;
    } else {
      action = ActionType.LOG_INCIDENT;
      appealable = false;
    }

    // Check for critical categories that always block
    const criticalCategories = [
      ModerationCategory.PERSONAL_INFO,
      ModerationCategory.HATE_SPEECH,
      ModerationCategory.VIOLENCE
    ];

    if (results.some(r => criticalCategories.includes(r.category) && r.confidence > 0.6)) {
      action = ActionType.BLOCK_CONTENT;
    }

    return {
      action,
      reason: `${highestRisk.category} detected with ${Math.round(highestRisk.confidence * 100)}% confidence: ${highestRisk.details}`,
      automatedDecision: true,
      appealable
    };
  }

  private calculateOverallRisk(results: AnalysisResult[]): RiskLevel {
    if (results.length === 0) return RiskLevel.LOW;

    const maxConfidence = Math.max(...results.map(r => r.confidence));
    
    if (maxConfidence >= 0.8) return RiskLevel.CRITICAL;
    if (maxConfidence >= 0.6) return RiskLevel.HIGH;
    if (maxConfidence >= 0.4) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private requiresHumanReview(results: AnalysisResult[], decision: ModerationDecision): boolean {
    // Require human review for borderline cases or complex content
    const maxConfidence = results.length > 0 ? Math.max(...results.map(r => r.confidence)) : 0;
    
    return (
      decision.action === ActionType.FLAG_FOR_REVIEW ||
      (maxConfidence > 0.4 && maxConfidence < 0.8) ||
      results.length > 3
    );
  }

  private calculateConfidence(results: AnalysisResult[]): number {
    if (results.length === 0) return 1.0;
    
    // Average confidence weighted by severity
    const weightedSum = results.reduce((sum, result) => sum + result.confidence, 0);
    return Math.min(weightedSum / results.length, 1.0);
  }

  private updateMetrics(analysis: ContentAnalysis): void {
    this.metrics.totalContentAnalyzed++;
    
    if (analysis.moderationDecision.action === ActionType.BLOCK_CONTENT) {
      this.metrics.contentBlocked++;
    }

    // Update category counts
    for (const result of analysis.results) {
      const existingCategory = this.metrics.topViolationCategories.find(c => c.category === result.category);
      if (existingCategory) {
        existingCategory.count++;
      } else {
        this.metrics.topViolationCategories.push({
          category: result.category,
          count: 1,
          percentage: 0
        });
      }
    }

    // Recalculate percentages
    const total = this.metrics.topViolationCategories.reduce((sum, cat) => sum + cat.count, 0);
    this.metrics.topViolationCategories.forEach(cat => {
      cat.percentage = (cat.count / total) * 100;
    });

    // Sort by count
    this.metrics.topViolationCategories.sort((a, b) => b.count - a.count);

    // Update platform breakdown
    const platformStat = this.metrics.platformBreakdown.find(p => p.platform === analysis.platform);
    if (platformStat) {
      platformStat.analyzed++;
      if (analysis.moderationDecision.action === ActionType.BLOCK_CONTENT) {
        platformStat.blocked++;
      }
      if (analysis.moderationDecision.action === ActionType.FLAG_FOR_REVIEW) {
        platformStat.flagged++;
      }
      // Simple accuracy calculation (would be more sophisticated in production)
      platformStat.accuracy = ((platformStat.analyzed - platformStat.blocked) / platformStat.analyzed) * 100;
    } else {
      this.metrics.platformBreakdown.push({
        platform: analysis.platform,
        analyzed: 1,
        blocked: analysis.moderationDecision.action === ActionType.BLOCK_CONTENT ? 1 : 0,
        flagged: analysis.moderationDecision.action === ActionType.FLAG_FOR_REVIEW ? 1 : 0,
        accuracy: 100
      });
    }
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalContentAnalyzed: 0,
      contentBlocked: 0,
      falsePositives: 0,
      averageResponseTime: 150, // milliseconds
      topViolationCategories: [],
      platformBreakdown: []
    };
  }

  private initializeDefaultRules(): void {
    const defaultRules: ContentModerationRule[] = [
      {
        id: 'spam-keywords',
        name: 'Spam Keyword Filter',
        description: 'Detects common spam phrases and promotional content',
        category: ModerationCategory.SPAM,
        ruleType: RuleType.KEYWORD_FILTER,
        conditions: [
          {
            field: 'text',
            operator: 'contains',
            value: ['click here', 'limited time', 'act now', 'guaranteed money', 'work from home'],
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: ActionType.FLAG_FOR_REVIEW,
            parameters: {},
            notify: true,
            escalate: false
          }
        ],
        severity: Severity.MEDIUM,
        isActive: true,
        platforms: ['all'],
        createdAt: new Date(),
        triggerCount: 0
      },
      {
        id: 'personal-info-protection',
        name: 'Personal Information Protection',
        description: 'Prevents sharing of email addresses and phone numbers',
        category: ModerationCategory.PERSONAL_INFO,
        ruleType: RuleType.REGEX_PATTERN,
        conditions: [
          {
            field: 'text',
            operator: 'matches',
            value: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b|\\b\\d{3}-\\d{3}-\\d{4}\\b',
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: ActionType.BLOCK_CONTENT,
            parameters: { reason: 'Personal information detected' },
            notify: true,
            escalate: true
          }
        ],
        severity: Severity.HIGH,
        isActive: true,
        platforms: ['all'],
        createdAt: new Date(),
        triggerCount: 0
      },
      {
        id: 'harassment-detection',
        name: 'Harassment and Toxic Language Detection',
        description: 'Identifies potentially harmful or harassing content',
        category: ModerationCategory.HARASSMENT,
        ruleType: RuleType.AI_CLASSIFIER,
        conditions: [
          {
            field: 'toxicity_score',
            operator: 'greater_than',
            value: 0.6,
            caseSensitive: false
          }
        ],
        actions: [
          {
            type: ActionType.FLAG_FOR_REVIEW,
            parameters: {},
            notify: true,
            escalate: true
          }
        ],
        severity: Severity.HIGH,
        isActive: true,
        platforms: ['all'],
        createdAt: new Date(),
        triggerCount: 0
      }
    ];

    defaultRules.forEach(rule => {
      this.moderationRules.set(rule.id, rule);
    });
  }
}

export const contentModerationService = ContentModerationService.getInstance();