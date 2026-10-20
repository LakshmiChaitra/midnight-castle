import * as THREE from 'three';
import {TRAVELERS,buildTraveler} from './wanderers.js';

export function galleryFloorAt(x,z){
 if(x>=6.5&&x<=10&&z<=-5&&z>=-17)return Math.min(3.6,(-z-5)*.3+.1);
 if(x>=6.5&&x<=10&&z<-17&&z>=-31)return 3.6;
 return null;
}

export function createExpedition({scene,player,ui,box,cylinder,stone,paleStone,wood,brass,glow,register,obstacles,navigate}){
 const $=id=>document.getElementById(id),KEY='midnight-expedition-v1';
 let saved={};for(const name of ['localStorage','sessionStorage'])try{const next=JSON.parse(window[name].getItem(KEY)||'{}');if((next.at||0)>(saved.at||0))saved=next;}catch{}
 const state={traveler:TRAVELERS.some(t=>t.id===saved.traveler)?saved.traveler:'mira',mode:['wander','letters','hunt'].includes(saved.mode)?saved.mode:'wander',readIds:Array.isArray(saved.readIds)?[...new Set(saved.readIds.filter(x=>typeof x==='string'))].slice(0,3):[],read:Math.min(3,Math.max(0,Number(saved.read)||0)),written:Math.min(2,Math.max(0,Number(saved.written)||0)),seals:Array.isArray(saved.seals)?[...new Set(saved.seals.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[],follow:saved.follow!==false};
 state.badges={letters:Boolean(saved.badges?.letters)||(state.read>=3&&state.written>=2),hunt:Boolean(saved.badges?.hunt)||state.seals.length===5};
 const actor=new THREE.Group();actor.userData.dynamic=true;scene.add(actor);let rig=buildTraveler(state.traveler);actor.add(rig.root);
 let demoSnapshot=null;
 let selected=state.traveler,previewRig,previewRenderer,previewScene,previewCamera,actionUntil=0,previousPosition=player.clone(),lastSpeed=0,actorHeading=0;
 const drawers=[],seals=[],butterflies=[];
 const crest=new THREE.Group();actor.add(crest);const crestRing=new THREE.Mesh(new THREE.TorusGeometry(.55,.012,6,64),new THREE.MeshBasicMaterial({color:0xd9bf7c}));crestRing.rotation.x=Math.PI/2;crestRing.position.y=.08;crest.add(crestRing);const crestStar=new THREE.Mesh(new THREE.OctahedronGeometry(.055),new THREE.MeshBasicMaterial({color:0xe8d09a}));crest.add(crestStar);
 function save(){if(demoSnapshot)return;const str=JSON.stringify({...state,at:Date.now()});for(const name of ['localStorage','sessionStorage'])try{window[name].setItem(KEY,str);}catch{}}
 function render(){
  $('traveler-name').textContent=TRAVELERS.find(t=>t.id===state.traveler).name;
  $('mode-name').textContent={wander:'Wander',letters:'Letter Quest',hunt:'Treasure Hunt'}[state.mode];
  $('quest-mode').textContent={wander:'FREE EXPLORATION',letters:'THE LETTER KEEPER',hunt:'THE FIVE LOST SEALS'}[state.mode];
  $('quest-objective').textContent=state.mode==='wander'?'Follow the signs to four connected realms. Climb the eastern cathedral stair.':state.mode==='letters'?'Open three letters. Leave two little lights for someone else.':'Find five star seals hidden around the keep. One waits upstairs.';
  $('quest-progress').textContent=state.mode==='wander'?'NO CLOCK. TAKE YOUR TIME.':state.mode==='letters'?`${state.read}/3 READ · ${state.written}/2 LEFT${state.read>=3&&state.written>=2?' · KEEPER’S CREST EARNED ✧':''}`:`${state.seals.length}/5 FOUND${state.seals.length===5?' · STARKEEPER’S CREST EARNED ✧':''}`;
  for(const seal of seals)seal.mesh.visible=state.mode==='hunt'&&!state.seals.includes(seal.id);
 }
 function choose(id){state.traveler=id;actor.remove(rig.root);disposeRig(rig);rig=buildTraveler(id);actor.add(rig.root);save();render();}
 function disposeRig(old){const materials=new Set();old.root.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});materials.forEach(m=>m.dispose());}
 function initPreview(){
  if(previewRenderer)return;
  previewRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});previewRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;previewRenderer.toneMappingExposure=1.3;previewRenderer.setClearColor(0x0d191f,0);$('traveler-preview').append(previewRenderer.domElement);
  previewScene=new THREE.Scene();previewScene.add(new THREE.HemisphereLight(0xc2dce9,0x77654e,3));const key=new THREE.DirectionalLight(0xffdfad,3);key.position.set(-3,5,-4);previewScene.add(key);const rim=new THREE.PointLight(0x87c5d0,25,10);rim.position.set(2,2,1);previewScene.add(rim);previewCamera=new THREE.PerspectiveCamera(36,1,.1,20);previewCamera.position.set(0,1.3,-4.5);previewCamera.lookAt(0,1,0);
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.8,.9,.1,48),new THREE.MeshStandardMaterial({color:0x2d3e3d,metalness:.5,roughness:.5}));plinth.position.y=-.07;previewScene.add(plinth);
 }
 function selectPreview(id){selected=id;initPreview();if(previewRig){previewScene.remove(previewRig.root);disposeRig(previewRig);}previewRig=buildTraveler(id);previewScene.add(previewRig.root);const spec=TRAVELERS.find(t=>t.id===id);$('traveler-preview-label').textContent=spec.name;$('traveler-caption').textContent=spec.role;$('confirm-traveler').textContent=`WANDER AS ${spec.name.toUpperCase()} ↗`;document.querySelectorAll('[data-traveler]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.traveler===id)));const animal=!['girl','boy'].includes(spec.type);previewCamera.position.set(0,animal?1:1.3,animal?-3.6:-4.5);previewCamera.lookAt(0,animal?.55:1,0);}
 for(const spec of TRAVELERS){const b=document.createElement('button');b.type='button';b.dataset.traveler=spec.id;b.style.setProperty('--traveler-swatch',`#${spec.color.toString(16).padStart(6,'0')}`);b.setAttribute('aria-label',`Preview ${spec.name}${spec.type==='girl'?' the girl':spec.type==='boy'?' the boy':` the ${spec.type}`}`);const title=document.createElement('strong'),role=document.createElement('small');title.textContent=spec.name;role.textContent=spec.role;b.append(title,role);b.addEventListener('click',()=>selectPreview(spec.id));$('traveler-options').append(b);}
 $('choose-traveler').addEventListener('click',()=>{ui.modal('traveler-dialog');selectPreview(state.traveler);});
 $('confirm-traveler').addEventListener('click',()=>{choose(selected);$('traveler-dialog').close();ui.toast(`${TRAVELERS.find(t=>t.id===state.traveler).name} is ready to wander.`);});
 const modes=[{id:'wander',label:'Wander',kicker:'NO TIMER. NO CHECKLIST.',text:'Explore at your pace. Climb the upper archive, open drawers, read a little, and leave something kind.'},{id:'letters',label:'The Letter Keeper',kicker:'A QUEST MADE OF SMALL KINDNESSES',text:'Open three different letters and leave two original messages. Complete your journey to earn the Keeper’s Crest.'},{id:'hunt',label:'The Five Lost Seals',kicker:'FOLLOW YOUR CURIOSITY',text:'Five glowing star seals are hidden in the castle. Search both floors and earn the Starkeeper’s Crest.'}];
 function openModes(){$('replay-mode').hidden=state.mode==='wander'||(state.mode==='letters'?state.read+state.written===0:state.seals.length===0);document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));ui.modal('mode-dialog');}
 for(const mode of modes){const b=document.createElement('button');b.type='button';b.dataset.mode=mode.id;const small=document.createElement('small'),title=document.createElement('strong'),p=document.createElement('p'),arrow=document.createElement('span');small.textContent=mode.kicker;title.textContent=mode.label;p.textContent=mode.text;arrow.textContent='↗';b.append(small,title,p,arrow);b.addEventListener('click',()=>{state.mode=mode.id;save();render();$('mode-dialog').close();ui.toast(`${mode.label} · your journey continues.`);});$('mode-options').append(b);}
 $('choose-mode').addEventListener('click',openModes);
 $('replay-mode').addEventListener('click',()=>{if(state.mode==='letters'){state.read=0;state.written=0;state.readIds=[];}else if(state.mode==='hunt')state.seals=[];save();render();$('mode-dialog').close();ui.toast('A fresh adventure. The castle is waiting.');});
 $('open-destinations').addEventListener('click',()=>ui.modal('destination-dialog'));
 for(const b of document.querySelectorAll('[data-destination]'))b.addEventListener('click',()=>{$('destination-dialog').close();navigate(b.dataset.destination);});
 // An accessible, real staircase and upper gallery, independent of reward locks.
 const gallery=new THREE.Group();scene.add(gallery);
 box(3.5,.3,14,stone,8.25,3.45,-24,gallery);
 for(let i=0;i<24;i++)box(3.5,.18,.55,stone,8.25,.09+i*.15,-5.25-i*.5,gallery);
 for(const x of [6.42,10.08]){
  box(.1,.08,14,brass,x,3.85,-24,gallery);box(.2,.13,14,paleStone,x,4.72,-24,gallery);
  obstacles.push({x,z:-24,hw:.12+.35,hd:7,minY:3.5,maxY:5});
  for(let z=-17.4;z>-31;z-=1.3)cylinder(.035,.035,1.1,brass,x,4.2,z,gallery,6);
  for(let i=0;i<24;i++){cylinder(.025,.025,1.05,brass,x,1.15+i*.15,-5.25-i*.5,gallery,6);obstacles.push({x,z:-5.25-i*.5,hw:.4,hd:.32,minY:i*.15,maxY:i*.15+1.5});}
  const rail=box(.1,.1,12.7,brass,x,2.98,-11,gallery);rail.rotation.x=.292;
 }
 box(3.7,1.1,.15,stone,8.25,4.12,-31,gallery);obstacles.push({x:8.25,z:-31,hw:2.2,hd:.4,minY:3.5,maxY:5});
 for(const x of [6.4,10.1]){const lamp=new THREE.PointLight(0xffcc82,12,7,1.5);lamp.position.set(x,5,-25);scene.add(lamp);cylinder(.09,.13,.3,brass,x,4.8,-25);const flame=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),glow);flame.position.set(x,5,-25);scene.add(flame);}
 function cabinet(x,y,z,name){
  const cabinet=new THREE.Group();cabinet.position.set(x,y,z);scene.add(cabinet);cabinet.userData.dynamic=true;
  box(2,.16,1.1,wood,0,.08,0,cabinet);box(2,.16,1.1,wood,0,1.9,0,cabinet);box(.12,1.8,1.05,wood,-.94,.95,0,cabinet);box(.12,1.8,1.05,wood,.94,.95,0,cabinet);box(1.9,1.7,.12,wood,0,.95,-.5,cabinet);
  obstacles.push({x,z,hw:1.35,hd:.87,minY:y,maxY:y+2});
  for(let i=0;i<3;i++){
   const interaction=new THREE.Group();cabinet.add(interaction);interaction.userData.dynamic=true;
   const slider=new THREE.Group();slider.position.y=.41+i*.53;interaction.add(slider);
   box(1.72,.41,.1,wood,0,0,.56,slider);box(1.65,.06,.85,wood,0,-.18,.08,slider);box(.06,.35,.85,wood,-.81,0,.08,slider);box(.06,.35,.85,wood,.81,0,.08,slider);box(1.65,.35,.06,wood,0,0,-.33,slider);
   for(const xx of [-.48,.48]){const handle=new THREE.Mesh(new THREE.TorusGeometry(.065,.012,6,14,Math.PI),brass);handle.position.set(xx,0,.63);handle.rotation.z=Math.PI;slider.add(handle);}
   const letter=box(.51,.012,.34,new THREE.MeshStandardMaterial({color:0xe4d6b4,roughness:.9}),0,-.14,.15,slider);letter.rotation.y=.1;
   register(interaction,'drawer',`Open ${name} · drawer ${i+1}`,[x,y+.41+i*.53,z+.6]);
   drawers.push({root:interaction,slider,open:0,target:0,name:`${name} · Drawer ${i+1}`,level:y});
  }
 }
 cabinet(-7,0,-15.5,'The oak cabinet');cabinet(8.25,3.6,-29.2,'The moonlit cabinet');
 // A slow-turning celestial mobile on the upper floor.
 const mobile=new THREE.Group();mobile.position.set(6.85,6.4,-26);mobile.scale.setScalar(.5);scene.add(mobile);mobile.userData.dynamic=true;
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.45+i*.17,.015,6,50),brass);ring.rotation.set(i*.6,i*.9,.5);mobile.add(ring);}
 const globe=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,2),new THREE.MeshBasicMaterial({color:0xe5c18a}));mobile.add(globe);
 // Treasure seals have real world positions and disappear only after collection.
 const sealPlaces=[[3.5,.8,9],[-7,1.1,-5],[8.3,4.7,-27],[-5,1.3,-23],[4,1.2,-32]];
 sealPlaces.forEach(([x,y,z],id)=>{const group=new THREE.Group();group.position.set(x,y,z);group.userData.dynamic=true;scene.add(group);const star=new THREE.Mesh(new THREE.OctahedronGeometry(.17,0),glow);star.renderOrder=110;group.add(star);const ring=new THREE.Mesh(new THREE.TorusGeometry(.29,.013,6,32),brass);ring.renderOrder=110;group.add(ring);register(group,'seal','Collect a lost star seal',[x,y,z]);seals.push({id,mesh:group,star,y});});
 // Fluttering butterflies add spatial animation near the library lights.
 const wingMat=new THREE.MeshBasicMaterial({color:0xdbbb76,transparent:true,opacity:.75,side:THREE.DoubleSide});
 for(let i=0;i<12;i++){const group=new THREE.Group();scene.add(group);const wings=[];for(const side of [-1,1]){const pivot=new THREE.Group();group.add(pivot);const wing=new THREE.Mesh(new THREE.CircleGeometry(.08,10),wingMat);wing.scale.y=1.5;wing.position.x=side*.07;pivot.add(wing);wings.push(pivot);}butterflies.push({group,wings,seed:i*.8});}
 $('drawer-read').addEventListener('click',()=>ui.openLetter());$('drawer-write').addEventListener('click',()=>ui.openWrite());
 function use(object,time){
  const drawer=drawers.find(d=>d.root===object);if(drawer){if(drawer.busy)return true;actionUntil=time+.8;drawer.target=drawer.target?0:1;drawer.root.userData.interaction.title=`${drawer.target?'Close':'Open'} ${drawer.name}`;if(drawer.target){drawer.busy=true;setTimeout(()=>{drawer.busy=false;$('drawer-location').textContent=drawer.level?'THE UPPER ARCHIVE':'THE WHISPERING ARCHIVE';$('drawer-title').textContent=drawer.name;ui.modal('drawer-dialog');},650);}return true;}
  const seal=seals.find(s=>s.mesh===object);if(seal){if(state.mode!=='hunt'||state.seals.includes(seal.id))return true;state.seals.push(seal.id);if(state.seals.length===5)state.badges.hunt=true;actionUntil=time+.65;save();render();ui.toast(state.seals.length===5?'All five found. You are the Starkeeper.':`A lost star, found. ${state.seals.length} of 5.`);return true;}
  actionUntil=time+.65;return false;
 }
 function activity(kind,id){if(state.mode!=='letters')return;if(kind==='read'){if(state.readIds.includes(id))return;state.readIds.push(id);state.readIds=state.readIds.slice(-3);}const done=state.read>=3&&state.written>=2;if(kind==='read')state.read=Math.min(3,state.read+1);if(kind==='write')state.written=Math.min(2,state.written+1);if(state.read>=3&&state.written>=2)state.badges.letters=true;save();render();if(!done&&state.read>=3&&state.written>=2)ui.toast('The Keeper’s Crest is yours. Look at the light you left.');}
 function update({time,dt,yaw,paused,inside}){
  $('expedition-quest').hidden=false;
  const dx=player.x-previousPosition.x,dz=player.z-previousPosition.z;const speed=paused?0:Math.min(7,Math.hypot(dx,dz)/Math.max(.001,dt));const desired=speed>.12?Math.atan2(-dx,-dz):yaw;const angle=Math.atan2(Math.sin(desired-actorHeading),Math.cos(desired-actorHeading));actorHeading+=angle*(1-Math.exp(-8*dt));previousPosition.copy(player);lastSpeed=THREE.MathUtils.damp(lastSpeed,speed,8,dt);
  actor.position.copy(player);actor.rotation.y=actorHeading;actor.visible=inside;rig.animate(time,lastSpeed,dt,time<actionUntil);
  for(const drawer of drawers){drawer.open=THREE.MathUtils.damp(drawer.open,drawer.target,8,dt);drawer.slider.position.z=drawer.open*.72;drawer.root.userData.drawerOpen=drawer.open.toFixed(2);}
  crest.visible=state.badges.letters||state.badges.hunt;crestStar.position.set(Math.sin(time)*.6,.15,Math.cos(time)*.6);
  mobile.rotation.y=time*.16;globe.position.y=Math.sin(time)*.05;
  seals.forEach(s=>{s.mesh.visible=state.mode==='hunt'&&!state.seals.includes(s.id);s.mesh.position.y=s.y+Math.sin(time*1.5+s.id)*.12;s.star.rotation.y=time*.8;});
  for(const b of butterflies){b.group.position.set(8+Math.sin(time*.3+b.seed)*1.2,4.6+Math.sin(time*.7+b.seed)*.5,-23+Math.cos(time*.4+b.seed)*2);b.group.rotation.y=time*.3;b.wings.forEach((w,i)=>w.rotation.y=Math.sin(time*13+b.seed)*(i?1:-1)*.8);}
  if(previewRenderer&&$('traveler-dialog').open){const r=$('traveler-preview').getBoundingClientRect();previewRenderer.setSize(r.width,r.height,false);previewCamera.aspect=r.width/r.height;previewCamera.updateProjectionMatrix();previewRig.root.rotation.y=Math.sin(time*.4)*.45;previewRig.animate(time,.55,dt,false);previewRenderer.render(previewScene,previewCamera);}
 }
 function beginDemo(){if(demoSnapshot)return;demoSnapshot={state:structuredClone(state),drawers:drawers.map(d=>({open:d.open,target:d.target}))};state.follow=true;}
 function resetDemo(){if(!demoSnapshot)return;Object.assign(state,structuredClone(demoSnapshot.state));state.follow=true;choose(state.traveler);drawers.forEach(d=>{d.open=0;d.target=0;d.slider.position.z=0;});}
 function endDemo(){if(!demoSnapshot)return;const savedDemo=demoSnapshot;Object.assign(state,structuredClone(savedDemo.state));choose(state.traveler);drawers.forEach((d,i)=>{Object.assign(d,savedDemo.drawers[i]);d.slider.position.z=d.open*.72;});demoSnapshot=null;render();}
 function demoMode(id){if(!demoSnapshot)return;state.mode=id;if(id==='hunt'){state.seals=[];state.badges.hunt=false;}render();}
 function demoDrawer(time){const d=drawers.find(d=>d.level>0);if(d){d.target=1;actionUntil=time+1.2;}}
 render();return{beginDemo,resetDemo,endDemo,demoMode,demoDrawer,demoTraveler:id=>{if(demoSnapshot)choose(id);},demoReach:time=>{actionUntil=time+1.2;},state,actor,update,use,onActivity:activity,groundHeight:galleryFloorAt,animateActor:(time,speed,dt,action)=>rig.animate(time,speed,dt,action),collectSeal:(id,time)=>{const target=seals.find(s=>s.id===id);if(target)use(target.mesh,time);},isSealFound:id=>state.seals.includes(id),cameraHeight:()=>['mira','theo'].includes(state.traveler)?2.6:1.9,focusHeight:()=>['mira','theo'].includes(state.traveler)?1.05:.6,setCamera:value=>{state.follow=value;save();},showCharacters:()=>{$('choose-traveler').click();},canInteract:object=>{const seal=seals.find(s=>s.mesh===object);return !seal||(state.mode==='hunt'&&!state.seals.includes(seal.id));}};
}
