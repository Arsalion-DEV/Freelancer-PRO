import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
  like_count?: number;
  comments_count?: number;
  children?: {
    data: Array<{
      id: string;
      media_type: 'IMAGE' | 'VIDEO';
      media_url: string;
      thumbnail_url?: string;
    }>;
  };
}

interface InstagramUser {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL';
  media_count?: number;
  followers_count?: number;
  follows_count?: number;
  name?: string;
  biography?: string;
  website?: string;
  profile_picture_url?: string;
}

interface InstagramStory {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
}

interface InstagramInsight {
  name: string;
  period: 'day' | 'week' | 'days_28' | 'lifetime';
  values: Array<{
    value: number;
    end_time?: string;
  }>;
  title: string;
  description: string;
}

export class InstagramService extends BasePlatformService {
  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: 'https://graph.instagram.com',
      apiVersion: 'v18.0',
      rateLimit: {
        requests: 200, // 200 requests per hour
        windowMs: 60 * 60 * 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1500,
      },
    };

    super(SocialPlatform.INSTAGRAM, platformConfig);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Instagram uses Facebook's token refresh endpoint
      const response = await this.httpClient.get('/refresh_access_token', {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: this.credentials.accessToken,
        },
      });

      this.credentials.accessToken = response.data.access_token;
      if (response.data.expires_in) {
        this.credentials.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      }

      this.logActivity('Token refreshed');
    } catch (error) {
      this.logActivity('Token refresh failed', error);
      throw new Error('Failed to refresh Instagram access token');
    }
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<InstagramUser>({
        method: 'GET',
        url: '/me',
        params: {
          fields: 'id,username,account_type,media_count,followers_count,follows_count,name,biography,website,profile_picture_url',
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
        error: 'Failed to fetch Instagram profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    limit?: number;
    before?: string;
    after?: string;
    since?: Date;
    until?: Date;
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}',
        limit: Math.min(options.limit || 25, 100),
      };

      if (options.before) params.before = options.before;
      if (options.after) params.after = options.after;
      if (options.since) params.since = Math.floor(options.since.getTime() / 1000);
      if (options.until) params.until = Math.floor(options.until.getTime() / 1000);

      const response = await this.makeRequest<{
        data: InstagramMedia[];
        paging?: {
          cursors?: {
            before: string;
            after: string;
          };
          next?: string;
          previous?: string;
        };
      }>({
        method: 'GET',
        url: '/me/media',
        params,
      }, 'content');

      if (response.success && response.data?.data) {
        const posts = response.data.data.map(media => this.transformContent(media));
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
        error: 'Failed to fetch Instagram content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      imageUrl?: string;
      videoUrl?: string;
      mediaUrls?: string[];
      locationId?: string;
      userTags?: Array<{ username: string; x: number; y: number }>;
      isStory?: boolean;
    } = {}
  ): Promise<PlatformResponse<any>> {
    try {
      // Instagram requires a two-step process: create media container, then publish
      let mediaContainerResponse;

      if (options.mediaUrls && options.mediaUrls.length > 1) {
        // Carousel post
        mediaContainerResponse = await this.createCarouselPost(content, options.mediaUrls, options);
      } else if (options.videoUrl) {
        // Video post
        mediaContainerResponse = await this.createVideoPost(content, options.videoUrl, options);
      } else if (options.imageUrl) {
        // Image post
        mediaContainerResponse = await this.createImagePost(content, options.imageUrl, options);
      } else {
        throw new Error('No media provided for Instagram post');
      }

      if (!mediaContainerResponse.success || !mediaContainerResponse.data?.id) {
        return {
          success: false,
          error: 'Failed to create media container',
          platform: this.platform,
        };
      }

      // Publish the media container
      const publishResponse = await this.makeRequest({
        method: 'POST',
        url: '/me/media_publish',
        data: {
          creation_id: mediaContainerResponse.data.id,
        },
      }, 'publish');

      this.logActivity('Content posted', { contentLength: content.length, mediaType: 'instagram' });
      return publishResponse;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to Instagram',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      type?: 'hashtag' | 'user';
      limit?: number;
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      if (options.type === 'hashtag') {
        return await this.searchByHashtag(query, options);
      } else {
        // Instagram Basic Display API doesn't support user search
        // This would require Instagram Graph API (business accounts)
        return {
          success: false,
          error: 'User search not available with Instagram Basic Display API',
          platform: this.platform,
        };
      }
    } catch (error) {
      this.logActivity('Search content failed', error);
      return {
        success: false,
        error: 'Failed to search Instagram content',
        platform: this.platform,
      };
    }
  }

  /**
   * Get Instagram Stories
   */
  async getStories(): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const response = await this.makeRequest<{
        data: InstagramStory[];
      }>({
        method: 'GET',
        url: '/me/stories',
        params: {
          fields: 'id,media_type,media_url,permalink,thumbnail_url,timestamp',
        },
      }, 'stories');

      if (response.success && response.data?.data) {
        const stories = response.data.data.map(story => this.transformStory(story));
        return {
          success: true,
          data: stories,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch stories',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get stories failed', error);
      return {
        success: false,
        error: 'Failed to fetch Instagram stories',
        platform: this.platform,
      };
    }
  }

  /**
   * Get Instagram Insights (requires business account)
   */
  async getInsights(mediaId: string, metrics: string[]): Promise<PlatformResponse<InstagramInsight[]>> {
    try {
      const response = await this.makeRequest<{
        data: InstagramInsight[];
      }>({
        method: 'GET',
        url: `/${mediaId}/insights`,
        params: {
          metric: metrics.join(','),
        },
      }, 'insights');

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
        error: response.error || 'Failed to fetch insights',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get insights failed', error);
      return {
        success: false,
        error: 'Failed to fetch Instagram insights',
        platform: this.platform,
      };
    }
  }

  private async createImagePost(
    caption: string,
    imageUrl: string,
    options: {
      locationId?: string;
      userTags?: Array<{ username: string; x: number; y: number }>;
    }
  ): Promise<PlatformResponse<any>> {
    const data: any = {
      image_url: imageUrl,
      caption: caption,
      media_type: 'IMAGE',
    };

    if (options.locationId) {
      data.location_id = options.locationId;
    }

    if (options.userTags && options.userTags.length > 0) {
      data.user_tags = options.userTags;
    }

    return await this.makeRequest({
      method: 'POST',
      url: '/me/media',
      data,
    }, 'create_media');
  }

  private async createVideoPost(
    caption: string,
    videoUrl: string,
    options: {
      locationId?: string;
      userTags?: Array<{ username: string; x: number; y: number }>;
    }
  ): Promise<PlatformResponse<any>> {
    const data: any = {
      video_url: videoUrl,
      caption: caption,
      media_type: 'VIDEO',
    };

    if (options.locationId) {
      data.location_id = options.locationId;
    }

    if (options.userTags && options.userTags.length > 0) {
      data.user_tags = options.userTags;
    }

    return await this.makeRequest({
      method: 'POST',
      url: '/me/media',
      data,
    }, 'create_media');
  }

  private async createCarouselPost(
    caption: string,
    mediaUrls: string[],
    options: {
      locationId?: string;
      userTags?: Array<{ username: string; x: number; y: number }>;
    }
  ): Promise<PlatformResponse<any>> {
    // First create individual media items
    const mediaItems = [];
    for (const mediaUrl of mediaUrls.slice(0, 10)) { // Max 10 items
      const mediaType = this.detectMediaType(mediaUrl);
      const mediaData: any = {
        media_type: mediaType,
        [mediaType === 'IMAGE' ? 'image_url' : 'video_url']: mediaUrl,
        is_carousel_item: true,
      };

      const mediaResponse = await this.makeRequest({
        method: 'POST',
        url: '/me/media',
        data: mediaData,
      }, 'create_carousel_item');

      if (mediaResponse.success && mediaResponse.data?.id) {
        mediaItems.push(mediaResponse.data.id);
      }
    }

    // Create carousel container
    const data: any = {
      media_type: 'CAROUSEL',
      caption: caption,
      children: mediaItems.join(','),
    };

    if (options.locationId) {
      data.location_id = options.locationId;
    }

    return await this.makeRequest({
      method: 'POST',
      url: '/me/media',
      data,
    }, 'create_carousel');
  }

  private async searchByHashtag(hashtag: string, options: { limit?: number }): Promise<PlatformResponse<SocialContent[]>> {
    try {
      // First get the hashtag ID
      const hashtagResponse = await this.makeRequest<{
        data: Array<{ id: string; name: string }>;
      }>({
        method: 'GET',
        url: '/ig_hashtag_search',
        params: {
          user_id: await this.getCurrentUserId(),
          q: hashtag,
        },
      }, 'hashtag_search');

      if (!hashtagResponse.success || !hashtagResponse.data?.data?.[0]?.id) {
        return {
          success: false,
          error: 'Hashtag not found',
          platform: this.platform,
        };
      }

      const hashtagId = hashtagResponse.data.data[0].id;

      // Get recent media for the hashtag
      const mediaResponse = await this.makeRequest<{
        data: InstagramMedia[];
      }>({
        method: 'GET',
        url: `/${hashtagId}/recent_media`,
        params: {
          user_id: await this.getCurrentUserId(),
          fields: 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count',
          limit: Math.min(options.limit || 25, 50),
        },
      }, 'hashtag_media');

      if (mediaResponse.success && mediaResponse.data?.data) {
        const posts = mediaResponse.data.data.map(media => this.transformContent(media));
        return {
          success: true,
          data: posts,
          rateLimit: mediaResponse.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: mediaResponse.error || 'Failed to fetch hashtag media',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Search by hashtag failed', error);
      return {
        success: false,
        error: 'Failed to search hashtag on Instagram',
        platform: this.platform,
      };
    }
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const response = await this.httpClient.get('/me?fields=id');
      return response.data.id;
    } catch (error) {
      throw new Error('Failed to get current user ID');
    }
  }

  private detectMediaType(url: string): 'IMAGE' | 'VIDEO' {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) ? 'VIDEO' : 'IMAGE';
  }

  protected transformContent(media: InstagramMedia): SocialContent {
    const content: SocialContent = {
      id: `instagram_${media.id}`,
      platform: SocialPlatform.INSTAGRAM,
      externalId: media.id,
      author: {
        id: media.username,
        username: media.username,
        displayName: media.username,
        avatar: undefined,
      },
      content: {
        text: media.caption || '',
        images: [],
        videos: [],
        links: [media.permalink],
      },
      metrics: {
        likes: media.like_count || 0,
        shares: 0, // Instagram doesn't provide share count via API
        comments: media.comments_count || 0,
        views: 0, // Would need insights API for view count
        engagement: (media.like_count || 0) + (media.comments_count || 0),
      },
      hashtags: this.extractHashtags(media.caption || ''),
      mentions: this.extractMentions(media.caption || ''),
      postedAt: new Date(media.timestamp),
      fetchedAt: new Date(),
    };

    // Add media URLs based on type
    if (media.media_type === 'IMAGE') {
      content.content.images?.push(media.media_url);
    } else if (media.media_type === 'VIDEO') {
      content.content.videos?.push(media.media_url);
      if (media.thumbnail_url) {
        content.content.images?.push(media.thumbnail_url);
      }
    } else if (media.media_type === 'CAROUSEL_ALBUM' && media.children?.data) {
      media.children.data.forEach(child => {
        if (child.media_type === 'IMAGE') {
          content.content.images?.push(child.media_url);
        } else if (child.media_type === 'VIDEO') {
          content.content.videos?.push(child.media_url);
          if (child.thumbnail_url) {
            content.content.images?.push(child.thumbnail_url);
          }
        }
      });
    }

    return content;
  }

  protected transformProfile(user: InstagramUser): PlatformProfile {
    return {
      platformUserId: user.id,
      username: user.username,
      displayName: user.name || user.username,
      avatar: user.profile_picture_url,
      bio: user.biography,
      followerCount: user.followers_count,
      followingCount: user.follows_count,
      verified: false, // Instagram doesn't provide verification status via API
      metadata: {
        accountType: user.account_type,
        mediaCount: user.media_count,
        website: user.website,
        platform: 'instagram',
      },
    };
  }

  private transformStory(story: InstagramStory): SocialContent {
    return {
      id: `instagram_story_${story.id}`,
      platform: SocialPlatform.INSTAGRAM,
      externalId: story.id,
      author: {
        id: 'me',
        username: 'me',
        displayName: 'Me',
        avatar: undefined,
      },
      content: {
        text: '',
        images: story.media_type === 'IMAGE' ? [story.media_url] : story.thumbnail_url ? [story.thumbnail_url] : [],
        videos: story.media_type === 'VIDEO' ? [story.media_url] : [],
        links: [story.permalink],
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
      postedAt: new Date(story.timestamp),
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