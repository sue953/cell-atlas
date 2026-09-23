const dialog=document.getElementById('detail-dialog');
const reference=document.querySelector('.reference');
document.querySelector('.detail-layout').append(reference);
reference.classList.add('reference-compare');
reference.querySelector('summary').textContent='结构示意图';
reference.querySelector('summary').addEventListener('click',event=>event.preventDefault());
const button=document.createElement('button');
button.id='reference-toggle';button.textContent='二维图';button.setAttribute('aria-pressed','false');
document.querySelector('.detail-header').insertBefore(button,document.getElementById('close-detail'));
button.addEventListener('click',()=>{const active=dialog.classList.toggle('comparing');reference.open=active;button.textContent=active?'返回讲解':'二维图';button.setAttribute('aria-pressed',String(active));});
export function resetReference(id){
  dialog.classList.remove('comparing');button.textContent='二维图';button.setAttribute('aria-pressed','false');
}
