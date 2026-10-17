import React from 'react';
import { Sparkles, Shield, ArrowRight, Award } from 'lucide-react';

interface HeroBannerProps {
  onExplore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore }) => {
  return (
    <div className="relative bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 text-ivory-50 overflow-hidden border-b border-gold-600/30">
      {/* Decorative Indian jaal background pattern opacity */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-300 text-xs font-serif uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Festive & Bridal Atelier Edit 2026</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ivory-50 leading-tight">
              Where Master Looms Meet <span className="gold-gradient-text italic font-normal">Couture Drapes</span>
            </h1>

            <p className="text-sm sm:text-base text-ivory-200/90 max-w-2xl font-light leading-relaxed">
              Bombay Saree unites India’s most celebrated handloom weavers and independent luxury saree designers under one studio.
              Every physical piece is individually tracked with its own certified barcode, ensuring authentic pure zari and uncompromised provenance.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onExplore}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-semibold text-sm shadow-luxury hover:shadow-luxury-hover transition transform hover:-translate-y-0.5"
              >
                <span>Explore Curated Drapes</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs text-ivory-300 px-4 py-3 bg-burgundy-900/60 rounded-full border border-gold-500/20 backdrop-blur-sm">
                <Award className="w-4 h-4 text-gold-400" />
                <span>Govt. Certified Silk Mark • Pure Gold Zari</span>
              </div>
            </div>

            {/* Quick Studio Highlights */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gold-600/20 text-center lg:text-left">
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">100%</span>
                <span className="text-[11px] text-ivory-300 uppercase tracking-wider">Handwoven Silk</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">Unified</span>
                <span className="text-[11px] text-ivory-300 uppercase tracking-wider">Online & Store Stock</span>
              </div>
              <div>
                <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">7-Day</span>
                <span className="text-[11px] text-ivory-300 uppercase tracking-wider">Complimentary Return</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-72 sm:w-80 h-96 sm:h-[440px] rounded-2xl overflow-hidden shadow-2xl border-4 border-gold-500/30 transform lg:rotate-2 hover:rotate-0 transition duration-500">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85"
                alt="Bridal Kanjivaram Silk Saree"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-charcoal-900/90 backdrop-blur-md rounded-xl border border-gold-500/30 text-left">
                <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider block">
                  Studio Spotlight
                </span>
                <p className="font-serif text-sm font-semibold text-ivory-100">
                  Royal Crimson Kanjivaram (Pure Gold Zari)
                </p>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-ivory-300 font-mono">By Kanjivaram Guild</span>
                  <span className="text-gold-300 font-bold font-serif">₹48,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
