
export interface Club {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
  city: string;
  district: string;
  type: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  description?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  schedule?: string;
  training?: string;
  coaches?: string[];
  equipment?: string[];
  rating?: number;
  createdAt: string;
}
