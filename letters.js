import {loadProgress,saveProgress} from './progress-storage.js';
export function createLetters(onReward = () => {}, onActivity = () => {}) {
const $ = id => document.getElementById(id), KEY = 'nameless-keep-v2';
const letters = [
 'You are allowed to begin again without pretending the first attempt never mattered.',
 'Somewhere, someone still smiles when they remember a tiny kindness you have already forgotten.',
 'I hope an ordinary Tuesday surprises you with something beautiful. The smallest things count, too.',
 'You do not need a spectacular story to deserve a soft place to land.',
 'The version of you who kept going quietly deserves a little celebration tonight.',
 'If you are between chapters, you are still part of the story. Take your time turning the page.',
 'May you find people who make the ordinary parts of your day feel like somewhere you belong.',
 'There is no deadline for becoming someone you feel at home with.',
 'You can love where you have been and still choose somewhere new.',
 'A new beginning can be quiet. You do not need an audience to start again.'
];
const rewards = [
 {id:'lantern',cost:25,icon:'♧',name:'The wandering lantern',description:'Automatically equipped: a glowing lantern floats beside your traveler in every realm. In first person, you carry it.'},
 {id:'stars',cost:50,icon:'☄',name:'A sky full of wishes',description:'A sky effect: call a shower of falling stars over the castle. Open the rewards again whenever you want to replay it.'},
 {id:'roof',cost:90,icon:'☾',name:'The door above the stars',description:'An area unlock: raise the sealed gate beyond the cathedral tree, then climb the stair to the hidden Moon Terrace.'}
];
const saved=loadProgress(KEY);
const norm=s=>s.trim().toLowerCase().replace(/\s+/g,' ');
const state={read:Array.isArray(saved.read)?[...new Set(saved.read.filter(n=>Number.isInteger(n)&&n>=0&&n<letters.length))]:[],written:Array.isArray(saved.written)?saved.written.filter(s=>typeof s==='string'&&s.length>=24&&s.length<=500).filter((s,i,a)=>a.findIndex(t=>norm(t)===norm(s))===i).slice(0,100):[],rewards:[]};
const earned=()=>state.read.length*5+state.written.length*20;
let available=earned();for(const id of Array.isArray(saved.rewards)?[...new Set(saved.rewards)]:[]){const r=rewards.find(x=>x.id===id);if(r&&available>=r.cost){state.rewards.push(id);available-=r.cost;}}
const has=id=>state.rewards.includes(id), balance=()=>earned()-rewards.filter(r=>has(r.id)).reduce((v,r)=>v+r.cost,0);
let selected=-1,previous=-1,timer;
function save(){if(!saveProgress(KEY,{...state,at:Date.now()}))toast('Saving is unavailable. You can still wander this session.');}
function render(){ $('balance').textContent=balance();$('reward-balance').textContent=balance();$('journal-count').textContent=String(state.read.length+state.written.length).padStart(2,'0'); }
function toast(text){$('world-toast').textContent=text;$('world-toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('world-toast').classList.remove('visible'),4500);}
function modal(id){if(document.pointerLockElement)document.exitPointerLock();document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.dispatchEvent(new Event('keep:pause'));$(id).showModal();}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}));
function openLetter(){const unseen=letters.map((_,i)=>i).filter(i=>!state.read.includes(i)&&i!==previous);const all=[...letters,...state.written].map((_,i)=>i).filter(i=>i!==previous);const choices=unseen.length?unseen:all;selected=choices[Math.floor(Math.random()*choices.length)]??0;previous=selected;$('letter-origin').textContent=selected<letters.length?'SAMPLE LETTER':'YOUR LOCAL LETTER';$('sealed-letter').hidden=false;$('opened-letter').hidden=true;modal('letter-dialog');}
$('break-seal').addEventListener('click',()=>{if(!$('opened-letter').hidden)return;$('sealed-letter').hidden=true;$('opened-letter').hidden=false;$('letter-body').textContent=selected<letters.length?letters[selected]:state.written[selected-letters.length];onActivity('read',selected<letters.length?`sample-${selected}`:`local-${selected-letters.length}`);if(selected<letters.length&&!state.read.includes(selected)){state.read.push(selected);$('read-award').textContent='+5 ✦ A little light, found.';save();render();}else $('read-award').textContent=selected<letters.length?'A familiar letter. Still yours to read.':'A little light you left here.';});
$('another-letter').addEventListener('click',openLetter);
function openWrite(){$('write-form').hidden=false;$('seal-success').hidden=true;$('write-error').textContent='';modal('write-dialog');}
$('message').addEventListener('input',()=>{$('character-count').textContent=`${$('message').value.length} / 500`;$('write-error').textContent='';});
$('write-form').addEventListener('submit',e=>{e.preventDefault();const text=$('message').value.trim();if(text.length<24){$('write-error').textContent='Leave at least 24 characters for whoever finds this.';return;}if(state.written.some(s=>norm(s)===norm(text))){$('write-error').textContent='That light is already here. Leave a different thought.';return;}if(state.written.length>=100){$('write-error').textContent='This playtest drawer holds 100 letters. You can still explore and read.';return;}state.written.push(text);onActivity('write');save();render();$('write-form').hidden=true;$('seal-success').hidden=false;$('message').value='';$('character-count').textContent='0 / 500';});
$('write-again').addEventListener('click',openWrite);
function openRewards(){render();$('reward-list').replaceChildren();for(const reward of rewards){const article=document.createElement('article'),icon=document.createElement('span'),info=document.createElement('div'),title=document.createElement('h3'),desc=document.createElement('p'),button=document.createElement('button');icon.className='reward-art';icon.textContent=reward.icon;title.textContent=reward.name;desc.textContent=reward.description;info.append(title,desc);button.className='gold-button';button.type='button';button.textContent=has(reward.id)?reward.id==='stars'?'CALL THE STARS ↗':reward.id==='lantern'?'EQUIPPED ✓':'UNLOCKED ✓':`${reward.cost} ✦ REDEEM`;button.disabled=has(reward.id)?reward.id!=='stars':balance()<reward.cost;button.setAttribute('aria-label',has(reward.id)?`${reward.name}: ${reward.id==='stars'?'call the stars again':reward.id==='lantern'?'equipped on your traveler':'area unlocked'}`:`Redeem ${reward.name} for ${reward.cost} stardust`);button.addEventListener('click',()=>{if(!has(reward.id)){if(balance()<reward.cost)return;state.rewards.push(reward.id);save();render();}$('rewards-dialog').close();onReward(reward.id);toast(reward.id==='roof'?'The gate beyond the tree is rising. Follow the stair.':reward.id==='stars'?'Let the sky remember your wish.':'Lantern equipped. It now travels beside your character.');});article.append(icon,info,button);$('reward-list').append(article);}modal('rewards-dialog');}
function openPost(){ $('object-icon').textContent='✉';$('object-code').textContent='THE NAMELESS POST';$('object-title').textContent='Words, waiting to be found.';$('object-description').textContent='A stranger left a little light here. Borrow it for a moment, or leave one of your own.';$('object-options').replaceChildren();for(const [text,fn] of [['OPEN A LETTER · +5 ✦',openLetter],['LEAVE A LETTER · +20 ✦',openWrite]]){const b=document.createElement('button');b.className='gold-button';b.textContent=text;b.addEventListener('click',fn);$('object-options').append(b);}modal('object-dialog');}
function openJournal(){$('stat-read').textContent=state.read.length;$('stat-written').textContent=state.written.length;$('stat-earned').textContent=earned();$('journal-letters').replaceChildren();if(!state.written.length){const p=document.createElement('p');p.textContent='The first page is waiting for you.';$('journal-letters').append(p);}for(const [i,text]of [...state.written].reverse().entries()){const a=document.createElement('article'),label=document.createElement('span'),p=document.createElement('p');label.textContent=`SEALED LETTER ${state.written.length-i} / LEFT BY YOU`;p.textContent=text;a.append(label,p);$('journal-letters').append(a);}modal('journal-dialog');}
$('open-rewards').addEventListener('click',openRewards);$('open-journal').addEventListener('click',openJournal);$('settings').addEventListener('click',()=>modal('settings-dialog'));
render();return{has,toast,openPost,openLetter,openWrite,openRewards,modal};
}
