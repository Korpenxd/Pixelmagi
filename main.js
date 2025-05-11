//Select element function
const selectElement = function(element){
	return document.querySelector(element);
};
let menuToggler = selectElement('.menu-btn');
let body = selectElement('body');
menuToggler.addEventListener('click',function(){
	body.classList.toggle('open');
});


const menuBtn = document.querySelector('.menu-btn');
let menuOpen = false;
menuBtn.addEventListener('click', () => {
  if(!menuOpen) {
    menuBtn.classList.add('open');
    menuOpen = true;
  } else {
    menuBtn.classList.remove('open');
    menuOpen = false;
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
