
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { COURTS } from './constants';
import { Court, SportType } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, startOfDay, isToday, addDays } from 'date-fns';
import emailjs from '@emailjs/browser';

const EMAILJS = {
  serviceId: 'service_s7c5i2j',
  publicKey: 'qKw3YTXia-UqdC7Po',
  templates: {
    bookingAndRegistration: 'template_0g8xhgv',
  },
};

// Lazy load the entire Map component to keep initial bundle small
const MapComponent = lazy(() => import('./components/MapComponent'));

const MapSkeleton = () => (
  <div className="w-full h-[400px] bg-slate-100 rounded-3xl flex items-center justify-center animate-pulse border border-slate-200">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto flex items-center justify-center">
        <i className="fas fa-map-marked-alt text-slate-300 text-xl"></i>
      </div>
      <div className="h-2 w-24 bg-slate-200 rounded mx-auto"></div>
    </div>
  </div>
);

// SportSync Bot - AI Assistant

const Logo = () => (
  <div className="flex items-center gap-2 md:gap-3 font-black text-lg md:text-2xl tracking-tighter cursor-pointer group">
    <div className="w-8 h-8 md:w-11 md:h-11 bg-primary rounded-lg md:rounded-xl flex items-center justify-center text-white group-hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
      <i className="fas fa-bolt text-xs md:text-lg"></i>
    </div>
    <span className="text-primary group-hover:text-primary-dark transition-colors uppercase font-black">SportSync</span>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [filter, setFilter] = useState<SportType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'courts' | 'rating'>('default');
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<{court: string, time: string}[]>([]);
  const [bookingStep, setBookingStep] = useState<'details' | 'calendar' | 'payment' | 'success' | 'confirmation'>('details');
  const [detailSubTab, setDetailSubTab] = useState<'map' | 'photos' | 'pricing' | 'availability'>('map');
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<{facilityId: string, date: string, court: string, time: string}[]>([
    { facilityId: 'c1', date: format(new Date(), 'yyyy-MM-dd'), court: 'Court 1', time: '9:00 AM - 10:00 AM' },
    { facilityId: 'c1', date: format(new Date(), 'yyyy-MM-dd'), court: 'Court 2', time: '10:00 AM - 11:00 AM' },
    { facilityId: 'c2', date: format(new Date(), 'yyyy-MM-dd'), court: 'Court 3', time: '2:00 PM - 3:00 PM' },
  ]);
  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'cash' | null>(null);
  const [bookingRefCode, setBookingRefCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const browseRef = useRef<HTMLDivElement>(null);
  const exploreCourtsRef = useRef<HTMLDivElement>(null);
  const courtsGridRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sportsync_user');
    if (saved) {
      try {
        const { name, email, phone } = JSON.parse(saved);
        if (name) setUserName(name);
        if (email) setUserEmail(email);
        if (phone) setUserPhone(phone);
      } catch {}
    }
  }, []);

  const filteredCourts = COURTS.filter(c =>
    (filter === 'All' || c.type === filter) &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortBy === 'price') return (a.price - b.price) * dir;
    if (sortBy === 'courts') return ((b.numberOfCourts || 0) - (a.numberOfCourts || 0)) * dir;
    if (sortBy === 'rating') return (b.rating - a.rating) * dir;
    return 0;
  });

  const scrollToBrowse = () => {
    browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court);
    setSelectedSlots([]);
    setActiveTab('booking');
    setBookingStep('details');
    setPaymentMethod(null);
    setBookingRefCode('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderHome = () => (
    <div className="space-y-20 animate-in fade-in duration-700">
      {/* Hero Section - full bleed */}
      <section className="relative h-[650px] md:h-[950px] overflow-hidden flex items-center justify-center text-center p-4 md:p-8 -mt-[7rem] md:-mt-[11rem] pt-[7rem] md:pt-[0rem]" style={{width: '100vw', marginLeft: 'calc(-50vw + 50%)'}}>
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" style={{backgroundImage: 'url("/images/hero-bg.webp")'}}></div>
        <div className="absolute inset-0 bg-[#001F12]/50 backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-4xl space-y-10 px-4">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter uppercase">Plan Less <br/>Play More.</h1>
            <p className="text-white/90 text-xs md:text-xl font-medium max-w-xl mx-auto leading-snug md:leading-relaxed tracking-wide">Book premium Badminton, Pickleball, and Basketball courts in a few clicks.</p>
          </div>
          <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1.5 md:p-3 shadow-2xl max-w-md md:max-w-xl mx-auto group focus-within:ring-4 focus-within:ring-white/20 transition-all border border-white/20">
            <input
              type="text"
              placeholder="Search locations..."
              className="flex-1 px-4 md:px-6 outline-none text-white placeholder:text-white/60 font-bold bg-transparent text-sm md:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={scrollToBrowse}
              className="bg-white text-primary px-5 md:px-12 py-3 md:py-5 rounded-full font-black hover:bg-primary-extralight transition active:scale-95 shadow-xl text-[10px] md:text-sm uppercase tracking-[0.2em]"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* How It Works - overlapping hero */}
      <section className="relative z-10 -mt-[10rem] md:-mt-[14rem] bg-white rounded-2xl md:rounded-[3rem] shadow-[0_0_60px_20px_rgba(255,255,255,0)] md:shadow-[0_0_100px_40px_rgba(255,255,255,0)] py-8 px-6 md:py-16 md:px-12 lg:py-16 lg:px-16 overflow-hidden">

        {/* Desktop: horizontal timeline with curved line */}
        <div className="hidden md:block relative">
          {/* Curved connecting line behind the icons */}
          <svg className="absolute left-0 right-0 top-1/2 -translate-y-[60%] w-full h-24 pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none" fill="none">
            <path d="M 220 50 Q 360 10, 500 50 Q 640 90, 780 50" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          <div className="flex items-center justify-center relative z-10">
            {[
              { icon: 'fa-table-tennis-paddle-ball', title: 'Pick a Sport' },
              { icon: null, img: '/icons/court.png', title: 'Choose a Court' },
              { icon: null, img: '/icons/appointment.png', title: 'Book Your Slot' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-5 px-8 lg:px-14">
                <div className="flex items-center justify-center mx-auto">
                  {item.img ? <img src={item.img} alt={item.title} className="h-12 lg:h-[4.5rem]" style={{filter: 'brightness(0) saturate(100%) invert(22%) sepia(95%) saturate(1200%) hue-rotate(100deg) brightness(0.85)'}} /> : <i className={`fas ${item.icon} text-5xl lg:text-7xl text-primary`}></i>}
                </div>
                <h3 className="font-black text-lg lg:text-2xl text-primary uppercase tracking-tight">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: horizontal with curved line */}
        <div className="block md:hidden relative">
          {/* Curved connecting line behind the icons */}
          <svg className="absolute left-0 right-0 top-1/2 -translate-y-[65%] w-full h-16 pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none" fill="none">
            <path d="M 200 50 Q 350 15, 500 50 Q 650 85, 800 50" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </svg>
          <div className="flex items-center justify-center relative z-10">
            {[
              { icon: 'fa-table-tennis-paddle-ball', title: 'Pick a Sport' },
              { icon: null, img: '/icons/court.png', title: 'Choose a Court' },
              { icon: null, img: '/icons/appointment.png', title: 'Book Your Slot' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-2.5 px-3 flex-1">
                <div className="flex items-center justify-center mx-auto">
                  {item.img ? <img src={item.img} alt={item.title} className="h-8" style={{filter: 'brightness(0) saturate(100%) invert(22%) sepia(95%) saturate(1200%) hue-rotate(100deg) brightness(0.85)'}} /> : <i className={`fas ${item.icon} text-3xl text-primary`}></i>}
                </div>
                <h3 className="font-black text-[10px] text-primary uppercase tracking-tight leading-tight">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courts Listing */}
      <section ref={browseRef} className="space-y-12 scroll-mt-28 pb-16">
        <div ref={exploreCourtsRef} className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8 bg-primary-extralight p-6 md:p-12 rounded-2xl md:rounded-[4rem] shadow-sm border border-primary/5">
          <div className="text-center lg:text-left">
             <h2 className="text-3xl md:text-5xl font-black text-primary tracking-tighter uppercase">Explore Courts</h2>
             <p className="text-primary/60 font-bold text-sm md:text-lg">Premium courts for every skill level.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1 md:gap-2 bg-white p-1.5 md:p-2 rounded-2xl md:rounded-[2.5rem] border border-primary/10 shadow-xl shadow-primary/5">
            {['All', 'Badminton', 'Pickleball', 'Basketball'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-4 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[2rem] text-xs md:text-sm font-black transition-all duration-500 ${filter === s ? 'bg-primary text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-primary'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end gap-2">
          <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest mr-1">Sort by</span>
          {([
            { value: 'default', label: 'Default' },
            { value: 'price', label: 'Price' },
            { value: 'courts', label: 'Courts' },
            { value: 'rating', label: 'Rating' },
          ] as const).map(s => (
            <button
              key={s.value}
              onClick={() => {
                if (sortBy === s.value && s.value !== 'default') {
                  setSortAsc(!sortAsc);
                } else {
                  setSortBy(s.value);
                  setSortAsc(true);
                }
              }}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1 ${sortBy === s.value ? 'bg-primary text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-primary border border-slate-100'}`}
            >
              {s.label}
              {sortBy === s.value && s.value !== 'default' && (
                <i className={`fas fa-arrow-${sortAsc ? 'up' : 'down'} text-[7px] md:text-[8px]`}></i>
              )}
            </button>
          ))}
        </div>

        <div ref={courtsGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourts.map(court => {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const timeSlotCount = 16;
            const bookedToday = bookedSlots.filter(s => s.facilityId === court.id && s.date === todayStr).length;
            const availableToday = Math.max(0, (court.numberOfCourts || 1) * timeSlotCount - bookedToday);
            return (
              <CourtCard
                key={court.id}
                court={court}
                availableToday={availableToday}
                onBook={() => handleCourtSelect(court)}
                onQuickBook={() => {
                  setSelectedCourt(court);
                  setSelectedSlots([]);
                  setActiveTab('booking');
                  setBookingStep('calendar');
                  setPaymentMethod(null);
                  setBookingRefCode('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-10 md:space-y-32 animate-in fade-in duration-1000 pb-20">
      {/* Slide 1: Title Slide */}
      <section className="text-center py-8 md:py-24 space-y-5 md:space-y-10">
        <div className="w-14 h-14 md:w-24 md:h-24 bg-primary text-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 md:mb-8">
          <i className="fas fa-bolt text-xl md:text-4xl"></i>
        </div>
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-3xl md:text-8xl font-black text-primary tracking-tighter uppercase">SportSync</h1>
          <p className="text-slate-400 text-xs md:text-3xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">Seamless Booking for Active Lifestyles</p>
        </div>
        <div className="flex justify-center gap-6 md:gap-12 pt-4 md:pt-10 text-slate-300 font-black text-[9px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em]">
           <span>Team Venture</span>
           <span className="text-primary">•</span>
           <span>EST. 2026</span>
        </div>
      </section>

      {/* Slide 2: The Problem & Solution */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12">
        <div className="bg-slate-50 p-5 md:p-16 rounded-2xl md:rounded-[4rem] border border-slate-100 space-y-3 md:space-y-8">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <span className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest self-start">The Problem</span>
            <h2 className="text-xl md:text-5xl font-black text-primary uppercase tracking-tighter">Friction in Play</h2>
          </div>
          <p className="text-slate-500 text-sm md:text-xl font-medium leading-relaxed">
            Booking local courts (Badminton, Pickleball, Basketball) is tedious. Relies on outdated Facebook searches, endless manual calls, and insecure bank transfers.
          </p>
          <div className="w-8 md:w-12 h-1 bg-primary/20 rounded-full"></div>
        </div>
        <div className="bg-white p-5 md:p-16 rounded-2xl md:rounded-[4rem] border-2 md:border-4 border-primary space-y-3 md:space-y-8 shadow-xl md:shadow-2xl">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <span className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest self-start">The Solution</span>
            <h2 className="text-xl md:text-5xl font-black text-primary uppercase tracking-tighter">Centralized Flow</h2>
          </div>
          <p className="text-slate-500 text-sm md:text-xl font-medium leading-relaxed">
            A centralized web platform for instant, real-time booking. Connecting athletes with facility owners seamlessly without the administrative headache.
          </p>
          <div className="w-8 md:w-12 h-1 bg-primary rounded-full"></div>
        </div>
      </section>

      {/* Slide 3: Team Setup */}
      <section className="space-y-6 md:space-y-12">
        <div className="text-center space-y-2 md:space-y-4">
          <h2 className="text-2xl md:text-5xl font-black text-primary uppercase tracking-tighter">Team Venture</h2>
          <p className="text-slate-400 font-bold text-xs md:text-base">Ensuring a smooth experience from login to checkout.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8 max-w-4xl mx-auto">
           <div className="bg-white p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-4 md:gap-8 group hover:border-primary transition-all">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-50 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
                <i className="fas fa-user-ninja text-lg md:text-3xl"></i>
              </div>
              <div>
                <h3 className="text-base md:text-2xl font-black text-primary uppercase">Astin Tabora</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mt-0.5 md:mt-1">Frontend & Design Lead</p>
              </div>
           </div>
           <div className="bg-white p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-4 md:gap-8 group hover:border-primary transition-all">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-50 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
                <i className="fas fa-database text-lg md:text-3xl"></i>
              </div>
              <div>
                <h3 className="text-base md:text-2xl font-black text-primary uppercase">Matthew Jariol</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mt-0.5 md:mt-1">Backend & Systems Architect</p>
              </div>
           </div>
        </div>
      </section>

      {/* Slide 4: AI Integration & SDG */}
      <section className="bg-primary p-5 md:p-20 rounded-2xl md:rounded-[5rem] text-white relative overflow-hidden border border-primary-dark shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
          <div className="space-y-6 md:space-y-10">
            <div className="space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-6xl font-black uppercase tracking-tighter leading-none">AI Powered<br/>Design.</h2>
              <p className="text-white/80 text-sm md:text-xl font-medium">Utilizing Gemini AI to refine code, improve workflow efficiency, and ensure clean final output.</p>
            </div>
            <div className="flex gap-8 md:gap-12 pt-2 md:pt-4">
              <div className="space-y-1.5 md:space-y-2">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Refinement</p>
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-6 md:w-8 h-1.5 md:h-2 bg-white rounded-full"></div>
                  <div className="w-6 md:w-8 h-1.5 md:h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Efficiency</p>
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-6 md:w-8 h-1.5 md:h-2 bg-white rounded-full"></div>
                  <div className="w-6 md:w-8 h-1.5 md:h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-3xl p-5 md:p-16 rounded-2xl md:rounded-[4rem] border border-white/20 space-y-4 md:space-y-8">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-white text-primary rounded-xl md:rounded-[2rem] flex items-center justify-center shadow-2xl">
              <i className="fas fa-heartbeat text-xl md:text-3xl"></i>
            </div>
            <h3 className="text-lg md:text-4xl font-black uppercase tracking-tighter">SDG Goal #3</h3>
            <p className="text-white/80 text-sm md:text-lg font-medium">Good Health and Well-being. Encouraging physical activity by removing booking friction across local communities.</p>
          </div>
        </div>
      </section>

      {/* Slide 5: Market & Users */}
      <section className="space-y-8 md:space-y-16">
        <div className="text-center space-y-2 md:space-y-4 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-5xl font-black text-primary uppercase tracking-tighter">Market & Personas.</h2>
          <p className="text-slate-400 font-bold text-xs md:text-base">Rising popularity of modern sports vs. outdated pen-and-paper scheduling.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
           <div className="space-y-3 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-primary-extralight rounded-xl md:rounded-2xl flex items-center justify-center border border-primary/10 text-primary flex-shrink-0">
                   <i className="fas fa-users text-base md:text-2xl"></i>
                </div>
                <h4 className="text-base md:text-2xl font-black text-primary uppercase">The Players</h4>
              </div>
              <div className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-primary font-black uppercase text-[10px] md:text-xs mb-1 md:mb-2 tracking-widest">Persona: Student Alex</p>
                <p className="text-slate-500 font-medium leading-relaxed text-xs md:text-base">Hobbyist athlete looking for quick pickup games between classes. Values speed and mobile access.</p>
              </div>
           </div>
           <div className="space-y-3 md:space-y-6">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-primary-extralight rounded-xl md:rounded-2xl flex items-center justify-center border border-primary/10 text-primary flex-shrink-0">
                   <i className="fas fa-store text-base md:text-2xl"></i>
                </div>
                <h4 className="text-base md:text-2xl font-black text-primary uppercase">The Owners</h4>
              </div>
              <div className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-primary font-black uppercase text-[10px] md:text-xs mb-1 md:mb-2 tracking-widest">Persona: Manager Mike</p>
                <p className="text-slate-500 font-medium leading-relaxed text-xs md:text-base">Local business owner needing streamlined schedule management. Values reliability and payment security.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Slide 6: Key Features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8">
        {[
          { label: 'Calendar', icon: 'fa-calendar-check', desc: 'Real-time sync' },
          { label: 'Maps', icon: 'fa-location-arrow', desc: 'Geo-integration' },
          { label: 'Payments', icon: 'fa-shield-halved', desc: 'Secure checkout' },
          { label: 'Community', icon: 'fa-trophy', desc: 'Tournament brackets' }
        ].map(f => (
          <div key={f.label} className="text-center space-y-2 md:space-y-6 p-3 md:p-8 bg-white border border-slate-100 rounded-xl md:rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
             <div className="w-10 h-10 md:w-20 md:h-20 bg-slate-50 rounded-lg md:rounded-[1.5rem] mx-auto flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
               <i className={`fas ${f.icon} text-base md:text-3xl`}></i>
             </div>
             <div className="space-y-1 md:space-y-2">
               <h5 className="font-black text-xs md:text-lg uppercase text-primary">{f.label}</h5>
               <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-300 tracking-widest">{f.desc}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Slide 7: Roadmap & Goals */}
      <section className="bg-slate-50 p-5 md:p-20 rounded-2xl md:rounded-[5rem] border border-slate-100 space-y-6 md:space-y-16">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-12">
          <div className="space-y-2 md:space-y-4 text-center lg:text-left">
             <h2 className="text-2xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-none">Strategic<br/>Growth.</h2>
             <p className="text-slate-400 font-bold text-xs md:text-xl uppercase tracking-widest">Target: Digitize 50% of local courts.</p>
          </div>
          <div className="bg-white p-5 md:p-12 rounded-2xl md:rounded-[4rem] border border-slate-200 shadow-sm flex-1 max-w-xl w-full">
             <h4 className="text-primary font-black uppercase text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] mb-5 md:mb-10">Release Criteria</h4>
             <ul className="space-y-3 md:space-y-6 font-black text-primary uppercase text-xs md:text-sm tracking-tighter">
                <li className="flex items-center gap-3 md:gap-4"><i className="fas fa-circle-check text-emerald-500"></i> Seamless Search-to-Booking Flow</li>
                <li className="flex items-center gap-3 md:gap-4"><i className="fas fa-circle-check text-emerald-500"></i> Confirmation Email &lt; 2 Minutes</li>
                <li className="flex items-center gap-3 md:gap-4"><i className="fas fa-circle-check text-emerald-500"></i> Zero-Error Checkout Rate</li>
             </ul>
          </div>
        </div>
      </section>
    </div>
  );

  const renderBookingFlow = () => {
    if (!selectedCourt) return null;

    if (bookingStep === 'details') {
      return (
        <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500 space-y-6 md:space-y-8 pb-20 px-1 md:px-0">
          <button onClick={() => setActiveTab('home')} className="group flex items-center text-slate-400 hover:text-primary font-black transition-colors uppercase text-[10px] md:text-xs tracking-widest">
            <i className="fas fa-arrow-left mr-2 md:mr-3 group-hover:-translate-x-2 transition-transform"></i> Back to Listing
          </button>

          <div className="bg-white rounded-2xl md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 md:p-16 space-y-6 md:space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-5 md:gap-8">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex gap-2 md:gap-3">
                    <span className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-100 text-primary font-black rounded-lg md:rounded-xl text-[9px] md:text-[10px] uppercase tracking-[0.2em] border border-slate-200">{selectedCourt.type}</span>
                    <div className="flex items-center text-primary text-[10px] md:text-xs font-black bg-slate-50 px-2.5 md:px-3 rounded-lg md:rounded-xl border border-slate-100">
                      <i className="fas fa-star mr-1.5 md:mr-2"></i> {selectedCourt.rating}
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-5xl font-black text-primary leading-tight tracking-tight">{selectedCourt.name}</h2>
                  <p className="text-slate-500 flex items-start font-bold text-xs md:text-lg"><i className="fas fa-map-pin mr-2 md:mr-3 text-primary mt-0.5 md:mt-1"></i>{selectedCourt.location}</p>
                </div>
                <div className="w-full md:w-auto text-left md:text-right space-y-2 md:space-y-4">
                  <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Starting from</p>
                  <p className="text-3xl md:text-6xl font-black text-primary tracking-tighter">₱{selectedCourt.price}<span className="text-sm md:text-xl text-slate-300 font-bold ml-1.5 md:ml-2 tracking-normal">/hr</span></p>
                  <button
                    onClick={() => setBookingStep('calendar')}
                    className="w-full bg-primary text-white px-8 md:px-12 py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black hover:bg-slate-800 transition shadow-2xl text-sm md:text-lg uppercase tracking-widest active:scale-95 mt-2 md:mt-4"
                  >
                    Book Now
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Map, Photos, Pricing, Availability */}
              <div className="border-t border-slate-100 pt-6 md:pt-10">
                <div className="flex gap-2 md:gap-4 mb-6 md:mb-8 overflow-x-auto pb-1">
                  {[
                    { id: 'map', label: 'Location', icon: 'fa-map-marked-alt' },
                    { id: 'photos', label: 'Gallery', icon: 'fa-images' },
                    { id: 'pricing', label: 'Pricing Info', icon: 'fa-tag' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailSubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${detailSubTab === tab.id ? 'bg-primary text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:text-primary'}`}
                    >
                      <i className={`fas ${tab.icon}`}></i> {tab.label}
                    </button>
                  ))}
                </div>

                <div className={`bg-slate-50 rounded-2xl md:rounded-[3rem] min-h-[250px] md:min-h-[400px] border border-slate-100 relative overflow-hidden ${detailSubTab === 'map' ? 'p-0' : 'p-4 md:p-8'}`}>
                  {detailSubTab === 'photos' && (
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4 h-full">
                      <img src={selectedCourt.image} className="w-full h-40 md:h-full object-cover rounded-xl md:rounded-3xl col-span-2 md:col-span-1" alt="Main" />
                      <div className="grid grid-cols-2 gap-2 md:gap-4 col-span-2 md:col-span-1">
                         <img src={`https://picsum.photos/seed/${selectedCourt.id}1/800/600`} className="w-full h-24 md:h-48 object-cover rounded-xl md:rounded-2xl grayscale" alt="Gallery 1" />
                         <img src={`https://picsum.photos/seed/${selectedCourt.id}2/800/600`} className="w-full h-24 md:h-48 object-cover rounded-xl md:rounded-2xl grayscale" alt="Gallery 2" />
                         <img src={`https://picsum.photos/seed/${selectedCourt.id}3/800/600`} className="w-full h-24 md:h-48 object-cover rounded-xl md:rounded-2xl grayscale" alt="Gallery 3" />
                         <div className="w-full h-24 md:h-48 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-base md:text-xl">+12</div>
                      </div>
                    </div>
                  )}
                  {detailSubTab === 'map' && (
                    <Suspense fallback={<MapSkeleton />}>
                      <MapComponent court={selectedCourt} />
                    </Suspense>
                  )}
                  {detailSubTab === 'pricing' && (
                    <div className="space-y-6 md:space-y-8 p-1 md:p-4">
                       <h3 className="text-xl md:text-3xl font-black text-primary uppercase tracking-tighter">Membership Rates</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                         {[
                           { name: 'Standard', price: selectedCourt.price, desc: 'Per hour, no commitment' },
                           { name: 'Club Member', price: Math.floor(selectedCourt.price * 0.8), desc: '20% off all bookings' },
                           { name: 'Elite Pass', price: 99, desc: 'Unlimited access monthly' }
                         ].map(p => (
                           <div key={p.name} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm hover:border-primary transition-all group">
                             <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{p.name}</p>
                             <p className="text-2xl md:text-4xl font-black text-primary tracking-tighter">₱{p.price}<span className="text-[10px] md:text-xs text-slate-300">/hr</span></p>
                             <p className="text-xs md:text-sm text-slate-400 mt-2 md:mt-4 font-medium">{p.desc}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (bookingStep === 'calendar') {
      const facilityCourts = Array.from({ length: selectedCourt?.numberOfCourts || 8 }, (_, i) => `Court ${i + 1}`);
      const timeSlots = [
        '8am - 9am', '9am - 10am', '10am - 11am', '11am - 12pm',
        '12pm - 1pm', '1pm - 2pm', '2pm - 3pm', '3pm - 4pm',
        '4pm - 5pm', '5pm - 6pm', '6pm - 7pm', '7pm - 8pm',
        '8pm - 9pm', '9pm - 10pm', '10pm - 11pm', '11pm - 12am'
      ];

      const getSlotStatus = (court: string, time: string) => {
        // Check if this time slot is in the past
        if (isToday(selectedDate)) {
          const now = new Date().getHours();
          const startHour = (() => {
            const match = time.match(/^(\d+)(am|pm)/);
            if (!match) return 0;
            let h = parseInt(match[1]);
            if (match[2] === 'pm' && h !== 12) h += 12;
            if (match[2] === 'am' && h === 12) h = 0;
            return h;
          })();
          if (startHour <= now) return 'past';
        }
        if (selectedDate < startOfDay(new Date())) return 'past';

        const isSelected = selectedSlots.some(s => s.court === court && s.time === time);
        if (isSelected) return 'selected';

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const isBooked = bookedSlots.some(s => s.facilityId === selectedCourt?.id && s.date === dateStr && s.court === court && s.time === time);
        if (isBooked) return 'booked';

        if (time.includes('10pm') || time.includes('11pm')) {
          return 'closing';
        }

        if (time.includes('5pm') || time.includes('6pm') || time.includes('7pm')) {
          if (court === 'Court 4' || court === 'Court 5' || court === 'Court 6') {
            return 'open-play';
          }
        }

        return 'available';
      };

      const toggleSlot = (court: string, time: string) => {
        setSelectedSlots(prev => {
          const exists = prev.some(s => s.court === court && s.time === time);
          if (exists) {
            return prev.filter(s => !(s.court === court && s.time === time));
          } else {
            if (prev.length >= 9) return prev; // Max 9 slots
            return [...prev, { court, time }];
          }
        });
      };

      const totalPrice = selectedSlots.length * (selectedCourt?.price || 0);

      return (
        <div className="max-w-[1200px] mx-auto animate-in slide-in-from-bottom-12 duration-500 pb-40 px-1 md:px-0">

          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-8 border border-slate-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Book a Court</h2>
                <p className="text-slate-500 mt-1 text-xs md:text-base">Select a date and time to reserve your spot.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
                {Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)).map((date, i) => {
                  const isSelected = isSameDay(date, selectedDate);
                  const dayLabel = i === 0 ? 'Today' : format(date, 'EEE');
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center px-3 md:px-4 py-2 md:py-2.5 rounded-xl border transition-all shrink-0 min-w-[52px] md:min-w-[60px]
                        ${isSelected ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}`}
                    >
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{dayLabel}</span>
                      <span className="text-base md:text-lg font-black leading-tight">{format(date, 'd')}</span>
                    </button>
                  );
                })}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex flex-col items-center px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all min-w-[52px] md:min-w-[60px]"
                  >
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">More</span>
                    <i className="fas fa-calendar text-base md:text-lg mt-0.5"></i>
                  </button>
                  {isDatePickerOpen && (
                    <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-72">
                      <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><i className="fas fa-chevron-left text-slate-400"></i></button>
                        <span className="font-bold text-slate-700">{format(currentMonth, 'MMMM yyyy')}</span>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><i className="fas fa-chevron-right text-slate-400"></i></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} className="text-[10px] font-black uppercase text-slate-400 py-1">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(date => {
                          const isSelected = isSameDay(date, selectedDate);
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                          const isPast = date < startOfDay(new Date());
                          return (
                            <button
                              key={date.toISOString()}
                              disabled={isPast}
                              onClick={() => { if (!isPast) { setSelectedDate(date); setIsDatePickerOpen(false); } }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors mx-auto
                                ${isPast ? 'text-slate-200 cursor-not-allowed' : isSelected ? 'bg-primary text-white font-bold shadow-md' : 'hover:bg-slate-100'}
                                ${!isPast && !isCurrentMonth && !isSelected ? 'text-slate-300' : ''}
                                ${!isPast && isCurrentMonth && !isSelected ? 'text-slate-700' : ''}
                              `}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm font-medium mb-6 md:mb-8">
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-slate-200 bg-white text-slate-600"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-slate-300"></div> Available</div>
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary text-white"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/20"></div> Selected</div>
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-[#00a651] text-white"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/20"></div> Booked</div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl md:rounded-2xl -mx-1 md:mx-0">
              <table className="w-full text-xs md:text-sm text-center border-collapse min-w-[700px] md:min-w-[1000px] table-fixed">
                <thead>
                  <tr>
                    <th className="p-2 md:p-4 border-b border-r border-slate-200 bg-slate-50 w-24 md:w-40 font-bold text-slate-500 uppercase text-[8px] md:text-[10px] tracking-widest sticky left-0 z-10">Time</th>
                    {facilityCourts.map(court => (
                      <th key={court} className="p-2 md:p-4 border-b border-r border-slate-200 bg-white font-black text-slate-800 text-[10px] md:text-sm">{court}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="p-1.5 md:p-3 border-b border-r border-slate-200 bg-white text-[8px] md:text-[10px] font-bold text-slate-500 whitespace-nowrap sticky left-0 z-10">{time}</td>
                      {facilityCourts.map(court => {
                        const status = getSlotStatus(court, time);
                        
                        let cellClasses = "p-1 md:p-2 border-b border-r border-slate-200 relative cursor-pointer transition-colors h-10 md:h-16 ";
                        let content = null;
                        
                        if (status === 'past') {
                          cellClasses += "bg-slate-50 cursor-not-allowed";
                        } else if (status === 'selected') {
                          cellClasses += "bg-primary border-primary";
                          content = <i className="fas fa-check text-white text-xl"></i>;
                        } else if (status === 'booked') {
                          cellClasses += "bg-[#e6f7ed] border-[#00a651] cursor-not-allowed";
                          content = <div className="text-[#00a651] text-[10px] font-bold flex items-center justify-center gap-1"><i className="far fa-clock"></i> {time}</div>;
                        } else if (status === 'open-play') {
                          cellClasses += "bg-[#f4e6ff] border-[#a855f7] cursor-not-allowed";
                          content = <div className="text-[#a855f7] text-[10px] font-bold uppercase tracking-widest">Open-Play</div>;
                        } else if (status === 'closing') {
                          cellClasses += "bg-[#f8fafc] cursor-not-allowed";
                          content = <div className="text-slate-400 text-[10px] font-bold flex flex-col"><span>Closing Session</span><span className="font-normal">(1 hr)</span></div>;
                        } else {
                          cellClasses += "bg-white hover:bg-slate-50";
                        }
                        
                        return (
                          <td 
                            key={`${court}-${time}`} 
                            className={cellClasses}
                            onClick={() => {
                              if (status === 'available' || status === 'selected') {
                                toggleSlot(court, time);
                              }
                            }}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating Action Bar */}
          <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl md:rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-3 md:p-6 flex items-center gap-4 md:gap-12 z-50 animate-in slide-in-from-bottom-8 w-[calc(100%-1.5rem)] md:w-auto max-w-lg md:max-w-none">
            <button onClick={() => setBookingStep('details')} className="absolute top-2 md:top-4 right-3 md:right-4 text-slate-400 hover:text-slate-600">
              <i className="fas fa-times text-xs md:text-base"></i>
            </button>
            <div className="min-w-0">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 md:mb-1">Selected Slots</p>
              <div className="flex items-baseline gap-1.5 md:gap-2">
                <span className="text-2xl md:text-3xl font-black text-primary">{selectedSlots.length}</span>
                <span className="text-xs md:text-sm font-bold text-slate-400">slots <span className="font-normal text-slate-300">/ 9 max</span></span>
              </div>
              <p className="text-xs md:text-sm font-black text-slate-800 mt-0.5 md:mt-1">Total: ₱{totalPrice}</p>
              {selectedSlots.length === 0 && (
                <p className="text-[9px] text-slate-300 font-medium mt-0.5 hidden md:block">Tap any cell to add a slot — mix courts freely</p>
              )}
              {selectedSlots.length > 0 && (() => {
                const courts = [...new Set(selectedSlots.map(s => s.court))];
                return courts.length > 1 && (
                  <p className="text-[9px] text-primary font-black mt-0.5 uppercase tracking-wider hidden md:block">{courts.length} courts selected</p>
                );
              })()}
            </div>
            <button
              disabled={selectedSlots.length === 0}
              onClick={() => setBookingStep('payment')}
              className={`px-4 md:px-8 py-3 md:py-4 rounded-xl font-black text-white flex items-center gap-2 md:gap-3 transition-all text-xs md:text-base shrink-0
                ${selectedSlots.length > 0 ? 'bg-primary hover:bg-primary-dark shadow-xl' : 'bg-slate-300 cursor-not-allowed'}
              `}
            >
              Proceed <span className="hidden md:inline">to Pay</span> <i className="fas fa-chevron-right text-[10px] md:text-xs"></i>
            </button>
          </div>
        </div>
      );
    }

    if (bookingStep === 'payment') {
      const totalPrice = selectedSlots.length * (selectedCourt?.price || 0);
      const refCode = bookingRefCode || (() => { const code = `SS-${selectedCourt.id.toUpperCase()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`; setBookingRefCode(code); return code; })();

      return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-12 duration-500 pb-20">
          <div className="bg-white rounded-2xl md:rounded-[4rem] shadow-2xl p-6 md:p-12 lg:p-20 border border-slate-100 space-y-10 md:space-y-12">

            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
                <i className="fas fa-credit-card text-3xl"></i>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tighter">
                {!paymentMethod ? 'Choose Payment.' : paymentMethod === 'gcash' ? 'GCash Payment.' : 'Reserve & Pay Later.'}
              </h2>
              <p className="text-slate-500 font-bold text-sm md:text-base">
                {!paymentMethod ? 'Select how you\'d like to complete your booking.' : paymentMethod === 'gcash' ? 'Send payment via GCash to confirm your booking.' : 'Your slot will be reserved. Pay at the facility on arrival.'}
              </p>
            </div>

            {/* Booking Summary (always visible) */}
            <div className="space-y-4">
              <h3 className="font-black uppercase text-xs tracking-widest text-primary">Booking Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="flex items-center gap-4 p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center text-primary flex-shrink-0">
                    <i className="fas fa-building text-lg md:text-xl"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arena</p>
                    <p className="font-black text-sm md:text-lg text-primary truncate">{selectedCourt.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center text-primary flex-shrink-0">
                    <i className="far fa-clock text-lg md:text-xl"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slots</p>
                    <p className="font-black text-sm md:text-lg text-primary">{selectedSlots.length} slot(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl shadow-sm flex items-center justify-center text-primary flex-shrink-0">
                    <i className="fas fa-peso-sign text-lg md:text-xl"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
                    <p className="font-black text-sm md:text-lg text-primary">₱{totalPrice}.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 1: Payment Method Selection */}
            {!paymentMethod && (
              <div className="space-y-6 pt-4">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary">Select Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <button
                    onClick={() => setPaymentMethod('gcash')}
                    className="group p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-400 transition-all duration-300 text-left space-y-4 hover:shadow-xl hover:shadow-blue-100/40 active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                      <i className="fas fa-mobile-alt text-2xl md:text-3xl text-blue-500 group-hover:text-white transition-colors"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-lg md:text-xl text-primary uppercase tracking-tight">GCash</h4>
                      <p className="text-slate-400 font-medium text-xs md:text-sm mt-1">Send payment directly via GCash to the facility's number</p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest">
                      <span>Instant</span>
                      <i className="fas fa-bolt text-[10px]"></i>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className="group p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 hover:border-primary transition-all duration-300 text-left space-y-4 hover:shadow-xl hover:shadow-slate-200/40 active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <i className="fas fa-wallet text-2xl md:text-3xl text-primary group-hover:text-white transition-colors"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-lg md:text-xl text-primary uppercase tracking-tight">Pay at Court</h4>
                      <p className="text-slate-400 font-medium text-xs md:text-sm mt-1">Reserve your slot now and pay in cash when you arrive</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                      <span>On Arrival</span>
                      <i className="fas fa-walking text-[10px]"></i>
                    </div>
                  </button>
                </div>

                <button onClick={() => setBookingStep('calendar')} className="w-full text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors pt-4">Go Back</button>
              </div>
            )}

            {/* Phase 2A: GCash Payment Instructions */}
            {paymentMethod === 'gcash' && (
              <div className="space-y-8 pt-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-blue-50 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-blue-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <i className="fas fa-mobile-alt text-white text-lg"></i>
                    </div>
                    <h3 className="font-black text-blue-600 uppercase tracking-tight text-lg">GCash Payment</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-blue-100 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Send to this Number</p>
                        <p className="font-black text-2xl md:text-3xl text-primary tracking-tight">{selectedCourt.phone}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">{selectedCourt.name}</p>
                      </div>
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-blue-100 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scan to Pay</p>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedCourt.phone)}`}
                            alt="GCash QR Code"
                            className="w-28 h-28 md:w-36 md:h-36 mx-auto rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Amount</p>
                        <p className="font-black text-xl md:text-2xl text-primary">₱{totalPrice}.00</p>
                      </div>
                      <div className="bg-white p-5 md:p-6 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Reference Code</p>
                        <p className="font-black text-lg md:text-xl text-blue-600 tracking-wide">{refCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">How to Pay</p>
                    <div className="space-y-2">
                      {[
                        'Open your GCash app and tap "Send Money"',
                        `Enter the number: ${selectedCourt.phone}`,
                        `Send exactly ₱${totalPrice}.00`,
                        `Add "${refCode}" as the message/note`
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5">{i + 1}</div>
                          <p className="text-sm font-medium text-slate-600">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      if (!selectedCourt) return;
                      setShowUserFormModal(true);
                    }}
                    className="w-full py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] font-black bg-blue-500 text-white hover:bg-blue-600 transition shadow-2xl shadow-blue-200/40 uppercase tracking-[0.2em] text-sm active:scale-95"
                  >
                    <i className="fas fa-check-circle mr-2"></i> I've Sent the Payment
                  </button>
                  <button onClick={() => setPaymentMethod(null)} className="w-full text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors">Choose Another Method</button>
                </div>
              </div>
            )}

            {/* Phase 2B: Pay at Court */}
            {paymentMethod === 'cash' && (
              <div className="space-y-8 pt-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-slate-50 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-slate-200 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <i className="fas fa-wallet text-white text-lg"></i>
                    </div>
                    <h3 className="font-black text-primary uppercase tracking-tight text-lg">Pay at Court</h3>
                  </div>

                  <div className="bg-white p-5 md:p-8 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-info-circle text-amber-500 text-xl"></i>
                      </div>
                      <div className="space-y-2">
                        <p className="font-black text-primary text-base md:text-lg">Your slot will be reserved</p>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">Please arrive at <span className="font-black text-primary">{selectedCourt.name}</span> and pay <span className="font-black text-primary">₱{totalPrice}.00</span> in cash at the front desk before your session.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Your Reference Code</p>
                    <p className="font-black text-xl text-primary tracking-wide">{refCode}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Show this at the front desk when you arrive</p>
                  </div>

                  <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Facility Contact</p>
                    <p className="font-black text-lg text-primary">{selectedCourt.phone}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Call if you need to reschedule</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      if (!selectedCourt) return;
                      setShowUserFormModal(true);
                    }}
                    className="w-full py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] font-black bg-primary text-white hover:bg-slate-800 transition shadow-2xl uppercase tracking-[0.2em] text-sm active:scale-95"
                  >
                    Confirm Reservation
                  </button>
                  <button onClick={() => setPaymentMethod(null)} className="w-full text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors">Choose Another Method</button>
                </div>
              </div>
            )}
          </div>

          {/* User Details Modal (shared) */}
          {showUserFormModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-2xl p-6 md:p-10 max-w-md w-full border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="text-center space-y-2 mb-6 md:mb-8">
                  <h3 className="text-2xl md:text-3xl font-black text-primary tracking-tighter uppercase">Your Details</h3>
                  <p className="text-slate-500 font-medium text-sm">Please provide your information for the receipt.</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!selectedCourt) return;
                    const dateStr = format(selectedDate, 'yyyy-MM-dd');
                    const newBookedSlots = selectedSlots.map(s => ({
                      facilityId: selectedCourt.id,
                      date: dateStr,
                      court: s.court,
                      time: s.time
                    }));
                    setBookedSlots(prev => [...prev, ...newBookedSlots]);

                    // Send booking email
                    const totalPrice = selectedSlots.length * (selectedCourt?.price || 0);
                    emailjs.send(EMAILJS.serviceId, EMAILJS.templates.bookingAndRegistration, {
                      type: 'NEW COURT BOOKING',
                      heading_label: 'REFERENCE CODE',
                      heading_value: bookingRefCode,
                      detail_1_label: 'Court',
                      detail_1_value: selectedCourt.name,
                      detail_2_label: 'Date',
                      detail_2_value: format(selectedDate, 'EEEE, MMMM do, yyyy'),
                      detail_3_label: 'Time Slots',
                      detail_3_value: selectedSlots.map(s => `${s.court}: ${s.time}`).join(' | '),
                      detail_4_label: 'Total',
                      detail_4_value: `₱${totalPrice}.00`,
                      detail_5_label: 'Payment',
                      detail_5_value: paymentMethod === 'gcash' ? 'GCash' : 'Pay at Court',
                      person_section_title: 'BOOKED BY',
                      user_name: userName,
                      user_email: userEmail,
                      user_phone: userPhone,
                      name: userName,
                      email: userEmail,
                    }, EMAILJS.publicKey);

                    localStorage.setItem('sportsync_user', JSON.stringify({ name: userName, email: userEmail, phone: userPhone }));
                    setShowUserFormModal(false);
                    setBookingStep('success');
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
                      <input
                        required
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-900 font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                      <input
                        required
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-900 font-medium"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone Number</label>
                      <input
                        required
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-slate-900 font-medium"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowUserFormModal(false)}
                      className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition uppercase tracking-widest text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 rounded-2xl font-black bg-primary text-white hover:bg-slate-800 transition shadow-xl uppercase tracking-widest text-xs active:scale-95"
                    >
                      Complete
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (bookingStep === 'success') {
      return (
        <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 pb-20 px-1 md:px-0">
          <div className="bg-white rounded-2xl md:rounded-[5rem] shadow-2xl p-8 md:p-16 lg:p-24 border border-slate-100 text-center space-y-6 md:space-y-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 md:h-3 bg-primary"></div>
             <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-primary text-3xl md:text-6xl shadow-inner border border-slate-50">
               <i className="fas fa-check-circle"></i>
             </div>
             <div className="space-y-3 md:space-y-4">
               <h2 className="text-3xl md:text-7xl font-black text-primary tracking-tighter uppercase">{paymentMethod === 'cash' ? 'Reserved!' : 'Success!'}</h2>
               <p className="text-slate-500 text-sm md:text-xl font-medium max-w-sm mx-auto">
                 {paymentMethod === 'cash'
                   ? <>Your slot at <span className="text-primary font-black">{selectedCourt.name}</span> has been reserved. Pay at the front desk on arrival.</>
                   : <>Your booking at <span className="text-primary font-black">{selectedCourt.name}</span> has been processed successfully.</>
                 }
               </p>
             </div>
             <div className="bg-slate-50 p-5 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-slate-100 space-y-3 md:space-y-4 max-w-md mx-auto">
                <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Reference</span>
                  <span className="text-primary">{bookingRefCode}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Payment</span>
                  <span className="text-primary">{paymentMethod === 'gcash' ? 'GCash' : 'Pay at Court'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Status</span>
                  <span className={paymentMethod === 'gcash' ? 'text-amber-500' : 'text-blue-500'}>
                    {paymentMethod === 'gcash' ? 'Pending Verification' : 'Reserved — Pay on Arrival'}
                  </span>
                </div>
             </div>
             <div className="flex flex-col sm:flex-row gap-3 justify-center">
               <button
                  onClick={() => {
                    const dateStr = format(selectedDate, 'yyyyMMdd');
                    const title = encodeURIComponent(`Court Booking – ${selectedCourt.name}`);
                    const details = encodeURIComponent(`Ref: ${bookingRefCode}\nSlots: ${selectedSlots.map(s => `${s.court} ${s.time}`).join(', ')}\nPayment: ${paymentMethod === 'gcash' ? 'GCash' : 'Pay at Court'}`);
                    const location = encodeURIComponent(selectedCourt.location);
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&location=${location}`, '_blank');
                  }}
                  className="flex items-center justify-center gap-2 px-6 md:px-10 py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black border-2 border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition text-xs md:text-sm uppercase tracking-widest"
                >
                  <i className="fab fa-google"></i> Add to Calendar
               </button>
               <button
                  onClick={() => setBookingStep('confirmation')}
                  className="flex items-center justify-center gap-2 bg-primary text-white px-8 md:px-12 py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black hover:bg-slate-800 transition shadow-2xl uppercase tracking-widest text-xs md:text-sm"
                >
                 View Confirmation
               </button>
             </div>
          </div>
        </div>
      );
    }

    if (bookingStep === 'confirmation') {
      const totalPrice = selectedSlots.length * (selectedCourt?.price || 0);

      return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-12 duration-700 pb-20 px-1 md:px-0">
           <div className="bg-white rounded-2xl md:rounded-[4rem] shadow-2xl p-5 md:p-12 lg:p-20 border border-slate-100 space-y-8 md:space-y-12">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6 md:pb-10">
                <Logo />
                <div className="text-right">
                  <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-300 tracking-widest">Reference Code</p>
                  <p className="font-black text-primary text-base md:text-xl">{bookingRefCode}</p>
                </div>
              </div>

              <div className="space-y-8 md:space-y-10">
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-4xl font-black text-primary tracking-tighter uppercase">
                    {paymentMethod === 'cash' ? 'Reservation Confirmation.' : 'Booking Confirmation.'}
                  </h3>
                  <p className="text-slate-400 font-bold text-sm md:text-base">
                    {paymentMethod === 'cash'
                      ? 'Your slot is reserved. Please pay at the facility upon arrival.'
                      : 'A copy of this receipt has been sent to your email.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 pt-4">
                   <div className="space-y-5 md:space-y-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Venue</p>
                        <p className="font-black text-primary text-lg">{selectedCourt.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Date & Time</p>
                        <p className="font-black text-primary text-lg">{format(selectedDate, 'EEEE, MMMM do')} • {selectedSlots.length} slot(s)</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Booked By</p>
                        <p className="font-black text-primary text-lg">{userName || 'Guest'}</p>
                        <p className="text-sm font-bold text-slate-400">{userEmail}</p>
                        <p className="text-sm font-bold text-slate-400">{userPhone}</p>
                      </div>
                   </div>
                   <div className="space-y-5 md:space-y-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{paymentMethod === 'cash' ? 'Amount Due' : 'Amount Paid'}</p>
                        <p className="font-black text-primary text-2xl md:text-3xl">₱{totalPrice}.00</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Payment Method</p>
                        <p className="font-black text-primary text-lg">{paymentMethod === 'gcash' ? 'GCash' : 'Cash — Pay at Court'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Status</p>
                        <p className={`font-black text-lg ${paymentMethod === 'gcash' ? 'text-amber-500' : 'text-blue-500'}`}>
                          {paymentMethod === 'gcash' ? 'Pending Verification' : 'Reserved'}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 md:pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button onClick={() => window.print()} className="flex-1 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black border border-slate-200 text-primary uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-50 transition"><i className="fas fa-print mr-2"></i> Print Receipt</button>
                  <button onClick={() => { setActiveTab('home'); setBookingStep('details'); setSelectedSlots([]); setPaymentMethod(null); setBookingRefCode(''); }} className="flex-1 py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black bg-primary text-white shadow-xl uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-800 transition">Back to Home</button>
                </div>
              </div>
           </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <header className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-2 md:px-4 pt-2 md:pt-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-[1.5rem] shadow-lg shadow-slate-200/40 border border-slate-100/80 h-12 md:h-20 flex items-center px-3 md:px-8">
            <div className="w-full flex items-center justify-between">
              <div onClick={() => { setActiveTab('home'); setSelectedCourt(null); setBookingStep('details'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="cursor-pointer">
                <Logo />
              </div>
              <nav className="hidden md:flex gap-14">
                {['home', 'about'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSelectedCourt(null); setBookingStep('details'); }}
                    className={`capitalize font-black text-sm tracking-widest transition-all duration-300 relative py-3 px-2 uppercase ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full animate-in slide-in-from-left-4 duration-500"></span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-3 md:gap-6">
                <div className="hidden sm:block text-right">
                   <p className="text-sm md:text-base font-black text-primary tracking-tight">John Doe</p>
                </div>
                <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-[1rem] flex items-center justify-center shadow-sm border-2 bg-primary text-white border-primary">
                  <i className="fas fa-user text-[10px] md:text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="h-16 md:h-28"></div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 pb-20 md:pb-16">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'booking' && renderBookingFlow()}
        {activeTab === 'about' && renderAbout()}
      </main>

      <footer className="bg-primary text-white pt-12 md:pt-20 pb-28 md:pb-16 px-6 md:px-8 mt-20 md:mt-40">
        <div className="max-w-7xl mx-auto space-y-10 md:space-y-0 md:grid md:grid-cols-12 md:gap-16">
           <div className="md:col-span-5 space-y-5 md:space-y-10">
             <div className="flex items-center gap-2.5 md:gap-3 font-extrabold text-2xl md:text-4xl tracking-tighter cursor-pointer">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-lg text-sm md:text-base">
                  <i className="fas fa-bolt"></i>
                </div>
                <span className="uppercase">SportSync</span>
             </div>
             <p className="text-white/80 text-sm md:text-2xl leading-relaxed font-bold tracking-tight max-w-sm uppercase">Redefining court access with minimalist efficiency.</p>
           </div>
           <div className="md:col-span-2 space-y-4 md:space-y-10">
             <h4 className="font-black text-[9px] md:text-xs uppercase tracking-[0.5em] text-white/50">Quick Links</h4>
             <ul className="flex md:block gap-6 md:space-y-6 text-sm md:text-lg font-black uppercase">
                <li><button onClick={() => {setActiveTab('home'); setBookingStep('details'); scrollToBrowse();}} className="text-white/90 hover:text-white transition">Arenas</button></li>
                <li><button onClick={() => setActiveTab('about')} className="text-white/90 hover:text-white transition">About Us</button></li>
             </ul>
           </div>
           <div className="md:col-span-5 space-y-4 md:space-y-10">
             <h4 className="font-black text-[9px] md:text-xs uppercase tracking-[0.5em] text-white/50">Contact Us</h4>
             <ul className="space-y-3 md:space-y-6">
                <li className="flex items-start gap-3 md:gap-4">
                  <i className="fas fa-map-marker-alt text-white/80 mt-0.5 md:mt-1 text-xs md:text-base"></i>
                  <span className="text-white/80 font-bold text-xs md:text-base">Forestview Village, Catalunan Grande, Davao City 8000</span>
                </li>
                <li className="flex items-center gap-3 md:gap-4">
                  <i className="fas fa-envelope text-white/80 text-xs md:text-base"></i>
                  <a href="mailto:astnjt1@gmail.com" className="text-white/80 font-bold hover:text-white transition text-xs md:text-base">astnjt1@gmail.com</a>
                </li>
                <li className="flex items-center gap-3 md:gap-4">
                  <i className="fas fa-phone text-white/80 text-xs md:text-base"></i>
                  <a href="tel:09760432250" className="text-white/80 font-bold hover:text-white transition text-xs md:text-base">0976 043 2250</a>
                </li>
             </ul>
           </div>
        </div>
      </footer>


      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 flex md:hidden justify-around py-2 px-2">
        {[
          { tab: 'home', icon: 'fa-home', label: 'Home' },
          { tab: 'about', icon: 'fa-info-circle', label: 'About' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => { setActiveTab(item.tab); setSelectedCourt(null); setBookingStep('details'); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${activeTab === item.tab ? 'text-primary' : 'text-slate-400'}`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

const CourtCard: React.FC<{court: Court, onBook: () => void, onQuickBook: () => void, availableToday: number}> = ({ court, onBook, onQuickBook, availableToday }) => {
  return (
    <div className="bg-white rounded-2xl md:rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 group border border-slate-100 flex flex-col h-full active:scale-[0.98]">
      <div className="relative h-52 md:h-64 overflow-hidden shrink-0">
        <img src={court.image} alt={court.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2">
           <span className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] shadow-xl inline-block">{court.type}</span>
           {court.numberOfCourts && (
            <span className="bg-white/95 backdrop-blur-md text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] shadow-xl border border-primary/5">
              {court.numberOfCourts} Courts
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <span className={`px-2.5 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-wider shadow-lg ${availableToday > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-white/70'}`}>
            {availableToday > 0 ? `${availableToday} open today` : 'Full today'}
          </span>
        </div>
      </div>
      <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-black text-2xl md:text-3xl text-primary group-hover:text-primary-light transition-colors line-clamp-2 leading-tight tracking-tight">{court.name}</h3>
          <div className="flex items-center text-primary text-[10px] font-black bg-primary-extralight px-2.5 py-1 rounded-lg border border-primary/10 shadow-sm flex-shrink-0">
            <i className="fas fa-star mr-1 text-primary"></i> {court.rating}
          </div>
        </div>
        <p className="text-slate-400 text-[10px] font-black line-clamp-2 flex items-start uppercase tracking-widest leading-relaxed"><i className="fas fa-map-pin mr-2 text-primary mt-0.5 shrink-0"></i><span className="leading-tight">{court.location}</span></p>
        <div className="flex flex-wrap gap-2">
          {court.amenities.slice(0, 3).map(a => <span key={a} className="text-[8px] font-black bg-slate-50 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-primary-extralight group-hover:text-primary transition-all duration-300 uppercase tracking-tighter">{a}</span>)}
        </div>
        <div className="pt-5 flex items-center justify-between border-t border-slate-100 mt-auto gap-2">
          <div className="shrink-0">
            <p className="text-3xl md:text-4xl font-black text-primary tracking-tighter">₱{court.price}<span className="text-[10px] text-slate-300 font-black ml-1 uppercase tracking-widest">/hr</span></p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onBook}
              className="border border-slate-200 text-primary px-4 md:px-5 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-slate-50 transition-all duration-300 text-[10px] md:text-xs uppercase tracking-widest"
            >
              Details
            </button>
            <button
              onClick={onQuickBook}
              className="bg-primary text-white px-5 md:px-7 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black hover:bg-primary-dark transition-all duration-500 shadow-xl shadow-primary/20 active:scale-90 text-[10px] md:text-xs uppercase tracking-widest"
            >
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
