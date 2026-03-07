import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center pt-[79px] px-6">
        <div className="bg-white p-12 md:p-16 rounded-md shadow-[0_20px_50px_rgba(4,55,75,0.08)] border border-carry-light/10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-carry-light/10 text-carry-light rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-carry-darker mb-4 tracking-tight">404</h1>
          <p className="text-xl font-medium text-carry-muted mb-8">Oops! The page you're looking for doesn't exist.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/" 
              className="bg-carry-light text-white px-8 py-3 rounded-sm font-bold flex items-center justify-center gap-2 hover:bg-carry-light/90 transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Link>
            <Link 
              to="/contact" 
              className="bg-transparent border border-gray-200 text-carry-muted px-8 py-3 rounded-sm font-bold hover:bg-gray-50 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
