import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Mood = 'kierroksilla' | 'low-battery' | 'hyva-flow' | 'leviamassa' | 'ihan-pihalla';
type Desire = 'unohtaa-arkea' | 'kapertya-kotiin' | 'ulos-kavereiden' | 'kokeilla-uutta';

interface Activity {
  /** Directus `service_provider` id this recommendation links to. */
  providerId: number;
  emoji: string;
  title: string;
  description: string;
}

/**
 * Catalog of survey recommendations. Every entry points at a real, published
 * `service_provider` item in Directus (https://cms.allvibes.fi) via `providerId`,
 * so tapping a result opens that provider's page (`/service/:id`).
 */
const PROVIDERS = {
  yoga: {
    providerId: 3,
    emoji: '🧘',
    title: 'Joogastudio Tyyni',
    description: 'Hengitä syvään ja tule alas pilvistä — Tyynin lempeä jooga nollaa kaiken 🌙',
  },
  floats: {
    providerId: 6,
    emoji: '🛁',
    title: 'Floats',
    description: 'Kellu suolaisessa vedessä ja anna stressin sulaa pois — täydellinen reset 💧',
  },
  pakopeli: {
    providerId: 5,
    emoji: '🔐',
    title: 'Pakotalo',
    description: 'Lukitse itsesi huoneeseen bestien kanssa — teamwork makes the dream work 🧩',
  },
  bouldering: {
    providerId: 13,
    emoji: '🧗',
    title: 'Oulun Kiipeilykeskus',
    description: 'Kiipeä seinille ohjaajan opastuksella — abs of steel incoming 💎',
  },
  keilaus: {
    providerId: 14,
    emoji: '🎳',
    title: 'Oulun Keilahalli',
    description: 'Klassikko ei koskaan vanhene — strikes ja iskut kavereiden kanssa 🎯',
  },
  uinti: {
    providerId: 20,
    emoji: '🏊',
    title: 'Raatin uimahalli',
    description: 'Hyppy veteen nollaa kaiken, literally — nuorten uintivuorot 💦',
  },
  tanssi: {
    providerId: 22,
    emoji: '💃',
    title: 'Tanssia Linnanmaalla',
    description: 'Kokeile uutta tanssilajia — embarrassing = iconic 🕺',
  },
  luonto: {
    providerId: 37,
    emoji: '🌳',
    title: 'Oulun luontopolut',
    description: 'Eväät mukaan ja luontoon — kävele ajatukset selkeiksi 🌿',
  },
  lainaamo: {
    providerId: 41,
    emoji: '🥏',
    title: 'Liikuntavälinelainaamo',
    description: 'Lainaa frisbeegolf- ja pallopelivälineet ilmaiseksi ja mene menoksi 🥏',
  },
  kirjasto: {
    providerId: 49,
    emoji: '🎮',
    title: 'Kirjaston lainavälineet',
    description: 'Lainaa konsolipelejä, soittimia ja liikuntavälineitä kirjastosta — ilmaiseksi 🎮',
  },
  yokoris: {
    providerId: 40,
    emoji: '🏀',
    title: 'NMKY Yökoris',
    description: 'Korista, musaa ja chillailua iltaisin hyvässä seurassa 🏀',
  },
  nurkka: {
    providerId: 36,
    emoji: '☕',
    title: 'Nurkka-kohtaamispaikka',
    description: 'Hengaa Valkeassa, juo kaakao ja pelaa lautapelejä — zero pressure ☕',
  },
  walkers: {
    providerId: 33,
    emoji: '🫶',
    title: 'Walkers-kohtaamispaikka',
    description: 'Tule sellaisena kuin olet — kahvia, pelejä ja aikaa jutella 🫶',
  },
  rockcamp: {
    providerId: 39,
    emoji: '🎸',
    title: 'Rock Camp',
    description: 'Kiinnostaako musiikki? Bändivalmennusta ja jameja maksutta 🎸',
  },
  taidemuseo: {
    providerId: 38,
    emoji: '🎨',
    title: 'Oulun taidemuseo',
    description: 'Alle 18v ilmaiseksi sisään — imppaa taidetta ja rauhoitu 🎨',
  },
  karpat: {
    providerId: 31,
    emoji: '🏒',
    title: 'Oulun Kärpät',
    description: 'Kärppäpeli Energia Areenalla — pohjoinen on meissä 🏒',
  },
  chillaa: {
    providerId: 32,
    emoji: '😌',
    title: 'Chillaa-app',
    description: 'Lataa Chillaa-appi ja tee nopeita harjoituksia jännitykseen 😌',
  },
  sekasin: {
    providerId: 35,
    emoji: '💬',
    title: 'Sekasin-chat',
    description: 'Anonyymi chat mistä vaan — pienistä tai isoista jutuista 💬',
  },
  talot: {
    providerId: 34,
    emoji: '🏠',
    title: 'Tyttöjen ja Poikien talot',
    description: 'Turvallinen tila hengailla, tavata muita ja saada tukea 🏠',
  },
  rela: {
    providerId: 30,
    emoji: '💆',
    title: 'Rela-hierojat',
    description: 'Anna keholle huolto — hieronta rentouttaa ja palauttaa 💆',
  },
  harrastetilat: {
    providerId: 48,
    emoji: '🎤',
    title: 'Maksuttomat harrastetilat',
    description: 'Bänditiloja, studio ja pelitilat nuorille — varaa oma sessio 🎤',
  },
} satisfies Record<string, Activity>;

