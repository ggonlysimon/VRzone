import type {RobloxAccountProfile, SnackItem, VrPackage} from '../types';

export const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4';

export const VRZONE_LOCATION = {
  brand: 'VRzone',
  house: 'House 113',
  street: 'Street 16, Bella Road',
  sector: 'Sector G-10/1',
  landmark: 'Near Petrol Pump',
  city: 'Islamabad',
  country: 'Pakistan',
  fullAddress:
    'House 113, Street 16, Bella Road (near petrol pump), Sector G-10/1, Islamabad, Pakistan',
  placeQuery: 'Street 16 Bella Road Sector G-10/1 Islamabad Pakistan',
};

export const STUDIO_ADMIN_EMAIL = 'linksundas981@gmail.com';
export const PRIVATE_ACCOUNT_FEE_PKR = 1300;

export const OPERATING_HOURS = [
  {
    days: 'Monday – Thursday',
    hours: '3:00 PM – 7:00 PM',
    slots: ['3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM'],
  },
  {
    days: 'Friday – Sunday',
    hours: '2:00 PM – 8:00 PM',
    slots: [
      '2:00 PM',
      '2:30 PM',
      '3:00 PM',
      '3:30 PM',
      '4:00 PM',
      '4:30 PM',
      '5:00 PM',
      '5:30 PM',
      '6:00 PM',
      '6:30 PM',
      '7:00 PM',
      '7:30 PM',
    ],
  },
];

export const VR_PACKAGES: VrPackage[] = [
  {
    id: '15m',
    duration: '15 Minutes',
    title: 'Quick Dive',
    pricePkr: 250,
    priceDisplay: 'PKR 250',
    robuxEstimate: 'Robux accepted',
    summary: 'Short high-intensity VR run or warm-up match.',
    includes: ['Full VR headset & tracking setup', 'Access to Roblox VR or Minecraft VR', 'Custom snack add-ons available'],
  },
  {
    id: '30m',
    duration: '30 Minutes',
    title: 'Standard Run',
    pricePkr: 500,
    priceDisplay: 'PKR 500',
    robuxEstimate: 'Robux accepted',
    summary: 'Half-hour dedicated private room VR session.',
    includes: ['30 mins uninterrupted VR play', 'Switch between available VR templates', 'Custom snack add-ons available'],
  },
  {
    id: '1h',
    duration: '1 Hour',
    title: 'Full Hour',
    pricePkr: 1250,
    priceDisplay: 'PKR 1,250',
    robuxEstimate: 'Robux accepted',
    summary: 'Complete 60-minute deep VR session for solo or co-op.',
    includes: ['60 mins dedicated VR gaming', 'Full library access (Roblox, Minecraft & VR)', 'Custom snack add-ons available'],
  },
  {
    id: '3h',
    duration: '3 Hours',
    title: 'Marathon Pass',
    pricePkr: 2500,
    priceDisplay: 'PKR 2,500',
    robuxEstimate: 'Robux accepted',
    summary: 'Three full hours for long raids, Rivals matches, and world-building.',
    includes: ['180 mins excessive VR gaming', 'All current VR templates included', 'Priority seating & snack service'],
  },
  {
    id: 'pro5h',
    duration: '5 Hours',
    title: 'Pro All-Inclusive',
    pricePkr: null,
    priceDisplay: 'Custom Pro Rate',
    robuxEstimate: 'PKR or Robux',
    summary: 'Five full hours with everything included — plus 5 free snacks on the house.',
    includes: [
      '5 full hours of excessive VR gaming',
      'Everything included across all templates',
      '5 free snacks included at no extra charge',
      'Early access priority when PS5 launches in December',
    ],
    featured: true,
  },
];

export const SNACK_MENU: SnackItem[] = [
  {id: 'fries', name: 'Crispy Seasoned Fries', category: 'Hot Snack', defaultPricePkr: 250},
  {id: 'nachos', name: 'Loaded Tortilla Chips & Dip', category: 'Savory', defaultPricePkr: 300},
  {id: 'chocolate', name: 'Chocolate Bar', category: 'Sweet', defaultPricePkr: 180},
  {id: 'soda', name: 'Chilled Sparkling Soda', category: 'Drink', defaultPricePkr: 150},
  {id: 'water', name: 'Mineral Water (500ml)', category: 'Drink', defaultPricePkr: 80},
];

// Verified via Roblox public Users API (https://users.roblox.com/v1/usernames/users)
export const ROBLOX_PAYMENT_ACCOUNTS: RobloxAccountProfile[] = [
  {
    username: 'Ibirahim60',
    displayName: 'iBBy_PrO67',
    userId: 7142771854,
    created: 'Jul 31, 2024',
    bio: 'i only play RIVALS so y',
    avatarUrl:
      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-E3530109F5D2C625CCC044C343524C0A-Png/150/150/AvatarHeadshot/Png/noFilter',
    profileUrl: 'https://www.roblox.com/users/7142771854/profile',
  },
  {
    username: 'Abdd332211',
    displayName: 'Rivalspro67',
    userId: 7687458709,
    created: 'Dec 11, 2024',
    bio: 'I’m aura not noob',
    avatarUrl:
      'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-6631DE798CE5A33722655DCB9572F006-Png/150/150/AvatarHeadshot/Png/noFilter',
    profileUrl: 'https://www.roblox.com/users/7687458709/profile',
  },
];

export const GENERATED_IMAGES = {
  vrLounge: '/src/assets/images/vr_gaming_lounge_1794840541820.jpg',
  ps5Preview: '/src/assets/images/ps5_december_preview_1794840542835.jpg',
  snackBar: '/src/assets/images/vrzone_snack_bar_1794840542521.jpg',
};
