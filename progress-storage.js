// Accessing the storage property itself can throw when browser storage is blocked.
export function loadProgress(key, host=globalThis){
 let saved={};
 for(const name of ['localStorage','sessionStorage'])try{
  const value=JSON.parse(host[name]?.getItem(key)||'{}');
  if(value&&typeof value==='object'&&(Number(value.at)||0)>(Number(saved.at)||0))saved=value;
 }catch{}
 return saved;
}
export function saveProgress(key,value,host=globalThis){
 const text=JSON.stringify(value);let saved=false;
 for(const name of ['localStorage','sessionStorage'])try{
  const storage=host[name];if(storage){storage.setItem(key,text);saved=true;}
 }catch{}
 return saved;
}
