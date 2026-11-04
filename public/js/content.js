(async function () {
  const slug = window.location.pathname.match(/\/(rooms|meals|news|about)\.html$/)?.[1];
  if (!slug) return;
  try {
    const response = await fetch('/api/pages/' + slug, { cache: 'no-store' });
    if (!response.ok) return;
    const page = await response.json();
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    for (const field of page.fields) {
      const element = document.querySelector(field.selector);
      if (!element) continue;
      if (field.type === 'image') {
        element.src = '/images/' + field.value;
      } else if (normalize(element.textContent) !== normalize(field.value)) {
        element.textContent = field.value;
        element.style.whiteSpace = 'pre-line';
      }
    }
  } catch (error) {
    console.error('Page updates could not be loaded; showing the original content.');
  }
})();
