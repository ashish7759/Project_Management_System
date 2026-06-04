import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  employee_id: z.string().min(2, 'Employee ID must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number is too long'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  department: z.string().min(1, 'Please select your department'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormInput = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await registerUser(data);
      setSuccessMsg(res.message || 'Registration submitted successfully. Awaiting admin approval.');
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Failed to submit registration. Please verify details and try again.');
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white font-bold text-xl shadow-md">
            JBO
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            REGISTER NEW EMPLOYEE
          </h2>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Jharkhand Bijli Vitran Nigam Ltd
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex flex-col space-y-1 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-850">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
              <span className="font-semibold">Registration submitted. Awaiting admin approval.</span>
            </div>
            <p className="text-xs text-green-700 pl-7">Redirecting to sign-in page in a few seconds...</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold text-slate-500 uppercase">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                {...register('full_name')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.full_name ? 'border-red-300' : ''
                }`}
                placeholder="Enter Full Name"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-650">{errors.full_name.message}</p>
              )}
            </div>

            {/* Employee ID */}
            <div>
              <label htmlFor="employee_id" className="block text-xs font-semibold text-slate-500 uppercase">
                Employee ID
              </label>
              <input
                id="employee_id"
                type="text"
                {...register('employee_id')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.employee_id ? 'border-red-300' : ''
                }`}
                placeholder="e.g. JBVNL-1049"
              />
              {errors.employee_id && (
                <p className="mt-1 text-xs text-red-650">{errors.employee_id.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.email ? 'border-red-300' : ''
                }`}
                placeholder="name@jbvnl.co.in"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-655">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile" className="block text-xs font-semibold text-slate-500 uppercase">
                Mobile Number
              </label>
              <input
                id="mobile"
                type="text"
                {...register('mobile')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.mobile ? 'border-red-300' : ''
                }`}
                placeholder="9876543210"
              />
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-650">{errors.mobile.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-xs font-semibold text-slate-500 uppercase">
                Department
              </label>
              <select
                id="department"
                {...register('department')}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-xs text-red-650">{errors.department.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-500 uppercase">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register('username')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.username ? 'border-red-300' : ''
                }`}
                placeholder="Enter Username"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-650">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.password ? 'border-red-300' : ''
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-650">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-xs font-semibold text-slate-500 uppercase">
                Confirm Password
              </label>
              <input
                id="confirm_password"
                type="password"
                {...register('confirm_password')}
                className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm ${
                  errors.confirm_password ? 'border-red-300' : ''
                }`}
                placeholder="••••••••"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-red-650">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-slate-500">Already registered?</span>
            <Link to="/login" className="font-semibold text-primary-500 hover:text-primary-600">
              Sign In Here
            </Link>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
