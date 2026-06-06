import React, { useState, useEffect } from 'react';
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
      } else {
        setErrorMsg(t('auth.invalid_credentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative" style={{ backgroundColor: '#f7faf8' }}>
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
      `}} />

      <div 
        className="w-full max-w-md space-y-6 rounded-xl border p-8 shadow-md relative"
        style={{
          backgroundColor: '#ffffff',
          borderTop: '4px solid #1a5c38',
          borderColor: 'rgba(26, 92, 56, 0.15)'
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
