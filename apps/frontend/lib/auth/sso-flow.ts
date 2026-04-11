'use client';

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

    if (
      (parsedValue.intent !== 'sign-in' && parsedValue.intent !== 'sign-up') ||
      typeof parsedValue.startedAt !== 'number'
    ) {
      clearSSOFlowState();
      return null;
    }

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

/**
 * Records a short-lived tab-scoped SSO marker before redirecting to an OAuth provider.
 * The callback and continuation routes use this marker to reject direct navigation and
 * stale browser state that did not originate from a real sign-in or sign-up redirect.
 */
export function beginSSOFlow(intent: SSOFlowIntent) {
  if (typeof window === 'undefined') return;

  const value: SSOFlowState = {
    intent,
    startedAt: Date.now(),
  };

  window.sessionStorage.setItem(SSO_FLOW_STORAGE_KEY, JSON.stringify(value));
}

/**
 * Returns whether the current tab has a valid in-progress SSO marker.
 * Validation includes shape checks and TTL enforcement so callback guards can use
 * a simple boolean gate without re-implementing storage parsing rules.
 */
export function hasActiveSSOFlow() {
  return !!readSSOFlowState();
}

/**
 * Clears the tab-scoped SSO marker after a callback completes, fails, or expires.
 */
export function clearSSOFlowState() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(SSO_FLOW_STORAGE_KEY);
}
