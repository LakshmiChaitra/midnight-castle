export const NIGHTS=[
 {title:'The first stolen word',realm:'cathedral',place:'The Drowned Cathedral',clue:'An unsigned letter is fading beneath the wishing tree.',letter:'If you can read this, the castle has not forgotten us. I hid seven pieces of a promise, one in every place the dark could not understand. Start with the books that survived the fire.',reward:'The first piece of the promise'},
 {title:'Ink beneath the ash',realm:'library',place:'The Ashen Library',clue:'A page survived the fire. The shadows have found it.',letter:'The fire took the shelves, but someone carried every letter outside. Kindness is rarely the loudest thing in a room. Look east: the stars remember the person who saved them.',reward:'The archivist’s testimony'},
 {title:'The missing constellation',realm:'winter',place:'The Winter Observatory',clue:'Defend the astronomer’s last message beneath the iron sky.',letter:'We thought the sky had lost a star. It was a lantern in a window, kept burning for a friend who had not come home. The next piece waits where the rain falls through stone.',reward:'A star’s true name'},
 {title:'The name in the rain',realm:'cathedral',place:'The Drowned Cathedral',clue:'The rain has revealed a name. Keep the page alight.',letter:'The name was never a king’s. It belonged to the keeper who opened the gates to strangers. There was no treasure hidden here, only a place to rest. Someone left a map in the west archive.',reward:'The keeper’s name'},
 {title:'A map without borders',realm:'library',place:'The Ashen Library',clue:'The map is alive. Hold back the ink wraiths.',letter:'The map did not show kingdoms. It marked every door where someone had said: come in, you are safe. One final path leads through the glasshouse, where a seed was planted for every person who returned.',reward:'The map of open doors'},
 {title:'What the garden kept',realm:'garden',place:'The Moonlit Conservatory',clue:'Protect the seed-letter until the last shadow dissolves.',letter:'The garden grew because people returned. Not because they owed the castle anything, but because there was always a light for them. Carry this last seed to the wishing tree. The promise is almost whole.',reward:'The seed of a new beginning'},
 {title:'A light for the next traveler',realm:'cathedral',place:'The Drowned Cathedral',clue:'The last siege. Keep the promise alive and read its final words.',letter:'Here is the promise: you do not have to earn a place in the world by being useful every moment. Rest here. Leave a light if you can. The door will be open for the next traveler, just as it was for you.',reward:'The Keeper of Seven Lights crest'}
];
export const FURNITURE=[
 {id:'fern',name:'Moon fern',cost:20,description:'Silver leaves beside your window.'},
 {id:'books',name:'The wandering bookshelf',cost:35,description:'A small library for your rescued stories.'},
 {id:'orb',name:'A bottled constellation',cost:50,description:'An animated miniature sky on your desk.'},
 {id:'core',name:'Prism blaster core',cost:60,description:'Reload in 0.6 seconds instead of 1.1.'},
 {id:'flowers',name:'Night-blooming flowers',cost:45,description:'A glowing flower garden at your bedside.'},
 {id:'mobile',name:'Seven-star mobile',cost:80,description:'A turning constellation above your bed.'}
];
export function restoreNightfall(raw={}){
 const count=n=>Number.isFinite(Number(n))?Math.min(1000000,Math.max(0,Math.floor(Number(n)))):0;
 const completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<7))].sort((a,b)=>a-b):[];
 // Story chapters are sequential; ignore any out-of-order saved entries.
 const ordered=[];for(let i=0;i<7&&completed.includes(i);i++)ordered.push(i);
 return{completed:ordered,embers:count(raw.embers),owned:Array.isArray(raw.owned)?[...new Set(raw.owned.filter(id=>FURNITURE.some(f=>f.id===id)))]:[],hidden:Array.isArray(raw.hidden)?raw.hidden.filter(id=>FURNITURE.some(f=>f.id===id)):[],palette:['teal','plum','moss'].includes(raw.palette)?raw.palette:'teal',bestWave:count(raw.bestWave)};
}
export function completeNight(state,index){
 if(!Number.isInteger(index)||index<0||index>=7||index>state.completed.length)return 0;
 const first=!state.completed.includes(index);if(first)state.completed.push(index);
 const reward=first?40:12;state.embers+=reward;return reward;
}
export function buyFurniture(state,id){const item=FURNITURE.find(x=>x.id===id);if(!item||state.owned.includes(id)||state.embers<item.cost)return false;state.embers-=item.cost;state.owned.push(id);return true;}
export function segmentHitsSphere(a,b,center,radius){
 const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=dx*dx+dy*dy+dz*dz;
 const t=len?Math.max(0,Math.min(1,((center.x-a.x)*dx+(center.y-a.y)*dy+(center.z-a.z)*dz)/len)):0;
 return (a.x+t*dx-center.x)**2+(a.y+t*dy-center.y)**2+(a.z+t*dz-center.z)**2<=radius*radius;
}
