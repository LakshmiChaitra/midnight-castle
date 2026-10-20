// Combat tuning is independent of rendering so replay variety and rewards can be checked.
export const WEAPONS=[
 {id:'prism',name:'Prism repeater',short:'REPEATER',mag:8,delay:.22,reload:1.1,pellets:1,spread:0,damage:1,speed:30,life:3,color:0xa7f6df,description:'Quick, precise shots. A dependable all-rounder.'},
 {id:'bloom',name:'Bloom scattergun',short:'SCATTERGUN',mag:4,delay:.72,reload:1.45,pellets:5,spread:.085,damage:1,speed:26,life:.65,color:0xf5c69e,description:'Five close-range sparks. Strong against rushing shadows.'},
 {id:'comet',name:'Comet lance',short:'COMET LANCE',mag:5,delay:.7,reload:1.6,pellets:1,spread:0,damage:4,speed:45,life:3,color:0xbdb5ff,description:'A slower, powerful bolt that breaks heavy armor.'}
];
export const weaponFor=id=>WEAPONS.find(w=>w.id===id)||WEAPONS[0];
export function enemyKind(chapter,wave,index,run=0){
 if(wave%3===0&&index===0)return 'warden';
 const pattern=['wraith','rusher','wraith','sentinel','rusher'];
 return pattern[((index+chapter+run+wave-1)%pattern.length+pattern.length)%pattern.length];
}
export function enemyStats(kind,level=0){
 const n=Math.max(0,Math.floor(level/3));
 return kind==='warden'?{hp:14+n*2,speed:.5,radius:.95,shield:0,interval:3.6}:
 kind==='sentinel'?{hp:4+n,speed:.55,radius:.75,shield:2,interval:3.2}:
 kind==='rusher'?{hp:2+n,speed:1.5,radius:.6,shield:0,interval:2.2}:
 {hp:2+n,speed:.8,radius:.65,shield:0,interval:2.7};
}
export function damageEnemy(enemy,damage){
 const absorbed=Math.min(enemy.shield||0,damage);enemy.shield=Math.max(0,(enemy.shield||0)-absorbed);
 enemy.hp=Math.max(0,enemy.hp-(damage-absorbed));return enemy.hp===0;
}
export const shardBonus=count=>count===3?15:0;
