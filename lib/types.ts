export type QRType = 'url' | 'pix' | 'wifi' | 'vcard' | 'text' | 'whatsapp' | 'email';

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface PixData {
  keyType: PixKeyType;
  key: string;
  merchantName: string;
  merchantCity: string;
  amount?: string;
  txId?: string;
  description?: string;
}

export interface WifiData {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface VCardData {
  firstName: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  cellphone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface WhatsAppData {
  phone: string;
  message?: string;
}

export type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';
export type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
export type CornerDotType = 'square' | 'dot';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface FrameConfig {
  id: string;
  label: string;
  textColor: string;
  bgColor: string;
  position: 'bottom' | 'top';
  style: 'banner' | 'bubble' | 'minimal' | 'rounded-box' | 'badge';
  icon?: string;
}

export interface QRDesign {
  dotsColor: string;
  backgroundColor: string;
  dotsType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  cornerSquareColor: string;
  cornerDotColor: string;
  gradientEnabled: boolean;
  gradientType: 'linear' | 'radial';
  gradientStartColor: string;
  gradientEndColor: string;
  gradientRotation: number;
  logoUrl: string | null;
  logoSize: number; // 0.1 to 0.4
  logoMargin: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
  frame?: FrameConfig | null;
}

export interface QRCodeRecord {
  id: string;
  userId: string;
  shortCode: string;
  name: string;
  type: QRType;
  targetUrl: string;
  rawPayload: string;
  isDynamic: boolean;
  isActive: boolean;
  totalScans: number;
  scansThisMonth?: number;
  lastScannedAt?: string | null;
  pixData?: PixData;
  wifiData?: WifiData;
  vcardData?: VCardData;
  whatsappData?: WhatsAppData;
  design: QRDesign;
  createdAt: string;
  updatedAt: string;
}

export interface ScanRecord {
  id: string;
  qrId: string;
  userId: string;
  shortCode: string;
  timestamp: string;
  country?: string;
  city?: string;
  region?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'bot';
  os?: string;
  browser?: string;
  referer?: string;
}

export type UserPlan = 'free' | 'pro' | 'business';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  plan: UserPlan;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  dynamicQRLimit: number;
  totalScansLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanConfig {
  id: UserPlan;
  name: string;
  priceBrl: number;
  priceFormatted: string;
  interval: string;
  dynamicQRLimit: number;
  scansLimit: number | 'unlimited';
  hasWatermark: boolean;
  editableLinks: boolean;
  svgExport: boolean;
  pdfExport: boolean;
  advancedAnalytics: boolean;
  customDomain: boolean;
  aiGenerations: number;
  features: string[];
}
