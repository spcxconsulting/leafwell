/** Academica navigation adapted for keyboard access and progressive enhancement.
 * Original: BootstrapMade.com — https://bootstrapmade.com/license/ */
const toggle = document.querySelector('.mobile-nav-toggle');
const navigation = document.querySelector('#navmenu');
function closeNavigation() {
  toggle?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-nav-active');
}
if (toggle && navigation) {
  document.body.classList.add('nav-enhanced');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('mobile-nav-active', open);
  });
  navigation
    .querySelectorAll('a')
    .forEach((link) => link.addEventListener('click', closeNavigation));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeNavigation();
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#header')) closeNavigation();
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', closeNavigation);
}
document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});
// Only the display-only placeholder is preselected; verified embeds own their fields.
document.querySelectorAll('[data-enquiry]').forEach((link) =>
  link.addEventListener('click', () => {
    const select = document.querySelector('#enquiry-placeholder #enquiry-type');
    if (select) select.value = link.dataset.enquiry;
  }),
);
document
  .querySelector('#enquiry-placeholder')
  ?.addEventListener('submit', (event) => event.preventDefault());
