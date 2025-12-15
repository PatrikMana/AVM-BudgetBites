import { Link, useLocation } from 'react-router-dom'
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center overflow-x-hidden">
      <div className="text-center px-6">
        <div className="mb-8">
          <span className="text-[120px] md:text-[180px] font-bold text-white/20 leading-none block">
            404
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Stránka nenalezena
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          Omlouváme se, ale stránka kterou hledáte neexistuje nebo byla přesunuta.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Zpět domů
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
