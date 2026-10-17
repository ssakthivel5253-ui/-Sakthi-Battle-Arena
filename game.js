const T=THREE,$=i=>document.getElementById(i),rnd=(a,b)=>a+Math.random()*(b-a);
const scene=new T.Scene();scene.background=new T.Color(0x9ad0ec);scene.fog=new T.Fog(0x9ad0ec,30,110);
const cam=new T.PerspectiveCamera(65,1,.1,160);
const ren=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(devicePixelRatio,1.25));document.body.prepend(ren.domElement);
function rs(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',rs);rs();
scene.add(new T.HemisphereLight(0xffffff,0x557744,1));
const R=85,RAD=[85,58,38,22,10,3];
scene.add(new T.Mesh(new T.CircleGeometry(R+15,28).rotateX(-Math.PI/2),new T.MeshLambertMaterial({color:0x5c9a4a})));
// obstacles
const obs=[],lam=c=>new T.MeshLambertMaterial({color:c});
const trG=new T.CylinderGeometry(.25,.35,2.5,6).translate(0,1.25,0),lfG=new T.ConeGeometry(1.6,3.5,7).translate(0,4,0),rkG=new T.BoxGeometry(2.4,1.6,2.4).translate(0,.8,0);
const mT=lam(0x6b4a2b),mL=lam(0x2f7d3b),mR=lam(0x8a8f98);
for(let i=0;i<60;i++){const a=rnd(0,6.28),d=Math.sqrt(Math.random())*(R-3),x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.hypot(x,z)<6)continue;
if(i%4==0){const m=new T.Mesh(rkG,mR);m.position.set(x,0,z);m.rotation.y=rnd(0,3);scene.add(m);obs.push({x,z,r:1.5})}
else{const g=new T.Group();g.add(new T.Mesh(trG,mT),new T.Mesh(lfG,mL));const s=rnd(.8,1.3);g.scale.set(s,s,s);g.position.set(x,0,z);scene.add(g);obs.push({x,z,r:.6*s})}}
// zone wall
const zm=new T.Mesh(new T.CylinderGeometry(1,1,40,40,1,true),new T.MeshBasicMaterial({color:0x3b6cff,transparent:true,opacity:.25,side:T.DoubleSide,depthWrite:false}));scene.add(zm);
// characters
const skin=lam(0xf2c9a0),dark=lam(0x2a2f3a);
const bG=new T.BoxGeometry(.7,1,.45),hG=new T.SphereGeometry(.28,8,6),lG=new T.BoxGeometry(.6,.6,.35),gG=new T.BoxGeometry(.12,.12,.7);
function mkChar(c){const g=new T.Group(),m=lam(c);
const b=new T.Mesh(bG,m);b.position.y=1;const h=new T.Mesh(hG,skin);h.position.y=1.75;const l=new T.Mesh(lG,dark);l.position.y=.3;const u=new T.Mesh(gG,dark);u.position.set(-.4,1.1,.4);
g.add(b,h,l,u);g.userData.m=m;scene.add(g);return g}
// tracers
const trs=[];for(let i=0;i<12;i++){const l=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xffe066}));l.visible=false;l.frustumCulled=false;l.life=0;scene.add(l);trs.push(l)}
let ti=0;function tracer(s,e){const l=trs[ti++%12],p=l.geometry.attributes.position;p.setXYZ(0,s.x,s.y,s.z);p.setXYZ(1,e.x,e.y,e.z);p.needsUpdate=true;l.visible=true;l.life=.07}
// state
const W=[{n:'Rifle',cap:30,r0:90,rate:.12,dmg:14,pel:1,sp:.025,rl:1.4},{n:'Shotgun',cap:6,r0:24,rate:.85,dmg:11,pel:7,sp:.09,rl:2}];
let state='menu',P=null,enemies=[],pk=[],zone,kills=0,tm=0,wi=0,shooting=0,aim=0,jx=0,jy=0,yaw=0,pitch=.1,nextS=0,rel=0,fov=65,dmgT=0,outZ=0;
const pkG=new T.BoxGeometry(.6,.6,.6),pkM=[new T.MeshLambertMaterial({color:0xffcc33,emissive:0x553300}),new T.MeshLambertMaterial({color:0xff4466,emissive:0x550011})];
function rayS(o,d,cx,cy,cz,r,vert){const ox=o.x-cx,oz=o.z-cz,oy=vert?0:o.y-cy,dy=vert?0:d.y;
const a=d.x*d.x+d.z*d.z+dy*dy,b=2*(ox*d.x+oz*d.z+oy*dy),c=ox*ox+oz*oz+oy*oy-r*r,q=b*b-4*a*c;
if(q<0||a<1e-6)return 1e9;const t=(-b-Math.sqrt(q))/(2*a);return t>0?t:1e9}
function push(o,rad){for(const q of obs){const dx=o.x-q.x,dz=o.z-q.z,d=Math.hypot(dx,dz),m=q.r+rad;if(d<m&&d>0){o.x=q.x+dx/d*m;o.z=q.z+dz/d*m}}
const d=Math.hypot(o.x,o.z);if(d>R+8){o.x*=(R+8)/d;o.z*=(R+8)/d}}
function shot(o,d0,w,sp,fromP,st){for(let i=0;i<w.pel;i++){
const d=d0.clone();d.x+=rnd(-1,1)*sp;d.y+=rnd(-1,1)*sp;d.z+=rnd(-1,1)*sp;d.normalize();
let best=70,hit=null;for(const q of obs){const t=rayS(o,d,q.x,0,q.z,q.r,1);if(t<best)best=t}
if(fromP){for(const e of enemies){if(e.dead)continue;const t=rayS(o,d,e.x,1.1,e.z,.95,0);if(t<best){best=t;hit=e}}if(hit)hurtE(hit,w.dmg)}
else{const t=rayS(o,d,P.x,1.1,P.z,.8,0);if(t<best){best=t;hurtP(w.dmg)}}
tracer(st||o,{x:o.x+d.x*best,y:o.y+d.y*best,z:o.z+d.z*best})}}
function alive(){let n=1;for(const e of enemies)if(!e.dead)n++;return n}
function hurtE(e,d){e.hp-=d;e.flash=.1;if(e.hp<=0)killE(e,1)}
function killE(e,byP){e.dead=1;scene.remove(e.g);if(byP)kills++;if(alive()==1)end(1)}
function hurtP(d){if(state!='play')return;P.hp-=d;dmgT=.4;if(P.hp<=0){P.hp=0;end(0)}}
function end(win){if(state!='play')return;const pl=alive();state='over';shooting=0;
const sc=kills*100+Math.floor(tm)*2+(win?1000:0);
$('scr').style.display='flex';$('scr').querySelector('h1').textContent=win?'VICTORY! 🏆':'GAME OVER';
$('sp').innerHTML=`Placement: #${win?1:pl}<br>Eliminations: ${kills}<br>Score: ${sc}`;$('go').textContent='PLAY AGAIN'}
function start(){enemies.forEach(e=>scene.remove(e.g));pk.forEach(p=>scene.remove(p));enemies=[];pk=[];
if(!P)P={g:mkChar(0x2e86ff)};const a=rnd(0,6.28);P.x=Math.cos(a)*45;P.z=Math.sin(a)*45;P.hp=100;
W.forEach(w=>{w.mag=w.cap;w.res=w.r0});wi=0;rel=0;kills=0;tm=0;yaw=Math.atan2(-P.x,-P.z);pitch=.1;
const cols=[0xd94f4f,0xe0a030,0x9b59b6,0x1abc9c,0xe67e22,0xc0392b,0x7f8c8d];
for(let i=0;i<9;i++){let x,z;do{const a=rnd(0,6.28),d=rnd(10,R-6);x=Math.cos(a)*d;z=Math.sin(a)*d}while(Math.hypot(x-P.x,z-P.z)<25);
const g=mkChar(cols[i%cols.length]);enemies.push({g,x,z,hp:70,tx:x,tz:z,tt:0,cd:rnd(.5,1.5),dead:0,flash:0,s:Math.random()<.5?1:-1})}
for(let i=0;i<14;i++){const a=rnd(0,6.28),d=rnd(5,R-5),m=new T.Mesh(pkG,pkM[i%2]);m.position.set(Math.cos(a)*d,.8,Math.sin(a)*d);m.userData.t=i%2;scene.add(m);pk.push(m)}
zone={x:0,z:0,r:R,ph:0,st:'wait',t:25,fx:0,fz:0,fr:R,tx:0,tz:0,tr:R};
$('scr').style.display='none';state='play';
try{document.documentElement.requestFullscreen().catch(()=>{});screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}
$('go').onclick=start;
// controls
const pad=$('pad'),jb=$('jb'),jk=$('jk');let jid=null,lid=null,jo,lp;
pad.addEventListener('pointerdown',e=>{pad.setPointerCapture(e.pointerId);
if(e.clientX<innerWidth/2){if(jid===null){jid=e.pointerId;jo={x:e.clientX,y:e.clientY};jb.style.cssText=`display:block;left:${jo.x-55}px;top:${jo.y-55}px`;jk.style.transform='none'}}
else if(lid===null){lid=e.pointerId;lp={x:e.clientX,y:e.clientY}}});
pad.addEventListener('pointermove',e=>{
if(e.pointerId===jid){let dx=e.clientX-jo.x,dy=e.clientY-jo.y;const l=Math.hypot(dx,dy),m=50;if(l>m){dx*=m/l;dy*=m/l}jk.style.transform=`translate(${dx}px,${dy}px)`;jx=dx/m;jy=-dy/m}
else if(e.pointerId===lid){const s=aim?.003:.0055;yaw-=(e.clientX-lp.x)*s;pitch=Math.max(-.6,Math.min(.5,pitch-(e.clientY-lp.y)*s*.8));lp={x:e.clientX,y:e.clientY}}});
const up=e=>{if(e.pointerId===jid){jid=null;jx=jy=0;jb.style.display='none'}if(e.pointerId===lid)lid=null};
pad.addEventListener('pointerup',up);pad.addEventListener('pointercancel',up);
function bind(id,dn,u){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();dn()});if(u){b.addEventListener('pointerup',u);b.addEventListener('pointerleave',u);b.addEventListener('pointercancel',u)}}
bind('sh',()=>shooting=1,()=>shooting=0);
bind('ai',()=>{aim^=1;$('ai').classList.toggle('on',aim)});
function reload(){const w=W[wi];if(rel<=0&&w.mag<w.cap&&w.res>0)rel=w.rl}
bind('rl',reload);bind('sw',()=>{wi=(wi+1)%W.length;rel=0});
addEventListener('keydown',e=>{if(e.key=='r')reload()});
// update
const v3=new T.Vector3();
function upd(dt){tm+=dt;
const f={x:Math.sin(yaw),z:Math.cos(yaw)},r={x:-f.z,z:f.x},sp=aim?3:5.5;
P.x+=(f.x*jy+r.x*jx)*sp*dt;P.z+=(f.z*jy+r.z*jx)*sp*dt;push(P,.4);
P.g.position.set(P.x,0,P.z);P.g.rotation.y=yaw;
const cp=Math.cos(pitch),dir={x:f.x*cp,y:Math.sin(pitch),z:f.z*cp},d=aim?2.8:4.2,tx=P.x+r.x*.7,tz=P.z+r.z*.7;
cam.position.set(tx-dir.x*d,Math.max(.5,1.6-dir.y*d),tz-dir.z*d);cam.lookAt(tx+dir.x*20,1.6+dir.y*20,tz+dir.z*20);
const tf=aim?45:65;if(Math.abs(fov-tf)>.5){fov+=(tf-fov)*Math.min(1,dt*12);cam.fov=fov;cam.updateProjectionMatrix()}
// weapon
const w=W[wi];
if(rel>0){rel-=dt;if(rel<=0){const n=Math.min(w.cap-w.mag,w.res);w.mag+=n;w.res-=n}}
else if(shooting&&tm>=nextS){if(w.mag>0){w.mag--;nextS=tm+w.rate;cam.getWorldDirection(v3);
shot({x:cam.position.x,y:cam.position.y,z:cam.position.z},v3,w,aim?w.sp*.4:w.sp,1,{x:P.x+f.x*.8+r.x*.4,y:1.15,z:P.z+f.z*.8+r.z*.4})}else reload()}
// zone
zone.t-=dt;
if(zone.st=='wait'){if(zone.t<=0&&zone.ph<5){zone.st='shrink';zone.t=20;zone.fx=zone.x;zone.fz=zone.z;zone.fr=zone.r;zone.tr=RAD[zone.ph+1];
const a=rnd(0,6.28),dd=Math.random()*(zone.fr-zone.tr)*.8;zone.tx=zone.x+Math.cos(a)*dd;zone.tz=zone.z+Math.sin(a)*dd}}
else{const k=1-Math.max(zone.t,0)/20;zone.x=zone.fx+(zone.tx-zone.fx)*k;zone.z=zone.fz+(zone.tz-zone.fz)*k;zone.r=zone.fr+(zone.tr-zone.fr)*k;
if(zone.t<=0){zone.st='wait';zone.t=20;zone.ph++}}
zm.position.set(zone.x,20,zone.z);zm.scale.set(zone.r,1,zone.r);
const zdmg=2+zone.ph;
outZ=Math.hypot(P.x-zone.x,P.z-zone.z)>zone.r;if(outZ)hurtP(zdmg*dt);
// enemies
for(const e of enemies){if(e.dead)continue;
const dx=P.x-e.x,dz=P.z-e.z,dist=Math.hypot(dx,dz);let los=dist<38;
if(los){const o={x:e.x,y:1.2,z:e.z},dd={x:dx/dist,y:0,z:dz/dist};for(const q of obs){if(rayS(o,dd,q.x,0,q.z,q.r,1)<dist){los=false;break}}}
let mx=0,mz=0,s=3;const zd=Math.hypot(e.x-zone.x,e.z-zone.z);
if(zd>zone.r-4){mx=zone.x-e.x;mz=zone.z-e.z;s=4.2;e.g.rotation.y=Math.atan2(mx,mz)}
else if(los){e.cd-=dt;if(dist>14){mx=dx;mz=dz}else if(dist<8){mx=-dx;mz=-dz}else{mx=-dz*e.s;mz=dx*e.s}
e.g.rotation.y=Math.atan2(dx,dz);
if(e.cd<=0&&dist<32){e.cd=rnd(.5,1.1);shot({x:e.x,y:1.3,z:e.z},new T.Vector3(dx,-.2,dz).normalize(),{pel:1,dmg:6},.06,0)}}
else{e.tt-=dt;if(e.tt<=0||Math.hypot(e.tx-e.x,e.tz-e.z)<2){const a=rnd(0,6.28),dd=rnd(0,zone.r*.7);e.tx=zone.x+Math.cos(a)*dd;e.tz=zone.z+Math.sin(a)*dd;e.tt=rnd(3,6)}
mx=e.tx-e.x;mz=e.tz-e.z;e.g.rotation.y=Math.atan2(mx,mz)}
const l=Math.hypot(mx,mz);if(l>.01){e.x+=mx/l*s*dt;e.z+=mz/l*s*dt;push(e,.4)}
e.g.position.set(e.x,0,e.z);
if(zd>zone.r){e.hp-=zdmg*dt;if(e.hp<=0){killE(e,0);continue}}
e.flash-=dt;e.g.userData.m.emissive.setHex(e.flash>0?0x777777:0)}
// pickups
for(let i=pk.length-1;i>=0;i--){const p=pk[i];p.rotation.y+=dt*2;
if(Math.hypot(p.position.x-P.x,p.position.z-P.z)<1.6){if(p.userData.t==0)W.forEach(w=>w.res+=w.cap*2);else P.hp=Math.min(100,P.hp+35);scene.remove(p);pk.splice(i,1)}}
for(const l of trs)if(l.visible){l.life-=dt;if(l.life<=0)l.visible=false}
// HUD
$('hpf').style.width=P.hp+'%';$('hpf').style.background=P.hp<30?'#ff4d4d':'#3ddc84';$('hpt').textContent='HP '+Math.ceil(P.hp);
$('info').textContent=`👥 ${alive()}   ☠ ${kills}   ★ ${kills*100+Math.floor(tm)}`;
$('zt').textContent=zone.st=='wait'?(zone.ph<5?`Zone shrinks in ${Math.ceil(zone.t)}s`:'Final zone'):'Zone shrinking!';
$('ammo').textContent=rel>0?`${w.n}  Reloading...`:`${w.n}  ${w.mag} / ${w.res}`;
dmgT=Math.max(0,dmgT-dt);$('dmg').style.opacity=dmgT*2;$('warn').style.opacity=outZ?.9:0}
let last=performance.now();
(function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;
if(state=='play')upd(dt);else{const a=n/6000;cam.position.set(Math.cos(a)*35,12,Math.sin(a)*35);cam.lookAt(0,1,0)}
ren.render(scene,cam)})(last);
