import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import Input from '../components/Input';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('Profile');
  const profileForm = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { name: user?.name, avatar: user?.avatar },
  });
  const passwordForm = useForm({ mode: 'onChange', reValidateMode: 'onChange' });

  const handleAutoFill = (form) => (e) => {
    if (e.animationName === 'onAutoFillStart' && e.target?.name) {
      form.setValue(e.target.name, e.target.value, { shouldValidate: true, shouldDirty: true });
    }
  };

  const onSaveProfile = async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      updateUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const onChangePassword = async (data) => {
    try {
      await authApi.changePassword(data);
      toast.success('Password changed');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {['Profile', 'Security'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} onAnimationStart={handleAutoFill(profileForm)} className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} size={56} src={user?.avatar} />
            <div>
              <p className="font-medium">{user?.name}</p>
              <Badge color="bg-slate-100 text-slate-600">{user?.role}</Badge>
            </div>
          </div>
          <Input label="Full name" {...profileForm.register('name')} />
          <Input label="Avatar URL" placeholder="https://..." {...profileForm.register('avatar')} />
          <Input label="Email" value={user?.email} disabled />
          <Button type="submit">Save Changes</Button>
        </form>
      )}

      {tab === 'Security' && (
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="card p-5 space-y-4">
          <Input label="Current password" type="password" {...passwordForm.register('currentPassword', { required: true })} />
          <Input label="New password" type="password" {...passwordForm.register('newPassword', { required: true, minLength: 6 })} />
          <Button type="submit">Change Password</Button>
        </form>
      )}
    </div>
  );
}
