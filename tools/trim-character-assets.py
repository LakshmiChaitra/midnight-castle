"""Keep selected KayKit animations and compact their GLB buffers losslessly."""
import json,struct,sys
from pathlib import Path
source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
keep={'Idle','Walking_A','Running_A','1H_Ranged_Aiming','1H_Ranged_Shoot','Interact','Jump_Full_Short','Dodge_Backward','Hit_A','Cheer'}
for name,target in [('Rogue','mira'),('Knight','theo')]:
 data=(source/(name+'.glb')).read_bytes();length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length]);binary=data[28+length:]
 g['animations']=[a for a in g['animations'] if a.get('name') in keep]
 access=set()
 for m in g['meshes']:
  for p in m['primitives']:
   access.update(p.get('attributes',{}).values())
   if 'indices' in p:access.add(p['indices'])
   for t in p.get('targets',[]):access.update(t.values())
 for s in g.get('skins',[]):
  if 'inverseBindMatrices' in s:access.add(s['inverseBindMatrices'])
 for a in g['animations']:
  for s in a['samplers']:access.update([s['input'],s['output']])
 views={im['bufferView'] for im in g.get('images',[]) if 'bufferView' in im}
 for i in access:
  a=g['accessors'][i]
  if 'bufferView' in a:views.add(a['bufferView'])
  if 'sparse' in a:
   for k in ['indices','values']:views.add(a['sparse'][k]['bufferView'])
 viewmap={old:new for new,old in enumerate(sorted(views))};accessmap={old:new for new,old in enumerate(sorted(access))};buf=bytearray();newviews=[]
 for old in sorted(views):
  v=dict(g['bufferViews'][old]);offset=v.get('byteOffset',0);size=v['byteLength'];buf.extend(b'\0'*((-len(buf))%4));v['byteOffset']=len(buf);v['buffer']=0;buf.extend(binary[offset:offset+size]);newviews.append(v)
 newaccess=[]
 for old in sorted(access):
  a=g['accessors'][old]
  if 'bufferView' in a:a['bufferView']=viewmap[a['bufferView']]
  if 'sparse' in a:
   for k in ['indices','values']:a['sparse'][k]['bufferView']=viewmap[a['sparse'][k]['bufferView']]
  newaccess.append(a)
 for m in g['meshes']:
  for p in m['primitives']:
   p['attributes']={k:accessmap[v] for k,v in p.get('attributes',{}).items()}
   if 'indices' in p:p['indices']=accessmap[p['indices']]
   for t in p.get('targets',[]):
    for k,v in list(t.items()):t[k]=accessmap[v]
 for s in g.get('skins',[]):
  if 'inverseBindMatrices' in s:s['inverseBindMatrices']=accessmap[s['inverseBindMatrices']]
 for a in g['animations']:
  for s in a['samplers']:s['input']=accessmap[s['input']];s['output']=accessmap[s['output']]
 for im in g.get('images',[]):
  if 'bufferView' in im:im['bufferView']=viewmap[im['bufferView']]
 g['accessors']=newaccess;g['bufferViews']=newviews;g['buffers']=[{'byteLength':len(buf)}]
 js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);buf+=b'\0'*((-len(buf))%4)
 packed=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
 (out/(target+'.glb')).write_bytes(packed);print(target,round(len(packed)/1024),'KiB',len(g['animations']),'animation clips')
