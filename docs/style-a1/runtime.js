/* Static HTML is complete before this enhancement runs. */
(() => {
  const $ = selector => document.querySelector(selector);
  const motionPreference = matchMedia('(prefers-reduced-motion:reduce)');
  const surfaceMotion = new WeakMap();
  const closingDialogs = new WeakSet();
  const openSurface = (element, duration = 220, distance = 6) => {
    if (!element.animate) return;
    surfaceMotion.get(element)?.cancel();
    const frames = motionPreference.matches
      ? [{opacity:.8}, {opacity:1}]
      : [{opacity:.5, transform:`translateY(${distance}px)`}, {opacity:1, transform:'none'}];
    const animation = element.animate(frames, {duration:motionPreference.matches ? 140 : duration, easing:'cubic-bezier(.22,.61,.36,1)'});
    surfaceMotion.set(element, animation);
    animation.finished.then(() => {if(surfaceMotion.get(element)===animation)surfaceMotion.delete(element)}).catch(() => {});
  };
  const closeSurface = async dialog => {
    if (!dialog.open || closingDialogs.has(dialog)) return;
    closingDialogs.add(dialog);
    surfaceMotion.get(dialog)?.cancel();
    if (dialog.animate) {
      const frames = motionPreference.matches
        ? [{opacity:1}, {opacity:.8}]
        : [{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(4px)'}];
      const animation = dialog.animate(frames, {duration:motionPreference.matches ? 100 : 150, easing:'ease-in'});
      surfaceMotion.set(dialog, animation);
      await animation.finished.catch(() => {});
    }
    dialog.close();
    surfaceMotion.get(dialog)?.cancel();
    surfaceMotion.delete(dialog);
    closingDialogs.delete(dialog);
  };
  const installDialog = (dialog, closeButton) => {
    closeButton.addEventListener('click', () => closeSurface(dialog));
    dialog.addEventListener('cancel', event => {event.preventDefault();closeSurface(dialog)});
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) closeSurface(dialog);
    });
  };

  const menu = $('.menu-toggle'), nav = $('#navigation');
  const setMenu = open => {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    if(open)openSurface(nav, 180, -4);
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded')!=='true'));
  document.addEventListener('keydown', event => {
    if(event.key==='Escape' && nav.classList.contains('open')){setMenu(false);menu.focus()}
  });
  document.addEventListener('click', event => {
    if(!event.target.closest('.header') && nav.classList.contains('open'))setMenu(false);
  });
  matchMedia('(min-width:1001px)').addEventListener('change', event => {if(event.matches)setMenu(false)});
  nav.addEventListener('focusout', event => {
    if(event.relatedTarget && !nav.contains(event.relatedTarget) && event.relatedTarget!==menu)setMenu(false);
  });

  const dialog = $('#search-dialog'), input = $('#search-input');
  if (dialog && input && $('.search-toggle')) {
  const normalize = value => value.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{M}/gu,'').replaceAll('ł','l');
  const items = JSON.parse($('#search-data').textContent);
  const search = () => {
    const query=normalize(input.value.trim());
    const results=items.filter(item=>normalize(item.title+' '+item.desc).includes(query));
    $('#search-results').replaceChildren();
    $('#search-status').textContent=results.length?`Liczba wyników: ${results.length}.`:'Brak wyników. Spróbuj innego hasła.';
    for(const item of results){const link=document.createElement('a');link.textContent=item.title;link.href=item.href;$('#search-results').append(link)}
  };
  $('.search-toggle').addEventListener('click', () => {dialog.showModal();search();input.focus();openSurface(dialog)});
  input.addEventListener('input', search);
  installDialog(dialog, $('.close-dialog'));
  }

  if($('.hero-carousel')){
    const slides=[
      ['Wielkie gry, które angażują,<br>uczą i zostają w pamięci.','Poznaj gry dla szkół','szkoly.html','gry dla szkół'],
      ['Wspólne wyzwania,<br>silniejsze zespoły.','Poznaj gry dla firm','firmy.html','gry dla firm'],
      ['Twoja idea,<br>nasza realizacja.','Odkryj gry na zamówienie','gry-na-zamowienie.html','gry na zamówienie']
    ];
    let active=0;
    const show = number => {
      active=(number+slides.length)%slides.length;
      const [text,label,href,name]=slides[active];
      $('.hero-slide-copy p').innerHTML=text;
      $('.hero-slide-copy .button-label').textContent=label;
      $('.hero-slide-copy .button').href=href;
      document.querySelectorAll('[data-slide]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.slide)===active)));
      $('#carousel-status').textContent=`Oferta ${active+1} z ${slides.length}: ${name}.`;
      openSurface($('.hero-slide-copy'),280,6);
    };
    $('.carousel-prev').addEventListener('click',()=>show(active-1));
    $('.carousel-next').addEventListener('click',()=>show(active+1));
    document.querySelectorAll('[data-slide]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.slide))));
  }

  const imageTrigger=$('.product-image-open'), imageDialog=$('#product-image-dialog');
  if(imageTrigger && imageDialog){
    imageTrigger.addEventListener('click',()=>{imageDialog.showModal();openSurface(imageDialog)});
    installDialog(imageDialog, $('.product-image-close'));
    imageDialog.addEventListener('close',()=>imageTrigger.focus({preventScroll:true}));
  }

  document.querySelectorAll('.step-details,.product-detail-faq details,.proposal-faq details').forEach(details=>{
    const summary=details.querySelector('summary'), content=details.querySelector('.details-content');
    if(!content || !content.animate)return;
    let desiredOpen=details.open, running;
    summary.addEventListener('click',event=>{
      event.preventDefault();
      const wasOpen=details.open;
      const opacity=wasOpen?getComputedStyle(content).opacity:(motionPreference.matches ? .8 : 0);
      desiredOpen=!desiredOpen;
      running?.cancel();
      if(desiredOpen)details.open=true;
      const frames=motionPreference.matches
        ? [{opacity},{opacity:desiredOpen?1:.6}]
        : [{opacity,transform:wasOpen?'none':'translateY(-4px)'},{opacity:desiredOpen?1:0,transform:desiredOpen?'none':'translateY(-3px)'}];
      const animation=content.animate(frames,{duration:motionPreference.matches?120:desiredOpen?220:140,easing:'ease-out'});
      running=animation;
      animation.finished.then(()=>{if(running!==animation)return;if(!desiredOpen)details.open=false;running=null}).catch(()=>{});
    });
  });

  const topic=new URLSearchParams(location.search).get('temat');
  if(topic && $('.contact-card')){const note=document.createElement('p');note.className='selected-game';note.textContent='Wybrana gra: '+topic.slice(0,120);$('.contact-card').prepend(note)}
})();
