export interface Property {
  id: string;
  country: string;
  state: string;
  address: string;
  email: string;
  phone: string;
  pricePerNight: number;
  description: string;
  availableTill: Date;
  images: string[];
  videos: string[];
  CationFee: number;
  postedDate: Date;
  expiresAt: Date;
  isActive: boolean;
  createdBy: string;
}
