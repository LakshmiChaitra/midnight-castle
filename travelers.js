import * as THREE from 'three';

export const TRAVELERS = [
 {id:'mira',name:'Mira',role:'The starlight storyteller',type:'girl',color:0x607d90,accent:0xe2ba75},
 {id:'theo',name:'Theo',role:'The lantern keeper',type:'boy',color:0x65735b,accent:0xd1ae71},
 {id:'pip',name:'Pip',role:'A very good adventurer',type:'dog',color:0xb89167,accent:0x637d87},
 {id:'miso',name:'Miso',role:'Curiosity, with whiskers',type:'cat',color:0x89939a,accent:0xc5a775},
 {id:'ember',name:'Ember',role:'The little midnight fox',type:'fox',color:0xbc784d,accent:0x557466}
];

export function buildTraveler(id){
 const spec=TRAVELERS.find(t=>t.id===id)||TRAVELERS[0],root=new THREE.Group(),rig={root,spec,legs:[],arms:[],tail:null,eyes:[],action:0,wave:0};
 const material=(color,roughness=.75)=>new THREE.MeshStandardMaterial({color,roughness});
 const clothCanvas=document.createElement('canvas');clothCanvas.width=clothCanvas.height=128;const weave=clothCanvas.getContext('2d');weave.fillStyle='#e7e5df';weave.fillRect(0,0,128,128);for(let n=0;n<128;n+=3){weave.strokeStyle=n%2?'#cbc9c1':'#f0eee8';weave.lineWidth=.6;weave.beginPath();weave.moveTo(n,0);weave.lineTo(n,128);weave.stroke();weave.beginPath();weave.moveTo(0,n);weave.lineTo(128,n);weave.stroke();}const clothTexture=new THREE.CanvasTexture(clothCanvas);clothTexture.wrapS=clothTexture.wrapT=THREE.RepeatWrapping;clothTexture.repeat.set(3,3);clothTexture.colorSpace=THREE.SRGBColorSpace;
 const coat=material(spec.color),accent=material(spec.accent),skin=material(spec.type==='girl'?0xd8b398:0xb99177),hair=material(spec.type==='girl'?0x3b302e:0x514036),dark=material(0x252d31),white=material(0xe6dfcf),iris=material(0x3c504c,.3);
 coat.map=clothTexture;coat.bumpMap=clothTexture;coat.bumpScale=.01;coat.roughness=.94;
 function mesh(geometry,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function ball(rx,ry,rz,mat,parent,x=0,y=0,z=0){const m=mesh(new THREE.SphereGeometry(1,20,14),mat,parent,x,y,z);m.scale.set(rx,ry,rz);return m;}
 function capsule(radius,length,mat,parent,x=0,y=0,z=0){return mesh(new THREE.CapsuleGeometry(radius,length,5,12),mat,parent,x,y,z);}
 function eyes(x,y,z,spread=.09){for(const side of [-1,1]){const eye=new THREE.Group();eye.position.set(x+side*spread,y,z);root.add(eye);ball(.032,.025,.01,white,eye);ball(.014,.017,.006,iris,eye,0,-.002,-.01);ball(.004,.005,.003,white,eye,-.004,.005,-.017);rig.eyes.push(eye);}}
 if(spec.type==='girl'||spec.type==='boy'){
  capsule(.24,.34,coat,root,0,1.18,0);
  mesh(new THREE.CylinderGeometry(.245,spec.type==='girl'?.37:.27,.43,24),coat,root,0,.85,0);
  mesh(new THREE.TorusGeometry(.25,.027,7,28),accent,root,0,1,0).rotation.x=Math.PI/2;
  capsule(.07,.1,skin,root,0,1.52,0);
  ball(.205,.235,.205,skin,root,0,1.76,0);
  ball(.215,.18,.215,hair,root,0,1.88,.02);
  if(spec.type==='girl'){
   ball(.23,.35,.12,hair,root,0,1.62,.16);
   for(const side of [-1,1]){const lock=capsule(.058,.27,hair,root,side*.19,1.64,.015);lock.rotation.z=side*.1;}
   const pin=mesh(new THREE.OctahedronGeometry(.05),accent,root,-.2,1.92,-.13);pin.rotation.z=.3;
  }else{ball(.16,.08,.1,hair,root,-.09,1.93,-.15);ball(.1,.1,.1,hair,root,.1,1.94,-.1);}
  eyes(0,1.77,-.2);ball(.021,.026,.026,skin,root,0,1.71,-.219);
  const smile=mesh(new THREE.TorusGeometry(.042,.006,5,16,Math.PI),material(0x92665b),root,0,1.67,-.201);smile.rotation.z=Math.PI;
  for(const side of [-1,1]){
   ball(.045,.063,.04,skin,root,side*.22,1.75,0);
   const arm=new THREE.Group();arm.position.set(side*.3,1.37,0);root.add(arm);capsule(.075,.29,coat,arm,side*.025,-.2,0);capsule(.06,.18,coat,arm,side*.027,-.38,0);ball(.063,.075,.05,skin,arm,side*.027,-.55,-.015);ball(.025,.037,.025,skin,arm,side*.065,-.54,-.025);mesh(new THREE.TorusGeometry(.075,.018,6,14),accent,arm,side*.025,-.48,0).rotation.x=Math.PI/2;rig.arms.push(arm);
   const leg=new THREE.Group();leg.position.set(side*.13,.77,0);root.add(leg);capsule(.085,.29,dark,leg,0,-.23,0);capsule(.07,.2,dark,leg,0,-.47,0);ball(.11,.09,.18,dark,leg,0,-.66,-.055);mesh(new THREE.TorusGeometry(.083,.015,6,18),accent,leg,0,-.52,0).rotation.x=Math.PI/2;rig.legs.push(leg);
  }
  // Tailored travel cape, leather pack, seams and brow detail.
  const capeMaterial=material(spec.type==='girl'?0x344f64:0x354b3d);capeMaterial.map=clothTexture;capeMaterial.bumpMap=clothTexture;capeMaterial.bumpScale=.012;capeMaterial.side=THREE.DoubleSide;
  const capeGeo=new THREE.PlaneGeometry(1,1,28,12),cp=capeGeo.attributes.position,cu=capeGeo.attributes.uv;
  for(let i=0;i<cp.count;i++){const u=cu.getX(i),v=1-cu.getY(i),a=(u-.5)*2.5,r=.265+v*.115+Math.sin(a*10)*.012*v;cp.setXYZ(i,Math.sin(a)*r,1.37-v*.74+Math.cos(a*7)*.009*v,Math.cos(a)*r+.02);}capeGeo.computeVertexNormals();rig.cape=mesh(capeGeo,capeMaterial,root);
  const leather=material(0x644a36,.85);capsule(.135,.2,leather,root,0,1.1,.43);const flap=ball(.145,.07,.065,leather,root,0,1.22,.52);mesh(new THREE.BoxGeometry(.045,.06,.025),accent,root,0,1.11,.57);
  for(const side of [-1,1]){const strap=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.14,1.27,.4),new THREE.Vector3(side*.21,1.42,.06),new THREE.Vector3(side*.17,1.27,-.225),new THREE.Vector3(side*.15,1.02,-.25)]);mesh(new THREE.TubeGeometry(strap,20,.022,6,false),leather,root);const brow=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.13,1.825,-.19),new THREE.Vector3(side*.085,1.842,-.205),new THREE.Vector3(side*.045,1.828,-.2)]);mesh(new THREE.TubeGeometry(brow,12,.009,5,false),hair,root);}
  for(let y=1.13;y<1.45;y+=.12)ball(.018,.018,.012,accent,root,0,y,-.24);
  const scarf=mesh(new THREE.TorusGeometry(.15,.057,7,24),accent,root,0,1.49,0);scarf.rotation.x=Math.PI/2;
  capsule(.04,.3,accent,root,.13,1.27,-.24).rotation.z=-.2;
 }else{
  const body=capsule(.24,.47,coat,root,0,.53,.05);body.rotation.x=Math.PI/2;
  ball(.2,.25,.19,coat,root,0,.68,-.37);ball(.23,.24,.23,coat,root,0,.85,-.51);
  ball(.16,.13,.2,white,root,0,.76,-.68);ball(.067,.05,.04,dark,root,0,.79,-.868);
  eyes(0,.91,-.703,spec.type==='dog'?.105:.095);
  if(spec.type==='dog')for(const side of [-1,1]){const ear=capsule(.08,.19,hair,root,side*.22,.88,-.5);ear.rotation.z=side*.28;}
  else for(const side of [-1,1]){const ear=mesh(new THREE.ConeGeometry(.125,.3,3),coat,root,side*.15,1.12,-.49);ear.rotation.y=side*.2;mesh(new THREE.ConeGeometry(.067,.19,3),material(0xc8a69a),root,side*.15,1.12,-.55);}
  for(const x of [-.16,.16])for(const z of [-.26,.34]){const leg=new THREE.Group();leg.position.set(x,.43,z);root.add(leg);capsule(.055,.22,coat,leg,0,-.13,0);ball(.072,.052,.11,spec.type==='fox'?dark:white,leg,0,-.37,-.025);rig.legs.push(leg);}
  if(spec.type==='cat')for(const side of [-1,1])for(let i=0;i<3;i++){const whisker=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side*.12,.78,-.77),new THREE.Vector3(side*.34,.77+(i-1)*.045,-.73)]);root.add(new THREE.Line(whisker,new THREE.LineBasicMaterial({color:0xc9cbc4})));}
  const tail=new THREE.Group();tail.position.set(0,.57,.5);root.add(tail);
  const tailMat=spec.type==='cat'?coat:spec.type==='dog'?coat:coat;
  if(spec.type==='fox'){const plume=ball(.15,.18,.4,tailMat,tail,0,.13,.29);plume.rotation.x=-.3;ball(.12,.14,.16,white,tail,0,.25,.58);}
  else{const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(0,.13,.23),new THREE.Vector3(0,.42,.37),new THREE.Vector3(0,.5,.23)]);mesh(new THREE.TubeGeometry(curve,16,spec.type==='dog'?.065:.04,8,false),coat,tail);}
  rig.tail=tail;const collar=mesh(new THREE.TorusGeometry(.185,.035,6,24),accent,root,0,.68,-.33);collar.rotation.x=Math.PI/2;mesh(new THREE.OctahedronGeometry(.055),material(0xe0bc76,.4),root,0,.57,-.45);
 }
 rig.animate=(time,speed,dt,action=false)=>{
  if(rig.cape)rig.cape.rotation.z=Math.sin(time*2.3)*.018;
  const gait=time*(speed>3?11:7),amount=Math.min(1,speed/2.4);
  root.position.y=Math.sin(time*2)*.012+(spec.type==='girl'||spec.type==='boy'?0:Math.abs(Math.sin(gait))*.018*amount);
  rig.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(gait+(spec.type==='girl'||spec.type==='boy'?i*Math.PI:(i===0||i===3?0:Math.PI)))*.55*amount);
  rig.arms.forEach((arm,i)=>{arm.rotation.x=-Math.sin(gait+i*Math.PI)*.4*amount;arm.rotation.z=(i===0?.05:-.05);});
  if(action){if(rig.arms[1]){rig.arms[1].rotation.x=1.15;rig.arms[1].rotation.z=-.15;}else rig.legs[0].rotation.x=1.1;}
  if(rig.tail)rig.tail.rotation.y=Math.sin(time*(spec.type==='dog'?8:3))*(spec.type==='dog'?.48:.2);
  const blink=Math.sin(time*1.3)>.995?.13:1;rig.eyes.forEach(eye=>eye.scale.y=blink);
 };
 return rig;
}
