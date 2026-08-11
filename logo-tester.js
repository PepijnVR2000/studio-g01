(() => {
  const isDirectionFour = document.body.classList.contains('d4');
  const allLogos = ['03 / Inline Clean','04 / Pixel Module — No Studio','06 / Register Shift','20 / G01 Fix Solid','24 / Frame 1 — Wordmark Lockup','26 / Frame 1 — Refined Lockup'];
  const systems = [
    {name:'SYSTEM A · 03 → 04', expanded:0, compact:1},
    {name:'SYSTEM B · 24 → BLUE SYMBOL', expanded:4, compact:4}
  ];
  const choices = isDirectionFour ? systems.map(system=>system.name) : allLogos;
  const key = isDirectionFour ? 'g01-d4-logo-system' : 'g01-mockup-logo-index';
  let index = Math.max(0, Math.min(choices.length - 1, Number(localStorage.getItem(key)) || 0));
  /* The public pages use System A: the wordmark collapses to the pixel G01 on
     scroll. It is the interactive mark both founders chose. */
  if(document.body.classList.contains('release-page')) index=0;
  let compact = false;
  const brand = document.querySelector('.brand'); if (!brand) return;
  brand.textContent = '';
  let frame = document.createElement('iframe'); frame.className = 'brand-logo'; frame.title = 'Selected Studio G01 logo'; brand.append(frame);
  let currentActualIndex=-1;
  const tester = document.createElement('aside'); tester.className = 'logo-tester'; tester.setAttribute('aria-label', isDirectionFour ? 'Responsive logo system tester' : 'Logo tester');
  tester.innerHTML = `<button class="logo-test-prev" aria-label="Previous logo">←</button><div class="logo-test-track"></div><button class="logo-test-next" aria-label="Next logo">→</button><button class="logo-test-close" aria-label="Collapse logo tester">HIDE TESTER</button>`;
  document.body.append(tester);
  const track = tester.querySelector('.logo-test-track');
  track.innerHTML = choices.map((name, i) => `<button class="logo-test-option" data-index="${i}" title="${name}">${String(i + 1).padStart(2, '0')}<span>${name}</span></button>`).join('');
  function actualLogoIndex(){ return isDirectionFour ? (compact ? systems[index].compact : systems[index].expanded) : index; }
  /* The mark used to be an iframe on every page, so each navigation blanked the
     header, fetched a second document and popped the logo back in. The iframe is
     still the authority on how the mark is drawn, so the first load memoises the
     markup it produces and every page after that paints it inline, instantly. */
  /* Painting the cached markup inline removes the reload flash, but the mark is
     positioned and masked by hand-tuned CSS (translateX(-90px) inside a 34px
     window) and I cannot verify the compact state in this environment, where
     width and transform transitions never run. It has broken the logo twice.
     The iframe stays the authority until the logo system is decided and the two
     chosen marks can be exported as static SVGs. Flip this to true to try again. */
  const INLINE_LOGO=false;
  const CACHE_VERSION='2';
  const cacheKey=i=>`g01-logo-svg-${CACHE_VERSION}-${i}`;
  function readCache(i){if(!INLINE_LOGO)return null;try{return sessionStorage.getItem(cacheKey(i));}catch(e){return null;}}
  function writeCache(i,markup){try{sessionStorage.setItem(cacheKey(i),markup);}catch(e){}}
  function harvest(iframe,i){
    try{
      const art=iframe.contentDocument&&iframe.contentDocument.querySelector('.card.is-active .art');
      if(!art||!art.innerHTML.trim())return;
      /* Some marks are <img src="./assets/...">, relative to the embed document.
         Lifted into this page that path resolves against the wrong directory and
         the image 404s, so resolve every reference before caching it. */
      const copy=art.cloneNode(true);
      copy.querySelectorAll('img[src]').forEach(image=>{
        const absolute=new URL(image.getAttribute('src'),iframe.contentDocument.baseURI).href;
        image.setAttribute('src',absolute);
      });
      writeCache(i,copy.innerHTML);
    }catch(e){}
  }
  function paintInline(markup,title){
    const mark=document.createElement('span');
    mark.className='brand-logo is-inline';
    mark.title=title;
    mark.innerHTML=markup;
    return mark;
  }

  function renderLogo(){
    const actualIndex=actualLogoIndex();
    brand.classList.toggle('system-b',isDirectionFour&&index===1);
    brand.classList.toggle('is-compact-logo',compact);
    if(actualIndex===currentActualIndex)return;
    const source=`logo-selected-six/index.html?embed=1&logo=${actualIndex}&v=35`;
    const title=isDirectionFour ? `${systems[index].name} · ${compact?'compact':'expanded'}` : allLogos[actualIndex];
    const cached=readCache(actualIndex);
    if(cached){
      const mark=paintInline(cached,title);
      frame.replaceWith(mark);
      frame=mark;
      currentActualIndex=actualIndex;
      return;
    }
    if(currentActualIndex<0){
      frame.addEventListener('load',()=>harvest(frame,actualIndex),{once:true});
      frame.src=source;frame.title=title;currentActualIndex=actualIndex;return;
    }
    const nextFrame=document.createElement('iframe');
    nextFrame.className='brand-logo';nextFrame.title=title;nextFrame.style.visibility='hidden';
    nextFrame.addEventListener('load',()=>{
      harvest(nextFrame,actualIndex);
      nextFrame.style.visibility='visible';
      nextFrame.classList.add('logo-swap-in');
      frame.classList.add('logo-swap-out');
      setTimeout(()=>{frame.remove();frame=nextFrame;frame.classList.remove('logo-swap-in');},340);
    },{once:true});
    brand.append(nextFrame);
    nextFrame.src=source;
    currentActualIndex=actualIndex;
  }
  function show(nextIndex) {
    index = (nextIndex + choices.length) % choices.length; localStorage.setItem(key, String(index));
    renderLogo();
    track.querySelectorAll('.logo-test-option').forEach((option, i) => option.classList.toggle('active', i === index));
    track.querySelector(`[data-index="${index}"]`).scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
  }
  tester.querySelector('.logo-test-prev').addEventListener('click', () => show(index - 1));
  tester.querySelector('.logo-test-next').addEventListener('click', () => show(index + 1));
  track.addEventListener('click', event => { const option = event.target.closest('.logo-test-option'); if (option) show(Number(option.dataset.index)); });
  let wheelLock = false;
  tester.addEventListener('wheel', event => { event.preventDefault(); if (wheelLock) return; wheelLock = true; show(index + (event.deltaY > 0 || event.deltaX > 0 ? 1 : -1)); setTimeout(() => wheelLock = false, 180); }, {passive:false});
  if(!document.body.classList.contains('release-page')) document.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') show(index - 1); if (event.key === 'ArrowRight') show(index + 1); });
  tester.querySelector('.logo-test-close').addEventListener('click', event => { const collapsed = tester.classList.toggle('is-collapsed'); event.currentTarget.textContent = collapsed ? 'SHOW LOGO TESTER' : 'HIDE TESTER'; });
  if(isDirectionFour){
    const sentinel=document.createElement('div'); sentinel.className='logo-scroll-sentinel'; document.querySelector('.site-head').after(sentinel);
    const observer=new IntersectionObserver(entries=>{
      const nextCompact=!entries[0].isIntersecting;
      if(nextCompact!==compact){compact=nextCompact;renderLogo();}
    },{threshold:0});
    observer.observe(sentinel);
  }
  show(index);
})();

