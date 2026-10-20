import * as THREE from 'three';

// Connected, modeled environments. All bounds and stair heights are world units.
export function createRealms({scene,player,box,cylinder,arch,coll,register,stone,paleStone,darkStone,wood,brass,parchment,glow,torch}){
 const snow=new THREE.MeshStandardMaterial({color:0x94a8b0,roughness:.94});
 const charcoal=new THREE.MeshStandardMaterial({color:0x27262a,roughness:.94,map:stone.map,bumpMap:stone.bumpMap,bumpScale:.09});
 const iron=new THREE.MeshStandardMaterial({color:0x30454b,metalness:.8,roughness:.38});
 const moss=new THREE.MeshStandardMaterial({color:0x4b6754,roughness:.95});
 const glass=new THREE.MeshPhysicalMaterial({color:0x659b9d,roughness:.15,metalness:.1,transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false});
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(500,500,1,1),new THREE.MeshStandardMaterial({color:0x0b2027,metalness:.35,roughness:.45}));sea.rotation.x=-Math.PI/2;sea.position.y=-5;scene.add(sea);
 for(const x of [-3.8,3.8])for(const z of [10,22])box(1.4,7,1.8,darkStone,x,-3.5,z);
 const drawers=[],rings=[],vines=[],lights=[],rainAreas=[],sparks=[];let turning=false,selected=null;
 function line(points,mat,r=.04,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,32,r,6,false),mat);parent.add(m);m.castShadow=true;return m;}
 function ring(radius,tube,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,96),mat);m.position.set(x,y,z);parent.add(m);return m;}
 function doorwayWall(x,side){box(1,12,33,darkStone,x,5.5,-10.5);coll(x,-10.5,1,33,0,13);arch(x-side*.55,-10.5,12,11,Math.PI/2,paleStone,.18);}
 function placeLight(color,intensity,x,y,z,range=15){const l=new THREE.PointLight(color,intensity,range,1.7);l.position.set(x,y,z);scene.add(l);lights.push(l);return l;}
 function letter(x,y,z,label){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);cylinder(.42,.6,.75,darkStone,0,.38,0,g);box(1.15,.12,.75,paleStone,0,.82,0,g);const page=box(.5,.015,.32,parchment,0,.91,0,g);page.rotation.y=.2;cylinder(.045,.045,.025,brass,0,.935,0,g);register(g,'post',label,[x,y+1,z]);coll(x,z,1,.8,y,1.2);return g;}
 function cabinet(x,y,z,name){const g=new THREE.Group();g.position.set(x,y,z);g.userData.dynamic=true;scene.add(g);box(2.6,.16,1.25,wood,0,.08,0,g);box(2.65,.18,1.3,wood,0,2.15,0,g);for(const dx of [-1.24,1.24])box(.12,2.1,1.2,wood,dx,1.1,0,g);box(2.5,2,.1,wood,0,1.1,-.55,g);coll(x,z,2.6,1.25,y,2.3);
 for(let row=0;row<3;row++)for(let col=0;col<2;col++){const node=new THREE.Group();node.position.set((col-.5)*1.2,.45+row*.62,0);g.add(node);const slider=new THREE.Group();node.add(slider);box(1.13,.53,.1,wood,0,0,.63,slider);box(1.08,.055,.9,wood,0,-.23,.13,slider);for(const dx of [-.54,.54])box(.05,.45,.9,wood,dx,0,.13,slider);box(.95,.01,.55,parchment,0,-.19,.15,slider);ring(.07,.012,brass,0,0,.7,slider);register(node,'realm-drawer',`Open ${name} · ${row*2+col+1}`,[x+(col-.5)*1.2,y+.45+row*.62,z+.7]);drawers.push({node,slider,target:0,open:0,name:`${name} · ${row*2+col+1}`});}}
 // DROWNED CATHEDRAL: shallow water among raised walkways, broken rose window.
 const water=new THREE.Mesh(new THREE.PlaneGeometry(25,35,50,60),new THREE.MeshPhysicalMaterial({color:0x31545c,metalness:.55,roughness:.19,transparent:true,opacity:.54,side:THREE.DoubleSide}));water.rotation.x=-Math.PI/2;water.position.set(0,.015,-15);water.receiveShadow=true;scene.add(water);
 for(const x of [-3.7,3.7])for(let z=-4;z>-30;z-=1.8){const slab=box(.4,.08,1.7,paleStone,x,.08,z);slab.rotation.z=(Math.random()-.5)*.02;}
 for(const x of [-8,8]){for(let z=-5;z>-30;z-=5){if(x>0&&z===-5)continue;box(1.9,.25,1.2,charcoal,x,.18,z);box(1.9,1,.15,wood,x,.7,z-.5);coll(x,z,1.9,1.2,0,1.3);for(const dx of [-.7,.7])box(.12,.5,1.2,iron,x+dx,.45,z);}}
 const rose=new THREE.Group();rose.position.set(0,11.6,-35);scene.add(rose);for(const r of [2.8,3.1,3.4])ring(r,.065,paleStone,0,0,0,rose);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;line([[0,0,0],[Math.cos(a)*1.8,Math.sin(a)*1.8,0],[Math.cos(a+.1)*2.8,Math.sin(a+.1)*2.8,0]],brass,.045,rose);const shard=new THREE.Mesh(new THREE.CircleGeometry(.8,3),glass);shard.position.set(Math.cos(a)*2,Math.sin(a)*2,.015);shard.rotation.z=a;rose.add(shard);}
 rainAreas.push({x:0,z:-15,w:25,d:36,type:'rain'});
 // ASHEN LIBRARY: distinct western wing, book galleries, physically accessible stairs.
 const paving=charcoal.clone();paving.map=charcoal.map.clone();paving.map.repeat.set(7,7);paving.map.needsUpdate=true;box(34,.7,33,paving,-31,-.4,-10.5);doorwayWall(-48,-1);
 for(const z of [-27,6]){box(34,10,1,charcoal,-31,4.5,z);coll(-31,z,34,1,0,11);}
 for(let x=-18;x>=-46;x-=7){arch(x,-10.5,30,13.5,Math.PI/2,charcoal,.38);arch(x,-10.5,29,13.1,Math.PI/2,paleStone,.09);}
 const bookMats=[0x423132,0x384342,0x70594b,0x29333a,0x6b603d].map(color=>new THREE.MeshStandardMaterial({color,roughness:.9}));
 for(const z of [-24,3])for(let x=-18;x>=-46;x-=4){const shelf=new THREE.Group();shelf.position.set(x,0,z);scene.add(shelf);for(const dx of [-1.7,1.7])box(.13,7,.65,wood,dx,3.5,0,shelf);for(let y=.4;y<7;y+=1.1){box(3.6,.1,.8,wood,0,y,0,shelf);for(let i=0;i<13;i++){const h=.5+Math.random()*.4;const b=box(.16+Math.random()*.08,h,.46,bookMats[i%5],-1.5+i*.25,y+h/2+.06,0,shelf);b.rotation.z=(Math.random()-.5)*.1;}}coll(x,z,3.6,1,0,7);}
 box(30,.32,5,charcoal,-31,3.85,-22.5);for(let i=0;i<26;i++)box(4,.17+i*.154,.64,charcoal,-41.5,(.17+i*.154)/2,-4.3-i*.62);
 for(const x of [-43.6,-39.4])for(let i=0;i<26;i++)cylinder(.035,.035,1,brass,x,.9+i*.154,-4.3-i*.62,scene,6);
 for(let x=-46;x<-16;x+=1.5){if(x>-43.7&&x<-39.3)continue;cylinder(.035,.035,1.1,brass,x,4.6,-19.8,scene,6);}for(const [x,w]of [[-45.35,3.3],[-27.65,23.3]]){box(w,.12,.16,wood,x,5.15,-19.8);coll(x,-19.8,w,.18,0,4);}
 for(const x of [-43.6,-39.4])coll(x,-12, .2,16,0,5);
 cabinet(-32,4,-24,'Ashen archive');cabinet(-21,0,-2,'The cinder cabinet');letter(-31,0,-12,'Read beneath the ruined vault');
 for(const x of [-20,-32,-44]){torch(x,1,2.7);torch(x,-25,5.8);placeLight(0xdd6f39,25,x,3,-12);}
 for(let i=0;i<20;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+Math.random()*.3,0),charcoal);rock.userData.dynamic=true;rock.position.set(-18-Math.random()*28,8+Math.random()*5,-22+Math.random()*22);rock.rotation.set(Math.random(),Math.random(),Math.random());scene.add(rock);sparks.push({mesh:rock,y:rock.position.y,phase:Math.random()*6});}
 placeLight(0xc89471,135,-32,7,-10,26);
 for(const x of [-24,-38]){const crown=new THREE.Group();crown.position.set(x,7.5,-11);scene.add(crown);const hoop=ring(1.3,.055,brass,0,0,0,crown);hoop.rotation.x=Math.PI/2;line([[0,0,0],[0,5,0]],iron,.025,crown);for(let n=0;n<8;n++){const a=n/8*Math.PI*2,xx=Math.cos(a)*1.3,zz=Math.sin(a)*1.3;cylinder(.06,.07,.4,parchment,xx,.2,zz,crown,8);const flame=new THREE.Mesh(new THREE.SphereGeometry(.06,6,8),glow);flame.position.set(xx,.47,zz);flame.scale.y=2;crown.add(flame);}}
 rainAreas.push({x:-31,z:-10,w:29,d:28,type:'ash'});
 // WINTER OBSERVATORY: stone rotunda, snow drifts, operable brass armillary.
 box(34,.7,33,snow,31,-.4,-10.5);doorwayWall(48,1);for(const z of [-27,6]){box(34,7,1,darkStone,31,3,z);coll(31,z,34,1,0,8);}
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2,x=33+Math.sin(a)*12,z=-11+Math.cos(a)*12;if(x<24&&z>-17&&z<-5)continue;cylinder(.4,.55,10,paleStone,x,4.8,z);cylinder(.62,.62,.3,snow,x,9.8,z);coll(x,z,1,1,0,10);}
 const dome=new THREE.Group();dome.position.set(33,0,-11);scene.add(dome);for(let i=0;i<12;i++){const a=i/12*Math.PI*2,pts=[];for(let j=0;j<=30;j++){const t=j/30*Math.PI/2;pts.push([Math.cos(a)*12*Math.cos(t),9.8+Math.sin(t)*6,Math.sin(a)*12*Math.cos(t)]);}line(pts,iron,.065,dome);}for(const [r,y]of [[12,9.8],[10.4,12.8],[6,15]]){const rr=ring(r,.06,brass,0,y,0,dome);rr.rotation.x=Math.PI/2;}
 const orrery=new THREE.Group();orrery.position.set(33,2,-11);orrery.userData.dynamic=true;scene.add(orrery);cylinder(2.3,2.8,.4,darkStone,33,.2,-11,scene,64);coll(33,-11,4.6,4.6,0,4);
 for(let i=0;i<4;i++){const r=ring(2+i*.45,.045,brass,0,0,0,orrery);r.rotation.set(i*.6,i*.8,.5);rings.push(r);}const world=new THREE.Mesh(new THREE.SphereGeometry(.65,32,24),new THREE.MeshStandardMaterial({color:0x6aabb6,metalness:.65,roughness:.25,emissive:0x204d68,emissiveIntensity:.7}));orrery.add(world);placeLight(0x79c8e7,65,33,3,-11,25);
 for(let n=0;n<28;n++){const a=n/28*Math.PI*2;const flag=box(1,.05,1.6,darkStone,33+Math.sin(a)*4.7,-.01,-11+Math.cos(a)*4.7);flag.rotation.y=a;}
 register(orrery,'orrery','Turn the celestial mechanism',[33,1,-8]);letter(26,0,-5,'Read a letter from the winter archive');cabinet(42,0,-20,'The winter cabinet');
 for(let i=0;i<35;i++){const a=Math.random()*6.28,r=8+Math.random()*5;const drift=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),snow);drift.scale.set(1+Math.random()*2,.08+Math.random()*.25,1+Math.random());drift.position.set(33+Math.cos(a)*r,.02,-11+Math.sin(a)*r);scene.add(drift);}
 rainAreas.push({x:31,z:-10,w:32,d:30,type:'snow'});
 // MOONLIT CONSERVATORY: southern bridge leads into an overgrown glasshouse.
 box(32,.7,32,darkStone,0,-.4,43);for(const x of [-16,16]){box(.5,1.3,32,paleStone,x,.5,43);coll(x,43,.5,32,0,4);}box(32,1.3,.5,paleStone,0,.5,59);coll(0,59,32,.5,0,4);
 for(let z=29;z<=58;z+=5){arch(0,z,30,14,0,iron,.095);for(const x of [-15,15]){cylinder(.13,.18,7,iron,x,3.5,z);box(.08,.08,5,brass,x,7,z+2.5);}if(z<58){for(let side of [-1,1])for(let n=0;n<3;n++){const xs=[0,5,10,15],ys=[14,13,10.8,7.4],x1=xs[n]*side,x2=xs[n+1]*side,y1=ys[n],y2=ys[n+1];const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute([x1,y1,z,x2,y2,z,x2,y2,z+5,x1,y1,z+5],3));geom.setIndex([0,1,2,0,2,3]);geom.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geom.computeVertexNormals();scene.add(new THREE.Mesh(geom,glass));}}}
 for(const x of [-10,10])for(let z=33;z<57;z+=8){box(6,.6,5,stone,x,.15,z);coll(x,z,6,5,0,1);for(let i=0;i<9;i++){const xx=x+(Math.random()-.5)*5,zz=z+(Math.random()-.5)*4;line([[xx,.4,zz],[xx+.3,2,zz-.3],[xx-.2,3+Math.random()*2,zz]],moss,.06);for(let n=0;n<4;n++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),moss);leaf.scale.set(.4,.08,.8);leaf.position.set(xx+(n%2?.4:-.4),1+n*.6,zz);leaf.rotation.z=(n%2?.6:-.6);scene.add(leaf);}}placeLight(0x9ac2a7,12,x,2,z);}
 for(const side of [-1,1])for(let z=30;z<58;z+=4){const pts=[];for(let i=0;i<20;i++)pts.push([side*(14+Math.sin(i*.7)*.4),i*.6,z+Math.cos(i*.6)*.5]);vines.push(line(pts,moss,.06));}
 for(const side of [-1,1])for(let z=34;z<56;z+=3){const x=side*(6.4+Math.random());line([[x,.5,z],[x+.1,1.8,z]],moss,.025);const petalMat=new THREE.MeshStandardMaterial({color:0xc1d8ca,roughness:.6,emissive:0x658578,emissiveIntensity:.3});for(let n=0;n<5;n++){const a=n/5*Math.PI*2;const petal=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),petalMat);petal.scale.set(.12,.045,.28);petal.position.set(x+Math.sin(a)*.2,1.8,z+Math.cos(a)*.2);petal.rotation.y=a;scene.add(petal);}}
 letter(0,0,48,'Read beneath the moonflowers');cabinet(5,0,56,'The garden cabinet');placeLight(0xb4d5a1,70,0,5,48,25);
 // Direction signs are actual world geometry, readable at the crossroads.
 function sign(text,x,y,z,rotation=0){const c=document.createElement('canvas');c.width=1024;c.height=128;const g=c.getContext('2d');g.fillStyle='#111b1dd9';g.fillRect(0,0,1024,128);g.strokeStyle='#a89467';g.strokeRect(3,3,1018,122);g.font='36px Georgia';g.textAlign='center';g.fillStyle='#e0d2ae';g.fillText(text,512,78);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(6,.75),new THREE.MeshBasicMaterial({map:t,side:THREE.FrontSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);}
 sign('ASHEN LIBRARY  ←',-12,4,-10.5,Math.PI/2);sign('WINTER OBSERVATORY  →',12,4,-10.5,-Math.PI/2);sign('THE MOONLIT CONSERVATORY',0,4,28,Math.PI);
 // Local weather occupies the corresponding wing, so walking changes atmosphere.
 const weather=[];for(const area of rainAreas){const count=area.type==='rain'?650:300,points=new Float32Array(count*3);for(let i=0;i<count;i++){points[i*3]=area.x+(Math.random()-.5)*area.w;points[i*3+1]=1+Math.random()*14;points[i*3+2]=area.z+(Math.random()-.5)*area.d;}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(points,3));const mat=new THREE.PointsMaterial({color:area.type==='snow'?0xd3e4ed:area.type==='ash'?0xe4a472:0x99bac4,size:area.type==='rain'?.025:.065,transparent:true,opacity:.6,depthWrite:false});const mesh=new THREE.Points(geo,mat);scene.add(mesh);weather.push({area,points,geo});}
 function floorAt(x,z){if(x<-15&&z<-19.8)return 4;if(x>=-43.5&&x<=-39.5&&z<=-4&&z>=-20)return Math.min(4,(-z-4)*.25);return null;}
 function use(object,ui){const d=drawers.find(d=>d.node===object);if(d){d.target=1-d.target;selected=d;object.userData.interaction.title=`${d.target?'Close':'Open'} ${d.name}`;if(d.target)setTimeout(()=>{$('drawer-location').textContent='THE CONNECTED REALMS';$('drawer-title').textContent=d.name;ui.modal('drawer-dialog');},700);return true;}if(object===orrery){turning=!turning;ui.toast(turning?'The observatory wakes. The heavens are turning.':'The celestial mechanism comes to rest.');return true;}return false;}
 const $=id=>document.getElementById(id);
 function update(dt,time){for(const d of drawers){d.open=THREE.MathUtils.damp(d.open,d.target,7,dt);d.slider.position.z=d.open*.85;}if(turning)rings.forEach((r,i)=>{r.rotation.y+=dt*(i%2?-.2:.15);r.rotation.z+=dt*.04;});for(const s of sparks){s.mesh.position.y=s.y+Math.sin(time*.4+s.phase)*.16;s.mesh.rotation.y+=dt*.04;}for(const w of weather){const speed=w.area.type==='rain'?9:w.area.type==='snow'?.6:.25;for(let i=0;i<w.points.length;i+=3){w.points[i+1]-=dt*speed;if(w.area.type!=='rain')w.points[i]+=Math.sin(time*.3+i)*dt*.12;if(w.points[i+1]<.1)w.points[i+1]=14;}w.geo.attributes.position.needsUpdate=true;}}
 function location(){return player.x<-15?'The Ashen Library':player.x>15?'The Winter Observatory':player.z>26?'The Moonlit Conservatory':'The Drowned Cathedral';}
 let demoSnapshot=null;
 function beginDemo(){demoSnapshot={turning,drawers:drawers.map(d=>({open:d.open,target:d.target}))};}
 function resetDemo(){turning=false;drawers.forEach(d=>{d.open=0;d.target=0;d.slider.position.z=0;});}
 function endDemo(){if(!demoSnapshot)return;turning=demoSnapshot.turning;drawers.forEach((d,i)=>{Object.assign(d,demoSnapshot.drawers[i]);d.slider.position.z=d.open*.85;});demoSnapshot=null;}
 return{floorAt,use,update,location,drawers,beginDemo,resetDemo,endDemo,demoOrrery:value=>{turning=value;}};
}
