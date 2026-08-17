const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const hero=$('#hero'),heroVideo=$('#heroVideo'),heroVideoStatus=$('#heroVideoStatus');
const copies=$$('.hero-copy'),progressBar=$('#heroProgressBar'),progressNumber=$('#heroProgressNumber'),header=$('#siteHeader');
const lightingVisual=$('#lightingVisual'),lightingVideos=[$('#lightingVideoA'),$('#lightingVideoB')].filter(Boolean),lightingLabel=$('#lightingLabel'),lightingMoodName=$('#lightingMoodName'),lightTabs=$$('.light-tab');
let heroDuration=5.041667,heroReady=false,heroProgress=0,pendingSeek=null;
let activeLightingFrame=0,activeLightingKey='warm',lightingToken=0,lightingReady=false;
const moodMap={warm:{time:.55,label:'2700K',name:'meleg hangulat'},neutral:{time:1.55,label:'4000K',name:'semleges fény'},cyan:{time:2.65,label:'Hűvös',name:'hideg hangulat'},violet:{time:4.05,label:'RGB',name:'színes hangulat'}};

function applyHQVideo(){
  const url='media/edvill-scroll-hq.mp4?v=20260817-0745';
  if(heroVideo){heroVideo.src=url;heroVideo.preload='auto';heroVideo.load()}
  if(heroVideoStatus)heroVideoStatus.textContent='1080p fény betöltése…';

  const loadLightingVideos=()=>{
    lightingVideos.forEach(v=>{if(!v||v.src)return;v.src=url;v.preload='metadata';v.load()});
  };
  if(lightingVisual){
    const mediaObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadLightingVideos();mediaObserver.disconnect()}},{rootMargin:'500px 0px'});
    mediaObserver.observe(lightingVisual);
  }
}

function seekHero(progress){
  if(!heroReady||!heroVideo)return;
  const target=clamp(progress)*Math.max(.001,heroDuration-.002);
  if(Math.abs(heroVideo.currentTime-target)<.012)return;
  pendingSeek=target;
  if(!heroVideo.seeking){heroVideo.currentTime=pendingSeek;pendingSeek=null}
}
heroVideo?.addEventListener('loadedmetadata',()=>{if(Number.isFinite(heroVideo.duration)&&heroVideo.duration>0)heroDuration=heroVideo.duration;heroReady=true;heroVideo.pause();seekHero(heroProgress);heroVideoStatus?.classList.add('is-hidden')});
heroVideo?.addEventListener('canplay',()=>{heroReady=true;heroVideo.pause();seekHero(heroProgress);heroVideoStatus?.classList.add('is-hidden')});
heroVideo?.addEventListener('error',()=>{if(heroVideoStatus){heroVideoStatus.textContent='A 1080p videó nem tölthető be';heroVideoStatus.classList.remove('is-hidden')}});
heroVideo?.addEventListener('seeked',()=>{if(pendingSeek!==null&&Math.abs(heroVideo.currentTime-pendingSeek)>=.012){const n=pendingSeek;pendingSeek=null;heroVideo.currentTime=n}else pendingSeek=null});

function updateHero(){
  if(!hero)return;
  const rect=hero.getBoundingClientRect(),scrollable=hero.offsetHeight-innerHeight,p=clamp(-rect.top/Math.max(scrollable,1));
  heroProgress=p;seekHero(p);
  const idx=p<.235?0:p<.255?-1:p<.48?1:p<.50?-1:p<.72?2:p<.74?-1:3;copies.forEach((c,i)=>c.classList.toggle('is-active',i===idx));
  if(progressBar)progressBar.style.height=`${Math.round(p*100)}%`;
  if(progressNumber)progressNumber.textContent=String(Math.round(p*100)).padStart(2,'0');
  header?.classList.toggle('is-solid',rect.bottom<innerHeight*.55)
}
let ticking=false;addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{updateHero();ticking=false});ticking=true}},{passive:true});addEventListener('resize',updateHero);addEventListener('pageshow',updateHero);updateHero();

