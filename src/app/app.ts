import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('allvibes-passi-app');

  deferredPrompt?: BeforeInstallPromptEvent;
  showInstallButton = false;
  
  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: Event) {
    console.log('beforeinstallprompt');
    console.log(e);
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    this.showInstallButton = true;
  }

  // <https://web.dev/articles/customize-install>
  install() {
    // hide our user interface that shows our A2HS button
    this.showInstallButton = false;
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
