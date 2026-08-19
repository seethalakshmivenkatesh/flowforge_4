import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';

export default function Register() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ mode: 'onChange', reValidateMode: 'onChange' });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Browser/password-manager autofill sets input values directly in the DOM without
  // firing the input/change events React Hook Form listens for, so its internal state
  // (and validation) never learns the field was filled. The CSS in index.css triggers
  // a CSS animation on autofilled inputs; we catch that here and resync RHF with the
  // real DOM value.
  const handleAutoFill = (e) => {
    if (e.animationName === 'onAutoFillStart' && e.target?.name) {
      setValue(e.target.name, e.target.value, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot reach the server. Is the backend running on port 5000?');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="text-xl font-bold">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Start automating your workflows</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} onAnimationStart={handleAutoFill} className="card p-6 space-y-4">
          <Input label="Full name" placeholder="Jane Doe" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register('email', { required: 'Email is required' })} />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
          />
          <Select label="Role" defaultValue="Member" {...register('role')}>
            <option value="Member">Member</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Admin">Admin</option>
          </Select>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
