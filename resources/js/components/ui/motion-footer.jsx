import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles, BookOpen, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useTheme } from "@/hooks/useTheme";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES (Supports Light & Dark Modes)
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: var(--footer-bg);
  color: var(--footer-text);
  transition: background-color 0.3s ease, color 0.3s ease;
  
  /* Light Mode Variables (Default) */
  --footer-bg: #f8fafc;
  --footer-text: #0f172a;
  --footer-subtext: #475569;
  --giant-text-stroke: rgba(0, 53, 39, 0.12);
  --giant-text-bg: linear-gradient(180deg, rgba(0, 53, 39, 0.16) 0%, rgba(0, 53, 39, 0.02) 65%, transparent 100%);
  --giant-accent-stroke: rgba(5, 150, 105, 0.32);
  --giant-accent-bg: linear-gradient(180deg, rgba(5, 150, 105, 0.35) 0%, rgba(5, 150, 105, 0.06) 65%, transparent 100%);
  --marquee-bg: rgba(255, 255, 255, 0.85);
  --marquee-border: rgba(0, 0, 0, 0.08);
  --marquee-text: #064e3b;
  --pill-bg-1: rgba(255, 255, 255, 0.9);
  --pill-bg-2: rgba(241, 245, 249, 0.85);
  --pill-shadow: rgba(0, 0, 0, 0.06);
  --pill-highlight: rgba(255, 255, 255, 0.95);
  --pill-inset-shadow: rgba(0, 0, 0, 0.03);
  --pill-border: rgba(0, 0, 0, 0.08);
  --pill-text: #334155;
  --pill-bg-1-hover: rgba(236, 253, 245, 0.95);
  --pill-bg-2-hover: rgba(209, 250, 229, 0.9);
  --pill-border-hover: rgba(16, 185, 129, 0.5);
  --pill-shadow-hover: rgba(16, 185, 129, 0.15);
  --pill-highlight-hover: rgba(255, 255, 255, 1);
  --pill-text-hover: #064e3b;
  --heading-gradient: linear-gradient(180deg, #064e3b 0%, #065f46 100%);
  --grid-color: rgba(0, 53, 39, 0.04);
  --aurora-1: rgba(16, 185, 129, 0.12);
  --aurora-2: rgba(13, 148, 136, 0.08);
}