function seekVideo(v,time){return new Promise(resolve=>{if(!v||!Number.isFinite(time)){resolve();return}let settled=false;const done=()=>{if(settled)return;settled=true;v.removeEventListener('seeked',done);resolve()};if(Math.abs(v.currentTime-time)<.025){resolve();return}v.addEventListener('seeked',done,{once:true});v.currentTime=Math.min(Math.max(time,0),Math.max(.01,(v.duration||heroDuration)-.02));setTimeout(done,1100)})}
lightingVideos.forEach((v,i)=>v?.addEventListener('loadedmetadata',async()=>{v.pause();await seekVideo(v,moodMap.warm.time);if(i===0)lightingReady=true},{once:true}));
async function setLightingMood(key){
  const mood=moodMap[key];if(!mood||key===activeLightingKey||!lightingReady||lightingVideos.length<2)return;
  const token=++lightingToken,nextIndex=activeLightingFrame===0?1:0,current=lightingVideos[activeLightingFrame],next=lightingVideos[nextIndex];
  lightTabs.forEach(t=>{const on=t.dataset.light===key;t.classList.toggle('is-active',on);t.setAttribute('aria-selected',String(on))});
  lightingVisual?.classList.add('is-changing');next.classList.remove('is-visible');next.setAttribute('aria-hidden','true');next.pause();await seekVideo(next,mood.time);if(token!==lightingToken)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token!==lightingToken)return;next.classList.add('is-visible');next.removeAttribute('aria-hidden');current.classList.remove('is-visible');current.setAttribute('aria-hidden','true');if(lightingLabel)lightingLabel.textContent=mood.label;if(lightingMoodName)lightingMoodName.textContent=mood.name;lightingVisual?.setAttribute('data-active-light',key);activeLightingFrame=nextIndex;activeLightingKey=key;setTimeout(()=>{if(token===lightingToken)lightingVisual?.classList.remove('is-changing')},760)}))
}
lightTabs.forEach((btn,index)=>{btn.addEventListener('click',()=>setLightingMood(btn.dataset.light));btn.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let n=index;if(e.key==='ArrowRight')n=(index+1)%lightTabs.length;if(e.key==='ArrowLeft')n=(index-1+lightTabs.length)%lightTabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=lightTabs.length-1;lightTabs[n].focus();setLightingMood(lightTabs[n].dataset.light)})});

const referenceProjects=[
  {key:'terasz',name:'Terasz',tag:'Kültéri fény',image:'assets/references/terasz.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/09/IMG_20240808_200700-scaled.jpg',lead:'Meleg, visszafogott fény a terasz használható és hangulatos esti teréhez.',detail:'Kültéri világítás · meleg fény · esti hangulat'},
  {key:'konyha',name:'Konyha',tag:'Munkafény',image:'assets/references/konyha.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/09/11423756_994880383931379_774657023032516576_o-1-1024x614-1.jpg',lead:'Pontosan oda kerül fény, ahol dolgozol — a háttérben pedig megmarad az otthonos hangulat.',detail:'Pultvilágítás · LED profil · funkcionális fény'},
  {key:'rgb',name:'RGB világítás',tag:'Színes hangulat',image:'assets/references/rgb.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/09/IMG_9521-1024x576-1.jpg',lead:'Színes, vezérelhető fények olyan terekhez, ahol a hangulat is része az élménynek.',detail:'RGB LED · vezérlés · dinamikus fény'},
  {key:'szorakozohely',name:'Szórakozóhely',tag:'Atmoszféra',image:'assets/references/szorakozohely.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/07/448985721_1218784492872350_2689812110299741548_n-edited.jpg',lead:'A fény itt nem háttér: meghatározza az egész hely karakterét és ritmusát.',detail:'Dekorfény · hangulatvilágítás · karakter'},
  {key:'kert',name:'Kerti világítás',tag:'Kültér',image:'assets/references/kert.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/08/20201213_160905-1-scaled.jpg',lead:'Biztonság, irányfény és atmoszféra egy rendszerben, kültéri környezetre tervezve.',detail:'Kültéri LED · járdafény · hangulat'},
  {key:'furdoszoba',name:'Fürdőszoba',tag:'Funkcionális fény',image:'assets/references/furdoszoba.jpg?v=20260817-1038',fallback:'assets/references/furdoszoba.jpg?v=20260817-1038',lead:'Tiszta, jól használható fény a tükörnél és finom háttérvilágítás a térben.',detail:'Tükörfény · rejtett LED · IP-védelem'},
  {key:'mennyezet',name:'Mennyezeti LED',tag:'Rejtett fény',image:'assets/references/mennyezeti-led.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/07/IMG_9529-1024x768.jpg',lead:'A fényforrás eltűnik, a fény viszont építészeti elemmé válik.',detail:'Fényvonal · rejtett LED · indirekt fény'},
  {key:'haloszoba',name:'Hálószoba',tag:'Indirekt fény',image:'assets/references/haloszoba.jpg?v=20260817-1038',fallback:'https://edvill.hu/wp-content/uploads/2024/08/20201213_160915-1-1024x512.jpg',lead:'Lágy, rétegzett fény a pihenéshez — rejtett világítással és visszafogott esti hangulattal.',detail:'Indirekt LED · meleg fény · nyugodt hangulat'}
];

