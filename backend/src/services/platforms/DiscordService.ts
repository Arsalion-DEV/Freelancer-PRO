import { SocialPlatform, PlatformProfile, SocialContent } from '@/types';
import { BasePlatformService, PlatformConfig, PlatformResponse } from './BasePlatformService';
import config from '@/config';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string;
  accent_color?: number;
  locale?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

interface DiscordMessage {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: DiscordUser;
  member?: DiscordGuildMember;
  content: string;
  timestamp: string;
  edited_timestamp?: string;
  tts: boolean;
  mention_everyone: boolean;
  mentions: DiscordUser[];
  mention_roles: string[];
  mention_channels?: DiscordChannelMention[];
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
  reactions?: DiscordReaction[];
  nonce?: string | number;
  pinned: boolean;
  webhook_id?: string;
  type: number;
  activity?: DiscordMessageActivity;
  application?: DiscordApplication;
  application_id?: string;
  message_reference?: DiscordMessageReference;
  flags?: number;
  referenced_message?: DiscordMessage;
  interaction?: DiscordMessageInteraction;
  thread?: DiscordChannel;
  components?: DiscordComponent[];
  sticker_items?: DiscordStickerItem[];
  stickers?: DiscordSticker[];
}

interface DiscordGuildMember {
  user?: DiscordUser;
  nick?: string;
  avatar?: string;
  roles: string[];
  joined_at: string;
  premium_since?: string;
  deaf: boolean;
  mute: boolean;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: string;
}

interface DiscordChannelMention {
  id: string;
  guild_id: string;
  type: number;
  name: string;
}

interface DiscordAttachment {
  id: string;
  filename: string;
  description?: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number;
  width?: number;
  ephemeral?: boolean;
}

interface DiscordEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: DiscordEmbedFooter;
  image?: DiscordEmbedImage;
  thumbnail?: DiscordEmbedThumbnail;
  video?: DiscordEmbedVideo;
  provider?: DiscordEmbedProvider;
  author?: DiscordEmbedAuthor;
  fields?: DiscordEmbedField[];
}

interface DiscordEmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

