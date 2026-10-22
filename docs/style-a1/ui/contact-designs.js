(() => {
  const init = () => {
    const form = document.querySelector('form[data-contact-design]');
    if (!form) return;
    const fields = [...form.querySelectorAll('input, select, textarea')];
    const panels = [...form.querySelectorAll('[data-contact-step]')];
    const stepLinks = [...form.querySelectorAll('[data-go-step]')];
    const next = form.querySelector('[data-step-next]');
    const back = form.querySelector('[data-step-back]');
    const submit = form.querySelector('[type="submit"]');
    const status = form.querySelector('.contact-form-status');
    const context = form.querySelector('.contact-context');
    const guide = document.querySelector('.contact-guide-disclosure');
    let step = 0;

    const value = name => {
      const field = form.elements.namedItem(name);
      if (!field) return '';
      return String(field.value || '').trim();
    };
    const showStep = (index, focus = true) => {
      if (!panels.length) return;
      step = Math.max(0, Math.min(index, panels.length - 1));
      panels.forEach((panel, i) => { panel.hidden = i !== step; });
      stepLinks.forEach((button, i) => {
        if (i === step) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
        button.dataset.complete = String(i < step);
      });
      back.hidden = step === 0;
      next.hidden = step === panels.length - 1;
      submit.hidden = step !== panels.length - 1;
      form.querySelector('[data-step-caption]').textContent = `Krok ${step + 1} z ${panels.length}`;
      if (focus) panels[step].querySelector('h3').focus();
      if (step === panels.length - 1) initCaptcha();
    };
    const errorFor = field => field.id && document.getElementById(`${field.id}-error`);
    const clearError = field => {
      field.removeAttribute('aria-invalid');
      const error = errorFor(field);
      if (error) { error.hidden = true; error.textContent = ''; }
    };
    const validateField = field => {
      field.setCustomValidity('');
      if (field.required && !['radio', 'checkbox'].includes(field.type) && field.value && !field.value.trim()) {
        field.setCustomValidity('Wpisz treść, nie tylko spacje.');
      }
      const valid = field.validity.valid;
      const error = errorFor(field);
      if (valid) clearError(field);
      else {
        field.setAttribute('aria-invalid', 'true');
        if (error) {
          error.textContent = field.validity.customError ? 'Wpisz treść, nie tylko spacje.'
            : field.validity.valueMissing ? ({ name: 'Wpisz swoje imię.', nazwisko: 'Wpisz swoje nazwisko.', organizacja: 'Podaj nazwę firmy, szkoły lub instytucji.', email: 'Podaj adres e-mail.', message: 'Napisz kilka słów o swoim zapytaniu.' }[field.name] || 'Uzupełnij to pole.')
              : field.type === 'email' ? 'Wpisz poprawny adres e-mail, np. imie@firma.pl.' : 'Sprawdź wpisaną wartość.';
          error.hidden = false;
        }
      }
      return valid;
    };
    const validate = container => {
      const invalid = [...container.querySelectorAll('input, select, textarea')].filter(field => !field.disabled && !validateField(field));
      if (!invalid.length) return true;
      const panel = invalid[0].closest('[data-contact-step]');
      if (panel) showStep(panels.indexOf(panel), false);
      invalid[0].focus();
      invalid[0].reportValidity();
      return false;
    };
    const updateSummary = () => {
      const selected = value('gra') || value('rodzaj_zapytania');
      if (context) {
        context.hidden = !selected;
        context.textContent = selected ? `Zapytanie o: ${selected}` : '';
      }
      const data = {
        person: [value('name'), value('nazwisko')].filter(Boolean).join(' ') || 'Uzupełnij dane kontaktowe',
        organization: value('organizacja') || 'Nie podano',
        contact: [value('email'), value('telefon')].filter(Boolean).join('\n') || 'Podaj adres e-mail',
        kind: value('rodzaj_zapytania') || 'Do ustalenia',
        game: value('gra') || 'Wybierzemy wspólnie',
        group: value('grupa') || 'Do ustalenia',
        place: value('miejsce') || 'Do ustalenia',
        date: value('termin') ? value('termin').split('-').reverse().join('.') : 'Do ustalenia',
        extras: [...form.querySelectorAll('[name="dodatki"]:checked')].map(field => field.value).join(', ') || 'Brak dodatkowych opcji',
        quantity: value('liczba_egzemplarzy') || 'Do ustalenia',
        format: value('format') || 'Do ustalenia',
        message: value('message') || 'Uzupełnij wiadomość w szczegółach',
      };
      form.querySelectorAll('[data-summary]').forEach(node => { node.textContent = data[node.dataset.summary] || ''; });
      const subjectPreview = form.querySelector('[data-mail-preview-subject]');
      if (subjectPreview) subjectPreview.textContent = emailSubject();
    };
    const query = new URLSearchParams(location.search);
    const game = form.elements.namedItem('gra');
    if (query.get('temat') && game) game.value = query.get('temat').slice(0, 180);
    if (query.get('rodzaj') === 'custom') {
      const option = form.querySelector('[name="rodzaj_zapytania"][value="Gra na zamówienie"]');
      if (option) option.checked = true;
    }
    document.querySelectorAll('.contact-view-picker a').forEach(link => {
      const url = new URL(link.href);
      for (const key of ['temat', 'rodzaj']) if (query.has(key)) url.searchParams.set(key, query.get(key));
      link.href = url.href;
    });
    if (guide && typeof matchMedia === 'function') {
      const compact = matchMedia('(max-width:620px)');
      const adapt = () => { guide.open = !compact.matches; };
      adapt();
      compact.addEventListener?.('change', adapt);
    }
    for (const field of fields) {
      field.addEventListener('input', () => {
        field.setCustomValidity('');
        if (field.hasAttribute('aria-invalid')) validateField(field);
        updateSummary();
      });
      field.addEventListener('change', updateSummary);
    }
    if (panels.length) {
      form.querySelector('.contact-steps').hidden = false;
      form.querySelector('.contact-step-actions').hidden = false;
      form.querySelector('.contact-fallback-actions').hidden = true;
      form.querySelector('[data-step-caption]').hidden = false;
      showStep(0, false);
      next.addEventListener('click', () => { if (validate(panels[step])) showStep(step + 1); });
      back.addEventListener('click', () => showStep(step - 1));
      stepLinks.forEach(button => button.addEventListener('click', () => {
        const target = Number(button.dataset.goStep);
        if (target <= step) return showStep(target);
        for (let i = 0; i < target; i++) if (!validate(panels[i])) return;
        showStep(target);
      }));
      form.querySelector('[data-edit-details]').addEventListener('click', () => showStep(0));
    }
    updateSummary();
    const recipient = 'aleks.chamerski3@gmail.com';
    const provider = form.querySelector('[data-mail-provider]');
    const help = form.querySelector('[data-mail-help]');
    const manual = form.querySelector('[data-mail-manual]');
    const copyButton = form.querySelector('[data-copy-mail]');
    const captchaStatus = form.querySelector('[data-captcha-status]');
    const captchaApiBase = document.querySelector('meta[name="contact-api-base"]')?.content || new URL('./', location.href).href;
    const captchaEndpoint = route => new URL(route, captchaApiBase).href;
    const captchaRetry = form.querySelector('[data-captcha-retry]');
    let captchaStarted = false;
    let widgetId;
    let verifiedUntil = 0;
    let approvalTimer;
    const lockMail = message => {
      verifiedUntil = 0;
      clearTimeout(approvalTimer);
      submit.disabled = true;
      copyButton.disabled = true;
      if (message) captchaStatus.textContent = message;
    };
    const canUseMail = () => {
      if (Date.now() < verifiedUntil && !value('_gotcha')) return true;
      lockMail('Dokończ weryfikację CAPTCHA przed przygotowaniem wiadomości.');
      captchaRetry.hidden = false;
      return false;
    };
    async function initCaptcha() {
      if (captchaStarted) return;
      captchaStarted = true;
      captchaRetry.hidden = true;
      lockMail('Ładowanie weryfikacji…');
      try {
        const response = await fetch(captchaEndpoint('api/captcha/config'), {cache: 'no-store', signal: AbortSignal.timeout(10000)});
        if (!response.ok) throw new Error('config');
        const config = await response.json();
        const mode = form.querySelector('[data-captcha-mode]');
        mode.hidden = !config.testMode;
        mode.textContent = config.testMode ? 'Podgląd lokalny: CAPTCHA działa na kluczach testowych i nie blokuje prawdziwych botów. Przed publikacją podłączymy klucze produkcyjne.' : '';
        if (!window.turnstile) await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          const timeout = setTimeout(() => { script.remove(); reject(new Error('timeout')); }, 15000);
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.onload = () => { clearTimeout(timeout); resolve(); };
          script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('script')); };
          document.head.append(script);
        });
        if (widgetId !== undefined) window.turnstile.remove(widgetId);
        widgetId = window.turnstile.render(form.querySelector('[data-captcha-widget]'), {
          sitekey: config.sitekey, action: 'contact', language: 'pl', size: 'flexible',
          callback: async token => {
            lockMail('Sprawdzanie potwierdzenia…');
            try {
              const result = await fetch(captchaEndpoint('api/captcha/verify'), {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({token, trap: value('_gotcha')}), signal: AbortSignal.timeout(12000),
              });
              if (!result.ok || (await result.json()).ok !== true) throw new Error('verify');
              verifiedUntil = Date.now() + 240000;
              submit.disabled = false;
              copyButton.disabled = false;
              captchaRetry.hidden = true;
              captchaStatus.textContent = 'Weryfikacja zakończona. Możesz otworzyć pocztę lub skopiować wiadomość.';
              approvalTimer = setTimeout(() => {
                lockMail('Weryfikacja wygasła. Potwierdź ponownie, że jesteś człowiekiem.');
                captchaRetry.hidden = false;
              }, 240000);
            } catch {
              lockMail('Nie udało się potwierdzić CAPTCHA. Spróbuj ponownie za chwilę. Dane pozostają w formularzu.');
              captchaRetry.hidden = false;
            }
          },
          'expired-callback': () => { lockMail('Weryfikacja wygasła. Spróbuj ponownie.'); captchaRetry.hidden = false; },
          'error-callback': errorCode => {
            const code = String(errorCode || '').replace(/[^0-9]/g, '').slice(0, 6);
            const message = code === '110200'
              ? 'Domena tej strony nie jest dodana do CAPTCHA. Administrator musi dodać dzabrys.github.io w ustawieniach Turnstile.'
              : ['110100', '110110', '400020', '400070'].includes(code)
                ? 'Konfiguracja CAPTCHA wymaga sprawdzenia przez administratora.'
                : code === '200100'
                  ? 'Sprawdź datę i godzinę urządzenia, a następnie odśwież stronę.'
                  : 'Nie udało się połączyć z CAPTCHA Cloudflare. Otwórz tę stronę w aktualnym Chrome, Edge lub Firefox i spróbuj ponownie. Dane pozostają w formularzu.';
            lockMail(message + (code ? ' Kod błędu: ' + code + '.' : ''));
            captchaRetry.hidden = false;
            return true;
          },
          'unsupported-callback': () => {
            lockMail('Ta przeglądarka nie obsługuje CAPTCHA. Otwórz stronę w aktualnym Chrome, Edge lub Firefox. Dane pozostają w formularzu.');
            captchaRetry.hidden = false;
          },
        });
        captchaStatus.textContent = 'Dokończ weryfikację w polu powyżej.';
      } catch {
        captchaStarted = false;
        lockMail('CAPTCHA jest niedostępna. Sprawdź połączenie i spróbuj ponownie. Dane pozostają w formularzu.');
        captchaRetry.hidden = false;
      }
    }
    captchaRetry.addEventListener('click', () => { captchaStarted = false; initCaptcha(); });
    function emailSubject() {
      const organization = value('organizacja').replace(/[\r\n]+/g, ' ');
      const person = [value('name'), value('nazwisko')].filter(Boolean).join(' ').replace(/[\r\n]+/g, ' ');
      return [organization && '[' + organization + ']', person, value('rodzaj_zapytania') || 'Zapytanie', value('gra')].filter(Boolean).join(' — ');
    }
    const compose = () => {
      const person = [value('name'), value('nazwisko')].filter(Boolean).join(' ');
      const date = value('termin');
      const extras = [...form.querySelectorAll('[name="dodatki"]:checked')].map(field => field.value).join(', ');
      const section = (heading, lines) => {
        const content = lines.filter(Boolean);
        return content.length ? heading + '\n' + content.join('\n') : '';
      };
      const body = [
        'Dzień dobry,\n\nprzesyłam zapytanie za pośrednictwem strony Wielkie Gry Planszowe.',
        section('ZAPYTANIE', [
          'Rodzaj zapytania: ' + (value('rodzaj_zapytania') || 'Zapytanie ogólne'),
          value('gra') && 'Gra lub pomysł: ' + value('gra'),
          value('format') && 'Format gry: ' + value('format'),
          value('liczba_egzemplarzy') && 'Liczba egzemplarzy: ' + value('liczba_egzemplarzy'),
        ]),
        section('UCZESTNICY I ORGANIZACJA', [
          value('grupa') && 'Dla kogo: ' + value('grupa'),
          value('miejsce') && 'Miejsce: ' + value('miejsce'),
          date && 'Planowany termin: ' + date.split('-').reverse().join('.'),
          extras && 'Dodatkowe potrzeby: ' + extras,
        ]),
        section('TREŚĆ WIADOMOŚCI', [value('message')]),
        section('DANE DO KONTAKTU', [
          'Imię i nazwisko: ' + person,
          value('organizacja') && 'Firma / szkoła / instytucja: ' + value('organizacja'),
          'E-mail: ' + value('email'),
          value('telefon') && 'Telefon: ' + value('telefon'),
        ]),
        'Pozdrawiam,\n' + person + (value('organizacja') ? '\n' + value('organizacja') : ''),
      ].filter(Boolean).join('\n\n');
      return {subject: emailSubject(), body};
    };
    const prepareManual = () => {
      const message = compose();
      form.querySelector('[data-mail-subject]').value = message.subject;
      form.querySelector('[data-mail-body]').value = message.body;
      manual.hidden = false;
      return message;
    };
    const copyMessage = async () => {
      const message = prepareManual();
      const text = 'Do: ' + recipient + '\nTemat: ' + message.subject + '\n\n' + message.body;
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = 'Skopiowano adres, temat i treść. Wklej je do nowej wiadomości w swojej poczcie i kliknij „Wyślij”.';
      } catch {
        status.textContent = 'Skopiuj adres, temat i treść z widocznych pól, a następnie wklej je do nowej wiadomości w swojej poczcie.';
      }
      status.focus();
    };
    const updateProvider = () => {
      const labels = {gmail: 'Otwórz Gmail z wiadomością', outlook: 'Otwórz Outlook z wiadomością', wp: 'Kopiuj wiadomość i otwórz WP', other: 'Przygotuj wiadomość do skopiowania'};
      submit.querySelector('span').textContent = labels[provider.value];
      help.textContent = ['gmail', 'outlook'].includes(provider.value)
        ? 'Otworzymy pocztę w przeglądarce z gotową wiadomością. W poczcie kliknij „Wyślij”. Jeśli nie jesteś zalogowany, zaloguj się, wróć tutaj i kliknij ponownie.'
        : 'Skopiuj treść, wklej ją do nowej wiadomości w swojej poczcie i uzupełnij odbiorcę oraz temat z pól poniżej.';
    };
    provider.addEventListener('change', updateProvider);
    form.querySelector('[data-copy-mail]').addEventListener('click', () => { if (validate(form) && canUseMail()) copyMessage(); });
    form.addEventListener('input', () => { if (!manual.hidden) prepareManual(); });
    form.addEventListener('change', () => { if (!manual.hidden) prepareManual(); });
    updateProvider();
    form.noValidate = true;
    submit.disabled = true;
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (panels.length && step < panels.length - 1) {
        if (validate(panels[step])) showStep(step + 1);
        return;
      }
      if (!validate(form)) return;
      if (!canUseMail()) return;
      const message = prepareManual();
      if (provider.value === 'other') { copyMessage(); return; }
      if (provider.value === 'wp') {
        window.open('https://poczta.wp.pl/', '_blank', 'noopener,noreferrer');
        copyMessage();
        return;
      }
      const url = new URL(provider.value === 'gmail' ? 'https://mail.google.com/mail/' : 'https://outlook.live.com/mail/0/deeplink/compose');
      if (provider.value === 'gmail') {
        url.searchParams.set('view', 'cm');
        url.searchParams.set('fs', '1');
        url.searchParams.set('to', recipient);
        url.searchParams.set('su', message.subject);
      } else {
        url.searchParams.set('to', recipient);
        url.searchParams.set('subject', message.subject);
      }
      url.searchParams.set('body', message.body);
      window.open(url.href, '_blank', 'noopener,noreferrer');
      status.textContent = 'W poczcie sprawdź wiadomość i kliknij „Wyślij”. Jeśli karta się nie otworzyła lub brakuje treści, użyj przycisku „Kopiuj całą wiadomość” i pól powyżej. Dane pozostają w formularzu.';
      status.focus();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
