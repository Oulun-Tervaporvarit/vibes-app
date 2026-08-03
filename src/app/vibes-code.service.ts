import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const CMS_BASE_URL = 'https://cms.allvibes.fi';

/**
 * Public webhook flows in Directus. These are the ONLY way the app touches
 * `vibes_code` — the collection itself has no public read/write permission, so
 * codes can never be listed or tampered with from the client. The flows run
 * with Full Access server-side and expose just "check balance" and "redeem".
 *
 * They are called with GET + query params on purpose: a GET is a CORS "simple
 * request" so the browser skips the preflight (the CMS's OPTIONS preflight
 * responds with a fixed foreign origin and would otherwise block us). The
 * flows read the params from `$trigger.query`.
 */
const BALANCE_FLOW = '1299ab67-b0e8-4043-a67f-1e6fa59224be';
const REDEEM_FLOW = '27897513-9e24-4ea5-ae72-a0bf3f3de78e';

const STORAGE_KEY = 'code';

export interface CodeBalance {
  valid: boolean;
  /** Total visits/uses left, shared across all categories. */
  uses: number;
  /** Service provider ids this code has already redeemed. */
  usedProviders: number[];
}

export type RedeemResult =
  | { success: true; category: string; uses_left: number }
  | { success: false; reason: string };

@Injectable({ providedIn: 'root' })
export class VibesCodeService {
  private http = inject(HttpClient);

  /** The code the user has entered (persisted in localStorage). */
  readonly code = signal<string>(this.readStored());
  /** Latest known balance for `code`, or null if unknown/not fetched. */
  readonly balance = signal<CodeBalance | null>(null);
  readonly checking = signal<boolean>(false);

  readonly isValid = computed(() => this.balance()?.valid === true);

  constructor() {
    if (this.code()) {
      void this.refreshBalance();
    }
  }

  private readStored(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  /** Set (or clear, with '') the active code and re-check its balance. */
  setCode(value: string): void {
    const v = (value || '').trim();
    this.code.set(v);
    try {
      if (v) {
        localStorage.setItem(STORAGE_KEY, v);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* storage may be unavailable (private mode) — code still lives in memory */
    }
    if (v) {
      void this.refreshBalance();
    } else {
      this.balance.set(null);
    }
  }

  clearCode(): void {
    this.setCode('');
  }

  /** Remaining uses (shared across all categories) for the current code. */
  usesLeft(): number {
    const b = this.balance();
    return b && b.valid ? b.uses : 0;
  }

  /** Whether the current code has already redeemed a given service provider. */
  hasRedeemed(serviceProviderId: number): boolean {
    const b = this.balance();
    return !!b && b.valid && b.usedProviders.includes(serviceProviderId);
  }

  async refreshBalance(): Promise<void> {
    const code = this.code();
    if (!code) {
      this.balance.set(null);
      return;
    }
    this.checking.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<{ valid: boolean; uses: number; used_providers?: number[] }>(
          `${CMS_BASE_URL}/flows/trigger/${BALANCE_FLOW}`,
          { params: { code } }
        )
      );
      this.balance.set(
        res && res.valid
          ? { valid: true, uses: res.uses, usedProviders: res.used_providers ?? [] }
          : { valid: false, uses: 0, usedProviders: [] }
      );
    } catch {
      // Network / server error — leave validity unknown rather than claiming invalid.
      this.balance.set(null);
    } finally {
      this.checking.set(false);
    }
  }

  /**
   * Redeem one use for a service provider. The server derives the category from
   * the provider and decrements the matching counter. Refreshes the balance on
   * success so the header badges update.
   */
  async redeem(serviceProviderId: number): Promise<RedeemResult> {
    const code = this.code();
    if (!code) return { success: false, reason: 'no_code' };
    try {
      const res = await firstValueFrom(
        this.http.get<RedeemResult>(`${CMS_BASE_URL}/flows/trigger/${REDEEM_FLOW}`, {
          params: { code, service_provider: String(serviceProviderId) },
        })
      );
      if (res && res.success) {
        await this.refreshBalance();
        return res;
      }
      return res ?? { success: false, reason: 'error' };
    } catch {
      return { success: false, reason: 'network' };
    }
  }
}
