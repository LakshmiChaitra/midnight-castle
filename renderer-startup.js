export function createGameRenderer(THREE,lightweight=false){
 const options=lite=>({antialias:!lite,powerPreference:lite?'default':'high-performance',precision:lite?'mediump':'highp',stencil:false});
 try{return{renderer:new THREE.WebGLRenderer(options(lightweight)),lightweight};}
 catch(first){
  if(!lightweight)try{return{renderer:new THREE.WebGLRenderer(options(true)),lightweight:true};}catch{}
  throw new Error(`3D graphics could not start. ${first.message||first}`);
 }
}