/* Dark Mode Variables */
html.dark .cinematic-footer-wrapper {
  --footer-bg: #020617;
  --footer-text: #ffffff;
  --footer-subtext: #94a3b8;
  --giant-text-stroke: rgba(255, 255, 255, 0.08);
  --giant-text-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 65%, transparent 100%);
  --giant-accent-stroke: rgba(52, 211, 153, 0.25);
  --giant-accent-bg: linear-gradient(180deg, rgba(52, 211, 153, 0.3) 0%, rgba(5, 150, 105, 0.08) 65%, transparent 100%);
  --marquee-bg: rgba(2, 6, 23, 0.8);
  --marquee-border: rgba(255, 255, 255, 0.1);
  --marquee-text: rgba(110, 231, 183, 0.9);
  --pill-bg-1: rgba(255, 255, 255, 0.05);
  --pill-bg-2: rgba(255, 255, 255, 0.02);
  --pill-shadow: rgba(0, 0, 0, 0.4);
  --pill-highlight: rgba(255, 255, 255, 0.12);
  --pill-inset-shadow: rgba(0, 0, 0, 0.6);
  --pill-border: rgba(255, 255, 255, 0.1);
  --pill-text: #cbd5e1;
  --pill-bg-1-hover: rgba(16, 185, 129, 0.15);
  --pill-bg-2-hover: rgba(5, 150, 105, 0.08);
  --pill-border-hover: rgba(52, 211, 153, 0.4);
  --pill-shadow-hover: rgba(6, 78, 59, 0.5);
  --pill-highlight-hover: rgba(255, 255, 255, 0.25);
  --pill-text-hover: #ffffff;
  --heading-gradient: linear-gradient(180deg, #ffffff 0%, rgba(209, 250, 229, 0.8) 100%);
  --grid-color: rgba(255, 255, 255, 0.03);
  --aurora-1: rgba(6, 95, 70, 0.4);
  --aurora-2: rgba(13, 148, 136, 0.25);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.85; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.5)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    var(--aurora-1) 0%, 
    var(--aurora-2) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--pill-text);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--pill-text-hover);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: clamp(2.2rem, 9.4vw, 10.5rem);
  line-height: 0.85;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1px var(--giant-text-stroke);
  background: var(--giant-text-bg);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-giant-accent {
  -webkit-text-stroke: 1px var(--giant-accent-stroke);
  background: var(--giant-accent-bg);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: var(--heading-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
html.dark .footer-text-glow {
  filter: drop-shadow(0px 0px 30px rgba(52, 211, 153, 0.35));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE
// -------------------------------------------------------------------------
export const MagneticButton = React.forwardRef(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            rotationX: -y * 0.12,
            rotationY: x * 0.12,
            scale: 1.04,
            ease: "power2.out",
            duration: 0.35,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1.1, 0.4)",
            duration: 0.7,
          });
        };

        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={cn("cursor-pointer transition-transform duration-200 select-none", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MARQUEE ITEM
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span className="font-black tracking-widest text-sm text-emerald-800 dark:text-emerald-300">SKILL GAP ANALYZER</span> <span className="text-emerald-600 dark:text-emerald-400">✦</span>
    <span>Capaian Pembelajaran Terstandarisasi</span> <span className="text-teal-600 dark:text-teal-300">✦</span>
    <span>Link and Match Vokasi Industri</span> <span className="text-emerald-600 dark:text-emerald-400">✦</span>
    <span>Analisis Vektor Semantik NLP</span> <span className="text-teal-600 dark:text-teal-300">✦</span>
    <span>Kesiapan Akreditasi LAM-INFOKOM</span> <span className="text-emerald-600 dark:text-emerald-400">✦</span>
    <span>Rekomendasi Revisi RPS Otomatis</span> <span className="text-teal-600 dark:text-teal-300">✦</span>
    <span>Pendidikan Tinggi Vokasi</span> <span className="text-emerald-600 dark:text-emerald-400">✦</span>
  </div>
);

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC FOOTER COMPONENT
// -------------------------------------------------------------------------
export function CinematicFooter() {
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax text background
      if (giantTextRef.current) {
        gsap.fromTo(
          giantTextRef.current,
          { y: "10vh", scale: 0.82, opacity: 0 },
          {
            y: "0vh",
            scale: 1,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: 1.2,
            },
          }
        );
      }

      // Stagger in links
      if (linksRef.current) {
        gsap.from(linksRef.current.children, {
          y: 28,
          opacity: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        });
      }
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 
        Curtain Reveal Container:
        Seamlessly reveals the fixed cinematic footer underneath 
        as the user scrolls into the bottom of the page.
      */}
      <div
        ref={wrapperRef}
        className="relative h-[95vh] sm:h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="fixed bottom-0 left-0 flex h-[95vh] sm:h-screen w-full flex-col justify-between overflow-hidden cinematic-footer-wrapper">

          {/* Ambient Light Aurora & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[100px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background typography watermark */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[2vh] sm:-bottom-[3vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none tracking-tight text-center w-full px-2"
          >
            <span>SKILL GAP </span>
            <span className="footer-giant-accent">ANALYZER</span>
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div
            className="absolute top-10 left-0 w-full overflow-hidden border-y py-3.5 z-10 -rotate-1 scale-105 shadow-md"
            style={{
              backgroundColor: "var(--marquee-bg)",
              borderColor: "var(--marquee-border)",
              color: "var(--marquee-text)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex w-max animate-footer-scroll-marquee text-xs font-bold tracking-[0.25em] uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          {/* 2. Main Center Action Area */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 mt-16 w-full max-w-4xl mx-auto text-center">

            <div className="mb-6 opacity-90 hover:opacity-100 transition-opacity">
              <BrandLogo className="h-6 sm:h-8 w-auto" />
            </div>

            <h2
              ref={headingRef}
              className="text-4xl sm:text-6xl md:text-7xl font-black footer-text-glow tracking-tighter mb-8 max-w-3xl leading-[1.08]"
            >
              Siap Menyelaraskan Kurikulum Anda?
            </h2>

            <p
              className="text-sm sm:text-base max-w-xl mb-10 leading-relaxed"
              style={{ color: "var(--footer-subtext)" }}
            >
              Hubungkan mata kuliah prodi vokasi Anda dengan ribuan lowongan kerja riil dan ekspor bukti evaluasi kurikulum berbasis data pasar sekarang juga.
            </p>

            {/* Interactive Magnetic Action Pills */}
            <div ref={linksRef} className="flex flex-col items-center gap-5 w-full">
              {/* Primary Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3.5 w-full">
                <MagneticButton
                  as={Link}
                  href="/login"
                  className="gradient-brand-cta px-8 py-4 rounded-full text-white font-bold text-sm sm:text-base flex items-center gap-3 group shadow-lg hover:opacity-95"
                >
                  Mulai Analisis Gratis
                  <ArrowRight size={16} className="text-white group-hover:translate-x-1 transition-transform" />
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="#live-demo"
                  className="footer-glass-pill px-7 py-4 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2.5 group"
                >
                  Coba Simulasi Kurikulum
                </MagneticButton>
              </div>

              {/* Secondary Navigation Links */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full mt-2">
                <MagneticButton
                  as={Link}
                  href="/login"
                  className="footer-glass-pill px-5 py-2.5 rounded-full font-medium text-xs"
                >
                  Portal Kaprodi
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href="/login"
                  className="footer-glass-pill px-5 py-2.5 rounded-full font-medium text-xs"
                >
                  Portal Dosen
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href="/login"
                  className="footer-glass-pill px-5 py-2.5 rounded-full font-medium text-xs"
                >
                  Portal Mahasiswa
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="#faq"
                  className="footer-glass-pill px-5 py-2.5 rounded-full font-medium text-xs"
                >
                  Pusat Bantuan & FAQ
                </MagneticButton>
              </div>

              {/* Copyright placed directly below the button controls */}
              <div
                className="text-[11px] font-semibold tracking-wider uppercase text-center mt-6"
                style={{ color: "var(--footer-subtext)" }}
              >
                © 2026 Skill Gap Analyzer · Politeknik Negeri Jakarta
              </div>
            </div>
          </div>

          {/* 3. Bottom Utility Bar */}
          <div className="relative z-20 w-full pb-6 px-4 sm:px-8 md:px-12 flex items-center justify-end">
            {/* Back to top magnetic button */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              aria-label="Kembali ke atas"
              className="w-10 h-10 rounded-full footer-glass-pill flex items-center justify-center group"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CinematicFooter;