// Direction 04: keep the three principal image bottoms on one optical baseline.
// Their tops are intentionally staggered, so each image needs its own computed height.
(() => {
  if (!document.body.classList.contains('d4')) return;
  /* The release collage sizes itself off the viewport, so the shared baseline
     falls out of the grid. Writing inline heights here would fight it. */
  if (document.body.classList.contains('release-page')) return;
  const releasePage = false;
  const first = document.querySelector('.t1 img');
  const third = document.querySelector(releasePage ? '.t3 .spin' : '.t3 img');
  const fourth = document.querySelector(releasePage ? '.t4 video' : '.t4 img');
  if (!first || !third || !fourth) return;
  let alignmentFrame = 0;

  const settleImageBaseline = remaining => {
    if (window.innerWidth <= 800) return;
    const targetBottom = first.getBoundingClientRect().bottom;
    const thirdBox = third.getBoundingClientRect();
    const fourthBox = fourth.getBoundingClientRect();
    const thirdDelta = targetBottom - thirdBox.bottom;
    const fourthDelta = targetBottom - fourthBox.bottom;
    if (Math.abs(thirdDelta) < .5 && Math.abs(fourthDelta) < .5) return;
    third.style.height = `${Math.max(1, thirdBox.height + thirdDelta)}px`;
    fourth.style.height = `${Math.max(1, fourthBox.height + fourthDelta)}px`;
    if (remaining > 0) alignmentFrame = requestAnimationFrame(() => settleImageBaseline(remaining - 1));
  };

  const scheduleAlignment = () => {
    cancelAnimationFrame(alignmentFrame);
    if (!first || !third || !fourth) return;
    if (window.innerWidth <= 800) {
      third.style.height = '';
      fourth.style.height = '';
      return;
    }
    third.style.height = '';
    fourth.style.height = '';
    alignmentFrame = requestAnimationFrame(() => settleImageBaseline(12));
  };
  window.addEventListener('load', scheduleAlignment);
  window.addEventListener('resize', scheduleAlignment, {passive:true});
  first.addEventListener('load', scheduleAlignment, {once:true});
  if (releasePage) fourth.addEventListener('loadedmetadata', scheduleAlignment, {once:true});
  else fourth.addEventListener('load', scheduleAlignment, {once:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleAlignment);
  scheduleAlignment();
})();
