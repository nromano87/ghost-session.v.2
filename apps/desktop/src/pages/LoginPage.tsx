import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isPlugin } from '../lib/hostContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import SessionPreviewPanel from '../components/auth/SessionPreviewPanel';

const inputAuthClass =
  'min-h-[46px] text-[15px] leading-normal py-3 placeholder:text-ghost-text-muted/80';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') === 'create';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(tabFromUrl);
  const [displayName, setDisplayName] = useState('');
  const [dawToken, setDawToken] = useState('');
  const [showDawToken, setShowDawToken] = useState(false);
  const [forgotHint, setForgotHint] = useState(false);

  const { login, register, applySessionToken, clearError, loading, error } = useAuthStore();

  useEffect(() => {
    setIsRegister(tabFromUrl);
  }, [tabFromUrl]);

  const setTab = (register: boolean) => {
    clearError();
    setIsRegister(register);
    setForgotHint(false);
    if (register) setSearchParams({ tab: 'create' }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const goAfterAuth = () => {
    if (!isPlugin && useAuthStore.getState().isAuthenticated) {
      navigate('/projects', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await register(email, password, displayName);
    } else {
      await login(email, password);
    }
    goAfterAuth();
  };

  const handleDawTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await applySessionToken(dawToken);
    setDawToken('');
    goAfterAuth();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ghost-bg relative overflow-hidden">
      <SessionPreviewPanel />

      {/* Auth column */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 min-h-0">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_20%,rgba(0,255,200,0.06),transparent_50%)]"
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-[400px]">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-ghost-green/20 to-ghost-purple/15 border border-ghost-border/60 mb-5 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden className="shrink-0">
                <circle cx="13" cy="13" r="11.5" stroke="#00FFC8" strokeWidth="2" />
                <circle cx="13" cy="13" r="7" stroke="#00FFC8" strokeWidth="2" opacity="0.65" />
                <circle cx="13" cy="13" r="2.5" fill="#00FFC8" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-ghost-text-primary leading-tight">
              {isRegister ? (
                <>
                  Start <span className="text-ghost-text-secondary font-normal">something worth finishing</span>
                </>
              ) : (
                <>
                  Pick up{' '}
                  <span className="bg-gradient-to-r from-amber-100/95 to-orange-100/90 bg-clip-text text-transparent">
                    right where you left off
                  </span>
                </>
              )}
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ghost-text-secondary">
              {isRegister
                ? 'Create an account — same room, same session, everyone in sync.'
                : 'Your session is already moving. Sign in to jump back in.'}
            </p>
          </div>

          {/* Tabs */}
          <div
            className="flex rounded-xl bg-ghost-bg border border-ghost-border/80 p-1 mb-7"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => setTab(false)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                !isRegister
                  ? 'bg-ghost-surface-light text-ghost-text-primary shadow-sm'
                  : 'text-ghost-text-muted hover:text-ghost-text-secondary'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => setTab(true)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                isRegister
                  ? 'bg-ghost-surface-light text-ghost-text-primary shadow-sm'
                  : 'text-ghost-text-muted hover:text-ghost-text-secondary'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <Input
                label="Producer name"
                labelClassName="!text-[13px] text-ghost-text-primary/90"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your producer name"
                className={inputAuthClass}
                required
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              labelClassName="!text-[13px] text-ghost-text-primary/90"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputAuthClass}
              required
              autoComplete="email"
            />
            <Input
              id="auth-password"
              label="Password"
              labelClassName="!text-[13px] text-ghost-text-primary/90"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              className={inputAuthClass}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              labelRight={
                !isRegister ? (
                  <button
                    type="button"
                    onClick={() => setForgotHint((v) => !v)}
                    className="text-[12px] font-medium text-ghost-text-muted hover:text-ghost-green transition-colors"
                  >
                    Forgot password?
                  </button>
                ) : undefined
              }
            />

            {forgotHint && !isRegister && (
              <p className="text-[13px] leading-snug text-ghost-text-secondary -mt-2">
                Password reset by email isn&apos;t available yet. Contact your admin or use a DAW session token if
                your host provided one.
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-ghost-error-red/35 bg-ghost-error-red/10 px-3.5 py-3 text-[14px] leading-snug text-red-200"
              >
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full bg-ghost-green text-ghost-bg hover:bg-ghost-green/90 shadow-lg shadow-ghost-green/15" disabled={loading}>
              {loading
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          {/* DAW token */}
          <div className="mt-8 pt-6 border-t border-ghost-border/50">
            <button
              type="button"
              onClick={() => setShowDawToken((v) => !v)}
              className="text-[13px] font-medium text-ghost-text-secondary hover:text-ghost-text-primary w-full text-left flex items-center justify-between gap-2 group"
              aria-expanded={showDawToken}
            >
              <span>Continue with DAW token</span>
              <span className="text-ghost-text-muted group-hover:text-ghost-green transition-colors text-lg leading-none">
                {showDawToken ? '−' : '+'}
              </span>
            </button>
            <p className="text-[12px] text-ghost-text-muted mt-1.5 leading-relaxed">
              For JUCE plugin / WebView: paste the session token your host opened with (same as <code className="text-ghost-text-secondary/90">?token=</code> in the URL).
            </p>
            {showDawToken && (
              <form onSubmit={handleDawTokenSubmit} className="mt-4 space-y-3">
                <textarea
                  value={dawToken}
                  onChange={(e) => setDawToken(e.target.value)}
                  placeholder="Paste token…"
                  rows={3}
                  className="ghost-input w-full resize-y min-h-[88px] text-[13px] font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full border-ghost-green/30 hover:border-ghost-green/50"
                  disabled={loading}
                >
                  {loading ? 'Verifying…' : 'Continue with token'}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
