import { ServiceProvider, isUpcoming, opensOnLabel, todayIsoDate } from './service-provider.service';

/** A provider carrying just the field these helpers read. */
function provider(opens_on?: string | null): Pick<ServiceProvider, 'opens_on'> {
  return { opens_on };
}

describe('todayIsoDate', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    // Built from local parts: a UTC-based implementation would report
    // 2025-12-31 for this date in any negative-offset timezone.
    expect(todayIsoDate(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(todayIsoDate(new Date(2026, 10, 1))).toBe('2026-11-01');
  });
});

describe('isUpcoming', () => {
  it('treats a missing opening day as always open', () => {
    expect(isUpcoming(provider(undefined), '2026-11-01')).toBe(false);
    expect(isUpcoming(provider(null), '2026-11-01')).toBe(false);
    expect(isUpcoming(provider(''), '2026-11-01')).toBe(false);
    expect(isUpcoming(provider('   '), '2026-11-01')).toBe(false);
  });

  it('treats a missing provider as open', () => {
    expect(isUpcoming(undefined, '2026-11-01')).toBe(false);
    expect(isUpcoming(null, '2026-11-01')).toBe(false);
  });

  it('is open on the opening day itself', () => {
    expect(isUpcoming(provider('2026-11-01'), '2026-11-01')).toBe(false);
  });

  it('is open once the opening day has passed', () => {
    expect(isUpcoming(provider('2026-11-01'), '2026-11-02')).toBe(false);
    expect(isUpcoming(provider('2020-01-01'), '2026-11-01')).toBe(false);
  });

  it('is upcoming while the opening day is still ahead', () => {
    expect(isUpcoming(provider('2026-11-02'), '2026-11-01')).toBe(true);
  });

  it('compares chronologically across month and year boundaries', () => {
    // This is what makes the lexicographic string comparison legitimate.
    expect(isUpcoming(provider('2027-01-01'), '2026-12-31')).toBe(true);
    expect(isUpcoming(provider('2026-12-31'), '2027-01-01')).toBe(false);
    expect(isUpcoming(provider('2026-11-01'), '2026-09-30')).toBe(true);
  });

  it('still works if the field is ever widened to a timestamp', () => {
    expect(isUpcoming(provider('2026-11-02T00:00:00'), '2026-11-01')).toBe(true);
    expect(isUpcoming(provider('2026-11-01T00:00:00'), '2026-11-01')).toBe(false);
  });

  it('fails open on an unparseable value', () => {
    // A typo in the CMS must never lock a benefit the editor did not mean to.
    expect(isUpcoming(provider('ensi kuussa'), '2026-11-01')).toBe(false);
    expect(isUpcoming(provider('01.11.2026'), '2026-11-01')).toBe(false);
    expect(isUpcoming(provider('2026-11'), '2026-11-01')).toBe(false);
  });

  it('defaults to the real today when none is given', () => {
    const farPast = provider('2000-01-01');
    const farFuture = provider('2999-01-01');
    expect(isUpcoming(farPast)).toBe(false);
    expect(isUpcoming(farFuture)).toBe(true);
  });
});

describe('opensOnLabel', () => {
  it('formats the opening day as d.M.yyyy without leading zeros', () => {
    expect(opensOnLabel(provider('2026-11-01'))).toBe('1.11.2026');
    expect(opensOnLabel(provider('2026-01-09'))).toBe('9.1.2026');
    expect(opensOnLabel(provider('2026-12-31'))).toBe('31.12.2026');
  });

  it('keeps the calendar day of a timestamp-shaped value', () => {
    expect(opensOnLabel(provider('2026-11-01T00:00:00'))).toBe('1.11.2026');
  });

  it('returns an empty string when there is no usable date', () => {
    expect(opensOnLabel(provider(null))).toBe('');
    expect(opensOnLabel(provider(''))).toBe('');
    expect(opensOnLabel(provider('ensi kuussa'))).toBe('');
    expect(opensOnLabel(undefined)).toBe('');
  });
});
