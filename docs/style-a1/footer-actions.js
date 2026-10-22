(() => {
  const init = () => {
    document.querySelectorAll('.a-site-footer [data-footer-copy-email]').forEach(button => {
      const toast = button.parentElement.querySelector('[data-footer-copy-status]');
      if (!toast) return;
      let dismissTimer;
      let clearTimer;
      let copying = false;
      button.addEventListener('click', async () => {
        if (copying) return;
        copying = true;
        clearTimeout(dismissTimer);
        clearTimeout(clearTimer);
        let message;
        try {
          await navigator.clipboard.writeText(button.dataset.footerCopyEmail);
          message = 'Skopiowano adres Email';
        } catch {
          message = 'Nie udało się skopiować adresu';
        } finally {
          copying = false;
        }
        toast.textContent = message;
        toast.classList.add('is-visible');
        dismissTimer = setTimeout(() => {
          toast.classList.remove('is-visible');
          clearTimer = setTimeout(() => { toast.textContent = ''; }, 300);
        }, 2000);
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
