# FotoCzarnik — portfolio fotografii i podróży

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
    brand/logo.png     ← logo w nawigacji
    hero/               ← zdjęcie hero na stronie głównej
    portrait/           ← portret autora (strona główna + „O mnie”)
    blog/                ← okładki wpisów blogowych
    gallery/krajobraz/  ← 18 realnych zdjęć krajobrazowych (Chorwacja, Czechy, Polska)
build/
  build.js             ← generator: content/ + assets/ → public/
  templates.js          ← szablony HTML (nawigacja, karty, lightbox, formularz, oś czasu, `carousel()`)
public/                ← WYGENEROWANE — nie edytuj ręcznie, nie jest w repo (.gitignore)
```

## Ważne: portfolio to karuzela, nie siatka

`.gallery-grid` (strona Portfolio + sekcja „Wybrane kadry” na stronie głównej) to **pozioma, ręcznie przewijana karuzela** (`display:flex`, `overflow-x:auto`, `scroll-snap-type`), nie CSS Grid — użytkownik świadomie o to poprosił. Renderowana jest przez `carousel()` w `templates.js`, który owija `galleryItem()` w `.carousel` z przyciskami strzałek (`[data-carousel-prev/next]`). Logika przewijania i wyłączania strzałek na krańcach jest w `gallery.js`. Filtry kategorii nadal działają — pokazują/ukrywają elementy przez `display:none` i resetują scroll do zera.

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

## Połączenie z GitHub i Netlify (jednorazowo, ręcznie)

1. Załóż puste repozytorium na GitHub (bez README/licencji, żeby uniknąć konfliktów).
2. Podepnij lokalne repo i wypchnij:
   ```bash
   git remote add origin <adres-twojego-repo-na-githubie>
   git push -u origin main
   ```
3. Wejdź na [netlify.com](https://netlify.com), zaloguj się, wybierz „Add new site → Import an existing project" i wskaż to repozytorium GitHub.
4. Netlify sam wykryje ustawienia z `netlify.toml` (`npm run build`, katalog `public`) — potwierdź i wdróż.
5. Od tego momentu każdy `git push` na branch główny automatycznie aktualizuje żywą stronę.

## Formularz kontaktowy

Formularz na stronie Kontakt korzysta z Netlify Forms (`data-netlify="true"`) — nie wymaga własnego backendu. Zgłoszenia znajdziesz w panelu Netlify → Forms. Można tam też włączyć powiadomienia e-mail o nowych wiadomościach.

## Blog — migracja treści

5 wpisów w `content/blog/` zostało przeniesionych z fotoczarnik.pl/blog/ (pełna, dosłowna treść wyciągnięta bezpośrednio z HTML, nie streszczona). Okładki pobrane i zapisane lokalnie w `assets/images/blog/`. Oryginalne dwa przykładowe wpisy (Islandia, Hanoi) zostały usunięte.
