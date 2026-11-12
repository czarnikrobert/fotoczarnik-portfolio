# PhotoCzarnik — portfolio fotografii i podróży

Statyczna strona portfolio zbudowana własnym, lekkim generatorem stron (bez frameworków frontendowych, bez bazy danych). Treść trzymana jest jako pliki w repozytorium — edytujesz plik, budujesz stronę, wypychasz na GitHub, a GitHub Actions buduje stronę i wysyła ją na serwer Hostingera.

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

Gdy zmiana wygląda dobrze — commit i push na GitHub. Workflow `.github/workflows/deploy-hostinger.yml` uruchomi `npm run build` i wyśle `public/` na serwer przez rsync (ok. 1 minuty).

## Placeholder — do zrobienia przed publikacją

- `content/site.json` — podmień `author`, `email`, linki social media
- Wszystkie zdjęcia obecnie pochodzą z `picsum.photos` (losowe zdjęcia zastępcze) — podmień na własne w `content/gallery.json` i w plikach `content/blog/*.md` (pole `cover`)
- Teksty w `content/pages/about.md` i wpisach blogowych są przykładowe — do podmiany na własne

## Hosting: Hostinger + GitHub Actions

- Strona leży na Hostingerze w `domains/photoczarnik.pl/public_html` (LiteSpeed, `.htaccess`, PHP).
- Każdy push na `main` uruchamia `.github/workflows/deploy-hostinger.yml`: build i `rsync --delete` przez SSH. Sekrety repozytorium: `HOSTINGER_SSH_KEY`, `HOSTINGER_HOST`, `HOSTINGER_USER`.
- Konfiguracja serwera (adresy bez `.html`, strona 404, krótki cache, przekierowanie z `www`) jest w `hosting/.htaccess`; `build.js` kopiuje ją do `public/`.
- Domena jest w home.pl i tam zostają serwery nazw. Rekordy: A `@` → IP serwera Hostingera, CNAME `www` → `photoczarnik.pl`, TXT z SPF Hostingera. Certyfikat SSL (Let's Encrypt) wystawia i odnawia Hostinger.

## Formularz kontaktowy

Formularz na stronie Kontakt wysyła dane do `hosting/kontakt.php` (kopiowany do `public/`). Skrypt sprawdza pola i pułapkę na boty (`company`), wysyła e-mail funkcją `mail()` i przekierowuje na `/thanks.html` albo z błędem na `/contact?blad=1`. Adresy odbiorcy i nadawcy są w `~/kontakt-config.php` na serwerze, poza repozytorium.
