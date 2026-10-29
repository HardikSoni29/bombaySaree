import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Award, ShieldCheck, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';

interface HeroBannerProps {
  onExplore: () => void;
  onSelectCategory?: (category: string) => void;
}

interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  italicWord: string;
  afterTitle: string;
  subtitle: string;
  provenance: string;
  price: string;
  category: string;
  imageUrl: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'kanjivaram',
    tag: 'Imperial Bridal Trousseau 2026',
    title: 'Where Master Looms Meet',
    italicWord: 'Couture Drapes',
    afterTitle: '',
    subtitle: 'Hand-spun pure mulberry silk woven with certified 24K gold electroplated zari on ancient Korvai pit looms. Individually verified by physical barcode.',
    provenance: 'Kanchipuram Master Weavers • Tamil Nadu',
    price: '₹48,000',
    category: 'cat-kanjivaram',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'banarasi',
    tag: 'Varanasi Master Kadwa Archive',
    title: 'The Timeless Radiance of',
    italicWord: 'Imperial Kadwa',
    afterTitle: 'Brocades',
    subtitle: 'Over 180 hours of meticulous hand-needle insertion creating unbroken floral jaals that drape with regal weight and fluid luminescence.',
    provenance: 'Varanasi Heritage Looms • Uttar Pradesh',
    price: '₹52,000',
    category: 'cat-banarasi',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'tissue',
    tag: 'Evening Cocktails & Soirée Edit',
    title: 'Whisper-Light Metallic',
    italicWord: 'Tissue & Chanderi',
    afterTitle: 'Silks',
    subtitle: 'Intricate zardozi scallopped edges with gossamer metallic warps, designed for unforgettable celebrations under ambient starlight.',
    provenance: 'Pranpur Loom Collective • Madhya Pradesh',
    price: '₹38,000',
    category: 'cat-chanderi',
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=85',
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore, onSelectCategory }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-advance slide gently every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlideIndex];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <div className="relative bg-[#1A060B] text-ivory-50 overflow-hidden border-b border-gold-600/30 perspective-1200">
      {/* Decorative Indian jaal / filigree background */}
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-burgundy-900/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Typography & Actions with 3D Depth */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left transition-all duration-700">
            {/* Tag / Micro Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/15 border border-gold-400/40 text-gold-300 text-xs font-serif uppercase tracking-[0.2em] shadow-md backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
              <span>{slide.tag}</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-ivory-50 leading-[1.12]">
              {slide.title}{' '}
              <span className="gold-gradient-text italic font-medium block sm:inline drop-shadow-[0_4px_12px_rgba(212,175,55,0.35)]">
                {slide.italicWord}
              </span>{' '}
              {slide.afterTitle}
            </h1>

            {/* Description narrative */}
            <p className="text-sm sm:text-base text-ivory-200/90 max-w-2xl font-light leading-relaxed">
              {slide.subtitle}
            </p>

            {/* 3D Tactile CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => {
                  if (onSelectCategory && slide.category) {
                    onSelectCategory(slide.category);
                  } else {
                    onExplore();
                  }
                }}
                className="btn-3d-gold flex items-center gap-2.5 px-7 py-3.5 rounded-full font-serif font-bold text-sm tracking-wide transition"
              >
                <span>Explore This Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExplore}
                className="btn-3d-burgundy flex items-center gap-2 px-5 py-3.5 rounded-full font-serif text-xs uppercase tracking-widest border border-gold-500/30 backdrop-blur-sm transition"
              >
                <span>All Master Weaves</span>
              </button>
            </div>

            {/* Slide Navigation Thumbnails & Toggles */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-3">
              <div className="flex gap-2">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      currentSlideIndex === idx
                        ? 'w-10 bg-gold-400 shadow-[0_0_10px_#D4AF37]'
                        : 'w-3 bg-ivory-600/40 hover:bg-gold-500/50'
                    }`}
                    title={s.tag}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 ml-4">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full bg-burgundy-900/60 hover:bg-burgundy-800 text-gold-300 border border-gold-500/30 transition shadow-sm hover:scale-105"
                  title="Previous Drape"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-full bg-burgundy-900/60 hover:bg-burgundy-800 text-gold-300 border border-gold-500/30 transition shadow-sm hover:scale-105"
                  title="Next Drape"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Triple Seal of Authenticity */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gold-600/20 text-center lg:text-left">
              <div>
                <span className="block font-serif text-lg sm:text-xl font-bold text-gold-400">100% Pure Silk</span>
                <span className="text-[10px] sm:text-[11px] text-ivory-300 uppercase tracking-widest font-mono">Silk Mark Certified</span>
              </div>
              <div>
                <span className="block font-serif text-lg sm:text-xl font-bold text-gold-400">Barcode Trace</span>
                <span className="text-[10px] sm:text-[11px] text-ivory-300 uppercase tracking-widest font-mono">Single Loom Provenance</span>
              </div>
              <div>
                <span className="block font-serif text-lg sm:text-xl font-bold text-gold-400">Kala Ghoda Studio</span>
                <span className="text-[10px] sm:text-[11px] text-ivory-300 uppercase tracking-widest font-mono">Complimentary Try-at-Store</span>
              </div>
            </div>
          </div>

          {/* Right Column: Haute Couture 3D Visual Showcase */}
          <div className="lg:col-span-5 relative flex justify-center preserve-3d">
            {/* Ambient 3D Gold Glow */}
            <div className="absolute inset-0 bg-gold-500/20 rounded-3xl filter blur-2xl transform scale-95" />

            <div className="relative w-72 sm:w-88 h-[400px] sm:h-[480px] rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-2 border-gold-500/40 group card-3d">
              <img
                src={slide.imageUrl}
                alt={slide.title}
                key={slide.id}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-108 animate-fade-in"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/20 to-transparent" />

              {/* Floating 3D Certified Loom Ribbon */}
              <div className="absolute top-4 left-4 card-3d-floating animate-float-3d">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-serif font-bold uppercase tracking-wider bg-burgundy-950/90 text-gold-300 backdrop-blur-md border border-gold-500/50 shadow-xl">
                  <Award className="w-3.5 h-3.5 text-gold-400" />
                  <span>Master Loom Verified</span>
                </span>
              </div>

              {/* Bottom Editorial Caption Card with 3D Depth */}
              <div className="absolute bottom-4 left-4 right-4 p-4 glass-3d-dark rounded-2xl border border-gold-500/40 text-left space-y-1 card-3d-floating shadow-2xl">
                <span className="text-[10px] uppercase font-bold text-gold-400 tracking-widest block font-mono">
                  {slide.provenance}
                </span>
                <h4 className="font-serif text-base font-semibold text-ivory-100 leading-snug">
                  {slide.title} {slide.italicWord}
                </h4>
                <div className="flex items-center justify-between pt-1 border-t border-gold-600/30 text-xs">
                  <span className="text-ivory-400 text-[11px]">Certified Physical Loom Piece</span>
                  <span className="font-serif font-bold text-gold-300 text-sm">{slide.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
