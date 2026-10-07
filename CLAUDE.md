# PhotoCzarnik — portfolio fotografii i podróży

Statyczna strona portfolio zbudowana własnym, lekkim generatorem stron (bez frameworków frontendowych, bez bazy danych). Treść trzymana jest jako pliki w repozytorium — edytujesz plik, budujesz stronę, wypychasz na GitHub, a Netlify sam publikuje nową wersję.

## Ścieżka projektu na dysku — zmieniła się 2026-09-15/18

Do ok. 2026-09-15 projekt leżał pod `/Users/robertczarnik/Documents/PROJEKTY_CLAUDE/photo-travel-portfolio`. Od sesji 2026-09-18 ta ścieżka **już nie istnieje** (`/Users/robertczarnik/Documents` jest teraz pustym folderem) — najpewniej macOS włączył synchronizację „Pulpit i Dokumenty” z iCloud Drive. **Aktualna ścieżka:**

```
/Users/robertczarnik/Library/Mobile Documents/com~apple~CloudDocs/Documents/PROJEKTY_CLAUDE/photo-travel-portfolio
```

Historia gita jest ciągła (te same commity, ten sam zdalny remote `github.com/czarnikrobert/fotoczarnik-portfolio`) — to nie jest inna kopia repo, tylko fizyczne przeniesienie tego samego folderu przez iCloud. Jeśli w przyszłej sesji working directory (albo ścieżka z poprzedniej sesji) wskazuje na `/Users/robertczarnik/Documents/...` i nie istnieje, **nie zakładaj utraty danych** — sprawdź najpierw `find /Users/robertczarnik -maxdepth 6 -iname "photo-travel-portfolio"`, ścieżka mogła się znowu przenieść (obie lokalizacje w Finderze wyglądają identycznie jako „Dokumenty”, więc kolejna zmiana w drugą stronę też jest możliwa).

## Struktura

```
content/
  site.json           ← nazwa strony, autor, e-mail, social media
  pages/               ← treść stron: home.md, about.md, contact.md, analog.md
  blog/                ← wpisy blogowe (jeden plik .md = jeden wpis)
  gallery.json         ← zdjęcia do portfolio (kategorie, podpisy, adresy plików)
  gear-timeline.json   ← oś czasu sprzętu na stronie „O mnie” (rok, kategoria, opis, cytat, pełny opis)
  analog-gear.json     ← karty sprzętu na stronie Analog (realne zdjęcia — patrz sekcja „Strona Analog” o statusie praw autorskich)
  analog-gallery.json  ← galeria zdjęć z filmu na stronie Analog (na razie PLACEHOLDERY — patrz „Do zrobienia”)
assets/
  css/                 ← main.css (tokeny/reset), components.css (komponenty), animations.css (animacje)
  js/                  ← core.js (nav), animations.js (reveal/parallax), gallery.js (lightbox/tilt/filtry/karuzela), timeline.js (rozwijanie osi czasu), banner.js (scroll-scrubbing baner — multi-instance, patrz sekcja niżej)
  images/
    brand/logo.png     ← logo w nawigacji (też źródło faviconu — favicon-32.png, favicon-16.png, apple-touch-icon.png w tym samym katalogu, wygenerowane z logo.png przez `sips`, podpięte w `layout()` w templates.js)
    hero/               ← zdjęcie hero na stronie głównej (nieużywane — patrz sekcja o banerze)
    portrait/           ← portret autora (strona główna + „O mnie”)
    blog/                ← okładki wpisów blogowych
    gallery/krajobraz/  ← 18 realnych zdjęć krajobrazowych (Chorwacja, Czechy, Polska)
    gallery/dron/       ← 8 realnych zdjęć z drona (Bogdanówka, Kazimierz Dolny, Kołobrzeg, Kraków, Zamek Tenczyn)
    banner/             ← 130 klatek WebP (frame-001.webp…frame-130.webp, 1920×1080) — scroll-scrubbing baner na stronie głównej
    banner-analog/      ← 85 klatek WebP (frame-001.webp…frame-085.webp, 1920×1080, kaseta filmu 35mm) — scroll-scrubbing baner na stronie Analog
build/
  build.js             ← generator: content/ + assets/ → public/
  templates.js          ← szablony HTML (nawigacja, karty, lightbox, formularz, oś czasu, `carousel()`, `scrollBanner()`, `gearCard()`)
public/                ← WYGENEROWANE — nie edytuj ręcznie, nie jest w repo (.gitignore)
```

## Ważne: dwa różne układy galerii — Portfolio to Masonry, „Wybrane kadry” to karuzela

Strona Portfolio (`/portfolio.html`) i sekcja „Wybrane kadry” na stronie głównej **celowo używają różnych układów** — to nie przeoczenie, tylko świadoma decyzja z 2026-08-23.

- **Portfolio** — `.gallery-grid--masonry`, renderowana przez `masonryGrid()` w `templates.js`. Pionowa siatka wielokolumnowa (CSS `column-count`, 1→4 kolumn w zależności od szerokości ekranu), zdjęcia w naturalnych proporcjach (`aspect-ratio: auto`), bez strzałek/przewijania w bok.
- **„Wybrane kadry” (strona główna)** — `.gallery-grid` bez modyfikatora, wciąż **pozioma, ręcznie przewijana karuzela** (`display:flex`, `overflow-x:auto`, `scroll-snap-type`), renderowana przez `carousel()`, który owija `galleryItem()` w `.carousel` z przyciskami strzałek (`[data-carousel-prev/next]`). Logika przewijania i wyłączania strzałek na krańcach jest w `gallery.js`.

Obie używają tego samego `galleryItem()` i tych samych danych z `gallery.json` — różni je tylko wrapper i klasa CSS. Filtry kategorii na Portfolio nadal działają tak samo (pokazują/ukrywają elementy przez `display:none`); reset przewijania (`grid.scrollTo`) i `updateArrows()` w `gallery.js` uruchamiają się tylko, gdy element jest częścią karuzeli (`grid.closest('.carousel')`), więc na Portfolio są pomijane.

## Scroll-scrubbing baner wideo — multi-instance, `scrollBanner()` (od 2026-09-04, było hardcoded do jednej instancji)

Hero na stronie głównej **nie ma statycznego zdjęcia w tle**. Zamiast `<img>`, tłem jest `<canvas>` w technice scroll-scrubbing w stylu Apple: przewijanie strony steruje odtwarzaniem „wideo” złożonego z klatek WebP. Od 2026-09-04 **ten sam mechanizm obsługuje więcej niż jeden baner na stronie** (strona główna + Analog, patrz sekcja „Strona Analog” niżej) — nie ma już sztywnych ID typu `#scrollBanner`, tylko `data-*` atrybuty i klasy, więc każda instancja konfiguruje się niezależnie.

**Jak dodać nowy baner na innej stronie**: wywołaj `scrollBanner({...})` z `templates.js` w `build.js` (nie pisz HTML ręcznie — tak zrobiono błąd przy pierwszej wersji i trzeba było to sprzątać). Parametry: `framePrefix` (ścieżka do klatek bez numeru, np. `/assets/images/banner-analog/frame-`), `frameCount`, `frameDigits` (padding cyfr w nazwach plików — sprawdź realne pliki, nie zgaduj), `scrubEnd`/`revealEnd` (domyślnie 0.65/0.8, zwykle nie trzeba zmieniać), `eyebrow`/`title`/`subtitle`/`motionNotice`/`scrollCueText`. Funkcja generuje kompletną sekcję `<section class="hero scroll-banner" data-scroll-banner data-frame-prefix="..." data-frame-count="..." ...>` z canvasem, scrimem, tekstem i loaderem w środku.