interface DiscordEmbedImage {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

interface DiscordEmbedThumbnail {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

interface DiscordEmbedVideo {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

interface DiscordEmbedProvider {
  name?: string;
  url?: string;
}

interface DiscordEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordReaction {
  count: number;
  me: boolean;
  emoji: DiscordEmoji;
}

interface DiscordEmoji {
  id?: string;
  name?: string;
  roles?: string[];
  user?: DiscordUser;
  require_colons?: boolean;
  managed?: boolean;
  animated?: boolean;
  available?: boolean;
}

interface DiscordMessageActivity {
  type: number;
  party_id?: string;
}

interface DiscordApplication {
  id: string;
  name: string;
  icon?: string;
  description: string;
  rpc_origins?: string[];
  bot_public: boolean;
  bot_require_code_grant: boolean;
  terms_of_service_url?: string;
  privacy_policy_url?: string;
  owner?: DiscordUser;
  summary: string;
  verify_key: string;
  team?: DiscordTeam;
  guild_id?: string;
  primary_sku_id?: string;
  slug?: string;
  cover_image?: string;
  flags?: number;
}

interface DiscordTeam {
  icon?: string;
  id: string;
  members: DiscordTeamMember[];
  name: string;
  owner_user_id: string;
}

interface DiscordTeamMember {
  membership_state: number;
  permissions: string[];
  team_id: string;
  user: DiscordUser;
}

interface DiscordMessageReference {
  message_id?: string;
  channel_id?: string;
  guild_id?: string;
  fail_if_not_exists?: boolean;
}

interface DiscordMessageInteraction {
  id: string;
  type: number;
  name: string;
  user: DiscordUser;
  member?: DiscordGuildMember;
}

interface DiscordChannel {
  id: string;
  type: number;
  guild_id?: string;
  position?: number;
  permission_overwrites?: DiscordOverwrite[];
  name?: string;
  topic?: string;
  nsfw?: boolean;
  last_message_id?: string;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  recipients?: DiscordUser[];
  icon?: string;
  owner_id?: string;
  application_id?: string;
  parent_id?: string;
  last_pin_timestamp?: string;
  rtc_region?: string;
  video_quality_mode?: number;
  message_count?: number;
  member_count?: number;
  thread_metadata?: DiscordThreadMetadata;
  member?: DiscordThreadMember;
  default_auto_archive_duration?: number;
  permissions?: string;
}

interface DiscordOverwrite {
  id: string;
  type: number;
  allow: string;
  deny: string;
}

interface DiscordThreadMetadata {
  archived: boolean;
  auto_archive_duration: number;
  archive_timestamp: string;
  locked: boolean;
  invitable?: boolean;
  create_timestamp?: string;
}

interface DiscordThreadMember {
  id?: string;
  user_id?: string;
  join_timestamp: string;
  flags: number;
}

interface DiscordComponent {
  type: number;
  custom_id?: string;
  disabled?: boolean;
  style?: number;
  label?: string;
  emoji?: DiscordEmoji;
  url?: string;
  options?: DiscordSelectOption[];
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  components?: DiscordComponent[];
}

interface DiscordSelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: DiscordEmoji;
  default?: boolean;
}

interface DiscordStickerItem {
  id: string;
  name: string;
  format_type: number;
}

interface DiscordSticker {
  id: string;
  pack_id?: string;
  name: string;
  description?: string;
  tags: string;
  asset?: string;
  type: number;
  format_type: number;
  available?: boolean;
  guild_id?: string;
  user?: DiscordUser;
  sort_value?: number;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  icon_hash?: string;
  splash?: string;
  discovery_splash?: string;
  owner?: boolean;
  owner_id: string;
  permissions?: string;
  region?: string;
  afk_channel_id?: string;
  afk_timeout: number;
  widget_enabled?: boolean;
  widget_channel_id?: string;
  verification_level: number;
  default_message_notifications: number;
  explicit_content_filter: number;
  roles: DiscordRole[];
  emojis: DiscordEmoji[];
  features: string[];
  mfa_level: number;
  application_id?: string;
  system_channel_id?: string;
  system_channel_flags: number;
  rules_channel_id?: string;
  joined_at?: string;
  large?: boolean;
  unavailable?: boolean;
  member_count?: number;
  voice_states?: DiscordVoiceState[];
  members?: DiscordGuildMember[];
  channels?: DiscordChannel[];
  presences?: DiscordPresenceUpdate[];
  max_presences?: number;
  max_members?: number;
  vanity_url_code?: string;
  description?: string;
  banner?: string;
  premium_tier: number;
  premium_subscription_count?: number;
  preferred_locale: string;
  public_updates_channel_id?: string;
  max_video_channel_users?: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  welcome_screen?: DiscordWelcomeScreen;
  nsfw_level: number;
  stage_instances?: DiscordStageInstance[];
  stickers?: DiscordSticker[];
  guild_scheduled_events?: DiscordGuildScheduledEvent[];
  premium_progress_bar_enabled: boolean;
}

interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  icon?: string;
  unicode_emoji?: string;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  tags?: DiscordRoleTags;
}

interface DiscordRoleTags {
  bot_id?: string;
  integration_id?: string;
  premium_subscriber?: null;
}

interface DiscordVoiceState {
  guild_id?: string;
  channel_id?: string;
  user_id: string;
  member?: DiscordGuildMember;
  session_id: string;
  deaf: boolean;
  mute: boolean;
  self_deaf: boolean;
  self_mute: boolean;
  self_stream?: boolean;
  self_video: boolean;
  suppress: boolean;
  request_to_speak_timestamp?: string;
}

interface DiscordPresenceUpdate {
  user: DiscordUser;
  guild_id: string;
  status: string;
  activities: DiscordActivity[];
  client_status: DiscordClientStatus;
}

interface DiscordActivity {
  name: string;
  type: number;
  url?: string;
  created_at: number;
  timestamps?: DiscordActivityTimestamps;
  application_id?: string;
  details?: string;
  state?: string;
  emoji?: DiscordEmoji;
  party?: DiscordActivityParty;
  assets?: DiscordActivityAssets;
  secrets?: DiscordActivitySecrets;
  instance?: boolean;
  flags?: number;
  buttons?: DiscordActivityButton[];
}

interface DiscordActivityTimestamps {
  start?: number;
  end?: number;
}

interface DiscordActivityParty {
  id?: string;
  size?: [number, number];
}

interface DiscordActivityAssets {
  large_image?: string;
  large_text?: string;
  small_image?: string;
  small_text?: string;
}

interface DiscordActivitySecrets {
  join?: string;
  spectate?: string;
  match?: string;
}

interface DiscordActivityButton {
  label: string;
  url: string;
}

interface DiscordClientStatus {
  desktop?: string;
  mobile?: string;
  web?: string;
}

interface DiscordWelcomeScreen {
  description?: string;
  welcome_channels: DiscordWelcomeScreenChannel[];
}

interface DiscordWelcomeScreenChannel {
  channel_id: string;
  description: string;
  emoji_id?: string;
  emoji_name?: string;
}

interface DiscordStageInstance {
  id: string;
  guild_id: string;
  channel_id: string;
  topic: string;
  privacy_level: number;
  discoverable_disabled: boolean;
  guild_scheduled_event_id?: string;
}

interface DiscordGuildScheduledEvent {
  id: string;
  guild_id: string;
  channel_id?: string;
  creator_id?: string;
  name: string;
  description?: string;
  scheduled_start_time: string;
  scheduled_end_time?: string;
  privacy_level: number;
  status: number;
  entity_type: number;
  entity_id?: string;
  entity_metadata?: DiscordGuildScheduledEventEntityMetadata;
  creator?: DiscordUser;
  user_count?: number;
  image?: string;
}

interface DiscordGuildScheduledEventEntityMetadata {
  location?: string;
}

export class DiscordService extends BasePlatformService {
  private botToken: string;
  private wsConnection?: any;

