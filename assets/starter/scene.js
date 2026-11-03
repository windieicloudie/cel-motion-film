'use strict';
const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
const CFG=window.FILM_CONFIG;
const W=1920,H=1080,P=CFG.palette;
let F=0,V=0,T=0,CUES;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t)}, out=t=>1-Math.pow(1-clamp(t),3);
const rand=n=>{const z=Math.sin(n*127.1+311.7)*43758.5453;return z-Math.floor(z)};
const noise=(i,k=0)=>(rand(i*13.37+k*79.19+V*17.41)-.5)*2;
const cue=n=>CUES.beats.find(x=>x.name===n).frame/24;
function save(x,y,r=0,sx=1,sy=sx){ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.scale(sx,sy)}
function smooth(points,closed=true,steps=8){let a=[],n=points.length;for(let i=0;i<(closed?n:n-1);i++){let p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n];if(!closed){p0=points[Math.max(0,i-1)];p3=points[Math.min(n-1,i+2)]}for(let j=0;j<steps;j++){let t=j/steps,t2=t*t,t3=t2*t;a.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}if(!closed)a.push(points[n-1]);return a}
function path(a){ctx.beginPath();a.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p))}
// Pressure-modulated centreline, expanded into an actual brush outline polygon.
function brush(a,width=7,color=P.ink,id=1,closed=false){if(a.length<2)return;let left=[],right=[];for(let i=0;i<a.length;i++){let prev=a[Math.max(0,i-1)],next=a[Math.min(a.length-1,i+1)],dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;let pressure=.88+.15*Math.sin(i*.23+id)+.08*noise(Math.floor(i/7),id);if(!closed)pressure*=.65+.35*Math.sin(Math.PI*i/(a.length-1));let w=width*.5*pressure;left.push([a[i][0]-dy/len*w,a[i][1]+dx/len*w]);right.push([a[i][0]+dy/len*w,a[i][1]-dx/len*w])}path(left.concat(right.reverse()));ctx.closePath();ctx.fillStyle=color;ctx.fill()}
function line(points,width=7,color=P.ink,id=0,curved=true){let p=points.map((p,i)=>[p[0]+noise(i,id)*1.3,p[1]+noise(i+50,id)*1.3]);let a=curved?smooth(p,false):p.flatMap((q,i)=>i===p.length-1?[q]:Array.from({length:12},(_,j)=>[mix(q[0],p[i+1][0],j/12),mix(q[1],p[i+1][1],j/12)]));brush(a,width,color,id)}
function shape(points,fill=P.red,width=7,id=1,curved=true,jitter=2){let p=points.map((p,i)=>[p[0]+noise(i,id)*jitter,p[1]+noise(i+80,id)*jitter]);let a=curved?smooth(p):p;path(a);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(width){let b=a.map(p=>[p[0]-2.1,p[1]+1.1]);b.push(b[0]);brush(b,width,P.ink,id,true)}}
function ellipse(x,y,rx,ry,fill=P.yellow,w=6,id=0){let a=Array.from({length:16},(_,i)=>{let ang=i/16*Math.PI*2;return[x+Math.cos(ang)*rx,y+Math.sin(ang)*ry]});shape(a,fill,w,id)}
function star(x,y,r,rot=0,color=P.yellow,id=0){save(x,y,rot);shape([[0,-r],[r*.21,-r*.22],[r,0],[r*.22,r*.2],[0,r],[-r*.2,r*.24],[-r,0],[-r*.2,-r*.2]],color,4,id,false,1.4);ctx.restore()}
const glyph={A:[[[0,1],[.48,0],[1,1]],[[.2,.63],[.78,.63]]],B:[[[0,1],[0,0],[.62,0],[.92,.18],[.68,.47],[0,.47]],[[.6,.47],[1,.7],[.76,1],[0,1]]],C:[[[1,.12],[.69,0],[.15,.12],[0,.5],[.13,.88],[.7,1],[1,.86]]],D:[[[0,1],[0,0],[.55,0],[.95,.2],[1,.66],[.73,.95],[0,1]]],E:[[[1,0],[0,0],[0,1],[1,1]],[[0,.48],[.8,.48]]],F:[[[0,1],[0,0],[1,0]],[[0,.48],[.8,.48]]],G:[[[1,.15],[.66,0],[.16,.13],[0,.55],[.21,.95],[.79,1],[1,.78],[1,.55],[.57,.55]]],H:[[[0,0],[0,1]],[[1,0],[1,1]],[[0,.49],[1,.49]]],I:[[[.1,0],[.9,0]],[[.5,0],[.5,1]],[[.1,1],[.9,1]]],J:[[[1,0],[1,.78],[.7,1],[.2,.96],[0,.73]]],K:[[[0,0],[0,1]],[[1,0],[0,.52],[1,1]]],L:[[[0,0],[0,1],[1,1]]],M:[[[0,1],[0,0],[.52,.56],[1,0],[1,1]]],N:[[[0,1],[0,0],[1,1],[1,0]]],O:[[[.5,0],[.1,.12],[0,.52],[.15,.93],[.6,1],[.95,.8],[1,.33],[.78,.04],[.5,0]]],P:[[[0,1],[0,0],[.72,0],[1,.22],[.85,.48],[0,.49]]],Q:[[[.5,0],[.1,.12],[0,.52],[.15,.93],[.6,1],[.95,.8],[1,.33],[.78,.04],[.5,0]],[[.62,.72],[1.1,1.08]]],R:[[[0,1],[0,0],[.72,0],[1,.22],[.85,.48],[0,.49]],[[.5,.49],[1,1]]],S:[[[1,.1],[.6,0],[.1,.1],[0,.34],[.32,.48],[.82,.55],[1,.77],[.8,.97],[.29,1],[0,.9]]],T:[[[0,0],[1,0]],[[.5,0],[.5,1]]],U:[[[0,0],[0,.76],[.23,.98],[.7,1],[1,.77],[1,0]]],V:[[[0,0],[.5,1],[1,0]]],W:[[[0,0],[.18,1],[.5,.45],[.8,1],[1,0]]],X:[[[0,0],[1,1]],[[1,0],[0,1]]],Y:[[[0,0],[.5,.5],[1,0]],[[.5,.5],[.5,1]]],Z:[[[0,0],[1,0],[0,1],[1,1]]],'.':[[[.5,.95],[.51,1]]],'-':[[[.15,.5],[.85,.5]]],'0':[[[.5,0],[.1,.15],[.1,.85],[.5,1],[.9,.85],[.9,.15],[.5,0]]],'1':[[[.2,.2],[.5,0],[.5,1]]],'2':[[[0,.2],[.3,0],[.8,.04],[1,.3],[0,1],[1,1]]],'4':[[[.75,1],[.75,0],[0,.65],[1,.65]]],'/':[[[0,1],[1,0]]]};
glyph[',']=[[[.55,.9],[.35,1.15]]];glyph['!']=[[[.5,0],[.5,.7]],[[.5,.94],[.5,1]]];glyph["'"]=[[[.55,0],[.4,.2]]];