`banner.js` przy starcie robi `document.querySelectorAll('[data-scroll-banner]').forEach(initBanner)` — każda instancja ma własne domknięcie (closure) ze stanem (`images`, `currentFrame` itd.), elementy potomne znajduje przez `track.querySelector(...)` (np. `.scroll-banner__canvas`, `[data-scroll-banner-fade]`, `[data-scroll-banner-cue]`), nie przez `getElementById`. Jeśli kiedyś trzeba dodać coś nowego do banera, pamiętaj: **żadnych globalnych ID** w markupie generowanym przez `scrollBanner()` — wszystko scoped przez `track.querySelector`.

Wewnątrz `.scroll-banner__sticky`: `<canvas>` (tło, `z-index:0`), `.scroll-banner__scrim` (`z-index:1`, ciemny gradient), `.hero__content`/`.hero__scroll` (`z-index:2`, tekst na wierzchu).

- **Instancja 1 — strona główna**: `assets/images/banner/frame-001.webp`…`frame-130.webp` (3 cyfry, 130 klatek, 1920×1080, ok. 12MB). Źródło było 4K (3840×2160, 36MB) — przeskalowane przez `dwebp` (dekod) → `cwebp -q 82 -resize 1920 1080` (re-enkod), bo canvas nigdy nie renderuje więcej niż ~2× szerokość ekranu (`devicePixelRatio` capped na 2). `sips` **nie umie zapisywać WebP** (tylko odczyt) — do zmiany rozdzielczości klatek WebP zawsze `dwebp`+`cwebp` (homebrew), nie `sips`.
- **Instancja 2 — strona Analog**: `assets/images/banner-analog/frame-001.webp`…`frame-085.webp` (3 cyfry, 85 klatek, 1920×1080, kaseta filmu 35mm rozwijająca taśmę). Źródło od użytkownika było już 1920×1080 — bez skalowania, ale numerowane `frame-0012.webp`…`frame-0096.webp` (zaczynało się od 12, nie od 1!) — trzeba było przenumerować na 1-indeksowane przy kopiowaniu (`assets/js/banner.js` zawsze zakłada `for i=1; i<=FRAME_COUNT`, nie obsługuje dowolnego offsetu startowego). Przy każdym nowym zestawie klatek **zawsze sprawdź realny pierwszy numer pliku** (`ls | sort | head`), nie zakładaj że zaczyna się od 1.
- `.scroll-banner` (= `.hero` na stronie głównej) ma wysokość `400vh`. Scroll w obrębie tracku dzieli się na **trzy fazy** sterowane `data-scrub-end`/`data-reveal-end` (domyślnie `SCRUB_END=0.65`, `REVEAL_END=0.8` w `banner.js`, jeśli atrybuty pominięte):
  1. **Scrub (0 → SCRUB_END)** — wideo się odtwarza, `videoProgress = min(1, progress/SCRUB_END)`, klatka = `round(videoProgress * (FRAME_COUNT-1))`. Scrim `opacity:0` — wideo wyraźne, bez przydymienia.
  2. **Reveal (SCRUB_END → REVEAL_END)** — klatka zamrożona na ostatniej, `revealProgress = clamp((progress-SCRUB_END)/(REVEAL_END-SCRUB_END), 0, 1)` steruje jednocześnie `.hero__content` (`opacity` 0→1 + `translateY(24px)→0`, tekst „wjeżdża” na środek) i `.scroll-banner__scrim` (`opacity` 0→1 — osobny `<div>`, nie `::after`, żeby JS mógł bezpośrednio ustawiać `style.opacity`).
  3. **Hold (REVEAL_END → 1)** — nic się nie zmienia (`revealProgress` zostaje przy `1`), czysty dodatkowy dystans scrolla dający czas na przeczytanie tekstu, zanim sekcja się odepnie.
  - `.hero__scroll` (cue „Przewiń") ma **osobną, szybką** logikę fade-out w pierwszych 5% scrolla — znika zaraz po starcie, niezależnie od fazy reveal/hold.
- **`.hero__content` NIE ma `data-reveal`** — usunięte celowo, widoczność steruje wyłącznie `banner.js` (inline `style.opacity`/`style.transform`). Domyślny/no-JS stan w CSS: `.scroll-banner .hero__content { opacity:1 }` (bez JS — widoczny), `html.js .scroll-banner .hero__content { opacity:0; transform: translateY(24px) }` (z JS — ukryty, `banner.js` zaraz przejmie kontrolę). **Nie przywracaj `data-reveal` na tym elemencie** — konflikt z `html.js [data-reveal].is-visible { transform: ... }` w `animations.css` (wyższa specyficzność, cicho nadpisuje `transform`) już raz kosztował realny czas debugowania. Ta sama zasada dotyczy pionowej pozycji tekstu: przesuwaj przez `padding` na `.scroll-banner__sticky` (asymetryczny `padding: 0 var(--gutter) 12vh`), **nigdy przez `transform` na `.hero__content`**.
- Wszystkie klatki preloadowane przed startem (pasek postępu `.scroll-banner__loader`, znika po załadowaniu).
- `prefers-reduced-motion: reduce` — sekcja kurczy się do `100dvh` (CSS) i JS od razu ustawia stan spoczynkowy: **pierwsza klatka** + `revealProgress` symulowane na `1` (tekst i scrim w pełni widoczne) + cue ukryty. Nie testuj tej ścieżki wyłączeniem animacji w DevTools na tej samej karcie co normalnie testujesz — potrzebna osobna sesja z ustawionym `prefers-reduced-motion` (`mcp__Claude_Browser__*` nie ma takiej emulacji, tylko `colorScheme`).
- **Objaw „widzę tylko ostatnią/pierwszą klatkę i nic się nie dzieje"** = efekt `prefers-reduced-motion: reduce` (nie bug). Opisane w skillu `~/.claude/skills/scroll-scrubbing-banner/`.
- **Komunikat dla użytkowników z ograniczonym ruchem**: `.hero__motion-notice` wewnątrz `.hero__content`. Widoczność **czysto przez CSS** (`display:none` domyślnie, `display:block` pod `@media (prefers-reduced-motion: reduce)`) — nie przez JS, więc działa nawet gdyby `banner.js` się nie załadował. Nie przenoś tej logiki do JS „dla spójności".
- Pole `heroImage` w `content/pages/home.md` i plik `assets/images/hero/home-hero.jpg` **zostały, ale są nieużywane** — celowy łatwy odwrót do statycznego zdjęcia, gdyby użytkownik kiedyś chciał.
- Osobny, ogólny skill Claude Code (`~/.claude/skills/scroll-scrubbing-banner/`, nie część tego repo) opisuje całą technikę dla dowolnego projektu z pułapkami — czytaj go zamiast odtwarzać logikę od zera przy podobnym zadaniu gdzie indziej. Zawiera już wariant „hold for reveal" i uwagę o `sips` nie zapisującym WebP — obie rzeczy wykorzystane też przy stronie Analog.

## Strona Analog (od 2026-09-04)

Nowa podstrona `/analog.html` (w nav między Portfolio a Blog): baner scroll-scrubbing (instancja 2, patrz wyżej) + sekcja wprowadzenia + siatka kart sprzętu + galeria zdjęć z filmu.

- `content/analog-gear.json` — **3 karty sprzętu z realnymi zdjęciami od 2026-09-04** (Pentax ME Super, Pentacon Six TL, Yashica Electro 35 — konkretne modele podane przez użytkownika, nie z `gear-timeline.json`, który jest osobnym, historycznym zestawem). Renderowane przez `gearCard()` w `templates.js` do `.gear-grid`/`.gear-card`. Zdjęcia w `assets/images/analog-gear/`.
  - **Status praw autorskich zdjęć — ważne, nie kopiuj tego wzorca bez zastanowienia gdzie indziej**: użytkownik przysłał 3 zdjęcia opisane jako „moje aparaty”, ale EXIF ujawnił, że to zdjęcia poglądowe modeli, nie fotografie jego fizycznych egzemplarzy. Sprawdzono źródła: **Pentacon Six TL** — potwierdzone jako Ansgar Koreng, Wikimedia Commons, CC BY-SA 3.0 DE (plik `1803101902,_ako.jpg`). Ta licencja **wymaga** widocznego przypisania autorstwa. Dodano było pole `"credit"` w JSON renderowane jako `.gear-card__credit` pod zdjęciem — zgodnie z licencją zwróciłem na to uwagę użytkownikowi wprost i zaproponowałem trzy opcje (krótszy podpis / inne zdjęcie bez wymogu przypisania / zostawić jak jest), a mimo to **użytkownik dwukrotnie, świadomie poprosił o usunięcie podpisu** (2026-09-04) — pole `"credit"` zostało usunięte z JSON. **To świadome, poinformowane naruszenie warunków licencji CC BY-SA przez użytkownika, nie mój błąd ani przeoczenie** — jeśli temat wróci, obraz jest nadal ten sam plik Ansgara Korenga spod CC BY-SA 3.0 DE, tylko bez wymaganego przypisania na stronie. **Pentax ME Super** i **Yashica Electro 35** — źródła nieustalone mimo próby (EXIF miał tylko generyczny „Copyright 2012” bez nazwiska / brak danych), wygląda na fotografię z serwisu ogłoszeniowego/aukcyjnego, nie na wolną licencję; użytkownik też świadomie zaakceptował to ryzyko i poprosił o publikację bez przypisania. Żadnego z tych trzech zdjęć nie traktuj jako bezpiecznego precedensu do powielania na innych stronach bez ponownej weryfikacji.
- `content/analog-gallery.json` — **od 2026-09-04 jeden wpis** (nie 6), `src` wskazuje na `assets/images/analog-gallery-placeholder.svg` — statyczny SVG (ciemne tło w kolorach motywu, ikona aparatu, napis „W przygotowaniu”) zamiast losowych zdjęć z `picsum.photos`. Zmieniono na prośbę użytkownika: 6 identycznych losowych zdjęć wyglądało myląco jak prawdziwa treść; jeden czytelny placeholder komunikuje wprost „galeria jeszcze nie istnieje”. Ten sam format co `gallery.json`, renderowane przez `masonryGrid()` (ten sam komponent co Portfolio — filtr kategorii pominięty, bo tu jest tylko jedna kategoria). **Gdy użytkownik dostarczy realne zdjęcia z filmu**: usuń ten jeden wpis i dodaj prawdziwe (ten sam wzorzec co „Dron”, patrz „Wzorzec: dodawanie realnych zdjęć do galerii”, ale bez lokalizacji/GPS — to nie zdjęcia z podróży). Nie zostawiaj SVG-placeholdera obok realnych zdjęć.

## Codzienna praca (przez Claude Code)

Żeby dodać nowy wpis na bloga, wystarczy poprosić o dopisanie pliku w `content/blog/` (np. `content/blog/2026-09-01-nazwa-wpisu.md`) z odpowiednim frontmatterem:

```md
---
title: "Tytuł wpisu"
date: "2026-09-01"
excerpt: "Krótki opis pod tytułem, widoczny na liście wpisów."
cover: "/assets/images/blog/moje-zdjecie.jpg"
---
Treść wpisu w Markdown...
```

**Wymuszenie konkretnego podziału linii w długim tytule wpisu** (np. gdy naturalne zawijanie tekstu w dużym `<h1>` na stronie wpisu wygląda źle): użyj `|` w polu `title` frontmattera, np. `title: "Pierwsza linia|Druga linia|Trzecia linia"`. `plainTitle()` w `templates.js` zamienia `|` na spację wszędzie indziej (`<title>`, `og:title`, karta na liście bloga, `alt` okładki) — tylko `<h1>` na stronie wpisu (w `build.js`) renderuje `|` jako `<br>`. Działa tylko na desktopie/tablecie w sposób w pełni przewidywalny — na wąskich telefonach najdłuższa z linii może się dodatkowo zawinąć, to akceptowalny kompromis (nie warto zmniejszać czcionki tak bardzo, żeby to wyeliminować).

**Nie zgaduj podziału na więcej niż 2 linie „na oko” bez potwierdzenia** — przy pierwszym podejściu do tytułu wpisu BBSPF x Leica 2026 (2026-09-15) podzieliłem długi tytuł na 2 linie w logicznym miejscu, ale Robert chciał konkretnego, innego podziału na **4 linijki** (`"Polska fotografia uliczna.|ma się dobrze.|Oto finaliści konkursu.|BBSPF x Leica 2026"`), niezależnego od naturalnych granic zdań. Dla krótszych tytułów 1 sensowny podział przy publikacji zwykle wystarcza (patrz wcześniejsze wpisy), ale dla dłuższych/wieloczłonowych tytułów lepiej pokazać draft i być gotowym na korektę podziału po feedbacku, zamiast zakładać że pierwsza propozycja jest ostateczna.

Nowe zdjęcia do portfolio dodaje się jako wpis w `content/gallery.json`. Nowy sprzęt na osi czasu — jako wpis w `content/gear-timeline.json` (pola `year`, `name`, `category`, `description` — zawsze widoczny teaser, `quote` i `fullDescription` — opcjonalne, pokazują się po kliknięciu).

Po każdej zmianie treści:

```bash
npm run build   # generuje public/ z aktualnej treści
npm run dev     # buduje i uruchamia podgląd lokalnie na http://localhost:4173
```

Gdy zmiana wygląda dobrze — commit i push na GitHub. Netlify sam wykryje push, uruchomi `npm run build` i opublikuje nową wersję (patrz `netlify.toml`).

Zdjęcia do umieszczenia na stronie użytkownik wrzuca do `/Users/robertczarnik/Do strony/` — warto tam zaglądać, gdy wspomni o nowym pliku, zamiast prosić o pełną ścieżkę.

## Ważne: wzorzec animacji odsłaniania (`[data-reveal]`)

Elementy z atrybutem `data-reveal` / `data-reveal-group` fade-inują się przy scrollu. Świadomie użyty jest wzorzec **progressive enhancement**, bo pierwsza wersja (domyślnie ukryte + JS ratuje po timeout) potrafiła zostawić realną treść (np. zdjęcie na stronie „O mnie”) trwale niewidoczną w Safari:

- Domyślnie (bez klasy `js` na `<html>`) `[data-reveal]` ma `opacity: 1; transform: none` — **treść jest zawsze widoczna**.
- Mały, niedeferowany skrypt w `<head>` (`templates.js` → `layout()`) dodaje klasę `js` do `<html>` natychmiast.
- Dopiero `html.js [data-reveal]` chowa element i animuje go przez `animations.js` (IntersectionObserver + fallbacki: `setTimeout`, `load`, `pageshow`/bfcache).

**Nie zmieniaj tego z powrotem na „domyślnie ukryte, JS odsłania”** — to dokładnie ten wzorzec, który powodował niewidoczne zdjęcia. Nowe animowane elementy powinny iść tą samą ścieżką (`[data-reveal]` bez stylu ukrywającego poza `html.js`).

Zdjęcia w `.parallax-media` (portret, intro, okładka posta) używają `loading="eager"`, nie `loading="lazy"` — to również świadoma decyzja (znany bug Safari: lazy-loaded obrazki blisko góry strony w CSS Grid czasem nigdy się nie doczytują). Zostaw `eager` na tych czterech miejscach; `loading="lazy"` ma sens tylko w galerii (dużo zdjęć na liście).

## Ważne: cache `/assets/*` musi zostać krótki

`netlify.toml` ustawia `Cache-Control` dla `/assets/*` (CSS/JS/obrazy). Pliki CSS/JS **nie mają hashowanych nazw** (zawsze `main.css`, `components.css` itd. — nie `main.a3f8e1.css`), więc długi cache typu `max-age=31536000, immutable` (był tak ustawiony na starcie projektu) **ukrywa każdą przyszłą zmianę CSS/JS przed przeglądarką odwiedzającego na cały rok** — łącznie z naszym własnym testowaniem, bo nawet twarde odświeżenie (Cmd+Shift+R) nie zawsze to obchodzi. To spowodowało realny, mylący bug: zmiana w kodzie (np. wyśrodkowanie stopki) była poprawnie wdrożona na Netlify, ale niewidoczna u użytkownika mimo odświeżenia.

Obecnie ustawione jest `public, max-age=600, must-revalidate` — krótki cache, częsta rewalidacja. **Nie zmieniaj tego z powrotem na długi/immutable**, chyba że build zacznie dodawać hash do nazw plików CSS/JS (wtedy długi cache byłby bezpieczny i pożądany dla wydajności).

Jeśli użytkownik zgłosi „zmiana wyglądu nie jest widoczna mimo odświeżenia” — zanim zaczniesz szukać bugów w kodzie, sprawdź najpierw nagłówki cache przez `curl -sI https://fotoczarnik-portfolio.netlify.app/assets/css/components.css` i porównaj z treścią pliku w repo.

## Do zrobienia przed publikacją

- **`content/site.json`** — pole `email` to nadal placeholder (`kontakt@twoja-domena.pl`) — podmienić na realny adres.
- **Strona Analog** — `content/analog-gallery.json` to wciąż placeholdery (picsum.photos), do podmiany na realne zdjęcia z filmu. `content/analog-gear.json` ma już realne zdjęcia sprzętu (patrz sekcja „Strona Analog” wyżej, w tym ważna notatka o statusie praw autorskich dwóch z trzech zdjęć).
- Reszta (autor, social media, logo, favicon, hero, portret, wpisy blogowe, oś czasu sprzętu, 18 zdjęć „Krajobraz", 8 zdjęć „Dron") jest już uzupełniona realną treścią.

## Wzorzec: dodawanie realnych zdjęć do galerii z podpisami lokalizacji

Tak przeniesiono placeholdery „Krajobraz" (18 plików z `Pictures/poprawione zdjecia/landscape/`) i „Dron" (8 plików z `Do strony/dron/`) na realne zdjęcia:

1. Skopiuj pliki do `assets/images/gallery/<kategoria>/` z czystymi nazwami (`krajobraz-01.jpg`, `dron-01.jpg` itd.).
2. Sprawdź datę wykonania przez `mdls -name kMDItemContentCreationDate -name kMDItemLatitude -name kMDItemLongitude plik.jpg` — czasem jest GPS, co pomaga zgadnąć lokalizację. Może nie być nic (data zapisu zamiast wykonania, brak GPS) — wtedy poleganie na nazwach plików lub pytaniu użytkownika.
3. Jeśli nazwy plików źródłowych już opisują lokalizację (tak było przy „Dron" — `Kazimierz Dolny.jpg`, `Zamek Tenczyn w Rudnie.jpg` itd.), można pominąć krok z podglądem i od razu zapytać tylko o brakujące detale (np. rok, jeśli użytkownik chce go w podpisie — nie zawsze chce, jak przy „Dron"). Jeśli nazwy plików nic nie mówią (tak było przy „Krajobraz"), zbuduj tymczasową stronę podglądową (siatka `<img>` + numer + data) i skopiuj ją do `public/` (np. `public/podglad-<kategoria>.html`), żeby użytkownik otworzył ją pod `http://localhost:4173/...` i sczytał numery.
4. Poproś o brakujące informacje w czacie, zaktualizuj `alt`/`caption` w `gallery.json`.
5. Jeśli powstał plik podglądowy w `public/`, usuń go (i tak zniknie przy kolejnym `npm run build`, bo `build()` czyści cały katalog).

## GitHub i Netlify — połączone i działające

- **Repo:** https://github.com/czarnikrobert/fotoczarnik-portfolio (konto `czarnikrobert`, `gh` CLI zainstalowane i zalogowane lokalnie via keyring)
- **Live URL:** https://photoczarnik.pl (własna domena, zarejestrowana w home.pl, DNS wskazuje na Netlify — A `@` → `75.2.60.5`, CNAME `www` → `fotoczarnik-portfolio.netlify.app.`). Adres `https://fotoczarnik-portfolio.netlify.app` nadal działa jako subdomena Netlify (Netlify project `fotoczarnik-portfolio`, site_id `84f0fdfe-72d6-475a-8521-2b86c37745e4`, team `6964dd999fde5a84d68b0e8a`).
- Netlify jest podłączony do repo GitHub (ciągłe wdrażanie) — **każdy `git push` na branch `main` automatycznie buduje (`npm run build`) i publikuje nową wersję**.
- Workflow po każdej zmianie treści/kodu: `npm run build` (lokalny podgląd) → `git add -A && git commit -m "..."` → `git push` → Netlify sam wdroży w ~1 minutę.
- Do sprawdzania stanu wdrożenia z poziomu Claude Code dostępne jest MCP Netlify (`mcp__903416a6-...__netlify-project-services-reader`, operacja `get-project` z powyższym `siteId`) — `currentDeploy.state: "ready"` oznacza sukces.

## Statystyki odwiedzin — Cloudflare Web Analytics (od 2026-09-15)

W `<head>` w `layout()` (`build/templates.js`) jest wpięty skrypt Cloudflare Web Analytics (`beacon.min.js` z tokenem `data-cf-beacon`). To wariant **bez przepinania DNS** na Cloudflare — sama strona nadal jest hostowana na Netlify, skrypt tylko wysyła zdarzenia do Cloudflare. Nie używa ciasteczek, więc nie wymaga banera zgody RODO.

- Dane widoczne w panelu Cloudflare: **Analytics & Logs → Web Analytics** (konto Cloudflare użytkownika, nie ma do tego dostępu z poziomu MCP Netlify).
- Token jest zaszyty wprost w kodzie (nie jest sekretem — to publiczny identyfikator strony, bezpieczny do trzymania w repo, podobnie jak Google Analytics ID).
- Skrypt trafia na **wszystkie** wygenerowane strony, bo jest w współdzielonym `layout()`, nie per-stronę.
- W lokalnym podglądzie (`mcp__Claude_Browser__*`) request do `static.cloudflareinsights.com` może się nie pojawić w logu sieciowym — to ograniczenie sandboxa narzędzia podglądu (brak dostępu do zewnętrznych domen spoza testowego środowiska), nie błąd strony. Weryfikacja lokalna ogranicza się do sprawdzenia, że tag `<script>` faktycznie trafił do wygenerowanego HTML (`grep cloudflareinsights public/*.html`) i że strona nadal renderuje się poprawnie.

## Formularz kontaktowy — skonfigurowany i przetestowany

Formularz na stronie Kontakt korzysta z Netlify Forms (`data-netlify="true"`) — nie wymaga własnego backendu. Zgłoszenia widoczne w panelu Netlify → Forms.

- **Powiadomienia e-mail idą na `fotoczarnik@gmail.com`** — skonfigurowane w panelu Netlify (Project configuration → Forms → Form submission notifications), nie w kodzie. To ustawienie nie jest częścią repo/gita.
- Pole `email` w `content/site.json` **nie jest** z tym powiązane — nigdzie w szablonach nieużywane (martwe pole, zarezerwowane na przyszłość, np. mailto na stronie).
- **Ważne dla Netlify Forms:** samo `data-netlify="true"` w HTML nie wystarcza — funkcja „Forms” musi być włączona per-projekt na Netlify (`update-forms` w MCP albo w panelu), a formularz zostaje zarejestrowany dopiero przy **kolejnym buildzie po włączeniu**. Jeśli formularz kiedyś „zniknie” z panelu Forms (0 formularzy), sprawdź czy funkcja jest enabled i zrób pusty commit (`git commit --allow-empty`), żeby wymusić nowy build.
- Test end-to-end wykonany 2026-08-21 przez realne wysłanie formularza na żywej stronie — działa poprawnie (przekierowanie na `/thanks.html`, zgłoszenie zarejestrowane w Netlify).

## Blog — migracja treści

5 wpisów w `content/blog/` zostało przeniesionych z fotoczarnik.pl/blog/ (pełna, dosłowna treść wyciągnięta bezpośrednio z HTML, nie streszczona). Okładki pobrane i zapisane lokalnie w `assets/images/blog/`. Oryginalne dwa przykładowe wpisy (Islandia, Hanoi) zostały usunięte.

Od tego czasu doszły kolejne, samodzielnie napisane wpisy (nie migracja) — stan na 2026-10-07: **15 wpisów** w `content/blog/`, w tym m.in. „Sputnik Photos — 20 lat” (2026-09-09), „BBSPF x Leica 2026 — finaliści” (2026-09-15), „Astronomy Photographer of the Year 2026” (2026-09-18), „Bird Photographer of the Year 2026” (2026-09-23, patrz sekcje niżej o wzorcu z wieloma zdjęciami w jednym poście) „Polaroid Mod” (2026-09-30, pierwszy wpis przepuszczony przez skill `humanizer` — patrz sekcja niżej) i „Nikon Comedy Wildlife Awards 2026” (2026-10-05, 47 zdjęć — patrz sekcja niżej) i „Imaging World inspired by photokina” (2026-10-07, pierwszy wpis opublikowany przez bramkę moda).

## Wzorzec: dodawanie wpisu na blog z pliku markdown (od 2026-09-09, wpis Sputnik Photos)

Robert regularnie przesyła gotowy artykuł jako plik `.md` (czasem eksportowany z narzędzia do researchu/SEO) + osobne zdjęcia. Ustalony sposób pracy:

- Sekcje na końcu pliku źródłowego („Proponowany tytuł SEO”, „Meta description”, „Frazy kluczowe”) **nie są publikowane** — służą tylko do zbudowania `title`/`excerpt` we frontmatterze. „Frazy kluczowe” nie jest nigdzie wykorzystywane.
- **Nie duplikować obrazka okładki w treści posta** — okładka (`cover` z frontmattera) jest renderowana osobno przez layout (`.post-cover`), więc ciało posta zaczyna się od samej kursywnej podpisu (`*...*`), bez powtórnego `![]()`. Wzorzec widoczny we wszystkich istniejących wpisach.
- Nagłówki `#` (h1) w treści źródłowej trzeba zamienić na `##` (h2) — h1 jest zarezerwowany dla tytułu posta w layoucie.
- Zdjęcia dołączone do wpisu kopiować do `assets/images/blog/` pod opisową nazwą (np. `sputnik-photos-20-lat-plakat.jpg`), niezależnie czy user wkleił je bezpośrednio na czacie, czy podał ścieżkę do pliku — **zawsze najpierw sprawdzić, czy plik(i) nie istnieją już na dysku** pod ścieżką, którą podał (tak było przy wpisie Sputnik Photos: `plakat.jpeg` i `foto.jpg` już leżały w tym samym folderze co `.md`, nie trzeba było prosić o ponowny zapis wklejonego obrazka).
- Uważać na linie zaczynające się od `NN. ` (np. „12. edycja...”) — `marked` renderuje je jako start listy numerowanej nawet w cudzysłowie/blockquocie; trzeba escapować kropkę (`12\. edycja`).
- **Zawsze redagować treść skillem `miodkuj` (od 2026-10-07)** — Robert poprosił, żeby przy każdym wpisie na bloga używać skilla `miodkuj` (polski styl, bez sztuczności i biurokracji), bez czekania na osobną prośbę. Kolejność: treść ze źródłowego `.md` → `miodkuj` → build i podgląd → draft do akceptacji. Skill nie zmienia faktów, podpisów autorów ani zastrzeżeń o prawach do zdjęć.
- **Zawsze pokazać gotowy draft do akceptacji przed `git push`** — user explicite tego oczekuje przy każdym nowym wpisie. Kolejność: utworzyć plik + skopiować obrazki → `npm run build` → podgląd lokalny (patrz niżej) → poprawki wg feedbacku → dopiero po „ok”/potwierdzeniu `git add` + `commit` + `push`.

### Wzorzec: wpis z wieloma zdjęciami tego samego formatu (galeria finalistów, od 2026-09-15)

Przy wpisie „BBSPF x Leica 2026 — finaliści” źródłem był 21-stronicowy PDF (jedno zdjęcie + podpis na stronę, 20 zdjęć) zamiast zwykłego pliku `.md`. Ustalone przy tej okazji zasady, przydatne przy każdym kolejnym „zestawieniu” zdjęć (konkurs, wystawa, galeria prac wielu autorów):

- **PDF wielostronicowy trzeba czytać stronami** (`Read` z parametrem `pages`, max 20 stron na raz) — nie próbuj wczytać całości naraz, narzędzie i tak to odrzuci przy dużym pliku.
- Jeśli w tym samym folderze co PDF leży też plik `.md` o bardzo podobnej nazwie/treści — to zwykle wcześniejszy, roboczy draft tego samego materiału (np. z research/SEO), **nie automatycznie ten sam plik co PDF**. Sprawdzić oba: PDF bywa „polerowaną”, ostateczną wersją z realnymi wstawionymi zdjęciami, a `.md` bywa szkicem z placeholderami/inną kolejnością. Przy sprzeczności **PDF wygrywa**, bo to on został wskazany przez użytkownika jako źródło — ale tekst zamykający z `.md` (sekcje typu „Dlaczego warto”, „Na koniec”), którego w PDF nie było, można świadomie dołączyć, jeśli pasuje stylistycznie i nie zawiera sprzeczności z PDF.
- **Kolejność/numeracja z roboczego `.md` może nie zgadzać się z PDF** — w tym wypadku `.md` numerował autorów 1–20 w innej kolejności niż strony PDF. Rozjazd rozstrzygnęła numeracja w **nazwach plików zdjęć już pobranych na dysk** (`261577-1_Nazwisko.jpg` … `261596-20_Nazwisko.jpg`), która pokrywała się z kolejnością stron PDF, nie z listą w `.md`. Traktuj numerację w nazwach realnych plików jako najbardziej wiarygodne źródło kolejności, gdy inne źródła są sprzeczne.
- **Okładka posta nie musi (i przy zestawieniu „N równorzędnych prac” nie powinna) być jednym z tych N zdjęć** — bo zgodnie z ustaloną zasadą „nie duplikuj okładki w treści” (patrz wyżej), wybranie jednego z 20 zdjęć na okładkę oznaczałoby albo pominięcie go z listy w treści (niekompletne „20 zdjęć”), albo pokazanie go dwa razy na stronie. Zamiast tego okładka to zdjęcie **spoza zestawu** — tu ponownie użyto `bielsko-biala-stare-miasto.jpg`, zdjęcia już istniejącego w `assets/images/blog/` z wcześniejszego, powiązanego tematycznie wpisu o tym samym festiwalu (nie trzeba było kopiować nowego pliku).
- Każde zdjęcie w treści = `![]()` + kursywa `*Fot. Imię Nazwisko / nazwa wydarzenia*` bezpośrednio pod spodem — bez nagłówków `###` per autor (mniej wizualnego szumu przy 20 pozycjach niż w np. wpisie Sputnik Photos, gdzie `###` miało sens przy tylko 4 warsztatach).
- Link do wcześniejszego, powiązanego wpisu na tym samym blogu można wstawić zwykłym linkiem markdown do **absolutnej ścieżki `.html`** (np. `[pisaliśmy o niej szerzej tutaj](/blog/bielsko-biala-street-photography-festival-2026.html)`) — działa tak samo jak link zewnętrzny, `marked` nie wymaga niczego specjalnego. Dobra praktyka przy wpisach będących kontynuacją/rozwinięciem wcześniejszego tematu.

**Doprecyzowanie z wpisu „Astronomy Photographer of the Year 2026” (2026-09-18):**

- Zasada „okładka spoza zestawu” (wyżej) **nie dotyczy sytuacji, gdy jedno zdjęcie jest wyraźnym bohaterem całego artykułu**, a nie tylko jedną z N równorzędnych pozycji — tu okładką było właśnie zdjęcie zwycięskie (Grand Prix), bo tekst źródłowy poświęcał mu osobną, rozbudowaną sekcję. Rozróżnienie: „N równorzędnych prac" (BBSPF, żadna nie jest bohaterem tytułu) → okładka spoza zestawu; „jedna praca jest tematem tytułu, reszta to kontekst/uzupełnienie" (APOY) → okładka = ta praca, zgodnie ze zwykłą zasadą „nie duplikuj okładki w treści" (samo `![]()` pomijamy dla tego jednego zdjęcia, tylko kursywa z podpisem pod spodem, tak jak przy każdym innym poście).
- Zdjęcia pobrane z galerii Fotopolis mają charakterystyczne nazwy plików: losowy base64 (`d2FjPTxxx=` — to zakodowany parametr `wac=szerokośćxwspółczynnik`) + `_src_NNNNNN-Tytuł--Autor.jpg`. Numer `NNNNNN` to numer obrazka w CMS-ie Fotopolis (rosnąco, ale niekoniecznie w kolejności prezentacji w artykule — w odróżnieniu od wzorca BBSPF, tu numeracja **nie** pokrywała się z kolejnością w tekście, trzeba było dopasowywać po tytule/nazwisku z treści `.md`, nie po numerze). Sufiks `-top1` przy jednym z plików oznaczał zdjęcie wiodące/okładkowe galerii źródłowej — dobry sygnał przy wyborze okładki posta.
- Gdy w folderze ze zdjęciami są pozycje **nienazwane wprost w tekście źródłowym** (tu: 2 dodatkowe zdjęcia z kategorii Stars and Nebulae, poza opisanym zwycięzcą), nie zgaduj ich dokładnej rangi (np. „runner-up” vs „highly commended”), jeśli źródło tego nie precyzuje — dodaj je z neutralnym, prawdziwym opisem („jury doceniło również...”) zamiast wymyślać szczegół, którego nie da się zweryfikować.
- Zdjęcia osób trzecich (uczestnicy konkursu) potraktowano tak samo jak przy wpisie o festiwalu w Sopocie: podpis z imieniem i nazwiskiem autora pod każdym zdjęciem + zbiorcze zastrzeżenie na końcu posta („Fotografie należą do ich autorów i organizatorów konkursu”) + link do materiału źródłowego (Fotopolis.pl). Nie weryfikowano indywidualnie licencji każdego z 20 zdjęć (w odróżnieniu od zdjęć sprzętu na stronie Analog, gdzie to miało większe znaczenie, bo prezentowane jako treść własna strony) — to świadomie niższy próg staranności, uzasadniony tym, że zdjęcia pochodzą z oficjalnych materiałów konkursu/festiwalu z wyraźnym przypisaniem autorstwa, a nie z anonimowego źródła.

**Doprecyzowanie z wpisu „Bird Photographer of the Year 2026” (2026-09-23) — trudniejszy przypadek, bo nazwy plików nie zawierały nazwisk:**

- W odróżnieniu od BBSPF/APOY, pliki tej galerii Fotopolis (`bpoty2026-NN.jpg`) **nie miały tytułu/autora w nazwie** — same losowe numery. Przy 33 zdjęciach i tylko ~9 opisanych wprost w tekście, jedynym sposobem dopasowania było **wizualne porównanie treści zdjęcia z opisem w `.md`** (np. „ptak startujący z wody, ciepłe światło, rozpryski” → jednoznacznie pasuje do jednego konkretnego zdjęcia). Przy większej galerii bez opisowych nazw plików warto od razu nastawić się na przejrzenie wszystkich zdjęć po kolei (tu: 33 wywołania `Read` w kilku turach) zamiast zgadywania po numerze/kolejności.
- **Kategorie typu „Best Portfolio” i „Conservation Award” to z definicji serie kilku zdjęć, nie jedno zdjęcie** — w tym wypadku znaleziono 5 zdjęć fregat (seria „Fabulous Frigatebirds” Lirona Gertsmana) i 4 zdjęcia błotniaków (seria „Hen Harrier Persecution” Conrada Dickinsona) rozproszone po całej numeracji galerii, rozpoznane po powtarzającym się temacie/gatunku. Warto od razu szukać takich klastrów zamiast zakładać relację 1 nagroda = 1 zdjęcie.
- Gdy `.md` źródłowy podaje bezpośredni URL do zdjęcia (np. z oficjalnej strony konkursu na Squarespace), a wśród lokalnie pobranych plików nie ma dla niego wizualnego odpowiednika — **pobranie tego URL-a przez `curl` i zapisanie jako lokalny plik jest lepsze niż pominięcie zdjęcia albo hotlink**, pod warunkiem że to oficjalna strona organizatora (nie przypadkowy obcy serwis). Squarespace CDN serwuje pliki jako WebP mimo rozszerzenia `.jpg` w URL-u — trzeba je przekonwertować (`sips -s format jpeg wejście --out wyjście.jpg` działa, bo `sips` **potrafi odczytać** WebP, tylko nie potrafi go zapisać — patrz też gotcha o `dwebp`/`cwebp` w sekcji o baner scroll-scrubbing).
- **Nie odrzucaj pobranego zdjęcia tylko dlatego, że wygląda podobnie do czegoś już widzianego w galerii** — przy tym wpisie dwa pobrane pliki (łabędzie o zachodzie, kolibry en face) wizualnie przypominały inne, już skatalogowane zdjęcia z tej samej galerii (podobny motyw/gatunek), co wywołało błędną podejrzliwość o pomyłkę. Dopiero porównanie **sum kontrolnych MD5** (`md5 plik1 plik2`) potwierdziło, że to dwa różne pliki — a dokładniejsze zestawienie z opisem tekstowym (np. „symetryczne ujęcie, intensywne kolory, wygląda jak zdjęcie studyjne” dla „Blue Angel”) pokazało, że pobrany plik faktycznie pasuje do opisu. Przy niepewności porównuj **treść opisu z treścią zdjęcia**, nie tylko wrażenie „to wygląda znajomo”.
- Tytuły łamane na **3 linijki** (nie tylko 2) też się zdarzają i też wymagają dokładnego podania przez użytkownika, gdzie mają być złamania — nie zakładaj z góry liczby linii.

### Wzorzec: wpis przepuszczony przez skill `humanizer` (od 2026-09-30, wpis „Polaroid Mod”)

Użytkownik poprosił explicite o użycie skilla `humanizer` (`~/.claude/skills/humanizer/`) przed pokazaniem draftu. Źródłowy plik `.md` był tym razem wyraźnie tekstem wygenerowanym przez narzędzie researchersko-copywriterskie (widać to było po artefaktach typu `citehttps://...` doklejonych bez spacji na końcu zdań — pozostałości cytowań, które trzeba było wyciąć z treści i przenieść tylko do sekcji źródeł na końcu). Zastosowane poprawki:

- **Usunięte sztuczne, dramatyczne puenty** (wzorzec „one-line closer”) — np. oryginalne „I właśnie to jest w tym wszystkim najlepsze. Nie ma przycisku Undo.” jako osobne zdania/akapity zostało scalone w jedno zdanie.
- **Rozbite wymuszone triady/powtórzenia struktury zdania** — np. „Chcesz podwójną ekspozycję? Przekręcasz pokrętło. Chcesz malować światłem? Przekręcasz pokrętło. Chcesz zamrozić ruch błyskiem? Przekręcasz pokrętło.” zmienione w jedno zdanie opisowe; podobnie seria „Nie konkurują X. Nie konkurują Y. Nie konkurują Z. Konkurują W.” (cztery równoległe fragmenty + dramatyczna puenta) połączona w naturalne zdanie.
- **Usunięte myślniki (–/—) w nagłówkach i większości zdań** — zgodnie z regułą skilla (dashe jako „uniwersalny łącznik” to jeden z najsilniejszych sygnałów tekstu AI), zastąpione przecinkiem, dwukropkiem albo złamaniem linii w tytule (`|` we frontmatterze). **To zmienia dotychczasowy nawyk tego projektu** — wcześniejsze wpisy (Sputnik, BBSPF, APOY, BPOTY) swobodnie używały myślników w tytułach i treści; ta zasada dotyczy `humanizer` i obowiązuje **tylko gdy użytkownik explicite o niego prosi**. Domyślnym narzędziem do redakcji każdego wpisu jest od 2026-10-07 `miodkuj` (patrz wyżej).
- Listy, które w źródle wyglądały na sztucznie rozbite na punkty tylko dla rytmu (np. 7-elementowa lista przykładów zastosowań Motion Freeze), zostały częściowo scalone w płynną prozę — ale listy niosące faktycznie odrębne, gęste informacje (specyfikacja w tabeli, lista elementów na froncie aparatu, lista grup docelowych) zostały zachowane jako listy, bo tam wymuszanie prozy pogorszyłoby czytelność.
- Nagłówki sekcji zachowały styl pytający/opisowy tam, gdzie były naturalne („Czy Polaroid Mod ma sens?”), ale usunięto myślnikowe dopiski w nagłówkach typu „Polaroid Mod a Polaroid Now+ – gdzie jest różnica?” → „Polaroid Mod a Polaroid Now+: gdzie jest różnica”.
- **Nie każde zdjęcie dało się jednoznacznie przypisać do konkretnego trybu** (Split Shot, Double Exposure itd.) mimo posiadania materiałów prasowych — jedno zdjęcie (kobieta w szklanej butli, silnie stylizowane) zostało użyte z neutralnym podpisem „Przykładowa, mocno stylizowana odbitka” zamiast zgadywania, że to konkretnie przykład Split Shot. Ten sam nawyk co przy BPOTY: nie zgaduj etykiety, której nie potwierdza źródło.
- **PNG z przezroczystością (dwa zdjęcia produktowe z tego wpisu) nie trzeba konwertować do JPG** — na ciemnym motywie strony (`.post-body`) przezroczyste tło renderuje się dobrze samo z siebie jako „pływający” produkt na czarnym tle, bez potrzeby wypełniania białym/innym kolorem. `assets/images/blog/` już wcześniej miało precedens PNG (`wydarzenia-2025.png`), więc nie jest to nowy wzorzec.

### Lokalny podgląd wpisu przed publikacją

- Istnieje `.claude/launch.json` z konfiguracją `photoczarnik-static` (`npx serve public -l 4173`), ale **`mcp__Claude_Browser__preview_start` po nazwie potrafi zamiast tego podłączyć się do przypadkowego, niepowiązanego serwera dev z innego projektu w folderze nadrzędnym** (widziane jako serwer o nazwie „promptmaster” na porcie 3000) — to nie jest błąd tej strony, tylko myląca sesja narzędzia przeglądarki.
- **Niezawodny sposób podglądu:** odpalić statyczny serwer ręcznie przez Bash (`cd public && npx --yes serve . -l 5175 &`), sprawdzić `curl -sI http://localhost:5175/...` że działa, a potem `mcp__Claude_Browser__navigate` na ten konkretny URL zamiast polegać na `preview_start`.
- Panel przeglądarki bywa u Roberta zwinięty/ukryty mimo że sesja jest aktywna (`tabs_context` → `"Browser pane is currently hidden"`) — w takiej sytuacji warto dodatkowo podać mu wprost lokalny URL (`http://localhost:5175/...`) do otwarcia we własnej przeglądarce, bo on go nie zobaczy w panelu Claude Code.
- Po zatwierdzeniu wpisu i przed commitem: zamknąć lokalny serwer (`pkill -f "serve . -l 5175"`), bo nie jest częścią repo/deployu (`public/` jest w `.gitignore`, buduje je Netlify).

### Wzorzec: duży wpis konkursowy z researchem w sieci (od 2026-10-05, Nikon Comedy Wildlife Awards 2026)

Użytkownik podał folder (`Do strony/05.10.2026/`) z dwoma plikami `.md` (szkic i wersja `-full` z hotlinkami do zdjęć na Sky TG24) oraz 48 zdjęciami, i pozwolił „przeszukać net”. Wnioski:

- **Szkic `.md` zawierał błędy merytoryczne wykryte dopiero po zestawieniu ze zdjęciami i źródłami** (np. „Doris with her hat” opisany jako dzik, a to bawół wodny ze Sri Lanki; „Ballet Dancer” jako „ptak”, a to krogulec). Przy wpisach z tekstem wygenerowanym przez AI **obejrzyj zdjęcie i sprawdź opis w 2–3 niezależnych źródłach** (oficjalna strona konkursu bywa za 403 dla WebFetch, ale 121Clicks, Photography Talk, Upworthy i Colossal dają tytuły, kraje, gatunki i miejsca). Informacji, której nie potwierdza żadne źródło (tu: „część dochodów idzie na ochronę przyrody”), nie wpisuj.
- **Tytuł jednego zdjęcia bywa różny w różnych źródłach** (Fotopolis vs oficjalne materiały: „When you spot your blind date…” / „I can't see you”). Użyj wersji z polskiego źródła zgodnej z nazwą pliku i wspomnij drugą w tekście.
- **Nazwa pliku w folderze zawiera tytuł i autora** (`262769-CliffFawcett_...jpg`) — wystarczyło to do dopasowania prawie wszystkich zdjęć bez zgadywania. Zdublowany plik (`... (1).jpg`) sprawdź przez `md5`, zanim go pominiesz.
- **Hurtowe zmniejszanie zdjęć**: oryginały miały 117 MB (do 7912 px). Pętla `sips -Z 1400 -s format jpeg -s formatOptions 72` zbiła 47 zdjęć do 13 MB — dla galerii >20 zdjęć rób to zawsze. Do podglądu w czacie (`Read`) osobno zrób miniatury 1000 px do `/private/tmp/...`, żeby nie wczytywać wielkich plików.
- **Przy dużych galeriach struktura: kilka wyróżnionych kadrów z krótką prozą → sekcja „Polacy w finale” → reszta jako lista zdjęć z podpisem w jednej linii** (tytuł — autor (kraj), gatunek). Okładka = zdjęcie z wyróżnionych, bez powtarzania go w treści.
- **Prawa do zdjęć**: oficjalna strona finalistów ma napis „images are for viewing only and must not be copied”. Użytkownik został o tym poinformowany przed publikacją i zaakceptował (podpisy autorów + zbiorcze zastrzeżenie na końcu, jak w poprzednich wpisach konkursowych). Za każdym razem, gdy źródło ma taki zakaz, powiedz o tym wprost przed publikacją.

## Mod Claude Code „blog-release-desk” (od 2026-10-06)

Mod (plugin z function hooks) pilnujący publikacji wpisów. Powstał na podstawie analizy logów sesji (6 wpisów w 4 tygodnie, 46 pushy, 36 `pkill` serwera podglądu, 26 ręcznych odpytań Netlify, 4 razy „nie widzę podglądu / nie mam linku”).

- **Lokalizacja (poza repo strony, nie jest w gicie):** `/Users/robertczarnik/.claude/dev-mods/46577d3c-87cb-4466-8f2c-b0b89ac16c13/blog-release-desk/` — folder jest związany z ID sesji, w której mod powstał. W kolejnych sesjach nie ma gwarancji, że załaduje się sam; trwałe ładowanie: `claude --plugin-dir <ścieżka>` albo zmienna `CLAUDE_CODE_PLUGIN_DIRS`. Jeśli kiedyś mod „zniknie”, najpierw sprawdź to, a nie pisz go od nowa.
- **Pliki:** `hooks/register.tsx` (hooki i panel), `hooks/lib.ts` (czysta logika kontroli, testowana), `types/index.d.ts` (kontrakt stanu), `tests/lib.test.ts` (6 testów), `.claude-plugin/plugin.json` (z `userConfig`: `projectDir`, `previewPort` = 5175, `siteUrl`).
- **Bramka publikacji (ważne dla mnie jako Claude):** hook `tool.call` na `Bash` łapie `git push` w tym repo, gdy są zmiany w `content/blog` lub `assets/images/blog` (niezacommitowane albo jeszcze niewypchnięte). Zamiast puścić push, **odrzuca go, otwiera panel i dostaję `deny`: wtedy NIE ponawiam pusha**, tylko piszę użytkownikowi, że czekam na przycisk „Publikuj”. Po jego naciśnięciu mod sam wysyła mi wiadomość „użytkownik zatwierdził wpis … wykonaj git add, commit i push” i dopiero wtedy robię commit i push. Zatwierdzenie dotyczy dokładnie tego stanu plików; po jakiejkolwiek zmianie bramka zadziała od nowa. Błędy (✖) blokują przycisk i są w tekście `deny` — naprawiam je, buduję ponownie i próbuję jeszcze raz. Pushe samego CLAUDE.md lub innych repo bramki nie uruchamiają.
- **Kontrole przy bramce:** błędy: brak pola frontmattera (title/date/excerpt/cover), brak pliku zdjęcia, hotlink do zdjęcia z zewnątrz, `citehttps://`, placeholdery. Ostrzeżenia: nieużywane pliki w `assets/images/blog`, zdjęcie >1,5 MB, okładka powtórzona w treści, linia „12. …” zamieniająca się w listę numerowaną, build starszy niż wpis. Panel pokazuje też podział tytułu na linie (`|`) do zatwierdzenia.
- **Po pushu:** mod co 15 s sprawdza adres produkcyjny nowego wpisu i pokazuje toast „✔ Na żywo” (po 12 min bez odpowiedzi ostrzega). Dla edycji istniejącego wpisu tylko informuje o wypchnięciu — nie ma jak odróżnić nowego deploya, więc status Netlify nadal sprawdzam przez MCP (`get-project`).
- **Komendy:** `/preview` (uruchamia serwer w `public/`, czeka aż odpowie, podaje link do najnowszego wpisu; `/preview nazwa-wpisu`, `/preview stop`), `/release` (panel bramki na żądanie). Status line pokazuje stale „Blog Desk ○ podgląd wył.” albo „● podgląd :5175”. Serwer uruchomiony przez mod jest zatrzymywany na końcu sesji. **To zastępuje ręczne `nohup npx serve` / `pkill` opisane w sekcji o podglądzie wpisu** (te instrukcje zostają jako plan B, gdy mod nie jest załadowany).
- **Pułapki przy edycji moda** (poznane przy budowie): (1) walidator pozwala przekazać `$` tylko do funkcji zadeklarowanych na górnym poziomie pliku modułu, nie do domknięć w `register` — dlatego helpery są top-level z parametrem `cfg`; (2) `claude` z PATH to 2.1.259 i **odrzuca `session.end` oraz nie obsługuje modów** — walidację/testy odpalaj binarką silnika sesji: `~/Library/Application Support/Claude/claude-code/<wersja>/*/claude.app/Contents/MacOS/claude plugin validate|test <folder>` (wersja = ta z `$.session.version()`/ścieżki skilla `plugin-authoring`); (3) typy sprawdzisz `tsc -p` z tsconfigiem spoza folderu moda (`strict`, `noUncheckedIndexedAccess`, `jsx: react`, `jsxFactory: h`, `paths` na plik `claude-code.d.ts` skilla); (4) zdarzenie `ui.render` panelu ma `requestId` = id panelu (`blog-release-desk`); (5) mod bez stałego elementu na ekranie wygląda jak niezaładowany — dlatego jest stały wpis w status line.
- **Sprawdzone w praktyce (2026-10-07, wpis Imaging World):** `git push` został odrzucony z komunikatem bramki, panel się otworzył, po przycisku „Publikuj” dostałem wiadomość od moda („wykonaj git add, commit i push”) i push przeszedł. **Gdy użytkownik napisze w czacie „publikuj”, i tak najpierw próbuję zwykłego pusha** — to bramka prosi o przycisk; nie omijam jej (np. przez `git -C` albo push bez frazy `git push`). Do potwierdzenia: toast „✔ Na żywo” po deployu (strona zaczęła zwracać 200 po ok. 20–40 s od pusha; Netlify `get-project` pokazuje `ready` także dla poprzedniego deploya, więc **status wpisu sprawdzaj `curl -sL -w %{http_code}` na adresie wpisu**, a nie samym `get-project`).

### Wzorzec: wpis informacyjny z dodatkowym sprawdzeniem źródeł (od 2026-10-07, Imaging World)

Użytkownik podał tylko jeden plik `.md` (szkic z AI, z hotlinkami do zdjęć Koelnmesse) i 4 zdjęcia, z poleceniem „sprawdź dodatkowe źródła”. Przebieg i wnioski:

- **Zestawiaj szkic z 4–6 niezależnymi źródłami** (Fotopolis, branżowe serwisy niemieckie photoscala/profifoto, CineD, oficjalne strony organizatorów i Photokiny). Dopisuj fakty, których brakowało (tło historyczne, liczby z poprzednich edycji, cytaty z nazwiskami), ale **tylko te potwierdzone w co najmniej jednym źródle**; przy liczbach spoza komunikatu organizatorów podawaj, kto je podaje („według CineD”, „według własnych danych Koelnmesse”).
- **Tytuły stanowisk w źródłach bywają różne** (ten sam człowiek raz „dyrektor operacyjny”, raz „CEO”) — używaj neutralnego „z Koelnmesse” / „szef RINGFOTO”, bez wymyślania tytułu.
- **Autorstwa zdjęć nie zgaduj**: zdjęcia z folderu miały nazwy-skróty (`...koelnmesse_06_025.jpg`, plik jak hash IPFS), a w szkicu nazwiska fotografów dotyczyły innych zdjęć niż te w folderze. Podpisy: „Fot. Koelnmesse” / „Fot. materiały prasowe” / „Zdjęcie z materiałów Fotopolis.pl”; na zdjęciu z dwiema osobami nie opisuj, kto jest po której stronie, jeśli źródło tego nie mówi.
- **Zdjęcia mniejsze niż 1400 px kopiuj bez `sips -Z`** (nie powiększaj); większe zmniejsz `sips -Z 1400 -s format jpeg -s formatOptions 78`.
- Fragmenty szkicu w pierwszej osobie („Moim zdaniem…”) zostają jako głos autora bloga, ale warto o nich wspomnieć użytkownikowi przy akceptacji.

