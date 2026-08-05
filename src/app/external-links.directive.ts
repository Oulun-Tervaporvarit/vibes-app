import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * Makes external links inside rich-text (`[innerHTML]`) content open in a new
 * page. Directus descriptions/instructions can embed arbitrary `<a>` tags; by
 * default those would navigate away from the app. This directive rewrites any
 * anchor pointing to a different origin to `target="_blank"` with a safe
 * `rel`, while leaving in-app/relative links untouched.
 *
 * Because the anchors are injected by Angular's `[innerHTML]` binding (and can
 * change when the value or language changes), a `MutationObserver` re-applies
 * the rewrite whenever the host's children change.
 */
@Directive({
  selector: '[appExternalLinks]',
})
export class ExternalLinksDirective implements AfterViewInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: MutationObserver;

  ngAfterViewInit(): void {
    this.apply();
    // React to later `[innerHTML]` updates (e.g. language switch).
    this.observer = new MutationObserver(() => this.apply());
    this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private apply(): void {
    const anchors = this.el.nativeElement.querySelectorAll<HTMLAnchorElement>('a[href]');
    anchors.forEach((anchor) => {
      if (!this.isExternal(anchor)) return;
      if (anchor.target === '_blank') return;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    });
  }

  /** An http(s) link that points to a different origin than the app. */
  private isExternal(anchor: HTMLAnchorElement): boolean {
    if (anchor.protocol !== 'http:' && anchor.protocol !== 'https:') return false;
    return anchor.hostname !== window.location.hostname;
  }
}
