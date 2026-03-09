import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight, Play, Search, MapPin, Calendar, Shield, Zap, Heart, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServicesGrid from "@/components/ui/ServicesGrid";
import { cn } from "@/lib/utils";

const platformFeatures = [
  {
    img: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=640&h=480&fit=crop',
    tags: [{ dark: 'Escrow' }, { light: 'Payments' }],
    title: 'Funds held securely in escrow — released only when the recipient confirms delivery',
    date: 'Core Platform Feature',
    read: 'Learn more'
  },
  {
    img: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=512&h=384&fit=crop',
    tags: [{ dark: 'KYC' }, { light: 'Verification' }],
    title: 'Government ID + selfie verification gives every user a trusted verified badge',
    date: 'Identity System',
    read: 'Learn more'
  },
  {
    img: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=512&h=384&fit=crop',
    tags: [{ dark: 'Matching' }, { light: 'AI Engine' }],
    title: 'Smart matching connects senders to travelers by route, weight, price and trust score',
    date: 'Matching Engine',
    read: 'Learn more'
  },
  {
    img: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=512&h=384&fit=crop',
    tags: [{ dark: 'Reputation' }, { light: 'Reviews' }],
    title: 'Two-way rating after every delivery keeps bad actors off the platform automatically',
    date: 'Reputation Engine',
    read: 'Learn more'
  }
];

const newsItems = [
  {
    img: 'https://images.unsplash.com/photo-1611915387288-fd8d2f5f928b?w=1200&h=680&fit=crop',
    tags: ['Launch', 'Nigeria'],
    title: 'CarryLink Phase 1 corridors go live: Nigeria, Canada, UK and USA',
    desc: 'After months of private beta testing with 400+ verified travelers, CarryLink opens its Phase 1 corridors — giving senders escrow-protected delivery starting at just $8/kg.',
    meta: '03 March 2026 — 4 min read'
  },
  {
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&h=680&fit=crop',
    tags: ['Feature', 'Trust'],
    title: "How CarryLink's KYC verification keeps every delivery safe",
    desc: 'We walk through exactly how our identity verification pipeline works — from government ID upload to selfie matching — and why it is the backbone of trust on the platform.',
    meta: '24 February 2026 — 5 min read'
  }
];

