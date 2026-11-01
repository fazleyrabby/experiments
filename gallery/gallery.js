const buttons=[...document.querySelectorAll('[data-filter]')];
const projects=[...document.querySelectorAll('.project')];
const count=document.querySelector('#project-count');
for(const button of buttons)button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  for(const item of buttons)item.setAttribute('aria-pressed',String(item===button));
  let visible=0;
  for(const project of projects){project.hidden=filter!=='All'&&project.dataset.category!==filter;if(!project.hidden)visible++;}
  count.textContent=String(visible).padStart(2,'0');
});
