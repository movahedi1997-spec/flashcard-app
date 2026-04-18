export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
  category: string;
  coverEmoji: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'was-macht-flashcardai-besonders',
    title: 'Was macht FlashcardAI besonders? Ein ehrlicher Vergleich mit Anki und Quizlet',
    excerpt: 'Anki ist mächtig aber komplex. Quizlet sammelt deine Daten und schaltet Werbung. FlashcardAI ist das Beste aus beiden Welten — kostenlos, datenschutzkonform, und direkt im Browser.',
    date: '2025-04-10',
    readTime: 5,
    category: 'Produkt',
    coverEmoji: '⚡',
    content: `
<h2>Anki, Quizlet — und dann noch eine App?</h2>
<p>Wer für Prüfungen lernt, kennt die Qual der Wahl: Anki ist das goldene Standard-Tool für Spaced Repetition, aber die Lernkurve ist steil, das Interface veraltet, und die Synchronisation kostet auf iOS 25 €. Quizlet ist moderner, hat aber in den letzten Jahren aggressiv monetarisiert — KI-Features hinter Paywall, Werbung im kostenlosen Plan, und ein Geschäftsmodell, das auf Nutzerdaten basiert.</p>
<p>FlashcardAI entstand aus genau dieser Frustration. Das Ziel: ein Tool, das wissenschaftlich fundiert ist wie Anki, aber so einfach zu bedienen wie Quizlet — und dabei datenschutzkonform, kostenlos und offline-fähig.</p>

<h2>Die Unterschiede im Überblick</h2>
<ul>
  <li><strong>Kostenlos ohne Tricks:</strong> Kein Freemium. Kein "Basis-Plan mit Wasserzeichen". Alle Funktionen sind kostenlos — heute, morgen, für immer.</li>
  <li><strong>Made in Germany, DSGVO konform:</strong> Deine Daten werden in Deutschland gespeichert. Kein Google Analytics, keine Werbenetzwerke, kein Verkauf von Nutzungsprofilen.</li>
  <li><strong>SM-2 Algorithmus:</strong> Derselbe bewährte Algorithmus wie Anki — aber ohne die Konfigurationshölle. Einfach Karte beantworten, der Rest passiert automatisch.</li>
  <li><strong>Community & Creator-Profile:</strong> Decks teilen, entdecken und kopieren — mit einem öffentlichen Profil unter /creators/username.</li>
  <li><strong>PWA ohne App Store:</strong> Direkt zum Home-Screen hinzufügen, offline nutzen — kein Download, keine Rechte-Anfragen.</li>
</ul>

<h2>Wann ist Anki weiterhin die bessere Wahl?</h2>
<p>Anki bleibt ungeschlagen, wenn du komplexe Card-Templates, LaTeX-Formeln oder eine 20 Jahre alte Kartenbibliothek im Gepäck hast. Für neue Lernende und alle, die einfach schnell anfangen wollen, ist FlashcardAI die bessere Wahl.</p>

<h2>Fazit</h2>
<p>FlashcardAI ist nicht der Versuch, Anki zu klonen. Es ist ein eigenständiges Tool, das den Einstieg in wissenschaftliches Lernen so niedrigschwellig wie möglich macht — ohne Kompromisse bei Datenschutz und ohne versteckte Kosten.</p>
    `,
  },
  {
    slug: 'spaced-repetition-wissenschaft',
    title: 'Die Wissenschaft hinter Spaced Repetition: Warum du mit weniger Lernen mehr behältst',
    excerpt: 'Der Vergessenskurve-Effekt wurde 1885 entdeckt. Heute steckt die Forschung dahinter in deiner Karteikarten-App. Wie funktioniert das eigentlich?',
    date: '2025-04-05',
    readTime: 7,
    category: 'Wissenschaft',
    coverEmoji: '🧠',
    content: `
<h2>Hermann Ebbinghaus und die Vergessenskurve</h2>
<p>1885 führte der deutsche Psychologe Hermann Ebbinghaus Experimente an sich selbst durch und entdeckte dabei die sogenannte Vergessenskurve: Ohne Wiederholung vergessen wir Neues innerhalb von Stunden. Nach einem Tag ist mehr als die Hälfte weg. Nach einer Woche kaum noch etwas übrig.</p>
<p>Die gute Nachricht: Jede Wiederholung "verschiebt" die Kurve. Erinnerungen, die gerade zu verblassen drohen, werden durch gezielte Wiederholung deutlich fester verankert.</p>

<h2>Der SM-2 Algorithmus: Spaced Repetition in der Praxis</h2>
<p>Der SM-2 Algorithmus — entwickelt 1987 von Piotr Wozniak für das Programm SuperMemo — setzt diese Forschung in eine konkrete Lernregel um. Für jede Karte wird ein "Intervall" berechnet: Wie viele Tage, bis du die Karte wieder sehen solltest?</p>
<p>Die Formel berücksichtigt:</p>
<ul>
  <li>Wie gut du die Antwort wusstest (Again / Hard / Good / Easy)</li>
  <li>Wie oft du die Karte schon gesehen hast</li>
  <li>Einen persönlichen "Ease Factor", der sich mit jeder Antwort anpasst</li>
</ul>
<p>Karten, die du immer mit "Easy" bewertest, siehst du vielleicht nur noch einmal im Monat. Karten, bei denen du immer auf "Again" klickst, kommen täglich zurück.</p>

<h2>Warum das so effektiv ist</h2>
<p>Spaced Repetition zwingt dich dazu, Informationen im richtigen Moment abzurufen — kurz bevor du sie vergisst. Dieser "Abruf-Effekt" ist nachweislich einer der stärksten Faktoren für langfristiges Behalten. Du trainierst nicht das Auswendiglernen, sondern das Erinnern.</p>
<p>Studien zeigen, dass Lernende mit Spaced Repetition bis zu 50% weniger Lernzeit benötigen, um dasselbe Niveau zu erreichen wie mit traditionellen Methoden.</p>

<h2>In FlashcardAI integriert</h2>
<p>FlashcardAI berechnet nach jeder Antwort das neue Intervall im Hintergrund und plant deine nächste Review automatisch. Du musst nichts konfigurieren — einfach Karte beantworten, und der Algorithmus erledigt den Rest.</p>
    `,
  },
  {
    slug: 'made-in-germany-dsgvo',
    title: 'Made in Germany: Datenschutz ist kein Feature — es ist ein Grundprinzip',
    excerpt: 'FlashcardAI wird in Deutschland entwickelt und betrieben. Was das für deine Daten bedeutet, warum wir keine Werbung schalten und wie wir DSGVO-Konformität konkret umsetzen.',
    date: '2025-03-28',
    readTime: 4,
    category: 'Datenschutz',
    coverEmoji: '🔒',
    content: `
<h2>Warum Datenschutz bei einer Lern-App wichtig ist</h2>
<p>Du lernst mit Karteikarten, wann du lernst, wie lange du lernst, womit du Schwierigkeiten hast. Das sind sensible Daten, die dein Lernverhalten, deine Schwächen und deinen Alltag offenbaren. Viele Apps nutzen diese Daten, um Werbeprofile zu erstellen oder sie an Dritte zu verkaufen.</p>
<p>FlashcardAI tut das nicht. Punkt.</p>

<h2>Konkrete Maßnahmen</h2>
<ul>
  <li><strong>Server in Deutschland:</strong> Alle Daten werden auf Servern gespeichert, die unter deutschem und europäischem Recht stehen.</li>
  <li><strong>Keine Drittanbieter-Tracker:</strong> Kein Google Analytics, kein Facebook Pixel, keine Werbenetzwerke. Keine externen Scripts außer den notwendigen App-Funktionen.</li>
  <li><strong>Kein Datenverkauf:</strong> Wir verkaufen keine Nutzerprofile und teilen keine persönlichen Daten mit Dritten.</li>
  <li><strong>Minimale Datenhaltung:</strong> Wir speichern nur, was zur Funktion der App notwendig ist: E-Mail, Name, Karten, Lernfortschritt.</li>
  <li><strong>DSGVO-konform:</strong> Recht auf Auskunft, Berichtigung und Löschung — alles über die Einstellungsseite direkt erreichbar.</li>
</ul>

<h2>Wie finanziert sich FlashcardAI?</h2>
<p>Ehrliche Antwort: Derzeit über den Gründer. FlashcardAI ist ein Projekt, das aus echter Überzeugung entstand — nicht als Vehikel für Werbevermarktung. Langfristig sind optionale Premium-Features für Power-User geplant, aber niemals auf Kosten von Kernfunktionen oder Datenschutz.</p>

<h2>Transparenz als Prinzip</h2>
<p>Wir sind ein kleines, transparentes Team. Wenn du Fragen zu Datenschutz hast, erreichst du echte Menschen — keine Support-Bots. Das ist "Made in Germany" in der Praxis.</p>
    `,
  },
  {
    slug: 'usmle-lernen-mit-karteikarten',
    title: 'USMLE & NAPLEX: So baust du ein Karteikarten-System, das wirklich funktioniert',
    excerpt: 'Die richtigen Karteikarten zu erstellen ist eine Fähigkeit für sich. Diese Strategien helfen dir, ein System aufzubauen, das dich durch Step 1, Step 2 CK und NAPLEX trägt.',
    date: '2025-03-20',
    readTime: 6,
    category: 'Lerntipps',
    coverEmoji: '🩺',
    content: `
<h2>Das Problem mit schlechten Karteikarten</h2>
<p>Die meisten Lernenden erstellen ihre ersten Karteikarten falsch: Zu viel Information auf einer Karte, zu wenig Kontext, zu abstrakt. Das Ergebnis sind Karten, die man immer wieder liest, aber nie wirklich kann.</p>

<h2>Das Prinzip der atomaren Karte</h2>
<p>Eine gute Karteikarte hat genau einen Fakt. Nicht zwei, nicht drei — einen. Statt "Beschreibe die Symptome, Diagnose und Behandlung von ACS" lieber:</p>
<ul>
  <li>Karte 1: "Welches ist das wichtigste EKG-Zeichen bei STEMI?" → "ST-Elevation in ≥2 zusammenhängenden Ableitungen"</li>
  <li>Karte 2: "Was ist die Erstlinientherapie bei STEMI?" → "PCI innerhalb 90 Minuten (Door-to-balloon)"</li>
</ul>
<p>Atomare Karten sind schneller zu beantworten, leichter zu bewerten und werden vom SM-2 Algorithmus effektiver verplant.</p>

<h2>Frage-Antwort vs. Definition</h2>
<p>Formuliere Karten als echte Fragen — nicht als Definitionen. "Was ist Metoprolol?" ist schlechter als "Welchen Mechanismus hat Metoprolol?" oder "Wann ist Metoprolol kontraindiziert?"</p>

<h2>Struktur für USMLE Step 1</h2>
<p>Empfohlene Deck-Struktur:</p>
<ul>
  <li>Ein Deck pro Fachgebiet (Pharmakologie, Kardiologie, Neurologie, …)</li>
  <li>Tags für Prüfungsrelevanz (Step1, Step2CK, High-Yield)</li>
  <li>Community-Decks aus FlashcardAI als Basis, eigene Karten ergänzen</li>
</ul>

<h2>Lernplan für die letzten 6 Wochen</h2>
<p>Wochen 1–4: Täglich Daily Review + 20 neue Karten pro Fach. Wochen 5–6: Nur noch Daily Review, keine neuen Karten. In der letzten Woche: Turbo Mode für schnelle Gesamtdurchläufe.</p>

<h2>Community-Decks nutzen</h2>
<p>In der FlashcardAI Explore-Seite findest du fertige Decks für USMLE, NAPLEX und Organische Chemie. Kopiere ein Deck, bearbeite es nach deinen Bedürfnissen — und fange sofort an zu lernen.</p>
    `,
  },
  {
    slug: 'pwa-offline-installieren',
    title: 'FlashcardAI als App installieren: Offline lernen ohne App Store',
    excerpt: 'FlashcardAI ist eine Progressive Web App. Das bedeutet: installieren ohne App Store, offline nutzen, und eine native App-Erfahrung — auf iOS, Android und Desktop.',
    date: '2025-03-15',
    readTime: 3,
    category: 'Anleitung',
    coverEmoji: '📱',
    content: `
<h2>Was ist eine Progressive Web App (PWA)?</h2>
<p>Eine PWA ist eine Webseite, die sich wie eine native App verhält. Sie kann auf dem Home-Screen installiert werden, offline funktionieren, Push-Benachrichtigungen senden und im Vollbild laufen — ohne App Store, ohne Download, ohne Speicherplatz-Genehmigungen.</p>

<h2>Installation auf iPhone (iOS)</h2>
<ol>
  <li>Öffne flashcardai.app in Safari (nicht Chrome — iOS PWAs funktionieren nur in Safari)</li>
  <li>Tippe auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil nach oben)</li>
  <li>Wähle <strong>"Zum Home-Bildschirm"</strong></li>
  <li>Bestätige mit <strong>"Hinzufügen"</strong></li>
</ol>
<p>Die App erscheint jetzt auf deinem Home-Screen mit dem FlashcardAI-Icon. Sie öffnet sich im Vollbild ohne Browser-Adressleiste.</p>

<h2>Installation auf Android</h2>
<ol>
  <li>Öffne flashcardai.app in Chrome</li>
  <li>Tippe auf die drei Punkte oben rechts</li>
  <li>Wähle <strong>"App installieren"</strong> oder <strong>"Zum Startbildschirm hinzufügen"</strong></li>
  <li>Bestätige</li>
</ol>

<h2>Installation auf dem Desktop (Mac / Windows)</h2>
<ol>
  <li>Öffne flashcardai.app in Chrome oder Edge</li>
  <li>Klicke auf das <strong>Installations-Symbol</strong> in der Adressleiste (kleines Computer-Icon)</li>
  <li>Klicke auf "Installieren"</li>
</ol>

<h2>Offline nutzen</h2>
<p>Nach der Installation speichert FlashcardAI alle nötigen Daten für deine letzten Lerneinheiten im Cache. Dashboard, My Decks und Lernmodus funktionieren auch ohne Internetverbindung. Änderungen werden synchronisiert, sobald du wieder online bist.</p>

<h2>Vorteile gegenüber Browser-Nutzung</h2>
<ul>
  <li>Kein Browser-Tab-Wechsel — die App hat eigenes Fenster</li>
  <li>Schnellerer Start (gecachte Assets)</li>
  <li>Offline-Modus für Commutes und schlechte Verbindungen</li>
  <li>Vollbild ohne Adressleiste — mehr Platz für Karten</li>
</ul>
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
