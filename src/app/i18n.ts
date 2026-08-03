import { Injectable, Pipe, PipeTransform, computed, inject, signal } from '@angular/core';

export type Lang = 'fi' | 'en';

const STORAGE_KEY = 'lang';
const SUPPORTED: Lang[] = ['fi', 'en'];

type Entry = { fi: string; en: string };

/**
 * All translatable UI strings. Keys are dotted and grouped by area. Provider
 * content (names, descriptions) comes from Directus and is not translated here.
 */
export const TRANSLATIONS: Record<string, Entry> = {
  // Language toggle
  'lang.fi': { fi: 'FI', en: 'FI' },
  'lang.en': { fi: 'EN', en: 'EN' },
  'lang.switch': { fi: 'Vaihda kieli', en: 'Change language' },

  // Header
  'header.placeholder': { fi: 'Syötä VIBEs-koodi', en: 'Enter your VIBEs code' },
  'header.code_aria': { fi: 'VIBEs-koodi', en: 'VIBEs code' },
  'header.clear': { fi: 'Poista koodi', en: 'Remove code' },
  'header.visits': { fi: 'Käyntiä', en: 'Visits' },
  'header.invalid': { fi: 'Koodia ei löytynyt. Tarkista VIBEs-koodisi.', en: 'Code not found. Check your VIBEs code.' },

  // Front page hero
  'hero.eyebrow': { fi: 'Sun passi', en: 'Your pass' },
  'hero.title': { fi: 'Löydä omat vibesi', en: 'Find your vibes' },
  'hero.sub': {
    fi: 'Valitse kategoria ja näe paikat, joista pääset etujen pariin.',
    en: 'Pick a category and see where your perks are.',
  },
  'hero.help': { fi: 'Näin käytät passia', en: 'How to use the pass' },

  // Categories / tabs
  'cat.exercise': { fi: 'Liikunta', en: 'Sports' },
  'cat.culture': { fi: 'Kulttuuri', en: 'Culture' },
  'cat.wellness': { fi: 'Hyvinvointi', en: 'Wellbeing' },
  'tab.all': { fi: 'Kaikki palvelut', en: 'All services' },

  // Service list
  'list.empty': { fi: 'Ei vielä palveluntarjoajia tässä kategoriassa.', en: 'No services in this category yet.' },
  'list.more': { fi: 'Katso lisää', en: 'See more' },
  'access.unlimited': { fi: 'Rajaton käyttö', en: 'Unlimited use' },
  'access.code_short': { fi: 'VIBEs-koodi', en: 'VIBEs code' },
  'access.code_long': { fi: 'Vaatii lunastuksen VIBEs-koodilla', en: 'Requires a VIBEs code' },

  // Service detail
  'detail.back': { fi: 'Takaisin', en: 'Back' },
  'detail.description': { fi: 'Kuvaus', en: 'Description' },
  'detail.instructions': { fi: 'Näin pääset hyödyntämään', en: 'How to use it' },
  'detail.location': { fi: 'Sijainti', en: 'Location' },
  'detail.map': { fi: 'Kartta', en: 'Map' },
  'detail.visits_left': { fi: 'Käyntejä jäljellä', en: 'Visits left' },
  'detail.enter_code_hint': {
    fi: 'Syötä VIBEs-koodi yläpalkkiin lunastaaksesi edun.',
    en: 'Enter your VIBEs code in the top bar to redeem the perk.',
  },
  'detail.important': { fi: 'Tärkeää tietoa', en: 'Important' },
  'detail.important_rest': {
    fi: ' — paina alla olevaa nappia vasta paikan päällä.',
    en: ' — press the button below only when you are on-site.',
  },
  'detail.show_staff': { fi: 'Näytä henkilökunnalle', en: 'Show to staff' },
  'detail.redeeming': { fi: 'Lunastetaan…', en: 'Redeeming…' },

  // Redeem success card
  'redeem.eyebrow': { fi: 'Etu käytössä', en: 'Perk redeemed' },
  'redeem.confirmed': { fi: 'Vahvistettu', en: 'Confirmed' },
  'redeem.at': { fi: 'klo', en: 'at' },
  'redeem.done': { fi: 'Valmis', en: 'Done' },
  'gate.ok': { fi: 'Selvä', en: 'OK' },

  // Off-site confirm dialog
  'confirm.title': { fi: 'Vahvista lunastus', en: 'Confirm redemption' },
  'confirm.body': { fi: 'Haluatko lunastaa edun silti? Käynti kuluu.', en: 'Redeem the perk anyway? It uses one visit.' },
  'confirm.cancel': { fi: 'Peruuta', en: 'Cancel' },
  'confirm.anyway': { fi: 'Lunasta silti', en: 'Redeem anyway' },

  // No-code dialog
  'nocode.title': { fi: 'Syötä VIBEs-koodi', en: 'Enter a VIBEs code' },
  'nocode.body': {
    fi: 'Edun lunastaminen vaatii VIBEs-koodin. Syötä koodi sivun yläpalkkiin ja yritä uudelleen.',
    en: 'Redeeming requires a VIBEs code. Enter it in the top bar and try again.',
  },

  // Failure dialog
  'fail.title': { fi: 'Lunastus ei onnistunut', en: 'Redemption failed' },
  'err.title': { fi: 'Jotain meni pieleen', en: 'Something went wrong' },
  'err.body': { fi: 'Yritä hetken kuluttua uudelleen.', en: 'Please try again in a moment.' },

  // Redeem error reasons
  'reason.already_used': {
    fi: 'Olet jo lunastanut edun tähän palveluun tällä koodilla.',
    en: 'You have already redeemed this service with this code.',
  },
  'reason.no_uses_left': { fi: 'Tällä koodilla ei ole enää käyntejä jäljellä.', en: 'This code has no visits left.' },
  'reason.invalid_code': { fi: 'Koodia ei löytynyt. Tarkista VIBEs-koodisi.', en: 'Code not found. Check your VIBEs code.' },
  'reason.free_provider': { fi: 'Tämä palvelu on maksuton, lunastusta ei tarvita.', en: 'This service is free, no redemption needed.' },
  'reason.generic': { fi: 'Lunastus epäonnistui. Yritä hetken kuluttua uudelleen.', en: 'Redemption failed. Please try again in a moment.' },

  // Location warnings
  'loc.denied': {
    fi: 'Sijainti ei ole käytössä, joten emme voineet varmistaa että olet paikan päällä. Käytä etua vain paikan päällä.',
    en: 'Location is off, so we could not confirm you are on-site. Use the perk only on-site.',
  },
  'loc.unsupported': {
    fi: 'Selaimesi ei tue sijaintia, joten emme voineet varmistaa että olet paikan päällä. Käytä etua vain paikan päällä.',
    en: 'Your browser does not support location, so we could not confirm you are on-site. Use the perk only on-site.',
  },
  'loc.error': {
    fi: 'Sijainnin tarkistus epäonnistui, joten emme voineet varmistaa että olet paikan päällä. Käytä etua vain paikan päällä.',
    en: 'The location check failed, so we could not confirm you are on-site. Use the perk only on-site.',
  },
  'loc.geocode_fail': {
    fi: 'Paikan sijaintia ei voitu selvittää, joten etäisyyttä ei tarkistettu.',
    en: 'We could not determine the venue location, so distance was not checked.',
  },
  'loc.not_found': {
    fi: 'Paikan sijaintia ei löytynyt, joten etäisyyttä ei tarkistettu.',
    en: 'The venue location was not found, so distance was not checked.',
  },
  'loc.too_far': {
    fi: 'Vaikutat olevan noin {distance} m päässä paikasta. Käytä etua vain paikan päällä.',
    en: 'You seem to be about {distance} m from the venue. Use the perk only on-site.',
  },

  // Feedback (free services)
  'fb.question': { fi: 'Tykkäsitkö tästä palvelusta?', en: 'Did you like this service?' },
  'fb.thanks': { fi: 'Kiitos palautteestasi!', en: 'Thanks for your feedback!' },
  'fb.error': { fi: 'Palautteen tallennus epäonnistui. Yritä uudelleen.', en: 'Saving feedback failed. Please try again.' },
  'fb.like': { fi: 'Tykkäsin', en: 'Liked it' },
  'fb.dislike': { fi: 'En tykännyt', en: 'Did not like it' },

  // App install
  'install.button': { fi: 'Asenna sovellus', en: 'Install app' },

  // Vibes survey dialog
  'vd.step': { fi: '1 / 2', en: '1 / 2' },
  'vd.q1_title': { fi: 'Miltä vibes tuntuu just nyt? 🌊', en: 'How are your vibes right now? 🌊' },
  'vd.q1_sub': { fi: 'no rehellisesti vaa 👀', en: 'be honest 👀' },
  'vd.q2_step': { fi: '2 / 2', en: '2 / 2' },
  'vd.q2_title': { fi: 'Mikä tuntuis hyvältä just nyt? 💭', en: 'What sounds good right now? 💭' },
  'vd.q2_sub': { fi: 'gut feeling, älä mieti liikaa fr fr 🙏', en: 'gut feeling, don’t overthink it 🙏' },
  'vd.results_title': { fi: 'Sun vibes match 🎯', en: 'Your vibes match 🎯' },
  'vd.results_sub': { fi: 'nää on just sulle tehty, no cap 🔥', en: 'made just for you, no cap 🔥' },
  'vd.cta': { fi: 'Let’s gooo! 🚀', en: 'Let’s gooo! 🚀' },
  'vd.close': { fi: 'Sulje', en: 'Close' },

  // Moods
  'mood.kierroksilla': { fi: 'Kierroksilla', en: 'Hyped' },
  'mood.low-battery': { fi: 'Low Battery', en: 'Low Battery' },
  'mood.hyva-flow': { fi: 'Hyvä Flow', en: 'Good Flow' },
  'mood.leviamassa': { fi: 'Leviämässä', en: 'Falling apart' },
  'mood.ihan-pihalla': { fi: 'Ihan pihalla', en: 'Totally lost' },

  // Desires
  'desire.unohtaa-arkea': { fi: 'Unohtaa arjen kiireet', en: 'Escape the everyday' },
  'desire.kapertya-kotiin': { fi: 'Käpertyä kerälle kotiin', en: 'Curl up at home' },
  'desire.ulos-kavereiden': { fi: 'Ulos kavereiden kanssa', en: 'Out with friends' },
  'desire.kokeilla-uutta': { fi: 'Kokeilla jotain uutta', en: 'Try something new' },

  // How-to-use guide
  'guide.back': { fi: 'Takaisin', en: 'Back' },
  'guide.eyebrow': { fi: 'Sun passi', en: 'Your pass' },
  'guide.title': { fi: 'Näin käytät passia', en: 'How to use the pass' },
  'guide.sub': { fi: '5 helppoa askelta — oot pro alle minuutissa 😎', en: '5 easy steps — you’ll be a pro in under a minute 😎' },
  'guide.s1_title': { fi: 'Syötä oma VIBEs-koodi 🔑', en: 'Enter your VIBEs code 🔑' },
  'guide.s1_text': {
    fi: 'Kirjoita saamasi koodi sivun yläreunaan. Kun koodi kelpaa, näet heti montako käyntiä sulla on jäljellä. Koodi jää muistiin puhelimeen — ei tarvii syöttää joka kerta.',
    en: 'Type the code you got into the top of the page. Once it’s valid, you’ll see how many visits you have left. The code is saved on your phone — no need to type it every time.',
  },
  'guide.s2_title': { fi: 'Selaa palveluita 🔎', en: 'Browse services 🔎' },
  'guide.s2_text': {
    fi: 'Valitse yläreunasta kategoria — Liikunta, Kulttuuri tai Hyvinvointi — tai kattele kaikki kerralla “Kaikki palvelut” -listasta. Napauta paikkaa jota haluat kokeilla.',
    en: 'Pick a category up top — Sports, Culture or Wellbeing — or see everything at once in the “All services” list. Tap a place you want to try.',
  },
  'guide.s3_title': { fi: 'Katso palvelun tiedot 📄', en: 'Check the service details 📄' },
  'guide.s3_text': {
    fi: 'Palvelun sivulla näkyy kuvaus, ohjeet ja kartta. Paikkoja on kahta lajia:',
    en: 'The service page shows a description, instructions and a map. There are two kinds of places:',
  },
  'guide.s3_free': { fi: '= maksuton, käytä niin monta kertaa kuin haluat 🙌', en: '= free, use it as many times as you like 🙌' },
  'guide.s3_code': { fi: '= käytät yhden käynnin koodistasi 🎟', en: '= uses one visit from your code 🎟' },
  'guide.s4_title': { fi: 'Lunasta etu paikan päällä ✅', en: 'Redeem on-site ✅' },
  'guide.s4_text': {
    fi: 'Kun oot paikan päällä, paina “Näytä henkilökunnalle” ja näytä ruutu työntekijälle. Yksi käynti kuluu. Saman paikan voit lunastaa kerran per koodi — säästä siis käynnit uusiin paikkoihin!',
    en: 'When you’re on-site, press “Show to staff” and show the screen to a worker. One visit is used. Each place can be redeemed once per code — so save your visits for new places!',
  },
  'guide.s5_title': { fi: 'Anna palautetta 👍', en: 'Give feedback 👍' },
  'guide.s5_text': {
    fi: 'Maksuttomista palveluista voit kertoa tykkäsitkö vai et — peukku ylös tai alas. Se auttaa tekemään passista vielä paremman!',
    en: 'For free services you can tell us if you liked it — thumbs up or down. It helps make the pass even better!',
  },
  'guide.tip': {
    fi: 'jos jokin ei toimi, tarkista että koodi on oikein ja että olet paikan päällä lunastaessasi etua.',
    en: 'if something doesn’t work, check that the code is correct and that you’re on-site when redeeming.',
  },
  'guide.tip_label': { fi: 'Vinkki:', en: 'Tip:' },
  'guide.cta': { fi: 'Aloita — selaa palveluita 🚀', en: 'Get started — browse services 🚀' },
  'guide.shot_service': { fi: 'Esimerkkipaikka', en: 'Example place' },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>(this.readStored());
  readonly isEn = computed(() => this.lang() === 'en');

  constructor() {
    try {
      document.documentElement.lang = this.lang();
    } catch {
      /* ignore */
    }
  }

  private readStored(): Lang {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && SUPPORTED.includes(v as Lang)) return v as Lang;
    } catch {
      /* ignore */
    }
    // Fall back to the browser language when available, else Finnish.
    try {
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
        return 'en';
      }
    } catch {
      /* ignore */
    }
    return 'fi';
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      /* ignore */
    }
  }

  toggle(): void {
    this.setLang(this.lang() === 'fi' ? 'en' : 'fi');
  }

  /** Translate a key, interpolating {name} params. Falls back to the key. */
  t(key: string, params?: Record<string, string | number>): string {
    const entry = TRANSLATIONS[key];
    let text = entry ? entry[this.lang()] : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }
}

/**
 * Impure so it re-evaluates when the language changes (a language toggle is a
 * user event, which triggers change detection in this zoneless app).
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(LanguageService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