function text(s,x,y,h=25,color=P.ink,spacing=.22,thick=.09){let w=h*.58,advance=w+h*spacing;save(x,y);for(let i=0;i<s.length;i++){let g=glyph[s[i]];if(!g&&s[i]!==' ')throw new Error('Missing hand-lettered glyph: '+s[i]);if(g){for(let j=0;j<g.length;j++){let a=g[j].map(p=>[p[0]*w+i*advance,p[1]*h]);line(a,h*thick,color,300+i*7+j,false)}}}ctx.restore();return s.length*advance}
function centerText(s,x,y,h=25,col=P.ink,spacing=.22){let wid=s.length*h*(.58+spacing)-h*spacing;text(s,x-wid/2,y,h,col,spacing)}
const paper=document.createElement('canvas');paper.width=W;paper.height=H;const pg=paper.getContext('2d');pg.fillStyle=P.paper;pg.fillRect(0,0,W,H);let paperRGB=P.paper.match(/[a-fA-F0-9]{2}/g).map(x=>parseInt(x,16));let im=pg.getImageData(0,0,W,H);for(let i=0;i<W*H;i++){let n=(rand(i+100)-.5)*17;im.data[i*4]=paperRGB[0]+n;im.data[i*4+1]=paperRGB[1]+n;im.data[i*4+2]=paperRGB[2]+n;}pg.putImageData(im,0,0);pg.globalAlpha=.12;for(let i=0;i<11000;i++){let x=rand(i*4)*W,y=rand(i*4+1)*H;pg.strokeStyle=i%2?'#604c2f':'#fff7e0';pg.lineWidth=.5+rand(i)*.8;pg.beginPath();pg.moveTo(x,y);pg.lineTo(x+rand(i*4+2)*6,y+rand(i*4+3)*2);pg.stroke()}pg.globalAlpha=1;
function ground(x,y,w=210){for(let i=0;i<7;i++)line([[x-w*.5+i*19,y+i*3],[x+w*.5-i*17,y+i*3-1]],1.4,P.ink,600+i,false)}
function match(x,y,ang,s=1,burn=0){save(x,y,ang,s);shape([[-10,0],[10,-3],[13,280],[-9,282]],P.yellow,5,100,false);line([[-1,32],[2,250]],2,P.red,102);ellipse(0,0,20,31,burn?P.ink:P.red,5,101);ctx.restore()}
function matchbox(x,y,angle=0,s=1){save(x,y,angle,s);shape([[-215,-139],[201,-144],[224,128],[-200,146]],P.paper,6,110,false);shape([[201,-144],[248,-170],[267,98],[224,128]],P.yellow,5,111,false);for(let i=0;i<19;i++)line([[220,-125+i*12],[250,-140+i*12]],2,P.ink,112+i,false);shape([[-196,-120],[183,-122],[201,112],[-181,126]],P.red,4,140,false);ellipse(0,-9,103,84,P.yellow,4,141);star(0,-17,55,-.08,P.paper,142);centerText(CFG.brand[0],0,-105,19,P.paper,.18);centerText(CFG.brand[1],0,80,28,P.paper,.24);line([[-154,-70],[-151,55]],2,P.paper,143);line([[156,-80],[163,53]],2,P.paper,144);ctx.restore()}
function puff(x,y,r,progress=0,id=0){save(x,y,progress*.25);let a=[];for(let i=0;i<48;i++){let ang=i/48*Math.PI*2,rr=r*(.88+.12*Math.cos(ang*7));a.push([Math.cos(ang)*rr,Math.sin(ang)*rr*.85])}shape(a,P.paper,5,id,false,1.2);line([[-r*.4,r*.1],[-r*.3,-r*.24],[r*.04,-r*.3],[r*.25,-r*.12],[r*.17,r*.08]],3,P.ink,id+1);ctx.restore()}
function flame(x,y,s=1,pose=0,rot=0,stretch=1,expression='smile'){
 save(x,y,rot,s/Math.sqrt(stretch),s*stretch);
 // dangling hand-drawn limbs, layered behind the colour silhouette
 const swing=Math.sin(pose)*35;
 line([[-81,10],[-134,-6+swing],[-162,-53+swing]],8,P.ink,201);ellipse(-163,-57+swing,12,11,P.paper,4,202);
 line([[83,10],[130,-10-swing],[157,-60-swing]],8,P.ink,203);ellipse(157,-63-swing,12,11,P.paper,4,204);
 line([[-41,88],[-50,125],[-79-swing*.3,131]],9,P.ink,205);line([[36,89],[47,125],[80+swing*.3,125]],9,P.ink,206);
 shape([[0,-177],[18,-115],[58,-84],[76,-125],[93,-61],[109,1],[89,65],[44,100],[-23,102],[-78,80],[-109,30],[-103,-27],[-69,-70],[-61,-119],[-35,-87]],P.red,8,210);
 shape([[-15,-101],[18,-52],[26,-17],[54,-47],[69,8],[48,63],[4,83],[-49,61],[-69,21],[-49,-31],[-33,-10]],P.yellow,0,211);
 // eye shapes with blink holds, avoiding emoji or stock character styling
 if(expression==='squeeze'){line([[-48,-9],[-30,0],[-49,9]],6,P.ink,212,false);line([[43,-9],[25,0],[43,9]],6,P.ink,213,false)}
 else {ellipse(-35,0,6,12,P.ink,0,212);ellipse(33,-3,6,12,P.ink,0,213)}
 if(expression==='o')ellipse(0,33,12,17,P.ink,0,214);else {shape([[-24,24],[0,33],[29,21],[17,52],[-5,56]],P.ink,0,215);line([[-6,46],[11,45]],5,P.paper,216)}
 line([[-64,20],[-53,23]],5,P.red,217);line([[53,18],[65,16]],5,P.red,218);
 ctx.restore();
}
function radial(x,y,progress,strength=1){for(let i=0;i<18;i++){let a=i/18*Math.PI*2+.07, r=120+progress*180+rand(i)*65, len=(30+rand(i+10)*85)*strength;let ux=Math.cos(a),uy=Math.sin(a);line([[x+ux*r,y+uy*r*.72],[x+ux*(r+len),y+uy*(r+len)*.72]],4+rand(i+20)*4,i%3===0?P.red:P.ink,400+i,false)}}
function corners(){text(CFG.header,116,82,23,P.ink,.23);text(CFG.subheader,1410,84,17,P.ink,.18);line([[116,123],[1804,123]],1.6,P.ink,501,false);line([[116,957],[1804,957]],1.6,P.ink,502,false);text(CFG.footerLeft,116,986,18,P.ink,.18);text(CFG.footerRight,1530,986,17,P.ink,.18)}
function sparkBurst(t,x,y,count=15,maxr=200){if(t<0||t>1)return;for(let i=0;i<count;i++){let a=rand(i+300)*Math.PI*2,r=out(t)*maxr*(.5+rand(i+301)*.5),z=Math.sin(Math.PI*t)*(10+rand(i)*16);if(i%3===0)star(x+Math.cos(a)*r,y+Math.sin(a)*r,z,a,P.yellow,700+i);else line([[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a)*(r+z),y+Math.sin(a)*(r+z)]],4,i%2?P.red:P.ink,700+i,false)}}
function hero(t){let u=clamp((t-cue('launch'))/(cue('hero')-cue('launch')));let decay=clamp((t-cue('hero'))/.9);let reform=ease((t-6.75)/(cue('reform')-6.75));let cx=mix(960,970,reform),cy=mix(505,523,reform);
 // Irregular red/yellow corona: drawn cels rather than a digital glow.
 let radius=mix(40,325,out(u))*(1-.2*ease(decay));radius=mix(radius,280,reform);let a=[];for(let i=0;i<40;i++){let ang=i/40*Math.PI*2;let r=radius*mix(i%2?.73:1,1,reform)*(1+noise(i,800)*.025);a.push([cx+Math.cos(ang)*r*1.32,cy+Math.sin(ang)*r])}shape(a,P.yellow,6,800,false);
 let b=[];for(let i=0;i<32;i++){let ang=i/32*Math.PI*2;let r=radius*(i%2?.48:.68)*(1-reform);b.push([cx+Math.cos(ang)*r*1.25,cy+Math.sin(ang)*r])}shape(b,P.red,0,801,false);
 for(let i=0;i<9;i++){let ang=i/9*Math.PI*2-.15;let rr=radius*(1.17+.09*Math.sin(i));puff(cx+Math.cos(ang)*rr*1.32,cy+Math.sin(ang)*rr*.83,30+45*u,u,820+i*2)}
 for(let k=0;k<8;k++){if(reform>.1){let an=k/8*Math.PI*2;let rr=out(reform)*250;line([[cx+Math.cos(an)*rr,cy+Math.sin(an)*rr],[cx+Math.cos(an)*(rr+45),cy+Math.sin(an)*(rr+45)]],13,P.red,880+k,false)}}
 radial(cx,cy,u,Math.sin(Math.PI*clamp(u*.6+.1)));
 flame(cx,cy+30,mix(.3,1.42,out(u))*(1-reform*.96),t*8,-.12+Math.sin(t*7)*.06,1,'smile');
 for(let i=0;i<8;i++){let an=i/8*Math.PI*2+.2;star(cx+Math.cos(an)*(530+30*Math.sin(i)),cy+Math.sin(an)*315,18+rand(i)*16,an,P.red,850+i)}
 if(t>6.1&&reform<.65){save(210,440,-.2);text(CFG.heroLeft[0],0,0,55,P.ink,.15,.1);text(CFG.heroLeft[1],-10,82,55,P.ink,.15,.1);ctx.restore();save(1545,430,.14);text(CFG.heroRight[0],0,0,39,P.ink,.13,.09);text(CFG.heroRight[1],-23,63,39,P.ink,.13,.09);ctx.restore()}
}
const titleLetters=CFG.title.flatMap((row,ri)=>{
 const scale=Math.min(1,4/row.length),advance=190*scale,total=(row.length-1)*advance+134*scale;
 return [...row].map((ch,i)=>[ch,960-total/2+i*advance,ri?558:280,(rand(ri*10+i)-.5)*.12,scale]);
});
function chunkyLetter(ch,x,y,rot,scale=1,id=0){save(x,y,rot,scale);let g=glyph[ch],h=191,w=134;
 for(let pass=0;pass<3;pass++){let col=[P.ink,P.red,P.paper][pass],ww=[64,51,0][pass];if(!ww)continue;let off=pass===0?[-2,5]:[3,-1];for(let j=0;j<g.length;j++){let pts=g[j].map(p=>[p[0]*w+off[0],p[1]*h+off[1]]);line(pts,ww,col,950+id*10+j,false)}}
 // imperfect hand-coloured highlights, deliberately off register
 if(ch==='H'||ch==='N'||ch==='M'||ch==='D')line([[5,25],[5,75]],3,P.yellow,990+id,false);
 ctx.restore()}
