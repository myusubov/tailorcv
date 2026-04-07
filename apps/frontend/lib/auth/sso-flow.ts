'use client';

// Why: OAuth callback pages are public routes, so we keep a short-lived tab-scoped
// marker in sessionStorage to distinguish a real provider round-trip from direct navigation.
const SSO_FLOW_STORAGE_KEY = 'tailorcv:sso-flow';
const SSO_FLOW_TTL_MS = 10 * 60 * 1000;

type SSOFlowIntent = 'sign-in' | 'sign-up';

interface SSOFlowState {
  intent: SSOFlowIntent;
  startedAt: number;
}

function readSSOFlowState(): SSOFlowState | null {
  if (typeof window === 'undefined') return null;

  const rawValue = window.sessionStorage.getItem(SSO_FLOW_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<SSOFlowState>;

    // Why: The callback guard should fail closed if storage is malformed or tampered with,
    // otherwise stale/manual values could incorrectly reopen the SSO continuation flow.
    if (
      (parsedValue.intent !== 'sign-in' && parsedValue.intent !== 'sign-up') ||
      typeof parsedValue.startedAt !== 'number'
    ) {
      clearSSOFlowState();
      return null;
    }

    // Why: The marker only needs to survive the provider redirect. Expiring it prevents an old
    // successful OAuth start from authorizing a later direct visit to callback pages.
    if (Date.now() - parsedValue.startedAt > SSO_FLOW_TTL_MS) {
      clearSSOFlowState();
      return null;
    }

    return {
      intent: parsedValue.intent,
      startedAt: parsedValue.startedAt,
    };
  } catch {
    clearSSOFlowState();
    return null;
  }
}

export function beginSSOFlow(intent: SSOFlowIntent) {
  if (typeof window === 'undefined') return;

  const value: SSOFlowState = {
    intent,
    startedAt: Date.now(),
  };

  window.sessionStorage.setItem(SSO_FLOW_STORAGE_KEY, JSON.stringify(value));
}

export function hasActiveSSOFlow() {
  // Why: `readSSOFlowState()` already validates shape and TTL, so the callback code only needs
  // a boolean gate when it does not care whether the flow began as sign-in or sign-up.
  return !!readSSOFlowState();
}

export function clearSSOFlowState() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SSO_FLOW_STORAGE_KEY);
}
