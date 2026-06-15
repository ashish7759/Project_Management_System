import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, User as UserIcon, Loader2, Zap } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/ui/LanguageToggle';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DOT_SPACING = 28;
    const DOT_RADIUS  = 1.8;
    const DOT_COLOR   = '#1a5c38';
    const ACCENT_COLOR= '#c9a84c';

    // Dots array
    type Dot = {
      x: number;
      y: number;
      phase: number;
      speed: number;
      isAccent: boolean;
    };

    let dots: Dot[] = [];
    let animFrameId: number;

    const buildDots = () => {
      dots = [];
      const cols = Math.ceil(canvas.width  / DOT_SPACING) + 1;
      const rows = Math.ceil(canvas.height / DOT_SPACING) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x       : c * DOT_SPACING,
            y       : r * DOT_SPACING,
            phase   : Math.random() * Math.PI * 2,
            speed   : 0.4 + Math.random() * 0.6,
            isAccent: Math.random() < 0.06,
          });
        }
      }
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildDots();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach(dot => {
        const t       = time * 0.001 * dot.speed + dot.phase;
        const opacity = 0.06 + 0.28 * (0.5 + 0.5 * Math.sin(t));
        const radius  = DOT_RADIUS * (0.85 + 0.3 * (0.5 + 0.5 * Math.sin(t)));

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = dot.isAccent
          ? ACCENT_COLOR
          : DOT_COLOR;
        ctx.globalAlpha = opacity;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animFrameId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const loginSchema = z.object({
    username: z.string().min(3, t('auth.username_min')),
    password: z.string().min(6, t('auth.password_min')),
  });

  type LoginFormInput = z.infer<typeof loginSchema>;

  useEffect(() => {
    const navigationEntries = performance.getEntriesByType('navigation');
    let isReload = false;
    if (navigationEntries.length > 0) {
      const navType = (navigationEntries[0] as PerformanceNavigationTiming).type;
      isReload = navType === 'reload';
    } else {
      // Fallback for compatibility
      isReload = performance.navigation.type === 1;
    }

    if (isReload && !(window as any).__hasVisitedIntro) {
      navigate('/');
    }
  }, [navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.detail || err.response.data.message || t('auth.invalid_credentials'));
      } else if (err.request) {
        setErrorMsg(t('auth.server_error'));
      } else {
        setErrorMsg(t('auth.invalid_credentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden" 
      style={{ 
        backgroundColor: '#f7faf8',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Dot Grid Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes boltFlash {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        .animate-boltFlash {
          animation: boltFlash 1.6s infinite ease-in-out;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.3); }
        }
        .login-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px -2px rgba(26, 92, 56, 0.08), 0 2px 8px -1px rgba(26, 92, 56, 0.04);
        }
        .login-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(26, 92, 56, 0.14), 0 0 35px 4px rgba(201, 168, 76, 0.22);
          border-color: rgba(201, 168, 76, 0.45) !important;
        }
      `}} />

      <div 
        className="w-full max-w-md space-y-6 rounded-xl border p-8 relative login-card"
        style={{
          backgroundColor: '#ffffff',
          borderTop: '4px solid #1a5c38',
          borderColor: 'rgba(26, 92, 56, 0.15)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Logo/Emblem Area */}
        <div className="text-center">
          <div 
            className="relative w-[92px] h-[92px] rounded-full border-[1.5px] flex items-center justify-center shadow-sm mx-auto mb-4"
            style={{
              borderColor: '#c9a84c',
              backgroundColor: '#f9f5ec'
            }}
          >
            {/* 4 golden dots */}
            <div className="absolute -top-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />
            <div className="absolute -bottom-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />
            <div className="absolute -left-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />
            <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#c9a84c' }} />

            {/* Inner circle */}
            <div 
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow animate-boltFlash"
              style={{ backgroundColor: '#1a5c38' }}
            >
              <Zap 
                size={32} 
                style={{ color: '#c9a84c' }} 
              />
            </div>
          </div>
          
          <h2 className="text-xl font-bold tracking-tight animate-fadeIn" style={{ color: '#1a5c38' }}>
            {t('app.name')}
          </h2>
          <p className="mt-1 text-xs animate-fadeIn" style={{ color: '#666666' }}>
            {t('auth.sign_in')}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Username Input */}
          <Input
            id="username"
            type="text"
            label={t('auth.username')}
            autoComplete="username"
            placeholder={t('auth.username')}
            error={errors.username?.message}
            {...register('username')}
          />

          {/* Password Input */}
          <Input
            id="password"
            type="password"
            label={t('auth.password')}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <span style={{ color: '#666666' }}>{t('auth.need_account')}</span>
            <Link to="/register" className="font-semibold transition duration-150" style={{ color: '#c9a84c' }} onMouseOver={(e) => e.currentTarget.style.color = '#a8863c'} onMouseOut={(e) => e.currentTarget.style.color = '#c9a84c'}>
              {t('auth.register_link')}
            </Link>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.authenticating')}
                </>
              ) : (
                t('auth.login_btn')
              )}
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-primary/10">
          <span className="text-[11px]" style={{ color: '#999999' }}>
            {t('auth.footer_text')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
