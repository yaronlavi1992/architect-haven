import { browser } from "$app/environment";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { ConvexHttpClient, type ConvexClient } from "convex/browser";
import type { Value } from "convex/values";
import { api } from "$convex/_generated/api";

const VERIFIER_STORAGE_KEY = "__convexAuthOAuthVerifier";
const JWT_STORAGE_KEY = "__convexAuthJWT";
const REFRESH_TOKEN_STORAGE_KEY = "__convexAuthRefreshToken";

type SignInParams =
  | FormData
  | (Record<string, Value> & {
      redirectTo?: string;
      code?: string;
    })
  | undefined;

type StoredTokens = {
  token: string;
  refreshToken?: string;
} | null;

function storageKey(key: string) {
  return `${key}_${PUBLIC_CONVEX_URL.replace(/[^a-zA-Z0-9]/g, "")}`;
}

function readStorage(key: string) {
  if (!browser) return null;
  return window.localStorage.getItem(storageKey(key));
}

function writeStorage(key: string, value: string) {
  if (!browser) return;
  window.localStorage.setItem(storageKey(key), value);
}

function removeStorage(key: string) {
  if (!browser) return;
  window.localStorage.removeItem(storageKey(key));
}

function toPlainObject(params: SignInParams) {
  if (params instanceof FormData) {
    return Object.fromEntries(params.entries()) as Record<string, Value>;
  }

  return params ?? {};
}

class AuthController {
  initialized = $state(false);
  isLoading = $state(true);
  isAuthenticated = $state(false);
  token = $state<string | null>(null);
  client = $state<ConvexClient | null>(null);
  refreshPromise: Promise<string | null> | null = null;

  initialize(client: ConvexClient) {
    if (!browser) return;
    if (this.client === client && this.initialized) return;

    this.client = client;
    client.setAuth(
      ({ forceRefreshToken }) => this.fetchAccessToken(forceRefreshToken),
      async (authenticated) => {
        this.isAuthenticated = authenticated;
        if (!authenticated) {
          this.token = null;
        }
      },
    );

    window.addEventListener("storage", this.handleStorage);
    void this.finishInitialization();
  }

  destroy() {
    if (!browser) return;
    window.removeEventListener("storage", this.handleStorage);
  }

  handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey(JWT_STORAGE_KEY)) return;

    this.token = event.newValue;
    this.isAuthenticated = !!event.newValue;
  };

  async finishInitialization() {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      await this.signIn(undefined, { code });
    } else {
      const token = readStorage(JWT_STORAGE_KEY);
      this.token = token;
      this.isAuthenticated = !!token;
    }

    this.isLoading = false;
    this.initialized = true;
  }

  async setTokens(tokens: StoredTokens, shouldStore = true) {
    if (tokens === null) {
      this.token = null;
      this.isAuthenticated = false;
      this.client?.client.clearAuth();
      if (shouldStore) {
        removeStorage(JWT_STORAGE_KEY);
        removeStorage(REFRESH_TOKEN_STORAGE_KEY);
      }
      return;
    }

    this.token = tokens.token;
    this.isAuthenticated = true;

    if (shouldStore) {
      writeStorage(JWT_STORAGE_KEY, tokens.token);
      if (tokens.refreshToken) {
        writeStorage(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
      }
    }
  }

  async refreshWithToken(refreshToken: string) {
    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
    const result = await client.action(api.auth.signIn, {
      refreshToken,
      calledBy: "architect-haven-sveltekit",
    });

    if ("tokens" in result) {
      await this.setTokens(result.tokens ?? null);
      return this.token;
    }

    return null;
  }

  async fetchAccessToken(forceRefreshToken: boolean) {
    if (!forceRefreshToken) {
      return this.token;
    }

    const refreshToken = readStorage(REFRESH_TOKEN_STORAGE_KEY);
    if (!refreshToken) {
      await this.setTokens(null);
      return null;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshWithToken(refreshToken).finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  async signIn(provider?: string, params?: SignInParams) {
    if (!this.client) {
      throw new Error("Convex client is not initialized");
    }

    const plainParams = toPlainObject(params);
    const verifier = readStorage(VERIFIER_STORAGE_KEY) ?? undefined;
    removeStorage(VERIFIER_STORAGE_KEY);

    const result = await this.client.action(api.auth.signIn, {
      provider,
      params: plainParams,
      verifier,
      calledBy: "architect-haven-sveltekit",
    });

    if ("redirect" in result && result.redirect) {
      if (result.verifier) {
        writeStorage(VERIFIER_STORAGE_KEY, result.verifier);
      }
      window.location.href = result.redirect.toString();
      return { signingIn: false, redirect: result.redirect };
    }

    if ("tokens" in result) {
      await this.setTokens(result.tokens ?? null);
      return { signingIn: result.tokens !== null };
    }

    return { signingIn: false };
  }

  async signOut() {
    try {
      if (this.client) {
        await this.client.action(api.auth.signOut, {});
      }
    } catch {
      // Best effort sign-out; clear local state even if the server session is gone.
    } finally {
      await this.setTokens(null);
    }
  }
}

export const auth = new AuthController();
