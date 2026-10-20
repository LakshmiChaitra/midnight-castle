// Input timestamps set travel speed; rendering frame rate never sets it.
export function createClickPace(base=4.2,max=7.5){
 let last=-Infinity,direction=null,peak=base;
 return {
  tap(next,now){
   const gap=now-last;
   peak=next===direction&&gap>=40&&gap<650?Math.min(max,base+Math.max(0,1000/gap-1.5)*.65):base;
   last=now;direction=next;
  },
  speed(now){return base+(peak-base)*Math.exp(-Math.max(0,now-last-250)/700);}
 };
}
