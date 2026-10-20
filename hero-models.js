import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {buildTraveler as fallbackTraveler,TRAVELERS} from './travelers.js';
const cache=new Map(),loader=new GLTFLoader();
function load(id){if(!cache.has(id))cache.set(id,loader.loadAsync(`assets/characters/${id}.glb`).catch(error=>{cache.delete(id);throw error;}));return cache.get(id);}
export function buildHero(id){
 const root=new THREE.Group(),fallback=fallbackTraveler(id);root.add(fallback.root);const spec=TRAVELERS.find(t=>t.id===id);
 let disposed=false,mixer=null,model=null,current=null,shootAction=null,interactAction=null,lastAction=false,last={time:0,speed:0,dt:0,action:false,context:{}};const actions=new Map();
 const disposeFallback=()=>{fallback.root.removeFromParent();const mats=new Set();fallback.root.traverse(o=>{if(o.isMesh){o.geometry.dispose();mats.add(o.material);}});for(const m of mats){m.map?.dispose();m.dispose();}};
 load(id).then(gltf=>{if(disposed)return;model=clone(gltf.scene);model.rotation.y=Math.PI;model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material=o.material.clone();o.material.roughness=.82;}if(/^(1H_|2H_|Knife|Throwable|Sword|Axe|Crossbow|Shield|Staff|Wand|Bow|Arrow)/i.test(o.name))o.visible=false;});model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),height=box.max.y-box.min.y;model.scale.setScalar(1.95/height);model.position.y=-box.min.y*model.scale.y;root.add(model);disposeFallback();mixer=new THREE.AnimationMixer(model);for(const clip of gltf.animations)actions.set(clip.name,mixer.clipAction(clip));
 const shot=gltf.animations.find(c=>c.name==='1H_Ranged_Shoot');if(shot){const tracks=shot.tracks.filter(t=>/arm|hand|shoulder|clavicle/i.test(t.name));shootAction=mixer.clipAction(new THREE.AnimationClip('upper-body-shot',shot.duration,tracks));shootAction.setLoop(THREE.LoopOnce,1);shootAction.clampWhenFinished=false;}
 interactAction=actions.get('Interact');if(interactAction){interactAction.setLoop(THREE.LoopOnce,1);interactAction.clampWhenFinished=false;}
 animate(last.time,last.speed,0,last.action,last.context);
 }).catch(error=>{root.userData.modelFallback=true;console.warn('Traveler model could not load',id,error);});
 function animate(time,speed,dt,action=false,context={}){last={time,speed,dt,action,context};if(disposed)return;if(!mixer){fallback.animate(time,speed,dt,action);return;}
 const name=speed>.12?(speed>4.4?'Running_A':'Walking_A'):(context.aiming?'1H_Ranged_Aiming':'Idle');const next=actions.get(name)||actions.get('Idle');if(next!==current){if(current)current.fadeOut(.16);next?.reset().fadeIn(.16).play();current=next;}if(next)next.timeScale=speed>.12?THREE.MathUtils.clamp(speed/(speed>4.4?5.5:2.8),.65,1.7):1;
 if(action&&!lastAction)interactAction?.reset().setEffectiveWeight(.85).play();lastAction=action;mixer.update(dt);root.position.y=0;
 }
 return{root,spec,legs:[],arms:[],animate,dodge(){const a=actions.get('Dodge_Backward');if(a){a.setLoop(THREE.LoopOnce,1);a.reset().setEffectiveWeight(1).play();}},shoot(){shootAction?.reset().setEffectiveWeight(.9).play();},dispose(){disposed=true;if(mixer){mixer.stopAllAction();mixer.uncacheRoot(model);model.traverse(o=>{if(o.isMesh)o.material.dispose();});}else disposeFallback();root.clear();}};
}
