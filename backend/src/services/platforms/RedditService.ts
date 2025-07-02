import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface RedditPost {
  id: string;
  name: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  is_video: boolean;
  is_self: boolean;
  thumbnail?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
      resolutions: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    }>;
  };
  media?: {
    reddit_video?: {
      bitrate_kbps: number;
      fallback_url: string;
      height: number;
      width: number;
      scrubber_media_url: string;
      dash_url: string;
      duration: number;
      hls_url: string;
      is_gif: boolean;
      transcoding_status: string;
    };
  };
  crosspost_parent_list?: RedditPost[];
  distinguished?: 'moderator' | 'admin' | null;
  stickied: boolean;
  locked: boolean;
  over_18: boolean;
  spoiler: boolean;
  link_flair_text?: string;
  author_flair_text?: string;
}

interface RedditComment {
  id: string;
  name: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  permalink: string;
  parent_id: string;
  replies?: {
    data: {
      children: Array<{
        data: RedditComment;
      }>;
    };
  };
  distinguished?: 'moderator' | 'admin' | null;
  stickied: boolean;
  is_submitter: boolean;
  author_flair_text?: string;
}

interface RedditUser {
  id: string;
  name: string;
  icon_img: string;
  created_utc: number;
  comment_karma: number;
  link_karma: number;
  total_karma: number;
  is_employee: boolean;
  is_mod: boolean;
  is_gold: boolean;
  verified: boolean;
  has_verified_email: boolean;
  subreddit?: {
    display_name: string;
    title: string;
    public_description: string;
    subscribers: number;
    icon_img: string;
    banner_img: string;
  };
}

interface RedditSubreddit {
  id: string;
  name: string;
  display_name: string;
  display_name_prefixed: string;
  title: string;
  description: string;
  public_description: string;
  subscribers: number;
  active_user_count: number;
  created_utc: number;
  icon_img: string;
  banner_img: string;
  header_img: string;
  primary_color: string;
  key_color: string;
  over18: boolean;
  lang: string;
  quarantine: boolean;
  subreddit_type: 'public' | 'private' | 'restricted';
  user_is_subscriber: boolean;
  user_is_moderator: boolean;
}

interface RedditResponse<T> {
  data: {
    children: Array<{
      kind: string;
      data: T;
    }>;
    after?: string;
    before?: string;
    dist?: number;
    modhash?: string;
  };
}

