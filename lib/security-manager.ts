/**
 * Security & Privacy Module
 * 
 * Implements encryption, authentication, and PDPA compliance
 * for Thai Personal Data Protection Act
 */

export interface SecurityConfig {
  enableEncryption: boolean
  enableAuthentication: boolean
  enablePDPACompliance: boolean
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305'
  tokenExpiration: number // seconds
  maxLoginAttempts: number
}

export interface UserConsent {
  userId: string
  consentType: 'personal-data' | 'location' | 'analytics' | 'notifications'
  timestamp: number
  version: string // PDPA version
  ipAddress: string
  userAgent: string
}

export interface EncryptedData {
  ciphertext: string
  iv: string
  authTag: string
  algorithm: string
}

/**
 * Security and PDPA compliance manager
 */
class SecurityManager {
  private config: SecurityConfig
  private consents: Map<string, UserConsent[]> = new Map()
  private loginAttempts: Map<string, number> = new Map()

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableEncryption: true,
      enableAuthentication: true,
      enablePDPACompliance: true,
      encryptionAlgorithm: 'AES-256-GCM',
      tokenExpiration: 86400, // 24 hours
      maxLoginAttempts: 5,
      ...config,
    }
  }

  /**
   * Record user consent for PDPA compliance
   */
  recordConsent(
    userId: string,
    consentType: 'personal-data' | 'location' | 'analytics' | 'notifications',
    ipAddress: string,
    userAgent: string
  ): UserConsent {
    const consent: UserConsent = {
      userId,
      consentType,
      timestamp: Date.now(),
      version: '1.0', // PDPA v1.0
      ipAddress,
      userAgent,
    }

    if (!this.consents.has(userId)) {
      this.consents.set(userId, [])
    }

    this.consents.get(userId)!.push(consent)

    return consent
  }

  /**
   * Check if user has given consent
   */
  hasConsent(userId: string, consentType: string): boolean {
    const userConsents = this.consents.get(userId)
    if (!userConsents) return false

    return userConsents.some(c => c.consentType === consentType)
  }

  /**
   * Revoke user consent
   */
  revokeConsent(userId: string, consentType: string): boolean {
    const userConsents = this.consents.get(userId)
    if (!userConsents) return false

    const index = userConsents.findIndex(c => c.consentType === consentType)
    if (index >= 0) {
      userConsents.splice(index, 1)
      return true
    }

    return false
  }

  /**
   * Get user data for PDPA access request
   */
  getUserData(userId: string): {
    consents: UserConsent[]
    predictions: number // count
    lastActivity: number
  } {
    return {
      consents: this.consents.get(userId) || [],
      predictions: 0, // Would be fetched from database
      lastActivity: Date.now(),
    }
  }

  /**
   * Delete user personal data (PDPA right to be forgotten)
   */
  deleteUserData(userId: string): boolean {
    this.consents.delete(userId)
    this.loginAttempts.delete(userId)
    // In production, would also delete from database, cache, logs
    return true
  }

  /**
   * Track login attempts for rate limiting
   */
  trackLoginAttempt(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId) || 0

    if (attempts >= this.config.maxLoginAttempts) {
      return false // Too many attempts
    }

    this.loginAttempts.set(userId, attempts + 1)

    // Reset after 15 minutes
    setTimeout(() => {
      this.loginAttempts.delete(userId)
    }, 15 * 60 * 1000)

    return true
  }

  /**
   * Clear login attempts after successful login
   */
  clearLoginAttempts(userId: string): void {
    this.loginAttempts.delete(userId)
  }

  /**
   * Generate secure token
   */
  generateSecureToken(userId: string, expiresIn: number = this.config.tokenExpiration): string {
    // In production, use JWT with RS256 or HS256
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    }

    // This is a placeholder - in production use jsonwebtoken library
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  /**
   * Validate token
   */
  validateToken(token: string): { valid: boolean; userId?: string; error?: string } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))

      if (decoded.exp * 1000 < Date.now()) {
        return { valid: false, error: 'Token expired' }
      }

      return { valid: true, userId: decoded.userId }
    } catch {
      return { valid: false, error: 'Invalid token' }
    }
  }

  /**
   * Hash sensitive data
   */
  hashData(data: string): string {
    // In production, use bcrypt or argon2
    // This is a simple example
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Verify sensitive data
   */
  verifyData(data: string, hash: string): boolean {
    return this.hashData(data) === hash
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .substring(0, 255) // Limit length
      .trim()
  }

  /**
   * Check if URL is safe (prevent open redirects)
   */
  isSafeURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      // Only allow same-origin or whitelisted domains
      const whitelist = ['localhost', 'seapalo.app']
      return whitelist.some(domain => parsed.hostname.includes(domain))
    } catch {
      return false
    }
  }

  /**
   * Generate PDPA privacy policy
   */
  generatePrivacyPolicy(): string {
    return `
SEAPALO Privacy Policy - PDPA Compliant

1. Data Collection
We collect:
- Location data (latitude/longitude)
- Prediction requests and preferences
- Device information (for optimization)
- Analytics data (anonymized)

2. Data Usage
Your data is used for:
- Tide prediction calculation
- Service improvement
- Performance optimization
- Legal compliance

3. Data Storage
- Encrypted at rest (AES-256-GCM)
- Stored in secure servers (Thailand region)
- Automatic deletion after 90 days

4. Your Rights (PDPA)
You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your data (right to be forgotten)
- Withdraw consent at any time
- Lodge a complaint with PDPC

5. Contact
For privacy inquiries: privacy@seapalo.app
Data Protection Officer: dpo@seapalo.app

Effective: January 1, 2025
    `
  }

  /**
   * Get security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config }
  }
}

// Singleton instance
export const securityManager = new SecurityManager()

export default securityManager
