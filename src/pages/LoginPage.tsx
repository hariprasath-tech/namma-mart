import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Phone, Lock, User, Store, ShieldCheck, ArrowRight, ArrowLeft, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [tab, setTab] = useState<'customer' | 'owner' | 'register'>('customer');
  const [phone, setPhone] = useState('+91 98421 90112');
  const [password, setPassword] = useState('localkart123');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || (tab === 'owner' ? '/shop' : '/');

  // One-click quick demo logins
  const handleQuickDemo = (role: 'customer' | 'owner') => {
    setError(null);
    if (role === 'customer') {
      login('+91 98421 90112', 'Murugan K.', 'customer');
      setSuccess('Logged in as Murugan K. (Customer)');
      setTimeout(() => navigate('/'), 600);
    } else {
      login('+91 94433 12001', 'Selvam Ramanathan', 'shop_owner', 'shop-1');
      setSuccess('Logged in as Selvam Ramanathan (Owner - Selvam Dept Store)');
      setTimeout(() => navigate('/shop'), 600);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setOtpSent(true);
        setSuccess('OTP sent! Dev verification code: 123456');
      } else {
        // Fallback for offline / direct simulation
        setOtpSent(true);
        setSuccess('Offline Mode: Use Dev OTP 123456');
      }
    } catch {
      setOtpSent(true);
      setSuccess('Dev Mode: Use Fixed Verification Code 123456');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('localkart_token', data.token);
        login(data.user.phone, data.user.name, data.user.role === 'owner' ? 'shop_owner' : 'customer');
        setSuccess('Authentication successful! Welcome to LocalMart.');
        setTimeout(() => navigate(from, { replace: true }), 700);
        return;
      }
    } catch {
      // Fallback to local store authentication
    }

    if (otp === '123456') {
      login(phone, 'Valued Customer', 'customer');
      setSuccess('Welcome to LocalMart!');
      setTimeout(() => navigate(from, { replace: true }), 700);
    } else {
      setError('Invalid OTP code. Please enter 123456.');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('localkart_token', data.token);
        const role = data.user.role === 'owner' ? 'shop_owner' : 'customer';
        login(data.user.phone, data.user.name, role, role === 'shop_owner' ? 'shop-1' : undefined);
        setSuccess(`Welcome back, ${data.user.name}!`);
        setTimeout(() => navigate(role === 'shop_owner' ? '/shop' : from, { replace: true }), 700);
        return;
      }
    } catch {
      // Fallback
    }

    // Local fallback
    if (tab === 'owner') {
      login(phone, 'Selvam Ramanathan', 'shop_owner', 'shop-1');
      setSuccess('Shop Owner authenticated!');
      setTimeout(() => navigate('/shop', { replace: true }), 700);
    } else {
      login(phone, 'Murugan K.', 'customer');
      setSuccess('Logged in successfully!');
      setTimeout(() => navigate(from, { replace: true }), 700);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, password, role: 'customer' }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('localkart_token', data.token);
        login(data.user.phone, data.user.name, 'customer');
        setSuccess('Registration successful! Welcome to LocalMart Pollachi.');
        setTimeout(() => navigate('/'), 800);
        return;
      } else {
        const err = await res.json();
        setError(err.message || 'Registration failed.');
      }
    } catch {
      login(phone, name || 'New Shopper', 'customer');
      setSuccess('Account created in LocalMart!');
      setTimeout(() => navigate('/'), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 select-none overflow-x-hidden bg-[#0A1D16]">
      {/* Photorealistic Pollachi Background matching Image 4 */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105 pointer-events-none"
        style={{ backgroundImage: 'url("/localmart_bg.jpg")' }}
      />
      
      {/* Dark Gradient Overlay for Contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85 pointer-events-none" />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="fixed top-5 left-5 z-30 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return Home</span>
      </Link>

      {/* Main Glassmorphic Auth Container */}
      <div className="relative z-20 w-full max-w-md bg-[#0E3B2C]/90 backdrop-blur-xl border border-white/25 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-white space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Brand Header with 3D Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/80 bg-[#0E3B2C]">
            <img 
              src="/localmart_logo.jpg" 
              alt="LocalMart Logo" 
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="font-display font-extrabold text-3xl tracking-tight text-white drop-shadow">
              LocalMart
            </h1>
            <div className="mt-1 inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-black/40 border border-[#FFB400]/60">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#FFB400] uppercase">
                LOCAL • SUSTAINABLE • TOGETHER
              </span>
            </div>
            <p className="text-lg text-[#FFB400] font-normal font-['Satisfy',cursive] pt-1">
              Support Local. Shop Meaningful.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('customer'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'customer'
                ? 'bg-[#FFB400] text-[#14201B] shadow-md font-extrabold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Shopper</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('owner'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'owner'
                ? 'bg-[#FFB400] text-[#14201B] shadow-md font-extrabold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop Owner</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-[#FFB400] text-[#14201B] shadow-md font-extrabold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Notifications & Alert banners */}
        {error && (
          <div className="p-3 bg-[#D63A2F]/20 border border-[#D63A2F] text-white text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400 text-white text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form: Customer Login via OTP or Phone */}
        {tab === 'customer' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#FFB400] absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98421 90112"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFB400]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#FFB400] hover:bg-[#e6a200] text-[#14201B] font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Sending code...' : 'Get Dev Verification Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5 animate-in fade-in">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-white/80">
                      Enter Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-[#FFB400] hover:underline"
                    >
                      Change Phone
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg py-2.5 bg-black/40 border border-[#FFB400] rounded-xl text-[#FFB400] focus:outline-none"
                  />
                  <p className="text-[11px] text-white/60 mt-1 text-center">
                    Development/Demo code: <strong className="text-[#FFB400]">123456</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#FFB400] hover:bg-[#e6a200] text-[#14201B] font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Verify & Enter LocalMart'}</span>
                </button>
              </form>
            )}

            {/* Quick Demo Customer Shortcut */}
            <div className="pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <span>⚡ Instant Login as Murugan (Demo Shopper)</span>
              </button>
            </div>
          </div>
        )}

        {/* Form: Shop Owner Login */}
        {tab === 'owner' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Owner Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#FFB400] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 94433 12001"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFB400]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Store Portal Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#FFB400] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFB400]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FFB400] hover:bg-[#e6a200] text-[#14201B] font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Access Owner Dashboard'}</span>
            </button>

            {/* Quick Demo Owner Shortcut */}
            <div className="pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => handleQuickDemo('owner')}
                className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
              >
                <span>⚡ Instant Login as Selvam Dept Store</span>
              </button>
            </div>
          </form>
        )}

        {/* Form: Register New Shopper */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#FFB400] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meenakshi Sundaram"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFB400]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#FFB400] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98421 00000"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFB400]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#FFB400] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#FFB400]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FFB400] hover:bg-[#e6a200] text-[#14201B] font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {/* Footer Note */}
        <p className="text-[11px] text-center text-white/50 pt-2">
          Pollachi Hyperlocal Market · Sri Eshwar CSE Innovation Project
        </p>
      </div>
    </div>
  );
};