function injectReferenceExplorerStyles(){
  if($('#referenceExplorerStyles'))return;
  const style=document.createElement('style');style.id='referenceExplorerStyles';
  style.textContent=`
  .reference-explorer{background:#0b0d16;color:#fff;padding:112px 0 126px;overflow:hidden}.reference-explorer .container{position:relative}.reference-explorer-head{display:grid;grid-template-columns:.72fr 1.28fr;gap:60px;align-items:end;margin-bottom:42px}.reference-explorer .eyebrow{color:rgba(255,255,255,.48);margin-bottom:0}.reference-explorer h2{margin:0;font-size:clamp(2.25rem,4vw,4rem);line-height:.96;letter-spacing:-.055em;max-width:720px}.reference-explorer-intro{margin:14px 0 0;max-width:590px;color:rgba(255,255,255,.58);font-size:15px;line-height:1.65}
  .reference-explorer-grid{display:grid;grid-template-columns:1.6fr .8fr .8fr;grid-template-rows:220px 220px 220px;gap:12px}.reference-card{position:relative;overflow:hidden;border:0;padding:0;background:#171922;color:#fff;cursor:pointer;min-width:0;text-align:left;border-radius:5px;isolation:isolate}.reference-card::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 38%,rgba(3,4,7,.78) 100%);z-index:1;transition:.35s}.reference-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .55s cubic-bezier(.22,.61,.36,1),filter .35s;filter:saturate(.94) contrast(1.02)}.reference-card:hover img,.reference-card:focus-visible img{transform:scale(1.035)}.reference-card:hover::after,.reference-card:focus-visible::after{background:linear-gradient(180deg,rgba(0,0,0,.02) 25%,rgba(3,4,7,.86) 100%)}.reference-card.is-active{outline:1px solid rgba(204,255,26,.72);outline-offset:-1px}.reference-card.is-featured{grid-row:span 2}.reference-card:nth-child(4){grid-column:2/4}.reference-card:nth-child(7){grid-column:1/2}.reference-card:nth-child(8){grid-column:2/4}.reference-card-copy{position:absolute;z-index:2;left:18px;right:18px;bottom:16px;display:flex;align-items:end;justify-content:space-between;gap:14px}.reference-card-copy strong{font-size:17px;letter-spacing:-.025em}.reference-card-copy small{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.58)}
  .reference-detail{margin-top:14px;display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.reference-detail-main,.reference-detail-meta{min-height:170px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.035);padding:24px}.reference-detail-main{display:flex;flex-direction:column;justify-content:space-between}.reference-detail-kicker{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--lime);font-weight:800}.reference-detail-main h3{margin:20px 0 8px;font-size:27px;letter-spacing:-.04em}.reference-detail-main p{margin:0;color:rgba(255,255,255,.62);font-size:14px;line-height:1.6;max-width:650px}.reference-detail-meta{display:flex;align-items:flex-end;gap:24px}.reference-detail-meta span{display:block;max-width:420px;color:rgba(255,255,255,.7);font-size:13px;line-height:1.6}
  @media(max-width:1000px){.reference-explorer-head{grid-template-columns:1fr;gap:18px}.reference-explorer-grid{grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,220px)}.reference-card.is-featured{grid-column:1/3;grid-row:span 1}.reference-card:nth-child(4),.reference-card:nth-child(7),.reference-card:nth-child(8){grid-column:auto}.reference-detail{grid-template-columns:1fr}.reference-detail-meta{min-height:130px}}
  @media(max-width:650px){.reference-explorer{padding:86px 0 94px}.reference-explorer-grid{grid-template-columns:1fr;grid-template-rows:none}.reference-card,.reference-card.is-featured{grid-column:auto!important;grid-row:auto!important;min-height:220px}.reference-card:first-child{min-height:330px}.reference-detail-main,.reference-detail-meta{padding:20px}.reference-detail-meta{align-items:flex-start;flex-direction:column}.reference-explorer h2{font-size:2.25rem}}
  `;document.head.appendChild(style)
}

