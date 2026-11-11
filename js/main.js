(function(){
'use strict';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(i){return document.getElementById(i)};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

/* ---- botanical sprigs (SVG, drawn in code) ---- */
function rnd(s){return function(){s=(s*9301+49297)%233280;return s/233280}}
function sprig(seed){
  var r=rnd(seed*7+3),pts=[],i,t,x,y,s='<svg viewBox="0 0 120 260" preserveAspectRatio="xMidYMax meet" aria-hidden="true">',fills=['#b9cf96','#9aab88','#2b4a2e','#c3d3a3'],d='';
  for(i=0;i<=20;i++){t=i/20;x=20+78*t+20*Math.sin(t*5.2);y=258-252*t;pts.push([x,y]);d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}
  s+='<path class="st" pathLength="1" d="'+d+'"/>';
  for(i=2;i<=19;i++){
    var p=pts[i],side=i%2?1:-1,a=-90+side*(40+r()*25),sc=.7+r()*.7*(1-i/30);
    s+='<g transform="translate('+p[0].toFixed(1)+' '+p[1].toFixed(1)+') rotate('+a.toFixed(0)+') scale('+sc.toFixed(2)+')"><path class="lf" style="--i:'+i+'" fill="'+fills[i%4]+'" fill-opacity=".78" d="M0 0C8-9 22-9 34 0 22 9 8 9 0 0z"/></g>';
  }
  [6,11,16,19].forEach(function(k,j){
    var p=pts[k],g='';for(var n=0;n<5;n++)g+='<ellipse cx="0" cy="-6" rx="3.3" ry="6.2" transform="rotate('+n*72+')" fill="#fffaf0" stroke="#b99556" stroke-width=".5"/>';
    s+='<g transform="translate('+(p[0]+(j%2?6:-6)).toFixed(1)+' '+p[1].toFixed(1)+') scale('+(1.1-j*.1)+')"><g class="bl2" style="--i:'+(k+3)+'">'+g+'<circle r="2.2" fill="#b99556"/></g></g>';
  });
  return s+'</svg>';
}
document.querySelectorAll('.sprig').forEach(function(el,k){el.innerHTML=sprig(k+1)});

/* ---- split text ---- */
document.querySelectorAll('.split').forEach(function(el){
  var t=el.textContent.trim(),ws=t.split(' '),n=0;el.setAttribute('aria-label',t);el.textContent='';
  ws.forEach(function(w,k){
    var sp=document.createElement('span');sp.className='w';sp.setAttribute('aria-hidden','true');
    w.split('').forEach(function(c){var s=document.createElement('span');s.className='l';s.textContent=c;s.style.transitionDelay=(.3+n++*.08)+'s';sp.appendChild(s)});
    el.appendChild(sp);if(k<ws.length-1)el.appendChild(document.createTextNode(' '));n++;
  });
});
/* ---- word-by-word reveal ---- */
document.querySelectorAll('.words').forEach(function(p){
  var n=0;(function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(c){
      if(c.nodeType===3){
        var f=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(w){
          if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}
          var s=document.createElement('span');s.className='wd';s.style.setProperty('--i',n++);s.textContent=w;f.appendChild(s);
        });c.parentNode.replaceChild(f,c);
      }else walk(c);
    });
  })(p);
});

/* ---- reveal on view ---- */
var els=document.querySelectorAll('.rv,.sprig,.split,.words');
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.01,rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(el){io.observe(el)});
}else els.forEach(function(el){el.classList.add('in')});

/* ---- gate + music ---- */
var gate=$('gate'),env=$('env'),opened=false,au=$('audio'),pl=document.querySelector('.player'),pp=$('pp'),mu=$('mute'),fade,playing=false;
function ramp(to,ms,done){
  clearInterval(fade);var from=au.volume,st=Date.now();
  fade=setInterval(function(){var k=clamp((Date.now()-st)/ms,0,1);au.volume=clamp(from+(to-from)*k,0,1);if(k>=1){clearInterval(fade);done&&done()}},40);
}
function ui(){pp.setAttribute('aria-pressed',playing);pp.setAttribute('aria-label',playing?'Pause music':'Play music');pl.classList.toggle('on',playing&&!au.muted)}
function play(){
  au.volume=0;au.load();var p=au.play();
  var ok=function(){playing=true;ui();ramp(.55,2600)};
  var no=function(){playing=false;ui();pp.title='Music file not found. See README.'};
  if(p&&p.then)p.then(ok).catch(no);else ok();
}
pp.addEventListener('click',function(){
  if(!playing&&au.paused)play();
  else if(playing){playing=false;ui();ramp(0,1200,function(){au.pause()})}
});
mu.addEventListener('click',function(){au.muted=!au.muted;mu.setAttribute('aria-pressed',au.muted);mu.setAttribute('aria-label',au.muted?'Unmute music':'Mute music');ui()});
au.addEventListener('error',function(){playing=false;ui();pp.title='Music file not found. See README.'});
function enter(){
  if(opened)return;opened=true;gate.classList.add('gone');document.body.classList.remove('locked');window.scrollTo(0,0);
  setTimeout(function(){document.body.classList.add('shown');gate.style.display='none';petals(26)},reduce?0:800);
}
function openWith(music){
  if(opened||env.classList.contains('open'))return;
  if(music)play();
  $('openBtn').disabled=true;
  if(reduce){enter();return}
  env.classList.add('open');setTimeout(enter,1700);
}
$('openBtn').addEventListener('click',function(){openWith(true)});
$('quietBtn').addEventListener('click',function(){openWith(false)});

