const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));

const hero=$('#hero'), heroVideo=$('#heroVideo'), heroVideoStatus=$('#heroVideoStatus');
const copies=$$('.hero-copy'), progressBar=$('#heroProgressBar'), progressNumber=$('#heroProgressNumber'), header=$('#siteHeader');
const lightingVisual=$('#lightingVisual'), lightingVideos=[$('#lightingVideoA'),$('#lightingVideoB')].filter(Boolean);
const lightingLabel=$('#lightingLabel'), lightingMoodName=$('#lightingMoodName'), lightTabs=$$('.light-tab');
let heroDuration=5.041667, heroReady=false, heroProgress=0, pendingSeek=null, mediaUrl=null;
let activeLightingFrame=0, activeLightingKey='warm', lightingToken=0, lightingReady=false;

const moodMap={
  warm:{time:.55,label:'2700K',name:'meleg hangulat'},
  neutral:{time:1.55,label:'4000K',name:'semleges fény'},
  cyan:{time:2.65,label:'Hűvös',name:'hideg hangulat'},
  violet:{time:4.05,label:'RGB',name:'színes hangulat'}
};

async function loadPreviewVideo(){
  try{
    const files=Array.from({length:6},(_,i)=>`media/mid-${String(i).padStart(2,'0')}.b64`);
    const parts=await Promise.all(files.map(async f=>{const r=await fetch(f,{cache:'force-cache'});if(!r.ok)throw new Error(f);return (await r.text()).trim()}));
    const raw=atob(parts.join(''));
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    mediaUrl=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));
    [heroVideo,...lightingVideos].forEach(v=>{if(!v)return;v.src=mediaUrl;v.load();});
  }catch(err){console.error('EDVILL preview video load failed',err);if(heroVideoStatus)heroVideoStatus.textContent='A hero videó nem tölthető be';}
}

function seekHero(progress){
  if(!heroReady||!heroVideo)return;
  const target=clamp(progress)*Math.max(.001,heroDuration-.002);
  if(Math.abs(heroVideo.currentTime-target)<.012)return;
  pendingSeek=target;
  if(!heroVideo.seeking){heroVideo.currentTime=pendingSeek;pendingSeek=null;}
}

heroVideo?.addEventListener('loadedmetadata',()=>{
  if(Number.isFinite(heroVideo.duration)&&heroVideo.duration>0)heroDuration=heroVideo.duration;
  heroReady=true;heroVideo.pause();seekHero(heroProgress);heroVideoStatus?.classList.add('is-hidden');
});
heroVideo?.addEventListener('canplay',()=>{heroReady=true;heroVideo.pause();seekHero(heroProgress);heroVideoStatus?.classList.add('is-hidden')});
heroVideo?.addEventListener('seeked',()=>{if(pendingSeek!==null&&Math.abs(heroVideo.currentTime-pendingSeek)>=.012){const n=pendingSeek;pendingSeek=null;heroVideo.currentTime=n}else pendingSeek=null});

function updateHero(){
  if(!hero)return;
  const rect=hero.getBoundingClientRect(), scrollable=hero.offsetHeight-innerHeight;
  const p=clamp(-rect.top/Math.max(scrollable,1));heroProgress=p;seekHero(p);
  const idx=p<.24?0:p<.49?1:p<.73?2:3;copies.forEach((c,i)=>c.classList.toggle('is-active',i===idx));
  if(progressBar)progressBar.style.height=`${Math.round(p*100)}%`;
  if(progressNumber)progressNumber.textContent=String(Math.round(p*100)).padStart(2,'0');
  header?.classList.toggle('is-solid',rect.bottom<innerHeight*.55);
}
let ticking=false;addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{updateHero();ticking=false});ticking=true}},{passive:true});
addEventListener('resize',updateHero);addEventListener('pageshow',updateHero);updateHero();

function seekVideo(v,time){return new Promise(resolve=>{
  if(!v||!Number.isFinite(time)){resolve();return}
  const done=()=>{v.removeEventListener('seeked',done);resolve()};
  if(Math.abs(v.currentTime-time)<.025){resolve();return}
  v.addEventListener('seeked',done,{once:true});v.currentTime=Math.min(Math.max(time,0),Math.max(.01,(v.duration||heroDuration)-.02));
  setTimeout(done,900);
})}

lightingVideos.forEach((v,i)=>v?.addEventListener('loadedmetadata',async()=>{
  v.pause();
  if(i===0){await seekVideo(v,moodMap.warm.time);lightingReady=true}
  else await seekVideo(v,moodMap.warm.time);
},{once:true}));

async function setLightingMood(key){
  const mood=moodMap[key];if(!mood||key===activeLightingKey||!lightingReady||lightingVideos.length<2)return;
  const token=++lightingToken,nextIndex=activeLightingFrame===0?1:0,current=lightingVideos[activeLightingFrame],next=lightingVideos[nextIndex];
  lightTabs.forEach(t=>{const on=t.dataset.light===key;t.classList.toggle('is-active',on);t.setAttribute('aria-selected',String(on))});
  lightingVisual?.classList.add('is-changing');next.classList.remove('is-visible');next.setAttribute('aria-hidden','true');next.pause();
  await seekVideo(next,mood.time);if(token!==lightingToken)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(token!==lightingToken)return;next.classList.add('is-visible');next.removeAttribute('aria-hidden');current.classList.remove('is-visible');current.setAttribute('aria-hidden','true');
    if(lightingLabel)lightingLabel.textContent=mood.label;if(lightingMoodName)lightingMoodName.textContent=mood.name;
    lightingVisual?.setAttribute('data-active-light',key);activeLightingFrame=nextIndex;activeLightingKey=key;
    setTimeout(()=>{if(token===lightingToken)lightingVisual?.classList.remove('is-changing')},760);
  }));
}
lightTabs.forEach((btn,index)=>{
  btn.addEventListener('click',()=>setLightingMood(btn.dataset.light));
  btn.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let n=index;if(e.key==='ArrowRight')n=(index+1)%lightTabs.length;if(e.key==='ArrowLeft')n=(index-1+lightTabs.length)%lightTabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=lightTabs.length-1;lightTabs[n].focus();setLightingMood(lightTabs[n].dataset.light)});
});

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});$$('.reveal').forEach(el=>observer.observe(el));
const menuButton=$('.menu-button'),mobileMenu=$('#mobileMenu');menuButton?.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));mobileMenu.setAttribute('aria-hidden',String(!open))});mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');mobileMenu.setAttribute('aria-hidden','true')}));
loadPreviewVideo();