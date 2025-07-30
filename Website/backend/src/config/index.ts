import dotenv from 'dotenv';
dotenv.config();

export function getConfig() {
  // Validate required environment variables
  const requiredEnvVars = ['EXPORT_ENCRYPTION_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  return {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    postgresUrl: process.env.POSTGRES_URL || 'postgres://user:pass@localhost:5432/vitatrack',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // Export settings
    export: {
      fileExpiryDays: parseInt(process.env.EXPORT_FILE_EXPIRY_DAYS || '7'),
      maxDownloads: parseInt(process.env.EXPORT_MAX_DOWNLOADS || '3'),
      encryptionKey: process.env.EXPORT_ENCRYPTION_KEY, // Required - no default
      storagePath: process.env.EXPORT_STORAGE_PATH || './exports',
      defaultFormat: process.env.EXPORT_DEFAULT_FORMAT || 'json',
      rateLimitWindowMs: parseInt(process.env.EXPORT_RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMax: parseInt(process.env.EXPORT_RATE_LIMIT_MAX || '5')
    },
    
    // Security settings
    security: {
      // Rate limiting
      rateLimit: {
        standard: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX || '100') // 100 requests per window
        },
        strict: {
          windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS || '3600000'), // 1 hour
          max: parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10') // 10 requests per window
        },
        api: {
          windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
          max: parseInt(process.env.API_RATE_LIMIT_MAX || '60') // 60 requests per minute
        }
      },
      
      // JWT settings
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'vitatrack-api',
        audience: process.env.JWT_AUDIENCE || 'vitatrack-users'
      },
      
      // Account security
      account: {
        lockoutThreshold: parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD || '5'),
        lockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '15'), // minutes
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
        passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
        passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false'
      },
      
      // CSRF protection
      csrf: {
        enabled: process.env.CSRF_PROTECTION !== 'false',
        tokenExpiry: parseInt(process.env.CSRF_TOKEN_EXPIRY || '60') // minutes
      },
      
      // API keys
      apiKeys: {
        enabled: process.env.API_KEYS_ENABLED !== 'false',
        defaultRateLimit: parseInt(process.env.API_KEY_RATE_LIMIT || '60')
      },
      
      // Vulnerability scanning
      vulnerabilityScan: {
        enabled: process.env.VULNERABILITY_SCAN_ENABLED !== 'false',
        dependencyScanInterval: parseInt(process.env.DEPENDENCY_SCAN_INTERVAL || '86400000'), // 24 hours
        codeScanInterval: parseInt(process.env.CODE_SCAN_INTERVAL || '604800000'), // 7 days
        configScanInterval: parseInt(process.env.CONFIG_SCAN_INTERVAL || '604800000') // 7 days
      }
    }
  };
}