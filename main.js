const menuBtn = document.querySelector('.menu-btn');
const navMenu = document.querySelector('.nav');
const body = document.body;

// Toggle menu
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent body click
  body.classList.toggle('open');
});

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (
    !menuBtn.contains(e.target) &&
    !navMenu.contains(e.target) &&
    body.classList.contains('open')
  ) {
    body.classList.remove('open');
  }
});

// scroll reveal
window.sr=ScrollReveal();
sr.reveal('.animate-left',{
	origin:'left',
	duration :1000,
	distance:'25rem',
	delay: 300
});

window.sr=ScrollReveal();
sr.reveal('.animate-right',{
	origin:'right',
	duration :1000,
	distance:'25rem',
	delay: 300
});
window.sr=ScrollReveal();
sr.reveal('.animate-top',{
	origin:'top',
	duration :1000,
	distance:'25rem',
	delay: 400
});
window.sr=ScrollReveal();
sr.reveal('.animate-bottom',{
	origin:'bottom',
	duration :1000,
	distance:'25rem',
	delay: 400
});
