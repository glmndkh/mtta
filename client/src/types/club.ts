
export interface Club {
  id: string;
  name: string;
  logoUrl?: string;
  verified?: boolean;
  city?: string;
  district?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  status?: 'active' | 'inactive';
  description?: string;
  address?: string;
  schedule?: string;
  trainingInfo?: string;
  ownerId?: string;
  ownerName?: string;
  coaches?: string[];
  tags?: string[];
  openingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean }
  };
  colorTheme?: string;
  extraData?: any;
  createdAt: string;
}