  constructor() {
    const platformConfig: PlatformConfig = {
      baseURL: 'https://discord.com/api/v10',
      apiVersion: 'v10',
      rateLimit: {
        requests: 50, // 50 requests per second (global rate limit)
        windowMs: 1000,
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
      },
    };

    super(SocialPlatform.DISCORD, platformConfig);
    this.botToken = config.platformAPIs.discord.botToken;
  }

  async refreshAccessToken(): Promise<void> {
    // Discord bots don't use OAuth refresh tokens, they use bot tokens
    // Bot tokens don't expire, so this is a no-op
    this.logActivity('Token refresh not needed for Discord bot');
  }

  async getProfile(): Promise<PlatformResponse<PlatformProfile>> {
    try {
      const response = await this.makeRequest<DiscordUser>({
        method: 'GET',
        url: '/users/@me',
        headers: {
          'Authorization': `Bot ${this.botToken}`,
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
        error: 'Failed to fetch Discord profile',
        platform: this.platform,
      };
    }
  }

  async getContent(options: {
    channelId?: string;
    guildId?: string;
    limit?: number;
    before?: string;
    after?: string;
    around?: string;
  } = {}): Promise<PlatformResponse<SocialContent[]>> {
    try {
      if (!options.channelId && !options.guildId) {
        return {
          success: false,
          error: 'Either channelId or guildId must be provided',
          platform: this.platform,
        };
      }

      let messages: DiscordMessage[] = [];

      if (options.channelId) {
        // Get messages from specific channel
        const response = await this.getChannelMessages(options.channelId, {
          limit: options.limit,
          before: options.before,
          after: options.after,
          around: options.around,
        });

        if (response.success && response.data) {
          messages = response.data;
        } else {
          return response as PlatformResponse<SocialContent[]>;
        }
      } else if (options.guildId) {
        // Get messages from all channels in guild
        const channelsResponse = await this.getGuildChannels(options.guildId);
        if (!channelsResponse.success || !channelsResponse.data) {
          return {
            success: false,
            error: 'Failed to fetch guild channels',
            platform: this.platform,
          };
        }

        const textChannels = channelsResponse.data.filter(channel => 
          channel.type === 0 || channel.type === 5 // GUILD_TEXT or GUILD_NEWS
        );

        for (const channel of textChannels.slice(0, 5)) { // Limit to 5 channels
          const channelMessages = await this.getChannelMessages(channel.id, {
            limit: Math.floor((options.limit || 50) / textChannels.length),
          });
          
          if (channelMessages.success && channelMessages.data) {
            messages.push(...channelMessages.data);
          }
        }
      }

      const content = messages.map(message => this.transformContent(message));
      
      return {
        success: true,
        data: content,
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get content failed', error);
      return {
        success: false,
        error: 'Failed to fetch Discord content',
        platform: this.platform,
      };
    }
  }

  async postContent(
    content: string,
    options: {
      channelId: string;
      tts?: boolean;
      embeds?: DiscordEmbed[];
      allowedMentions?: any;
      messageReference?: DiscordMessageReference;
      components?: DiscordComponent[];
      stickerIds?: string[];
      files?: any[];
      payloadJson?: string;
      attachments?: any[];
      flags?: number;
    }
  ): Promise<PlatformResponse<any>> {
    try {
      const data: any = {
        content: content,
      };

      if (options.tts) data.tts = true;
      if (options.embeds) data.embeds = options.embeds;
      if (options.allowedMentions) data.allowed_mentions = options.allowedMentions;
      if (options.messageReference) data.message_reference = options.messageReference;
      if (options.components) data.components = options.components;
      if (options.stickerIds) data.sticker_ids = options.stickerIds;
      if (options.flags) data.flags = options.flags;

      const response = await this.makeRequest({
        method: 'POST',
        url: `/channels/${options.channelId}/messages`,
        data,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      }, 'post');

      this.logActivity('Content posted', { 
        contentLength: content.length,
        channelId: options.channelId,
      });
      return response;
    } catch (error) {
      this.logActivity('Post content failed', error);
      return {
        success: false,
        error: 'Failed to post content to Discord',
        platform: this.platform,
      };
    }
  }

  async searchContent(
    query: string,
    options: {
      guildId?: string;
      channelId?: string;
      authorId?: string;
      mentions?: string;
      has?: string;
      maxId?: string;
      minId?: string;
      sortBy?: 'timestamp' | 'relevance';
      sortOrder?: 'desc' | 'asc';
      offset?: number;
    } = {}
  ): Promise<PlatformResponse<SocialContent[]>> {
    try {
      const params: any = {
        content: query,
      };

      if (options.authorId) params.author_id = options.authorId;
      if (options.mentions) params.mentions = options.mentions;
      if (options.has) params.has = options.has;
      if (options.maxId) params.max_id = options.maxId;
      if (options.minId) params.min_id = options.minId;
      if (options.sortBy) params.sort_by = options.sortBy;
      if (options.sortOrder) params.sort_order = options.sortOrder;
      if (options.offset) params.offset = options.offset;

      const endpoint = options.guildId ? 
        `/guilds/${options.guildId}/messages/search` :
        options.channelId ?
        `/channels/${options.channelId}/messages/search` :
        '/users/@me/messages/search';

      const response = await this.makeRequest<{
        messages: DiscordMessage[][];
        total_results: number;
      }>({
        method: 'GET',
        url: endpoint,
        params,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      }, 'search');

      if (response.success && response.data?.messages) {
        const messages = response.data.messages.flat();
        const content = messages.map(message => this.transformContent(message));
        
        return {
          success: true,
          data: content,
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
        error: 'Failed to search Discord content',
        platform: this.platform,
      };
    }
  }

  /**
   * Get messages from a specific channel
   */
  async getChannelMessages(
    channelId: string,
    options: {
      limit?: number;
      before?: string;
      after?: string;
      around?: string;
    } = {}
  ): Promise<PlatformResponse<DiscordMessage[]>> {
    try {
      const params: any = {
        limit: Math.min(options.limit || 50, 100),
      };

      if (options.before) params.before = options.before;
      if (options.after) params.after = options.after;
      if (options.around) params.around = options.around;

      const response = await this.makeRequest<DiscordMessage[]>({
        method: 'GET',
        url: `/channels/${channelId}/messages`,
        params,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      }, 'channel_messages');

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch channel messages',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get channel messages failed', error);
      return {
        success: false,
        error: 'Failed to fetch Discord channel messages',
        platform: this.platform,
      };
    }
  }

  /**
   * Get channels in a guild
   */
  async getGuildChannels(guildId: string): Promise<PlatformResponse<DiscordChannel[]>> {
    try {
      const response = await this.makeRequest<DiscordChannel[]>({
        method: 'GET',
        url: `/guilds/${guildId}/channels`,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      }, 'guild_channels');

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch guild channels',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get guild channels failed', error);
      return {
        success: false,
        error: 'Failed to fetch Discord guild channels',
        platform: this.platform,
      };
    }
  }

  /**
   * Get guild information
   */
  async getGuild(guildId: string, withCounts: boolean = false): Promise<PlatformResponse<DiscordGuild>> {
    try {
      const params: any = {};
      if (withCounts) params.with_counts = true;

      const response = await this.makeRequest<DiscordGuild>({
        method: 'GET',
        url: `/guilds/${guildId}`,
        params,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      }, 'guild_info');

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          rateLimit: response.rateLimit,
          platform: this.platform,
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to fetch guild info',
        platform: this.platform,
      };
    } catch (error) {
      this.logActivity('Get guild failed', error);
      return {
        success: false,
        error: 'Failed to fetch Discord guild info',
        platform: this.platform,
      };
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(channelId: string, messageId: string, emoji: string): Promise<PlatformResponse<any>> {
    try {
      const response = await this.makeRequest({
        method: 'PUT',
        url: `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      }, 'add_reaction');

      return response;
    } catch (error) {
      this.logActivity('Add reaction failed', error);
      return {
        success: false,
        error: 'Failed to add reaction to Discord message',
        platform: this.platform,
      };
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(channelId: string, messageId: string, emoji: string, userId?: string): Promise<PlatformResponse<any>> {
    try {
      const userTarget = userId ? userId : '@me';
      const response = await this.makeRequest({
        method: 'DELETE',
        url: `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/${userTarget}`,
        headers: {
          'Authorization': `Bot ${this.botToken}`,
        },
      }, 'remove_reaction');

      return response;
    } catch (error) {
      this.logActivity('Remove reaction failed', error);
      return {
        success: false,
        error: 'Failed to remove reaction from Discord message',
        platform: this.platform,
      };
    }
  }

  protected transformContent(message: DiscordMessage): SocialContent {
    const content: SocialContent = {
      id: `discord_${message.id}`,
      platform: SocialPlatform.DISCORD,
      externalId: message.id,
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: message.member?.nick || `${message.author.username}#${message.author.discriminator}`,
        avatar: message.author.avatar ? 
          `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png` :
          undefined,
      },
      content: {
        text: message.content,
        images: [],
        videos: [],
        links: [],
      },
      metrics: {
        likes: 0, // Discord doesn't have likes, but reactions could be counted
        shares: 0, // Discord doesn't have shares
        comments: 0, // Would need to track replies
        views: 0, // Discord doesn't provide view count
        engagement: message.reactions?.reduce((sum, reaction) => sum + reaction.count, 0) || 0,
      },
      hashtags: [], // Discord doesn't use hashtags
      mentions: message.mentions.map(user => user.username.toLowerCase()),
      postedAt: new Date(message.timestamp),
      fetchedAt: new Date(),
    };

    // Add reaction count as likes
    if (message.reactions && message.reactions.length > 0) {
      content.metrics.likes = message.reactions.reduce((sum, reaction) => sum + reaction.count, 0);
    }

    // Process attachments
    message.attachments.forEach(attachment => {
      if (attachment.content_type?.startsWith('image/')) {
        content.content.images?.push(attachment.url);
      } else if (attachment.content_type?.startsWith('video/')) {
        content.content.videos?.push(attachment.url);
      } else {
        content.content.links?.push(attachment.url);
      }
    });

    // Process embeds
    message.embeds.forEach(embed => {
      if (embed.image?.url) {
        content.content.images?.push(embed.image.url);
      }
      if (embed.video?.url) {
        content.content.videos?.push(embed.video.url);
      }
      if (embed.url) {
        content.content.links?.push(embed.url);
      }
      if (embed.description || embed.title) {
        content.content.text += `\n\n**${embed.title || ''}**\n${embed.description || ''}`;
      }
    });

    // Extract URLs from message content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.content.match(urlRegex) || [];
    content.content.links?.push(...urls);

    return content;
  }

  protected transformProfile(user: DiscordUser): PlatformProfile {
    return {
      platformUserId: user.id,
      username: user.username,
      displayName: `${user.username}#${user.discriminator}`,
      avatar: user.avatar ? 
        `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` :
        undefined,
      bio: undefined,
      followerCount: undefined,
      followingCount: undefined,
      verified: user.verified || false,
      metadata: {
        discriminator: user.discriminator,
        bot: user.bot,
        system: user.system,
        mfaEnabled: user.mfa_enabled,
        locale: user.locale,
        flags: user.flags,
        premiumType: user.premium_type,
        publicFlags: user.public_flags,
        platform: 'discord',
      },
    };
  }
}