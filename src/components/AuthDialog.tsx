import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  signInWithEmail, 
  registerWithEmail, 
  resetPassword, 
  signInWithGoogle, 
  signInAsGuest 
} from '@/lib/firebase';
import { 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Zap, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please provide an email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      try {
        await resetPassword(cleanEmail);
        setSuccessMessage(`Recovery link transmitted to ${cleanEmail}. Check your inbox or spam folder.`);
        toast.success('Password recovery email dispatched.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to send recovery link.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(cleanEmail, password);
        toast.success('Authenticated to Worp Neural Matrix');
        handleOpenChange(false);
        if (onSuccess) onSuccess();
      } else if (mode === 'signup') {
        await registerWithEmail(cleanEmail, password, displayName.trim());
        toast.success('Operative profile created & synced');
        handleOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication sequence failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Google authentication verified');
      handleOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
      toast.success('Guest Session initialized');
      handleOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Guest initialization failed.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800/80 text-zinc-100 sm:max-w-[440px] p-0 overflow-hidden shadow-2xl">
        {/* Top ambient accent glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-accent/20 via-theme-accent to-theme-accent/20" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <DialogHeader className="text-left space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center text-theme-accent">
                <Zap className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {mode === 'signin' && 'Sign in to Worp AI'}
                {mode === 'signup' && 'Create Operative Profile'}
                {mode === 'forgot' && 'Reset Neural Passkey'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              {mode === 'signin' && 'Enter your credentials to sync sessions, code, and custom telemetry.'}
              {mode === 'signup' && 'Register an account to persist conversations and custom workspace themes.'}
              {mode === 'forgot' && 'Transmit a secure recovery dispatch to your registered email.'}
            </DialogDescription>
          </DialogHeader>

          {/* Primary Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading || isGuestLoading}
            className="w-full h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/80" />
            </div>
            <span className="relative px-3 bg-zinc-950 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
              Or with Email & Password
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="flex p-1 rounded-lg bg-zinc-900/90 border border-zinc-800">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signin'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMessage(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Account
              </button>
            </div>
          )}

          {/* Alerts / Error feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-red-100 leading-relaxed">{errorMessage}</p>
                {errorMessage.toLowerCase().includes('domain') && (
                  <div className="pt-2 border-t border-red-900/50 space-y-2 text-[11px] text-zinc-300">
                    <p className="leading-normal">
                      <strong>Why this happens:</strong> Firebase restricts OAuth popups to whitelisted domains for security.
                    </p>
                    <div className="p-2 bg-black/40 rounded-lg border border-red-900/40 font-mono text-[10px] text-zinc-300 flex items-center justify-between gap-2">
                      <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(window.location.hostname);
                            toast.success('Domain copied to clipboard!');
                          }
                        }}
                        className="px-2 py-0.5 bg-red-900/60 hover:bg-red-800/80 text-white font-sans text-[10px] rounded transition-colors shrink-0"
                      >
                        Copy Domain
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleGuestSignIn}
                        className="flex-1 py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-md transition-colors text-center text-[11px]"
                      >
                        ⚡ Sign In as Guest Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Operative Name / Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Hunter"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                placeholder="operative@worp.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
                      className="text-[11px] text-theme-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 px-3 pr-9 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || isGuestLoading}
              className="w-full h-9 mt-2 flex items-center justify-center gap-2 bg-theme-accent text-white font-semibold text-xs rounded-lg hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-theme-accent/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Email</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Send Recovery Email</span>
                </>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="pt-1 border-t border-zinc-900 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Need temporary access?</span>
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={isLoading || isGoogleLoading || isGuestLoading}
                className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-all hover:border-zinc-700 disabled:opacity-50"
              >
                {isGuestLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>Continue as Guest</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="px-6 py-3 bg-zinc-900/40 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-zinc-600" />
            Worp Neural Cloud Encryption
          </span>
          <span className="font-mono">TLS 1.3 / AES-256</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
