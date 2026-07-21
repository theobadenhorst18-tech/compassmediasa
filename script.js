const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open');
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible'));
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', event => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

document.querySelector('#year').textContent = new Date().getFullYear();

const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const data = new FormData(contactForm);
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const status = document.querySelector('#form-status');
  submitButton.disabled = true;
  status.textContent = 'Sending…';

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(data))
  }).then(response => {
    if (!response.ok) throw new Error('Delivery failed');
    contactForm.reset();
    status.textContent = 'Thanks — your enquiry has been sent.';
  }).catch(() => {
    status.textContent = 'Opening your email app to finish sending…';
    const subject = encodeURIComponent('New project enquiry from Compass Media website');
    const body = encodeURIComponent(`Email: ${data.get('email')}\nPhone: ${data.get('phone')}\n\nMessage:\n${data.get('message') || '(No message provided)'}`);
    window.location.href = `mailto:theo@compassmediasa.co.za?subject=${subject}&body=${body}`;
  }).finally(() => {
    submitButton.disabled = false;
  });
});
