import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* Carbon-grid image from Airbus (same URL) */}
      <img 
        className="ft-bg-img"
        src="https://www.airbus.com/themes/custom/airbus_web_experience_ui/assets/images/airbus-carbon-grid-cropped-lg.png"
        alt=""
      />

      <div className="ft-inner">
        <div className="ft-main">
          <div className="ft-brand">
            <div className="ft-logo">Carry<span>Link</span></div>
            <h2 className="ft-touch">Stay in the loop</h2>
            <div className="ft-social">
              <a href="#" className="si" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" className="si" aria-label="X">
                <svg viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="si sk" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="si" aria-label="TikTok">
                <svg viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.63z" />
                </svg>
              </a>
            </div>
            <a href="#" className="ft-contact">Contact us</a>
          </div>
          
          <div className="ft-col">
            <h3 className="ft-col-h">Platform</h3>
            <ul className="ft-list">
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/browse/shipments">For Senders</Link></li>
              <li><Link to="/browse/listings">For Travelers</Link></li>
              <li><Link to="/policy/prohibited-items">Prohibited Items Policy</Link></li>
              <li><Link to="/account/payments">Escrow &amp; Payments</Link></li>
              <li><Link to="/account/disputes">Dispute Resolution</Link></li>
            </ul>
            <h3 className="ft-col-h">Trust &amp; Safety</h3>
            <ul className="ft-list">
              <li><Link to="/account/kyc">KYC Verification</Link></li>
              <li><Link to="/reputation">Reputation Scores</Link></li>
              <li><Link to="/insurance">Insurance</Link></li>
              <li><Link to="/report">Report a Problem</Link></li>
            </ul>
          </div>
          
          <div className="ft-col">
            <h3 className="ft-col-h">Company</h3>
            <ul className="ft-list">
              <li><Link to="/about">About CarryLink</Link></li>
              <li><Link to="/blog">Blog &amp; Updates</Link></li>
              <li>
                <Link to="/press">
                  Press Kit
                  <span className="ei">
                    <svg viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </span>
                </Link>
              </li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/investors">Investors</Link></li>
            </ul>
            <h3 className="ft-col-h">Active Corridors</h3>
            <ul className="ft-list">
              <li><Link to="/corridors/nigeria-canada">Nigeria &#8596; Canada</Link></li>
              <li><Link to="/corridors/nigeria-uk">Nigeria &#8596; United Kingdom</Link></li>
              <li><Link to="/corridors/nigeria-us">Nigeria &#8596; United States</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="ft-closure">
        <div className="ft-cbar">
          <nav className="ft-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/cookies">Cookie Policy</Link>
            <Link to="/compliance">Compliance</Link>
            <button type="button">Cookie Settings</button>
          </nav>
          <p className="ft-copy">&copy; CarryLink 2026. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
