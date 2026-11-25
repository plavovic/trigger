"use client";
import { useState, type FormEvent } from 'react';
import { useStore } from './StoreProvider';
import { useLanguage } from './LanguageProvider';
export function AccountForm() {
  const { user, authenticate, logout } = useStore();
  const { language } = useLanguage();
  const german = language === 'de';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    try { await authenticate(mode, data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in'); }
    finally { setBusy(false); }
  }
  return <section className="account-panel" aria-label={german ? "Dein Konto" : "Your account"}>
    {user ? <><p>{german ? `Angemeldet als ${user.firstName}.` : `Signed in as ${user.firstName}.`}</p><button className="add-to-cart" disabled={busy} onClick={async () => {
      setBusy(true); setError(''); try { await logout(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign out'); } finally { setBusy(false); }
    }}>{german ? "ABMELDEN" : "SIGN OUT"}</button></> : <>
      <p>{german ? "Melde dich an, um deinen Warenkorb zu speichern und eine Bestellung vorzubereiten. Deine Gastauswahl bleibt in diesem Browser." : "Sign in to save your cart and prepare an order. Your guest selection stays in this browser; your account has a separate saved cart."}</p>
      <form onSubmit={submit} className="account-form">
        {mode === 'register' && <><label>First name<input name="firstName" autoComplete="given-name" required maxLength={200} /></label><label>Last name<input name="lastName" autoComplete="family-name" required maxLength={200} /></label></>}
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={72} /></label>
        <button className="add-to-cart" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
      </form>
      <button type="button" className="account-switch" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? (german ? 'Konto erstellen' : 'Create an account') : (german ? 'Stattdessen anmelden' : 'Sign in instead')}</button>
    </>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
