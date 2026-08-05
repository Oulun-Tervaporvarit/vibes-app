import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalLinksDirective } from './external-links.directive';

@Component({
  imports: [ExternalLinksDirective],
  template: `<div appExternalLinks [innerHTML]="html"></div>`,
})
class HostComponent {
  html = '';
}

describe('ExternalLinksDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  function anchor(): HTMLAnchorElement {
    return fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
  }

  it('opens external links in a new page with a safe rel', async () => {
    host.html = '<a href="https://example.com/page">External</a>';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(anchor().target).toBe('_blank');
    expect(anchor().rel).toBe('noopener noreferrer');
  });

  it('leaves relative (in-app) links untouched', async () => {
    host.html = '<a href="/service/1">Internal</a>';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(anchor().target).toBe('');
    expect(anchor().rel).toBe('');
  });

  it('ignores non-http protocols like mailto', async () => {
    host.html = '<a href="mailto:hello@example.com">Mail</a>';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(anchor().target).toBe('');
  });
});
