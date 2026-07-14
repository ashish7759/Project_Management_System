import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Loader2, Zap } from 'lucide-react';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/ui/LanguageToggle';

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { t, language, getTranslatedDept } = useLanguage();
  const { isDark } = useTheme();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerSchema = z.object({
    full_name: z.string().min(2, t('auth.name_min')),
    employee_id: z.string().min(2, t('auth.emp_id_min')),
    email: z.string().email(t('auth.email_invalid')),
    mobile: z.string().min(10, t('auth.mobile_min')).max(15, t('auth.mobile_max')),
    username: z.string().min(3, t('auth.username_min')),
    password: z.string().min(6, t('auth.password_min')),
    confirm_password: z.string(),
    department: z.string().min(1, t('auth.select_dept_err')),
  }).refine((data) => data.password === data.confirm_password, {
    message: t('auth.passwords_dont_match'),
    path: ["confirm_password"],
  });

  type RegisterFormInput = z.infer<typeof registerSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await registerUser(data);
      setSuccessMsg(res.message || t('auth.register_success'));
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg(language === 'hi' ? 'पंजीकरण जमा करने में विफल। कृपया विवरण सत्यापित करें और पुनः प्रयास करें।' : 'Failed to submit registration. Please verify details and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = [
    'Engineering',
    'Finance',
    'Operations',
    'HR',
    'IT',
    'Administration'
  ];

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative" 
      style={{ backgroundColor: isDark ? '#0f1a13' : '#f7faf8' }}
    >
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
        className="w-full max-w-xl space-y-6 rounded-xl border p-8 shadow-md relative animate-fadeIn"
        style={{
          backgroundColor: isDark ? '#1a2b1f' : '#ffffff',
          borderTop: isDark ? '4px solid #2e7d52' : '4px solid #1a5c38',
          borderColor: isDark ? 'rgba(46, 125, 82, 0.25)' : 'rgba(26, 92, 56, 0.15)'
        }}
      >
        {/* Logo/Emblem Area */}
        <div className="text-center">
          <div 
            className="relative w-[92px] h-[92px] rounded-full border-[1.5px] flex items-center justify-center shadow-sm mx-auto mb-4"
            style={{
              borderColor: isDark ? '#d4a847' : '#c9a84c',
              backgroundColor: isDark ? '#223328' : '#f9f5ec'
            }}
          >
            {/* 4 golden dots */}
            <div className="absolute -top-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
            <div className="absolute -bottom-[3.5px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
            <div className="absolute -left-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />
            <div className="absolute -right-[3.5px] top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" style={{ backgroundColor: isDark ? '#d4a847' : '#c9a84c' }} />

            {/* Inner circle */}
            <div 
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center shadow animate-boltFlash"
              style={{ backgroundColor: isDark ? '#2e7d52' : '#1a5c38' }}
            >
              <Zap 
                size={32} 
                style={{ color: isDark ? '#d4a847' : '#c9a84c' }} 
              />
            </div>
          </div>
          
          <h2 className="text-xl font-bold tracking-tight font-outfit uppercase animate-fadeIn" style={{ color: isDark ? '#c9e8d4' : '#1a5c38' }}>
            {t('auth.register_title')}
          </h2>
          <p className="mt-1 text-xs animate-fadeIn" style={{ color: isDark ? '#9ab5a0' : '#666666' }}>
            {t('auth.register_subtitle')}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-lg border p-4 text-xs animate-fadeIn" style={{ backgroundColor: 'var(--badge-danger-bg)', color: 'var(--badge-danger-txt)', borderColor: 'var(--badge-danger-txt)' }}>
            <ShieldAlert className="h-5 w-5 shrink-0 text-danger" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex flex-col space-y-1 rounded-lg border p-4 text-xs animate-fadeIn" style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-txt)', borderColor: 'var(--badge-success-txt)' }}>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="font-semibold">{t('auth.register_success')}</span>
            </div>
            <p className="text-[11px] pl-7 opacity-80">{t('auth.redirecting')}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <Input
              id="full_name"
              type="text"
              label={t('auth.full_name')}
              placeholder={t('auth.full_name')}
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            {/* Employee ID */}
            <Input
              id="employee_id"
              type="text"
              label={t('auth.employee_id')}
              placeholder="e.g. JBVNL-1049"
              error={errors.employee_id?.message}
              {...register('employee_id')}
            />

            {/* Email Address */}
            <Input
              id="email"
              type="email"
              label={t('auth.email')}
              placeholder="name@jbvnl.co.in"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Mobile Number */}
            <Input
              id="mobile"
              type="text"
              label={t('auth.mobile')}
              placeholder="9876543210"
              error={errors.mobile?.message}
              {...register('mobile')}
            />

            {/* Department */}
            <Select
              id="department"
              label={t('common.department')}
              error={errors.department?.message}
              {...register('department')}
            >
              <option value="">{t('auth.select_dept')}</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {getTranslatedDept(dept)}
                </option>
              ))}
            </Select>

            {/* Username */}
            <Input
              id="username"
              type="text"
              label={t('auth.username')}
              placeholder={t('auth.username')}
              error={errors.username?.message}
              {...register('username')}
            />

            {/* Password */}
            <Input
              id="password"
              type="password"
              label={t('auth.password')}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Confirm Password */}
            <Input
              id="confirm_password"
              type="password"
              label={t('auth.confirm_password')}
              placeholder="••••••••"
              error={errors.confirm_password?.message}
              {...register('confirm_password')}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span style={{ color: isDark ? '#9ab5a0' : '#666666' }}>{t('auth.already_registered')}</span>
            <Link to="/login" className="font-semibold transition duration-150" style={{ color: isDark ? '#d4a847' : '#c9a84c' }} onMouseOver={(e) => e.currentTarget.style.color = isDark ? '#c9a84c' : '#a8863c'} onMouseOut={(e) => e.currentTarget.style.color = isDark ? '#d4a847' : '#c9a84c'}>
              {t('auth.sign_in_link')}
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
                  {t('auth.submitting_registration')}
                </>
              ) : (
                t('auth.submit_registration')
              )}
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t" style={{ borderTopColor: 'var(--border-subtle)' }}>
          <span className="text-[11px]" style={{ color: isDark ? '#5a7a62' : '#999999' }}>
            {t('auth.footer_text')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
