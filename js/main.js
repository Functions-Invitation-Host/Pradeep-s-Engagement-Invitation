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
})();
