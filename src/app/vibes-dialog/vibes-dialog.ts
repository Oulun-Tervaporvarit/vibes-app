import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Mood = 'kierroksilla' | 'low-battery' | 'hyva-flow' | 'leviamassa' | 'ihan-pihalla';
type Desire = 'unohtaa-arkea' | 'kapertya-kotiin' | 'ulos-kavereiden' | 'kokeilla-uutta';

interface Activity {
  emoji: string;
  title: string;
  description: string;
}

const ACTIVITIES: Record<Mood, Record<Desire, Activity[]>> = {
  'kierroksilla': {
    'unohtaa-arkea': [
      { emoji: '🥏', title: 'Frisbeegolf', description: 'Heitä kiekkoa metsässä ja unohda kaikki stressi bestien kanssa 🌲' },
      { emoji: '🏊', title: 'Uinti', description: 'Hyppy veteen nollaa kaiken — literally 💦' },
      { emoji: '🏙️', title: 'Kaupunkiseikkailu', description: 'Eksytään kaupungille ilman suunnitelmaa, vibe > plan ✨' },
    ],
    'kapertya-kotiin': [
      { emoji: '💪', title: 'Kotijumppa', description: 'Pura energia kotona — workout playlist päälle ja go 🔥' },
      { emoji: '🎮', title: 'Peli-ilta', description: 'Luo oma turnaus ja kutsu kaverit — loser tilaa pizza 🍕' },
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Rauhoitu ja tule alas pilviä — kehosi tarvitsee sen 🌙' },
    ],
    'ulos-kavereiden': [
      { emoji: '🎳', title: 'Keilaus', description: 'Klassikko ei koskaan vanhene — strikes ja iskut 🏆' },
      { emoji: '🎤', title: 'Karaoke', description: 'Ääni auki, häpeä pois — se on karaoken pointti 🎶' },
      { emoji: '🧗', title: 'Bouldering', description: 'Kiipeä seinillä kavereiden kanssa — abs of steel incoming 💎' },
    ],
    'kokeilla-uutta': [
      { emoji: '🔐', title: 'Pakopeli', description: 'Lukitse itsesi huoneeseen ja selviydy — teamwork makes the dream work 🧩' },
      { emoji: '💃', title: 'Tanssitunti', description: 'Kokeile jotain uutta tanssilajia — embarrassing = iconic 🕺' },
      { emoji: '🧗', title: 'Bouldering', description: 'Ensimmäinen kerta seinällä on aina legendary 🏔️' },
    ],
  },
  'low-battery': {
    'unohtaa-arkea': [
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Ruokaa, nurmikko, aurinko — ei mitään muuta tarvita ☀️' },
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Istu alas, kääri peitoon ja anna Netflix hoitaa 🍿' },
      { emoji: '📚', title: 'Kirjasto-date', description: 'Hiljaa, rauhallista ja täysin judgement-free zone 🤫' },
    ],
    'kapertya-kotiin': [
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Netflix + peitto + snackit = täydellinen päivä 🛋️' },
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Gentle yoga lattialla — ei tarvii ees nousta sohvalta paljoa 🌿' },
      { emoji: '🎮', title: 'Peli-ilta', description: 'Casual gaming, low pressure, max fun 🎯' },
    ],
    'ulos-kavereiden': [
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Jokainen tuo jotain, kukaan ei stressaa — perfect vibe 🌸' },
      { emoji: '🚶', title: 'Kävelylenkki', description: 'Rauhallinen kävely bestien kanssa + hyvät juorut 👂' },
      { emoji: '📚', title: 'Kirjasto-date', description: 'Hengaillaan hiljaa kirjastossa — surprisingly slay 📖' },
    ],
    'kokeilla-uutta': [
      { emoji: '📚', title: 'Kirjasto-date', description: 'Hae jotain täysin uutta genreä — you might be surprised 🤯' },
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Kokeile ensimmäistä kertaa — se on easier than it looks 🌙' },
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Katso genre jota et yleensä katsele — expand the mind ✨' },
    ],
  },
  'hyva-flow': {
    'unohtaa-arkea': [
      { emoji: '🏙️', title: 'Kaupunkiseikkailu', description: 'Flow tila + kaupunki = parasta! Mee eksyksiin 🗺️' },
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Hyvä energia kannattaa jakaa ulkona luonnon kanssa 🌻' },
      { emoji: '🏊', title: 'Uinti', description: 'Kun flow on päällä, vedessäkin liikkuu paremmin 🌊' },
    ],
    'kapertya-kotiin': [
      { emoji: '🎮', title: 'Peli-ilta', description: 'Käytä flow tila pelaamiseen — today you WIN 🏆' },
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Nauti omasta seurasta, olet hyvässä seurassa 😌' },
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Kanava flow tila kehoon — mindful af 🧠' },
    ],
    'ulos-kavereiden': [
      { emoji: '🍖', title: 'Grilli-ilta', description: 'Kutsu kaikki, laita grilli laulamaan — summer vibes always 🌅' },
      { emoji: '🎳', title: 'Keilaus', description: 'Hyvällä fiiliksellä heitit varmaan striket 🎯' },
      { emoji: '🎤', title: 'Karaoke', description: 'Flow + karaoke = legendary performance incoming 🌟' },
    ],
    'kokeilla-uutta': [
      { emoji: '🔐', title: 'Pakopeli', description: 'Flow tila + puzzle room = kaikki ratkeaa 🧩' },
      { emoji: '🧗', title: 'Bouldering', description: 'Hyvä päivä aloittaa uusi harrastus 💪' },
      { emoji: '💃', title: 'Tanssitunti', description: 'Rytmitaju on tallessa — mee tanssimaan! 🕺' },
    ],
  },
  'leviamassa': {
    'unohtaa-arkea': [
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Hengitä, anna kaiken hajota hallitusti — sen jälkeen ok 🌿' },
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Luonto resetoi paremmin kuin mikään app 🌳' },
      { emoji: '🚶', title: 'Kävelylenkki', description: 'Laita kuulokkeet korvaan ja kävele ajatukset selkeiksi 🎵' },
    ],
    'kapertya-kotiin': [
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Kotona, rauhassa — anna kehon ja mielen rauhoittua 🕯️' },
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Peitto, tee, leffa — se on kaikki mitä tarvitset 🫖' },
      { emoji: '🎮', title: 'Peli-ilta', description: 'Joku casual peli vie ajatukset pois hetkeksi 🕹️' },
    ],
    'ulos-kavereiden': [
      { emoji: '🚶', title: 'Kävelylenkki', description: 'Kävele kavereiden kanssa — puhu tai älä, molemmat ok 💬' },
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Matala paine ulkoilu, just vibes 🌸' },
      { emoji: '🎳', title: 'Keilaus', description: 'Huumo auttaa — ja keilaaminen on hauska tapa purkaa 😂' },
    ],
    'kokeilla-uutta': [
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Uusi tapa rauhoittua — kokeile kerran ainakin 🌙' },
      { emoji: '💃', title: 'Tanssitunti', description: 'Tanssi purkaa stressiä paremmin kuin mikään scrollaus 🎶' },
      { emoji: '📚', title: 'Kirjasto-date', description: 'Hiljaa mutta uutta — kirjastosta voi löytää yllätyksiä 🤍' },
    ],
  },
  'ihan-pihalla': {
    'unohtaa-arkea': [
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Ei tarvii tietää mitään — anna elokuvan viedä 🍿' },
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Ulkoilma selkeyttää päätä, edes vähän ☀️' },
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Kun ei tiedä mitä tehdä, hengitä — ihan totta 🌬️' },
    ],
    'kapertya-kotiin': [
      { emoji: '🎬', title: 'Elokuva kotona', description: 'Istu alas. Rentoudu. Älä mieti. Just watch 📺' },
      { emoji: '🎮', title: 'Peli-ilta', description: 'Pelissä on selkeät säännöt — real life ei, mut peli kyllä 🕹️' },
      { emoji: '🧘', title: 'Yoga-sessio', description: 'Grounding session — be here now 🌿' },
    ],
    'ulos-kavereiden': [
      { emoji: '🎳', title: 'Keilaus', description: 'Kaverit päättää, sä tulet mukaan — easy mode 🎯' },
      { emoji: '🍖', title: 'Grilli-ilta', description: 'Hyvä ruoka + hyvät tyypit = kaikki menee paremmin 🫶' },
      { emoji: '🧺', title: 'Piknik puistossa', description: 'Low effort, high reward — juuri sun meininki nyt 💫' },
    ],
    'kokeilla-uutta': [
      { emoji: '🔐', title: 'Pakopeli', description: 'Peli ajattelee puolestasi — sinun tarvii vain reagoida 🧩' },
      { emoji: '🧗', title: 'Bouldering', description: 'Kehosi tietää mitä tehdä, vaikka pää ei — trust the climb 🏔️' },
      { emoji: '💃', title: 'Tanssitunti', description: 'Liike ennen ajatusta — let the music guide you 🎵' },
    ],
  },
};

@Component({
  selector: 'app-vibes-dialog',
  imports: [CommonModule],
  templateUrl: './vibes-dialog.html',
  styleUrl: './vibes-dialog.scss',
})
export class VibesDialog {
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
    this.recommendations.set(ACTIVITIES[mood][desire]);
    this.step.set('results');
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
