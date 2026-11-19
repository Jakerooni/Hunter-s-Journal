(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'messenger-dialog';
  dialog.setAttribute('aria-labelledby', 'messenger-title');
  dialog.setAttribute('aria-describedby', 'messenger-description');
  dialog.innerHTML = `
    <button type="button" class="messenger-close" aria-label="Close contact popup" autofocus>×</button>
    <p class="collection-label">A MESSAGE THROUGH THE FOG</p>
    <h2 id="messenger-title">Send a Messenger</h2>
    <p id="messenger-description">Have a class project, an animation collaboration, or feedback on my work? I'd love to hear from you.</p>
    <p class="messenger-email"><a href="mailto:jakebenedickm@gmail.com">jakebenedickm@gmail.com</a></p>
    <section class="messenger-actions" aria-label="Email actions">
      <a class="collection-button" href="mailto:jakebenedickm@gmail.com">Email Me</a>
      <button type="button" class="collection-button" data-copy-email>Copy Email</button>
    </section>
    <p class="copy-status" role="status" aria-live="polite"></p>
    <details class="messenger-support">
      <summary>Optional support · GCash:))</summary>
      <p>09452166177<br>JAKE BENEDICK B. MURILLO</p>
    </details>`;
  document.body.appendChild(dialog);

  let opener;
  let outsideStart = false;
  const isOutside = event => {
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom;
  };

  document.querySelectorAll('[data-open-contact]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      if (dialog.open) return;
      opener = button;
      dialog.querySelector('.copy-status').textContent = '';
      dialog.showModal();
      document.body.classList.add('messenger-open');
    });
  });

  dialog.querySelector('.messenger-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('pointerdown', event => {
    outsideStart = event.target === dialog && isOutside(event);
  });
  dialog.addEventListener('click', event => {
    if (outsideStart && event.target === dialog && isOutside(event)) dialog.close();
    outsideStart = false;
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('messenger-open');
    opener?.focus({ preventScroll: true });
  });
  dialog.querySelector('[data-copy-email]').addEventListener('click', async () => {
    const status = dialog.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText('jakebenedickm@gmail.com');
      status.textContent = 'Email copied. Ready to send your message.';
    } catch {
      status.textContent = 'Copy is unavailable here. Select the email address above and copy it manually.';
    }
  });
})();
