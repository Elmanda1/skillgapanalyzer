import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/hooks/useTheme';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Building2,
  GraduationCap,
  User,
  AlertCircle,
  Sparkles,
  Home,
  Loader2,
} from 'lucide-react';

const DEMO_ROLES = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    sublabel: 'Admin Nasional',
    icon: Shield,
    email: 'admin@skillgap.id',
  },
  {
    role: 'kaprodi',
    label: 'Kaprodi',
    sublabel: 'Admin Kampus',
    icon: Building2,
    email: 'kaprodi1@pnj.ac.id',
  },
  {
    role: 'dosen',
    label: 'Dosen',
    sublabel: 'Pengajar MK',
    icon: GraduationCap,
    email: 'dosen1@pnj.ac.id',
  },
  {
    role: 'mahasiswa',
    label: 'Mahasiswa',
    sublabel: 'Calon Lulusan',
    icon: User,
    email: 'mahasiswa1@pnj.ac.id',
  },
];

const DEMO_PASSWORD = 'password';

const getRoleFromUrl = (urlStr) => {
  try {
    let search = '';
    if (typeof window !== 'undefined' && window.location.search) {
      search = window.location.search;
    } else if (urlStr && urlStr.includes('?')) {
      search = urlStr.substring(urlStr.indexOf('?'));
    }
    if (!search) return null;
    const params = new URLSearchParams(search);
    const roleParam = params.get('role');
    if (!roleParam) return null;
    return DEMO_ROLES.find((r) => r.role.toLowerCase() === roleParam.toLowerCase()) || null;
  } catch (e) {
    return null;
  }
};

export default function LoginPage() {
  const { url } = usePage();
  const initialRole = getRoleFromUrl(url);

  const { resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(() => (initialRole ? initialRole.role : null));
  const [rememberMe, setRememberMe] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    email: initialRole ? initialRole.email : '',
    password: initialRole ? DEMO_PASSWORD : '',
    remember: false,
  });

  const canvasRef = useRef(null);

  // Synchronize when URL changes (e.g. navigation between roles or history back/forward)
  useEffect(() => {
    const matchedRole = getRoleFromUrl(url);
    if (matchedRole) {
      setSelectedRole(matchedRole.role);
      setData((prev) => ({
        ...prev,
        email: matchedRole.email,
        password: DEMO_PASSWORD,
      }));
    }
  }, [url]);

  // Dynamic ambient floating particle system
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

        // Bintik-bintik hitam di light mode, bintik putih di dark mode
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

  const handleRoleSelect = (roleItem) => {
    setSelectedRole(roleItem.role);
    setData({
      ...data,
      email: roleItem.email,
      password: DEMO_PASSWORD,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/login', {
      onFinish: () => reset('password'),
    });
  };

  const formError = errors.email || errors.password;

  return (
    <section className="fixed inset-0 overflow-y-auto bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-500">
      {/* Background Grid Pattern - Kotak-kotak nyata di Light & Dark Mode */}
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

        /* Light Mode line colors */
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

        /* Dark Mode line colors */
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

        /* Card minimal fade-up animation */
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

      {/* Ambient particles - support bintik-bintik hitam di light mode */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 dark:mix-blend-screen"
      />

      {/* Centered Login Container - Card dibesarkan (max-w-lg) */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="card-animate w-full max-w-xl border-gray-200/90 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/85 supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-zinc-900/75 my-8 p-2 sm:p-4">
          <CardHeader className="space-y-2 pb-5 text-center">
            <CardTitle className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Selamat <span className="text-emerald-600 dark:text-emerald-400">Datang</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-500 dark:text-zinc-400 leading-relaxed">
              Masuk ke konsol analitik kurikulum vokasi berbasis data riil industri.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            {/* Quick Demo Role Selectors */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                Pilih Akses Cepat Peran Demo:
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEMO_ROLES.map((roleItem) => {
                  const Icon = roleItem.icon;
                  const isSelected = selectedRole === roleItem.role;
                  return (
                    <button
                      key={roleItem.role}
                      type="button"
                      onClick={() => handleRoleSelect(roleItem)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/60 hover:bg-gray-100/80 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/60 text-gray-700 dark:text-zinc-400'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10.5px] leading-tight block truncate w-full">
                        {roleItem.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Notification */}
            {formError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Email Pengguna</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="nama@kampus.ac.id"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Kata Sandi</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer focus:outline-none"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={data.remember}
                    onChange={(e) => {
                      setRememberMe(e.target.checked);
                      setData('remember', e.target.checked);
                    }}
                  />
                  <Label htmlFor="remember" className="text-xs text-gray-600 dark:text-zinc-400 cursor-pointer">
                    Ingat saya
                  </Label>
                </div>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Silakan gunakan salah satu tombol peran demo di atas untuk login langsung tanpa kata sandi khusus.');
                  }}
                  className="text-xs text-emerald-800 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold"
                >
                  Lupa sandi?
                </a>
              </div>

              <Button
                type="submit"
                disabled={processing}
                className="w-full h-11 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/15 transition-transform active:scale-[0.98] cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Masuk...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
            <div className="text-xs text-gray-500 dark:text-zinc-400">
              Belum memiliki akun?
              <Link href="/register" className="ml-1 text-emerald-800 dark:text-emerald-400 font-bold hover:underline">
                Daftar sebagai Mahasiswa
              </Link>
            </div>

            {/* Button Kembali ke Beranda di dalam Card */}
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