const travelers = [
  { name: "Amaka Osei", role: "Lagos → Toronto", earned: "$420", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=530&fit=crop" },
  { name: "Emeka Nwosu", role: "Abuja → London", earned: "$310", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=530&fit=crop" },
  { name: "Fatima Al-Hassan", role: "Lagos → Houston", earned: "$290", img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=530&fit=crop" },
  { name: "Taiwo Adeyemi", role: "Ibadan → Manchester", earned: "$480", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=530&fit=crop" }
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("travelers");
  const [purpIdx, setPurpIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const nextPurp = () => {
    setIsFading(true);
    setTimeout(() => {
      setPurpIdx((prev) => (prev + 1) % platformFeatures.length);
      setIsFading(false);
    }, 220);
  };

  const prevPurp = () => {
    setIsFading(true);
    setTimeout(() => {
      setPurpIdx((prev) => (prev - 1 + platformFeatures.length) % platformFeatures.length);
      setIsFading(false);
    }, 220);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-bg">
            <video autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop">
              <source src="https://videos.pexels.com/video-files/856917/856917-hd_1920_1080_25fps.mp4" type="video/mp4" />
              <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop" alt="Airport traveler" />
            </video>
          </div>
          <div className="hero-ov"></div>
          <div className="hero-cnt">
            <div className="hero-eyebrow">Peer-to-Peer Delivery</div>
            <h1 className="hero-title">
              Global delivery powered by <em>Travelers</em>
            </h1>
            <p className="hero-sub">Ship packages internationally at 70% lower costs, or earn money covering your travel expenses by carrying items for others.</p>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link
                to="/account/send-package"
                className="bg-carry-light text-white px-8 py-4 rounded-sm font-bold flex items-center justify-center gap-2 hover:bg-carry-light/90 transition-all group"
              >
                Send a Package
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/account/post-trip"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-sm font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
              >
                Become a Traveler
              </Link>
            </div>
          </div>

          <div className="hero-card hidden lg:block">
            <span className="hero-tag">Now Live</span>
            <div className="hero-date">Phase 1 Corridors Open</div>
            <h3 className="hero-htitle">Nigeria ↔ Canada, UK & USA now accepting shipment requests</h3>
            <Link to="/account/send-package" className="hero-link">
              Start shipping
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="scroll-ind">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </section>

        {/* Search / Filter Section */}
        <section className="py-20 bg-carry-bg">
          <div className="container mx-auto px-6 md:px-[56px] max-w-[1400px]">
            <div className="bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(4,55,75,0.08)] rounded-sm -mt-32 relative z-30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-8 border-b border-gray-100 w-full md:w-auto">
                  <button
                    onClick={() => setActiveTab("travelers")}
                    className={cn(
                      "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                      activeTab === "travelers" ? "text-carry-light" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Find Travelers
                    {activeTab === "travelers" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light"></div>}
                  </button>
                  <button
                    onClick={() => setActiveTab("senders")}
                    className={cn(
                      "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                      activeTab === "senders" ? "text-carry-light" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    Browse Shipments
                    {activeTab === "senders" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light"></div>}
                  </button>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">
                  6,420+ Items in transit right now
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Origin
                  </label>
                  <input type="text" placeholder="Lagos, Nigeria" className="w-full border-b-2 border-gray-100 py-2 focus:outline-none focus:border-carry-light transition-colors font-medium text-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Destination
                  </label>
                  <input type="text" placeholder="London, United Kingdom" className="w-full border-b-2 border-gray-100 py-2 focus:outline-none focus:border-carry-light transition-colors font-medium text-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Travel Date
                  </label>
                  <input type="text" placeholder="Select Date" className="w-full border-b-2 border-gray-100 py-2 focus:outline-none focus:border-carry-light transition-colors font-medium text-gray-800" />
                </div>
                <div className="flex items-end">
                  <button className="w-full bg-carry-darker text-white py-4 font-bold flex items-center justify-center gap-2 hover:bg-carry-dark transition-all shadow-lg">
                    <Search className="w-4 h-4" />
                    Search Corridors
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security / Escrow Section */}
        <section className="art-sec">
          <div className="art-inner">
            <div className="art-img">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop" alt="Secure payment" />
            </div>
            <div className="art-cnt">
              <p className="lbl opacity-60">Trust & Safety</p>
              <h2 className="art-h">Your money is protected until delivery is confirmed</h2>
              <p className="art-t">CarryLink's escrow system holds your payment securely. Funds are only released to the traveler after the recipient confirms delivery — giving both sides complete peace of mind. No upfront risk. No fraud.</p>
              <Link to="/resources" className="btn-w">How escrow works</Link>
            </div>
          </div>
        </section>

        {/* Platform Features Carousel */}
        <section className="purp-sec">
          <div className="purp-outer">
            <div className="purp-sidebar">
              <div className="lbl">Platform Features</div>
              <h2 className="sec-title">Built for<br />trust at<br />every step</h2>
              <p className="purp-desc">From KYC verification to dispute resolution, every feature is designed to make cross-border peer delivery safe, structured, and monetized.</p>
              <div className="arrows">
                <button className="arr" onClick={prevPurp}><ChevronRight className="w-4.5 h-4.5 rotate-180" /></button>
                <button className="arr" onClick={nextPurp}><ChevronRight className="w-4.5 h-4.5" /></button>
              </div>
            </div>
            <div className="purp-clip">
              <div className="purp-track">
                {platformFeatures.slice(purpIdx, purpIdx + 4).concat(platformFeatures.slice(0, Math.max(0, purpIdx + 4 - platformFeatures.length))).map((item, idx) => (
                  <div key={idx} className={cn("p-card", idx === 0 ? "p-card--feat" : "p-card--reg", isFading && "fading")}>
                    <div className="p-card-img"><img src={item.img} alt="" /></div>
                    <div className="p-card-body">
                      <div className="p-card-tags">
                        {item.tags.map((tag, tIdx) => (
                          <span key={tIdx} className={tag.dark ? "p-tag-dark" : "p-tag-light"}>
                            {tag.dark || tag.light}
                          </span>
                        ))}
                      </div>
                      <h3 className="p-card-title">{item.title}</h3>
                      <hr className="p-card-sep" />
                      <div className="p-card-meta">
                        <time>{item.date}</time>
                        <span className="p-card-dot"></span>
                        <span>{item.read}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Active Corridors */}
        <section className="mis-sec">
          <div className="container mx-auto px-6 md:px-[56px] max-w-[1400px]">
            <div className="mb-9">
              <div className="lbl">Active Corridors</div>
              <h2 className="sec-title">Delivering across the<br />diaspora's most-used routes</h2>
            </div>
            <div className="mis-grid">
              {[
                { label: "Nigeria → Canada", img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=600&fit=crop" },
                { label: "Nigeria → UK", img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=600&fit=crop" },
                { label: "Nigeria → USA", img: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=600&fit=crop" },
                { label: "Diaspora Families", img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop" },
                { label: "Small Businesses", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=600&fit=crop" }
              ].map((item, idx) => (
                <div key={idx} className="mp">
                  <img src={item.img} alt={item.label} />
                  <div className="mp-ov"></div>
                  <div className="mp-lbl">{item.label}</div>
                  <div className="mp-plus"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section className="news-sec">
          <div className="container mx-auto px-6 md:px-[56px] max-w-[1400px]">
            <div className="news-hdr">
              <div className="news-hdr-left">
                <div className="lbl">CarryLink News</div>
                <h2 className="sec-title">Updates, stories & insights</h2>
              </div>
              <div className="arrows mb-0 self-end">
                <button className="arr"><ChevronRight className="w-4.5 h-4.5 rotate-180" /></button>
                <button className="arr"><ChevronRight className="w-4.5 h-4.5" /></button>
              </div>
            </div>
            <div className="news-top">
              <div className="nc nc--feat">
                <img src={newsItems[0].img} alt="" />
                <div className="nc-ov"></div>
                <div className="nc-body">
                  <div className="nc-tags">
                    <span className="nc-tag">{newsItems[0].tags[0]}</span>
                    <span className="nc-tag-outline">{newsItems[0].tags[1]}</span>
                  </div>
                  <h3 className="nc-title">{newsItems[0].title}</h3>
                  <p className="nc-desc">{newsItems[0].desc}</p>
                  <div className="nc-meta">{newsItems[0].meta}</div>
                </div>
              </div>
              <div className="nc nc--sm">
                <img src={newsItems[1].img} alt="" />
                <div className="nc-ov"></div>
                <div className="nc-body">
                  <div className="nc-tags">
                    <span className="nc-tag">{newsItems[1].tags[0]}</span>
                    <span className="nc-tag-outline">{newsItems[1].tags[1]}</span>
                  </div>
                  <h3 className="nc-title">{newsItems[1].title}</h3>
                  <div className="nc-meta">{newsItems[1].meta}</div>
                </div>
              </div>
            </div>
            <div className="news-bottom">
              {[1, 2, 3].map((i) => (
                <div key={i} className="nc nc--bt">
                  <img src={`https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&h=680&fit=crop`} alt="" />
                  <div className="nc-ov"></div>
                  <div className="nc-body">
                    <div className="nc-tags">
                      <span className="nc-tag">Traveler</span>
                      <span className="nc-tag-outline">Earning</span>
                    </div>
                    <h3 className="nc-title">How verified travelers are earning $200–$500 per trip</h3>
                    <div className="nc-meta">18 February 2026 — 4 min read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Finance Bar (Stats) */}
        <section className="fin-bar">
          <div className="fin-grid">
            <div className="fi">
              <div className="fi-l">Active Travelers</div>
              <div className="fi-v">2,400+</div>
              <div className="fi-u">verified & KYC-approved</div>
            </div>
            <div className="fi">
              <div className="fi-l">Deliveries Completed</div>
              <div className="fi-v">12,000+</div>
              <div className="fi-u">across Phase 1 corridors</div>
            </div>
            <div className="fi">
              <div className="fi-l">Avg. Savings vs DHL</div>
              <div className="fi-v">68%</div>
              <div className="fi-u">cheaper per kilogram</div>
            </div>
            <div className="fi">
              <div className="fi-l">Platform Rating</div>
              <div className="fi-v">4.9/5</div>
              <div className="fi-c">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                from 3,800+ reviews
              </div>
            </div>
          </div>
        </section>

        {/* Career Section */}
        <section className="car-sec">
          <div className="container mx-auto px-6 md:px-[56px] max-w-[1400px]">
            <div className="car-grid">
              <div>
                <div className="lbl opacity-60">Join Our Community</div>
                <h2 className="car-t">Start earning<br />from your next<br />flight</h2>
                <p className="car-tx">Flying internationally? Earn $200–$500 per trip with your unused luggage space. Verify your identity, post your trip, and get matched with senders heading your way. Flexible, safe, rewarding.</p>
                <Link to="/account/post-trip" className="btn-w" style={{ background: '#23bcf2', color: 'white' }}>Become a Traveler</Link>
              </div>
              <div className="car-stats">
                <div className="sc-card">
                  <div className="sc-ic"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
                  <div className="sc-n">40+</div>
                  <div className="sc-lb">Countries active</div>
                </div>
                <div className="sc-card">
                  <div className="sc-ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></div>
                  <div className="sc-n">180+</div>
                  <div className="sc-lb">Routes covered</div>
                </div>
                <div className="sc-card">
                  <div className="sc-ic"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
                  <div className="sc-n">$350</div>
                  <div className="sc-lb">Avg. earning per trip</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Faces Section (Travelers) */}
        <section className="fac-sec">
          <div className="container mx-auto px-6 md:px-[56px] max-w-[1400px]">
            <div className="fac-hdr">
              <div>
                <div className="lbl opacity-50">Real People, Real Deliveries</div>
                <h2 className="fac-t">Meet our travelers</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="fac-arrows">
                  <button className="fac-arr" disabled><ChevronRight className="w-4 h-4 rotate-180" /></button>
                  <button className="fac-arr"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <Link to="/account/post-trip" className="btn-w" style={{ background: '#23bcf2', color: 'white' }}>Join as Traveler</Link>
              </div>
            </div>
            <div className="fac-clip">
              <div className="fac-track">
                {travelers.map((traveler, idx) => (
                  <div key={idx} className="fc">
                    <img src={traveler.img} alt={traveler.name} />
                    <div className="fc-ov"></div>
                    <div className="fc-info">
                      <div className="fc-name">{traveler.name}</div>
                      <div className="fc-role">{traveler.role} · Earned {traveler.earned}</div>
                      <button className="fc-meet">View Profile</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Innovation Grid */}
        <ServicesGrid />
      </main>
      
      <Footer />
    </div>
  );
}
