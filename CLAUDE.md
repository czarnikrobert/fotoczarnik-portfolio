# PhotoCzarnik — portfolio fotografii i podróży

Statyczna strona portfolio zbudowana własnym, lekkim generatorem stron (bez frameworków frontendowych, bez bazy danych). Treść trzymana jest jako pliki w repozytorium — edytujesz plik, budujesz stronę, wypychasz na GitHub, a Netlify sam publikuje nową wersję.

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
  - **Status praw autorskich zdjęć — ważne, nie kopiuj tego wzorca bez zastanowienia gdzie indziej**: użytkownik przysłał 3 zdjęcia opisane jako „moje aparaty”, ale EXIF ujawnił, że to zdjęcia poglądowe modeli, nie fotografie jego fizycznych egzemplarzy. Sprawdzono źródła: **Pentacon Six TL** — potwierdzone jako Ansgar Koreng, Wikimedia Commons, CC BY-SA 3.0 DE (plik `1803101902,_ako.jpg`) → ma pole `"credit"` w JSON, renderowane jako `.gear-card__credit` pod zdjęciem (wymóg licencji). **Pentax ME Super** i **Yashica Electro 35** — źródła nieustalone mimo próby (EXIF miał tylko generyczny „Copyright 2012” bez nazwiska / brak danych), wygląda na fotografię z serwisu ogłoszeniowego/aukcyjnego, nie na wolną licencję. Użytkownik świadomie zaakceptował ryzyko i poprosił o publikację mimo to, bez przypisania — **to jego decyzja, nie moje założenie o legalności**. Jeśli w przyszłości będzie pytanie o status prawny tych dwóch zdjęć, to jest odpowiedź.
- `content/analog-gallery.json` — 6 zdjęć-placeholderów (`picsum.photos`), ten sam format co `gallery.json`, renderowane przez istniejący `masonryGrid()` (dokładnie ten sam komponent co Portfolio — filtr kategorii pominięty, bo tu jest tylko jedna kategoria). **To wciąż placeholdery** — do podmiany, gdy użytkownik dostarczy realne zdjęcia zrobione na filmie (ten sam wzorzec co „Dron”, patrz „Wzorzec: dodawanie realnych zdjęć do galerii”, ale bez lokalizacji/GPS przy kartach sprzętu — to nie zdjęcia z podróży).

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

## Formularz kontaktowy — skonfigurowany i przetestowany

Formularz na stronie Kontakt korzysta z Netlify Forms (`data-netlify="true"`) — nie wymaga własnego backendu. Zgłoszenia widoczne w panelu Netlify → Forms.

- **Powiadomienia e-mail idą na `fotoczarnik@gmail.com`** — skonfigurowane w panelu Netlify (Project configuration → Forms → Form submission notifications), nie w kodzie. To ustawienie nie jest częścią repo/gita.
- Pole `email` w `content/site.json` **nie jest** z tym powiązane — nigdzie w szablonach nieużywane (martwe pole, zarezerwowane na przyszłość, np. mailto na stronie).
- **Ważne dla Netlify Forms:** samo `data-netlify="true"` w HTML nie wystarcza — funkcja „Forms” musi być włączona per-projekt na Netlify (`update-forms` w MCP albo w panelu), a formularz zostaje zarejestrowany dopiero przy **kolejnym buildzie po włączeniu**. Jeśli formularz kiedyś „zniknie” z panelu Forms (0 formularzy), sprawdź czy funkcja jest enabled i zrób pusty commit (`git commit --allow-empty`), żeby wymusić nowy build.
- Test end-to-end wykonany 2026-08-21 przez realne wysłanie formularza na żywej stronie — działa poprawnie (przekierowanie na `/thanks.html`, zgłoszenie zarejestrowane w Netlify).

## Blog — migracja treści

5 wpisów w `content/blog/` zostało przeniesionych z fotoczarnik.pl/blog/ (pełna, dosłowna treść wyciągnięta bezpośrednio z HTML, nie streszczona). Okładki pobrane i zapisane lokalnie w `assets/images/blog/`. Oryginalne dwa przykładowe wpisy (Islandia, Hanoi) zostały usunięte.
