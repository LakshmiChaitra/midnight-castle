import * as THREE from 'three';
import {TRAVELERS,buildTraveler as originalTraveler} from './travelers.js';
export {TRAVELERS};
export function buildTraveler(id){
 const spec=TRAVELERS.find(t=>t.id===id)||TRAVELERS[0];if(!['girl','boy'].includes(spec.type))return originalTraveler(id);
 const root=new THREE.Group(),legs=[],arms=[];
 const cloth=new THREE.MeshStandardMaterial({color:spec.type==='girl'?0x3e5058:0x41483a,roughness:.96});const leather=new THREE.MeshStandardMaterial({color:0x302b28,roughness:.83});const steel=new THREE.MeshStandardMaterial({color:0x697372,metalness:.78,roughness:.4});const trim=new THREE.MeshStandardMaterial({color:0x9a835a,metalness:.65,roughness:.5});const dark=new THREE.MeshStandardMaterial({color:0x080e13,roughness:1});const skin=new THREE.MeshStandardMaterial({color:0xb69b83,roughness:.9});
 function mesh(g,m,p,x=0,y=0,z=0){const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;p.add(a);return a;}
 function ball(rx,ry,rz,m,p,x,y,z){const a=mesh(new THREE.SphereGeometry(1,20,16),m,p,x,y,z);a.scale.set(rx,ry,rz);return a;}
 function capsule(r,h,m,p,x,y,z){return mesh(new THREE.CapsuleGeometry(r,h,6,14),m,p,x,y,z);}
 capsule(.205,.34,cloth,root,0,1.19,0);ball(.24,.21,.14,steel,root,0,1.25,-.06);
 const coat=mesh(new THREE.CylinderGeometry(.205,.285,.5,32),cloth,root,0,.86,0);const belt=mesh(new THREE.TorusGeometry(.217,.022,8,32),leather,root,0,1.04,0);belt.rotation.x=Math.PI/2;mesh(new THREE.BoxGeometry(.07,.075,.025),trim,root,0,1.04,-.22);
 // Sculpted hood: dark inset face, raised cloth surround, metal clasp.
 const hood=ball(.175,.24,.18,cloth,root,0,1.75,.015);ball(.124,.173,.025,dark,root,0,1.74,-.15);ball(.075,.045,.026,skin,root,0,1.645,-.158);
 const hem=new THREE.CatmullRomCurve3([new THREE.Vector3(-.12,1.6,-.16),new THREE.Vector3(-.15,1.8,-.15),new THREE.Vector3(0,1.96,-.13),new THREE.Vector3(.15,1.8,-.15),new THREE.Vector3(.12,1.6,-.16)]);mesh(new THREE.TubeGeometry(hem,32,.014,6,false),trim,root);
 capsule(.06,.11,cloth,root,0,1.49,0);ball(.25,.09,.2,cloth,root,0,1.46,0);mesh(new THREE.OctahedronGeometry(.04),trim,root,.12,1.44,-.18);
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.245,1.39,0);root.add(arm);ball(.105,.12,.13,steel,arm,0,-.04,0);capsule(.065,.24,cloth,arm,side*.015,-.22,0);capsule(.055,.19,leather,arm,side*.02,-.43,0);ball(.058,.075,.045,leather,arm,side*.02,-.585,0);arms.push(arm);
 const leg=new THREE.Group();leg.position.set(side*.115,.78,0);root.add(leg);capsule(.078,.28,leather,leg,0,-.19,0);ball(.082,.09,.065,steel,leg,0,-.385,-.035);capsule(.067,.22,leather,leg,0,-.51,0);ball(.088,.08,.16,leather,leg,0,-.70,-.055);legs.push(leg);}
 const capeMat=cloth.clone();capeMat.side=THREE.DoubleSide;const geo=new THREE.PlaneGeometry(1,1,32,24),p=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<p.count;i++){const u=uv.getX(i),v=1-uv.getY(i),a=(u-.5)*2.9,r=.245+v*.18+Math.sin(u*45)*.018*v;p.setXYZ(i,Math.sin(a)*r,1.44-v*1.02,Math.cos(a)*r+.025);}geo.computeVertexNormals();const cape=mesh(geo,capeMat,root);
 const satchel=mesh(new THREE.BoxGeometry(.24,.3,.1),leather,root,-.21,.92,.16);satchel.rotation.z=-.1;mesh(new THREE.BoxGeometry(.04,.05,.015),trim,root,-.21,.95,.22);
 return{root,spec,legs,arms,animate(time,speed,dt,action){const amount=Math.min(1,speed/2.8),phase=time*(speed>3.8?12:7.5);root.position.y=Math.sin(phase*2)*.018*amount;root.rotation.z=Math.sin(phase)*.018*amount;legs.forEach((l,i)=>l.rotation.x=Math.sin(phase+i*Math.PI)*.47*amount);arms.forEach((a,i)=>a.rotation.x=-Math.sin(phase+i*Math.PI)*.32*amount);if(action)arms[1].rotation.x=1.15;cape.rotation.x=Math.sin(time*2.1)*.025+amount*.08;cape.rotation.z=Math.sin(time*1.7)*.015;}};
}
