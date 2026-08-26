# PhotoCzarnik — portfolio fotografii i podróży

Statyczna strona portfolio zbudowana własnym, lekkim generatorem stron (bez frameworków frontendowych, bez bazy danych). Treść trzymana jest jako pliki w repozytorium — edytujesz plik, budujesz stronę, wypychasz na GitHub, a Netlify sam publikuje nową wersję.

## Struktura

```
content/
  site.json           ← nazwa strony, autor, e-mail, social media
  pages/               ← treść stron: home.md, about.md, contact.md
  blog/                ← wpisy blogowe (jeden plik .md = jeden wpis)
  gallery.json         ← zdjęcia do portfolio (kategorie, podpisy, adresy plików)
  gear-timeline.json   ← oś czasu sprzętu na stronie „O mnie” (rok, kategoria, opis, cytat, pełny opis)
assets/
  css/                 ← main.css (tokeny/reset), components.css (komponenty), animations.css (animacje)
  js/                  ← core.js (nav), animations.js (reveal/parallax), gallery.js (lightbox/tilt/filtry/karuzela), timeline.js (rozwijanie osi czasu)
  images/
    brand/logo.png     ← logo w nawigacji (też źródło faviconu — favicon-32.png, favicon-16.png, apple-touch-icon.png w tym samym katalogu, wygenerowane z logo.png przez `sips`, podpięte w `layout()` w templates.js)
    hero/               ← zdjęcie hero na stronie głównej
    portrait/           ← portret autora (strona główna + „O mnie”)
    blog/                ← okładki wpisów blogowych
    gallery/krajobraz/  ← 18 realnych zdjęć krajobrazowych (Chorwacja, Czechy, Polska)
build/
  build.js             ← generator: content/ + assets/ → public/
  templates.js          ← szablony HTML (nawigacja, karty, lightbox, formularz, oś czasu, `carousel()`)
public/                ← WYGENEROWANE — nie edytuj ręcznie, nie jest w repo (.gitignore)
```

## Ważne: dwa różne układy galerii — Portfolio to Masonry, „Wybrane kadry” to karuzela

Strona Portfolio (`/portfolio.html`) i sekcja „Wybrane kadry” na stronie głównej **celowo używają różnych układów** — to nie przeoczenie, tylko świadoma decyzja z 2026-08-23.

- **Portfolio** — `.gallery-grid--masonry`, renderowana przez `masonryGrid()` w `templates.js`. Pionowa siatka wielokolumnowa (CSS `column-count`, 1→4 kolumn w zależności od szerokości ekranu), zdjęcia w naturalnych proporcjach (`aspect-ratio: auto`), bez strzałek/przewijania w bok.
- **„Wybrane kadry” (strona główna)** — `.gallery-grid` bez modyfikatora, wciąż **pozioma, ręcznie przewijana karuzela** (`display:flex`, `overflow-x:auto`, `scroll-snap-type`), renderowana przez `carousel()`, który owija `galleryItem()` w `.carousel` z przyciskami strzałek (`[data-carousel-prev/next]`). Logika przewijania i wyłączania strzałek na krańcach jest w `gallery.js`.

Obie używają tego samego `galleryItem()` i tych samych danych z `gallery.json` — różni je tylko wrapper i klasa CSS. Filtry kategorii na Portfolio nadal działają tak samo (pokazują/ukrywają elementy przez `display:none`); reset przewijania (`grid.scrollTo`) i `updateArrows()` w `gallery.js` uruchamiają się tylko, gdy element jest częścią karuzeli (`grid.closest('.carousel')`), więc na Portfolio są pomijane.

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

- **`content/gallery.json`** — kategoria „Dron" (5 zdjęć) to nadal placeholdery z `picsum.photos`. Do podmiany, gdy użytkownik dostarczy zdjęcia z drona (ten sam proces co „Krajobraz" — patrz niżej).
- **`content/site.json`** — pole `email` to nadal placeholder (`kontakt@twoja-domena.pl`) — podmienić na realny adres.
- Reszta (autor, social media, logo, hero, portret, 5 wpisów blogowych, oś czasu sprzętu, 18 zdjęć kategorii „Krajobraz") jest już uzupełniona realną treścią.

## Wzorzec: dodawanie realnych zdjęć do galerii z podpisami lokalizacji

Tak przeniesiono placeholdery „Krajobraz" na realne zdjęcia (18 plików z `Pictures/poprawione zdjecia/landscape/`) — ten sam proces zadziała dla „Dron":

1. Skopiuj pliki do `assets/images/gallery/<kategoria>/` z czystymi nazwami (`krajobraz-01.jpg` itd.).
2. Sprawdź datę wykonania przez `mdls -name kMDItemContentCreationDate -name kMDItemLatitude -name kMDItemLongitude plik.jpg` — czasem jest GPS, co pomaga zgadnąć lokalizację.
3. Użytkownik nie zna zdjęć po samych nazwach plików — zbuduj tymczasową stronę podglądową (siatka `<img>` + numer + data) i skopiuj ją do `public/` (np. `public/podglad-<kategoria>.html`, ścieżki obrazków jako `/assets/images/...`), żeby otworzył ją pod `http://localhost:4173/...` i sczytał numery.
4. Poproś o lokalizacje per numer zdjęcia w czacie, zaktualizuj `alt`/`caption` w `gallery.json`.
5. Usuń plik podglądowy z `public/` (i tak zniknie przy kolejnym `npm run build`, bo `build()` czyści cały katalog).

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
