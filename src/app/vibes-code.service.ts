import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const CMS_BASE_URL = 'https://cms.allvibes.fi';

/**
 * Public webhook flows in Directus. These are the ONLY way the app touches
 * `vibes_code` — the collection itself has no public read/write permission, so
 * codes can never be listed or tampered with from the client. The flows run
 * with Full Access server-side and expose just "check balance" and "redeem".
 */
const BALANCE_FLOW = '1299ab67-b0e8-4043-a67f-1e6fa59224be';
const REDEEM_FLOW = '27897513-9e24-4ea5-ae72-a0bf3f3de78e';

const STORAGE_KEY = 'code';

export type Category = 'exercise' | 'culture' | 'wellness';

export interface CodeBalance {
  valid: boolean;
  exercise: number;
  culture: number;
  wellness: number;
}

export type RedeemResult =
  | { success: true; category: Category; uses_left: number }
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

  /** Remaining uses for a given category with the current code. */
  usesLeft(category: string): number {
    const b = this.balance();
    if (!b || !b.valid) return 0;
    if (category === 'exercise') return b.exercise;
    if (category === 'culture') return b.culture;
    if (category === 'wellness') return b.wellness;
    return 0;
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
        this.http.post<CodeBalance>(`${CMS_BASE_URL}/flows/trigger/${BALANCE_FLOW}`, { code })
      );
      this.balance.set(
        res && res.valid
          ? { valid: true, exercise: res.exercise, culture: res.culture, wellness: res.wellness }
          : { valid: false, exercise: 0, culture: 0, wellness: 0 }
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
        this.http.post<RedeemResult>(`${CMS_BASE_URL}/flows/trigger/${REDEEM_FLOW}`, {
          code,
          service_provider: serviceProviderId,
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
