import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

interface SectionLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  children
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-white">
      {/* Premium Header with Subtle Gradient */}
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-all duration-250 font-medium"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
              
              {/* Premium Title with Gradient and Icons */}
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent tracking-tight">
                    {title}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time Analytics & Insights</p>
                </div>
              </div>
            </div>
            
            {/* Right accent */}
            <div className="hidden md:flex items-center gap-2 text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Content Area */}
      <div className="container mx-auto px-6 py-10">
        <main className="space-y-8">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};
