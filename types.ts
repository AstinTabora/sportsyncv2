
export type SportType = 'Badminton' | 'Pickleball' | 'Basketball';

export interface Court {
  id: string;
  name: string;
  type: SportType;
  image: string;
  price: number;
  rating: number;
  location: string;
  coordinates: { lat: number; lng: number };
  mapUrl?: string;
  amenities: string[];
  description: string;
  phone?: string;
  email?: string;
}

export interface BookingDetails {
  courtId: string;
  date: string;
  timeSlot: string;
  totalAmount: number;
  userName: string;
  userEmail: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  courtId: string;
  locationName: string;
  address: string;
  description: string;
  registrationFee: string;
  participants: number;
  icon: string;
}