/* ---- scroll-linked effects ---- */
var stack=$('stack'),px=document.querySelectorAll('[data-px]'),prog=document.querySelectorAll('[data-prog]'),tick=false;
if(reduce)document.body.classList.add('flat');
function frame(){
  tick=false;var vh=innerHeight;
  if(!reduce){
    var r=stack.getBoundingClientRect(),p=clamp(-r.top/(r.height-vh),0,1),q=clamp((p-.22)/.42,0,1);
    stack.style.setProperty('--p',p.toFixed(3));stack.style.setProperty('--q',q.toFixed(3));stack.style.setProperty('--c2',clamp((p-.72)/.18,0,1).toFixed(3));
    px.forEach(function(el){var b=el.getBoundingClientRect();el.style.setProperty('--py',((b.top+b.height/2-vh/2)*parseFloat(el.dataset.px)).toFixed(1))});
    prog.forEach(function(el){var b=el.getBoundingClientRect();el.style.setProperty('--pp',clamp((vh*.85-b.top)/(b.height*.9),0,1).toFixed(3))});
  }
}
function req(){if(!tick){tick=true;requestAnimationFrame(frame)}}
addEventListener('scroll',req,{passive:true});addEventListener('resize',req);frame();
if(matchMedia('(pointer:fine)').matches&&!reduce){
  var duo=document.querySelector('.duo');
  duo.addEventListener('mousemove',function(e){var b=duo.getBoundingClientRect();duo.style.setProperty('--ry',((e.clientX-b.left)/b.width-.5)*8+'deg');duo.style.setProperty('--rx',(.5-(e.clientY-b.top)/b.height)*6+'deg')});
  duo.addEventListener('mouseleave',function(){duo.style.setProperty('--ry','0deg');duo.style.setProperty('--rx','0deg')});
}

/* ---- countdown: 16 Nov 2026, 11:00 AM IST ---- */
var START=Date.parse('2026-11-16T11:00:00+05:30'),END=Date.parse('2026-11-16T12:00:00+05:30');
var cd=$('cd'),msg=$('cd-msg'),f={d:$('cd-d'),h:$('cd-h'),m:$('cd-m'),s:$('cd-s')},timer;
function pad(n){return n<10?'0'+n:''+n}
function cdTick(){
  var now=Date.now(),diff=START-now;
  if(diff>0){var s=Math.floor(diff/1000);f.d.textContent=Math.floor(s/86400);f.h.textContent=pad(Math.floor(s%86400/3600));f.m.textContent=pad(Math.floor(s%3600/60));f.s.textContent=pad(s%60);cd.hidden=false;msg.textContent=''}
  else if(now<END){cd.hidden=true;msg.textContent='The engagement ceremony is happening now. Thank you for your blessings.'}
  else{cd.hidden=true;msg.textContent='Thank you for celebrating with us. A day of blessings and beautiful memories.';clearInterval(timer)}
}
timer=setInterval(cdTick,1000);cdTick();

