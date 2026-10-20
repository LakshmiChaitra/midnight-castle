import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restoreNightfall,completeNight,buyFurniture,segmentHitsSphere,FURNITURE} from '../nightfall-state.js';

test('story chapters unlock in order and all seven can be completed',()=>{
 const s=restoreNightfall();assert.equal(completeNight(s,3),0);assert.equal(s.embers,0);
 for(let i=0;i<7;i++)assert.equal(completeNight(s,i),40);
 assert.deepEqual(s.completed,[0,1,2,3,4,5,6]);assert.equal(s.embers,280);assert.equal(completeNight(s,7),0);
 assert.equal(completeNight(s,0),12);assert.equal(s.completed.length,7);
});
test('furniture purchase is atomic, affordable, and cannot charge twice',()=>{
 const s=restoreNightfall();assert.equal(buyFurniture(s,'fern'),false);completeNight(s,0);
 assert.equal(buyFurniture(s,'fern'),true);assert.equal(s.embers,20);assert.equal(buyFurniture(s,'fern'),false);assert.equal(s.embers,20);
 assert.equal(buyFurniture(s,'not-a-reward'),false);assert.equal(buyFurniture(s,'core'),false);
 assert.equal(restoreNightfall(JSON.parse(JSON.stringify(s))).owned[0],'fern');
});
test('restore rejects corrupt chapters and unknown furniture',()=>{
 const s=restoreNightfall({completed:[0,0,2,8,'1'],owned:['fern','fern','fake'],hidden:['fern','fake'],embers:-5,palette:'fake'});
 assert.deepEqual(s.completed,[0]);assert.deepEqual(s.owned,['fern']);assert.deepEqual(s.hidden,['fern']);assert.equal(s.embers,0);assert.equal(s.palette,'teal');assert.equal(FURNITURE.length,6);
});
test('fast projectiles hit through a target between rendered frames',()=>{
 const target={x:0,y:1,z:-4};
 assert.equal(segmentHitsSphere({x:0,y:1,z:0},{x:0,y:1,z:-8},target,.5),true);
 assert.equal(segmentHitsSphere({x:2,y:1,z:0},{x:2,y:1,z:-8},target,.5),false);
 assert.equal(segmentHitsSphere({x:0,y:1,z:0},{x:0,y:1,z:1},target,.5),false);
 assert.equal(segmentHitsSphere(target,target,target,.5),true);
});

test('non-finite saved currency and scores do not poison progression',()=>{const s=restoreNightfall({embers:Infinity,bestWave:'NaN'});assert.equal(s.embers,0);assert.equal(s.bestWave,0);});
