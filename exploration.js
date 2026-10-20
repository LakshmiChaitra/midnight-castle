import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createLetters} from './letters.js';
import {createExpedition} from './exploration-expedition.js';
import {createRealms} from './realms.js';
import {createSoundscape} from './soundscape.js';
import {createDemo} from './demo.js';
import {createGameRenderer} from './renderer-startup.js';

const $=id=>document.getElementById(id), host=$('world'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
let {renderer,lightweight:lite}=createGameRenderer(THREE,new URLSearchParams(location.search).get('graphics')==='lite');
let firstRendered=false,graphicsFailed=false,animationFrame=0;
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();firstRendered=false;graphicsFailed=true;cancelAnimationFrame(animationFrame);window.dispatchEvent(new CustomEvent('castle:error',{detail:{message:'The browser lost its 3D graphics context.'}}));});
renderer.domElement.addEventListener('webglcontextrestored',()=>{graphicsFailed=false;animate();});
renderer.debug.onShaderError=()=>{graphicsFailed=true;cancelAnimationFrame(animationFrame);throw new Error('The graphics shader could not compile on this device. Try lightweight graphics.');};
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(lite?1:Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=!lite;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.setClearColor(0x111c22);host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D castle world. Drag to look. Use W A S D or the movement controls to walk.');
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x17252c,.024);
const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.08,400);camera.rotation.order='YXZ';camera.position.set(0,1.75,18);scene.add(camera);
const composer=lite?{addPass(){},setSize(){},render(){renderer.render(scene,camera);}}:new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=lite?{enabled:false,resolution:new THREE.Vector2()}:new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.48,.7,1.25);composer.addPass(bloom);composer.addPass(new OutputPass());
const clock=new THREE.Clock(),keys=new Set(),obstacles=[],interactables=[],flames=[],torches=[],floating=[],mistPlanes=[];
let routeFocus=null,autoPath=[],entrancePhoto=null,queuedArchive=false;
let entered=false,yaw=0,pitch=0,velocity=new THREE.Vector3(),vertical=0,grounded=true,stamina=1,stepPhase=0,activeObject=null,dragging=false,dragged=false,lastPointer={x:0,y:0},sensitivity=.004,walkingTarget=0,turnTarget=0,activeStep='',stepStarted=0,gateLift=0,region='',frame=0,quality='cinematic',time=0;
const player=new THREE.Vector3(0,0,-9),rad=.35;let demo=null,guideSpeed=4.2;
function rand(a,b){return a+Math.random()*(b-a);}function box(w,h,d,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(rt,rb,h,mat,x,y,z,parent=scene,sides=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,sides),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function coll(x,z,w,d,baseY=0,height=3){obstacles.push({x,z,hw:w/2+rad,hd:d/2+rad,minY:baseY,maxY:baseY+height});}
function texture(type){const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.fillStyle=type==='wood'?'#463b2e':type==='floor'?'#777b70':'#7d8175';g.fillRect(0,0,1024,1024);
 const data=g.getImageData(0,0,1024,1024);for(let i=0;i<data.data.length;i+=4){const n=(Math.random()-.5)*27;data.data[i]+=n;data.data[i+1]+=n;data.data[i+2]+=n;}g.putImageData(data,0,0);
 if(type==='wood'){for(let i=0;i<450;i++){g.strokeStyle=`rgba(12,12,8,${rand(.03,.14)})`;g.beginPath();let x=rand(0,1024);g.moveTo(x,0);g.bezierCurveTo(x+rand(-40,40),300,x+rand(-30,30),650,x,1024);g.stroke();}}
 else{const rows=type==='floor'?8:10,dy=1024/rows;for(let row=0;row<rows;row++){const offset=row%2?-.5:0;for(let col=-1;col<6;col++){const x=(col+offset)*205,y=row*dy;g.fillStyle=`rgba(${Math.random()>.4?'35,38,30':'180,177,147'},${rand(.04,.17)})`;g.fillRect(x+2,y+2,201,dy-4);g.strokeStyle='#202e2ab0';g.lineWidth=3;g.strokeRect(x+1,y+1,204,dy);g.strokeStyle='#a8a89677';g.lineWidth=1;g.beginPath();g.moveTo(x+4,y+dy-4);g.lineTo(x+201,y+dy-4);g.lineTo(x+201,y+4);g.stroke();if(Math.random()>.6){g.strokeStyle='#24332a88';g.beginPath();g.moveTo(x+rand(20,180),y+3);g.lineTo(x+rand(20,180),y+dy*.55);g.lineTo(x+rand(20,180),y+dy-2);g.stroke();}}}
 for(let i=0;i<900;i++){g.fillStyle=`rgba(43,63,36,${rand(.025,.1)})`;g.beginPath();g.ellipse(rand(0,1024),rand(0,1024),rand(1,20),rand(1,9),rand(0,6),0,7);g.fill();}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
const stoneTex=texture('stone'),floorTex=texture('floor'),woodTex=texture('wood');floorTex.repeat.set(2,4);stoneTex.repeat.set(1,2);
const stone=new THREE.MeshStandardMaterial({map:stoneTex,color:0x898c7c,roughness:.92,bumpMap:stoneTex,bumpScale:.085});
const darkStone=new THREE.MeshStandardMaterial({map:stoneTex,color:0x454d48,roughness:.88,bumpMap:stoneTex,bumpScale:.09});
const paleStone=new THREE.MeshStandardMaterial({map:stoneTex,color:0xb2a88f,roughness:.8,bumpMap:stoneTex,bumpScale:.05});
const floorMat=new THREE.MeshStandardMaterial({map:floorTex,color:0x8d9584,roughness:.46,metalness:.12,bumpMap:floorTex,bumpScale:.07});
const brass=new THREE.MeshStandardMaterial({color:0xb49a57,metalness:.82,roughness:.35});
const bronze=new THREE.MeshStandardMaterial({color:0x58472d,metalness:.65,roughness:.62});
const bookMaterials=[0x443a2a,0x513438,0x334346,0x8a7955,0x424936,0x62594b].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
const wood=new THREE.MeshStandardMaterial({map:woodTex,color:0x7b6042,roughness:.7,bumpMap:woodTex,bumpScale:.035});
const glow=new THREE.MeshBasicMaterial({color:new THREE.Color(2.7,1.45,.4)}),emberMat=new THREE.MeshBasicMaterial({color:new THREE.Color(3.5,1.5,.25)});
const parchment=new THREE.MeshStandardMaterial({color:0xe4d6ab,roughness:.85,side:THREE.DoubleSide});
scene.add(new THREE.HemisphereLight(0xa3c4d8,0x29271d,1.35));
const moonlight=new THREE.DirectionalLight(0xb8d7e7,2.9);moonlight.position.set(-25,48,-28);moonlight.castShadow=true;moonlight.shadow.mapSize.set(2048,2048);Object.assign(moonlight.shadow.camera,{left:-62,right:62,top:72,bottom:-72,near:1,far:180});moonlight.shadow.bias=-.0004;moonlight.shadow.normalBias=.045;moonlight.target.position.set(0,0,-15);scene.add(moonlight,moonlight.target);
const treeLight=new THREE.PointLight(0xe5bf66,105,34,1.5);treeLight.position.set(0,8,-27);scene.add(treeLight);
const sky=new THREE.Mesh(new THREE.SphereGeometry(210,32,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;uniform float time;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec3 d=normalize(v);float h=max(0.,d.y);vec3 color=mix(vec3(.085,.14,.16),vec3(.014,.028,.049),pow(h,.5));vec2 uv=vec2(atan(d.z,d.x),asin(d.y));float stars=pow(hash(floor(uv*700.)),100.)*step(.12,h);color+=vec3(.68,.73,.62)*stars;float aur=pow(max(0.,1.-abs(d.y-(.45+.07*sin(uv.x*5.+time*.015)+.05*sin(uv.x*11.)))*16.),3.)*.15; color+=vec3(.13,.35,.27)*aur;gl_FragColor=vec4(color,1.);}`}));scene.add(sky);
const moon=new THREE.Mesh(new THREE.SphereGeometry(4,32,24),new THREE.MeshBasicMaterial({color:0xe3ddbd}));moon.position.set(-58,67,-110);scene.add(moon);
// Connected walkable geometry: bridge, courtyard, ascending sanctuary and terrace.
box(9,.75,27,floorMat,0,-.4,14);box(28,.8,46,floorMat,0,-.44,-17);box(19,.7,18,floorMat,0,3.65,-58);
for(const x of [-5,5]){box(.65,1.2,24,stone,x,.25,15);for(let z=5;z<28;z+=4){box(1,1.75,1,paleStone,x,.45,z);box(1.15,.15,1.15,darkStone,x,1.4,z);}}
// Courtyard boundary and outer buttresses.
for(const side of [-1,1]){for(const [wz,wd]of [[1,12],[-27.5,23]]){box(1.7,8,wd,stone,side*14,3.6,wz);coll(side*14,wz,1.7,wd,0,10);}for(let z=4;z>-40;z-=8){if(z<-5&&z>-16)continue;box(1.9,10,1.5,darkStone,side*13.1,4.5,z);box(2.3,.3,2,paleStone,side*13.1,7,z);const butt=box(2,7,1.8,stone,side*15,3,z);butt.rotation.z=side*.14;}}
function column(x,z,height=11,r=.65){cylinder(r,r*1.12,height,stone,x,height/2,z);cylinder(r*1.6,r*1.6,.45,paleStone,x,.22,z);cylinder(r*1.35,r*1.5,.35,darkStone,x,.62,z);cylinder(r*1.4,r*1.4,.5,paleStone,x,height-.2,z);cylinder(r*1.15,r*1.35,.25,darkStone,x,height-.58,z);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cylinder(.09,.12,height-.9,paleStone,x+Math.cos(a)*r*.95,height/2,z+Math.sin(a)*r*.95,scene,6);}coll(x,z,r*2,r*2,0,height);}
function arch(x,z,width=10,height=13,rotation=0,material=paleStone,radius=.22){const pts=[[-width/2,0],[-width/2,height*.53],[-width*.40,height*.72],[-width*.2,height*.9],[0,height],[width*.2,height*.9],[width*.4,height*.72],[width/2,height*.53],[width/2,0]].map(([x,y])=>new THREE.Vector3(x,y,0));const curve=new THREE.CatmullRomCurve3(pts);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,70,radius,7,false),material);m.position.set(x,0,z);m.rotation.y=rotation;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
for(let z=2;z>=-35;z-=9){column(-10.7,z,11.5,.64);column(10.7,z,11.5,.64);arch(0,z,21.4,17,0,stone,.3);arch(0,z-.5,20.9,16.6,0,paleStone,.12);}
// Massive gatehouse, crenellation and ornamented spires.
for(const x of [-8,8]){cylinder(3.15,3.55,16,stone,x,7.7,3,scene,12);cylinder(3.5,3.5,.55,paleStone,x,15.8,3);cylinder(3.25,3.25,.35,bronze,x,16.2,3);const roof=cylinder(0,3.8,7,darkStone,x,19.8,3,scene,12);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;box(.8,1.2,.8,paleStone,x+Math.sin(a)*3.05,16.5,3+Math.cos(a)*3.05);}cylinder(.05,.12,2,brass,x,24,3,scene,6);}
arch(0,3,9.7,12.7,0,paleStone,.5);arch(0,3.35,8.9,12.1,0,bronze,.11);arch(0,2.7,10.3,13,0,stone,.25);
for(const side of [-1,1]){box(3.3,12,3,stone,side*6,5.6,3);coll(side*7.4,3,5,5,0,20);for(let y=2;y<12;y+=2.1)box(3.7,.18,3.3,paleStone,side*6,y,3);}
// High lancet windows, recesses and ribs along the side walls.
for(const side of [-1,1])for(let z=-5;z>-35;z-=9){const group=new THREE.Group();group.position.set(side*13.05,0,z);group.rotation.y=side*Math.PI/2;scene.add(group);const backing=box(4,5.8,.08,new THREE.MeshBasicMaterial({color:0x1b3037}),0,4.8,0,group);arch(side*13,z,3.9,9.3,side*Math.PI/2,bronze,.075);for(let i=-1;i<=1;i++){const mull=cylinder(.045,.045,5.5,bronze,i*.85,4.9,0,group,6);}box(4.3,.2,.45,paleStone,0,1.9,.1,group);}
function haloTexture(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,213,128,1)');grad.addColorStop(.16,'rgba(250,173,72,.6)');grad.addColorStop(.45,'rgba(231,145,46,.12)');grad.addColorStop(1,'rgba(230,142,41,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
const haloTex=haloTexture();
function torch(x,z,y=2.8){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);cylinder(.09,.14,.9,bronze,0,-.35,0,g);cylinder(.28,.12,.27,brass,0,.07,0,g);const flame=new THREE.Mesh(new THREE.SphereGeometry(.14,7,8),emberMat);flame.scale.set(.8,2.8,.8);flame.position.y=.42;g.add(flame);flames.push({mesh:flame,seed:Math.random()*10});const s=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex,color:0xffd097,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.5}));s.scale.set(2.7,2.7,1);s.position.y=.45;g.add(s);const light=new THREE.PointLight(0xffb561,34,11,1.5);light.position.set(x,y+.5,z);scene.add(light);torches.push(light);}
for(const x of [-4.1,4.1])for(const z of [18,8])torch(x,z,2.4);
for(const x of [-10.5,10.5])for(const z of [-6,-16,-26,-35])torch(x,z,3.1);
// Open cloister alcoves, benches, weathered books and actual writing furniture.
function desk(x,z,angle=0){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;scene.add(group);box(2.7,.18,1.35,wood,0,1.1,0,group);for(const dx of [-1.05,1.05])for(const dz of [-.45,.45])box(.15,1.05,.15,wood,dx,.55,dz,group);box(2.4,.12,1.15,bronze,0,1.22,0,group);coll(x,z,2.7,1.35);const page=box(.7,.015,.5,parchment,-.15,1.3,0,group);page.rotation.y=.1;const ink=cylinder(.07,.1,.18,bronze,.5,1.34,-.1,group);const quill=box(.025,.65,.02,parchment,.6,1.65,-.1,group);quill.rotation.z=-.3;for(let i=0;i<4;i++){const b=box(.45,.12,.6,new THREE.MeshStandardMaterial({color:[0x443a2a,0x513438,0x334346,0x8a7955][i],roughness:.8}),-.8,1.35+i*.12,-.1,group);b.rotation.y=rand(-.1,.1);}torch(x+1.05,z,1.6);return group;}
desk(-7,-9,.2);desk(7,-18,-.2);
for(const side of [-1,1])for(let z=-19;z>-29;z-=9){box(1.3,4.4,4,wood,side*12,2.2,z);coll(side*12,z,1.4,4);for(let y=.7;y<4;y+=.8){box(1.5,.1,4.2,bronze,side*12,y,z);for(let i=0;i<10;i++){box(.6,rand(.35,.65),.2,bookMaterials[(Math.random()*bookMaterials.length)|0],side*11.8,y+.3,z-1.8+i*.37);}}}
// Garden fountain and a reflective, shallow moon pool.
const poolBase=cylinder(4.6,4.8,.3,darkStone,0,.05,-27,scene,64);const rim=new THREE.Mesh(new THREE.TorusGeometry(4.65,.12,8,96),paleStone);rim.rotation.x=Math.PI/2;rim.position.set(0,.2,-27);scene.add(rim);
const water=new Reflector(new THREE.CircleGeometry(4.5,64),{color:0x536558,textureWidth:512,textureHeight:512,clipBias:.003});water.rotation.x=-Math.PI/2;water.position.set(0,.22,-27);scene.add(water);water.visible=!lite;
// The wishing tree is modeled branch by branch, with instanced luminous leaves.
const branchGeometries=[],leafMatrices=[],leafObject=new THREE.Object3D();
function branch(start,end,r,depth){const mid=start.clone().lerp(end,.5).add(new THREE.Vector3(rand(-r,r),0,rand(-r,r)));const curve=new THREE.CatmullRomCurve3([start,mid,end]);const geo=new THREE.TubeGeometry(curve,7,r,6,false);branchGeometries.push(geo);if(depth===0){for(let n=0;n<17;n++){leafObject.position.copy(end).add(new THREE.Vector3(rand(-1.4,1.4),rand(-.4,1.2),rand(-1.4,1.4)));leafObject.rotation.set(rand(0,3),rand(0,6),rand(0,3));leafObject.scale.set(rand(.08,.18),rand(.2,.5),rand(.04,.09));leafObject.updateMatrix();leafMatrices.push(leafObject.matrix.clone());}return;}const direction=end.clone().sub(start);for(let i=0;i<3;i++){const a=rand(0,Math.PI*2);const length=direction.length()*.68;const to=end.clone().add(new THREE.Vector3(Math.cos(a)*length*.67,length*rand(.5,.85),Math.sin(a)*length*.67));branch(end,to,r*.58,depth-1);}}
branch(new THREE.Vector3(0,.1,-27),new THREE.Vector3(.6,5.4,-27),.65,4);
const treeMaterial=new THREE.MeshStandardMaterial({color:0x826135,roughness:.76,metalness:.15,emissive:0x895715,emissiveIntensity:.15,bumpMap:woodTex,bumpScale:.07});const tree=new THREE.Mesh(mergeGeometries(branchGeometries),treeMaterial);tree.castShadow=true;scene.add(tree);branchGeometries.forEach(g=>g.dispose());
const leafMat=new THREE.MeshStandardMaterial({color:0xe1bd62,roughness:.55,metalness:.15,emissive:0xd49b2d,emissiveIntensity:.85});const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),leafMat,leafMatrices.length);leafMatrices.forEach((matrix,i)=>leaves.setMatrixAt(i,matrix));scene.add(leaves);coll(0,-27,2.7,2.7);
for(let i=0;i<7;i++){const a=i/7*6.28;const root=box(.2,.18,3.5,treeMaterial,Math.sin(a)*1.2,.28,-27+Math.cos(a)*1.2);root.rotation.y=a;}
// Approach-based letter stations. These are world meshes, not image hotspots.
function register(group,kind,title,position){group.userData.interaction={kind,title,position:new THREE.Vector3(...position)};interactables.push(group);}
function runeTexture(){const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.font='40px Georgia';g.textAlign='center';g.fillStyle='#f6c96e';g.shadowColor='#ffcd6c';g.shadowBlur=15;g.fillText('ᛟ  ᚹ  ᛉ  ᛊ  ᚷ  ᛟ',256,76);return new THREE.CanvasTexture(c);}
const runemat=new THREE.MeshBasicMaterial({map:runeTexture(),transparent:true,depthWrite:false,side:THREE.DoubleSide,color:new THREE.Color(2,1.25,.4)});
function letterStone(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cylinder(.48,.65,.75,darkStone,0,.37,0,g,8);box(1.3,.14,.8,paleStone,0,.8,0,g);const env=box(.57,.018,.36,parchment,0,.9,0,g);env.rotation.y=.15;const seal=cylinder(.055,.055,.02,new THREE.MeshStandardMaterial({color:0x7b3330,roughness:.4}),0,.925,0,g,12);const light=new THREE.PointLight(0xecc36b,1.1,4,1.5);light.position.set(0,1.3,0);g.add(light);const glyph=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.35),runemat);glyph.rotation.x=-Math.PI/2;glyph.position.set(0,.06,1.25);g.add(glyph);register(g,'post','Read a nameless letter',[x,1,z]);coll(x,z,1.1,.7);return g;}
letterStone(0,14.5);letterStone(5,-6);letterStone(-5,-23);
register(scene.children.find(o=>o.position.x===-7&&o.position.z===-9&&o.type==='Group'),'write','Leave a little light',[-7,1.1,-9]);
const exchange=new THREE.Group();exchange.position.set(7,0,-18);scene.add(exchange);const coffer=box(1.2,.65,.75,wood,0,1.65,0,exchange);for(const x of [-.45,.45])box(.07,.7,.8,brass,x,1.65,0,exchange);const lock=box(.15,.22,.07,brass,0,1.65,.41,exchange);register(exchange,'rewards',"The keeper's exchange",[7,1.8,-18]);
const shrine=new THREE.Group();shrine.position.set(0,0,-20.5);scene.add(shrine);cylinder(.6,.8,.7,paleStone,0,.35,0,shrine);const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,2),glow);orb.position.y=1.2;shrine.add(orb);floating.push({mesh:orb,y:1.2});const oLight=new THREE.PointLight(0xffd47b,10,7,1.5);oLight.position.y=1.4;shrine.add(oLight);register(shrine,'post','Listen to the wishing tree',[0,1,-20.5]);coll(0,-20.5,1.3,1.3);
// Walkable staircase and a physically opening portcullis to the reward terrace.
for(let i=0;i<22;i++){box(7,.22,1.1,stone,0,.1+i*.18,-37-i*.65);}
for(const x of [-4.2,4.2]){box(1,5,14,darkStone,x,1.5,-43);coll(x,-43,1,14);}
arch(0,-36.5,7.8,10,0,paleStone,.3);arch(0,-50,8,11,0,stone,.3);
const gate=new THREE.Group();gate.position.set(0,0,-36.4);scene.add(gate);for(let x=-3.4;x<=3.5;x+=.43){box(.08,7,.09,bronze,x,3.5,0,gate);const tip=new THREE.Mesh(new THREE.ConeGeometry(.14,.45,4),brass);tip.position.set(x,-.05,0);tip.rotation.z=Math.PI;gate.add(tip);}for(let y=1;y<7;y+=1.5)box(7,.12,.12,bronze,0,y,0,gate);
box(7,5,2,stone,-7,5,-50);box(7,5,2,stone,7,5,-50);
for(const x of [-9.5,9.5]){box(.6,1.4,18,stone,x,4.5,-58);for(let z=-51;z>-67;z-=3){box(.9,1.9,.9,paleStone,x,4.7,z);}}
box(19,1.4,.6,stone,0,4.5,-67);for(let i=-3;i<=3;i++){column(i*3,-67,10,.27);}
const terraceLetter=letterStone(0,-59);terraceLetter.position.y=4;terraceLetter.userData.interaction.position.y=5;
// Distant mountains and the silhouettes of a kingdom beyond the courtyard.
const distantMat=new THREE.MeshStandardMaterial({color:0x273f43,roughness:1,flatShading:true});for(let i=0;i<36;i++){const a=i/36*6.28,r=rand(65,120),h=rand(10,42);const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),distantMat);m.scale.set(rand(8,24),h*.6,rand(8,24));m.position.set(Math.cos(a)*r,h/2-8,Math.sin(a)*r-15);scene.add(m);}
for(let i=0;i<12;i++){const x=rand(-65,65),z=rand(-100,-70),h=rand(12,28);cylinder(1.5,2,h,darkStone,x,h/2,z,scene,8);cylinder(0,2.5,6,darkStone,x,h+3,z,scene,8);}
// Ground scatter: stones, pale flowers, moss and fallen leaves, instanced.
const scatterCount=420,scatter=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),darkStone,scatterCount),dummy=new THREE.Object3D();for(let i=0;i<scatterCount;i++){let x=rand(-12.6,12.6),z=rand(-34,1);if(Math.abs(x)<3.8)x+=(x>0?5:-5);dummy.position.set(x,rand(.03,.13),z);dummy.rotation.set(rand(0,3),rand(0,6),rand(0,3));dummy.scale.set(rand(.04,.3),rand(.04,.18),rand(.07,.38));dummy.updateMatrix();scatter.setMatrixAt(i,dummy.matrix);}scatter.receiveShadow=true;scene.add(scatter);
const grassMat=new THREE.MeshStandardMaterial({color:0x5e6950,roughness:1,side:THREE.DoubleSide});const grasses=new THREE.InstancedMesh(new THREE.PlaneGeometry(.13,.65),grassMat,700);for(let i=0;i<700;i++){let x=rand(-12.6,12.6);if(Math.abs(x)<5)x+=(x>0?5:-5);dummy.position.set(x,.27,rand(-34,0));dummy.rotation.set(rand(-.2,.2),rand(0,6),rand(-.3,.3));dummy.scale.set(1,rand(.35,1.2),1);dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix);}scene.add(grasses);
// Atmospheric embers in real world space, drifting through the vaults.
const dustPositions=new Float32Array(800*3),dustSeeds=[];for(let i=0;i<800;i++){dustPositions[i*3]=rand(-12,12);dustPositions[i*3+1]=rand(.2,15);dustPositions[i*3+2]=rand(-55,25);dustSeeds.push(rand(0,6));}const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({map:haloTex,color:0xf2cc84,size:.1,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);
// Faint diagonal moon shafts. Their depth changes naturally as the camera moves.
for(let i=0;i<5;i++){const shaft=new THREE.Mesh(new THREE.PlaneGeometry(2.5,22),new THREE.MeshBasicMaterial({color:0xc3dddc,transparent:true,opacity:.019,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));shaft.position.set(-4+i*3,9,-8-i*5);shaft.rotation.z=-.48;shaft.rotation.y=.45;scene.add(shaft);mistPlanes.push(shaft);}
// A proper mesh lantern, held in the camera frame once redeemed.
const handLantern=new THREE.Group();handLantern.position.set(.42,-.43,-.65);handLantern.scale.setScalar(.14);camera.add(handLantern);box(.8,.15,.8,bronze,0,-.5,0,handLantern);box(.8,.12,.8,bronze,0,.6,0,handLantern);for(const x of [-.32,.32])for(const z of [-.32,.32])box(.04,1.1,.04,brass,x,.05,z,handLantern);const glass=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.85,10),new THREE.MeshStandardMaterial({color:0xf8b85a,transparent:true,opacity:.2,emissive:0xffa22a,emissiveIntensity:1,roughness:.25}));handLantern.add(glass);const lflame=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),glow);lflame.scale.y=2;handLantern.add(lflame);const handlight=new THREE.PointLight(0xffc47c,3.2,9,1.3);handlight.position.set(.2,-.1,-.7);camera.add(handlight);
let meteors=[];function meteorShower(){for(let i=0;i<18;i++){const line=new THREE.Mesh(new THREE.CylinderGeometry(.018,.002,6,4),glow);line.material=glow.clone();line.material.depthTest=false;line.renderOrder=115;line.rotation.z=-.8;line.position.set(rand(-45,50),rand(32,58),rand(-90,-40));line.visible=false;scene.add(line);meteors.push({mesh:line,delay:i*.25,life:3});}}
handLantern.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.depthTest=false;o.renderOrder=120;}});
const ui=createLetters(id=>{if(id==='stars')meteorShower();},(kind,id)=>adventure.onActivity(kind,id));
const adventure=createExpedition({scene,player,ui,box,cylinder,stone,paleStone,wood,brass,glow,register,obstacles,navigate:navigateTo});
const realms=createRealms({scene,player,box,cylinder,arch,coll,register,stone,paleStone,darkStone,wood,brass,parchment,glow,torch});
const archiveRoom={active:false};
const soundscape=createSoundscape($('realm-audio'));let lastSoundPosition=player.clone();
function navigateTo(place){keys.clear();activeStep='';walkingTarget=0;velocity.set(0,0,0);let route=[];const hub={x:0,z:-13.5};if(player.x<-15&&player.y>2)route=[{x:-41.5,z:-21},{x:-41.5,z:-3},{x:-35,z:-3},{x:-35,z:-13.5},hub];else if(player.x<-15)route=[{x:player.x,z:-13.5},hub];else if(player.x>15)route=[{x:27,z:player.z},{x:27,z:-13.5},hub];else if(player.z>3)route=[{x:2,z:player.z},{x:2,z:7},hub];else if(player.y>2&&player.x>6)route=[{x:8.25,z:-17.5},{x:8.25,z:-4.5},{x:3,z:-4.5},hub];else route=[hub];const paths={cathedral:[{x:0,z:-15}],library:[{x:-31,z:-13.5}],winter:[{x:27,z:-13.5},{x:27,z:-6},{x:33,z:-6}],garden:[{x:2,z:7},{x:2,z:25},{x:0,z:28},{x:0,z:46}],upstairs:[{x:3,z:-4},{x:8.25,z:-4},{x:8.25,z:-17.5},{x:8.25,z:-26.8}],'library-loft':[{x:-35,z:-13.5},{x:-35,z:-3},{x:-41.5,z:-3},{x:-41.5,z:-21.5},{x:-32,z:-22.3}],home:[{x:0,z:-4}]};autoPath=route.concat(paths[place]||paths.cathedral);routeFocus={cathedral:[0,-27],library:[-41,-12],winter:[33,-11],garden:[0,48],upstairs:[8.25,-29.2],'library-loft':[-32,-24]}[place]||[0,-27];}
$('camera-view').value=adventure.state.follow?'follow':'first';$('camera-view').addEventListener('change',()=>adventure.setCamera($('camera-view').value==='follow')); handLantern.visible=ui.has('lantern')&&player.z<4&&!adventure.state.follow;handlight.visible=ui.has('lantern');
function floorHeight(x,z){const level=realms.floorAt(x,z)??adventure.groundHeight(x,z);if(level!==null&&level!==undefined)return level<=player.y+.48?level:0;return z<-50?4:z<-36?Math.min(4,(-z-36)*.2857):0;}

function canStand(x,z){const wing=z>=-26&&z<=5&&Math.abs(x)<=47.3;const keep=x>=-12.6&&x<=12.6&&z>=-35.5&&z<=3;const bridge=Math.abs(x)<=4.15&&z>3&&z<=28;const garden=Math.abs(x)<15.3&&z>=27&&z<58.5;const roof=ui.has('roof')&&((z<-35.5&&z>=-50&&Math.abs(x)<3.4)||(z<-50&&z>=-65&&Math.abs(x)<8.8));if(!(wing||keep||bridge||garden||roof))return false;const ground=floorHeight(x,z);if(ground>player.y+.48)return false;for(const o of obstacles){if(ground>=o.maxY-.03||ground+1.4<o.minY)continue;if(Math.abs(x-o.x)<o.hw&&Math.abs(z-o.z)<o.hd)return false;}return true;}

function tryMove(dx,dz){if(canStand(player.x+dx,player.z))player.x+=dx;if(canStand(player.x,player.z+dz))player.z+=dz;}
function useObject(object=activeObject){if(!object||!entered||demo?.active)return;walkingTarget=0;autoPath=[];keys.clear();if(realms.use(object,ui))return;if(adventure.use(object,time))return;const kind=object.userData.interaction.kind;if(kind==='write')ui.openWrite();else if(kind==='rewards')ui.openRewards();else ui.openPost();}
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{if(!entered||archiveRoom.active||demo?.active)return;dragging=true;dragged=false;lastPointer={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!entered||archiveRoom.active||demo?.active||document.querySelector('dialog[open]'))return;let dx=0,dy=0;if(document.pointerLockElement){dx=e.movementX;dy=e.movementY;}else if(dragging){dx=e.clientX-lastPointer.x;dy=e.clientY-lastPointer.y;lastPointer={x:e.clientX,y:e.clientY};if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;}yaw-=dx*sensitivity;pitch=THREE.MathUtils.clamp(pitch-dy*sensitivity,-1.2,1.2);});
renderer.domElement.addEventListener('pointerup',e=>{dragging=false;if(!entered||archiveRoom.active||demo?.active||dragged||document.querySelector('dialog[open]'))return;mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(interactables.filter(o=>adventure.canInteract(o)),true);if(hits.length&&hits[0].distance<4.6){let o=hits[0].object;while(o&&!o.userData.interaction)o=o.parent;if(o)useObject(o);}});
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
document.addEventListener('keydown',e=>{if(!entered||demo?.active||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;if(archiveRoom.active){if(archiveRoom.key(e.code))e.preventDefault();return;}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)useObject();if(e.code==='Space'&&grounded){vertical=4.7;grounded=false;}});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();activeStep='';});document.addEventListener('keep:pause',()=>{keys.clear();activeStep='';walkingTarget=0;});
$('interact').addEventListener('click',()=>useObject());
for(const button of document.querySelectorAll('[data-step]')){button.addEventListener('pointerdown',e=>{activeStep=button.dataset.step;stepStarted=performance.now();button.setPointerCapture(e.pointerId);});button.addEventListener('pointerup',()=>{if(performance.now()-stepStarted<200){if(activeStep==='left'||activeStep==='right')turnTarget+=activeStep==='left'?.52:-.52;else walkingTarget+=activeStep==='forward'?2.4:-2.4;}activeStep='';});button.addEventListener('pointercancel',()=>activeStep='');button.addEventListener('click',e=>{if(e.detail===0){const direction=button.dataset.step;if(direction==='left'||direction==='right')turnTarget+=direction==='left'?.52:-.52;else walkingTarget+=direction==='forward'?2.4:-2.4;}});}
$('begin').addEventListener('click',()=>{entered=true;clock.getDelta();$('game').classList.add('entered');$('begin').blur();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game').requestFullscreen();}catch{ui.toast('This window already holds the whole world.');}});
document.addEventListener('fullscreenchange',()=>$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit full screen':'Enter full screen'));
$('lock-look').addEventListener('click',async()=>{$('settings-dialog').close();try{await renderer.domElement.requestPointerLock();}catch{ui.toast('Drag the world to look around.');}});
$('sensitivity').addEventListener('change',()=>sensitivity=Number($('sensitivity').value));
$('quality').addEventListener('change',()=>{if($('quality').value==='lite'||(lite&&$('quality').value==='cinematic')){const u=new URL(location.href);if($('quality').value==='lite')u.searchParams.set('graphics','lite');else u.searchParams.delete('graphics');location.assign(u.href);return;}if(lite){$('quality').value='lite';return;}quality=$('quality').value;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='cinematic'?1.5:1));bloom.enabled=quality==='cinematic';water.visible=quality==='cinematic';renderer.shadowMap.enabled=quality==='cinematic';resize();});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}window.addEventListener('resize',resize);
const liteLights=[];if(lite){$('quality').value='lite';scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isPointLight&&o!==handlight)liteLights.push({light:o,position:o.getWorldPosition(new THREE.Vector3())});});}
// Bake static meshes by material to reduce draw calls without flattening the world.
scene.updateMatrixWorld(true);
const batches=new Map();
scene.traverse(mesh=>{
 if(!mesh.isMesh||mesh.isInstancedMesh||mesh.isReflector||!mesh.material?.isMeshStandardMaterial)return;
 let p=mesh;while(p&&p!==scene){if(p===camera||p===gate||p.userData.dynamic||interactables.includes(p))return;p=p.parent;}
 const key=mesh.material.uuid;if(!batches.has(key))batches.set(key,{material:mesh.material,meshes:[],geometries:[]});
 const batch=batches.get(key);batch.meshes.push(mesh);batch.geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
});
for(const batch of batches.values()){
 const geometry=mergeGeometries(batch.geometries);if(!geometry)continue;
 const mesh=new THREE.Mesh(geometry,batch.material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 for(const original of batch.meshes){original.removeFromParent();original.geometry.dispose();}
 batch.geometries.forEach(g=>g.dispose());
}
// The new entry renders only modeled spaces. The earlier image projection
// remains in illustrated.html / world.js, reachable from the realm map.
function updateEntrance(){ $('home-heading').hidden=true;$('hotspots').hidden=true; }
$('home-letter').addEventListener('click',()=>ui.openPost());$('home-chest').addEventListener('click',()=>ui.openRewards());
function walkInside(){if(player.z>4)queuedArchive=false;if(player.y>2&&player.x>6){navigateTo('archive');return;}if(player.z>4)autoPath=[{x:1.5,z:player.z},{x:1.5,z:11},{x:0,z:7},{x:0,z:-7}];else autoPath=[{x:3,z:player.z},{x:3,z:-17},{x:0,z:-18}];}
$('home-door').addEventListener('click',walkInside);$('walk-inside').addEventListener('click',walkInside);
$('walk-home').addEventListener('click',()=>navigateTo('home'));
$('home-guide').addEventListener('click',()=>ui.modal('destination-dialog'));
new THREE.TextureLoader().load('assets/stone.jpg',tex=>{tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();for(const mat of [stone,darkStone,paleStone]){mat.map=tex;mat.bumpMap=tex;mat.bumpScale=.16;mat.needsUpdate=true;}const floor=tex.clone();floor.needsUpdate=true;floor.repeat.set(2,4);floorMat.map=floor;floorMat.bumpMap=floor;floorMat.bumpScale=.1;floorMat.needsUpdate=true;});

demo=createDemo({
 modal:ui.modal,
 capture:()=>({player:player.clone(),yaw,pitch,follow:adventure.state.follow,camera:camera.position.clone(),gateLift}),
 begin(){keys.clear();autoPath=[];velocity.set(0,0,0);walkingTarget=0;activeStep='';turnTarget=0;adventure.beginDemo();realms.beginDemo();},
 resetWorld(){keys.clear();autoPath=[];walkingTarget=0;activeStep='';turnTarget=0;velocity.set(0,0,0);adventure.resetDemo();realms.resetDemo();},
 restore(saved,keep){keys.clear();autoPath=[];walkingTarget=0;turnTarget=0;activeStep='';velocity.set(0,0,0);guideSpeed=4.2;vertical=0;grounded=true;adventure.endDemo();realms.endDemo();if(!keep){player.copy(saved.player);yaw=saved.yaw;pitch=saved.pitch;camera.position.copy(saved.camera);}gateLift=saved.gateLift;$('camera-view').value=saved.follow?'follow':'first';for(const m of meteors.filter(m=>m.demo)){scene.remove(m.mesh);m.mesh.geometry.dispose();m.mesh.material.dispose();}meteors=meteors.filter(m=>!m.demo);renderer.domElement.dataset.demo='off';ui.toast(keep?'Your turn. Your saved progress is unchanged.':'Demo closed. Back where you left off.');},
 place(x,y,z,heading=0){player.set(x,y,z);velocity.set(0,0,0);vertical=0;grounded=true;yaw=heading;pitch=0;autoPath=[];camera.position.set(x+Math.sin(yaw)*4,y+adventure.cameraHeight()-.2,z+Math.cos(yaw)*4);camera.lookAt(x,y+adventure.focusHeight()+.35,z);},
 move(points,speed=4.2){guideSpeed=speed;routeFocus=null;autoPath=points.map(([x,z])=>({x,z}));},
 stopWalking(){autoPath=[];velocity.set(0,0,0);},
 look(heading,tilt=0){yaw=heading;pitch=tilt;},
 jump(){if(grounded){vertical=4.7;grounded=false;}},
 drawer:t=>adventure.demoDrawer(t),reach:t=>adventure.demoReach(t),
 traveler:id=>adventure.demoTraveler(id),mode:id=>adventure.demoMode(id),
 collect:(id,t)=>adventure.collectSeal(id,t),orrery:value=>realms.demoOrrery(value),
 stars(){const before=meteors.length;meteorShower();meteors.slice(before).forEach(m=>m.demo=true);},
 rewards(){},
 telemetry(chapter,elapsed){renderer.domElement.dataset.demo='playing';renderer.domElement.dataset.demoChapter=String(chapter+1);renderer.domElement.dataset.demoTime=elapsed.toFixed(1);}
});
let adapted=false,slowFrames=0;
function animate(){if(graphicsFailed)return;animationFrame=requestAnimationFrame(animate);const rawDt=Math.min(clock.getDelta(),.045),dt=demo?.paused?0:rawDt;time+=dt;frame++;demo?.update(dt,time);const paused=Boolean(document.querySelector('dialog[open]'))||Boolean(demo?.paused);if(archiveRoom.active){adventure.update({time,dt,yaw,paused,inside:true});archiveRoom.update(dt,time);renderer.domElement.dataset.frame=frame;return;}if(entered&&!paused){let moveX=0,moveZ=0;
 if(keys.size||activeStep)autoPath=[];
 if(autoPath.length){const target=autoPath[0],dx=target.x-player.x,dz=target.z-player.z,dist=Math.hypot(dx,dz);if(dist<.15){autoPath.shift();if(!autoPath.length&&routeFocus)yaw=Math.atan2(player.x-routeFocus[0],player.z-routeFocus[1]);}else{const desired=Math.atan2(-dx,-dz);yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*(1-Math.exp(-4*dt));const length=Math.min(dist,dt*guideSpeed);tryMove(dx/dist*length,dz/dist*length);pitch=THREE.MathUtils.damp(pitch,-.02,3,dt);}}
 if(keys.has('KeyW')||keys.has('ArrowUp')||activeStep==='forward')moveZ+=1;if(keys.has('KeyS')||keys.has('ArrowDown')||activeStep==='back')moveZ-=1;if(keys.has('KeyA'))moveX-=1;if(keys.has('KeyD'))moveX+=1;if(keys.has('ArrowLeft')||activeStep==='left')yaw+=dt*1.6;if(keys.has('ArrowRight')||activeStep==='right')yaw-=dt*1.6;
 if(Math.abs(turnTarget)>.002){const part=turnTarget*(1-Math.exp(-9*dt));yaw+=part;turnTarget-=part;}
 if(Math.abs(walkingTarget)>.025){const distance=Math.min(Math.abs(walkingTarget),3.8*dt)*Math.sign(walkingTarget);tryMove(-Math.sin(yaw)*distance,-Math.cos(yaw)*distance);walkingTarget-=distance;}
 const moving=Math.abs(moveX)+Math.abs(moveZ)>0,run=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&stamina>.06&&moving;stamina=THREE.MathUtils.clamp(stamina+(run?-.26:.15)*dt,0,1);const speed=run?6:3;const length=Math.max(1,Math.hypot(moveX,moveZ));const targetX=(Math.cos(yaw)*moveX-Math.sin(yaw)*moveZ)/length*speed,targetZ=(-Math.sin(yaw)*moveX-Math.cos(yaw)*moveZ)/length*speed;velocity.x=THREE.MathUtils.damp(velocity.x,targetX,9,dt);velocity.z=THREE.MathUtils.damp(velocity.z,targetZ,9,dt);tryMove(velocity.x*dt,velocity.z*dt);
 const ground=floorHeight(player.x,player.z);vertical-=12*dt;player.y+=vertical*dt;if(player.y<=ground){player.y=ground;vertical=0;grounded=true;}stepPhase+=Math.hypot(velocity.x,velocity.z)*dt*2.5;
 if(adventure.state.follow){const blend=1;const offset=new THREE.Vector3(player.x+Math.sin(yaw)*4*blend,player.y+THREE.MathUtils.lerp(1.72,adventure.cameraHeight()-.2,blend)-Math.sin(pitch)*2*blend,player.z+Math.cos(yaw)*4*blend);offset.x=THREE.MathUtils.clamp(offset.x,-47,47);const focus=new THREE.Vector3(player.x,player.y+1.3,player.z);for(let i=1;i<=12;i++){const q=focus.clone().lerp(offset,i/12);if(obstacles.some(o=>q.y>o.minY&&q.y<o.maxY&&Math.abs(q.x-o.x)<o.hw+.1&&Math.abs(q.z-o.z)<o.hd+.1)){offset.copy(focus.clone().lerp(offset,Math.max(.15,(i-1)/12)));break;}}camera.position.lerp(offset,1-Math.exp(-9*dt));camera.lookAt(player.x-Math.sin(yaw)*1.6,player.y+THREE.MathUtils.lerp(1.72,adventure.focusHeight()+.35,blend)+Math.sin(pitch)*1.5,player.z-Math.cos(yaw)*1.6);}else{camera.position.set(player.x,player.y+1.72+(reduced.matches?0:Math.sin(stepPhase)*Math.min(velocity.length()*.014,.045)),player.z);camera.rotation.set(pitch,yaw,0);}$('stamina-fill').style.transform=`scaleX(${stamina})`;
 const next=player.y>3&&player.x>6?'The Upper Archive':player.z>3?'The Moonlit Gate':player.z>-18?'The Whispering Archive':player.z>-36?'The Court of Unsaid Things':player.z>-50?'The Ascending Stair':'The Moon Terrace';if(next!==region){region=next;$('region-name').textContent=region;if(player.z<3)$('quest-text').textContent=player.z>-18?'The writing desk rests in the western alcove.':'Every light in the tree was once a word someone needed.';}
 let nearest=null,dist=3.5;for(const o of interactables){const p=o.userData.interaction.position;if(!adventure.canInteract(o)||Math.abs(player.y+1.1-p.y)>2.1)continue;const d=Math.hypot(player.x-p.x,player.z-p.z,(player.y+1.1-p.y)*.55);const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const to=p.clone().sub(new THREE.Vector3(player.x,player.y+1,player.z));to.y=0;const dot=to.normalize().dot(forward);if(d<dist&&dot>-.3){dist=d;nearest=o;}}activeObject=nearest;$('interact').hidden=!nearest;if(nearest){$('interact-name').textContent=nearest.userData.interaction.title;$('interact').querySelector('small').textContent=nearest.userData.interaction.kind==='orrery'?'START OR STOP THE CELESTIAL RINGS':nearest.userData.interaction.kind.includes('drawer')?'PULL THE DRAWER · READ OR LEAVE A LETTER':'READ A LETTER · LEAVE A LITTLE LIGHT';}
 $('compass-directions').textContent=Math.cos(yaw)>.7?'W　N　E':Math.cos(yaw)<-.7?'E　S　W':Math.sin(yaw)>.0?'S　W　N':'N　E　S';
 }else{velocity.multiplyScalar(.8);$('interact').hidden=true;}
 // The entrance retains projected artwork; the connected interior is modeled geometry.
 if(!entered){camera.position.set(Math.sin(time*.05)*.3,2.3,19);camera.rotation.set(-.02,Math.sin(time*.04)*.03,0);}
 gateLift=THREE.MathUtils.damp(gateLift,(ui.has('roof')||demo?.gateOpen)?7.3:0,1.3,dt);gate.position.y=gateLift;handLantern.visible=ui.has('lantern')&&player.z<4&&!adventure.state.follow;handlight.visible=ui.has('lantern');handLantern.rotation.z=reduced.matches?0:Math.sin(stepPhase*.5)*.04;handLantern.position.y=-.43+(reduced.matches?0:Math.sin(stepPhase)*.01);
 if(!reduced.matches){for(const {mesh,seed}of flames){mesh.scale.y=2.4+Math.sin(time*12+seed)*.5;mesh.scale.x=.8+Math.sin(time*16+seed)*.12;}for(let i=0;i<torches.length;i++)torches[i].intensity=32+Math.sin(time*9+i)*3;for(const item of floating)item.mesh.position.y=item.y+Math.sin(time*1.4)*.1;for(let i=0;i<800;i++){dustPositions[i*3+1]+=(.06+Math.sin(i)*.02)*dt;dustPositions[i*3]+=(Math.sin(time*.2+dustSeeds[i]))*.02*dt;if(dustPositions[i*3+1]>16)dustPositions[i*3+1]=.2;}dustGeo.attributes.position.needsUpdate=true;sky.material.uniforms.time.value=time;}
 for(const m of meteors){m.delay-=dt;if(m.delay>0)continue;m.mesh.visible=true;m.mesh.position.x-=dt*13;m.mesh.position.y-=dt*10;m.life-=dt;}meteors=meteors.filter(m=>{if(m.life>0)return true;scene.remove(m.mesh);m.mesh.geometry.dispose();return false;});
 if(frame%15===0){renderer.domElement.dataset.playerX=player.x.toFixed(2);renderer.domElement.dataset.playerY=player.y.toFixed(2);renderer.domElement.dataset.traveler=adventure.state.traveler;renderer.domElement.dataset.mode=adventure.state.mode;renderer.domElement.dataset.playerZ=player.z.toFixed(2);renderer.domElement.dataset.heading=yaw.toFixed(2);renderer.domElement.dataset.route=JSON.stringify(autoPath[0]||null);renderer.domElement.dataset.frame=frame;}
 adventure.update({time,dt,yaw,paused,inside:adventure.state.follow});
 realms.update(dt,time);soundscape.update(dt,time,player.distanceTo(lastSoundPosition)/Math.max(.001,dt),realms.location(),paused);lastSoundPosition.copy(player);renderer.domElement.dataset.room=realms.location();renderer.domElement.dataset.openDrawers=String(realms.drawers.filter(d=>d.open>.5).length);$('realm-title').textContent=realms.location();$('realm-compass').textContent=player.x<-15?'WEST WING · ASH & PAPER':player.x>15?'EAST WING · SNOW & STARS':player.z>26?'SOUTH WING · GLASS & ROOTS':'CENTRAL KEEP · RAIN & STONE';$('region-name').textContent=realms.location();
 if(lite&&frame%15===1){const closest=[...liteLights].sort((a,b)=>a.position.distanceToSquared(player)-b.position.distanceToSquared(player)).slice(0,6);for(const item of liteLights)item.light.visible=closest.includes(item);}
 updateEntrance();composer.render();if(!firstRendered){firstRendered=true;window.dispatchEvent(new Event('castle:ready'));}
 if(!adapted&&frame<100&&dt>.04)slowFrames++;if(!adapted&&frame===100&&slowFrames>45){adapted=true;renderer.setPixelRatio(1);bloom.resolution.set(innerWidth*.65,innerHeight*.65);composer.setSize(innerWidth,innerHeight);}
}
$('begin').disabled=false;$('begin').textContent='ENTER THE KEEP';$('loading-line').hidden=true;$('game').classList.add('realm-game');$('begin').click();animate();
