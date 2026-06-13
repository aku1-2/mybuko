class RateLimiter {
  private requests = new Map<string, number[]>()

  constructor(private windowMs: number, private maxRequests: number) {
    // Periodically clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  isLimitExceeded(key: string): boolean {
    const now = Date.now()
    const timestamps = this.requests.get(key) || []
    
    // Filter out timestamps older than the window
    const activeTimestamps = timestamps.filter(ts => now - ts < this.windowMs)
    
    if (activeTimestamps.length >= this.maxRequests) {
      return true
    }
    
    activeTimestamps.push(now)
    this.requests.set(key, activeTimestamps)
    return false
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, timestamps] of this.requests.entries()) {
      const activeTimestamps = timestamps.filter(ts => now - ts < this.windowMs)
      if (activeTimestamps.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, activeTimestamps)
      }
    }
  }
}

// 5 minutes window, max 3 requests
export const otpRateLimiter = new RateLimiter(5 * 60 * 1000, 3)
