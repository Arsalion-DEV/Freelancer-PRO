import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
    bookmark_count?: number;
    impression_count?: number;
  };
  attachments?: {
    media_keys?: string[];
    poll_ids?: string[];
  };
  context_annotations?: Array<{
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
  entities?: {
    hashtags?: Array<{
      start: number;
      end: number;
      tag: string;
    }>;
    mentions?: Array<{
      start: number;
      end: number;
      username: string;
      id: string;
    }>;
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expanded_url: string;
      display_url: string;
    }>;
  };
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profile_image_url?: string;
  verified?: boolean;
  verified_type?: 'blue' | 'business' | 'government';
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
    like_count?: number;
  };
  location?: string;
  url?: string;
  created_at: string;
}

interface TwitterMedia {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  public_metrics?: {
    view_count?: number;
  };
  width?: number;
  height?: number;
}

interface TwitterResponse<T> {
  data?: T;
  includes?: {
    users?: TwitterUser[];
    media?: TwitterMedia[];
    tweets?: TwitterTweet[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
    previous_token?: string;
    newest_id?: string;
    oldest_id?: string;
  };
  errors?: Array<{
    title: string;
    detail: string;
    type: string;
  }>;
}

export class TwitterService extends BasePlatformService {
  private streamConnection?: any;

  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: 'https://api.twitter.com/2',
      apiVersion: '2',
      rateLimit: {
        requests: 300, // 300 requests per 15-minute window
        windowMs: 15 * 60 * 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
      },
    };

    super(SocialPlatform.TWITTER, platformConfig);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.httpClient.post('/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
        client_id: config.platformAPIs.twitter.clientId,
        client_secret: config.platformAPIs.twitter.clientSecret,
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
      throw new Error('Failed to refresh Twitter access token');
    }
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<TwitterResponse<TwitterUser>>({
        method: 'GET',
        url: '/users/me',
        params: {
          'user.fields': 'id,name,username,description,profile_image_url,verified,verified_type,public_metrics,location,url,created_at',
        },
      }, 'profile');

      if (response.success && response.data?.data) {
        const profile = this.transformProfile(response.data.data);
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
        error: 'Failed to fetch Twitter profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    limit?: number;
    since?: Date;
    until?: Date;
    includeReplies?: boolean;
    includeRetweets?: boolean;
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        'tweet.fields': 'id,text,created_at,author_id,public_metrics,attachments,context_annotations,entities,referenced_tweets',
        'user.fields': 'id,name,username,profile_image_url,verified',
        'media.fields': 'media_key,type,url,preview_image_url,public_metrics,width,height',
        'expansions': 'author_id,attachments.media_keys,referenced_tweets.id',
        'max_results': Math.min(options.limit || 10, 100),
      };

      if (options.since) {
        params.start_time = options.since.toISOString();
      }

      if (options.until) {
        params.end_time = options.until.toISOString();
      }

      if (!options.includeReplies) {
        params.exclude = 'replies';
      }

      if (!options.includeRetweets) {
        params.exclude = params.exclude ? `${params.exclude},retweets` : 'retweets';
      }

      const response = await this.makeRequest<TwitterResponse<TwitterTweet[]>>({
        method: 'GET',
        url: '/users/me/tweets',
        params,
      }, 'content');

      if (response.success && response.data?.data) {
        const tweets = response.data.data.map(tweet => 
          this.transformContent(tweet, response.data?.includes)
        );
        return {
          success: true,
          data: tweets,
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
        error: 'Failed to fetch Twitter content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      replyToId?: string;
      mediaIds?: string[];
      pollOptions?: string[];
      pollDurationMinutes?: number;
    } = {}
  ): Promise<PlatformResponse<any>> {
    try {
      const tweetData: any = {
        text: content,
      };

      if (options.replyToId) {
        tweetData.reply = {
          in_reply_to_tweet_id: options.replyToId,
        };
      }

      if (options.mediaIds && options.mediaIds.length > 0) {
        tweetData.media = {
          media_ids: options.mediaIds,
        };
      }

      if (options.pollOptions && options.pollOptions.length >= 2) {
        tweetData.poll = {
          options: options.pollOptions.slice(0, 4), // Max 4 poll options
          duration_minutes: options.pollDurationMinutes || 1440, // Default 24 hours
        };
      }

      const response = await this.makeRequest({
        method: 'POST',
        url: '/tweets',
        data: tweetData,
      }, 'post');

      this.logActivity('Content posted', { contentLength: content.length });
      return response;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to Twitter',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      type?: 'recent' | 'popular' | 'mixed';
      limit?: number;
      lang?: string;
      resultType?: 'recent' | 'popular';
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        query: query,
        'tweet.fields': 'id,text,created_at,author_id,public_metrics,attachments,context_annotations,entities',
        'user.fields': 'id,name,username,profile_image_url,verified',
        'media.fields': 'media_key,type,url,preview_image_url,public_metrics,width,height',
        'expansions': 'author_id,attachments.media_keys',
        'max_results': Math.min(options.limit || 10, 100),
      };

      if (options.lang) {
        params.lang = options.lang;
      }

      const response = await this.makeRequest<TwitterResponse<TwitterTweet[]>>({
        method: 'GET',
        url: '/tweets/search/recent',
        params,
      }, 'search');

      if (response.success && response.data?.data) {
        const tweets = response.data.data.map(tweet => 
          this.transformContent(tweet, response.data?.includes)
        );
        return {
          success: true,
          data: tweets,
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
        error: 'Failed to search Twitter content',
        platform: this.platform,
      };
    }
  }

