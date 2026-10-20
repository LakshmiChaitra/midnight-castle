import * as THREE from 'three';
import {TRAVELERS} from './travelers.js';

export function buildPet(id){
 const spec=TRAVELERS.find(t=>t.id===id),root=new THREE.Group(),legs=[],knees=[],ears=[],eyes=[];
 const isDog=id==='pip',isFox=id==='ember',fur=new THREE.MeshStandardMaterial({color:isDog?0xc79760:isFox?0xc47744:0x7c899a,roughness:.92}),cream=new THREE.MeshStandardMaterial({color:isDog?0xf2dcba:isFox?0xf1ddbb:0xd6dbe0,roughness:.9}),dark=new THREE.MeshStandardMaterial({color:0x24313d,roughness:.65}),leather=new THREE.MeshStandardMaterial({color:0x374e63,roughness:.86}),gold=new THREE.MeshStandardMaterial({color:0xd1ae6d,metalness:.55,roughness:.4}),earFur=new THREE.MeshStandardMaterial({color:0x795238,roughness:.94}),pink=new THREE.MeshStandardMaterial({color:0xbf8d91,roughness:.85});
 function mesh(g,m,p,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function ball(x,y,z,rx,ry,rz,m,p=root){const o=mesh(new THREE.SphereGeometry(1,18,14),m,p,x,y,z);o.scale.set(rx,ry,rz);return o;}
 function capsule(x,y,z,r,l,m,p=root){return mesh(new THREE.CapsuleGeometry(r,l,5,10),m,p,x,y,z);}
 const torso=ball(0,.65,.06,.29,.275,.58,fur);ball(0,.69,-.31,.285,.3,.28,fur);ball(0,.58,-.39,.22,.22,.18,cream);
 const head=new THREE.Group();head.position.set(0,.98,-.5);root.add(head);ball(0,.02,0,.245,.245,.23,fur,head);ball(0,-.09,-.195,.18,.13,.2,cream,head);
 if(isFox){ball(0,-.09,-.32,.085,.075,.15,cream,head);ball(0,-.07,-.452,.065,.047,.045,dark,head);}else ball(0,-.065,-.39,.07,.05,.045,dark,head);
 const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.075,-.14,-.35),new THREE.Vector3(0,-.165,-.37),new THREE.Vector3(.075,-.14,-.35)]);mesh(new THREE.TubeGeometry(smile,12,.008,5,false),dark,head);
 const tongue=ball(0,-.178,-.345,.043,.045,.018,pink,head);tongue.visible=false;
 for(const side of [-1,1]){
  const eye=new THREE.Group();head.add(eye);eye.position.set(side*.112,.052,-.205);ball(0,0,0,.063,.071,.028,cream,eye);ball(0,0,-.025,.036,.047,.014,dark,eye);ball(-.01,.018,-.039,.012,.015,.005,new THREE.MeshBasicMaterial({color:0xfff4db}),eye);eyes.push(eye);
  const brow=capsule(side*.113,.145,-.195,.018,.075,fur,head);brow.rotation.z=side*.18;
  const ear=new THREE.Group();ear.position.set(side*.22,.17,-.015);head.add(ear);ears.push(ear);
  if(isDog){const flap=ball(side*.04,-.09,.01,.09,.24,.075,earFur,ear);flap.rotation.z=side*.22;ball(side*.04,-.08,-.045,.045,.15,.015,pink,ear);}else{const tip=mesh(new THREE.ConeGeometry(.145,.35,4),fur,ear,0,.13,0);tip.rotation.y=Math.PI/4;mesh(new THREE.ConeGeometry(.085,.23,4),pink,ear,0,.12,-.055).rotation.y=Math.PI/4;}
  for(let i=0;i<3;i++){const tuft=ball(side*(.18+i*.025),-.04-i*.028,.01,.08,.035,.1,cream,head);tuft.rotation.z=side*.4;}
 }
 if(!isDog&&!isFox)for(const side of [-1,1])for(let i=0;i<3;i++){const p=[new THREE.Vector3(side*.13,-.1,-.33),new THREE.Vector3(side*.36,-.09+(i-1)*.045,-.3)];head.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:0xc9d0d2})));}
 for(const x of [-.19,.19])for(const z of [-.31,.4]){
  const leg=new THREE.Group();leg.position.set(x,.56,z);root.add(leg);legs.push(leg);capsule(0,-.115,0,.073,.17,fur,leg);
  const knee=new THREE.Group();knee.position.y=-.27;leg.add(knee);knees.push(knee);capsule(0,-.1,0,.067,.14,isFox?dark:fur,knee);ball(0,-.23,-.045,.083,.058,.13,cream,knee);for(const dx of [-.033,.033])ball(dx,-.24,-.145,.012,.01,.025,dark,knee);
 }
 // Fitted travel harness, stitched satchel and rolled blanket remain visible from behind.
 for(const z of [-.18,.3]){const strap=mesh(new THREE.TorusGeometry(.285,.018,6,40),leather,root,0,.65,z);strap.rotation.x=0;strap.scale.y=.93;}
 const pack=new THREE.Group();pack.position.set(0,.91,.14);root.add(pack);const box=mesh(new THREE.BoxGeometry(.34,.23,.36),leather,pack,0,0,0);box.geometry.translate(0,.015,0);ball(0,.12,0,.18,.05,.19,leather,pack);mesh(new THREE.BoxGeometry(.05,.05,.02),gold,pack,0,.04,.195);
 const roll=capsule(0,.18,.03,.07,.28,cream,pack);roll.rotation.z=Math.PI/2;for(const x of [-.09,.09]){const belt=mesh(new THREE.TorusGeometry(.074,.009,5,20),leather,pack,x,.18,.03);belt.rotation.y=Math.PI/2;}
 const scarf=mesh(new THREE.TorusGeometry(.235,.038,7,32),leather,root,0,.8,-.38);scarf.rotation.x=Math.PI/2;const knot=mesh(new THREE.ConeGeometry(.11,.25,3),leather,root,0,.65,-.46);knot.rotation.z=Math.PI;mesh(new THREE.OctahedronGeometry(.055),gold,root,0,.77,-.49);
 if(!isDog&&!isFox)for(let i=0;i<4;i++){const stripe=mesh(new THREE.TorusGeometry(.29,.014,5,32,1.3),dark,root,0,.65,-.13+i*.14);stripe.rotation.z=.9;}
 const tail=new THREE.Group();tail.position.set(0,.74,.53);root.add(tail);let parent=tail;
 for(let i=0;i<(isFox?6:7);i++){const joint=new THREE.Group();joint.position.set(0,i?.045:0,i?.1:0);parent.add(joint);const r=isFox?(.17-Math.abs(i-2)*.025):isDog?.055:.045;ball(0,.02,.065,r,r,.13,i>3&&isFox?cream:fur,joint);joint.rotation.x=isDog?-.3:!isFox?-.2:.1;parent=joint;}
 let phase=0;
 return{root,spec,legs,arms:[],animate(time,speed,dt,action=false){const amount=Math.min(1,speed/3);phase+=Math.max(0,speed)*dt*3.8;root.position.y=Math.abs(Math.sin(phase))*amount*.025;torso.rotation.z=Math.sin(phase)*amount*.018;head.rotation.y=Math.sin(time*.65)*.035*(1-amount);head.rotation.z=Math.sin(time*.9)*.045*(1-amount);head.rotation.x=Math.sin(phase*2)*amount*.035;legs.forEach((l,i)=>{const p=phase+(i===0||i===3?0:Math.PI);l.rotation.x=Math.sin(p)*.6*amount;knees[i].rotation.x=Math.max(0,-Math.sin(p))*.5*amount;});if(action)legs[0].rotation.x=1;ears.forEach((ear,i)=>ear.rotation.z=(i?1:-1)*.1+Math.sin(phase+1)*amount*.13);tail.rotation.y=Math.sin(time*(isDog?7:3))*(isDog?.45:.22);tail.rotation.z=Math.sin(time*2)*.06;pack.rotation.z=Math.sin(phase)*amount*.025;tongue.visible=isDog&&speed>4.5;const blink=Math.sin(time*1.23)>.997?.15:1;eyes.forEach(e=>e.scale.y=blink);}};
}
