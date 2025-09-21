const menuBtn = document.querySelector('.menu-btn');
const navMenu = document.querySelector('.nav');
const body = document.body;
const textarea = document.getElementById('message');

// Toggle menu
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent body click
  body.classList.toggle('open');
});

// Close menu on outside click

document.addEventListener('click', (e) => {
  console.log('Clicked:', e.target);
  if (
    !menuBtn.contains(e.target) &&
    !navMenu.contains(e.target) &&
    body.classList.contains('open')
  ) {
    body.classList.remove('open');
  }
});


textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
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
