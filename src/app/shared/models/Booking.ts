export interface Booking {
  id: string;
  propertyId: string;
  userEmail: string;
  userPhone: string;
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}
