
import { Court, CommunityEvent } from './types';

export const COURTS: Court[] = [
  {
    id: 'c1',
    name: 'Smash Ville Fitness Center',
    type: 'Badminton',
    image: 'https://picsum.photos/seed/badminton1/800/600',
    price: 350,
    rating: 4.8,
    location: '31 T.Monteverde St, Poblacion District, Davao City, 8000 Davao del Sur',
    coordinates: { lat: 7.0738, lng: 125.6206 },
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.4487355590404!2d125.6206634745354!3d7.073858392928862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d9652d3e113%3A0x5279cba81601055f!2sSmash%20Ville%20Fitness%20Center!5e0!3m2!1sen!2sph!4v1772108882457!5m2!1sen!2sph",
    amenities: ['Locker Rooms', 'Pro Shop', 'Cafe'],
    description: 'Premier indoor badminton facility with professional-grade flooring and lighting.',
    phone: '+63 82 221 1234',
    email: 'contact@smashville.ph'
  },
  {
    id: 'c2',
    name: 'The Pickle Loft',
    type: 'Pickleball',
    image: 'https://picsum.photos/seed/pickleball1/800/600',
    price: 300,
    rating: 4.6,
    location: 'University of Mindanao Dr, Talomo, Davao City, Davao del Sur',
    coordinates: { lat: 7.0644, lng: 125.5967 },
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d494.9412219687384!2d125.59673685266986!3d7.0644019234539295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d6362c41db1%3A0xcb1e8b779d4d959a!2sUniversity%20of%20Mindanao%20Dr%2C%20Talomo%2C%20Davao%20City%2C%20Davao%20del%20Sur!5e0!3m2!1sen!2sph!4v1772108188373!5m2!1sen!2sph",
    amenities: ['Equipment Rental', 'Water Station'],
    description: 'Modern pickleball courts with a vibrant community atmosphere.',
    phone: '+63 82 297 5678',
    email: 'play@thepickleloft.ph'
  },
  {
    id: 'c3',
    name: 'Evergold Recreation Center',
    type: 'Basketball',
    image: 'https://picsum.photos/seed/basketball1/800/600',
    price: 400,
    rating: 4.9,
    location: 'Iñigo St, Obrero, Davao City, Davao del Sur',
    coordinates: { lat: 7.0875, lng: 125.6137 },
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.331490054907!2d125.61374897453554!3d7.087517392915517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96daf20097833%3A0x8d4139b09a4432b8!2sEvergold%20Recreation%20Center!5e0!3m2!1sen!2sph!4v1772109577059!5m2!1sen!2sph",
    amenities: ['Showers', 'Bleachers', 'Scoreboard'],
    description: 'Full-sized hardwood basketball court perfect for team practice and pickup games.',
    phone: '+63 82 225 9012',
    email: 'info@evergold.ph'
  },
  {
    id: 'c4',
    name: 'Badminton World',
    type: 'Badminton',
    image: 'https://picsum.photos/seed/badminton2/800/600',
    price: 350,
    rating: 4.7,
    location: 'Avanceña St, Poblacion District, Davao City, 8000 Davao del Sur',
    coordinates: { lat: 7.0771, lng: 125.6032 },
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.420188699609!2d125.60329407453548!3d7.077186492925669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d74cb88e44b%3A0xc2f9df780221f68d!2sBadminton%20World!5e0!3m2!1sen!2sph!4v1772109325225!5m2!1sen!2sph",
    amenities: ['Coach available', 'Parking'],
    description: 'Elite training center specializing in badminton player development.',
    phone: '+63 82 224 3456',
    email: 'hello@badmintonworld.ph'
  },
  {
    id: 'c5',
    name: 'Crisron Pickle Ball Court',
    type: 'Pickleball',
    image: 'https://picsum.photos/seed/pickleball2/800/600',
    price: 250,
    rating: 4.5,
    location: '168 Don Julian Rodriguez Sr. Ave, Talomo, Davao City, Davao del Sur',
    coordinates: { lat: 7.0993, lng: 125.5787 },
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.2301273042276!2d125.57871967453565!3d7.099304992903959!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d005d6cb097%3A0x8302b886d65d3949!2sCrisron%20pickle%20ball%20court%20(8%20court)!5e0!3m2!1sen!2sph!4v1772108501569!5m2!1sen!2sph",
    amenities: ['Benches', 'Night Lighting'],
    description: 'Affordable outdoor courts with excellent night lighting and a friendly neighborhood vibe.',
    phone: '+63 82 298 7890',
    email: 'support@crisron.ph'
  }
];

export const COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    id: 'e1',
    title: 'City Smash',
    date: 'JUN 15, 2026',
    courtId: 'c1',
    locationName: 'Smash Ville Fitness Center',
    address: '31 T.Monteverde St, Poblacion District, Davao City',
    description: 'Join the biggest local badminton tournament in Davao City. Open to all skill levels with pro categorization. Cash prizes for winners!',
    registrationFee: '₱500',
    participants: 45,
    icon: 'fa-trophy'
  },
  {
    id: 'e2',
    title: 'Open Masters',
    date: 'JUN 22, 2026',
    courtId: 'c2',
    locationName: 'The Pickle Loft',
    address: 'University of Mindanao Dr, Talomo, Davao City',
    description: 'Compete in the Open Masters pickleball event. A great way to meet the local community and test your skills.',
    registrationFee: '₱450',
    participants: 32,
    icon: 'fa-medal'
  },
  {
    id: 'e3',
    title: 'Elite 3v3',
    date: 'JUL 05, 2026',
    courtId: 'c3',
    locationName: 'Evergold Recreation Center',
    address: 'Iñigo St, Obrero, Davao City',
    description: 'Gather your squad for an intense 3v3 basketball showdown. Full-court action with certified referees.',
    registrationFee: '₱1200/team',
    participants: 24,
    icon: 'fa-basketball'
  },
  {
    id: 'e4',
    title: 'Legacy Cup',
    date: 'JUL 18, 2026',
    courtId: 'c4',
    locationName: 'Badminton World',
    address: 'Avanceña St, Poblacion District, Davao City',
    description: 'The annual Legacy Cup is back! Experience elite competition at Badminton World. Register early to secure your spot.',
    registrationFee: '₱600',
    participants: 60,
    icon: 'fa-trophy'
  }
];
