// Chain related types
export interface Chain {
  chainId: string;
  chainName: string;
  chainLogoUri?: string;
  description?: string;
  subnetId?: string;
  platformChainId?: string;
  tps: {
    value: number;
    timestamp: number;
  } | null;
  validators: Validator[];
  networkToken?: {
    name: string;
    symbol: string;
    logoUri?: string;
  };
  explorerUrl?: string;
}

export interface Validator {
  address: string;
  active: boolean;
  uptime: number;
  weight: number;
  explorerUrl?: string;
}

// TVL related types
export interface TVLHistory {
  date: number;
  tvl: number;
}

export interface TVLHealth {
  lastUpdate: string;
  ageInHours: number;
  tvl: number;
  status: 'healthy' | 'stale';
}

// TPS related types
export interface NetworkTPS {
  totalTps: number;
  chainCount: number;
  timestamp: number;
  lastUpdate: string;
  dataAge: number;
  dataAgeUnit: string;
  updatedAt: string;
}

export interface TPSHistory {
  timestamp: number;
  totalTps: number;
  chainCount: number;
  date: number;
}

// Health related types
export interface HealthStatus {
  status: string;
  timestamp: number;
}

// Teleporter message types
export interface TeleporterMessage {
  source: string;
  target: string;
  count: number;
}

export interface TeleporterMessageData {
  messages: TeleporterMessage[];
  metadata: {
    totalMessages: number;
    startDate: string;
    endDate: string;
    updatedAt: string;
  };
}

export interface TeleporterDailyMessage {
  sourceChain: string;
  destinationChain: string;
  messageCount: number;
}

export interface TeleporterDailyData {
  date: string;
  dateString: string;
  data: TeleporterDailyMessage[];
  totalMessages: number;
  timeWindow: number;
}

export type TimeframeOption = 7 | 14 | 30;