import { RateLimiterMemory } from 'rate-limiter-flexible';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@/utils/logger';
import { SocialPlatform, PlatformProfile, SocialContent, RateLimitInfo } from '@/types';
import config from '@/config';

export interface PlatformConfig {
  baseURL: string;
  apiVersion?: string;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface PlatformResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimit?: RateLimitInfo;
  platform: SocialPlatform;
}

export abstract class BasePlatformService {
  protected platform: SocialPlatform;
  protected config: PlatformConfig;
  protected httpClient!: AxiosInstance;
  protected rateLimiter!: RateLimiterMemory;
  protected credentials?: PlatformCredentials;

  constructor(platform: SocialPlatform, platformConfig: PlatformConfig) {
    this.platform = platform;
    this.config = platformConfig;
    this.setupHttpClient();
    this.setupRateLimiter();
  }

  /**
   * Setup HTTP client with platform-specific configuration
   */
  private setupHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'SocialMonitor/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.credentials?.accessToken) {
          config.headers.Authorization = `Bearer ${this.credentials.accessToken}`;
        }
        return config;
      },
      (error) => {
        logger.error(`${this.platform} request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            return this.httpClient(originalRequest);
          } catch (refreshError) {
            logger.error(`${this.platform} token refresh failed:`, refreshError);
            throw refreshError;
          }
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          logger.warn(`${this.platform} rate limited, retry after ${retryAfter}s`);
          throw {
            ...error,
            retryAfter,
            isRateLimit: true,
          };
        }

        logger.error(`${this.platform} API error:`, {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });

        throw error;
      }
    );
  }

  /**
   * Setup rate limiter for the platform
   */
  private setupRateLimiter(): void {
    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: `${this.platform}_api`,
      points: this.config.rateLimit.requests,
      duration: this.config.rateLimit.windowMs / 1000,
    });
  }

  /**
   * Set credentials for the platform
   */
  public setCredentials(credentials: PlatformCredentials): void {
    this.credentials = credentials;
  }

  /**
   * Check if credentials are valid and not expired
   */
  public isAuthenticated(): boolean {
    if (!this.credentials?.accessToken) return false;
    if (!this.credentials.expiresAt) return true;
    return new Date() < this.credentials.expiresAt;
  }

  /**
   * Make a rate-limited API request
   */
  protected async makeRequest<T = any>(
    config: AxiosRequestConfig,
    rateLimitKey?: string
  ): Promise<PlatformResponse<T>> {
    const key = rateLimitKey || 'default';

    try {
      // Check rate limit
      await this.rateLimiter.consume(key);

      // Make the request with retry logic
      const response = await this.retryRequest<T>(config);
      
      // Extract rate limit info from headers
      const rateLimit = this.extractRateLimitInfo(response);

      return {
        success: true,
        data: response.data,
        rateLimit,
        platform: this.platform,
      };
    } catch (rateLimitError: any) {
      if (rateLimitError.remainingHits !== undefined) {
        logger.warn(`${this.platform} rate limit exceeded for key: ${key}`);
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimit: {
            limit: this.config.rateLimit.requests,
            remaining: 0,
            reset: new Date(Date.now() + rateLimitError.msBeforeNext),
            retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000),
          },
          platform: this.platform,
        };
      }
      throw rateLimitError;
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    config: AxiosRequestConfig,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.httpClient.request<T>(config);
    } catch (error: any) {
      if (attempt >= this.config.retryConfig.maxRetries) {
        throw error;
      }

      // Don't retry client errors (4xx) except 429
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }

      const delay = this.config.retryConfig.retryDelay * Math.pow(2, attempt - 1);
      logger.warn(`${this.platform} request failed, retrying in ${delay}ms (attempt ${attempt})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest<T>(config, attempt + 1);
    }
  }

  /**
   * Extract rate limit information from response headers
   */
  protected extractRateLimitInfo(response: AxiosResponse): RateLimitInfo | undefined {
    const headers = response.headers;
    
    // Try common rate limit header patterns
    const limitHeaders = ['x-ratelimit-limit', 'x-rate-limit-limit', 'ratelimit-limit'];
    const remainingHeaders = ['x-ratelimit-remaining', 'x-rate-limit-remaining', 'ratelimit-remaining'];
    const resetHeaders = ['x-ratelimit-reset', 'x-rate-limit-reset', 'ratelimit-reset'];

    const limit = this.findHeader(headers, limitHeaders);
    const remaining = this.findHeader(headers, remainingHeaders);
    const reset = this.findHeader(headers, resetHeaders);

    if (limit || remaining || reset) {
      return {
        limit: limit ? parseInt(limit) : this.config.rateLimit.requests,
        remaining: remaining ? parseInt(remaining) : 0,
        reset: reset ? new Date(parseInt(reset) * 1000) : new Date(),
      };
    }

    return undefined;
  }

  /**
   * Find header value from multiple possible header names
   */
  private findHeader(headers: any, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      if (headers[name] || headers[name.toLowerCase()]) {
        return headers[name] || headers[name.toLowerCase()];
      }
    }
    return undefined;
  }

  /**
   * Abstract methods that must be implemented by platform services
   */
  abstract refreshAccessToken(): Promise<void>;
  abstract getProfile(): Promise<PlatformResponse<PlatformProfile>>;
  abstract getContent(options?: any): Promise<PlatformResponse<SocialContent[]>>;
  abstract postContent(content: string, options?: any): Promise<PlatformResponse<any>>;
  abstract searchContent(query: string, options?: any): Promise<PlatformResponse<SocialContent[]>>;

  /**
   * Get platform-specific configuration
   */
  public getConfig(): PlatformConfig {
    return { ...this.config };
  }

  /**
   * Get platform type
   */
  public getPlatform(): SocialPlatform {
    return this.platform;
  }

  /**
   * Get current rate limit status
   */
  public async getRateLimitStatus(key: string = 'default'): Promise<RateLimitInfo> {
    const info = await this.rateLimiter.get(key);
    
    return {
      limit: this.config.rateLimit.requests,
      remaining: Math.max(0, this.config.rateLimit.requests - (info ? 1 : 0)),
      reset: new Date(Date.now() + (info?.msBeforeNext || 0)),
    };
  }

  /**
   * Transform platform-specific data to common format
   */
  protected abstract transformContent(platformData: any): SocialContent;
  protected abstract transformProfile(platformData: any): PlatformProfile;

  /**
   * Validate API response structure
   */
  protected validateResponse(data: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
      if (!(field in data)) {
        logger.warn(`${this.platform} response missing required field: ${field}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Log platform activity
   */
  protected logActivity(action: string, details?: any): void {
    logger.info(`${this.platform} ${action}`, {
      platform: this.platform,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}