import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ServiceProviderTabs } from "./service-provider-tabs/service-provider-tabs";
import { Header } from "./header/header";
import { VibesDialog } from './vibes-dialog/vibes-dialog';

type UserChoice = Promise<{
  outcome: 'accepted' | 'dismissed';
  platform: string;
}>;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: UserChoice;
  prompt(): Promise<UserChoice>;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, Header, VibesDialog],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);

  protected readonly title = signal('allvibes-passi-app');
  showVibesDialog = signal(true);

  isFrontPage = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects === '/' || e.urlAfterRedirects === ''),
      startWith(this.router.url === '/' || this.router.url === '')
    ),
    { initialValue: true }
  );

  deferredPrompt?: BeforeInstallPromptEvent;
  showInstallButton = signal(false);
  
  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: Event) {
    console.log('beforeinstallprompt');
    console.log(e);
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    this.showInstallButton.set(true);
  }

  // <https://web.dev/articles/customize-install>
  install() {
    // hide our user interface that shows our A2HS button
    this.showInstallButton.set(false);
    // Show the prompt
    this.deferredPrompt!.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt!.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
      });
  }
}
