# Wielkie Gry Planszowe — Staz2

Nowa wersja strony, oddzielona od Staz1. Aktualne strony bez numeru 1, obrazy WebP, formularz krok po kroku i wspólna stopka.

GitHub Pages: folder docs, gałąź main.

Lokalnie: npm start. Opcjonalne klucze Turnstile w .env.local (nigdy w Git). GitHub Pages jest hostingiem statycznym; prawdziwa weryfikacja Turnstile wymaga osobnego backendu.

## CAPTCHA po publikacji

GitHub Pages udostępnia statyczne pliki z `docs/`. Weryfikację Turnstile obsługuje osobny Worker: `backend/worker.mjs`.

W prywatnym pliku konfiguracyjnym poza repozytorium ustaw `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (szablon Edit Cloudflare Workers), `TURNSTILE_SITEKEY` i `TURNSTILE_SECRET_KEY`. Nie zapisuj sekretów w kodzie ani w katalogu docs.

Dodaj `dzabrys.github.io` do dozwolonych hostname widgetu Turnstile. Następnie wykonaj `node tools/deploy-captcha.cjs <ścieżka-do-prywatnego-pliku-env>`. Skrypt wdroży Worker, ustawi sekret i wpisze publiczny adres backendu do kontakt.html. Zacommituj zmieniony kontakt.html i wypchnij do main.

Testy backendu: `node backend/worker.test.mjs`. Limit prób jest lokalny dla instancji Workera; nie stanowi globalnego limitu otrzymanych e-maili. Strona przygotowuje wiadomość w poczcie użytkownika, a użytkownik sam potwierdza wysłanie.
