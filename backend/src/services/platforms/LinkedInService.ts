import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface LinkedInPost {
  id: string;
  author: string;
  commentary?: string;
  content?: {
    article?: {
      title: string;
      description: string;
      source: string;
    };
    media?: {
      id: string;
      title: string;
      mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    };
  };
  created: {
    time: number;
  };
  lastModified: {
    time: number;
  };
  lifecycleState: 'PUBLISHED' | 'DRAFT';
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN_MEMBERS';
  };
  socialDetail?: {
    totalSocialActivityCounts: {
      numComments: number;
      numLikes: number;
      numShares: number;
      numViews?: number;
    };
  };
}

interface LinkedInProfile {
  id: string;
  firstName: {
    localized: {
      [locale: string]: string;
    };
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  lastName: {
    localized: {
      [locale: string]: string;
    };
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  profilePicture?: {
    displayImage: string;
  };
  headline?: {
    localized: {
      [locale: string]: string;
    };
    preferredLocale: {
      country: string;
      language: string;
    };
  };
  summary?: string;
  industry?: string;
  location?: {
    country: string;
    geographicArea: string;
  };
  positions?: {
    elements: Array<{
      title: string;
      companyName: string;
      description?: string;
      location?: string;
      startDate: {
        month: number;
        year: number;
      };
      endDate?: {
        month: number;
        year: number;
      };
    }>;
  };
}

interface LinkedInCompany {
  id: number;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  specialties?: string[];
  logo?: string;
  staffCount?: number;
  followerCount?: number;
}

export class LinkedInService extends BasePlatformService {
  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: 'https://api.linkedin.com/v2',
      apiVersion: 'v2',
      rateLimit: {
        requests: 100, // 100 requests per day for most endpoints
        windowMs: 24 * 60 * 60 * 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 2000, // Longer delay for LinkedIn
      },
    };

    super(SocialPlatform.LINKEDIN, platformConfig);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.httpClient.post('/oauth/v2/accessToken', {
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
        client_id: config.platformAPIs.linkedin.clientId,
        client_secret: config.platformAPIs.linkedin.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.credentials.accessToken = response.data.access_token;
      if (response.data.expires_in) {
        this.credentials.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      }

      this.logActivity('Token refreshed');
    } catch (error) {
      this.logActivity('Token refresh failed', error);
      throw new Error('Failed to refresh LinkedIn access token');
    }
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<LinkedInProfile>({
        method: 'GET',
        url: '/people/~',
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline,summary,industry,location)',
        },
      }, 'profile');

