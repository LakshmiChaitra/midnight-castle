import * as THREE from 'three';

// Image-based 3D diorama: preserve the approved room, with modeled drawers,
// a spatial stair route, animated travelers, and deliberately bounded cameras.
export function createArchiveRoom({renderer,ui,adventure,onExit}){
 const $=id=>document.getElementById(id);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1b20);
 const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.06,100);
 const origin=new THREE.Vector3(0,2,12),tan=Math.tan(THREE.MathUtils.degToRad(50)/2),aspect=1586/992;
 const photo=new THREE.TextureLoader().load('assets/archive.jpg');photo.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:photo,toneMapped:false,side:THREE.DoubleSide});
 const geometry=new THREE.PlaneGeometry(1,1,190,120),positions=geometry.attributes.position,uv=geometry.attributes.uv;
 const baseCamera=origin.clone(),baseLook=new THREE.Vector3(0,2,-4);
 let active=false,floor=0,climbing=false,route=null,elapsed=0,duration=1,clock=0,actionUntil=0,selectedDrawer=null,pendingDrawer=null,mode='room',pan=0;
 let cameraGoal=baseCamera.clone(),lookGoal=baseLook.clone(),look=baseLook.clone(),movingSpeed=0,actorHeading=Math.PI;
 const actorPosition=new THREE.Vector3(-4.6,0,5),actorStart=actorPosition.clone(),drawers=[],hits=[],markers=[],treasures=[];
 function at(u,v,depth=16){return new THREE.Vector3((u-.5)*2*depth*tan*aspect,(.5-v)*2*depth*tan+2,12-depth);}
 function stairPoint(u,v,y){let depth=(2-y)/((v-.5)*2*tan);if(!Number.isFinite(depth)||depth<4||depth>22)depth=10.5;const p=at(u,v,depth);p.y=y;return p;}
 const stairs=[stairPoint(.19,.72,0),stairPoint(.22,.66,.5),stairPoint(.25,.60,1.1),stairPoint(.28,.54,1.6),stairPoint(.31,.48,2.2),stairPoint(.33,.43,2.7),stairPoint(.355,.38,3.2),stairPoint(.385,.335,3.6),stairPoint(.43,.28,4)];
 const stairCurve=new THREE.CatmullRomCurve3(stairs,false,'centripetal');
 for(let i=0;i<positions.count;i++){
  const u=uv.getX(i),v=1-uv.getY(i);
  const depth=16;
  const p=at(u,v,depth);positions.setXYZ(i,p.x,p.y,p.z);
 }
 geometry.computeVertexNormals();const room=new THREE.Mesh(geometry,material);room.renderOrder=-10;scene.add(room);
 scene.add(new THREE.HemisphereLight(0xc8d7d9,0x755039,2.5));const keyLight=new THREE.DirectionalLight(0xffdda4,2.3);keyLight.position.set(-3,7,9);scene.add(keyLight);
 const rim=new THREE.PointLight(0x99ccdf,15,25);rim.position.set(5,7,-3);scene.add(rim);
 const wood=new THREE.MeshStandardMaterial({color:0x38271c,roughness:.8}),brass=new THREE.MeshStandardMaterial({color:0xc3a06b,metalness:.65,roughness:.35});
 function cuboid(w,h,d,mat,parent,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.renderOrder=5;parent.add(mesh);return mesh;}
 function cropMaterial(rect){const map=photo.clone();map.needsUpdate=true;map.repeat.set(rect.w,rect.h);map.offset.set(rect.u,1-rect.v-rect.h);return new THREE.MeshBasicMaterial({map,toneMapped:false,depthTest:true,side:THREE.DoubleSide});}
 function addDrawer(rect,name,upstairs=false,depth=16){
  const position=at(rect.u+rect.w/2,rect.v+rect.h/2,depth),w=rect.w*2*depth*tan*aspect,h=rect.h*2*depth*tan;
  const root=new THREE.Group();root.position.copy(position);root.position.z+=.015;scene.add(root);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w*.98,h*.95),new THREE.MeshBasicMaterial({color:0x100b08,depthTest:true}));shadow.renderOrder=2;root.add(shadow);
  const slider=new THREE.Group();root.add(slider);
  cuboid(w,.025,.7,wood,slider,0,-h/2,-.32);cuboid(.025,h,.7,wood,slider,-w/2,0,-.32);cuboid(.025,h,.7,wood,slider,w/2,0,-.32);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),cropMaterial(rect));face.renderOrder=10;slider.add(face);
  const paper=cuboid(Math.min(w*.65,.3),.008,.24,new THREE.MeshStandardMaterial({color:0xe6d3ab,roughness:1}),slider,0,-h/2+.025,-.24);paper.rotation.y=.1;
  const drawer={root,slider,face,shadow,position,name,upstairs,open:0,target:0,w,h};face.userData.drawer=drawer;hits.push(face);drawers.push(drawer);
 }
 for(let row=0;row<9;row++)for(let col=0;col<5;col++)addDrawer({u:.543+col*.0197,v:.284+row*.0328,w:.017,h:.027},`Wall drawer ${row+1} · ${col+1}`,row<4);
 [{u:.282,v:.799,w:.093,h:.061},{u:.396,v:.82,w:.105,h:.065},{u:.53,v:.846,w:.12,h:.068},{u:.685,v:.878,w:.135,h:.071}].forEach((rect,i)=>addDrawer(rect,`Counter drawer ${i+1}`,false,16));
 // Hotspots are attached to positions in the pictured room, not to the old keep.
 function marker(id,u,v,depth){markers.push({element:$(id),position:at(u,v,depth)});}
 marker('pictured-stairs',.28,.62,10.5);marker('pictured-wall',.60,.43,16);marker('pictured-counter',.52,.66,16);marker('pictured-letter',.36,.60,6);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(tan*Math.min(1,aspect/camera.aspect)));camera.updateProjectionMatrix();}window.addEventListener('resize',resize);
 function moveActor(points,seconds,done){route=new THREE.CatmullRomCurve3(points.filter((p,i)=>!i||p.distanceTo(points[i-1])>.005).map(p=>p.clone()),false,'centripetal');elapsed=0;duration=seconds;route.done=done;}
 function upstairs(){
  if(climbing||floor===1)return;climbing=true;mode='stairs';cameraGoal.copy(baseCamera);lookGoal.copy(baseLook);
  $('archive-status').textContent='Climbing the staircase on the left…';$('archive-floor').textContent='ON THE STAIRCASE';
  const start=actorPosition.clone();moveActor([start,...stairs],7,()=>{floor=1;climbing=false;mode='upstairs';$('archive-floor').textContent='UPSTAIRS · THE MOONLIT LANDING';$('archive-status').textContent='You’re upstairs. The top four rows of wall drawers are within reach.';cameraGoal.copy(baseCamera);lookGoal.copy(baseLook);if(pendingDrawer){const next=pendingDrawer;pendingDrawer=null;approach(next);}});
 }
 function downstairs(){
  if(climbing)return;if(floor===0){resetView();return;}climbing=true;mode='stairs';cameraGoal.copy(baseCamera);lookGoal.copy(baseLook);$('archive-floor').textContent='ON THE STAIRCASE';$('archive-status').textContent='Walking down the staircase…';moveActor([actorPosition.clone(),...stairs.slice().reverse()],7,()=>{floor=0;climbing=false;resetView();});
 }
 function resetView(){mode='room';pan=0;cameraGoal.copy(baseCamera);lookGoal.copy(baseLook);$('archive-floor').textContent=floor?'UPSTAIRS · THE MOONLIT LANDING':'GROUND FLOOR · THE WHISPERING ARCHIVE';$('archive-status').textContent='Click the glowing staircase on the left, or choose a drawer.';}
 function approach(drawer){
  if(climbing)return;if(drawer.upstairs&&floor===0){pendingDrawer=drawer;ui.toast('That drawer is upstairs. Your traveler is taking the left staircase.');upstairs();return;}
  if(!drawer.upstairs&&floor===1){ui.toast('That drawer is downstairs. Use Go downstairs first.');return;}
  selectedDrawer=drawer;mode='drawers';const isCounter=drawer.name.startsWith('Counter');
  cameraGoal.copy(drawer.position).add(new THREE.Vector3(-.35,.35,isCounter?10:8));lookGoal.copy(drawer.position);lookGoal.y+=.05;
  const target=drawer.position.clone();target.y=floor?4:0;target.z+=1.2;target.x-=.35;
  moveActor([actorPosition.clone(),target],1.5,()=>toggleDrawer(drawer));$('archive-status').textContent=`Approaching ${drawer.name.toLowerCase()}…`;
 }
 function toggleDrawer(drawer){
  if(drawer.busy)return;drawer.target=drawer.target?0:1;actionUntil=clock+1.15;
  $('archive-status').textContent=drawer.target?`${drawer.name} is opening. A letter waits inside.`:`${drawer.name} is closing.`;
  if(drawer.target){drawer.busy=true;setTimeout(()=>{drawer.busy=false;if(!active)return;$('drawer-location').textContent=drawer.upstairs?'THE PICTURED ROOM · UPSTAIRS':'THE PICTURED ROOM · GROUND FLOOR';$('drawer-title').textContent=drawer.name;ui.modal('drawer-dialog');},850);}
 }
 function wallDrawers(){const row=floor?1:6;const drawer=drawers[row*5+2];approach(drawer);}
 function counterDrawers(){approach(drawers[45]);}
 $('pictured-stairs').addEventListener('click',()=>floor?downstairs():upstairs());$('archive-climb').addEventListener('click',()=>floor?downstairs():upstairs());
 $('pictured-wall').addEventListener('click',wallDrawers);$('archive-wall').addEventListener('click',wallDrawers);
 $('pictured-counter').addEventListener('click',counterDrawers);$('archive-counter').addEventListener('click',counterDrawers);
 $('pictured-letter').addEventListener('click',()=>ui.openPost());$('archive-back').addEventListener('click',()=>leave());$('archive-reset-view').addEventListener('click',()=>{if(climbing)return;resetView();const target=floor?stairs[stairs.length-1]:stairs[0];if(actorPosition.distanceTo(target)>.05)moveActor([actorPosition.clone(),target],2,()=>{});});
 function enter(options={}){
  active=true;floor=0;climbing=false;route=null;selectedDrawer=null;pendingDrawer=null;elapsed=0;pan=0;mode='room';actorPosition.copy(stairs[0]);actorPosition.x+=.35;camera.position.copy(baseCamera);look.copy(baseLook);cameraGoal.copy(baseCamera);lookGoal.copy(baseLook);camera.lookAt(look);scene.add(adventure.actor);adventure.actor.scale.setScalar(.78);actorHeading=Math.PI;
  $('camera-view').disabled=true;$('game').classList.add('in-archive-room');$('archive-controls').hidden=false;$('archive-markers').hidden=false;$('region-name').textContent='The Whispering Archive';resetView();resize();
  if(options.upstairs)upstairs();
 }
 function leave(){active=false;adventure.actor.scale.setScalar(1);$('camera-view').disabled=false;route=null;climbing=false;pendingDrawer=null;$('game').classList.remove('in-archive-room');$('archive-controls').hidden=true;$('archive-markers').hidden=true;onExit(adventure.actor);}
 // The pictured cabinet faces are raycast individually. Labels also offer
 // larger accessible targets when individual brass handles are tiny.
 renderer.domElement.addEventListener('pointerup',event=>{if(!active||climbing||document.querySelector('dialog[open]'))return;pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);const treasure=ray.intersectObjects(treasures.filter(t=>t.mesh.visible).map(t=>t.mesh),false)[0];if(treasure){const item=treasures.find(t=>t.mesh===treasure.object);adventure.collectSeal(item.id,clock);actionUntil=clock+.8;return;}const target=ray.intersectObjects(hits,false)[0]?.object.userData.drawer;if(target)approach(target);});
 function step(direction){if(direction==='forward')upstairs();else if(direction==='back')downstairs();else{pan=THREE.MathUtils.clamp(pan+(direction==='left'?-.1:.1),-.25,.25);}}
 function key(code){if(['KeyW','ArrowUp'].includes(code)){upstairs();return true;}if(['KeyS','ArrowDown'].includes(code)){downstairs();return true;}if(['KeyA','ArrowLeft'].includes(code)){step('left');return true;}if(['KeyD','ArrowRight'].includes(code)){step('right');return true;}if(code==='KeyE'){if(selectedDrawer)approach(selectedDrawer);else ui.openPost();return true;}return false;}
 const dustPositions=new Float32Array(130*3);for(let i=0;i<130;i++){dustPositions[i*3]=(Math.random()-.5)*12;dustPositions[i*3+1]=Math.random()*8;dustPositions[i*3+2]=(Math.random()-.5)*12;}
 const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));scene.add(new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xe8c887,size:.025,transparent:true,opacity:.6,depthWrite:false})));
 const treasureUV=[[.21,.67],[.43,.27],[.60,.34],[.86,.60],[.67,.74]];
 treasureUV.forEach(([u,v],id)=>{const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.085),new THREE.MeshBasicMaterial({color:0xffdc88,depthTest:false}));mesh.position.copy(at(u,v,id===4?6:10));mesh.renderOrder=20;scene.add(mesh);treasures.push({mesh,id});});

 function update(dt,time){
  clock=time;const paused=Boolean(document.querySelector('dialog[open]'));let speed=0;
  if(route&&!paused){const before=actorPosition.clone();elapsed=Math.min(duration,elapsed+dt);const t=elapsed/duration;actorPosition.copy(route.getPointAt(THREE.MathUtils.smoothstep(t,0,1)));speed=before.distanceTo(actorPosition)/Math.max(dt,.001);const tangent=route.getTangentAt(Math.min(.999,t));actorHeading=Math.atan2(-tangent.x,-tangent.z);if(elapsed>=duration){const done=route.done;route=null;actorHeading=mode==='drawers'?0:Math.PI*.86;done?.();}}
  const cameraTarget=cameraGoal.clone(),lookTarget=lookGoal.clone();if(innerWidth<700&&mode!=='drawers'){cameraTarget.x=actorPosition.x;lookTarget.x=actorPosition.x;}cameraTarget.x+=pan*2;camera.position.lerp(cameraTarget,1-Math.exp(-3.2*dt));look.lerp(lookTarget,1-Math.exp(-3.2*dt));camera.lookAt(look);
  adventure.actor.visible=true;adventure.actor.rotation.y=actorHeading;adventure.actor.position.copy(actorPosition);adventure.animateActor(time,Math.min(5,speed),dt,time<actionUntil);
  for(const drawer of drawers){drawer.open=THREE.MathUtils.damp(drawer.open,drawer.target,7,dt);drawer.slider.position.z=.85*drawer.open;drawer.shadow.visible=drawer.open>.01;for(const child of drawer.slider.children)if(child!==drawer.face)child.visible=drawer.open>.01;}
  for(const marker of markers){const p=marker.position.clone().project(camera);marker.element.style.left=`${(p.x*.5+.5)*100}%`;marker.element.style.top=`${(-p.y*.5+.5)*100}%`;marker.element.hidden=p.z>1||p.x<-1.1||p.x>1.1||p.y<-1.1||p.y>1.1;}
  $('pictured-wall').hidden=mode==='drawers';$('pictured-counter').hidden=mode==='drawers';
  $('pictured-stairs').textContent=floor?'GO DOWNSTAIRS ↓':'GO UPSTAIRS ↑';$('archive-climb').textContent=floor?'GO DOWNSTAIRS ↓':'GO UPSTAIRS ↑';
  $('region-name').textContent=floor?'The Moonlit Landing':'The Whispering Archive';$('expedition-quest').hidden=false;
  for(const t of treasures){t.mesh.visible=adventure.state.mode==='hunt'&&!adventure.isSealFound(t.id);t.mesh.rotation.y=time;}
  const data=renderer.domElement.dataset;data.room='pictured-archive';data.archiveFloor=climbing?'stairs':String(floor);data.playerY=actorPosition.y.toFixed(2);data.playerX=actorPosition.x.toFixed(2);data.playerZ=actorPosition.z.toFixed(2);data.openDrawers=String(drawers.filter(d=>d.open>.5).length);
  renderer.render(scene,camera);
 }
 return{get active(){return active;},enter,leave,update,key,step,upstairs,downstairs};
}
