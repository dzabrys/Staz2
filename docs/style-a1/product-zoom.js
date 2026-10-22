(() => {
  const dialog = document.querySelector('#product-image-dialog');
  const trigger = document.querySelector('.product-image-open');
  if (!dialog || !trigger) return;
  const stage = dialog.querySelector('.product-zoom-stage');
  const image = stage?.querySelector('.product-detail-image');
  if (!image) return;
  const lens = stage.querySelector('.product-magnifier');
  const detail = dialog.querySelector('.product-zoom-detail');
  const range = dialog.querySelector('#product-zoom-range');
  const output = dialog.querySelector('output');
  const status = dialog.querySelector('.product-viewer-status');
  let ready = false, position = {x:.5, y:.5};
  const hide = () => stage.classList.remove('has-lens');
  const render = () => {
    if (!ready || !dialog.open) return;
    const width = image.clientWidth, height = image.clientHeight;
    if (!width || !height) return;
    detail.style.height = `${height}px`;
    const zoom = Math.max(Number(range.value), detail.clientWidth/width);
    const selectionWidth = Math.min(width, detail.clientWidth/zoom);
    const selectionHeight = height/zoom;
    const left = Math.max(0, Math.min(width-selectionWidth, position.x*width-selectionWidth/2));
    const top = Math.max(0, Math.min(height-selectionHeight, position.y*height-selectionHeight/2));
    lens.style.width = `${selectionWidth}px`;
    lens.style.height = `${selectionHeight}px`;
    lens.style.left = `${left}px`;
    lens.style.top = `${top}px`;
    detail.style.backgroundSize = `${width*zoom}px ${height*zoom}px`;
    detail.style.backgroundPosition = `${-left*zoom}px ${-top*zoom}px`;
  };
  const show = () => { if (ready) { stage.classList.add('has-lens'); render(); } };
  const changeZoom = value => {
    range.value = String(Math.max(1.5, Math.min(6, Math.round(value*4)/4)));
    output.value = `${Number(range.value).toLocaleString('pl-PL')}×`;
    render();
  };
  const move = event => {
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    position = {x:Math.max(0, Math.min(1,(event.clientX-rect.left)/rect.width)),
      y:Math.max(0, Math.min(1,(event.clientY-rect.top)/rect.height))};
    show();
  };
  image.addEventListener('load', () => {
    ready = true;
    detail.style.backgroundImage = `url(${JSON.stringify(image.currentSrc || image.src)})`;
    detail.classList.add('is-ready');
    status.textContent = '';
    render();
  });
  image.addEventListener('error', () => {
    ready = false; hide(); image.removeAttribute('src');
    detail.style.backgroundImage = ''; detail.classList.remove('is-ready');
    status.textContent = 'Nie udało się wczytać obrazu. Zamknij podgląd i otwórz go ponownie, aby spróbować jeszcze raz.';
  });
  trigger.addEventListener('click', () => {
    position = {x:.5,y:.5}; hide(); changeZoom(2.5);
    if (!ready) {
      status.textContent = 'Wczytywanie obrazu ze szczegółami…';
      if (!image.hasAttribute('src')) image.src = image.dataset.detailSrc;
    }
  });
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') move(event); });
  stage.addEventListener('pointerdown', event => {
    if (!ready) return;
    stage.setPointerCapture(event.pointerId); move(event);
  });
  stage.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') hide(); });
  stage.addEventListener('pointercancel', hide);
  stage.addEventListener('focus', show);
  stage.addEventListener('blur', hide);
  stage.addEventListener('wheel', event => {
    if (!ready || event.ctrlKey || !event.deltaY) return;
    event.preventDefault(); move(event);
    changeZoom(Number(range.value) + (event.deltaY < 0 ? .25 : -.25));
  }, {passive:false});
  stage.addEventListener('keydown', event => {
    const arrows = {ArrowLeft:[-.03,0],ArrowRight:[.03,0],ArrowUp:[0,-.03],ArrowDown:[0,.03]};
    if (arrows[event.key]) {
      event.preventDefault();
      const [x,y] = arrows[event.key];
      position = {x:Math.max(0,Math.min(1,position.x+x)),y:Math.max(0,Math.min(1,position.y+y))}; show();
    } else if (['+','=','-'].includes(event.key)) {
      event.preventDefault(); changeZoom(Number(range.value) + (event.key==='-'?-.25:.25)); show();
    }
  });
  range.addEventListener('input', () => { changeZoom(Number(range.value)); show(); });
  dialog.querySelectorAll('[data-zoom-step]').forEach(button => button.addEventListener('click', () => {
    changeZoom(Number(range.value) + Number(button.dataset.zoomStep)*.25); show();
  }));
  dialog.addEventListener('close', hide);
  new ResizeObserver(render).observe(image);
})();
