import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../api/endpoints';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ResetPassword() {
  const { token } = useParams();
  const { register, handleSubmit } = useForm({ mode: 'onChange', reValidateMode: 'onChange' });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.resetPassword(token, data);
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">Set a new password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <Input label="New password" type="password" placeholder="At least 6 characters" {...register('password', { required: true, minLength: 6 })} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
