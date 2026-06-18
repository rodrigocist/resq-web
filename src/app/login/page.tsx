'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Mail, Lock, User, Store, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn, signUp, type UserRole } from '@/lib/auth';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Catch redirected errors from dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) setError(err);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { role: userRole } = await signIn(email, password);
        router.push(userRole === 'merchant' ? '/merchant/dashboard' : '/');
      } else {
        if (!displayName.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, 'user');
        router.push('/');
      }
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero gradient */}
      <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 px-6 pt-10 pb-16 flex flex-col items-center gap-3 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
          <Leaf className="h-7 w-7" />
        </div>
        <div className="relative text-center">
          <h1 className="font-heading font-extrabold text-3xl tracking-tight">ResQ</h1>
          <p className="text-green-100 text-sm mt-1 font-light">Rescue food. Save the planet.</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-4 -mt-8 relative z-10 pb-8">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">

          {/* Tab toggle */}
          <div className="flex border-b border-stone-100">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                  tab === t
                    ? 'text-green-700 border-b-2 border-green-600 bg-green-50/40'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Name (register only) */}
            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-500">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={tab === 'register' ? 'Min. 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-10 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>



            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3.5 text-sm transition-all shadow-sm hover:shadow-md active:scale-98"
            >
              {loading
                ? tab === 'login' ? 'Signing in…' : 'Creating account…'
                : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Switch tab hint */}
            <p className="text-center text-xs text-stone-400">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-green-600 font-semibold hover:underline"
              >
                {tab === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
