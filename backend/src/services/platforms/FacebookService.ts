import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  from: {
    id: string;
    name: string;
    picture?: {
      data: {
        url: string;
      };
    };
  };
  attachments?: {
    data: Array<{
      type: string;
      media?: {
        image?: {
          src: string;
        };
      };
      url?: string;
    }>;
  };
  reactions?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
}

interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
  followers_count?: number;
  friends?: {
    summary: {
      total_count: number;
    };
  };
}

export class FacebookService extends BasePlatformService {
  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: `https://graph.facebook.com/${config.platformAPIs.facebook.apiVersion}`,
      apiVersion: config.platformAPIs.facebook.apiVersion,
      rateLimit: {
        requests: 200,
        windowMs: 60 * 60 * 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
      },
    };

    super(SocialPlatform.FACEBOOK, platformConfig);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.httpClient.post('/oauth/access_token', {
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
        client_id: config.platformAPIs.facebook.clientId,
        client_secret: config.platformAPIs.facebook.clientSecret,
      });

      this.credentials.accessToken = response.data.access_token;
      if (response.data.expires_in) {
        this.credentials.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      }

      this.logActivity('Token refreshed');
    } catch (error) {
      this.logActivity('Token refresh failed', error);
      throw new Error('Failed to refresh Facebook access token');
    }
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<FacebookProfile>({
        method: 'GET',
        url: '/me',
        params: {
          fields: 'id,name,email,picture.width(200).height(200),followers_count,friends.summary(true)',
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
        error: 'Failed to fetch Facebook profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    limit?: number;
    since?: Date;
    until?: Date;
    includeShares?: boolean;
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        fields: 'id,message,story,created_time,from{id,name,picture},attachments{type,media,url},reactions.summary(true),comments.summary(true),shares',
        limit: options.limit || 25,
      };

      if (options.since) {
        params.since = Math.floor(options.since.getTime() / 1000);
      }

      if (options.until) {
        params.until = Math.floor(options.until.getTime() / 1000);
      }

      const response = await this.makeRequest<{
        data: FacebookPost[];
        paging?: {
          next?: string;
          previous?: string;
        };
      }>({
        method: 'GET',
        url: '/me/feed',
        params,
      }, 'content');

      if (response.success && response.data) {
        const posts = response.data.data.map(post => this.transformContent(post));
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
        error: 'Failed to fetch Facebook content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      link?: string;
      imageUrl?: string;
      scheduledTime?: Date;
    } = {}
  ): Promise<PlatformResponse<any>> {
    try {
      const postData: any = {
        message: content,
      };

      if (options.link) {
        postData.link = options.link;
      }

      if (options.imageUrl) {
        postData.url = options.imageUrl;
      }

      if (options.scheduledTime) {
        postData.scheduled_publish_time = Math.floor(options.scheduledTime.getTime() / 1000);
        postData.published = false;
      }

      const response = await this.makeRequest({
        method: 'POST',
        url: '/me/feed',
        data: postData,
      }, 'post');

      this.logActivity('Content posted', { contentLength: content.length });
      return response;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to Facebook',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      type?: 'post' | 'page' | 'user';
      limit?: number;
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const response = await this.makeRequest<{
        data: FacebookPost[];
      }>({
        method: 'GET',
        url: '/search',
        params: {
          q: query,
          type: options.type || 'post',
          limit: options.limit || 25,
          fields: 'id,message,story,created_time,from{id,name,picture},reactions.summary(true),comments.summary(true)',
        },
      }, 'search');

      if (response.success && response.data) {
        const posts = response.data.data.map(post => this.transformContent(post));
        return {
          success: true,
          data: posts,
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
        error: 'Failed to search Facebook content',
        platform: this.platform,
      };
    }
  }

  protected transformContent(post: FacebookPost): SocialContent {
    const content: SocialContent = {
      id: `facebook_${post.id}`,
      platform: SocialPlatform.FACEBOOK,
      externalId: post.id,
      author: {
        id: post.from.id,
        username: post.from.name,
        displayName: post.from.name,
        avatar: post.from.picture?.data.url,
      },
      content: {
        text: post.message || post.story || '',
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: post.reactions?.summary.total_count || 0,
        shares: post.shares?.count || 0,
        comments: post.comments?.summary.total_count || 0,
        views: 0,
        engagement: (post.reactions?.summary.total_count || 0) + 
                   (post.comments?.summary.total_count || 0) + 
                   (post.shares?.count || 0),
      },
      hashtags: this.extractHashtags(post.message || post.story || ''),
      mentions: this.extractMentions(post.message || post.story || ''),
      postedAt: new Date(post.created_time),
      fetchedAt: new Date(),
    };

    if (post.attachments?.data) {
      post.attachments.data.forEach(attachment => {
        if (attachment.type === 'photo' && attachment.media?.image?.src) {
          content.content.images?.push(attachment.media.image.src);
        } else if (attachment.type === 'video_inline' && attachment.url) {
          content.content.videos?.push(attachment.url);
        } else if (attachment.url) {
          content.content.links?.push(attachment.url);
        }
      });
    }

    return content;
  }

  protected transformProfile(profile: FacebookProfile): PlatformProfile {
    return {
      platformUserId: profile.id,
      username: profile.name,
      displayName: profile.name,
      avatar: profile.picture?.data.url,
      followerCount: profile.followers_count,
      followingCount: profile.friends?.summary.total_count,
      verified: false,
      metadata: {
        email: profile.email,
        platform: 'facebook',
      },
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