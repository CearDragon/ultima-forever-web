export function nextGalleryStart(current, direction, itemCount, visibleCount) {
  if (itemCount <= 0 || visibleCount <= 0) return 0;
  const maxStart = Math.max(0, itemCount - visibleCount);
  const start = Math.min(maxStart, Math.max(0, current));
  if (direction > 0) return start >= maxStart ? 0 : Math.min(maxStart, start + visibleCount);
  if (direction < 0) return start <= 0 ? maxStart : Math.max(0, start - visibleCount);
  return start;
}

if (typeof document !== 'undefined') {
  let galleryStart = 0;

  document.addEventListener('click', (event) => {
    const control = event.target.closest?.('.slider-control');
    if (control) {
      event.preventDefault();
      const carousel = document.querySelector('#carousel');
      const items = [...(carousel?.querySelectorAll(':scope > a') ?? [])];
      if (!carousel || !items.length) return;

      const visibleCount = Number(getComputedStyle(carousel).getPropertyValue('--gallery-visible-count')) || 1;
      const direction = control.classList.contains('slider-control--next') ? 1 : -1;
      galleryStart = nextGalleryStart(galleryStart, direction, items.length, visibleCount);
      carousel.scrollTo({
        left: items[galleryStart].offsetLeft - items[0].offsetLeft,
        behavior: 'smooth',
      });
      return;
    }

    const link = event.target.closest?.('a[rel^="lightbox"]');
    if (!link || !link.href) return;

    event.preventDefault();
    let dialog = document.querySelector('.gallery-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'gallery-dialog';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'gallery-dialog__close';
      close.setAttribute('aria-label', 'Close image');
      close.textContent = '×';
      close.addEventListener('click', () => dialog.close());
      const image = document.createElement('img');
      dialog.append(close, image);
      dialog.addEventListener('click', (dialogEvent) => {
        if (dialogEvent.target === dialog) dialog.close();
      });
      document.body.append(dialog);
    }

    const image = dialog.querySelector('img');
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt ?? '';
    dialog.showModal();
  });
}
