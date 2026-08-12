import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Lang, LanguageService, TranslatePipe } from '../i18n';

type Mood = 'kierroksilla' | 'low-battery' | 'hyva-flow' | 'leviamassa' | 'ihan-pihalla';
type Desire = 'unohtaa-arkea' | 'kapertya-kotiin' | 'ulos-kavereiden' | 'kokeilla-uutta';

interface Activity {
  /** Directus `service_provider` id this recommendation links to. */
  providerId: number;
  emoji: string;
  /** Provider name — a proper noun, shown as-is in both languages. */
  title: string;
  description: Record<Lang, string>;
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
    description: {
      fi: 'Hengitä syvään ja tule alas pilvistä — Tyynin lempeä jooga nollaa kaiken 🌙',
      en: 'Breathe deep and come down from the clouds — Tyyni’s gentle yoga resets everything 🌙',
    },
  },
  floats: {
    providerId: 6,
    emoji: '🛁',
    title: 'Floats',
    description: {
      fi: 'Kellu suolaisessa vedessä ja anna stressin sulaa pois — täydellinen reset 💧',
      en: 'Float in salt water and let the stress melt away — the perfect reset 💧',
    },
  },
  pakopeli: {
    providerId: 5,
    emoji: '🔐',
    title: 'Pakotalo',
    description: {
      fi: 'Lukitse itsesi huoneeseen bestien kanssa — teamwork makes the dream work 🧩',
      en: 'Lock yourself in a room with your besties — teamwork makes the dream work 🧩',
    },
  },
  bouldering: {
    providerId: 13,
    emoji: '🧗',
    title: 'Oulun Kiipeilykeskus',
    description: {
      fi: 'Kiipeä seinille ohjaajan opastuksella — abs of steel incoming 💎',
      en: 'Climb the walls with a guide — abs of steel incoming 💎',
    },
  },
  keilaus: {
    providerId: 14,
    emoji: '🎳',
    title: 'Oulun Keilahalli',
    description: {
      fi: 'Klassikko ei koskaan vanhene — strikes ja iskut kavereiden kanssa 🎯',
      en: 'A classic that never gets old — strikes and laughs with friends 🎯',
    },
  },
  uinti: {
    providerId: 20,
    emoji: '🏊',
    title: 'Raatin uimahalli',
    description: {
      fi: 'Hyppy veteen nollaa kaiken, literally — nuorten uintivuorot 💦',
      en: 'A dip in the pool resets everything, literally — youth swim sessions 💦',
    },
  },
  tanssi: {
    providerId: 22,
    emoji: '💃',
    title: 'Tanssia Linnanmaalla',
    description: {
      fi: 'Kokeile uutta tanssilajia — embarrassing = iconic 🕺',
      en: 'Try a new dance style — embarrassing = iconic 🕺',
    },
  },
  luonto: {
    providerId: 37,
    emoji: '🌳',
    title: 'Oulun luontopolut',
    description: {
      fi: 'Eväät mukaan ja luontoon — kävele ajatukset selkeiksi 🌿',
      en: 'Grab some snacks and head outdoors — walk your thoughts clear 🌿',
    },
  },
  lainaamo: {
    providerId: 41,
    emoji: '🥏',
    title: 'Liikuntavälinelainaamo',
    description: {
      fi: 'Lainaa frisbeegolf- ja pallopelivälineet ilmaiseksi ja mene menoksi 🥏',
      en: 'Borrow disc golf and ball-game gear for free and get going 🥏',
    },
  },
  kirjasto: {
    providerId: 49,
    emoji: '🎮',
    title: 'Kirjaston lainavälineet',
    description: {
      fi: 'Lainaa konsolipelejä, soittimia ja liikuntavälineitä kirjastosta — ilmaiseksi 🎮',
      en: 'Borrow console games, instruments and sports gear from the library — for free 🎮',
    },
  },
  yokoris: {
    providerId: 40,
    emoji: '🏀',
    title: 'NMKY Yökoris',
    description: {
      fi: 'Korista, musaa ja chillailua iltaisin hyvässä seurassa 🏀',
      en: 'Hoops, music and chilling in the evenings with good company 🏀',
    },
  },
  walkers: {
    providerId: 51,
    emoji: '🫶',
    title: 'Walkers-kohtaamispaikka',
    description: {
      fi: 'Tule sellaisena kuin olet — kahvia, pelejä ja aikaa jutella 🫶',
      en: 'Come as you are — coffee, games and time to talk 🫶',
    },
  },
  rockcamp: {
    providerId: 39,
    emoji: '🎸',
    title: 'Rock Camp',
    description: {
      fi: 'Kiinnostaako musiikki? Bändivalmennusta ja jameja maksutta 🎸',
      en: 'Into music? Free band coaching and jams 🎸',
    },
  },
  taidemuseo: {
    providerId: 38,
    emoji: '🎨',
    title: 'Oulun taidemuseo',
    description: {
      fi: 'Alle 18v ilmaiseksi sisään — imppaa taidetta ja rauhoitu 🎨',
      en: 'Free entry under 18 — soak up some art and unwind 🎨',
    },
  },
  karpat: {
    providerId: 31,
    emoji: '🏒',
    title: 'Oulun Kärpät',
    description: {
      fi: 'Kärppäpeli Energia Areenalla — pohjoinen on meissä 🏒',
      en: 'A Kärpät game at Energia Areena — the north is in us 🏒',
    },
  },
  chillaa: {
    providerId: 32,
    emoji: '😌',
    title: 'Chillaa-app',
    description: {
      fi: 'Lataa Chillaa-appi ja tee nopeita harjoituksia jännitykseen 😌',
      en: 'Download the Chillaa app and do quick exercises for anxiety 😌',
    },
  },
  sekasin: {
    providerId: 35,
    emoji: '💬',
    title: 'Sekasin-chat',
    description: {
      fi: 'Anonyymi chat mistä vaan — pienistä tai isoista jutuista 💬',
      en: 'Anonymous chat about anything — small stuff or big stuff 💬',
    },
  },
  talot: {
    providerId: 34,
    emoji: '🏠',
    title: 'Tyttöjen ja Poikien talot',
    description: {
      fi: 'Turvallinen tila hengailla, tavata muita ja saada tukea 🏠',
      en: 'A safe space to hang out, meet others and get support 🏠',
    },
  },
  rela: {
    providerId: 30,
    emoji: '💆',
    title: 'Rela-hierojat',
    description: {
      fi: 'Anna keholle huolto — hieronta rentouttaa ja palauttaa 💆',
      en: 'Give your body a service — a massage relaxes and restores 💆',
    },
  },
  harrastetilat: {
    providerId: 48,
    emoji: '🎤',
    title: 'Maksuttomat harrastetilat',
    description: {
      fi: 'Bänditiloja, studio ja pelitilat nuorille — varaa oma sessio 🎤',
      en: 'Band rooms, a studio and gaming spaces for youth — book your session 🎤',
    },
  },
  pikisaari: {
    providerId: 53,
    emoji: '🖼️',
    title: 'Pikisaaren taidegalleriakierros',
    description: {
      fi: 'Kierrä Pikisaaren galleriat ja imppaa paikallista taidetta — ilmaiseksi 🖼️',
      en: 'Tour the Pikisaari galleries and soak up local art — for free 🖼️',
    },
  },
  kaupungintalo: {
    providerId: 54,
    emoji: '🏛️',
    title: 'Kaupungintalon taidenäyttelyt',
    description: {
      fi: 'Poikkea kaupungintalolle — vaihtuvia näyttelyitä keskellä kaupunkia 🏛️',
      en: 'Pop into City Hall — rotating exhibitions right downtown 🏛️',
    },
  },
  taidekierros: {
    providerId: 55,
    emoji: '😎',
    title: 'Keskustan taidekierros',
    description: {
      fi: 'Bongaa keskustan taideteokset kävellen — city walk, but make it art 😎',
      en: 'Spot downtown artworks on foot — a city walk, but make it art 😎',
    },
  },
  oulunsalo: {
    providerId: 56,
    emoji: '🏸',
    title: 'Oulunsalon liikuntakeskus',
    description: {
      fi: 'Sulkapalloa ja kuntosalia Oulunsalossa — Action-vuorot maksutta 🏸',
      en: 'Badminton and gym sessions in Oulunsalo — free Action turns 🏸',
    },
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
    'kokeilla-uutta': ['pakopeli', 'tanssi', 'oulunsalo'],
  },
  'low-battery': {
    'unohtaa-arkea': ['luonto', 'floats', 'taidemuseo'],
    'kapertya-kotiin': ['chillaa', 'yoga', 'kirjasto'],
    'ulos-kavereiden': ['walkers', 'talot', 'luonto'],
    'kokeilla-uutta': ['kirjasto', 'pikisaari', 'taidemuseo'],
  },
  'hyva-flow': {
    'unohtaa-arkea': ['lainaamo', 'uinti', 'luonto'],
    'kapertya-kotiin': ['kirjasto', 'yoga', 'chillaa'],
    'ulos-kavereiden': ['yokoris', 'keilaus', 'karpat'],
    'kokeilla-uutta': ['pakopeli', 'bouldering', 'taidekierros'],
  },
  'leviamassa': {
    'unohtaa-arkea': ['yoga', 'luonto', 'floats'],
    'kapertya-kotiin': ['yoga', 'chillaa', 'kirjasto'],
    'ulos-kavereiden': ['luonto', 'walkers', 'keilaus'],
    'kokeilla-uutta': ['yoga', 'tanssi', 'rela'],
  },
  'ihan-pihalla': {
    'unohtaa-arkea': ['luonto', 'kaupungintalo', 'yoga'],
    'kapertya-kotiin': ['chillaa', 'kirjasto', 'sekasin'],
    'ulos-kavereiden': ['walkers', 'talot', 'taidekierros'],
    'kokeilla-uutta': ['pakopeli', 'bouldering', 'rockcamp'],
  },
};

