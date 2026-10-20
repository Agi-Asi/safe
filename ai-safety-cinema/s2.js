
(function(){
const D=window.DATA,P=D.picks,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app');
const LV=[...new Set(P.map(p=>p.level))];
const BY=new Map();P.forEach(p=>BY.set(p.id,p));D.library.forEach(v=>{if(!BY.has(v.id))BY.set(v.id,v)});
const ALL=[...BY.values()];
function isSandboxed(){if(/github\.io$/.test(location.hostname))return false;try{if(location.origin==='null')return true;document.cookie;return false}catch(e){return true}}
const SB=isSandboxed();
// storage
const KEY='aisc_watched';let mem=[];
function load(){try{return new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(e){return new Set(mem)}}
const W=load();
function save(){mem=[...W];try{localStorage.setItem(KEY,JSON.stringify(mem))}catch(e){}}
// helpers
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const secs=l=>String(l||'0').split(':').reduce((a,b)=>a*60+(+b||0),0);
const fv=n=>n>=1e9?(n/1e9).toFixed(1).replace(/\.0$/,'')+'B':n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':n>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':String(n);
const hrs=s=>(s/3600).toFixed(1).replace(/\.0$/,'');
const stars=n=>typeof n==='number'?'★'.repeat(n)+'☆'.repeat(Math.max(0,5-n)):esc(n);
const thumb=id=>`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const FB=`this.onerror=null;this.src=this.src.replace('hqdefault','mqdefault')`;
const img=(id,alt='')=>`<img loading="lazy" src="${thumb(id)}" onerror="${FB}" alt="${esc(alt)}">`;
const agoD=a=>{const m=/(\d+|an?)\s+(second|minute|hour|day|week|month|year)/.exec(a||'');if(!m)return 1e6;const n=/\d/.test(m[1])?+m[1]:1;return n*{second:0,minute:0,hour:.04,day:1,week:7,month:30,year:365}[m[2]]};
const ytUrl=(id,t)=>`https://www.youtube.com/watch?v=${id}${t?'&t='+t+'s':''}`;
const poster=(id,t)=>`<a class="poster" href="${ytUrl(id,t)}" target="_blank" rel="noopener" aria-label="Play on YouTube">${img(id)}<b>▶</b></a>`;
const ring=(f,txt,sub)=>{const c=2*Math.PI*52;return `<svg viewBox="0 0 120 120" class="ring" role="img" aria-label="${esc(txt+' '+sub)}"><circle cx="60" cy="60" r="52" class="rb"/><circle cx="60" cy="60" r="52" class="rf" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-f)}" transform="rotate(-90 60 60)"/><text x="60" y="62" text-anchor="middle" class="rt">${txt}</text><text x="60" y="82" text-anchor="middle" class="rs">${sub}</text></svg>`};
const lvlStat=L=>{const it=P.filter(p=>p.level===L);const n=it.filter(p=>W.has(p.id)).length;return{n,t:it.length}};

const card=(v,o={})=>`<article class="card rv">
<a class="th" href="#/watch/${v.id}">${img(v.id,v.title)}<span class="len">${esc(v.len)}</span></a>
<div class="cb"><h3><a href="#/watch/${v.id}">${esc(v.title)}</a></h3>
<p class="meta">${esc((v.ch||'').trim())} · ${fv(v.views)} views · ${esc(v.ago)}${v.audio?' · '+esc(v.audio):''}</p>
${v.rating?`<p class="stars" aria-label="${v.rating} of 5">${stars(v.rating)}</p>`:''}
${v.why?`<p class="why">${esc(v.why)}</p>`:''}
<div class="acts"><a class="btn sm amb" href="#/watch/${v.id}">▶ Play</a><label class="wl"><input type="checkbox" data-w="${v.id}" ${W.has(v.id)?'checked':''}> Watched</label></div></div></article>`;
const progBar=L=>{const s=lvlStat(L);return `<div data-prog="${esc(L)}"><div class="bar"><i style="width:${s.n/s.t*100}%"></i></div><span class="prog"><b>${s.n}/${s.t}</b> watched</span></div>`};
function updProg(){$$('[data-prog]').forEach(el=>{const s=lvlStat(el.dataset.prog);$('i',el).style.width=s.n/s.t*100+'%';$('b',el).textContent=`${s.n}/${s.t}`});$$('.tlist button').forEach(b=>b.querySelector('.wd')&&(b.querySelector('.wd').textContent=W.has(b.dataset.id)?'✓ watched':''))}
function mark(id,on=true){on?W.add(id):W.delete(id);save();$$(`[data-w="${id}"]`).forEach(c=>c.checked=on);updProg()}
const ph=(k,t,p)=>`<section class="ph wrap"><p class="kicker rv">${k}</p><h1 class="rv">${t}</h1>${p?`<p class="rv">${p}</p>`:''}</section>`;

// nav
const NAV=[['','Home'],['path','Path'],['theater','Theater'],['library','Library'],['bengio','Bengio'],['podcasts','Podcasts'],['ideas','Big Ideas'],['glossary','Glossary'],['quiz','Quiz'],['progress','Progress']];
$('#links').innerHTML=NAV.map(([r,l])=>`<a href="#/${r}" data-r="${r}">${l}</a>`).join('');
$('#burger').onclick=()=>{const o=$('#nav').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};

// ---------- pages ----------
const TILES=[['path','Learning Path','Beginner to frontier, in order.'],['theater','Theater','Continuous, autoplaying, lights out.'],['library','Library','All 351 videos, searchable.'],['bengio','Bengio','A Turing laureate changes course.'],['podcasts','Podcasts','Long conversations for long walks.'],['ideas','The Big Ideas','13 ideas, distilled from transcripts.'],['glossary','Glossary','The vocabulary, on flip cards.'],['quiz','Quiz','Twelve questions. How sharp are you?'],['progress','Progress','What you have watched so far.']];
function home(){
  const now=new Date(),doy=Math.floor((now-new Date(now.getFullYear(),0,0))/864e5),t=P[doy%P.length];
  return `<section class="hero"><img src="${$('#heroSrc').getAttribute('src')}" alt="A lone figure facing a giant glowing neural lattice in the dark"><canvas id="pc" aria-hidden="true"></canvas>
<div class="wrap"><p class="kicker rv">The most important conversation of our century.</p>
<h1 class="rv">AI SAFETY <em>CINEMA</em></h1>
<p class="tag rv">Watch. Understand. Decide.</p>
<p class="sub rv">From first principles to frontier research. 101 hand-picked films, talks and podcasts, plus 250 more.</p>
<div class="row rv"><a class="btn amb" href="#/path">Start the Journey →</a><a class="btn" href="#/theater">Enter Theater</a></div></div></section>
<section class="sec wrap"><div class="stats">${[[P.length,'Curated'],[D.library.length,'Library'],[D.ideas.length,'Big ideas'],[D.quiz.length,'Quiz questions']].map(([n,l])=>`<div class="stat rv"><b data-count="${n}">0</b><span>${l}</span></div>`).join('')}</div></section>
<section class="sec wrap"><p class="kicker rv">Today's pick</p><div class="today rv"><a class="th" href="#/watch/${t.id}">${img(t.id,t.title)}<span class="len">${esc(t.len)}</span></a>
<div><p class="stars">${stars(t.rating)} · ${esc(t.level)}</p><h2 class="h2">${esc(t.title)}</h2><p class="meta">${esc(t.ch.trim())} · ${fv(t.views)} views · ${esc(t.ago)}</p><p>${esc(t.why)}</p><a class="btn amb" href="#/watch/${t.id}">▶ Watch now</a></div></div></section>
<section class="sec wrap"><h2 class="h2 rv">Where to go next</h2><div class="tiles">${TILES.map(([r,h,p])=>`<a class="tile rv" href="#/${r}"><h3>${h}</h3><p>${p}</p></a>`).join('')}</div></section>`;
}
function path(){
  return ph('Learning path','From first principles <span class="glow-a">to the frontier.</span>','Five stages, in order. Tick each film as you finish it.')+
  `<section class="wrap">${LV.map(L=>`<div class="lvl"><div class="lvh rv"><h2 class="h2" style="margin:0">${esc(L)}</h2>${progBar(L)}</div><div class="tl">${P.filter(p=>p.level===L).map(p=>`<div class="item"><span class="node"></span>${card(p)}</div>`).join('')}</div></div>`).join('')}</section>`;
}
const listPage=(k,t,p,items)=>ph(k,t,p)+`<section class="wrap"><div class="grid">${items.map(v=>card(v)).join('')}</div></section>`;
function bengio(){
  const it=P.filter(p=>p.level.includes('Bengio'));
  return `<section class="ph wrap"><p class="kicker rv">Tribute</p><h1 class="rv">Yoshua <span class="glow-c">Bengio</span></h1>
<p class="rv">A founder of deep learning who turned his life's work toward making it safe.</p>
<blockquote class="quote rv">“We need to build AI that is a scientist, not an agent: honest, non-agentic, a guardrail for the rest.”</blockquote>
<p class="meta rv">Paraphrase of his TED talk, “The Catastrophic Risks of AI — and a Safer Path”.</p></section>
<section class="wrap"><div class="lvh rv"><h2 class="h2" style="margin:0">${it.length} films</h2>${it.length&&LV.includes('Bengio')?progBar('Bengio'):''}</div><div class="grid">${it.map(v=>card(v)).join('')}</div></section>`;
}
function podcasts(){
  const it=P.filter(p=>p.level.includes('Podcast')),s=it.reduce((a,v)=>a+secs(v.len),0);
  return listPage('Podcasts',`Long conversations, <span class="glow-a">${hrs(s)} hours</span> of them.`,`${it.length} episodes with researchers, founders and critics. Best with headphones.`,it);
}
function ideas(){
  return ph('The Big Ideas','Thirteen ideas <span class="glow-c">worth losing sleep over.</span>','Distilled from full transcripts of core videos.')+
  `<section class="wrap">${D.ideas.map(i=>`<article class="idea rv"><div class="n">${String(i.n).padStart(2,'0')}</div><div><h2>${esc(i.title)}</h2><p>${esc(i.text)}</p><div class="chips">${i.videos.map(id=>{const v=BY.get(id);return `<a class="chip" href="#/watch/${id}" title="${esc(v?v.title:id)}">▶ ${esc(v?v.title:id)}</a>`}).join('')}</div></div></article>`).join('')}
<div class="idea rv" style="grid-template-columns:1fr"><div><p class="kicker">There is still time</p><h2>What can we do?</h2>
<div class="tiles" style="margin-top:20px">
<div class="tile"><h3>Learn the basics</h3><p>Follow the <a class="yt" href="#/path">learning path</a>; understanding comes before action.</p></div>
<div class="tile"><h3>Support the work</h3><p>Back safety research and sensible governance, with attention, votes and money.</p></div>
<div class="tile"><h3>Talk about it</h3><p>Share one film with one person. Public understanding shapes policy.</p></div>
<div class="tile"><h3>Consider a career</h3><p>Technical or policy work. Start at <a class="yt" href="https://80000hours.org/problem-profiles/artificial-intelligence/" target="_blank" rel="noopener">80,000 Hours</a>.</p></div>
</div></div></div></section>`;
}
function moments(id,n){
  if(!n||!n.moments||!n.moments.length)return'';
  return `<div class="panel"><h3>Key moments</h3>${n.moments.map(m=>SB?`<a class="mom" href="${ytUrl(id,m.t)}" target="_blank" rel="noopener"><span class="mt">${esc(m.label)}</span><span>${esc(m.text)}</span></a>`:`<button class="mom" data-seek="${m.t}"><span class="mt">${esc(m.label)}</span><span>${esc(m.text)}</span></button>`).join('')}</div>`;
}
const notes=(id,n)=>n?`<div class="panel"><h3>Summary</h3><p>${esc(n.summary)}</p>${n.takeaways&&n.takeaways.length?`<h3 style="margin-top:16px">Takeaways</h3><ul>${n.takeaways.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}</div>${moments(id,n)}`:'';
const embed=(id,s)=>`<iframe id="wf" src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&start=${s|0}" title="YouTube video player" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
function watch(id){
  const v=BY.get(id)||{id,title:'Video',ch:'',len:'',views:0,ago:''},n=D.videoNotes[id];
  const i=P.findIndex(p=>p.id===id),up=(i>=0?P.slice(i+1,i+6):P.slice(0,5));
  return `<section class="wrap" style="padding-top:28px"><div class="player">${SB?poster(id):embed(id,0)}</div>
<div class="wgrid"><div><p class="kicker">${esc(v.level||'Library')}</p><h1 class="h2">${esc(v.title)}</h1>
<p class="meta">${esc((v.ch||'').trim())}${v.views?' · '+fv(v.views)+' views':''}${v.ago?' · '+esc(v.ago):''}${v.len?' · '+esc(v.len):''}${v.audio?' · '+esc(v.audio):''}</p>
${v.rating?`<p class="stars">${stars(v.rating)}</p>`:''}${v.why?`<p>${esc(v.why)}</p>`:''}
<div class="row" style="margin:16px 0 24px"><label class="wl btn"><input type="checkbox" data-w="${id}" ${W.has(id)?'checked':''}> Watched</label><a class="yt" href="${ytUrl(id)}" target="_blank" rel="noopener">Open on YouTube ↗</a></div>
${notes(id,n)}</div>
<aside><div class="panel"><h3>Up next</h3>${up.map(u=>`<a class="mini" href="#/watch/${u.id}">${img(u.id)}<span>${esc(u.title)}<br><small class="meta">${esc(u.len)}</small></span></a>`).join('')}</div></aside></div></section>`;
}
// library
const LS={q:'',ch:'',len:'',sort:'',view:'grid'};
function library(){
  const chs=[...new Set(ALL.map(v=>(v.ch||'').trim()))].sort((a,b)=>a.localeCompare(b));
  return ph('Library','Every film, <span class="glow-a">one search away.</span>',`${P.length} curated picks plus ${D.library.length} more.`)+
  `<section class="wrap"><div class="tbar"><input type="search" id="lq" placeholder="Search titles and channels…" aria-label="Search" value="${esc(LS.q)}">
<select id="lc" aria-label="Channel"><option value="">All channels</option>${chs.map(c=>`<option ${c===LS.ch?'selected':''}>${esc(c)}</option>`).join('')}</select>
<select id="ll" aria-label="Length">${[['','Any length'],['s','Under 15m'],['m','15–60m'],['l','1h+']].map(([v,l])=>`<option value="${v}" ${v===LS.len?'selected':''}>${l}</option>`).join('')}</select>
<select id="lo" aria-label="Sort">${[['','Curated order'],['views','Most viewed'],['len','Longest'],['new','Newest']].map(([v,l])=>`<option value="${v}" ${v===LS.sort?'selected':''}>${l}</option>`).join('')}</select>
<button class="btn" id="lv">${LS.view==='grid'?'☰ List':'▦ Grid'}</button></div><p class="meta" id="lcount"></p><div id="lres"></div></section>`;
}
function libRender(){
  const q=LS.q.toLowerCase();
  let r=ALL.filter(v=>(!q||(v.title+' '+v.ch).toLowerCase().includes(q))&&(!LS.ch||(v.ch||'').trim()===LS.ch)&&(()=>{const s=secs(v.len);return !LS.len||(LS.len==='s'?s<900:LS.len==='m'?s>=900&&s<3600:s>=3600)})());
  if(LS.sort==='views')r.sort((a,b)=>b.views-a.views);else if(LS.sort==='len')r.sort((a,b)=>secs(b.len)-secs(a.len));else if(LS.sort==='new')r.sort((a,b)=>agoD(a.ago)-agoD(b.ago));
  $('#lcount').textContent=`Showing ${r.length} of ${ALL.length}`;
  $('#lres').innerHTML=r.length?`<div class="grid ${LS.view==='list'?'list':''}">${r.map(v=>card(v)).join('')}</div>`:'<p class="empty">Nothing matches. Try fewer filters.</p>';
  reveal();
}
function libInit(){
  $('#lq').oninput=e=>{LS.q=e.target.value;libRender()};
  $('#lc').onchange=e=>{LS.ch=e.target.value;libRender()};
  $('#ll').onchange=e=>{LS.len=e.target.value;libRender()};
  $('#lo').onchange=e=>{LS.sort=e.target.value;libRender()};
  $('#lv').onclick=e=>{LS.view=LS.view==='grid'?'list':'grid';e.target.textContent=LS.view==='grid'?'☰ List':'▦ Grid';libRender()};
  libRender();
}
// glossary
function glossary(){
  return ph('Glossary','The words <span class="glow-c">that matter.</span>','Tap a card to flip it.')+`<section class="wrap"><div class="tbar"><input type="search" id="gq" placeholder="Search terms…" aria-label="Search terms"></div><div class="grid" id="gres"></div></section>`;
}
function glInit(){
  const r=()=>{const q=$('#gq').value.toLowerCase();const g=D.glossary.filter(x=>(x.term+' '+x.def).toLowerCase().includes(q));
    $('#gres').innerHTML=g.length?g.map(x=>`<button class="flip" aria-label="${esc(x.term)}: flip for definition"><div class="in2"><div class="fa"><h3>${esc(x.term)}</h3><small>Tap to reveal ↻</small></div><div class="fb">${esc(x.def)}</div></div></button>`).join(''):'<p class="empty">No matching terms.</p>'};
  $('#gq').oninput=r;r();
  $('#gres').onclick=e=>{const f=e.target.closest('.flip');f&&f.classList.toggle('f')};
}
// quiz
let QZ={i:0,s:0};
function quiz(){return ph('Quiz','How well <span class="glow-a">do you understand?</span>',`${D.quiz.length} questions drawn from the films.`)+`<section class="wrap"><div class="qz" id="qz"></div></section>`}
function qRender(){
  const el=$('#qz');if(!el)return;
  if(QZ.i>=D.quiz.length){const n=D.quiz.length;
    el.innerHTML=`<div class="panel" style="text-align:center">${ring(QZ.s/n,`${QZ.s}/${n}`,'score')}<h2 class="h2" style="margin-top:16px">${QZ.s>=10?'Outstanding.':QZ.s>=7?'Solid grasp.':'Keep watching.'}</h2><p class="meta">${QZ.s>=10?'You clearly did the reading.':'The Learning Path covers every answer.'}</p><div class="row" style="justify-content:center"><button class="btn amb" id="qr">Retry</button><a class="btn" href="#/path">Learning path</a></div></div>`;
    $('#qr').onclick=()=>{QZ={i:0,s:0};qRender()};if(QZ.s>=10)confetti();return}
  const q=D.quiz[QZ.i];
  el.innerHTML=`<p class="kicker">Question ${QZ.i+1} of ${D.quiz.length} · Score ${QZ.s}</p><div class="bar" style="width:100%;margin-bottom:20px"><i style="width:${QZ.i/D.quiz.length*100}%"></i></div><h2 class="h2">${esc(q.q)}</h2>${q.options.map((o,k)=>`<button class="qopt" data-k="${k}">${esc(o)}</button>`).join('')}<div id="qf"></div>`;
  $$('.qopt',el).forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=k===q.answer;if(ok)QZ.s++;
    $$('.qopt',el).forEach((x,j)=>{x.disabled=true;if(j===q.answer)x.classList.add('ok');else if(j===k)x.classList.add('no')});
    $('#qf').innerHTML=`<div class="panel" style="margin-top:16px"><h3>${ok?'✓ Correct':'✗ Not quite'}</h3><p>${esc(q.why)}</p><button class="btn amb" id="qn">${QZ.i+1<D.quiz.length?'Next question →':'See your score'}</button></div>`;
    $('#qn').onclick=()=>{QZ.i++;qRender()};$('#qn').focus()});
}
let confRAF=0;
function confetti(){
  stopConf();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=document.createElement('canvas');c.id='conf';document.body.appendChild(c);const x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const cols=['#ffb547','#4fe3ff','#ffffff','#ff7ab6'],ps=Array.from({length:160},()=>({x:Math.random()*c.width,y:-20-Math.random()*c.height*.5,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,r:Math.random()*6,s:4+Math.random()*5,c:cols[Math.random()*4|0]}));
  const t0=performance.now();
  (function f(t){x.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.r+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
    if(t-t0<4500)confRAF=requestAnimationFrame(f);else stopConf()})(t0);
}
function stopConf(){cancelAnimationFrame(confRAF);const c=$('#conf');c&&c.remove()}
// progress
function progress(){
  const ws=ALL.filter(v=>W.has(v.id)),s=ws.reduce((a,v)=>a+secs(v.len),0),pw=P.filter(p=>W.has(p.id)).length;
  return ph('Progress','Your <span class="glow-c">journey</span> so far.')+`<section class="wrap"><div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))"><div class="stat rv"><b>${ws.length}</b><span>Videos watched</span></div><div class="stat rv"><b>${hrs(s)}</b><span>Hours watched</span></div><div class="stat rv"><b>${Math.round(pw/P.length*100)}%</b><span>Of the 101 curated</span></div></div>
<h2 class="h2 rv" style="margin-top:48px">By level</h2><div class="rings">${LV.map(L=>{const t=lvlStat(L);return `<div class="rv">${ring(t.n/t.t,`${t.n}/${t.t}`,'watched')}<h3>${esc(L)}</h3></div>`}).join('')}</div>
<div class="row" style="margin-top:48px"><a class="btn amb" href="#/path">Continue the path</a><button class="btn" id="reset">Reset progress</button></div></section>`;
}
// theater
let TQ=[],TI=0,yt=null,ytReady=false,ytPend=null,ytCbs=[],ytLoading=false;
function theater(){
  return `<section class="theater"><div class="wrap"><div class="tbar"><select id="tq" aria-label="Queue">${LV.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('')}<option value="all" selected>All 101</option><option value="shuffle">Shuffle</option></select>
<button class="btn" id="tp">⏮ Prev</button><button class="btn" id="tn">Next ⏭</button><button class="btn" id="tl">◐ Lights out</button><button class="btn" id="ts">☰ Playlist</button><span class="meta">Keys: N next · P prev · F fullscreen</span></div>
<div class="tgrid" id="tg"><div><div class="player" id="stage"></div><div id="tinfo" style="margin-top:20px"></div></div><aside class="tlist" id="tlist" aria-label="Playlist"></aside></div></div>
<button class="btn lo" id="tl2">◑ Lights on</button></section>`;
}
function ensureYT(cb){if(window.YT&&YT.Player)return cb();ytCbs.push(cb);if(ytLoading)return;ytLoading=true;
  const prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{prev&&prev();ytCbs.splice(0).forEach(f=>f())};
  const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>{const st=$('#stage');st&&(st.innerHTML=poster(TQ[TI].id))};document.head.appendChild(s)}
function setQ(v){TQ=v==='all'?P.slice():v==='shuffle'?P.slice().sort(()=>Math.random()-.5):P.filter(p=>p.level===v);TI=0;
  $('#tlist').innerHTML=TQ.map((p,i)=>`<button data-i="${i}" data-id="${p.id}">${img(p.id)}<span>${esc(p.title)}<small>${esc(p.len)} <span class="wd">${W.has(p.id)?'✓ watched':''}</span></small></span></button>`).join('');tPlay()}
function tPlay(){
  const v=TQ[TI],st=$('#stage');if(!v||!st)return;
  $$('#tlist button').forEach(b=>b.classList.toggle('cur',+b.dataset.i===TI));const cur=$('#tlist .cur');cur&&cur.scrollIntoView({block:'nearest'});
  $('#tinfo').innerHTML=`<p class="kicker">${TI+1} / ${TQ.length} · ${esc(v.level)}</p><h2 class="h2" style="margin-bottom:8px"><a href="#/watch/${v.id}">${esc(v.title)}</a></h2><p class="meta">${esc(v.ch.trim())} · ${esc(v.len)} · ${fv(v.views)} views</p>${notes(v.id,D.videoNotes[v.id])}`;
  if(SB){st.innerHTML=poster(v.id);return}
  if(yt){ytReady?yt.loadVideoById(v.id):ytPend=v.id;return}
  ensureYT(()=>{const s=$('#stage');if(!s||yt)return;s.innerHTML='<div id="ytp"></div>';
    yt=new YT.Player('ytp',{videoId:TQ[TI].id,playerVars:{autoplay:1,rel:0,playsinline:1},events:{
      onReady:()=>{ytReady=true;if(ytPend&&ytPend!==TQ[TI].id)yt.loadVideoById(TQ[TI].id);ytPend=null},
      onStateChange:e=>{if(e.data===YT.PlayerState.ENDED){mark(TQ[TI].id);tStep(1)}}}})});
}
function tStep(d){if(!TQ.length)return;TI=(TI+d+TQ.length)%TQ.length;tPlay()}
function lights(){document.body.classList.toggle('lights')}
function fs(){const el=$('#stage');if(!el)return;try{const p=document.fullscreenElement?document.exitFullscreen():el.requestFullscreen&&el.requestFullscreen();p&&p.catch&&p.catch(()=>{})}catch(e){}}
function thInit(){
  $('#tq').onchange=e=>setQ(e.target.value);$('#tp').onclick=()=>tStep(-1);$('#tn').onclick=()=>tStep(1);
  $('#tl').onclick=lights;$('#tl2').onclick=lights;$('#ts').onclick=()=>$('#tg').classList.toggle('closed');
  $('#tlist').onclick=e=>{const b=e.target.closest('button');if(b){TI=+b.dataset.i;tPlay()}};
  setQ('all');
}
document.addEventListener('keydown',e=>{
  if(!/^#\/theater/.test(location.hash)||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.metaKey||e.ctrlKey||e.altKey)return;
  const k=e.key.toLowerCase();if(k==='n')tStep(1);else if(k==='p')tStep(-1);else if(k==='f')fs();else if(k==='escape')document.body.classList.remove('lights');
});
// global events
document.addEventListener('change',e=>{const id=e.target.dataset&&e.target.dataset.w;if(id)mark(id,e.target.checked)});
document.addEventListener('click',e=>{
  const m=e.target.closest('[data-seek]');if(m){const t=+m.dataset.seek;
    if(yt&&ytReady){yt.seekTo(t,true);yt.playVideo()}else{const f=$('#wf');if(f){const id=location.hash.split('/')[2];f.src=`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&start=${t}`;f.scrollIntoView({behavior:'smooth',block:'center'})}}}
  if(e.target.id==='reset'&&confirm('Reset all watched progress?')){W.clear();save();render()}
  if(e.target.closest('#links a')){$('#nav').classList.remove('open');$('#burger').setAttribute('aria-expanded','false')}
});
// reveal + count
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.08,rootMargin:'0px 0px -5% 0px'}):null;
function reveal(){$$('.rv:not(.in)').forEach(el=>io?io.observe(el):el.classList.add('in'))}
function counts(){$$('[data-count]').forEach(el=>{const n=+el.dataset.count,t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1600);el.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)})}
// particles
let pRAF=0;
function particles(){
  const c=$('#pc');if(!c)return;const x=c.getContext('2d'),red=matchMedia('(prefers-reduced-motion: reduce)').matches;let w,h,ps;
  const size=()=>{w=c.width=c.offsetWidth;h=c.height=c.offsetHeight;ps=Array.from({length:Math.min(70,Math.round(w*h/18000))},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,a:Math.random()<.5}))};
  size();window.onresize=()=>$('#pc')&&size();
  (function f(){if(!$('#pc'))return;x.clearRect(0,0,w,h);
    for(let i=0;i<ps.length;i++){const p=ps[i];if(!red){p.x=(p.x+p.vx+w)%w;p.y=(p.y+p.vy+h)%h}
      for(let j=i+1;j<ps.length;j++){const q=ps[j],d=Math.hypot(p.x-q.x,p.y-q.y);if(d<130){x.strokeStyle=`rgba(79,227,255,${(1-d/130)*.25})`;x.lineWidth=1;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}
      x.fillStyle=p.a?'rgba(255,181,71,.85)':'rgba(79,227,255,.85)';x.beginPath();x.arc(p.x,p.y,1.6,0,7);x.fill()}
    if(!red)pRAF=requestAnimationFrame(f)})();
}
// router
function cleanup(){
  if(yt){try{yt.destroy()}catch(e){}}yt=null;ytReady=false;ytPend=null;
  document.body.classList.remove('lights');cancelAnimationFrame(pRAF);window.onresize=null;stopConf();
  if(document.fullscreenElement){try{const p=document.exitFullscreen();p&&p.catch&&p.catch(()=>{})}catch(e){}}
}
function render(){
  cleanup();
  const [, r='', a]=(location.hash.slice(1)||'/').split('/');let html,init;
  switch(r){
    case'':html=home();init=()=>{particles();counts()};break;
    case'path':html=path();break;
    case'theater':html=theater();init=thInit;break;
    case'library':html=library();init=libInit;break;
    case'bengio':html=bengio();break;
    case'podcasts':html=podcasts();break;
    case'ideas':html=ideas();break;
    case'watch':html=a?watch(decodeURIComponent(a)):home();if(!a)init=()=>{particles();counts()};break;
    case'glossary':html=glossary();init=glInit;break;
    case'quiz':QZ={i:0,s:0};html=quiz();init=qRender;break;
    case'progress':html=progress();break;
    default:html=ph('404','Lost in the lattice.','That page does not exist.')+'<section class="wrap"><a class="btn amb" href="#/">Go home</a></section>';
  }
  app.innerHTML=html;init&&init();
  $$('#links a').forEach(l=>l.classList.toggle('on',l.dataset.r===r));
  const t=NAV.find(n=>n[0]===r);document.title=(t&&r?t[1]+' · ':r==='watch'&&BY.get(a)?BY.get(a).title+' · ':'')+'AI Safety Cinema';
  window.scrollTo(0,0);reveal();
}
window.addEventListener('hashchange',render);
render();
})();
