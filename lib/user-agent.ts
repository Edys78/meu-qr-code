export interface ParsedClientInfo {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'bot';
  os: string;
  browser: string;
}

export function parseUserAgent(uaString: string = ''): ParsedClientInfo {
  const ua = uaString.toLowerCase();

  // Device
  let deviceType: 'mobile' | 'desktop' | 'tablet' | 'bot' = 'desktop';
  if (/bot|crawl|spider|slurp|facebookexternalhit|whatsapp/i.test(ua)) {
    deviceType = 'bot';
  } else if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle/i.test(ua)) {
    deviceType = 'mobile';
  }

  // OS
  let os = 'Outro';
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser
  let browser = 'Outro';
  if (/edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  }

  return { deviceType, os, browser };
}
