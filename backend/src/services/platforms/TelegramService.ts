import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  inline_query?: TelegramInlineQuery;
  chosen_inline_result?: TelegramChosenInlineResult;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  forward_from?: TelegramUser;
  forward_from_chat?: TelegramChat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_sender_name?: string;
  forward_date?: number;
  reply_to_message?: TelegramMessage;
  via_bot?: TelegramUser;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
  entities?: TelegramMessageEntity[];
  caption_entities?: TelegramMessageEntity[];
  audio?: TelegramAudio;
  document?: TelegramDocument;
  animation?: TelegramAnimation;
  game?: TelegramGame;
  photo?: TelegramPhotoSize[];
  sticker?: TelegramSticker;
  video?: TelegramVideo;
  video_note?: TelegramVideoNote;
  voice?: TelegramVoice;
  caption?: string;
  contact?: TelegramContact;
  location?: TelegramLocation;
  venue?: TelegramVenue;
  poll?: TelegramPoll;
  dice?: TelegramDice;
  new_chat_members?: TelegramUser[];
  left_chat_member?: TelegramUser;
  new_chat_title?: string;
  new_chat_photo?: TelegramPhotoSize[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  supergroup_chat_created?: boolean;
  channel_chat_created?: boolean;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: TelegramMessage;
  invoice?: TelegramInvoice;
  successful_payment?: TelegramSuccessfulPayment;
  connected_website?: string;
  passport_data?: TelegramPassportData;
  proximity_alert_triggered?: TelegramProximityAlertTriggered;
  reply_markup?: TelegramInlineKeyboardMarkup;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo?: TelegramChatPhoto;
  bio?: string;
  description?: string;
  invite_link?: string;
  pinned_message?: TelegramMessage;
  permissions?: TelegramChatPermissions;
  slow_mode_delay?: number;
  message_auto_delete_time?: number;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
  linked_chat_id?: number;
  location?: TelegramChatLocation;
}

interface TelegramMessageEntity {
  type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code' | 'pre' | 'text_link' | 'text_mention';
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
}

interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
  thumb?: TelegramPhotoSize;
}

interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  thumb?: TelegramPhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramVideo {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumb?: TelegramPhotoSize;
  mime_type?: string;
  file_size?: number;
}

interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
  chat_type?: 'private' | 'group' | 'supergroup' | 'channel';
  location?: TelegramLocation;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

interface TelegramChosenInlineResult {
  result_id: string;
  from: TelegramUser;
  location?: TelegramLocation;
  inline_message_id?: string;
  query: string;
}

interface TelegramChatPhoto {
  small_file_id: string;
  small_file_unique_id: string;
  big_file_id: string;
  big_file_unique_id: string;
}

interface TelegramChatPermissions {
  can_send_messages?: boolean;
  can_send_media_messages?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
}

interface TelegramChatLocation {
  location: TelegramLocation;
  address: string;
}

interface TelegramLocation {
  longitude: number;
  latitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
  heading?: number;
  proximity_alert_radius?: number;
}

interface TelegramVenue {
  location: TelegramLocation;
  title: string;
  address: string;
  foursquare_id?: string;
  foursquare_type?: string;
  google_place_id?: string;
  google_place_type?: string;
}

interface TelegramPoll {
  id: string;
  question: string;
  options: TelegramPollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type: 'regular' | 'quiz';
  allows_multiple_answers: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_entities?: TelegramMessageEntity[];
  open_period?: number;
  close_date?: number;
}

interface TelegramPollOption {
  text: string;
  voter_count: number;
}

interface TelegramDice {
  emoji: string;
  value: number;
}

interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: TelegramWebApp;
  login_url?: TelegramLoginUrl;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  callback_game?: TelegramCallbackGame;
  pay?: boolean;
}

interface TelegramWebApp {
  url: string;
}

interface TelegramLoginUrl {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access?: boolean;
}