      if (response.success && response.data) {
        const profile = this.transformProfile(response.data);
        return {
          success: true,
          data: profile,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch profile',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get profile failed', error);
      return {
        success: false,
        error: 'Failed to fetch LinkedIn profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    limit?: number;
    start?: number;
    sortBy?: 'CREATED' | 'LAST_MODIFIED';
    lifecycleState?: 'PUBLISHED' | 'DRAFT';
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        q: 'authors',
        authors: `urn:li:person:${await this.getCurrentUserId()}`,
        count: Math.min(options.limit || 20, 50),
        start: options.start || 0,
        sortBy: options.sortBy || 'CREATED',
      };

      if (options.lifecycleState) {
        params.lifecycleState = options.lifecycleState;
      }

      const response = await this.makeRequest<{
        elements: LinkedInPost[];
        paging: {
          count: number;
          start: number;
          total: number;
        };
      }>({
        method: 'GET',
        url: '/ugcPosts',
        params,
      }, 'content');

      if (response.success && response.data?.elements) {
        const posts = response.data.elements.map(post => this.transformContent(post));
        return {
          success: true,
          data: posts,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch content',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get content failed', error);
      return {
        success: false,
        error: 'Failed to fetch LinkedIn content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN_MEMBERS';
      mediaId?: string;
      articleUrl?: string;
      articleTitle?: string;
      articleDescription?: string;
    } = {}
  ): Promise<PlatformResponse<any>> {
    try {
      const userId = await this.getCurrentUserId();
      const postData: any = {
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': options.visibility || 'PUBLIC',
        },
      };

      // Add media if provided
      if (options.mediaId) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          media: `urn:li:digitalmediaAsset:${options.mediaId}`,
        }];
      }

      // Add article if provided
      if (options.articleUrl) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
          status: 'READY',
          originalUrl: options.articleUrl,
          title: {
            text: options.articleTitle || 'Shared Article',
          },
          description: {
            text: options.articleDescription || '',
          },
        }];
      }

      const response = await this.makeRequest({
        method: 'POST',
        url: '/ugcPosts',
        data: postData,
      }, 'post');

      this.logActivity('Content posted', { contentLength: content.length });
      return response;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to LinkedIn',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      type?: 'people' | 'companies' | 'jobs';
      limit?: number;
      start?: number;
      filters?: Record<string, string>;
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const endpoint = options.type === 'people' ? '/peopleSearch' : 
                     options.type === 'companies' ? '/companySearch' :
                     options.type === 'jobs' ? '/jobSearch' : '/peopleSearch';

      const params: any = {
        keywords: query,
        count: Math.min(options.limit || 25, 50),
        start: options.start || 0,
      };

      // Add filters if provided
      if (options.filters) {
        Object.assign(params, options.filters);
      }

      const response = await this.makeRequest<{
        elements: any[];
        paging: {
          count: number;
          start: number;
          total: number;
        };
      }>({
        method: 'GET',
        url: endpoint,
        params,
      }, 'search');

      if (response.success && response.data?.elements) {
        // Transform search results to SocialContent format
        const searchResults = response.data.elements.map(result => 
          this.transformSearchResult(result, options.type || 'people')
        );
        return {
          success: true,
          data: searchResults,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to search content',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Search content failed', error);
      return {
        success: false,
        error: 'Failed to search LinkedIn content',
        platform: this.platform,
      };
    }
  }

  /**
   * Get job postings from LinkedIn
   */
  async getJobPostings(options: {
    keywords?: string;
    location?: string;
    company?: string;
    jobType?: string;
    experienceLevel?: string;
    limit?: number;
    start?: number;
  } = {}): Promise<PlatformResponse<any[]>> {
    try {
      const params: any = {
        count: Math.min(options.limit || 25, 50),
        start: options.start || 0,
      };

      if (options.keywords) params.keywords = options.keywords;
      if (options.location) params.location = options.location;
      if (options.company) params.company = options.company;
      if (options.jobType) params.jobType = options.jobType;
      if (options.experienceLevel) params.experienceLevel = options.experienceLevel;

      const response = await this.makeRequest<{
        elements: any[];
        paging: {
          count: number;
          start: number;
          total: number;
        };
      }>({
        method: 'GET',
        url: '/jobSearch',
        params,
      }, 'jobs');

      if (response.success && response.data?.elements) {
        return {
          success: true,
          data: response.data.elements,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch job postings',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get job postings failed', error);
      return {
        success: false,
        error: 'Failed to fetch LinkedIn job postings',
        platform: this.platform,
      };
    }
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const response = await this.httpClient.get('/people/~:(id)');
      return response.data.id;
    } catch (error) {
      throw new Error('Failed to get current user ID');
    }
  }

  protected transformContent(post: LinkedInPost): SocialContent {
    const content: SocialContent = {
      id: `linkedin_${post.id}`,
      platform: SocialPlatform.LINKEDIN,
      externalId: post.id,
      author: {
        id: post.author,
        username: post.author,
        displayName: 'LinkedIn User',
        avatar: undefined,
      },
      content: {
        text: post.commentary || '',
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: post.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
        shares: post.socialDetail?.totalSocialActivityCounts?.numShares || 0,
        comments: post.socialDetail?.totalSocialActivityCounts?.numComments || 0,
        views: post.socialDetail?.totalSocialActivityCounts?.numViews || 0,
        engagement: (post.socialDetail?.totalSocialActivityCounts?.numLikes || 0) +
                   (post.socialDetail?.totalSocialActivityCounts?.numShares || 0) +
                   (post.socialDetail?.totalSocialActivityCounts?.numComments || 0),
      },
      hashtags: this.extractHashtags(post.commentary || ''),
      mentions: this.extractMentions(post.commentary || ''),
      postedAt: new Date(post.created.time),
      fetchedAt: new Date(),
    };

    // Add article content if present
    if (post.content?.article) {
      content.content.text += ` ${post.content.article.title} - ${post.content.article.description}`;
      if (post.content.article.source) {
        content.content.links?.push(post.content.article.source);
      }
    }

    return content;
  }

  protected transformProfile(profile: LinkedInProfile): PlatformProfile {
    const firstName = Object.values(profile.firstName.localized)[0] || '';
    const lastName = Object.values(profile.lastName.localized)[0] || '';
    const headline = profile.headline ? Object.values(profile.headline.localized)[0] : '';

    return {
      platformUserId: profile.id,
      username: profile.id,
      displayName: `${firstName} ${lastName}`.trim(),
      avatar: profile.profilePicture?.displayImage,
      bio: headline,
      followerCount: undefined,
      followingCount: undefined,
      verified: false,
      metadata: {
        industry: profile.industry,
        location: profile.location ? `${profile.location.geographicArea}, ${profile.location.country}` : undefined,
        summary: profile.summary,
        positions: profile.positions?.elements,
        platform: 'linkedin',
      },
    };
  }

  private transformSearchResult(result: any, type: string): SocialContent {
    return {
      id: `linkedin_search_${result.id || Math.random()}`,
      platform: SocialPlatform.LINKEDIN,
      externalId: result.id || '',
      author: {
        id: result.id || '',
        username: result.publicIdentifier || result.name || 'Unknown',
        displayName: result.firstName && result.lastName ? 
          `${result.firstName} ${result.lastName}` : 
          result.name || 'Unknown',
        avatar: result.pictureInfo?.croppedImage?.elements?.[0]?.identifiers?.[0]?.identifier,
      },
      content: {
        text: result.headline || result.description || '',
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
        engagement: 0,
      },
      hashtags: [],
      mentions: [],
      postedAt: new Date(),
      fetchedAt: new Date(),
    };
  }

  private extractHashtags(text: string): string[] {
    const hashtags = text.match(/#[\w]+/g) || [];
    return hashtags.map(tag => tag.substring(1).toLowerCase());
  }

  private extractMentions(text: string): string[] {
    const mentions = text.match(/@[\w.]+/g) || [];
    return mentions.map(mention => mention.substring(1).toLowerCase());
  }
}