  /**
   * Start real-time streaming of tweets
   */
  async startStream(rules: Array<{ value: string; tag?: string }>): Promise<void> {
    try {
      // First, set up stream rules
      await this.setStreamRules(rules);

      // Start the stream
      const response = await this.httpClient.get('/tweets/search/stream', {
        params: {
          'tweet.fields': 'id,text,created_at,author_id,public_metrics,entities',
          'user.fields': 'id,name,username,profile_image_url,verified',
          'expansions': 'author_id',
        },
        responseType: 'stream',
      });

      this.streamConnection = response.data;
      
      this.streamConnection.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.data) {
              const content = this.transformContent(data.data, data.includes);
              // Emit via WebSocket or event system
              this.logActivity('Stream content received', { tweetId: data.data.id });
            }
          } catch (parseError) {
            // Ignore parse errors for heartbeat messages
          }
        }
      });

      this.streamConnection.on('error', (error: any) => {
        this.logActivity('Stream error', error);
      });

      this.logActivity('Stream started');
    } catch (error) {
      this.logActivity('Start stream failed', error);
      throw new Error('Failed to start Twitter stream');
    }
  }

  /**
   * Stop real-time streaming
   */
  async stopStream(): Promise<void> {
    if (this.streamConnection) {
      this.streamConnection.destroy();
      this.streamConnection = undefined;
      this.logActivity('Stream stopped');
    }
  }

  private async setStreamRules(rules: Array<{ value: string; tag?: string }>): Promise<void> {
    try {
      // Delete existing rules first
      const existingRules = await this.httpClient.get('/tweets/search/stream/rules');
      if (existingRules.data?.data) {
        await this.httpClient.post('/tweets/search/stream/rules', {
          delete: {
            ids: existingRules.data.data.map((rule: any) => rule.id),
          },
        });
      }

      // Add new rules
      if (rules.length > 0) {
        await this.httpClient.post('/tweets/search/stream/rules', {
          add: rules,
        });
      }
    } catch (error) {
      this.logActivity('Set stream rules failed', error);
      throw new Error('Failed to set Twitter stream rules');
    }
  }

  protected transformContent(tweet: TwitterTweet, includes?: any): SocialContent {
    const author = includes?.users?.find((user: TwitterUser) => user.id === tweet.author_id);
    const media = includes?.media || [];

    const content: SocialContent = {
      id: `twitter_${tweet.id}`,
      platform: SocialPlatform.TWITTER,
      externalId: tweet.id,
      author: {
        id: tweet.author_id,
        username: author?.username || 'unknown',
        displayName: author?.name || 'Unknown User',
        avatar: author?.profile_image_url,
      },
      content: {
        text: tweet.text,
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: tweet.public_metrics.like_count,
        shares: tweet.public_metrics.retweet_count + tweet.public_metrics.quote_count,
        comments: tweet.public_metrics.reply_count,
        views: tweet.public_metrics.impression_count || 0,
        engagement: tweet.public_metrics.like_count + 
                   tweet.public_metrics.retweet_count + 
                   tweet.public_metrics.reply_count + 
                   tweet.public_metrics.quote_count,
      },
      hashtags: tweet.entities?.hashtags?.map(tag => tag.tag.toLowerCase()) || [],
      mentions: tweet.entities?.mentions?.map(mention => mention.username.toLowerCase()) || [],
      postedAt: new Date(tweet.created_at),
      fetchedAt: new Date(),
    };

    // Process media attachments
    if (tweet.attachments?.media_keys) {
      tweet.attachments.media_keys.forEach(mediaKey => {
        const mediaItem = media.find((m: TwitterMedia) => m.media_key === mediaKey);
        if (mediaItem) {
          if (mediaItem.type === 'photo' && mediaItem.url) {
            content.content.images?.push(mediaItem.url);
          } else if (['video', 'animated_gif'].includes(mediaItem.type) && mediaItem.preview_image_url) {
            content.content.videos?.push(mediaItem.preview_image_url);
          }
        }
      });
    }

    // Process URLs
    if (tweet.entities?.urls) {
      tweet.entities.urls.forEach(url => {
        content.content.links?.push(url.expanded_url);
      });
    }

    return content;
  }

  protected transformProfile(user: TwitterUser): PlatformProfile {
    return {
      platformUserId: user.id,
      username: user.username,
      displayName: user.name,
      avatar: user.profile_image_url,
      bio: user.description,
      followerCount: user.public_metrics.followers_count,
      followingCount: user.public_metrics.following_count,
      verified: user.verified || user.verified_type !== undefined,
      metadata: {
        location: user.location,
        url: user.url,
        tweetCount: user.public_metrics.tweet_count,
        listedCount: user.public_metrics.listed_count,
        verifiedType: user.verified_type,
        createdAt: user.created_at,
        platform: 'twitter',
      },
    };
  }
}