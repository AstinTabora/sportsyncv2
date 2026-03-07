
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { GoogleGenAI } from "@google/genai";
import { COURTS, COMMUNITY_EVENTS } from './constants';
import { Court, SportType, CommunityEvent } from './types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

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
const SportBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: "Hello! I'm your SportSync Assistant. How can I help you find a court today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are SportSync Bot. 
        Context: Professional court booking for Badminton, Pickleball, and Basketball.
        Visuals: Modern minimalist White and Gray.
        User: ${userMsg}`,
        config: {
          systemInstruction: "Be professional, concise, and helpful. Your aesthetic is high-end minimalism. Use neutral tones in your descriptions."
        }
      });
      setMessages(prev => [...prev, { role: 'bot', text: response.text || "Connection error. Please try again." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm currently offline. Please use our manual booking below." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen ? (
        <div className="w-80 md:w-96 h-[520px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="bg-primary p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <span className="font-bold tracking-tight">Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform"><i className="fas fa-times"></i></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-slate-400 text-xs italic animate-pulse px-2">Assistant is typing...</div>}
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-slate-900"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="bg-primary text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-black transition-all active:scale-95"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 border-2 border-white shadow-slate-400/20"
        >
          <i className="fas fa-comment-alt text-2xl"></i>
        </button>
      )}
    </div>
  );
};

const Logo = () => (
  <div className="flex items-center gap-3 font-black text-2xl tracking-tighter cursor-pointer group">
    <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white group-hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
      <i className="fas fa-bolt text-lg"></i>
    </div>
    <span className="text-primary group-hover:text-primary-dark transition-colors uppercase font-black">SportSync</span>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [filter, setFilter] = useState<SportType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [bookingStep, setBookingStep] = useState<'details' | 'calendar' | 'payment' | 'success' | 'confirmation'>('details');
  const [detailSubTab, setDetailSubTab] = useState<'map' | 'photos' | 'pricing' | 'availability'>('photos');
  
  // Google Calendar Auth State
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const browseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setIsGoogleAuthenticated(data.isAuthenticated);
      if (data.isAuthenticated) {
        fetchCalendarEvents();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events');
      if (response.ok) {
        const data = await response.json();
        setCalendarEvents(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      const authWindow = window.open(url, 'google_auth_popup', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          setIsGoogleAuthenticated(true);
          fetchCalendarEvents();
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error("Error connecting to Google:", error);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsGoogleAuthenticated(false);
      setCalendarEvents([]);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const filteredCourts = COURTS.filter(c => 
    (filter === 'All' || c.type === filter) &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const scrollToBrowse = () => {
    browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court);
    setActiveTab('booking');
    setBookingStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderHome = () => (
    <div className="space-y-20 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="relative h-[650px] rounded-[4rem] overflow-hidden flex items-center justify-center text-center p-8 shadow-2xl border-8 border-white">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" style={{backgroundImage: 'url("/images/hero-bg.webp")'}}></div>
        <div className="absolute inset-0 bg-primary-dark/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-4xl space-y-10 px-4">
          <div className="space-y-6">
            <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter uppercase">Find your <br/>Arena.</h1>
            <p className="text-white/90 text-xl font-medium max-w-xl mx-auto leading-relaxed tracking-wide">Book premium Badminton, Pickleball, and Basketball courts in a few clicks.</p>
          </div>
          <div className="flex bg-white/10 backdrop-blur-md rounded-[2.5rem] p-3 shadow-2xl max-w-xl mx-auto group focus-within:ring-4 focus-within:ring-white/20 transition-all border border-white/20">
            <input 
              type="text" 
              placeholder="Search locations..." 
              className="flex-1 px-6 outline-none text-white placeholder:text-white/60 font-bold bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={scrollToBrowse}
              className="bg-white text-primary px-12 py-5 rounded-[2rem] font-black hover:bg-primary-extralight transition active:scale-95 shadow-xl text-sm uppercase tracking-[0.2em]"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {['Badminton', 'Pickleball', 'Basketball'].map(sport => (
          <button 
            key={sport}
            onClick={() => { setFilter(sport as SportType); scrollToBrowse(); }}
            className="group relative h-56 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 bg-white p-8"
          >
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm border border-slate-100">
                <i className={`fas ${sport === 'Badminton' ? 'fa-table-tennis-paddle-ball' : sport === 'Pickleball' ? 'fa-circle-dot' : 'fa-basketball'} text-4xl`}></i>
              </div>
              <div className="text-center">
                <span className="block font-black text-3xl text-primary tracking-tight">{sport}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Instant Booking</span>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* Courts Listing */}
      <section ref={browseRef} className="space-y-12 scroll-mt-28 pb-16">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-primary-extralight p-12 rounded-[4rem] shadow-sm border border-primary/5">
          <div className="text-center lg:text-left">
             <h2 className="text-5xl font-black text-primary tracking-tighter uppercase">Explore Facilities.</h2>
             <p className="text-primary/60 font-bold text-lg">Premium courts for every skill level.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 bg-white p-2 rounded-[2.5rem] border border-primary/10 shadow-xl shadow-primary/5">
            {['All', 'Badminton', 'Pickleball', 'Basketball'].map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-10 py-5 rounded-[2rem] text-sm font-black transition-all duration-500 ${filter === s ? 'bg-primary text-white shadow-2xl scale-105' : 'text-slate-400 hover:text-primary'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourts.map(court => (
            <CourtCard key={court.id} court={court} onBook={() => handleCourtSelect(court)} />
          ))}
        </div>
      </section>
    </div>
  );

  const renderAbout = () => (
    <div className="space-y-32 animate-in fade-in duration-1000 pb-20">
      {/* Slide 1: Title Slide */}
      <section className="text-center py-24 space-y-10">
        <div className="w-24 h-24 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-8">
          <i className="fas fa-bolt text-4xl"></i>
        </div>
        <div className="space-y-4">
          <h1 className="text-8xl font-black text-primary tracking-tighter uppercase">SportSync</h1>
          <p className="text-slate-400 text-3xl font-black uppercase tracking-[0.2em]">Seamless Booking for Active Lifestyles</p>
        </div>
        <div className="flex justify-center gap-12 pt-10 text-slate-300 font-black text-xs uppercase tracking-[0.4em]">
           <span>Team Venture</span>
           <span className="text-primary">•</span>
           <span>EST. 2024</span>
        </div>
      </section>

      {/* Slide 2: The Problem & Solution */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-slate-50 p-16 rounded-[4rem] border border-slate-100 space-y-8">
          <span className="bg-primary text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">The Problem</span>
          <h2 className="text-5xl font-black text-primary uppercase tracking-tighter">Friction in Play</h2>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">
            Booking local courts (Badminton, Pickleball, Basketball) is tedious. Relies on outdated Facebook searches, endless manual calls, and insecure bank transfers.
          </p>
          <div className="w-12 h-1 bg-primary/20 rounded-full"></div>
        </div>
        <div className="bg-white p-16 rounded-[4rem] border-4 border-primary space-y-8 shadow-2xl">
          <span className="bg-primary text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">The Solution</span>
          <h2 className="text-5xl font-black text-primary uppercase tracking-tighter">Centralized Flow</h2>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">
            A centralized web platform for instant, real-time booking. Connecting athletes with facility owners seamlessly without the administrative headache.
          </p>
          <div className="w-12 h-1 bg-primary rounded-full"></div>
        </div>
      </section>

      {/* Slide 3: Team Setup */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black text-primary uppercase tracking-tighter">Team Venture</h2>
          <p className="text-slate-400 font-bold">Ensuring a smooth experience from login to checkout.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:border-primary transition-all">
              <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <i className="fas fa-user-ninja text-3xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary uppercase">Astin Tabora</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Frontend & Design Lead</p>
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-8 group hover:border-primary transition-all">
              <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <i className="fas fa-database text-3xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary uppercase">Matthew Jariol</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Backend & Systems Architect</p>
              </div>
           </div>
        </div>
      </section>

      {/* Slide 4: AI Integration & SDG */}
      <section className="bg-primary p-20 rounded-[5rem] text-white relative overflow-hidden border border-primary-dark shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">AI Powered<br/>Design.</h2>
              <p className="text-white/80 text-xl font-medium">Utilizing Gemini AI to refine code, improve workflow efficiency, and ensure clean final output.</p>
            </div>
            <div className="flex gap-12 pt-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Refinement</p>
                <div className="flex gap-2">
                  <div className="w-8 h-2 bg-white rounded-full"></div>
                  <div className="w-8 h-2 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Efficiency</p>
                <div className="flex gap-2">
                  <div className="w-8 h-2 bg-white rounded-full"></div>
                  <div className="w-8 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-3xl p-16 rounded-[4rem] border border-white/20 space-y-8">
            <div className="w-20 h-20 bg-white text-primary rounded-[2rem] flex items-center justify-center shadow-2xl">
              <i className="fas fa-heartbeat text-3xl"></i>
            </div>
            <h3 className="text-4xl font-black uppercase tracking-tighter">SDG Goal #3</h3>
            <p className="text-white/80 text-lg font-medium">Good Health and Well-being. Encouraging physical activity by removing booking friction across local communities.</p>
          </div>
        </div>
      </section>

      {/* Slide 5: Market & Users */}
      <section className="space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-primary uppercase tracking-tighter">Market & Personas.</h2>
          <p className="text-slate-400 font-bold">Rising popularity of modern sports vs. outdated pen-and-paper scheduling.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary-extralight rounded-2xl flex items-center justify-center border border-primary/10 text-primary">
                   <i className="fas fa-users text-2xl"></i>
                </div>
                <h4 className="text-2xl font-black text-primary uppercase">The Players</h4>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-primary font-black uppercase text-xs mb-2 tracking-widest">Persona: Student Alex</p>
                <p className="text-slate-500 font-medium leading-relaxed">Hobbyist athlete looking for quick pickup games between classes. Values speed and mobile access.</p>
              </div>
           </div>
           <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-primary-extralight rounded-2xl flex items-center justify-center border border-primary/10 text-primary">
                   <i className="fas fa-store text-2xl"></i>
                </div>
                <h4 className="text-2xl font-black text-primary uppercase">The Owners</h4>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <p className="text-primary font-black uppercase text-xs mb-2 tracking-widest">Persona: Manager Mike</p>
                <p className="text-slate-500 font-medium leading-relaxed">Local business owner needing streamlined schedule management. Values reliability and payment security.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Slide 6: Key Features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Calendar', icon: 'fa-calendar-check', desc: 'Real-time sync' },
          { label: 'Maps', icon: 'fa-location-arrow', desc: 'Geo-integration' },
          { label: 'Payments', icon: 'fa-shield-halved', desc: 'Secure checkout' },
          { label: 'Community', icon: 'fa-trophy', desc: 'Tournament brackets' }
        ].map(f => (
          <div key={f.label} className="text-center space-y-6 p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group">
             <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] mx-auto flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
               <i className={`fas ${f.icon} text-3xl`}></i>
             </div>
             <div className="space-y-2">
               <h5 className="font-black text-lg uppercase text-primary">{f.label}</h5>
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{f.desc}</p>
             </div>
          </div>
        ))}
      </section>

      {/* Slide 7: Roadmap & Goals */}
      <section className="bg-slate-50 p-20 rounded-[5rem] border border-slate-100 space-y-16">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-4">
             <h2 className="text-6xl font-black text-primary uppercase tracking-tighter leading-none">Strategic<br/>Growth.</h2>
             <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">Target: Digitize 50% of local courts.</p>
          </div>
          <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex-1 max-w-xl">
             <h4 className="text-primary font-black uppercase text-xs tracking-[0.4em] mb-10">Release Criteria</h4>
             <ul className="space-y-6 font-black text-primary uppercase text-sm tracking-tighter">
                <li className="flex items-center gap-4"><i className="fas fa-circle-check text-emerald-500"></i> Seamless Search-to-Booking Flow</li>
                <li className="flex items-center gap-4"><i className="fas fa-circle-check text-emerald-500"></i> Confirmation Email &lt; 2 Minutes</li>
                <li className="flex items-center gap-4"><i className="fas fa-circle-check text-emerald-500"></i> Zero-Error Checkout Rate</li>
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
        <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500 space-y-8 pb-20">
          <button onClick={() => setActiveTab('home')} className="group flex items-center text-slate-400 hover:text-primary font-black transition-colors uppercase text-xs tracking-widest">
            <i className="fas fa-arrow-left mr-3 group-hover:-translate-x-2 transition-transform"></i> Back to Listing
          </button>

          <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-10 md:p-16 space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="px-5 py-2 bg-slate-100 text-primary font-black rounded-xl text-[10px] uppercase tracking-[0.2em] border border-slate-200">{selectedCourt.type}</span>
                    <div className="flex items-center text-primary text-xs font-black bg-slate-50 px-3 rounded-xl border border-slate-100">
                      <i className="fas fa-star mr-2"></i> {selectedCourt.rating}
                    </div>
                  </div>
                  <h2 className="text-5xl font-black text-primary leading-tight tracking-tighter uppercase">{selectedCourt.name}</h2>
                  <p className="text-slate-500 flex items-center font-bold text-lg"><i className="fas fa-map-pin mr-3 text-primary"></i>{selectedCourt.location}</p>
                </div>
                <div className="text-center md:text-right space-y-4">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Starting from</p>
                  <p className="text-6xl font-black text-primary tracking-tighter">₱{selectedCourt.price}<span className="text-xl text-slate-300 font-bold ml-2 tracking-normal">/hr</span></p>
                  <button 
                    onClick={() => setBookingStep('calendar')}
                    className="w-full bg-primary text-white px-12 py-6 rounded-[2rem] font-black hover:bg-slate-800 transition shadow-2xl text-lg uppercase tracking-widest active:scale-95 mt-4"
                  >
                    Book Now
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Map, Photos, Pricing, Availability */}
              <div className="border-t border-slate-100 pt-10">
                <div className="flex flex-wrap gap-4 mb-8">
                  {[
                    { id: 'photos', label: 'Gallery', icon: 'fa-images' },
                    { id: 'map', label: 'Location', icon: 'fa-map-marked-alt' },
                    { id: 'pricing', label: 'Pricing Info', icon: 'fa-tag' },
                    { id: 'availability', label: 'Hours', icon: 'fa-clock' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailSubTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${detailSubTab === tab.id ? 'bg-primary text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:text-primary'}`}
                    >
                      <i className={`fas ${tab.icon}`}></i> {tab.label}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-[3rem] p-8 min-h-[400px] border border-slate-100 relative overflow-hidden">
                  {detailSubTab === 'photos' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                      <img src={selectedCourt.image} className="w-full h-full object-cover rounded-3xl" alt="Main" />
                      <div className="grid grid-cols-2 gap-4">
                         <img src={`https://picsum.photos/seed/${selectedCourt.id}1/800/600`} className="w-full h-48 object-cover rounded-2xl grayscale" alt="Gallery 1" />
                         <img src={`https://picsum.photos/seed/${selectedCourt.id}2/800/600`} className="w-full h-48 object-cover rounded-2xl grayscale" alt="Gallery 2" />
                         <img src={`https://picsum.photos/seed/${selectedCourt.id}3/800/600`} className="w-full h-48 object-cover rounded-2xl grayscale" alt="Gallery 3" />
                         <div className="w-full h-48 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl">+12</div>
                      </div>
                    </div>
                  )}
                  {detailSubTab === 'map' && (
                    <Suspense fallback={<MapSkeleton />}>
                      <MapComponent court={selectedCourt} />
                    </Suspense>
                  )}
                  {detailSubTab === 'pricing' && (
                    <div className="space-y-8 p-4">
                       <h3 className="text-3xl font-black text-primary uppercase tracking-tighter">Membership Rates</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         {[
                           { name: 'Standard', price: selectedCourt.price, desc: 'Per hour, no commitment' },
                           { name: 'Club Member', price: Math.floor(selectedCourt.price * 0.8), desc: '20% off all bookings' },
                           { name: 'Elite Pass', price: 99, desc: 'Unlimited access monthly' }
                         ].map(p => (
                           <div key={p.name} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-primary transition-all group">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.name}</p>
                             <p className="text-4xl font-black text-primary tracking-tighter">₱{p.price}<span className="text-xs text-slate-300">/hr</span></p>
                             <p className="text-sm text-slate-400 mt-4 font-medium">{p.desc}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                  {detailSubTab === 'availability' && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-7 gap-2">
                         {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                           <div key={day} className="text-center font-black text-[10px] uppercase text-slate-400 py-4">{day}</div>
                         ))}
                         {Array.from({length: 31}).map((_, i) => (
                           <div key={i} className={`h-24 rounded-2xl border border-slate-100 bg-white p-2 flex flex-col justify-between hover:border-primary transition-all cursor-pointer ${i === 12 ? 'ring-2 ring-primary' : ''}`}>
                              <span className="text-[10px] font-black">{i + 1}</span>
                              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${Math.random() * 100}%` }}></div>
                              </div>
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
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

      return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-12 duration-500 pb-20">
          <div className="bg-white rounded-[4rem] shadow-2xl p-12 lg:p-20 border border-slate-100 space-y-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <i className="fas fa-calendar-alt text-3xl"></i>
            </div>
            <h2 className="text-5xl font-black text-primary uppercase tracking-tighter">Calendar Sync.</h2>
            <p className="text-slate-500 font-bold">Pick your preferred date and time slot synced with our live calendar.</p>
            
            {!isGoogleAuthenticated ? (
              <button 
                onClick={handleGoogleConnect}
                className="mt-4 bg-white text-primary border-2 border-primary px-8 py-4 rounded-[1.5rem] font-black hover:bg-primary hover:text-white transition-all flex items-center gap-3 mx-auto uppercase text-xs tracking-[0.2em] shadow-lg shadow-primary/5"
              >
                <i className="fab fa-google"></i> Connect Google Calendar
              </button>
            ) : (
              <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2 bg-primary-extralight px-4 py-2 rounded-full">
                  <i className="fas fa-check-circle"></i> Connected to Google
                </span>
                <button onClick={handleGoogleLogout} className="text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors">Disconnect</button>
              </div>
            )}
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black uppercase text-xs tracking-widest text-primary">Select Date</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><i className="fas fa-chevron-left text-xs"></i></button>
                    <span className="text-xs font-black uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg"><i className="fas fa-chevron-right text-xs"></i></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                   {['S','M','T','W','T','F','S'].map((d, i) => <div key={`${d}-${i}`} className="text-center text-[10px] font-black text-slate-300">{d}</div>)}
                   {calendarDays.map((day, i) => {
                     const isCurrentMonth = format(day, 'M') === format(currentMonth, 'M');
                     const isSelected = isSameDay(day, selectedDate);
                     const hasEvents = calendarEvents.some(e => {
                       const eventDate = e.start?.dateTime || e.start?.date;
                       return eventDate && isSameDay(new Date(eventDate), day);
                     });

                     return (
                       <button 
                         key={i} 
                         onClick={() => setSelectedDate(day)}
                         className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all relative
                           ${isSelected ? 'bg-primary text-white shadow-lg scale-110' : 
                             isCurrentMonth ? 'hover:bg-slate-50 text-slate-800' : 'text-slate-200'}
                         `}
                        >
                         {format(day, 'd')}
                         {hasEvents && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>}
                       </button>
                     );
                   })}
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary">Available Slots</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['08:00 AM', '10:00 AM', '01:00 PM', '03:00 PM', '06:00 PM', '08:00 PM'].map(slot => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button 
                        key={slot} 
                        onClick={() => setSelectedTime(slot)}
                        className={`border-2 p-5 rounded-2xl transition-all font-black text-xs text-center active:scale-95
                          ${isSelected ? 'border-primary bg-primary text-white shadow-xl' : 'border-slate-100 hover:border-primary hover:bg-slate-50 text-slate-800'}
                        `}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                
                {isGoogleAuthenticated && calendarEvents.length > 0 && (
                  <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Your Google Events</h4>
                    <div className="space-y-3">
                      {calendarEvents
                        .filter(e => {
                          const eventDate = e.start?.dateTime || e.start?.date;
                          return eventDate && isSameDay(new Date(eventDate), selectedDate);
                        })
                        .map((e, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-[10px] font-bold text-slate-600">
                            <i className="fas fa-circle text-[6px] text-primary"></i>
                            <span className="truncate">{e.summary}</span>
                            <span className="ml-auto text-slate-300">
                              {e.start?.dateTime ? format(new Date(e.start.dateTime), 'HH:mm') : 'All Day'}
                            </span>
                          </div>
                        ))
                      }
                      {calendarEvents.filter(e => {
                          const eventDate = e.start?.dateTime || e.start?.date;
                          return eventDate && isSameDay(new Date(eventDate), selectedDate);
                        }).length === 0 && (
                        <p className="text-[10px] text-slate-300 italic">No events for this day</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-10">
              <button onClick={() => setBookingStep('details')} className="flex-1 py-6 rounded-[2rem] font-black text-primary bg-slate-50 hover:bg-slate-100 transition uppercase tracking-widest text-sm">Cancel</button>
              <button 
                disabled={!selectedTime}
                onClick={() => setBookingStep('payment')} 
                className={`flex-1 py-6 rounded-[2rem] font-black transition shadow-2xl uppercase tracking-widest text-sm
                  ${selectedTime ? 'bg-primary text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (bookingStep === 'payment') {
      return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-12 duration-500 pb-20">
          <div className="bg-white rounded-[4rem] shadow-2xl p-12 lg:p-20 border border-slate-100 space-y-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <i className="fas fa-credit-card text-3xl"></i>
            </div>
            <h2 className="text-5xl font-black text-primary uppercase tracking-tighter">Secure Payment.</h2>
            <p className="text-slate-500 font-bold">Please pay via QR code and contact the court for confirmation.</p>
          </div>

            <div className="flex flex-col md:flex-row gap-12 items-center pt-8">
              <div className="flex-1 space-y-8 w-full">
                <div className="space-y-6">
                  <h3 className="font-black uppercase text-xs tracking-widest text-primary">Court Contact Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                        <i className="fas fa-building text-xl"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arena Name</p>
                        <p className="font-black text-lg text-primary">{selectedCourt.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                        <i className="fas fa-phone-alt text-xl"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                        <p className="font-black text-lg text-primary">{selectedCourt.phone || '+1 (555) 000-0000'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                        <i className="fas fa-envelope text-xl"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                        <p className="font-black text-lg text-primary">{selectedCourt.email || 'support@sportsync.com'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center space-y-6 w-full">
                <h3 className="font-black uppercase text-xs tracking-widest text-primary">Scan to Pay</h3>
                <div className="p-8 bg-white rounded-[3rem] shadow-2xl border-4 border-slate-50 relative group">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=sportsync-booking-${selectedCourt.id}`} 
                    alt="Payment QR Code" 
                    className="w-64 h-64 grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-primary/10 backdrop-blur-sm p-4 rounded-full">
                      <i className="fas fa-expand text-primary text-2xl"></i>
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] text-center">Scan with your banking app</p>
              </div>
            </div>

            <div className="space-y-4 pt-10">
              <button 
                onClick={() => setBookingStep('success')}
                className="w-full py-8 rounded-[2.5rem] font-black bg-primary text-white hover:bg-slate-800 transition shadow-2xl uppercase tracking-[0.2em] text-sm active:scale-95"
              >
                Continue to Confirmation
              </button>
              <button onClick={() => setBookingStep('calendar')} className="w-full text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-colors">Go Back</button>
            </div>
          </div>
        </div>
      );
    }

    if (bookingStep === 'success') {
      return (
        <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 pb-20">
          <div className="bg-white rounded-[5rem] shadow-2xl p-16 lg:p-24 border border-slate-100 text-center space-y-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>
             <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-primary text-6xl shadow-inner border border-slate-50">
               <i className="fas fa-check-circle"></i>
             </div>
             <div className="space-y-4">
               <h2 className="text-7xl font-black text-primary tracking-tighter uppercase">Success!</h2>
               <p className="text-slate-500 text-xl font-medium max-w-sm mx-auto">Your booking at <span className="text-primary font-black">{selectedCourt.name}</span> has been processed successfully.</p>
             </div>
             <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 space-y-4 max-w-md mx-auto">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Order ID</span>
                  <span className="text-primary">#SS-77291</span>
                </div>
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Status</span>
                  <span className="text-emerald-500">Confirmed</span>
                </div>
             </div>
             <button 
                onClick={() => setBookingStep('confirmation')}
                className="bg-primary text-white px-12 py-6 rounded-[2rem] font-black hover:bg-slate-800 transition shadow-2xl uppercase tracking-widest text-sm"
              >
               View Confirmation
             </button>
          </div>
        </div>
      );
    }

    if (bookingStep === 'confirmation') {
      return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-12 duration-700 pb-20">
           <div className="bg-white rounded-[4rem] shadow-2xl p-12 lg:p-20 border border-slate-100 space-y-12">
              <div className="flex justify-between items-start border-b border-slate-100 pb-10">
                <Logo />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Confirmation Number</p>
                  <p className="font-black text-primary text-xl">SS-BK-00192</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-primary tracking-tighter uppercase">Email Confirmation.</h3>
                  <p className="text-slate-400 font-bold">A copy of this receipt has been sent to john.doe@athlete.com</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                   <div className="space-y-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Venue</p>
                        <p className="font-black text-primary text-lg">{selectedCourt.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Date & Time</p>
                        <p className="font-black text-primary text-lg">Monday, July 15 • 10:00 AM</p>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Amount Paid</p>
                        <p className="font-black text-primary text-3xl">₱{selectedCourt.price}.00</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Access Code</p>
                        <p className="font-black text-emerald-600 text-2xl tracking-[0.3em]">C-9921</p>
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => window.print()} className="flex-1 py-5 rounded-2xl font-black border border-slate-200 text-primary uppercase text-xs tracking-widest hover:bg-slate-50 transition"><i className="fas fa-print mr-2"></i> Print Receipt</button>
                  <button onClick={() => { setActiveTab('home'); setBookingStep('details'); }} className="flex-1 py-5 rounded-2xl font-black bg-primary text-white shadow-xl uppercase text-xs tracking-widest hover:bg-slate-800 transition">Back to Home</button>
                </div>
              </div>
           </div>
        </div>
      );
    }

    return null;
  };

  const renderCommunity = () => (
    <div className="space-y-16 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-10 bg-primary p-12 lg:p-20 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
          <span className="bg-white/10 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.3em] inline-block border border-white/20 uppercase">Community Hub</span>
          <h2 className="text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase">Local <br/>Events.</h2>
          <p className="text-white/70 text-xl font-medium max-w-xl">Join tournaments, find pickup groups, and scale your game with local athletes.</p>
        </div>
        <button className="relative z-10 bg-white text-primary px-12 py-6 rounded-[2rem] font-black shadow-2xl hover:bg-slate-100 transition-transform active:scale-95 text-lg uppercase tracking-widest">Post Event</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         {COMMUNITY_EVENTS.map((event, i) => (
           <div key={event.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-10 items-start group hover:border-primary transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/40">
              <div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-all duration-700 group-hover:rotate-12 shadow-sm border border-slate-200 group-hover:border-transparent text-primary">
                <i className={`fas ${event.icon} text-4xl group-hover:text-white transition-colors`}></i>
              </div>
              <div className="flex-1 space-y-5">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-primary bg-slate-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-slate-100">Featured</span>
                   <span className="text-xs text-slate-400 font-black tracking-tighter">{event.date}</span>
                </div>
                <h3 className="font-black text-3xl text-primary leading-[1.1] tracking-tight group-hover:text-slate-800 transition-colors uppercase">
                  {event.title}
                </h3>
                <p className="text-slate-500 font-bold leading-relaxed text-base line-clamp-2">{event.description}</p>
                <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-6">
                   <div className="flex items-center gap-4">
                     <div className="flex -space-x-4">
                       {[1, 2, 3, 4].map(p => (
                         <div key={p} className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                           <img src={`https://i.pravatar.cc/150?u=${p + i * 4}`} alt={`User ${p}`} className="w-full h-full object-cover grayscale" />
                         </div>
                       ))}
                     </div>
                     <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{event.participants}+ Joined</span>
                   </div>
                   <button 
                     onClick={() => setSelectedEvent(event)}
                     className="text-primary font-black text-xs uppercase tracking-[0.2em] hover:translate-x-3 transition-transform flex items-center gap-3"
                   >
                     Details <i className="fas fa-arrow-right"></i>
                   </button>
                </div>
              </div>
           </div>
         ))}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}></div>
          <div className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedEvent(null)}
              className="absolute top-8 right-8 w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors z-10"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <div className="p-12 sm:p-16 space-y-10">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-primary-extralight rounded-[2.5rem] flex items-center justify-center text-primary border border-primary/10 shadow-sm flex-shrink-0">
                  <i className={`fas ${selectedEvent.icon} text-5xl`}></i>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white bg-primary px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm">Tournament</span>
                    <span className="text-xs text-slate-400 font-black tracking-tighter">{selectedEvent.date}</span>
                  </div>
                  <h2 className="text-5xl font-black text-primary tracking-tighter uppercase leading-tight">{selectedEvent.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="font-black text-primary text-xl uppercase">{selectedEvent.locationName}</p>
                  <p className="text-sm text-slate-500 font-medium">{selectedEvent.address}</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Fee</p>
                  <p className="font-black text-primary text-3xl uppercase">{selectedEvent.registrationFee}</p>
                  <p className="text-sm text-slate-500 font-medium">Includes event shirt & hydration</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-black text-xl text-primary uppercase tracking-tight">Event Details</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-lg">{selectedEvent.description}</p>
              </div>

              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-primary text-white py-6 rounded-[2rem] font-black hover:bg-slate-800 transition shadow-2xl uppercase tracking-widest text-sm active:scale-95">
                  Register Now
                </button>
                <button 
                  onClick={() => {
                    const court = COURTS.find(c => c.id === selectedEvent.courtId);
                    if (court) {
                      setSelectedEvent(null);
                      handleCourtSelect(court);
                    }
                  }}
                  className="flex-1 bg-slate-50 text-primary py-6 rounded-[2rem] font-black hover:bg-slate-100 transition border border-slate-200 uppercase tracking-widest text-sm active:scale-95"
                >
                  View Facility
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-white">
      <header className="sticky top-0 z-40 glass border-b border-slate-100 h-28 flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">
          <div onClick={() => { setActiveTab('home'); setSelectedCourt(null); setBookingStep('details'); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
            <Logo />
          </div>
          <nav className="hidden md:flex gap-14">
            {['home', 'community', 'about'].map(tab => (
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
          <div className="flex items-center gap-8">
            <div className="hidden sm:block text-right">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] mb-1">Authenticated</p>
               <p className="text-base font-black text-primary tracking-tight">John Doe</p>
            </div>
            <button 
              onClick={() => { setActiveTab('profile'); setSelectedCourt(null); }} 
              className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm border-2 ${activeTab === 'profile' ? 'bg-primary text-white border-primary scale-105 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-primary hover:text-primary'}`}
            >
              <i className="fas fa-user text-2xl"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'booking' && renderBookingFlow()}
        {activeTab === 'community' && renderCommunity()}
        {activeTab === 'about' && renderAbout()}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-12 animate-in zoom-in-95 duration-500">
            <div className="bg-white p-12 lg:p-20 rounded-[5rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
               <div className="relative inline-block mb-8">
                  <div className="w-48 h-48 bg-slate-50 rounded-[4rem] mx-auto flex items-center justify-center text-primary text-8xl rotate-6 shadow-sm border border-slate-200">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary text-white rounded-[1.5rem] flex items-center justify-center border-8 border-white shadow-2xl rotate-12">
                    <i className="fas fa-check text-xl"></i>
                  </div>
               </div>
               <div className="space-y-4">
                  <h2 className="text-5xl font-black text-primary tracking-tighter uppercase">John Doe</h2>
                  <p className="text-slate-400 font-black uppercase text-sm tracking-[0.4em]">Athlete Profile • EST 2026</p>
               </div>
               <div className="grid grid-cols-2 gap-8 mt-16">
                  <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Sessions</p>
                    <p className="text-6xl font-black text-primary tracking-tighter">14</p>
                  </div>
                  <div className="bg-primary p-12 rounded-[3.5rem] border border-slate-900 shadow-2xl shadow-slate-900/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Activity Score</p>
                    <p className="text-6xl font-black text-white tracking-tighter">950</p>
                  </div>
               </div>
               <div className="flex flex-col sm:flex-row gap-4 pt-12">
                  <button className="flex-1 bg-primary text-white py-6 rounded-[2rem] font-black hover:bg-slate-800 transition shadow-2xl text-lg uppercase tracking-widest active:scale-95">Edit Account</button>
                  <button className="flex-1 bg-slate-50 text-primary py-6 rounded-[2rem] font-black hover:bg-slate-100 transition border border-slate-200 text-lg uppercase tracking-widest active:scale-95">Settings</button>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-50 text-primary pt-32 pb-16 px-8 rounded-t-[6rem] mt-40 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-20">
           <div className="md:col-span-5 space-y-10">
             <div className="flex items-center gap-3 font-extrabold text-4xl tracking-tighter cursor-pointer">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-bolt"></i>
                </div>
                <span className="uppercase">SportSync</span>
             </div>
             <p className="text-slate-500 text-2xl leading-relaxed font-bold tracking-tight max-w-sm uppercase">Redefining facility access with minimalist efficiency.</p>
             <div className="flex gap-6">
               {['twitter', 'facebook', 'instagram', 'youtube'].map(s => (
                 <a key={s} href="#" className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-slate-400 hover:text-primary transition-all duration-500 border border-slate-200 hover:-translate-y-2 shadow-sm">
                   <i className={`fab fa-${s} text-2xl`}></i>
                 </a>
               ))}
             </div>
           </div>
           <div className="md:col-span-2 space-y-10">
             <h4 className="font-black text-xs uppercase tracking-[0.5em] text-slate-300 uppercase">Quick Links</h4>
             <ul className="space-y-6 text-lg font-black uppercase">
                <li><button onClick={() => {setActiveTab('home'); setBookingStep('details'); scrollToBrowse();}} className="hover:text-slate-500 transition">Arenas</button></li>
                <li><button onClick={() => setActiveTab('community')} className="hover:text-slate-500 transition">Events</button></li>
                <li><button onClick={() => setActiveTab('about')} className="hover:text-slate-500 transition">About Us</button></li>
             </ul>
           </div>
           <div className="md:col-span-2 space-y-10">
             <h4 className="font-black text-xs uppercase tracking-[0.5em] text-slate-300 uppercase">Privacy</h4>
             <ul className="space-y-6 text-lg font-black uppercase">
                <li><button className="hover:text-slate-500 transition">Policy</button></li>
                <li><button className="hover:text-slate-500 transition">Agreement</button></li>
                <li><button className="hover:text-slate-500 transition">Security</button></li>
             </ul>
           </div>
           <div className="md:col-span-3 space-y-10">
             <h4 className="font-black text-xs uppercase tracking-[0.5em] text-slate-300 uppercase">Updates</h4>
             <p className="text-slate-400 font-bold leading-relaxed">Subscribe to local opening alerts.</p>
             <div className="flex flex-col gap-4">
               <input type="text" placeholder="athlete@example.com" className="bg-white px-8 py-5 rounded-3xl outline-none font-black placeholder:text-slate-200 border border-slate-200 focus:border-primary transition-colors text-primary" />
               <button className="bg-primary text-white py-5 rounded-3xl font-black shadow-xl hover:bg-slate-800 transition uppercase tracking-widest text-sm">Subscribe</button>
             </div>
           </div>
        </div>
      </footer>

      <SportBot />
    </div>
  );
};

const CourtCard: React.FC<{court: Court, onBook: () => void}> = ({ court, onBook }) => {
  return (
    <div className="bg-white rounded-[4rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 group border border-slate-100 flex flex-col h-full active:scale-[0.98]">
      <div className="relative h-72 overflow-hidden">
        <img src={court.image} alt={court.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[40%] group-hover:grayscale-0" />
        <div className="absolute inset-0 bg-primary-dark/10 group-hover:bg-transparent transition-colors"></div>
        <div className="absolute top-8 left-8">
           <span className="bg-white/95 backdrop-blur-md text-primary px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border border-primary/5 inline-block">{court.type}</span>
        </div>
        <div className="absolute bottom-8 left-8 bg-primary text-white px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-xl">
          Verified
        </div>
      </div>
      <div className="p-8 space-y-5 flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-black text-2xl text-primary group-hover:text-primary-light transition-colors line-clamp-2 leading-tight tracking-tighter uppercase">{court.name}</h3>
          <div className="flex items-center text-primary text-xs font-black bg-primary-extralight px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm flex-shrink-0">
            <i className="fas fa-star mr-1.5 text-primary"></i> {court.rating}
          </div>
        </div>
        <p className="text-slate-400 text-xs font-black line-clamp-2 flex items-start uppercase tracking-widest leading-relaxed"><i className="fas fa-map-pin mr-2 text-primary mt-0.5"></i>{court.location}</p>
        <div className="flex flex-wrap gap-2">
          {court.amenities.slice(0, 3).map(a => <span key={a} className="text-[9px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:bg-primary-extralight group-hover:text-primary transition-all duration-300 uppercase tracking-tighter">{a}</span>)}
        </div>
        <div className="pt-6 flex items-center justify-between border-t border-slate-100 mt-auto">
          <div>
            <p className="text-3xl font-black text-primary tracking-tighter">₱{court.price}<span className="text-[10px] text-slate-300 font-black ml-1 uppercase tracking-widest">/hr</span></p>
          </div>
          <button 
            onClick={onBook}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary-dark transition-all duration-500 shadow-xl shadow-primary/20 active:scale-90 text-[10px] uppercase tracking-widest"
          >
            BOOK SLOT
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