function initReferenceExplorer(){
  const services=$('.section-services');if(!services||$('#referenciak'))return;
  injectReferenceExplorerStyles();
  const cards=referenceProjects.map((p,i)=>`<button class="reference-card ${i===0?'is-featured is-active':''}" type="button" data-reference="${p.key}" aria-pressed="${i===0?'true':'false'}"><img src="${p.image}" data-fallback="${p.fallback||''}" alt="EDVILL referencia — ${p.name}" loading="${i===0?'eager':'lazy'}"><span class="reference-card-copy"><span><small>${p.tag}</small><strong>${p.name}</strong></span></span></button>`).join('');
  const first=referenceProjects[0];
  services.insertAdjacentHTML('beforebegin',`<section class="reference-explorer reveal" id="referenciak"><div class="container"><div class="reference-explorer-head"><div class="eyebrow">Referenciák</div><div><h2>Terek, amiket már fényre hangoltunk.</h2><p class="reference-explorer-intro">Valódi EDVILL megvalósítások. Világítás különböző terekben, különböző funkciókra hangolva.</p></div></div><div class="reference-explorer-grid">${cards}</div><div class="reference-detail" aria-live="polite"><div class="reference-detail-main"><span class="reference-detail-kicker" id="referenceDetailTag">${first.tag}</span><div><h3 id="referenceDetailTitle">${first.name}</h3><p id="referenceDetailLead">${first.lead}</p></div></div><div class="reference-detail-meta"><span id="referenceDetailMeta">${first.detail}</span></div></div></div></section>`);
  const section=$('#referenciak');observer.observe(section);
  const buttons=[...section.querySelectorAll('.reference-card')];
  section.querySelectorAll('.reference-card img').forEach(img=>img.addEventListener('error',()=>{const fallback=img.dataset.fallback;if(fallback&&img.src!==fallback){img.dataset.fallback='';img.src=fallback}}));
  const tag=$('#referenceDetailTag'),title=$('#referenceDetailTitle'),lead=$('#referenceDetailLead'),meta=$('#referenceDetailMeta');
  const selectProject=key=>{const p=referenceProjects.find(x=>x.key===key);if(!p)return;buttons.forEach(btn=>{const active=btn.dataset.reference===key;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});tag.textContent=p.tag;title.textContent=p.name;lead.textContent=p.lead;meta.textContent=p.detail};
  buttons.forEach(btn=>btn.addEventListener('click',()=>selectProject(btn.dataset.reference)));
}

function applyInterfaceCleanup(){
  $$('.desktop-nav a,.mobile-menu a').forEach(a=>{if(a.textContent.trim()==='Referenciák')a.remove()});
  $$('.service-arrow').forEach(el=>el.remove());

  if(!$('#edvillUxFixes')){
    const style=document.createElement('style');style.id='edvillUxFixes';
    style.textContent=`
      .hero-copy{visibility:hidden;transition:none!important;}
      .hero-copy.is-active{visibility:visible;transition:opacity .2s ease .07s,transform .28s ease .07s!important;}
      .service-row{grid-template-columns:70px .78fr 1.35fr;}
      @media(max-width:900px){.service-row{grid-template-columns:54px 1fr;}.service-row p{grid-column:2;}}
      @media(max-width:620px){.service-row{grid-template-columns:42px 1fr;gap:16px;}}
    `;
    document.head.appendChild(style);
  }
}

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});$$('.reveal').forEach(el=>observer.observe(el));
const menuButton=$('.menu-button'),mobileMenu=$('#mobileMenu');menuButton?.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));mobileMenu.setAttribute('aria-hidden',String(!open))});mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');mobileMenu.setAttribute('aria-hidden','true')}));
applyInterfaceCleanup();
initReferenceExplorer();
applyHQVideo();