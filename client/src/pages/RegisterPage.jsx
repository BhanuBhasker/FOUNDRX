import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { Field } from '../components/ui/Field.jsx';

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (form.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }
    setIsSubmitting(true);
    try {
      await register(form);
      toast.success('Account created — welcome to FOUNDRX!');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    try {
      await loginWithGoogle(credential);
      toast.success('Welcome to FOUNDRX!');
      navigate('/onboarding', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Build your profile and start finding co-founders.</p>

        <div className="mt-6">
          <GoogleSignInButton onCredential={handleGoogleCredential} onError={(err) => toast.error(err.message)} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>}
          <Field label="Full name" htmlFor="name">
            <input id="name" name="name" type="text" required className="input" value={form.name} onChange={handleChange} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={handleChange} />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters">
            <input id="password" name="password" type="password" required autoComplete="new-password" className="input" value={form.password} onChange={handleChange} />
          </Field>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already on FOUNDRX? <Link to="/login" className="font-medium text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