interface TelegramCallbackGame {}

interface TelegramSticker {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  thumb?: TelegramPhotoSize;
  emoji?: string;
  set_name?: string;
  mask_position?: TelegramMaskPosition;
  file_size?: number;
}

interface TelegramMaskPosition {
  point: string;
  x_shift: number;
  y_shift: number;
  scale: number;
}

interface TelegramVideoNote {
  file_id: string;
  file_unique_id: string;
  length: number;
  duration: number;
  thumb?: TelegramPhotoSize;
  file_size?: number;
}

interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

interface TelegramAnimation {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumb?: TelegramPhotoSize;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramGame {
  title: string;
  description: string;
  photo: TelegramPhotoSize[];
  text?: string;
  text_entities?: TelegramMessageEntity[];
  animation?: TelegramAnimation;
}

interface TelegramInvoice {
  title: string;
  description: string;
  start_parameter: string;
  currency: string;
  total_amount: number;
}

interface TelegramSuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  shipping_option_id?: string;
  order_info?: TelegramOrderInfo;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

interface TelegramOrderInfo {
  name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: TelegramShippingAddress;
}

interface TelegramShippingAddress {
  country_code: string;
  state: string;
  city: string;
  street_line1: string;
  street_line2: string;
  post_code: string;
}

interface TelegramPassportData {
  data: TelegramEncryptedPassportElement[];
  credentials: TelegramEncryptedCredentials;
}

interface TelegramEncryptedPassportElement {
  type: string;
  data?: string;
  phone_number?: string;
  email?: string;
  files?: TelegramPassportFile[];
  front_side?: TelegramPassportFile;
  reverse_side?: TelegramPassportFile;
  selfie?: TelegramPassportFile;
  translation?: TelegramPassportFile[];
  hash: string;
}

interface TelegramPassportFile {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  file_date: number;
}

interface TelegramEncryptedCredentials {
  data: string;
  hash: string;
  secret: string;
}

interface TelegramProximityAlertTriggered {
  traveler: TelegramUser;
  watcher: TelegramUser;
  distance: number;
}

export class TelegramService extends BasePlatformService {
  private webhookUrl?: string;
  private botToken: string;
  private lastUpdateId: number = 0;

  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: 'https://api.telegram.org',
      apiVersion: 'bot',
      rateLimit: {
        requests: 30, // 30 requests per second
        windowMs: 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
      },
    };

