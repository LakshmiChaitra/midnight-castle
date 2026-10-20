(()=>{
 const $=id=>document.getElementById(id),screen=$('engine-boot'),script=$('castle-boot');
 let ready=false,failure='',timer;const started=Date.now();
 function details(message){return `Midnight Castle startup\nPage: ${location.origin}${location.pathname}\nEngine: ${script.dataset.engine}\nBrowser: ${navigator.userAgent}\nGraphics: ${new URLSearchParams(location.search).get('graphics')||'automatic'}\nError: ${message}`;}
 function fail(error){
  failure=String(error?.message||error||'The 3D engine did not start.');
  clearTimeout(timer);screen.hidden=false;document.body.classList.add('engine-loading');document.body.dataset.engineState='error';
  $('engine-title').textContent='The castle couldn’t start.';
  $('engine-message').textContent=/webgl|graphics|shader|gpu|context/i.test(failure)?'Chrome could not start the 3D graphics. Try the lighter version below.':'The game download or startup was interrupted. Retry, or try the lighter graphics version.';
  $('engine-spinner').hidden=true;$('engine-actions').hidden=false;$('engine-diagnostics').textContent=details(failure);
 }
 window.addEventListener('castle:ready',()=>{ready=true;document.body.dataset.engineLoadMs=String(Date.now()-started);clearTimeout(timer);screen.hidden=true;document.body.classList.remove('engine-loading');document.body.dataset.engineState='ready';});
 window.addEventListener('castle:error',e=>fail(e.detail?.message||e.detail));
 window.addEventListener('error',e=>{if(!ready&&e.message)fail(e.error||e.message);});
 window.addEventListener('unhandledrejection',e=>{if(!ready)fail(e.reason);});
 $('engine-retry').addEventListener('click',()=>location.reload());
 $('engine-light').addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.set('graphics','lite');location.assign(u.href);});
 $('engine-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(details(failure));$('engine-copy').textContent='COPIED ✓';}catch{$('engine-details').open=true;}});
 const engine=document.createElement('script');engine.src=script.dataset.engine;engine.defer=true;
 engine.addEventListener('error',()=>fail('The game engine download failed.'));
 engine.addEventListener('load',()=>{if(!ready&&!failure)fail('The engine loaded but did not finish starting.');});
 document.body.dataset.engineState='loading';
 timer=setTimeout(()=>{if(!ready&&!failure){$('engine-message').textContent='The 3D engine is still loading. This can take a moment on a slower connection.';$('engine-actions').hidden=false;}},15000);
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.head.append(engine)));
})();
