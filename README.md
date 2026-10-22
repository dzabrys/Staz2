# Wielkie Gry Planszowe — Staz2

Nowa wersja strony, oddzielona od Staz1. Aktualne strony bez numeru 1, obrazy WebP, formularz krok po kroku i wspólna stopka.

GitHub Pages: folder docs, gałąź main.

Lokalnie: npm start. Opcjonalne klucze Turnstile w .env.local (nigdy w Git). GitHub Pages jest hostingiem statycznym; prawdziwa weryfikacja Turnstile wymaga osobnego backendu.

## CAPTCHA po publikacji

GitHub Pages udostępnia statyczne pliki z `docs/`. Weryfikację Turnstile obsługuje osobny Worker: `backend/worker.mjs`.

W prywatnym pliku konfiguracyjnym poza repozytorium ustaw `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (szablon Edit Cloudflare Workers), `TURNSTILE_SITEKEY` i `TURNSTILE_SECRET_KEY`. Nie zapisuj sekretów w kodzie ani w katalogu docs.

Dodaj `dzabrys.github.io` do dozwolonych hostname widgetu Turnstile. Następnie wykonaj `node tools/deploy-captcha.cjs <ścieżka-do-prywatnego-pliku-env>`. Skrypt wdroży Worker, ustawi sekret i wpisze publiczny adres backendu do kontakt.html. Zacommituj zmieniony kontakt.html i wypchnij do main.

Testy backendu: `node backend/worker.test.mjs`. Limit prób jest lokalny dla instancji Workera; nie stanowi globalnego limitu otrzymanych e-maili. Strona przygotowuje wiadomość w poczcie użytkownika, a użytkownik sam potwierdza wysłanie.


Strona: https://dzabrys.github.io/Staz2/
Backend CAPTCHA: https://staz2-captcha.dzabrys-staz2.workers.dev/
Kod i sekret zostały wdrożone do Cloudflare; sekret pozostaje poza repozytorium.

## Optymalizacja strony głównej

Po `npm install` uruchom `npm run optimize:home` po zmianie HTML strony głównej, jej stylów lub klas dodawanych przez JavaScript. Skrypt zachowuje kolejność siedmiu źródłowych arkuszy CSS, usuwa reguły wymagające klas nieobecnych na tej stronie i w skryptach, osadza kompletny CSS w HTML oraz generuje warianty AVIF/WebP głównego zdjęcia. Mobilny kadr zachowuje ustawienie `object-position:70% center`. Wspólne źródłowe arkusze pozostają dostępne dla pozostałych podstron.

`npm run check:home` sprawdza odnośniki, zasoby, ścieżki fontów w osadzonym CSS, rozmiary srcset oraz kolejność odczytów i animacji. Nie zastępuje wizualnego sprawdzenia strony ani ponownego testu PageSpeed na telefonie. Nagłówkiem Cache-Control zarządza GitHub Pages.
