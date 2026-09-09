import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import {
  Mail,
  ArrowRight,
  Home,
  Loader2,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canvasRef = useRef(null);

  // Dynamic ambient floating particle system (Sama persis dengan LoginPage & RegisterPage)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    let raf = 0;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    const isDark = resolvedTheme === 'dark';

    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.35 + 0.08,
      o: Math.random() * 0.45 + 0.25,
      size: Math.random() * 1.6 + 1.0,
    });

    let ps = [];
    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 5500);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      if (!isMounted) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 25;
          p.v = Math.random() * 0.35 + 0.08;
          p.o = Math.random() * 0.45 + 0.25;
        }

        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${p.o * 0.85})`
          : `rgba(15, 23, 42, ${p.o * 0.9})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener('resize', onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [resolvedTheme]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulasi pengiriman magic link pemulihan kata sandi
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1200);
  };

  return (
    <section className="fixed inset-0 overflow-y-auto bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-500">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-80" />

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(15, 23, 42, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.08) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .dark .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
        }

        .accent-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.9;
        }
        .hline, .vline {
          position: absolute;
          will-change: transform, opacity;
        }
        .hline {
          left: 0;
          right: 0;
          height: 1.5px;
          transform: scaleX(0);
          transform-origin: 50% 50%;
          animation: drawX 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .vline {
          top: 0;
          bottom: 0;
          width: 1.5px;
          transform: scaleY(0);
          transform-origin: 50% 0%;
          animation: drawY 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .hline:nth-child(1) { top: 15%; animation-delay: 0.12s; }
        .hline:nth-child(2) { top: 50%; animation-delay: 0.22s; }
        .hline:nth-child(3) { top: 85%; animation-delay: 0.32s; }
        .vline:nth-child(4) { left: 18%; animation-delay: 0.42s; }
        .vline:nth-child(5) { left: 50%; animation-delay: 0.54s; }
        .vline:nth-child(6) { left: 82%; animation-delay: 0.66s; }

        .hline, .vline {
          background: rgba(15, 23, 42, 0.15);
        }
        .hline::after, .vline::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(15, 23, 42, 0.35), transparent);
          opacity: 0;
          animation: shimmer 1s ease-out forwards;
        }

        .dark .hline, .dark .vline {
          background: #27272a;
        }
        .dark .hline::after, .dark .vline::after {
          background: linear-gradient(90deg, transparent, rgba(250, 250, 250, 0.28), transparent);
        }

        .hline:nth-child(1)::after { animation-delay: 0.12s; }
        .hline:nth-child(2)::after { animation-delay: 0.22s; }
        .hline:nth-child(3)::after { animation-delay: 0.32s; }
        .vline:nth-child(4)::after { animation-delay: 0.42s; }
        .vline:nth-child(5)::after { animation-delay: 0.54s; }
        .vline:nth-child(6)::after { animation-delay: 0.66s; }

        @keyframes drawX {
          0% { transform: scaleX(0); opacity: 0; }
          60% { opacity: 0.95; }
          100% { transform: scaleX(1); opacity: 0.75; }
        }
        @keyframes drawY {
          0% { transform: scaleY(0); opacity: 0; }
          60% { opacity: 0.95; }
          100% { transform: scaleY(1); opacity: 0.75; }
        }
        @keyframes shimmer {
          0% { opacity: 0; }
          35% { opacity: 0.4; }
          100% { opacity: 0; }
        }

        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) 0.3s forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(15,23,42,0.04),transparent_65%)] dark:[background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Animated accent lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Ambient particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 dark:mix-blend-screen"
      />

      {/* Centered Forgot Password Container */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="card-animate w-full max-w-xl border-gray-200/90 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/85 supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-zinc-900/75 my-8 p-2 sm:p-4">
          <CardHeader className="space-y-2 pb-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-1">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Lupa <span className="text-emerald-600 dark:text-emerald-400">Kata Sandi</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-500 dark:text-zinc-400 leading-relaxed">
              Masukkan email Anda yang terdaftar untuk menerima tautan pemulihan kata sandi (Magic Link).
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            {isSubmitted ? (
              <div className="space-y-4 text-center py-2">
                <div className="p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl dark:bg-emerald-950/50 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm leading-relaxed space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tautan Pemulihan Dikirim!</span>
                  </div>
                  <p>
                    Tautan reset kata sandi (Magic Link) telah berhasil dikirimkan ke <strong>{email}</strong>.
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                    Silakan periksa kotak masuk atau folder spam email Anda untuk melanjutkan pemulihan akun.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setIsLoading(false);
                    }}
                    className="w-full h-11 rounded-xl border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Ganti Email / Kirim Ulang</span>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">Email Pengguna Terdaftar</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@kampus.ac.id"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/15 transition-transform active:scale-[0.98] cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan Tautan Pemulihan...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Tautan Reset Sandi</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
            <div className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
              Ingat kata sandi Anda?
              <Link href="/login" className="ml-1 text-emerald-800 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Login</span>
              </Link>
            </div>

            {/* Button Kembali ke Beranda */}
            <Button
              type="button"
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="w-full h-10 rounded-xl border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Home className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
              <span>Kembali ke Beranda</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
