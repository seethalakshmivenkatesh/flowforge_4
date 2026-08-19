import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../api/endpoints';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm({ mode: 'onChange', reValidateMode: 'onChange' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(data);
      setSent(true);
      if (res.data.data?.resetToken) setDevToken(res.data.data.resetToken);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">Reset your password</h1>
        {sent ? (
          <div className="card p-6 text-sm text-slate-600 space-y-3">
            <p>If that account exists, a reset link has been generated.</p>
            {devToken && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs break-all">
                <p className="font-medium text-slate-700 mb-1">Dev mode - no email service configured:</p>
                <Link to={`/reset-password/${devToken}`} className="text-brand-600 underline">
                  Click here to reset your password
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
            <Input label="Email" type="email" placeholder="you@company.com" {...register('email', { required: true })} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
        <p className="text-center text-sm text-slate-500 mt-5">
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