type ProviderKey = keyof typeof PROVIDERS;

/**
 * Maps each mood + desire combination to three real service providers.
 * Every key resolves through PROVIDERS to a Directus item, so the survey's
 * results are wired to the actual palveluntarjoajat rather than dummy content.
 */
const RECOMMENDATIONS: Record<Mood, Record<Desire, ProviderKey[]>> = {
  'kierroksilla': {
    'unohtaa-arkea': ['lainaamo', 'uinti', 'luonto'],
    'kapertya-kotiin': ['kirjasto', 'yoga', 'chillaa'],
    'ulos-kavereiden': ['keilaus', 'yokoris', 'harrastetilat'],
    'kokeilla-uutta': ['pakopeli', 'tanssi', 'bouldering'],
  },
  'low-battery': {
    'unohtaa-arkea': ['luonto', 'floats', 'taidemuseo'],
    'kapertya-kotiin': ['chillaa', 'yoga', 'kirjasto'],
    'ulos-kavereiden': ['nurkka', 'walkers', 'luonto'],
    'kokeilla-uutta': ['kirjasto', 'yoga', 'taidemuseo'],
  },
  'hyva-flow': {
    'unohtaa-arkea': ['lainaamo', 'uinti', 'luonto'],
    'kapertya-kotiin': ['kirjasto', 'yoga', 'chillaa'],
    'ulos-kavereiden': ['yokoris', 'keilaus', 'karpat'],
    'kokeilla-uutta': ['pakopeli', 'bouldering', 'tanssi'],
  },
  'leviamassa': {
    'unohtaa-arkea': ['yoga', 'luonto', 'floats'],
    'kapertya-kotiin': ['yoga', 'chillaa', 'kirjasto'],
    'ulos-kavereiden': ['luonto', 'nurkka', 'keilaus'],
    'kokeilla-uutta': ['yoga', 'tanssi', 'rela'],
  },
  'ihan-pihalla': {
    'unohtaa-arkea': ['luonto', 'taidemuseo', 'yoga'],
    'kapertya-kotiin': ['chillaa', 'kirjasto', 'sekasin'],
    'ulos-kavereiden': ['nurkka', 'walkers', 'talot'],
    'kokeilla-uutta': ['pakopeli', 'bouldering', 'rockcamp'],
  },
};

@Component({
  selector: 'app-vibes-dialog',
  imports: [CommonModule],
  templateUrl: './vibes-dialog.html',
  styleUrl: './vibes-dialog.scss',
})
export class VibesDialog {
  private router = inject(Router);

  dismissed = output<void>();

  step = signal<'q1' | 'q2' | 'results'>('q1');
  selectedMood = signal<Mood | null>(null);
  selectedDesire = signal<Desire | null>(null);
  recommendations = signal<Activity[]>([]);

  moodOptions: { value: Mood; label: string; emoji: string }[] = [
    { value: 'kierroksilla', label: 'Kierroksilla', emoji: '⚡' },
    { value: 'low-battery', label: 'Low Battery', emoji: '🪫' },
    { value: 'hyva-flow', label: 'Hyvä Flow', emoji: '✨' },
    { value: 'leviamassa', label: 'Leviämässä', emoji: '🌀' },
    { value: 'ihan-pihalla', label: 'Ihan pihalla', emoji: '😵' },
  ];

  desireOptions: { value: Desire; label: string; emoji: string }[] = [
    { value: 'unohtaa-arkea', label: 'Unohtaa arjen kiireet', emoji: '🏖️' },
    { value: 'kapertya-kotiin', label: 'Käpertyä kerälle kotiin', emoji: '🛋️' },
    { value: 'ulos-kavereiden', label: 'Ulos kavereiden kanssa', emoji: '👯' },
    { value: 'kokeilla-uutta', label: 'Kokeilla jotain uutta', emoji: '🚀' },
  ];

  selectMood(mood: Mood) {
    this.selectedMood.set(mood);
    this.step.set('q2');
  }

  selectDesire(desire: Desire) {
    this.selectedDesire.set(desire);
    const mood = this.selectedMood()!;
    const keys = RECOMMENDATIONS[mood][desire];
    this.recommendations.set(keys.map((key) => PROVIDERS[key]));
    this.step.set('results');
  }

  /** Opens the recommended provider's page and closes the survey. */
  openProvider(activity: Activity) {
    this.dismiss();
    this.router.navigate(['/service', activity.providerId]);
  }

  dismiss() {
    this.dismissed.emit();
  }

  getMoodLabel(): string {
    return this.moodOptions.find(o => o.value === this.selectedMood())?.label ?? '';
  }

  getMoodEmoji(): string {
    return this.moodOptions.find(o => o.value === this.selectedMood())?.emoji ?? '';
  }
}
