export interface SponsorItem {
  login: string;
  name: string;
  avatarUrl: string;
  monthlyPriceInDollars: number;
  isOneTime: boolean;
  tierName: string;
  createdAt: string;
}

export interface SponsorStats {
  username: string;
  name: string;
  avatarUrl: string;
  totalSponsorsCount: number;
  totalMonthlyEstimatedDollars: number;
  monthlySponsorsCount: number;
  oneTimeSponsorsCount: number;
  sponsorsGivenCount: number;
  sponsors: SponsorItem[];
}