function endScene(t){let a=out((t-cue('reform'))/.8);
 // Abstract firework remnants become a quiet sun-disc behind the hand lettering.
 save(970,523);let r=350*mix(.8,1,a);let pts=[];for(let i=0;i<36;i++){let ang=i/36*Math.PI*2;pts.push([Math.cos(ang)*r*1.31,Math.sin(ang)*r*(1+.025*Math.sin(i*2))])}shape(pts,P.yellow,0,900);ctx.restore();
 for(let i=0;i<titleLetters.length;i++){let [ch,x,y,r,letterScale]=titleLetters[i],at=cue('letter'+(i+1)),p=out((t-at+.333333)/.333333);if(p<=0)continue;let ang=i/8*Math.PI*2;let xx=mix(960+Math.cos(ang)*540,x,p),yy=mix(510+Math.sin(ang)*330,y,p);let bounce=Math.sin(clamp((t-at+.333333)/.333333)*Math.PI)*.13;chunkyLetter(ch,xx,yy,r+(1-p)*(i%2?1:-1),(mix(.12,1,p)+bounce)*letterScale,i);if(p<.95)sparkBurst(p,xx+50,yy+80,5,80)}
 // The matchbox and spirit return as a tiny signature at either side.
 let q=out((t-8.0)/.85);save(351,753,.08,q);matchbox(0,0,-.17,.53);match(87,-80,.4,.45,1);flame(103,-125,.30,t*5,.12,1);ctx.restore();
 save(1558,590,-.12,q);star(0,-35,49,.15,P.red,920);text(CFG.endNote[0],-62,57,30,P.ink,.13);text(CFG.endNote[1],-22,102,26,P.ink,.13);text(CFG.endNote[2],-89,146,27,P.ink,.13);line([[-63,195],[10,207],[77,188]],4,P.ink,921);ctx.restore();
 if(t>8.35){let aa=clamp((t-8.35)/.4);ctx.globalAlpha=aa;centerText(CFG.tagline,967,837,27,P.ink,.19);ctx.globalAlpha=1}
 for(let i=0;i<6;i++){let an=i/6*Math.PI*2+.2,x=960+Math.cos(an)*510,y=510+Math.sin(an)*320;star(x,y,12+(i%2)*7,an,P.red,930+i)}
}
function render(t){T=t;F=Math.min(239,Math.floor(t*24+1e-5));let cel=F>=216?3:2;V=Math.floor(F/cel)%4;let qt=Math.floor(F/cel)*cel/24;
 ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(paper,0,0);corners();
 if(t<cue('birth')){
 let p=clamp((t-.05)/.47),x=mix(850,1040,ease(p)),y=mix(405,530,ease(p));
 matchbox(790,675,-.14,1.21);ground(838,883,585);
 save(1260,325,.1);text(CFG.opening[0],0,0,44,P.ink,.12);text(CFG.opening[1],-3,65,44,P.ink,.12);text(CFG.opening[2],-10,130,44,P.red,.12);ctx.restore();
 line([[1230,512],[1175,541],[1130,543]],4,P.ink,1001);line([[1140,528],[1128,543],[1147,548]],4,P.ink,1002,false);
 if(F===12){shape([[850,353],[899,325],[1127,556],[1095,578]],P.red,5,1003,false);line([[827,365],[1042,574]],8,P.yellow,1004,false)}
 else match(x,y,-.82+.22*p,1.15,t>=cue('strike'));
 if(t>=cue('strike')){sparkBurst((t-cue('strike'))/.73,1040,530,23,250);let fs=out((t-cue('strike'))/.6)*.46;flame(1040,497,fs,t*7,.12,1.2,'o')}
 }
 else if(t<cue('launch')){
 let enter=out((t-cue('birth'))/.75);let bx=mix(790,378,enter),by=mix(675,776,enter);matchbox(bx,by,-.16,mix(1.21,.62,enter));match(bx+130,by-100,.52,.7,1);ground(bx,by+110,300);
 let x,y,s,stretch=1,rot=0,exp='smile';
 if(t<cue('land')){let p=(qt-cue('birth'))/(cue('land')-cue('birth'));x=mix(1040,982,p);y=mix(497,645,p)-Math.sin(p*Math.PI)*210;s=mix(.46,1.15,out(p));stretch=1+.25*Math.sin(p*Math.PI);rot=-.2*Math.sin(p*Math.PI);exp='o';for(let i=0;i<3;i++){let r=clamp(p-.12*i);line([[1035-i*21,527-i*30],[1018-i*26,460-i*35],[1000-i*25,420-i*25]],3,P.red,1030+i)}}
 else if(t<5.1){let p=qt-cue('land'),beat=p/.4166667;let hop=Math.abs(Math.sin(beat*Math.PI));let land=1-clamp(p/.22);x=995+Math.sin(p*3.3)*180;y=667-hop*104;s=1.18;stretch=1-.32*land+.1*hop;rot=Math.sin(p*7)*.17;
 for(let i=0;i<3;i++){let a=p*3+i*2;star(970+Math.cos(a)*355,440+Math.sin(a)*120,12+7*Math.sin(a)**2,a,i%2?P.red:P.yellow,1040+i)}
 if(hop<.35){line([[x-160,792],[x-120,777]],4,P.ink,1050);line([[x+115,776],[x+160,790]],4,P.ink,1051)}
 }
 else{let p=clamp((qt-5.1)/(.733333));x=995-40*p;y=mix(660,745,ease(p));s=1.18;stretch=mix(1,.47,ease(p));rot=-.18*p;exp='squeeze';line([[x-182,650],[x-211,692],[x-206,737]],5,P.ink,1060);line([[x+172,657],[x+203,698],[x+196,740]],5,P.ink,1061)}
 ground(x,820,300);flame(x,y,s,qt*12,rot,stretch,exp);
 if(t>2.45&&t<5.25){save(1438,350,.1);text(CFG.dance[0],0,0,42,P.ink,.12);text(CFG.dance[1],-44,63,34,P.ink,.12);text(CFG.dance[2],-16,121,44,P.red,.12);ctx.restore();line([[1445,547],[1408,571],[1370,573]],4,P.ink,1063)}
 if(t>=cue('land')&&t<cue('land')+.35){let p=(t-cue('land'))/.35;puff(869-p*70,803,25+20*p,p,1070);puff(1090+p*70,803,29+18*p,p,1072)}
 }
 else if(t<cue('reform')){hero(qt);if(F===140){shape([[892,784],[1015,783],[995,242],[936,180]],P.red,8,1080);shape([[935,725],[979,724],[963,278]],P.yellow,0,1081,false)}}
 else {endScene(qt);let p=(t-cue('reform'))/.85;if(p<1){for(let i=0;i<12;i++){let an=i/12*Math.PI*2,rr=mix(430,300,ease(p));let x=960+Math.cos(an)*rr*1.4,y=500+Math.sin(an)*rr;ctx.globalAlpha=1-ease(p);if(i%2)puff(x,y,(1-p)*50,p,1100+i);else star(x,y,30*(1-p),an,P.red,1100+i);ctx.globalAlpha=1}}}
 // Fixed paper flecks over ink integrate the cels into the stock without temporal shimmer.
 ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.12;ctx.drawImage(paper,0,0);ctx.restore();
}
window.renderAt=render;
fetch('cues.json').then(r=>r.json()).then(c=>{CUES=c;render(0);window.__ready=true});
