import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ServiceProvider as ServiceProviderPage } from './service-provider';
import { ServiceProvider, ServiceProviderService } from '../service-provider.service';
import { VibesCodeService } from '../vibes-code.service';

function makeProvider(overrides: Partial<ServiceProvider>): ServiceProvider {
  return {
    id: 1,
    status: 'published',
    name: 'Testipaikka',
    category: 'exercise',
    free: false,
    description: '<p>Kuvaus</p>',
    instructions: '<p>Ohjeet</p>',
    // Left empty on purpose: a non-empty address makes the template build a
    // Google Maps iframe, and `instruction_video` a YouTube one — both would
    // hit the network from the Karma browser.
    address: '',
    instruction_video: null,
    banner: null,
    ...overrides,
  };
}

/** `YYYY-MM-DD` a given number of days from today, so the specs don't rot. */
function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

describe('ServiceProvider (detail page)', () => {
  let fixture: ComponentFixture<ServiceProviderPage>;
  let component: ServiceProviderPage;
  let redeem: jasmine.Spy;

  async function render(provider: ServiceProvider) {
    const service = {
      getById: () => of(provider),
      bannerUrl: (p: ServiceProvider) => (p.banner ? `https://cms.test/assets/${p.banner.id}` : null),
      isLogoBanner: () => false,
      galleryImages: () => [],
      submitFeedback: () => Promise.resolve(true),
    } as unknown as ServiceProviderService;

    redeem = jasmine.createSpy('redeem').and.resolveTo({ success: false, reason: 'error' });
    const vibes = {
      code: signal('TESTCODE'),
      isValid: () => true,
      usesLeft: () => 3,
      hasRedeemed: () => false,
      redeem,
    } as unknown as VibesCodeService;

    await TestBed.configureTestingModule({
      imports: [ServiceProviderPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ServiceProviderService, useValue: service },
        { provide: VibesCodeService, useValue: vibes },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '1' })) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceProviderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function locked(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.av-detail__alert--upcoming');
  }

  function redeemButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('.av-detail__cta-bar .av-btn');
  }

  afterEach(() => TestBed.resetTestingModule());

  it('replaces the redeem CTA with a locked notice before the opening day', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(30) }));

    expect(locked()).not.toBeNull();
    expect(locked()!.textContent).toContain(isoDaysFromNow(30).slice(0, 4));
    expect(redeemButton()).toBeNull();
    // The soft "press the button below only on site" advisory would contradict it.
    expect(fixture.nativeElement.querySelector('.av-detail__uses')).toBeNull();
  });

  it('leaves the chips row to category and access only', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(30) }));

    // The sash on the banner already says it; a chip here repeated it twice
    // within a screenful.
    expect(fixture.nativeElement.querySelectorAll('.av-detail__chips .av-chip').length).toBe(2);
  });

  it('lays a sash across the banner of an upcoming service', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(30), banner: { id: 'file-1' } }));
    const sash = fixture.nativeElement.querySelector('.av-detail__opens');

    expect(sash).not.toBeNull();
    expect(sash.textContent).toContain(isoDaysFromNow(30).slice(0, 4));
    // The artwork behind it is muted, as on the list cards.
    expect(
      fixture.nativeElement.querySelector('.av-detail__banner--upcoming')
    ).not.toBeNull();
  });

  it('leaves the banner of an open service alone', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(-1), banner: { id: 'file-1' } }));

    expect(fixture.nativeElement.querySelector('.av-detail__opens')).toBeNull();
    expect(fixture.nativeElement.querySelector('.av-detail__banner--upcoming')).toBeNull();
  });

  it('shows the redeem CTA once the service has opened', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(-1) }));

    expect(locked()).toBeNull();
    expect(redeemButton()).not.toBeNull();
    expect(redeemButton()!.disabled).toBe(false);
  });

  it('shows the redeem CTA on the opening day itself', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(0) }));

    expect(locked()).toBeNull();
    expect(redeemButton()).not.toBeNull();
  });

  it('behaves as before when no opening day is set', async () => {
    await render(makeProvider({}));

    expect(locked()).toBeNull();
    expect(redeemButton()).not.toBeNull();
  });

  it('replaces the feedback footer of a free upcoming service', async () => {
    await render(makeProvider({ free: true, opens_on: isoDaysFromNow(30) }));

    expect(locked()).not.toBeNull();
    // Rating a service nobody can have used yet would pollute the feedback data.
    expect(fixture.nativeElement.querySelector('.av-feedback__q')).toBeNull();
  });

  it('refuses to start the redeem flow for an upcoming service', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(30) }));

    await component.onShowToStaff();

    expect(redeem).not.toHaveBeenCalled();
    expect(component.gate().kind).toBe('idle');
  });

  it('refuses to redeem an upcoming service even past the confirm step', async () => {
    // The guard that matters: a tab left open across midnight, or a date set
    // while the page was already on screen, must not spend a visit.
    await render(makeProvider({ opens_on: isoDaysFromNow(30) }));

    component.gate.set({ kind: 'confirm' });
    await component.confirmRedeem();

    expect(redeem).not.toHaveBeenCalled();
    expect(component.gate().kind).toBe('idle');
  });

  it('still redeems an open service', async () => {
    await render(makeProvider({ opens_on: isoDaysFromNow(-1) }));

    component.gate.set({ kind: 'confirm' });
    await component.confirmRedeem();

    expect(redeem).toHaveBeenCalledWith(1);
  });
});
