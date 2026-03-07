import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Mock authentication state for now
  const isAuthenticated = false; 

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Handle background change
      if (currentScrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Handle hide/show on scroll
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "site-header fixed top-0 left-0 right-0 h-[79px] z-[1000] flex items-stretch transition-all duration-300",
        isScrolled ? "bg-carry-darker/90 backdrop-blur-xl border-b border-white/10" : "bg-carry-darker/20 backdrop-blur-md border-b border-white/10",
        isHidden && !isMobileMenuOpen ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="header-inner flex items-stretch w-full">
        <div className="header-left flex items-stretch flex-shrink-0">
          <button 
            className="menu-toggle relative flex items-center gap-3 px-7 pl-[72px] text-white bg-transparent border-none cursor-pointer font-medium text-[15px] tracking-wide group"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="hamburger flex flex-col gap-[5px] w-[22px]">
              <span className="block h-[1.5px] bg-white rounded-sm w-full transition-all group-hover:w-full"></span>
              <span className="block h-[1.5px] bg-white rounded-sm w-[16px] transition-all group-hover:w-full"></span>
              <span className="block h-[1.5px] bg-white rounded-sm w-[10px] transition-all group-hover:w-full"></span>
            </div>
            <span className="hidden md:inline">Menu</span>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
          
          <div className="hdiv w-[1px] bg-white/20 self-stretch flex-shrink-0"></div>
          
          <div className="header-logo flex items-center px-[52px] flex-shrink-0">
            <Link to="/" className="logo-wm text-[26px] font-bold text-white tracking-wide no-underline block">
              Carry<span className="text-carry-light">Link</span>
            </Link>
          </div>
        </div>

        <div className="header-right flex items-stretch ml-auto">
          <nav className="header-nav hidden md:flex items-stretch">
            <NavLink
              to="/how-it-works"
              className={({ isActive }) => cn(
                "relative flex items-center px-[22px] text-white/90 text-[15px] font-normal no-underline whitespace-nowrap transition-colors group hover:text-carry-light",
                isActive && "text-carry-light"
              )}
            >
              How It Works
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light transition-transform origin-left",
                location.pathname === "/how-it-works" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}></div>
            </NavLink>
            <NavLink
              to="/browse/listings"
              className={({ isActive }) => cn(
                "relative flex items-center px-[22px] text-white/90 text-[15px] font-normal no-underline whitespace-nowrap transition-colors group hover:text-carry-light",
                isActive && "text-carry-light"
              )}
            >
              For Travelers
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light transition-transform origin-left",
                location.pathname === "/browse/listings" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}></div>
            </NavLink>
            <NavLink
              to="/browse/shipments"
              className={({ isActive }) => cn(
                "relative flex items-center px-[22px] text-white/90 text-[15px] font-normal no-underline whitespace-nowrap transition-colors group hover:text-carry-light",
                isActive && "text-carry-light"
              )}
            >
              For Senders
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light transition-transform origin-left",
                location.pathname === "/browse/shipments" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}></div>
            </NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink 
                  to="/account/dashboard" 
                  className={({ isActive }) => cn(
                    "relative flex items-center px-[22px] text-white/90 text-[15px] font-normal no-underline whitespace-nowrap transition-colors group hover:text-carry-light",
                    isActive && "text-carry-light"
                  )}
                >
                  My Account
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light transition-transform origin-left",
                    location.pathname.startsWith("/account") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}></div>
                </NavLink>
                <button className="relative flex items-center px-[22px] text-white/90 transition-colors group hover:text-carry-light">
                  <Bell className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button 
                className="nav-signup relative flex items-center px-[22px] bg-carry-light/20 text-white text-[15px] font-normal no-underline whitespace-nowrap transition-all hover:bg-carry-light/30"
              >
                Sign Up
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            )}
          </nav>
          
          <button className="search-btn relative flex items-center gap-2 px-6 pr-[72px] text-white/90 bg-transparent border-l border-white/20 cursor-pointer font-normal text-[15px] whitespace-nowrap group hover:text-carry-light">
            <Search className="w-5 h-5" />
            <span className="hidden lg:inline">Search</span>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
        </div>
      </div>
    </header>
  );
}
