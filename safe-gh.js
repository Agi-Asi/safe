/* SAFE dock: home + GitHub source link + live stars on every SAFE page. Aniruddha Adak · https://github.com/Agi-Asi/safe */
(()=>{
if(window.__safeDock)return;window.__safeDock=1;
const REPO='Agi-Asi/safe',BASE='/safe/';
const seg=(location.pathname.split(BASE)[1]||'').split('/').filter(Boolean);
const NAMES={'ai-safety-researchers':'Guardians of AI','frominside':'Inside the Insiders','control-superintelligence':'CONTROL','ai-safety-cinema':'AI Safety Cinema','ai-safety-library':'Video Library','signal':'SIGNAL','x-focus-digest':'X Focus Digest','x-digest':'Digest Archive'};
const folder=seg.length?seg.join('/'):'';
const src='https://github.com/'+REPO+(folder?'/tree/main/'+folder:'');
const route=NAMES[seg[0]]||'SAFE';
const css=`
#safe-dock{position:fixed;left:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:4px;padding:4px;border-radius:999px;font:600 13px/1 Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#f3efe6;background:#0b0b10e6;backdrop-filter:blur(12px) saturate(1.4);-webkit-backdrop-filter:blur(12px);box-shadow:0 12px 40px -12px #000c,0 0 0 1px #ffffff1a;isolation:isolate;transition:transform .3s cubic-bezier(.2,.8,.2,1),opacity .3s}
#safe-dock:before{content:"";position:absolute;inset:-1.5px;border-radius:inherit;z-index:-1;background:conic-gradient(from var(--sa,0deg),#ff5a36,#ffb547,#ffe08a,#4fe3ff,#3b82f6,#a3e635,#ff5a36);animation:safe-spin 6s linear infinite;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:1.5px}
@property --sa{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes safe-spin{to{--sa:360deg}}
#safe-dock a{display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:999px;color:inherit;text-decoration:none;white-space:nowrap;transition:background .2s,color .2s}
#safe-dock a:hover{background:#ffffff14}
#safe-dock a:focus-visible{outline:2px solid #ffb547;outline-offset:2px}
#safe-dock svg{width:17px;height:17px;flex:none}
#safe-dock .sd-home b{background:linear-gradient(100deg,#ffe08a,#ffb547 45%,#ff5a36);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.14em}
#safe-dock .sd-gh{background:linear-gradient(135deg,#24292f,#1f3a4d);}
#safe-dock .sd-gh:hover{background:linear-gradient(135deg,#1f3a4d,#0f4c5c)}
#safe-dock .sd-star{color:#ffd166}
#safe-dock .sd-star span{color:#f3efe6;font-variant-numeric:tabular-nums}
#safe-dock .sd-x{width:30px;justify-content:center;padding:8px 0;color:#a39f96}
#safe-dock.sd-min .sd-txt,#safe-dock.sd-min .sd-star,#safe-dock.sd-min .sd-home{display:none}
#safe-dock.sd-min .sd-x{transform:rotate(180deg)}
@media(max-width:640px){#safe-dock .sd-txt{display:none}#safe-dock{left:10px;bottom:10px}}
@media print{#safe-dock{display:none}}
@media(prefers-reduced-motion:reduce){#safe-dock:before{animation:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const gh='<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
const orb='<svg viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="sdg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3d6"/><stop offset=".35" stop-color="#ffb547"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient></defs><circle cx="16" cy="16" r="15" fill="url(#sdg)"/><circle cx="16" cy="16" r="5.2" fill="#07070a"/></svg>';
const d=document.createElement('nav');d.id='safe-dock';d.setAttribute('aria-label','SAFE hub and source code');
d.innerHTML=(seg.length?`<a class="sd-home" href="${BASE}" title="Back to the SAFE hub">${orb}<b>SAFE</b></a>`:'')+
`<a class="sd-gh" href="${src}" target="_blank" rel="noopener" title="View ${route} source on GitHub">${gh}<span class="sd-txt">${folder?'Source':'GitHub'}</span></a>`+
`<a class="sd-star" href="https://github.com/${REPO}/stargazers" target="_blank" rel="noopener" title="Star ${REPO} on GitHub"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg><span id="sd-n">Star</span></a>`+
`<a class="sd-x" href="#" role="button" aria-label="Collapse dock">‹</a>`;
const mount=()=>{document.body.appendChild(d);
 const k='safe-dock-min';if(localStorage.getItem(k)==='1')d.classList.add('sd-min');
 d.querySelector('.sd-x').onclick=e=>{e.preventDefault();d.classList.toggle('sd-min');localStorage.setItem(k,d.classList.contains('sd-min')?'1':'0')};
 const c='safe-stars',ct=JSON.parse(localStorage.getItem(c)||'null'),set=n=>{const el=document.getElementById('sd-n');if(el&&n>0)el.textContent=n.toLocaleString('en-IN')};
 if(ct&&Date.now()-ct.t<36e5)set(ct.n);else fetch('https://api.github.com/repos/'+REPO).then(r=>r.ok?r.json():null).then(j=>{if(j){localStorage.setItem(c,JSON.stringify({t:Date.now(),n:j.stargazers_count}));set(j.stargazers_count)}}).catch(()=>{});
};
document.body?mount():addEventListener('DOMContentLoaded',mount);
})();
