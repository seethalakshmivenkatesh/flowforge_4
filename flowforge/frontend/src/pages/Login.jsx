import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ mode: 'onChange', reValidateMode: 'onChange' });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // See Register.jsx for why this is needed: browser/password-manager autofill
  // bypasses the events React Hook Form relies on, so we resync manually.
  const handleAutoFill = (e) => {
    if (e.animationName === 'onAutoFillStart' && e.target?.name) {
      setValue(e.target.name, e.target.value, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot reach the server. Is the backend running on port 5000?');
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-xl font-bold">Sign in to FlowForge</h1>
          <p className="text-sm text-slate-500 mt-1">Workflow automation & project management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} onAnimationStart={handleAutoFill} className="card p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Create one
          </Link>
        </p>

        <div className="mt-6 text-xs text-slate-400 text-center leading-relaxed">
          Demo accounts (after seeding): admin@flowforge.dev / password123
        </div>
      </div>
    </div>
  );
}
