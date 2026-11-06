import { describe, it, expect, beforeEach } from 'vitest';
import { secureStorage } from '../src/utils/secureStorage';

describe('secureStorage AEAD encryption and tamper-proofing', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('encrypts values at rest in localStorage and sessionStorage', () => {
    secureStorage.setLocal('gh_active_user', 'octocat');
    secureStorage.setSession('gitcard-studio-metrics-key', 'super-secret-admin-key');

    const rawLocal = localStorage.getItem('gh_active_user');
    const rawSession = sessionStorage.getItem('gitcard-studio-metrics-key');

    expect(rawLocal).toBeTruthy();
    expect(rawLocal?.startsWith('gcs_enc_v1.')).toBe(true);
    expect(rawLocal).not.toContain('octocat');

    expect(rawSession).toBeTruthy();
    expect(rawSession?.startsWith('gcs_enc_v1.')).toBe(true);
    expect(rawSession).not.toContain('super-secret-admin-key');

    expect(secureStorage.getLocal('gh_active_user')).toBe('octocat');
    expect(secureStorage.getSession('gitcard-studio-metrics-key')).toBe('super-secret-admin-key');
  });

  it('rejects and purges plain-text manual modifications in localStorage and sessionStorage', () => {
    localStorage.setItem('gh_active_user', 'manual_tampered_user');
    sessionStorage.setItem('gitcard-studio-metrics-key', 'manual_tampered_key');

    expect(secureStorage.getLocal('gh_active_user')).toBeNull();
    expect(localStorage.getItem('gh_active_user')).toBeNull();

    expect(secureStorage.getSession('gitcard-studio-metrics-key')).toBeNull();
    expect(sessionStorage.getItem('gitcard-studio-metrics-key')).toBeNull();
  });

  it('rejects and purges modified ciphertext or copied envelopes across keys', () => {
    secureStorage.setLocal('theme', 'light');
    const themeEnvelope = localStorage.getItem('theme')!;

    // Copy valid ciphertext from 'theme' into 'gh_active_user' -> must fail AAD check and be purged
    localStorage.setItem('gh_active_user', themeEnvelope);
    expect(secureStorage.getLocal('gh_active_user')).toBeNull();
    expect(localStorage.getItem('gh_active_user')).toBeNull();

    // Flip last character of valid envelope -> must fail MAC check and be purged
    const tampered = themeEnvelope.slice(0, -1) + (themeEnvelope.endsWith('a') ? 'b' : 'a');
    localStorage.setItem('theme', tampered);
    expect(secureStorage.getLocal('theme')).toBeNull();
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('purges orphan usernames if gh_session_token is missing during verifyAndSweepAll', () => {
    secureStorage.setLocal('gh_active_user', 'octocat');
    secureStorage.setLocal('registered-github-username', 'octocat');

    const tampered = secureStorage.verifyAndSweepAll();
    expect(tampered).toBe(true);
    expect(secureStorage.getLocal('gh_active_user')).toBeNull();
    expect(secureStorage.getLocal('registered-github-username')).toBeNull();
  });
});
