import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ServiceProvidersList } from './service-providers-list';
import { ServiceProvider, ServiceProviderService } from '../service-provider.service';

function makeProvider(overrides: Partial<ServiceProvider>): ServiceProvider {
  return {
    id: 1,
    status: 'published',
    name: 'Testipaikka',
    category: 'exercise',
    free: true,
    description: '',
    instructions: '',
    address: 'Testikatu 1, Oulu',
    banner: null,
    ...overrides,
  };
}

/** A date a given number of days from today, so the specs don't rot. */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** The same date as Directus stores it. */
function iso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The same date as the app displays it. */
function label(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

const IN_30_DAYS = daysFromNow(30);
const OPEN = makeProvider({ id: 1, name: 'Aina auki' });
const UPCOMING = makeProvider({ id: 2, name: 'Budjaa', opens_on: iso(IN_30_DAYS) });
const OPENS_TODAY = makeProvider({ id: 3, name: 'Caesar', opens_on: iso(daysFromNow(0)) });

describe('ServiceProvidersList', () => {
  let fixture: ComponentFixture<ServiceProvidersList>;

  /** Builds the component over a faked Directus response. */
  async function render(providers: ServiceProvider[], compact = false) {
    // A stub rather than HttpTestingController: `getAll()` is called from a
    // field initializer, so the data has to be there at construction time.
    const service = {
      getAll: () => of(providers),
      bannerUrl: () => null,
      isLogoBanner: () => false,
    } as unknown as ServiceProviderService;

    await TestBed.configureTestingModule({
      imports: [ServiceProvidersList],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ServiceProviderService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceProvidersList);
    fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function cardMarkers(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.av-provider-card__opens'));
  }

  function compactMarkers(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.av-complist__opens'));
  }

  afterEach(() => TestBed.resetTestingModule());

  it('marks a card whose service has not opened yet with its opening day', async () => {
    await render([UPCOMING]);

    expect(cardMarkers().length).toBe(1);
    expect(cardMarkers()[0].textContent).toContain(label(IN_30_DAYS));
  });

  it('dims the artwork of a card whose service has not opened yet', async () => {
    await render([OPEN, UPCOMING]);
    const media: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.av-provider-card__media')
    );

    expect(media.length).toBe(2);
    expect(media.filter((el) => el.classList.contains('av-provider-card__media--upcoming')).length)
      .toBe(1);
  });

  it('leaves an always-open card unmarked', async () => {
    await render([OPEN]);

    expect(cardMarkers().length).toBe(0);
    expect(
      fixture.nativeElement.querySelector('.av-provider-card__media--upcoming')
    ).toBeNull();
  });

  it('leaves a card unmarked on its opening day', async () => {
    await render([OPENS_TODAY]);

    expect(cardMarkers().length).toBe(0);
  });

  it('keeps the category and access markers on an upcoming card', async () => {
    await render([UPCOMING]);

    expect(fixture.nativeElement.querySelector('.av-provider-card__chip')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.av-provider-card__badge')).not.toBeNull();
  });

  it('marks an upcoming service in the compact list too', async () => {
    await render([OPEN, UPCOMING], true);

    expect(compactMarkers().length).toBe(1);
    // The access label keeps its own slot on every row.
    expect(fixture.nativeElement.querySelectorAll('.av-complist__access').length).toBe(2);
  });

  it('leaves an always-open service unmarked in the compact list', async () => {
    await render([OPEN], true);

    expect(compactMarkers().length).toBe(0);
  });
});
