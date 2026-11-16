export type PageView = 'home' | 'about-me' | 'what-i-offer' | 'packages' | 'reachout';

export type PackageId = '15m' | '30m' | '1h' | '3h' | 'pro5h';

export type GameFocus =
  | 'Excessive VR'
  | 'Roblox VR'
  | 'Minecraft VR'
  | 'PS5 Waitlist (Dec)';

export type PaymentMethod =
  | 'PKR Cash'
  | 'Robux (Ibirahim60)'
  | 'Robux (Abdd332211)';

export interface VrPackage {
  id: PackageId;
  duration: string;
  title: string;
  pricePkr: number | null;
  priceDisplay: string;
  robuxEstimate: string;
  summary: string;
  includes: string[];
  featured?: boolean;
}

export interface SnackItem {
  id: string;
  name: string;
  category: string;
  defaultPricePkr: number;
}

export interface RobloxAccountProfile {
  username: string;
  displayName: string;
  userId: number;
  created: string;
  bio: string;
  avatarUrl: string;
  profileUrl: string;
}

export interface MemberAccount {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  robloxUsername?: string;
  membershipStatus: 'pending_payment' | 'active';
  membershipFeePkr: number;
  preferredPayment: 'PKR' | 'Robux';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SessionBooking {
  bookingId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  packageId: PackageId;
  packageLabel: string;
  packagePricePkr: number;
  gameFocus: GameFocus;
  sessionDate: string;
  timeSlot: string;
  snacks: string[];
  snacksTotalPkr: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ScheduleClosure {
  dateStr: string;
  reason: string;
  createdBy: string;
  createdAt?: unknown;
}