/* ---- drifting petals ---- */
var cv=$('dust'),cx=cv.getContext('2d'),W,H,pts=[],run=!reduce,cols=['#c3d3a3','#9fb77c','#e6d3a3','#f3ecd9'];
function size(){var r=Math.min(devicePixelRatio||1,2);W=cv.width=innerWidth*r;H=cv.height=innerHeight*r}
function mk(i,top){var k=W/innerWidth;return{x:Math.random()*W,y:top?-Math.random()*H*.5:Math.random()*H,r:(1.6+Math.random()*1.8)*k,v:(.35+Math.random()*.6)*k*(top?1.8:1),p:Math.random()*6.3,a:Math.random()*6.3,c:cols[i%4],tmp:top}}
function init(){size();pts=[];var n=innerWidth<600?14:24;for(var i=0;i<n;i++)pts.push(mk(i))}
function petals(n){if(reduce)return;for(var i=0;i<n;i++)pts.push(mk(i,true))}
function draw(t){
  if(!run)return;cx.clearRect(0,0,W,H);
  pts.forEach(function(p){
    p.y+=p.v;p.x+=Math.sin(t/1100+p.p)*.6;p.a+=.01;
    cx.globalAlpha=.75;cx.fillStyle=p.c;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.scale(1,.55+.45*Math.abs(Math.sin(p.a*1.6)));
    cx.beginPath();cx.ellipse(0,0,p.r*2.6,p.r*1.4,0,0,6.3);cx.fill();cx.restore();
    if(p.y>H+20){if(p.tmp)p.dead=1;else{p.y=-20;p.x=Math.random()*W}}
  });
  pts=pts.filter(function(p){return!p.dead});requestAnimationFrame(draw);
}
init();if(run)requestAnimationFrame(draw);addEventListener('resize',init);
document.addEventListener('visibilitychange',function(){if(reduce)return;var was=run;run=!document.hidden;if(run&&!was)requestAnimationFrame(draw)});
var fin=document.querySelector('.final');
if(fin&&'IntersectionObserver' in window){var fo=new IntersectionObserver(function(es){if(es[0].isIntersecting){petals(24);fo.disconnect()}},{threshold:.4});fo.observe(fin)}
/* ---- touch + swipe petals (collect at the bottom of the screen) ---- */
(function(){
  if(reduce)return;
  var cv=$('touchfx');if(!cv)return;
  var ctx=cv.getContext('2d'),pile=document.createElement('canvas'),pc=pile.getContext('2d');
  var W=0,H=0,R=1,live=[],settled=[],cols=[],CW=6,MAXH=56,MAXLIVE=170,MAXSET=320,running=false,last=0;
  /* theme colours: pista, sage, bottle green, champagne gold, cream */
  var PET=['#c3d3a3','#9fb77c','#e6d3a3','#d9bf84','#f3ecd9','#b9cf96'];
  var LEAF=['#9aab88','#2b4a2e','#b9cf96','#9fb77c'];
  var HEART=['#b99556','#d9bf84','#9fb77c','#2b4a2e'];
  var pick=function(a){return a[Math.floor(Math.random()*a.length)]};
  function size(){
    R=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
    cv.width=pile.width=Math.round(W*R);cv.height=pile.height=Math.round(H*R);
    rebuild();
  }
  function shape(c,p,flat){
    var s=p.r;
    c.fillStyle=p.c;c.strokeStyle='rgba(185,149,86,.65)';c.lineWidth=.8;
    c.beginPath();
    if(p.k===0){c.ellipse(0,0,s*2.4,s*1.3,0,0,6.3);c.fill();if(p.c==='#f3ecd9')c.stroke()}
    else if(p.k===1){c.moveTo(-s*2.4,0);c.bezierCurveTo(-s,-s*1.7,s*1.2,-s*1.5,s*2.6,0);c.bezierCurveTo(s*1.2,s*1.5,-s,s*1.7,-s*2.4,0);c.fill();
      c.strokeStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(-s*2,0);c.lineTo(s*2.2,0);c.stroke()}
    else if(p.k===2){var h=s*1.5;c.moveTo(0,h*.9);c.bezierCurveTo(-h*1.5,-h*.2,-h*.8,-h*1.3,0,-h*.5);c.bezierCurveTo(h*.8,-h*1.3,h*1.5,-h*.2,0,h*.9);c.fill()}
    else{ /* tiny blossom, like the sprigs */
      for(var n=0;n<5;n++){c.save();c.rotate(n*1.2566);c.beginPath();c.ellipse(0,-s*1.3,s*.8,s*1.5,0,0,6.3);c.fillStyle='#fffaf0';c.fill();c.stroke();c.restore()}
      c.beginPath();c.arc(0,0,s*.55,0,6.3);c.fillStyle='#b99556';c.fill();
    }
  }
  function drawSettled(p){
    pc.save();pc.setTransform(R,0,0,R,0,0);pc.globalAlpha=.9;pc.translate(p.x,H-p.yb);pc.rotate(p.a);pc.scale(1,.5);
    shape(pc,p,true);pc.restore();
  }
  function rebuild(){
    var n=Math.ceil(W/CW)+4,i;cols=new Array(n);for(i=0;i<n;i++)cols[i]=0;
    pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,pile.width,pile.height);
    settled.forEach(function(p){p.x=Math.min(p.x,W-4);bump(p);drawSettled(p)});
  }
  function bump(p){
    var c=Math.floor(p.x/CW),w=[.35,.7,1,.7,.35],i;
    for(i=-2;i<=2;i++){var j=c+i;if(j>=0&&j<cols.length)cols[j]=Math.min(MAXH,cols[j]+p.dh*w[i+2])}
  }
  function floorAt(x){
    var c=Math.floor(x/CW),m=0,i;
    for(i=-1;i<=1;i++){var j=c+i;if(j>=0&&j<cols.length&&cols[j]>m)m=cols[j]}
    return m;
  }
  function settle(p){
    var fl=floorAt(p.x);
    var s={x:p.x,yb:fl+p.r*.3+Math.random()*2,a:p.a,r:p.r,k:p.k,c:p.c,dh:p.r*.32};
    bump(s);settled.push(s);drawSettled(s);
    if(settled.length>MAXSET){settled.splice(0,70);rebuild()}
  }
  function spawn(x,y,vx,vy,k){
    if(live.length>=MAXLIVE)return;
    k=k===undefined?(function(){var q=Math.random();return q<.52?0:q<.76?1:q<.94?2:3})():k;
    var r=(k===2?1.6:k===3?2.1:1.7)+Math.random()*1.8;
    live.push({x:x,y:y,vx:vx,vy:vy,r:r,k:k,c:k===0?pick(PET):k===1?pick(LEAF):k===2?pick(HEART):'#fffaf0',
      a:Math.random()*6.3,w:(Math.random()-.5)*5,ph:Math.random()*6.3,fq:1.4+Math.random()*1.8,
      vt:42+Math.random()*48,t:0});
  }
  function burst(x,y){
    var n=W<600?15:20,i;
    for(i=0;i<n;i++){var ang=Math.random()*6.283,sp=70+Math.random()*190;spawn(x,y,Math.cos(ang)*sp,Math.sin(ang)*sp-60)}
    go();
  }
  var lx=null,ly=null,acc=0;
  function trail(x,y,gap){
    if(lx===null){lx=x;ly=y;return}
    var dx=x-lx,dy=y-ly,d=Math.sqrt(dx*dx+dy*dy);lx=x;ly=y;acc+=d;
    while(acc>=gap){
      acc-=gap;var n=1+(Math.random()<.4?1:0);
      for(var i=0;i<n;i++)spawn(x+(Math.random()-.5)*14,y+(Math.random()-.5)*14,-dx*3+(Math.random()-.5)*120,-dy*3-Math.random()*70+(Math.random()-.5)*60);
    }
    go();
  }
  function step(t){
    var dt=last?Math.min((t-last)/1000,.05):.016;last=t;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(pile,0,0);
    ctx.setTransform(R,0,0,R,0,0);
    var keep=[];
    live.forEach(function(p){
      p.t+=dt;
      /* burst momentum fades quickly, then a gentle fluttering fall */
      var drag=Math.pow(.04,dt);p.vx*=drag;p.vy=p.vy*drag+p.vt*(1-drag);
      p.x+=(p.vx+Math.sin(p.t*p.fq+p.ph)*26)*dt;p.y+=p.vy*dt;p.a+=p.w*dt*(p.vy>p.vt*1.5?1.6:.7);
      if(p.x<4){p.x=4;p.vx=Math.abs(p.vx)}else if(p.x>W-4){p.x=W-4;p.vx=-Math.abs(p.vx)}
      if(p.y>=H-floorAt(p.x)-p.r*.6){settle(p);return}
      ctx.save();ctx.globalAlpha=.9;ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.scale(1,.5+.5*Math.abs(Math.sin(p.a*1.5+p.ph)));
      shape(ctx,p);ctx.restore();keep.push(p);
    });
    live=keep;
    if(live.length)requestAnimationFrame(step);else{running=false;last=0;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(pile,0,0)}
  }
  function go(){if(!running&&!document.hidden){running=true;last=0;requestAnimationFrame(step)}}

  /* input: touch (tap = burst, swipe = trail) and mouse (click = burst, move/drag = trail) */
  var lastTouch=0;
  addEventListener('touchstart',function(e){
    lastTouch=Date.now();lx=ly=null;acc=0;
    for(var i=0;i<e.changedTouches.length;i++)burst(e.changedTouches[i].clientX,e.changedTouches[i].clientY);
  },{passive:true});
  addEventListener('touchmove',function(e){
    lastTouch=Date.now();var t=e.touches[0];if(t)trail(t.clientX,t.clientY,16);
  },{passive:true});
  addEventListener('touchend',function(){lastTouch=Date.now();lx=ly=null;acc=0},{passive:true});
  addEventListener('touchcancel',function(){lx=ly=null;acc=0},{passive:true});
  var down=false;
  addEventListener('mousedown',function(e){if(Date.now()-lastTouch<800)return;down=true;lx=ly=null;acc=0;burst(e.clientX,e.clientY)});
  addEventListener('mouseup',function(){down=false});
  addEventListener('mousemove',function(e){if(Date.now()-lastTouch<800)return;trail(e.clientX,e.clientY,down?16:46)});
  document.addEventListener('mouseleave',function(){lx=ly=null});
  addEventListener('resize',function(){size();go()});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&live.length)go()});
  size();
})();
})();
