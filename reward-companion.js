import * as THREE from 'three';

// A world-space reward travels with the actor in the follow camera.
export function createLanternCompanion(actor){
 const root=new THREE.Group();root.userData.dynamic=true;actor.add(root);
 const metal=new THREE.MeshStandardMaterial({color:0xc6a565,metalness:.8,roughness:.3});
 const glass=new THREE.MeshStandardMaterial({color:0xffcf82,emissive:0xffa52b,emissiveIntensity:.65,transparent:true,opacity:.25,roughness:.2});
 const flameMaterial=new THREE.MeshBasicMaterial({color:0xffdf9a});
 function mesh(geometry,material,x=0,y=0,z=0){const part=new THREE.Mesh(geometry,material);part.position.set(x,y,z);root.add(part);return part;}
 for(const y of [-.22,.22])mesh(new THREE.CylinderGeometry(.16,.18,.055,8),metal,0,y);
 for(const x of [-.115,.115])for(const z of [-.115,.115])mesh(new THREE.CylinderGeometry(.012,.012,.44,6),metal,x,0,z);
 mesh(new THREE.CylinderGeometry(.13,.13,.38,12),glass);
 const flame=mesh(new THREE.SphereGeometry(.065,10,8),flameMaterial);flame.scale.y=1.8;
 mesh(new THREE.ConeGeometry(.18,.12,8),metal,0,.30);
 mesh(new THREE.TorusGeometry(.075,.012,6,24),metal,0,.43);
 const light=new THREE.PointLight(0xffbe63,8,5,1.5);root.add(light);
 root.visible=false;
 return{root,light,update({owned,follow,traveler,time,reduced}){
  root.visible=owned&&follow;
  const human=traveler==='mira'||traveler==='theo';
  root.position.set(human?.66:.5,(human?1.16:.76)+(reduced?0:Math.sin(time*2.4)*.035),.06);
  root.rotation.z=reduced?0:Math.sin(time*1.8)*.055;
  flame.scale.y=1.8+(reduced?0:Math.sin(time*11)*.18);
 }};
}
