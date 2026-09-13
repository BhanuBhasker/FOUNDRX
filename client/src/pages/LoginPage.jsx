import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { Field } from '../components/ui/Field.jsx';

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/discover/builders';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    try {
      await loginWithGoogle(credential);
      toast.success('Signed in with Google');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to keep discovering co-founders.</p>

        <div className="mt-6">
          <GoogleSignInButton onCredential={handleGoogleCredential} onError={(err) => toast.error(err.message)} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>}
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" required autoComplete="email" className="input" value={form.email} onChange={handleChange} />
          </Field>
          <Field label="Password" htmlFor="password">
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" value={form.password} onChange={handleChange} />
          </Field>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to FOUNDRX? <Link to="/register" className="font-medium text-brand-700">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
