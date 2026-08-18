# Wanderlens — portfolio fotografii i podróży

Statyczna strona portfolio zbudowana własnym, lekkim generatorem stron (bez frameworków frontendowych, bez bazy danych). Treść trzymana jest jako pliki w repozytorium — edytujesz plik, budujesz stronę, wypychasz na GitHub, a Netlify sam publikuje nową wersję.

## Struktura

```
content/
  site.json        ← nazwa strony, autor, e-mail, social media
  pages/            ← treść stron: home.md, about.md, contact.md
  blog/             ← wpisy blogowe (jeden plik .md = jeden wpis)
  gallery.json      ← zdjęcia do portfolio (kategorie, podpisy, adresy plików)
assets/             ← CSS, JS, obrazy — kopiowane 1:1 do public/
build/
  build.js          ← generator: content/ + assets/ → public/
  templates.js       ← szablony HTML (nawigacja, karty, lightbox, formularz)
public/             ← WYGENEROWANE — nie edytuj ręcznie, nie jest w repo (.gitignore)
```

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

Nowe zdjęcia do portfolio dodaje się jako wpis w `content/gallery.json`.

Po każdej zmianie treści:

```bash
npm run build   # generuje public/ z aktualnej treści
npm run dev     # buduje i uruchamia podgląd lokalnie na http://localhost:4173
```

Gdy zmiana wygląda dobrze — commit i push na GitHub. Netlify sam wykryje push, uruchomi `npm run build` i opublikuje nową wersję (patrz `netlify.toml`).

## Placeholder — do zrobienia przed publikacją

- `content/site.json` — podmień `author`, `email`, linki social media
- Wszystkie zdjęcia obecnie pochodzą z `picsum.photos` (losowe zdjęcia zastępcze) — podmień na własne w `content/gallery.json` i w plikach `content/blog/*.md` (pole `cover`)
- Teksty w `content/pages/about.md` i wpisach blogowych są przykładowe — do podmiany na własne

## Połączenie z GitHub i Netlify (jednorazowo, ręcznie)

1. Załóż puste repozytorium na GitHub (bez README/licencji, żeby uniknąć konfliktów).
2. Podepnij lokalne repo i wypchnij:
   ```bash
   git remote add origin <adres-twojego-repo-na-githubie>
   git push -u origin main
   ```
3. Wejdź na [netlify.com](https://netlify.com), zaloguj się, wybierz „Add new site → Import an existing project” i wskaż to repozytorium GitHub.
4. Netlify sam wykryje ustawienia z `netlify.toml` (`npm run build`, katalog `public`) — potwierdź i wdróż.
5. Od tego momentu każdy `git push` na branch główny automatycznie aktualizuje żywą stronę.

## Formularz kontaktowy

Formularz na stronie Kontakt korzysta z Netlify Forms (`data-netlify="true"`) — nie wymaga własnego backendu. Zgłoszenia znajdziesz w panelu Netlify → Forms. Można tam też włączyć powiadomienia e-mail o nowych wiadomościach.