@Component({
  selector: 'app-vibes-dialog',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './vibes-dialog.html',
  styleUrl: './vibes-dialog.scss',
})
export class VibesDialog {
  private router = inject(Router);
  protected i18n = inject(LanguageService);

  dismissed = output<void>();

  step = signal<'q1' | 'q2' | 'results'>('q1');
  selectedMood = signal<Mood | null>(null);
  selectedDesire = signal<Desire | null>(null);
  recommendations = signal<Activity[]>([]);

  moodOptions: { value: Mood; emoji: string }[] = [
    { value: 'kierroksilla', emoji: '⚡' },
    { value: 'low-battery', emoji: '🪫' },
    { value: 'hyva-flow', emoji: '✨' },
    { value: 'leviamassa', emoji: '🌀' },
    { value: 'ihan-pihalla', emoji: '😵' },
  ];

  desireOptions: { value: Desire; emoji: string }[] = [
    { value: 'unohtaa-arkea', emoji: '🏖️' },
    { value: 'kapertya-kotiin', emoji: '🛋️' },
    { value: 'ulos-kavereiden', emoji: '👯' },
    { value: 'kokeilla-uutta', emoji: '🚀' },
  ];

  /** Localized description for a recommendation. */
  desc(activity: Activity): string {
    return activity.description[this.i18n.lang()];
  }

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
    const mood = this.selectedMood();
    return mood ? this.i18n.t(`mood.${mood}`) : '';
  }

  getMoodEmoji(): string {
    return this.moodOptions.find(o => o.value === this.selectedMood())?.emoji ?? '';
  }
}
