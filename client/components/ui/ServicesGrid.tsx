import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const images = [
  'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=640&h=480&fit=crop',
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=512&h=384&fit=crop',
  'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=512&h=384&fit=crop',
  'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=512&h=384&fit=crop',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=512&h=384&fit=crop',
];

const services = [
  {
    title: "Escrow & Payments",
    description: "Your money is held securely and only released once delivery is confirmed by the recipient.",
    linkText: "Learn more",
    link: "/security/escrow"
  },
  {
    title: "KYC Verification",
    description: "Government ID + selfie verification gives every user a trusted verified badge to ensure a community of trust.",
    linkText: "Learn more",
    link: "/security/kyc"
  },
  {
    title: "Smart Matching",
    description: "Smart matching connects senders to travelers by route, weight, price and trust score.",
    linkText: "Learn more",
    link: "/technology/matching"
  },
  {
    title: "Reputation & Reviews",
    description: "Two-way rating after every delivery keeps bad actors off the platform automatically.",
    linkText: "Learn more",
    link: "/reputation"
  },
  {
    title: "Dispute Resolution",
    description: "Dedicated admin panel handles evidence, escrow freezes and full or partial refunds.",
    linkText: "Learn more",
    link: "/disputes"
  }
];

export default function ServicesGrid() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const applyPanorama = useCallback((hoveredIdx: number) => {
    if (!gridRef.current) return;
    const gRect = gridRef.current.getBoundingClientRect();
    const imgUrl = `url('${images[hoveredIdx]}')`;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const cRect = card.getBoundingClientRect();
      const pan = card.querySelector('.bg-panorama') as HTMLDivElement;
      if (!pan) return;

      pan.style.width = gRect.width + 'px';
      pan.style.height = gRect.height + 'px';
      pan.style.left = (-(cRect.left - gRect.left)) + 'px';
      pan.style.top = (-(cRect.top - gRect.top)) + 'px';
      pan.style.backgroundImage = imgUrl;
    });
  }, []);

  useEffect(() => {
    if (activeIdx !== null) {
      applyPanorama(activeIdx);
    }
  }, [activeIdx, applyPanorama]);

  useEffect(() => {
    const handleResize = () => {
      if (activeIdx !== null) {
        applyPanorama(activeIdx);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIdx, applyPanorama]);

  return (
    <section className="services-section py-20 px-6 md:px-[56px]">
      <div className="mb-12">
        <span className="lbl text-[11px] font-bold uppercase tracking-[0.1em] text-carry-accent mb-2.5 block">Security & Infrastructure</span>
        <h2 className="sec-title text-[44px] font-bold text-carry-light leading-[1.08] relative pb-5">
          Platform Built on <em className="italic font-normal">Trust</em>
          <div className="absolute bottom-0 left-0 w-9 h-[3px] bg-carry-light"></div>
        </h2>
      </div>

      <div 
        ref={gridRef}
        className={cn(
          "services-grid",
          activeIdx !== null && "has-hover"
        )}
        onMouseLeave={() => setActiveIdx(null)}
      >
        {services.map((service, idx) => (
          <article 
            key={idx}
            ref={el => cardsRef.current[idx] = el}
            className={cn(
              "service-card",
              activeIdx === idx && "is-active"
            )}
            onMouseEnter={() => setActiveIdx(idx)}
          >
            <div 
              className="bg-own" 
              style={{ backgroundImage: `url('${images[idx]}')` }}
            ></div>
            <div 
              className="bg-panorama"
            ></div>
            <div 
              className="card-overlay"
            ></div>
            
            <div className="card-content">
              <h3 className="card-title-grid">
                {service.title}
              </h3>
              
              <div className="card-body">
                <div className="card-body-inner">
                  <p className="card-description-grid">
                    {service.description}
                  </p>
                  <a 
                    href={service.link} 
                    className="card-btn-grid"
                    onClick={(e) => e.preventDefault()}
                  >
                    {service.linkText}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