export class RedditService extends BasePlatformService {
  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: 'https://oauth.reddit.com',
      apiVersion: 'v1',
      rateLimit: {
        requests: 60, // 60 requests per minute
        windowMs: 60 * 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 2000,
      },
    };

    super(SocialPlatform.REDDIT, platformConfig);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Reddit uses Basic auth for token refresh
      const auth = Buffer.from(
        `${config.platformAPIs.reddit.clientId}:${config.platformAPIs.reddit.clientSecret}`
      ).toString('base64');

      const response = await this.httpClient.post('https://www.reddit.com/api/v1/access_token', 
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
        }), {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.credentials.accessToken = response.data.access_token;
      if (response.data.expires_in) {
        this.credentials.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      }

      this.logActivity('Token refreshed');
    } catch (error) {
      this.logActivity('Token refresh failed', error);
      throw new Error('Failed to refresh Reddit access token');
    }
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<RedditUser>({
        method: 'GET',
        url: '/api/v1/me',
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
        error: 'Failed to fetch Reddit profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    subreddit?: string;
    sort?: 'hot' | 'new' | 'rising' | 'top';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    after?: string;
    before?: string;
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const subreddit = options.subreddit || 'all';
      const sort = options.sort || 'hot';
      
      const params: any = {
        limit: Math.min(options.limit || 25, 100),
        raw_json: 1,
      };

      if (options.after) params.after = options.after;
      if (options.before) params.before = options.before;
      if (options.time && sort === 'top') params.t = options.time;

      const response = await this.makeRequest<RedditResponse<RedditPost>>({
        method: 'GET',
        url: `/r/${subreddit}/${sort}`,
        params,
      }, 'content');

      if (response.success && response.data?.data?.children) {
        const posts = response.data.data.children
          .filter(child => child.kind === 't3') // Only posts, not comments
          .map(child => this.transformContent(child.data));
        
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
        error: 'Failed to fetch Reddit content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      subreddit: string;
      title: string;
      kind?: 'self' | 'link';
      url?: string;
      flair_id?: string;
      flair_text?: string;
      nsfw?: boolean;
      spoiler?: boolean;
      resubmit?: boolean;
      send_replies?: boolean;
    }
  ): Promise<PlatformResponse<any>> {
    try {
      const data: any = {
        sr: options.subreddit,
        title: options.title,
        kind: options.kind || 'self',
        api_type: 'json',
        resubmit: options.resubmit ?? true,
        send_replies: options.send_replies ?? true,
      };

      if (options.kind === 'self' || !options.kind) {
        data.text = content;
      } else if (options.kind === 'link') {
        data.url = options.url || content;
      }

      if (options.flair_id) data.flair_id = options.flair_id;
      if (options.flair_text) data.flair_text = options.flair_text;
      if (options.nsfw) data.nsfw = true;
      if (options.spoiler) data.spoiler = true;

      const response = await this.makeRequest({
        method: 'POST',
        url: '/api/submit',
        data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }, 'post');

      this.logActivity('Content posted', { 
        contentLength: content.length, 
        subreddit: options.subreddit,
        title: options.title,
      });
      return response;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to Reddit',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      subreddit?: string;
      sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
      time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
      limit?: number;
      type?: 'link' | 'user' | 'sr';
      after?: string;
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        q: query,
        sort: options.sort || 'relevance',
        limit: Math.min(options.limit || 25, 100),
        raw_json: 1,
        type: options.type || 'link',
      };

      if (options.time && options.sort === 'top') params.t = options.time;
      if (options.after) params.after = options.after;
      if (options.subreddit) params.restrict_sr = true;

      const endpoint = options.subreddit ? 
        `/r/${options.subreddit}/search` : 
        '/search';

      const response = await this.makeRequest<RedditResponse<RedditPost>>({
        method: 'GET',
        url: endpoint,
        params,
      }, 'search');

      if (response.success && response.data?.data?.children) {
        const posts = response.data.data.children
          .filter(child => child.kind === 't3')
          .map(child => this.transformContent(child.data));
        
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
        error: 'Failed to search Reddit content',
        platform: this.platform,
      };
    }
  }

  /**
   * Get comments for a specific post
   */
  async getPostComments(
    postId: string,
    options: {
      sort?: 'confidence' | 'top' | 'new' | 'controversial' | 'old' | 'random' | 'qa' | 'live';
      limit?: number;
      depth?: number;
    } = {}
  ): Promise<PlatformResponse<any[]>> {
    try {
      const params: any = {
        sort: options.sort || 'confidence',
        limit: Math.min(options.limit || 100, 500),
        raw_json: 1,
      };

      if (options.depth) params.depth = Math.min(options.depth, 10);

      const response = await this.makeRequest<RedditResponse<RedditComment>[]>({
        method: 'GET',
        url: `/comments/${postId}`,
        params,
      }, 'comments');

      if (response.success && response.data && Array.isArray(response.data)) {
        // Reddit returns [post, comments] array
        const commentsData = response.data[1];
        if (commentsData?.data?.children) {
          const comments = commentsData.data.children
            .filter((child: any) => child.kind === 't1')
            .map((child: any) => this.transformComment(child.data));
          
          return {
            success: true,
            data: comments,
            rateLimit: response.rateLimit,
            platform: this.platform,
          };
        }
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch comments',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get post comments failed', error);
      return {
        success: false,
        error: 'Failed to fetch Reddit post comments',
        platform: this.platform,
      };
    }
  }

  /**
   * Get information about a subreddit
   */
  async getSubredditInfo(subreddit: string): Promise<PlatformResponse<RedditSubreddit>> {
    try {
      const response = await this.makeRequest<{
        data: RedditSubreddit;
      }>({
        method: 'GET',
        url: `/r/${subreddit}/about`,
        params: {
          raw_json: 1,
        },
      }, 'subreddit_info');

      if (response.success && response.data?.data) {
        return {
          success: true,
          data: response.data.data,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch subreddit info',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get subreddit info failed', error);
      return {
        success: false,
        error: 'Failed to fetch Reddit subreddit info',
        platform: this.platform,
      };
    }
  }

  /**
   * Subscribe or unsubscribe from a subreddit
   */
  async toggleSubredditSubscription(
    subreddit: string, 
    action: 'sub' | 'unsub'
  ): Promise<PlatformResponse<any>> {
    try {
      const response = await this.makeRequest({
        method: 'POST',
        url: '/api/subscribe',
        data: {
          action,
          sr_name: subreddit,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }, 'subscription');

      return response;
    } catch (error) {
      this.logActivity('Toggle subscription failed', error);
      return {
        success: false,
        error: 'Failed to toggle Reddit subscription',
        platform: this.platform,
      };
    }
  }

  protected transformContent(post: RedditPost): SocialContent {
    const content: SocialContent = {
      id: `reddit_${post.id}`,
      platform: SocialPlatform.REDDIT,
      externalId: post.id,
      author: {
        id: post.author,
        username: post.author,
        displayName: post.author,
        avatar: undefined,
      },
      content: {
        text: `${post.title}\n\n${post.selftext}`,
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: post.score,
        shares: 0, // Reddit doesn't have shares
        comments: post.num_comments,
        views: 0, // Reddit doesn't provide view count via API
        engagement: post.score + post.num_comments,
      },
      hashtags: [], // Reddit doesn't have hashtags
      mentions: this.extractMentions(post.selftext + ' ' + post.title),
      postedAt: new Date(post.created_utc * 1000),
      fetchedAt: new Date(),
    };

    // Add the Reddit post URL
    content.content.links?.push(`https://reddit.com${post.permalink}`);
    
    // Add original URL if it's a link post
    if (!post.is_self && post.url && !post.url.includes('reddit.com')) {
      content.content.links?.push(post.url);
    }

    // Add images from preview
    if (post.preview?.images) {
      post.preview.images.forEach(image => {
        if (image.source?.url) {
          const decodedUrl = decodeURIComponent(image.source.url);
          content.content.images?.push(decodedUrl);
        }
      });
    }

    // Add video if present
    if (post.media?.reddit_video) {
      content.content.videos?.push(post.media.reddit_video.fallback_url);
    }

    // Add thumbnail if available and not default
    if (post.thumbnail && 
        !['self', 'default', 'nsfw', 'spoiler'].includes(post.thumbnail) &&
        post.thumbnail.startsWith('http')) {
      content.content.images?.push(post.thumbnail);
    }

    return content;
  }

  protected transformProfile(user: RedditUser): PlatformProfile {
    return {
      platformUserId: user.id,
      username: user.name,
      displayName: user.name,
      avatar: user.icon_img,
      bio: user.subreddit?.public_description,
      followerCount: user.subreddit?.subscribers,
      followingCount: undefined,
      verified: user.verified,
      metadata: {
        commentKarma: user.comment_karma,
        linkKarma: user.link_karma,
        totalKarma: user.total_karma,
        isEmployee: user.is_employee,
        isMod: user.is_mod,
        isGold: user.is_gold,
        hasVerifiedEmail: user.has_verified_email,
        createdAt: new Date(user.created_utc * 1000).toISOString(),
        subreddit: user.subreddit,
        platform: 'reddit',
      },
    };
  }

  private transformComment(comment: RedditComment): any {
    return {
      id: `reddit_comment_${comment.id}`,
      platform: SocialPlatform.REDDIT,
      externalId: comment.id,
      author: {
        id: comment.author,
        username: comment.author,
        displayName: comment.author,
      },
      content: {
        text: comment.body,
      },
      metrics: {
        likes: comment.score,
        shares: 0,
        comments: 0,
        views: 0,
        engagement: comment.score,
      },
      parentId: comment.parent_id,
      isSubmitter: comment.is_submitter,
      distinguished: comment.distinguished,
      stickied: comment.stickied,
      postedAt: new Date(comment.created_utc * 1000),
      fetchedAt: new Date(),
    };
  }

  private extractMentions(text: string): string[] {
    // Reddit uses /u/username format
    const mentions = text.match(/\/u\/[\w-]+/g) || [];
    return mentions.map(mention => mention.substring(3).toLowerCase());
  }
}