    super(SocialPlatform.TELEGRAM, platformConfig);
    this.botToken = config.platformAPIs.telegram.botToken;
  }

  async refreshAccessToken(): Promise<void> {
    // Telegram bots don't use OAuth, they use bot tokens
    // Bot tokens don't expire, so this is a no-op
    this.logActivity('Token refresh not needed for Telegram bot');
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<TelegramUser>({
        method: 'GET',
        url: `/bot${this.botToken}/getMe`,
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
        error: 'Failed to fetch Telegram profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    limit?: number;
    offset?: number;
    timeout?: number;
    allowedUpdates?: string[];
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        limit: Math.min(options.limit || 100, 100),
        offset: options.offset || this.lastUpdateId + 1,
        timeout: options.timeout || 10,
      };

      if (options.allowedUpdates) {
        params.allowed_updates = JSON.stringify(options.allowedUpdates);
      }

      const response = await this.makeRequest<{
        ok: boolean;
        result: TelegramUpdate[];
      }>({
        method: 'GET',
        url: `/bot${this.botToken}/getUpdates`,
        params,
      }, 'content');

      if (response.success && response.data?.ok && response.data.result) {
        const updates = response.data.result;
        
        // Update last update ID
        if (updates.length > 0) {
          this.lastUpdateId = Math.max(...updates.map(u => u.update_id));
        }

        const content = updates
          .filter(update => update.message || update.channel_post)
          .map(update => this.transformContent(update.message || update.channel_post!));

        return {
          success: true,
          data: content,
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
        error: 'Failed to fetch Telegram content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      chatId: number | string;
      parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
      disableWebPagePreview?: boolean;
      disableNotification?: boolean;
      replyToMessageId?: number;
      allowSendingWithoutReply?: boolean;
      replyMarkup?: any;
    }
  ): Promise<PlatformResponse<any>> {
    try {
      const data: any = {
        chat_id: options.chatId,
        text: content,
      };

      if (options.parseMode) data.parse_mode = options.parseMode;
      if (options.disableWebPagePreview) data.disable_web_page_preview = true;
      if (options.disableNotification) data.disable_notification = true;
      if (options.replyToMessageId) data.reply_to_message_id = options.replyToMessageId;
      if (options.allowSendingWithoutReply) data.allow_sending_without_reply = true;
      if (options.replyMarkup) data.reply_markup = JSON.stringify(options.replyMarkup);

      const response = await this.makeRequest({
        method: 'POST',
        url: `/bot${this.botToken}/sendMessage`,
        data,
      }, 'post');

      this.logActivity('Content posted', { 
        contentLength: content.length,
        chatId: options.chatId,
      });
      return response;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to Telegram',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      chatId?: number | string;
      messageId?: number;
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    // Telegram doesn't have a search API, so we implement a basic search
    // by filtering recent messages
    try {
      const contentResponse = await this.getContent({ limit: 100 });
      
      if (!contentResponse.success || !contentResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch content for search',
          platform: this.platform,
        };
      }

      const filteredContent = contentResponse.data.filter(content => {
        const matchesQuery = content.content.text?.toLowerCase().includes(query.toLowerCase());
        const matchesChat = options.chatId ? 
          content.externalId.includes(options.chatId.toString()) : true;
        
        return matchesQuery && matchesChat;
      });

      return {
        success: true,
        data: filteredContent,
        rateLimit: contentResponse.rateLimit,
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Search content failed', error);
      return {
        success: false,
        error: 'Failed to search Telegram content',
        platform: this.platform,
      };
    }
  }

  /**
   * Send photo to Telegram
   */
  async sendPhoto(
    chatId: number | string,
    photo: string,
    options: {
      caption?: string;
      parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
      disableNotification?: boolean;
      replyToMessageId?: number;
      replyMarkup?: any;
    } = {}
  ): Promise<PlatformResponse<any>> {
    try {
      const data: any = {
        chat_id: chatId,
        photo: photo,
      };

      if (options.caption) data.caption = options.caption;
      if (options.parseMode) data.parse_mode = options.parseMode;
      if (options.disableNotification) data.disable_notification = true;
      if (options.replyToMessageId) data.reply_to_message_id = options.replyToMessageId;
      if (options.replyMarkup) data.reply_markup = JSON.stringify(options.replyMarkup);

      const response = await this.makeRequest({
        method: 'POST',
        url: `/bot${this.botToken}/sendPhoto`,
        data,
      }, 'send_photo');

      this.logActivity('Photo sent', { chatId });
      return response;
    } catch (error) {
      this.logActivity('Send photo failed', error);
      return {
        success: false,
        error: 'Failed to send photo to Telegram',
        platform: this.platform,
      };
    }
  }

  /**
   * Send video to Telegram
   */
  async sendVideo(
    chatId: number | string,
    video: string,
    options: {
      duration?: number;
      width?: number;
      height?: number;
      thumb?: string;
      caption?: string;
      parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
      supportsStreaming?: boolean;
      disableNotification?: boolean;
      replyToMessageId?: number;
      replyMarkup?: any;
    } = {}
  ): Promise<PlatformResponse<any>> {
    try {
      const data: any = {
        chat_id: chatId,
        video: video,
      };

      if (options.duration) data.duration = options.duration;
      if (options.width) data.width = options.width;
      if (options.height) data.height = options.height;
      if (options.thumb) data.thumb = options.thumb;
      if (options.caption) data.caption = options.caption;
      if (options.parseMode) data.parse_mode = options.parseMode;
      if (options.supportsStreaming) data.supports_streaming = true;
      if (options.disableNotification) data.disable_notification = true;
      if (options.replyToMessageId) data.reply_to_message_id = options.replyToMessageId;
      if (options.replyMarkup) data.reply_markup = JSON.stringify(options.replyMarkup);

      const response = await this.makeRequest({
        method: 'POST',
        url: `/bot${this.botToken}/sendVideo`,
        data,
      }, 'send_video');

      this.logActivity('Video sent', { chatId });
      return response;
    } catch (error) {
      this.logActivity('Send video failed', error);
      return {
        success: false,
        error: 'Failed to send video to Telegram',
        platform: this.platform,
      };
    }
  }

  /**
   * Set webhook for real-time updates
   */
  async setWebhook(url: string, options: {
    certificate?: string;
    ipAddress?: string;
    maxConnections?: number;
    allowedUpdates?: string[];
    dropPendingUpdates?: boolean;
    secretToken?: string;
  } = {}): Promise<PlatformResponse<any>> {
    try {
      const data: any = {
        url: url,
      };

      if (options.certificate) data.certificate = options.certificate;
      if (options.ipAddress) data.ip_address = options.ipAddress;
      if (options.maxConnections) data.max_connections = options.maxConnections;
      if (options.allowedUpdates) data.allowed_updates = JSON.stringify(options.allowedUpdates);
      if (options.dropPendingUpdates) data.drop_pending_updates = true;
      if (options.secretToken) data.secret_token = options.secretToken;

      const response = await this.makeRequest({
        method: 'POST',
        url: `/bot${this.botToken}/setWebhook`,
        data,
      }, 'set_webhook');

      if (response.success) {
        this.webhookUrl = url;
        this.logActivity('Webhook set', { url });
      }

      return response;
    } catch (error) {
      this.logActivity('Set webhook failed', error);
      return {
        success: false,
        error: 'Failed to set Telegram webhook',
        platform: this.platform,
      };
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(dropPendingUpdates: boolean = false): Promise<PlatformResponse<any>> {
    try {
      const response = await this.makeRequest({
        method: 'POST',
        url: `/bot${this.botToken}/deleteWebhook`,
        data: {
          drop_pending_updates: dropPendingUpdates,
        },
      }, 'delete_webhook');

      if (response.success) {
        this.webhookUrl = undefined;
        this.logActivity('Webhook deleted');
      }

      return response;
    } catch (error) {
      this.logActivity('Delete webhook failed', error);
      return {
        success: false,
        error: 'Failed to delete Telegram webhook',
        platform: this.platform,
      };
    }
  }

  /**
   * Get chat information
   */
  async getChat(chatId: number | string): Promise<PlatformResponse<TelegramChat>> {
    try {
      const response = await this.makeRequest<{
        ok: boolean;
        result: TelegramChat;
      }>({
        method: 'GET',
        url: `/bot${this.botToken}/getChat`,
        params: {
          chat_id: chatId,
        },
      }, 'get_chat');

      if (response.success && response.data?.ok) {
        return {
          success: true,
          data: response.data.result,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch chat info',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get chat failed', error);
      return {
        success: false,
        error: 'Failed to fetch Telegram chat info',
        platform: this.platform,
      };
    }
  }

  protected transformContent(message: TelegramMessage): SocialContent {
    const content: SocialContent = {
      id: `telegram_${message.chat.id}_${message.message_id}`,
      platform: SocialPlatform.TELEGRAM,
      externalId: `${message.chat.id}_${message.message_id}`,
      author: {
        id: message.from?.id.toString() || message.sender_chat?.id.toString() || 'unknown',
        username: message.from?.username || message.sender_chat?.username || 'unknown',
        displayName: message.from ? 
          `${message.from.first_name} ${message.from.last_name || ''}`.trim() :
          message.sender_chat?.title || 'Unknown',
        avatar: undefined,
      },
      content: {
        text: message.text || message.caption || '',
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: 0, // Telegram doesn't have likes
        shares: 0, // Telegram doesn't have shares
        comments: 0, // Would need to track replies
        views: 0, // Telegram doesn't provide view count via API
        engagement: 0,
      },
      hashtags: this.extractHashtags(message.text || message.caption || ''),
      mentions: this.extractMentions(message.text || message.caption || '', message.entities),
      postedAt: new Date(message.date * 1000),
      fetchedAt: new Date(),
    };

    // Add media content
    if (message.photo && message.photo.length > 0) {
      // Use the largest photo size
      const largestPhoto = message.photo.reduce((prev, current) => 
        (prev.file_size || 0) > (current.file_size || 0) ? prev : current
      );
      content.content.images?.push(`https://api.telegram.org/file/bot${this.botToken}/${largestPhoto.file_id}`);
    }

    if (message.video) {
      content.content.videos?.push(`https://api.telegram.org/file/bot${this.botToken}/${message.video.file_id}`);
      if (message.video.thumb) {
        content.content.images?.push(`https://api.telegram.org/file/bot${this.botToken}/${message.video.thumb.file_id}`);
      }
    }

    if (message.animation) {
      content.content.videos?.push(`https://api.telegram.org/file/bot${this.botToken}/${message.animation.file_id}`);
      if (message.animation.thumb) {
        content.content.images?.push(`https://api.telegram.org/file/bot${this.botToken}/${message.animation.thumb.file_id}`);
      }
    }

    if (message.document) {
      content.content.links?.push(`https://api.telegram.org/file/bot${this.botToken}/${message.document.file_id}`);
    }

    // Extract URLs from entities
    if (message.entities) {
      message.entities.forEach(entity => {
        if (entity.type === 'url' && message.text) {
          const url = message.text.substring(entity.offset, entity.offset + entity.length);
          content.content.links?.push(url);
        } else if (entity.type === 'text_link' && entity.url) {
          content.content.links?.push(entity.url);
        }
      });
    }

    return content;
  }

  protected transformProfile(user: TelegramUser): PlatformProfile {
    return {
      platformUserId: user.id.toString(),
      username: user.username || user.first_name,
      displayName: `${user.first_name} ${user.last_name || ''}`.trim(),
      avatar: undefined,
      bio: undefined,
      followerCount: undefined,
      followingCount: undefined,
      verified: false,
      metadata: {
        isBot: user.is_bot,
        languageCode: user.language_code,
        canJoinGroups: user.can_join_groups,
        canReadAllGroupMessages: user.can_read_all_group_messages,
        supportsInlineQueries: user.supports_inline_queries,
        platform: 'telegram',
      },
    };
  }

  private extractHashtags(text: string): string[] {
    const hashtags = text.match(/#[\w\u0590-\u05FF]+/g) || [];
    return hashtags.map(tag => tag.substring(1).toLowerCase());
  }

  private extractMentions(text: string, entities?: TelegramMessageEntity[]): string[] {
    const mentions: string[] = [];
    
    // Extract @username mentions
    const usernameMentions = text.match(/@[\w]+/g) || [];
    mentions.push(...usernameMentions.map(mention => mention.substring(1).toLowerCase()));
    
    // Extract text mentions from entities
    if (entities) {
      entities.forEach(entity => {
        if (entity.type === 'mention' && text) {
          const mention = text.substring(entity.offset + 1, entity.offset + entity.length);
          mentions.push(mention.toLowerCase());
        } else if (entity.type === 'text_mention' && entity.user) {
          mentions.push(entity.user.username?.toLowerCase() || entity.user.first_name.toLowerCase());
        }
      });
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }
}