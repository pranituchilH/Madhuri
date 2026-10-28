'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    image: '/brand/hero-1.jpg',
    eyebrow: 'The Banarasi Edit',
    title: ['Elegance', 'Woven in Every Thread'],
    text: 'Luminous soft silks with golden zari jaal and rich contrast borders — crafted for the moments you will remember.',
    cta: ['Explore Collection', '/shop'],
    tone: 'dark',
  },
  {
    image: '/brand/hero-2.jpg',
    eyebrow: 'New Arrivals',
    title: ['A Palette of', 'Celebration'],
    text: 'Peacock blue, rani pink, royal purple and more — discover this season’s freshest drapes.',
    cta: ['Shop New In', '/shop?isNew=1'],
    tone: 'light',
  },
  {
    image: '/brand/hero-3.jpg',
    eyebrow: 'Bridal & Wedding',
    title: ['Draped in', 'Tradition'],
    text: 'Heirloom-worthy sarees with heavy zari pallus for the bride, her family and every wedding ritual.',
    cta: ['Shop Bridal', '/shop?category=bridal'],
    tone: 'dark',
  },
];

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const go = (d) => setI((x) => (x + d + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      <div className="relative h-[600px] sm:h-[620px] lg:h-[680px]">
        {SLIDES.map((s, idx) => {
          const dark = s.tone === 'dark';
          return (
            <div key={s.image} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={idx !== i}>
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[78%_center] lg:object-right" />
              <div className={`absolute inset-0 ${dark ? 'bg-gradient-to-r from-maroon-900/95 via-maroon-900/70 to-transparent max-lg:bg-maroon-900/70' : 'bg-gradient-to-r from-cream-light via-cream-light/85 to-transparent max-lg:bg-cream-light/80'}`} />
              <div className="container relative flex h-full items-center">
                <div key={idx === i ? 'on' : 'off'} className="max-w-xl animate-fade-up">
                  <p className={`eyebrow ${dark ? 'text-gold-300' : ''}`}>{s.eyebrow}</p>
                  <h1 className={`mt-4 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl ${dark ? 'text-cream-light' : 'text-maroon-900'}`}>
                    {s.title[0]}
                    <span className={`block italic ${dark ? 'text-gold-300' : 'text-maroon-600'}`}>{s.title[1]}</span>
                  </h1>
                  <p className={`mt-6 max-w-md text-base leading-relaxed ${dark ? 'text-cream/85' : 'text-ink-soft'}`}>{s.text}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={s.cta[1]} className={dark ? 'btn-gold' : 'btn-primary'}>
                      {s.cta[0]} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/about" className={`btn border ${dark ? 'border-gold-300/60 text-cream-light hover:bg-white/10' : 'border-maroon-700 text-maroon-700 hover:bg-maroon-50'}`}>
                      Our Story
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-6">
        <div className="container flex items-center justify-between">
          <div className="flex gap-2">
            {SLIDES.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-10 bg-gold-400' : 'w-4 bg-gold-200/60'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(-1)} aria-label="Previous slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300/60 bg-white/10 text-gold-200 backdrop-blur hover:bg-gold-400 hover:text-maroon-900">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next slide" className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300/60 bg-white/10 text-gold-200 backdrop-blur hover:bg-gold-400 hover:text-maroon-900">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
