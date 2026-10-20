import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClickPace} from '../movement-pace.js';

test('rapid directional clicks run faster, with a bounded top speed',()=>{
 const pace=createClickPace();pace.tap('forward',0);assert.equal(pace.speed(0),4.2);
 pace.tap('forward',200);assert.ok(pace.speed(200)>6);
 pace.tap('forward',250);assert.equal(pace.speed(250),7.5);
});
test('changing direction resets the burst and stale clicks settle to walking',()=>{
 const pace=createClickPace();pace.tap('forward',0);pace.tap('forward',100);
 assert.ok(pace.speed(100)>7);assert.ok(pace.speed(4000)<4.25);
 pace.tap('back',200);assert.equal(pace.speed(200),4.2);
});
test('equal elapsed time gives similar travel distance at 20, 60 and 144 fps',()=>{
 function distance(fps){const pace=createClickPace();pace.tap('forward',0);pace.tap('forward',100);let result=0;for(let frame=0;frame<fps*2;frame++)result+=pace.speed(100+(frame+.5)*1000/fps)/fps;return result;}
 assert.ok(Math.abs(distance(20)-distance(144))<.01);
 assert.ok(Math.abs(distance(60)-distance(144))<.01);
});
