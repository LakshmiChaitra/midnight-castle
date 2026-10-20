import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {loadProgress,saveProgress} from '../progress-storage.js';
import {createGameRenderer} from '../renderer-startup.js';

test('blocked storage getters do not stop the game',()=>{
 const blocked={};for(const name of ['localStorage','sessionStorage'])Object.defineProperty(blocked,name,{get(){throw new Error('SecurityError');}});
 assert.deepEqual(loadProgress('test',blocked),{});assert.equal(saveProgress('test',{at:1},blocked),false);
});
test('session progress survives an inaccessible local store',()=>{
 const host={get localStorage(){throw new Error('Blocked');},sessionStorage:{getItem:()=>JSON.stringify({at:4,read:[2]}),setItem(k,value){this.value=value;}}};
 assert.deepEqual(loadProgress('test',host),{at:4,read:[2]});assert.equal(saveProgress('test',{at:5},host),true);assert.equal(host.sessionStorage.value,'{"at":5}');
});
test('corrupt saved data does not prevent startup',()=>{
 const host={localStorage:{getItem:()=>'{broken'},sessionStorage:{getItem:()=>JSON.stringify({at:2})}};assert.deepEqual(loadProgress('test',host),{at:2});
});
test('a failed high-performance graphics context retries with lighter options',()=>{
 const options=[];class Renderer{constructor(config){options.push(config);if(options.length===1)throw new Error('Context unavailable');}}
 const result=createGameRenderer({WebGLRenderer:Renderer});assert.equal(result.lightweight,true);assert.equal(options.length,2);assert.equal(options[1].antialias,false);assert.equal(options[1].powerPreference,'default');assert.equal(options[1].precision,'mediump');
});
test('complete graphics failure reports an actionable startup error',()=>{
 class Renderer{constructor(){throw new Error('No WebGL2');}}
 assert.throws(()=>createGameRenderer({WebGLRenderer:Renderer}),/3D graphics could not start/);
});
function boot(){
 const elements=new Map(),listeners=new Map(),classes=new Set(['engine-loading']),assigned=[];
 function element(id){if(!elements.has(id))elements.set(id,{id,hidden:false,textContent:'',dataset:{},events:{},addEventListener(type,fn){this.events[type]=fn;}});return elements.get(id);}
 element('castle-boot').dataset.engine='game.test.js';
 const document={getElementById:element,body:{dataset:{},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}},createElement:()=>element('injected-script'),head:{append(el){this.script=el;}}};
 const window={addEventListener(type,fn){listeners.set(type,fn);}};
 const location={origin:'https://example.com',pathname:'/castle/',search:'',href:'https://example.com/castle/',assign:u=>assigned.push(u),reload(){assigned.push('reload');}};
 vm.runInNewContext(readFileSync(new URL('../boot.js',import.meta.url),'utf8'),{document,window,location,navigator:{userAgent:'Chrome test',clipboard:{writeText:async()=>{}}},URL,URLSearchParams,requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout(){}});
 return{document,e:element,classes,assigned,fire:(type,event={})=>listeners.get(type)?.(event)};
}
test('the loading cover stays until a rendered-frame ready event',()=>{
 const b=boot();assert.equal(b.document.head.script.src,'game.test.js');assert.ok(b.classes.has('engine-loading'));b.fire('castle:ready');assert.equal(b.e('engine-boot').hidden,true);assert.equal(b.document.body.dataset.engineState,'ready');assert.ok(!b.classes.has('engine-loading'));
});
test('a failed download displays a retry instead of the overlapping old interface',()=>{
 const b=boot();b.document.head.script.events.error();assert.equal(b.document.body.dataset.engineState,'error');assert.equal(b.e('engine-boot').hidden,false);assert.equal(b.e('engine-actions').hidden,false);assert.match(b.e('engine-diagnostics').textContent,/download failed/);b.e('engine-light').events.click();assert.equal(new URL(b.assigned[0]).searchParams.get('graphics'),'lite');
});
test('an initialization exception is displayed even after the download succeeds',()=>{
 const b=boot();b.fire('error',{error:new Error('Startup exploded'),message:'Startup exploded'});assert.equal(b.document.body.dataset.engineState,'error');assert.match(b.e('engine-diagnostics').textContent,/Startup exploded/);
});
test('the bundle cannot silently load without starting the world',()=>{
 const b=boot();b.document.head.script.events.load();assert.equal(b.document.body.dataset.engineState,'error');assert.match(b.e('engine-diagnostics').textContent,/did not finish starting/);
});
