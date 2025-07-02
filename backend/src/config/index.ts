import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  type: 'sqlite' | 'postgres';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sqlitePath?: string;
  ssl?: boolean;
  logging: boolean;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

interface OAuthConfig {
  facebook: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  twitter: {
    consumerKey: string;
    consumerSecret: string;
    callbackURL: string;
  };
  linkedin: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  google: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
}

interface PlatformAPIConfig {
  facebook: {
    clientId: string;
    clientSecret: string;
    apiVersion: string;
  };
  twitter: {
    consumerKey: string;
    consumerSecret: string;
    bearerToken: string;
  };
  instagram: {
    clientId: string;
    clientSecret: string;
  };
  linkedin: {
    clientId: string;
    clientSecret: string;
  };
  reddit: {
    clientId: string;
    clientSecret: string;
    userAgent: string;
  };
  telegram: {
    botToken: string;
  };
  discord: {
    clientId: string;
    clientSecret: string;
  };
}

interface AppConfig {
  env: string;
  port: number;
  host: string;
  apiPrefix: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  oauth: OAuthConfig;
  platformAPIs: PlatformAPIConfig;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
    destination: string;
  };
  security: {
    encryptionKey: string;
    saltRounds: number;
    helmetEnabled: boolean;
    trustProxy: boolean;
  };
  websocket: {
    port: number;
    heartbeatInterval: number;
  };
  externalAPIs: {
    gemini: {
      apiKey: string;
    };
    openai: {
      apiKey: string;
    };
  };
  email: {
    smtp: {
      host: string;
      port: number;
      user: string;
      password: string;
    };
    from: string;
  };
}

const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  database: {
    type: (process.env.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'social_monitor_dev',
    username: process.env.DB_USER || 'dev_user',
    password: process.env.DB_PASSWORD || 'dev_password',
    sqlitePath: process.env.DB_SQLITE_PATH || './database/social_monitor.db',
    ssl: process.env.NODE_ENV === 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  oauth: {
    facebook: {
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/facebook/callback',
    },
    twitter: {
      consumerKey: process.env.TWITTER_CONSUMER_KEY || '',
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET || '',
      callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/twitter/callback',
    },
    linkedin: {
      clientID: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/linkedin/callback',
    },
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
    },
  },

  platformAPIs: {
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      apiVersion: 'v18.0',
    },
    twitter: {
      consumerKey: process.env.TWITTER_CONSUMER_KEY || '',
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    },
    reddit: {
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      userAgent: 'SocialMonitor/1.0.0',
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    destination: path.join(process.cwd(), 'uploads'),
  },

  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-32-character-key-now',
    saltRounds: parseInt(process.env.HASH_SALT_ROUNDS || '12', 10),
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },

  websocket: {
    port: parseInt(process.env.WS_PORT || '3002', 10),
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
  },

  externalAPIs: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'Social Monitor <noreply@socialmonitor.com>',
  },
};

// Validation
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    console.error('Missing required environment variables in production!');
    process.exit(1);
  }
}

export default config;