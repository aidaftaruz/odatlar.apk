import { Capacitor, registerPlugin } from "@capacitor/core";
const StepCounter=registerPlugin("StepCounter");
import { LocalNotifications } from "@capacitor/local-notifications";


const CATS={sal:["Salomatlik","var(--sal)"],riv:["Rivojlanish","var(--riv)"],osh:["Shaxsiy o‘sish","var(--osh)"]};
const WD=["Ya","Du","Se","Ch","Pa","Ju","Sh"],WDF=["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
const MON=["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const ORD=[1,2,3,4,5,6,0];
const PRE=[
["10 000 qadam yurish","sal",10000,"qadam"],["8 stakan suv ichish","sal",8,"stakan"],["30 daqiqa piyoda yurish","sal",30,"daqiqa"],["Ertalabki badantarbiya","sal"],
["20 ta o‘tirib-turish","sal",20,"marta"],["Otjimaniya yoki turnik","sal"],["23:00 gacha uxlash","sal"],["7–8 soat uxlash","sal"],["Shirinliksiz kun","sal"],
["Gazli ichimliksiz kun","sal"],["Har ovqatda sabzavot","sal"],["Kechki 20:00 dan keyin ovqatlanmaslik","sal"],["Smenada 5 daqiqa cho‘zilish mashqi","sal"],
["Ko‘zga dam: har 20 daqiqada uzoqqa qarash","sal"],["Tishni ikki marta yuvish","sal"],["Toza havoda 15 daqiqa","sal",15,"daqiqa"],
["20 bet kitob o‘qish","riv",20,"bet"],["15 daqiqa ingliz tili","riv",15,"daqiqa"],["10 ta yangi so‘z yodlash","riv",10,"so‘z"],["1 soat dasturlash","riv",60,"daqiqa"],
["Python bo‘yicha 1 ta mashq","riv"],["Bitta kurs darsini ko‘rish","riv"],["Audiokitob yoki podkast","riv",20,"daqiqa"],["Kuniga 1 ta post yozish","riv"],
["Bugun o‘rganganimni yozib qo‘yish","riv"],["Ertangi ish rejasini tuzish","riv"],["Ijtimoiy tarmoqda 1 soatdan kam","riv"],["Excel yoki AI bo‘yicha yangi usul sinash","riv"],
["Kundalik yozish","osh"],["Uchta yaxshi narsani yozish","osh"],["10 daqiqa jim o‘tirish","osh",10,"daqiqa"],["Telefonsiz 1 soat","osh"],["Ota-onaga qo‘ng‘iroq qilish","osh"],
["Oila bilan birga ovqatlanish","osh"],["Bir kishiga yordam berish","osh"],["Xarajatlarni yozib borish","osh"],["Kuniga oz bo‘lsa ham pul ajratish","osh"],
["Xonani 10 daqiqa tartiblash","osh"],["Ertaga uchun 3 ta vazifa yozish","osh"],["Uxlashdan oldin 30 daqiqa ekransiz","osh"],["Bir yangi odam bilan tanishish","osh"],["Do‘stga xabar yozish","osh"]];
const EMPTY_PRE=[0,1,6,16,17,28];

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const key=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const uid=()=>Math.random().toString(36).slice(2,10);
let S={habits:[],log:{},rem:[{id:1,on:true,t:"21:00",x:"Bugungi odatlaringizni belgiladingizmi?"},{id:2,on:false,t:"07:30",x:"Yangi kun — odatlaringiz kutyapti"}]},view=today(),filter="all",editing=null,undo=null;

const DEFREM=()=>JSON.parse(JSON.stringify(S.rem));
const norm=d=>({stepAuto:!!(d&&d.stepAuto),stepAdj:d&&d.stepAdj&&typeof d.stepAdj==="object"?d.stepAdj:{},val:d&&d.val&&typeof d.val==="object"?d.val:{},cal:normCal(d&&d.cal),habits:Array.isArray(d&&d.habits)?d.habits:[],log:d&&typeof d.log==="object"&&d.log?d.log:{},rem:Array.isArray(d&&d.rem)&&d.rem.length===2?d.rem:DEFREM()});
// ===== Kaloriya bo'limi =====
const FOODS=[
["Osh (palov)","1 likopcha, ~300 g",650],["Lag‘mon","1 kosa, ~400 g",550],["Manti","1 dona, ~50 g",110],["Chuchvara","1 kosa, ~300 g",450],
["Sho‘rva","1 kosa, ~350 g",250],["Mastava","1 kosa, ~350 g",300],["Norin","1 likopcha, ~250 g",450],["Dimlama","1 likopcha, ~300 g",350],
["Qozon kabob","1 likopcha, ~300 g",550],["Shashlik","1 six, ~100 g go‘sht",270],["Somsa (go‘shtli)","1 dona, ~120 g",350],["Somsa (oshqovoqli)","1 dona, ~120 g",250],
["Non (tandir non)","chorak non, ~100 g",265],["Achchiq-chuchuk salat","1 likopcha, ~200 g",50],["Qatiq","1 stakan, 200 g",120],["Sut (2,5%)","1 stakan, 250 ml",130],
["Tuxum (qaynatilgan)","1 dona",75],["Tuxum (qovurilgan)","1 dona",110],["Guruch (qaynatilgan)","100 g",130],["Grechka (qaynatilgan)","100 g",100],
["Makaron (qaynatilgan)","100 g",155],["Kartoshka (qaynatilgan)","100 g",85],["Kartoshka fri","100 g",310],["Tovuq go‘shti (pishgan)","100 g",190],
["Mol go‘shti (qaynatilgan)","100 g",250],["Baliq (qovurilgan)","100 g",200],["Pishloq","30 g",110],["Kolbasa","50 g",150],["Sariyog‘","10 g",75],
["Kungaboqar yog‘i","1 osh qoshiq",120],["Asal","1 osh qoshiq",64],["Shakar","1 choy qoshiq",16],["Choy (shakarsiz)","1 piyola",2],
["Kofe (sut va shakar bilan)","1 stakan",60],["Gazli ichimlik","0,5 l",210],["Meva sharbati","1 stakan, 250 ml",110],
["Olma","1 dona, ~150 g",80],["Banan","1 dona",105],["Uzum","100 g",70],["Qovun","1 bo‘lak, ~200 g",70],["Tarvuz","1 bo‘lak, ~300 g",90],
["Apelsin","1 dona",65],["Anor","1 dona",130],["Bodring","1 dona",15],["Pomidor","1 dona",20],["Sabzi","1 dona",25],
["Yong‘oq","30 g, bir hovuch",195],["Mayiz","30 g",90],["Shokolad","25 g",135],["Pechenye","1 dona",50],["Tort","1 bo‘lak, ~100 g",350],
["Holva","50 g",260],["Shaurma (lavash)","1 dona",600],["Burger","1 dona",500],["Pitsa","1 bo‘lak",270],["Hot-dog","1 dona",300]];
const MEALS=[["n","Nonushta"],["t","Tushlik"],["k","Kechki ovqat"],["s","Tamaddi"]];
const ACT=["Kam harakat (asosan o‘tirib)","O‘rtacha (haftada 1–3 marta faol)","Yuqori (har kuni og‘ir mehnat yoki sport)"];
const GOAL=["Sekin vazn tashlash (~0,25 kg/hafta)","Vazn tashlash (~0,5 kg/hafta)","Vaznni saqlash"];
let tab=(location.hash==="#kaloriya")?"cal":"odat";
const normCal=c=>({p:c&&c.p&&typeof c.p==="object"?c.p:null,my:Array.isArray(c&&c.my)?c.my:[],log:c&&c.log&&typeof c.log==="object"?c.log:{},w:c&&c.w&&typeof c.w==="object"?c.w:{}});
const fnorm=s=>String(s).toLowerCase().replace(/[‘’ʻʼ`']/g,"'");
const kk=n=>Math.round(n).toLocaleString("ru-RU").replace(/ /g," ");
function calT(){const p=S.cal&&S.cal.p;if(!p)return null;const bmi=p.w/((p.h/100)**2),low=bmi<18.5,g=low?2:p.g;
 const bmr=10*p.w+6.25*p.h-5*p.a+(p.s==="m"?5:-161),tdee=bmr*[1.2,1.375,1.55][p.act];
 const t=Math.round(Math.max(tdee-[275,550,0][g],p.s==="m"?1500:1200)/10)*10;
 return{bmr:Math.round(bmr),tdee:Math.round(tdee/10)*10,t,bmi,low,g}}
const dayFood=d=>S.cal.log[key(d)]||[];
const eaten=d=>dayFood(d).reduce((a,e)=>a+e.k*e.q,0);
let moreOpen=false;document.addEventListener("toggle",e=>{if(e.target.classList&&e.target.classList.contains("more")&&e.target.closest("#calBody"))moreOpen=e.target.open},true);
function renderCal(){
 const T=calT(),el=$("#calBody");if(!el)return;
 if(!T){el.innerHTML=`<div class="empty" style="margin-top:16px"><b style="font-size:18px">Kunlik me’yoringizni hisoblaymiz</b><div>Buning uchun jins, yosh, bo‘y va vazningiz kerak. Ma’lumot faqat sizda qoladi.</div><div class="row"><button class="btn pri" data-popen="1">Boshlash</button></div></div>`;return}
 const e=Math.round(eaten(view)),left=T.t-e,p=S.cal.p;
 const ws=Object.keys(S.cal.w).sort(),lastW=ws.length?S.cal.w[ws[ws.length-1]]:p.w,firstW=ws.length?S.cal.w[ws[0]]:p.w;
 el.innerHTML=`<div class="stats mini c3" style="margin-top:12px">
  <div class="st"><b>${kk(T.t)}</b><span>me’yor, kkal</span></div>
  <div class="st"><b style="color:${left<0?"var(--osh)":"inherit"}">${kk(Math.abs(left))}</b><span>${left<0?"oshdi":"qoldi"}, kkal</span></div>
  <div class="st"><b>${String(lastW).replace(".",",")}</b><span>vazn, kg</span></div></div>
 ${T.low?`<div class="card" style="border-color:var(--osh)">Vazningiz bo‘yingizga nisbatan kam. Vazn tashlash tavsiya etilmaydi, me’yor vaznni saqlashga hisoblandi. Savollaringiz bo‘lsa, shifokor bilan maslahatlashing.</div>`:""}
 <div class="bar"><button class="addb" data-fopen="1" aria-label="Ovqat qo‘shish"><span class="pl">+</span><span class="lt"> Ovqat qo‘shish</span></button></div>
 ${MEALS.map(([m,n])=>{const list=dayFood(view).map((x,i)=>[x,i]).filter(([x])=>x.m===m),sum=list.reduce((a,[x])=>a+x.k*x.q,0);
  return `<div class="meal ${list.length?"":"emp"}"><h3><span>${n}</span><span class="ms">${sum?kk(sum)+" kkal":""}<button class="madd" data-fopen="${m}" aria-label="${n}ga qo‘shish">+</button></span></h3>${list.length?list.map(([x,i])=>`<div class="fe"><div><b>${esc(x.n)}</b><small>${esc(x.p)} · ${kk(x.k)} kkal</small></div>
   <div class="qty"><button data-fq="${i}|-0.5" aria-label="Kamaytirish">−</button><span>${String(x.q).replace(".",",")}</span><button data-fq="${i}|0.5" aria-label="Ko‘paytirish">+</button></div><b class="fk">${kk(x.k*x.q)}</b></div>`).join(""):""}</div>`}).join("")}
 <div class="leg">Kaloriyalar taxminiy. Uy ovqatida yog‘ miqdoriga qarab farq qiladi. Miqdorni 0 ga tushirsangiz, yozuv o‘chadi.</div>
 <details class="more"><summary>Vazn va profil</summary>
 <div class="card"><form id="wform" class="wrow"><input type="number" id="wkg" step="0.1" min="30" max="300" inputmode="decimal" placeholder="Bugungi vazn, kg" aria-label="Vazn, kg" value="${S.cal.w[key(view)]||""}"><button class="btn pri">Saqlash</button></form>
  <div class="fig" style="min-height:200px;margin-top:12px"><svg id="wsvg"></svg></div>
  <div class="leg">${ws.length>1?`Boshlanishi ${String(firstW).replace(".",",")} kg → hozir ${String(lastW).replace(".",",")} kg (${(lastW-firstW>0?"+":"")+(lastW-firstW).toFixed(1).replace(".",",")} kg)`:"Grafik chiqishi uchun kamida 2 kun vazn kiriting. Haftasiga 1–2 marta, ertalab nonushtadan oldin tortilish qulay."}</div></div>
 <div class="card"><b>Profil</b><div class="leg" style="margin-top:4px">${p.s==="m"?"Erkak":"Ayol"}, ${p.a} yosh, ${p.h} sm · ${ACT[p.act]} · ${GOAL[T.g]}<br>Organizm tinch holatda ~${kk(T.bmr)} kkal, kun davomida ~${kk(T.tdee)} kkal sarflaydi.</div>
  <div class="row" style="margin-top:12px"><button class="btn" data-popen="1">O‘zgartirish</button></div></div></details>`;
 const md=el.querySelector(".more");if(md&&moreOpen)md.open=true;
 drawW();
}
let wro=null;
function drawW(){const s=$("#wsvg");if(!s)return;if(wro)wro.disconnect();
 const draw=()=>{const W=s.clientWidth,H=s.clientHeight;if(!W)return;
  const pts=Object.keys(S.cal.w).sort().slice(-60).map(k=>[k,S.cal.w[k]]);
  if(pts.length<2){s.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="currentColor" opacity=".5" font-size="14">Hali ma’lumot kam</text>`;return}
  const v=pts.map(p=>p[1]),mn=Math.min(...v)-0.5,mx=Math.max(...v)+0.5,L=44,R=12,Tp=12,B=26;
  const x=i=>L+(W-L-R)*i/(pts.length-1),y=n=>Tp+(H-Tp-B)*(1-(n-mn)/(mx-mn));
  const ticks=[mn+0.5,(mn+mx)/2,mx-0.5];
  s.innerHTML=ticks.map(t=>`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end" font-size="12" fill="var(--mute)">${t.toFixed(1).replace(".",",")}</text>`).join("")
   +`<polyline fill="none" stroke="var(--riv)" stroke-width="3" stroke-linejoin="round" points="${pts.map((p,i)=>x(i)+","+y(p[1])).join(" ")}"/>`
   +pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p[1])}" r="${pts.length>20?2.5:4}" fill="var(--riv)"/>`).join("")
   +[0,pts.length-1].map(i=>{const[yy,mm,dd]=pts[i][0].split("-");return `<text x="${x(i)}" y="${H-6}" text-anchor="${i?"end":"start"}" font-size="12" fill="var(--mute)">${+dd}-${MON[+mm-1].slice(0,3)}</text>`}).join("")};
 wro=new ResizeObserver(draw);wro.observe(s);draw()}
// profil oynasi
let pd=null;
function openProfile(){const p=S.cal.p||{s:"m",a:"",h:"",w:"",act:0,g:1};pd={...p};drawProfile();$("#pmodal").classList.add("open")}
function drawProfile(){$("#psx").innerHTML=[["m","Erkak"],["f","Ayol"]].map(([k,n])=>`<button type="button" class="chip" data-ps="${k}" aria-pressed="${pd.s===k}">${n}</button>`).join("");
 $("#pa").value=pd.a;$("#ph").value=pd.h;$("#pw").value=pd.w;
 $("#pact").innerHTML=ACT.map((n,i)=>`<button type="button" class="opt" data-pact="${i}" aria-pressed="${pd.act===i}">${n}</button>`).join("");
 $("#pgl").innerHTML=GOAL.map((n,i)=>`<button type="button" class="opt" data-pg="${i}" aria-pressed="${pd.g===i}">${n}</button>`).join("");$("#perr").textContent=""}
function saveProfile(){const a=+$("#pa").value,h=+$("#ph").value,w=+String($("#pw").value).replace(",",".");
 if(!(a>=18&&a<=90)){$("#perr").textContent="Yoshni 18 dan 90 gacha kiriting. Bu hisob kattalar uchun mo‘ljallangan.";return}
 if(!(h>=130&&h<=230)){$("#perr").textContent="Bo‘yni santimetrda kiriting, masalan 175.";return}
 if(!(w>=35&&w<=300)){$("#perr").textContent="Vaznni kilogrammda kiriting, masalan 82,5.";return}
 S.cal.p={s:pd.s,a,h,w,act:pd.act,g:pd.g};if(!Object.keys(S.cal.w).length)S.cal.w[key(today())]=w;
 $("#pmodal").classList.remove("open");save();render()}
// ovqat oynasi
let fm="n";
function openFood(m){const hr=new Date().getHours();fm=m&&m!=="1"?m:(hr<11?"n":hr<16?"t":hr<21?"k":"s");$("#fq").value="";$("#cn").value="";$("#ck").value="";$("#cp").value="";drawFood();$("#fmodal").classList.add("open")}
function foodList(){const q=fnorm($("#fq").value.trim()),seen=new Set(),out=[];
 const rec=[];for(let i=0;i<14;i++)for(const x of dayFood(add(today(),-i)))rec.push([x.n,x.p,x.k]);
 for(const f of rec.concat(S.cal.my,FOODS)){const id=f[0]+"|"+f[1];if(seen.has(id))continue;seen.add(id);if(!q||fnorm(f[0]).includes(q))out.push(f)}
 return out.slice(0,40)}
let fl=[];
function drawFood(){$("#fml").innerHTML=MEALS.map(([k,n])=>`<button type="button" class="chip" data-fm="${k}" aria-pressed="${fm===k}">${n}</button>`).join("");drawRes()}
function drawRes(){fl=foodList();$("#fres").innerHTML=fl.length?fl.map((f,i)=>`<button type="button" class="fr" data-fa="${i}"><span><b>${esc(f[0])}</b><small>${esc(f[1])}</small></span><span class="fk">${kk(f[2])} kkal</span></button>`).join(""):`<div class="leg">Topilmadi. Pastda o‘z ovqatingizni qo‘shing.</div>`}
function addFood(f){const k=key(view),a=(S.cal.log[k]||[]).slice();a.push({n:f[0],p:f[1],k:f[2],q:1,m:fm});S.cal.log[k]=a;save();render();
 $("#fmodal").classList.remove("open");toast("«"+f[0]+"» qo‘shildi",null)}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
 if(d.tab){tab=d.tab;try{history.replaceState(null,"",tab==="cal"?"#kaloriya":"#odatlar")}catch(_){}render()}
 else if(d.popen)openProfile();
 else if(d.ps){pd.s=d.ps;pd.a=$("#pa").value;pd.h=$("#ph").value;pd.w=$("#pw").value;drawProfile()}
 else if(d.pact){pd.act=+d.pact;pd.a=$("#pa").value;pd.h=$("#ph").value;pd.w=$("#pw").value;drawProfile()}
 else if(d.pg){pd.g=+d.pg;pd.a=$("#pa").value;pd.h=$("#ph").value;pd.w=$("#pw").value;drawProfile()}
 else if(d.fopen)openFood(d.fopen);
 else if(d.fm){fm=d.fm;drawFood()}
 else if(d.fa)addFood(fl[+d.fa]);
 else if(d.fq){const[i,dl]=d.fq.split("|"),k=key(view),a=(S.cal.log[k]||[]).slice(),x={...a[+i]};x.q=Math.round((x.q+ +dl)*2)/2;
  if(x.q<=0){a.splice(+i,1);toast("«"+x.n+"» o‘chirildi",()=>{const b2=(S.cal.log[k]||[]).slice();b2.splice(+i,0,{...x,q:0.5});S.cal.log[k]=b2;save();render()})}else a[+i]=x;
  if(a.length)S.cal.log[k]=a;else delete S.cal.log[k];save();render()}
});
document.addEventListener("input",e=>{if(e.target.id==="fq")drawRes()});
document.addEventListener("submit",e=>{if(e.target.id==="wform"){e.preventDefault();const v=+String($("#wkg").value).replace(",",".");
 if(!(v>=30&&v<=300)){toast("Vaznni kilogrammda kiriting",null);return}
 S.cal.w[key(view)]=Math.round(v*10)/10;const ks=Object.keys(S.cal.w).sort();if(S.cal.p)S.cal.p.w=S.cal.w[ks[ks.length-1]];save();render();toast("Vazn saqlandi",null)}});
// ===== Kaloriya bo'limi tugadi =====
document.addEventListener("click",e=>{const t=e.target,c=s=>t.closest&&t.closest(s);
 if(t.id==="pmodal"||t.id==="fmodal")t.classList.remove("open");
 else if(c("#psave"))saveProfile();
 else if(c("#pcan"))$("#pmodal").classList.remove("open");
 else if(c("#fcan2"))$("#fmodal").classList.remove("open");
 else if(c("#cadd")){const n=$("#cn").value.trim(),k=Math.round(+$("#ck").value),p=$("#cp").value.trim()||"1 porsiya";
  if(!n||!(k>0&&k<=3000)){toast("Nomini va kaloriyasini (1–3000) yozing",null);return}
  const f=[n,p,k];if(!S.cal.my.some(x=>x[0]===n&&x[1]===p))S.cal.my.unshift(f);addFood(f)}});

S.cal=normCal();S.val={};
const val=(h,d)=>((S.val[key(d)]||{})[h.id])||0;
const stepOf=h=>h.goal>=1000?500:h.unit==="daqiqa"?5:1;
function setVal(id,d,v){const k=key(d),o={...(S.val[k]||{})};v=Math.max(0,Math.round(v));if(v)o[id]=v;else delete o[id];
 if(Object.keys(o).length)S.val[k]=o;else delete S.val[k];save();render()}
const NATIVE=Capacitor.isNativePlatform();
let STEP={days:{},vehicle:false,live:false};
const isAuto=h=>NATIVE&&S.stepAuto&&h.unit==="qadam";
function autoApply(){let ch=false;const ks=new Set(Object.keys(STEP.days).concat(Object.keys(S.stepAdj||{})));
 for(const h of S.habits){if(!isAuto(h))continue;for(const k of ks){if(k<h.created)continue;const w=((STEP.days[k]||{}).walk||0)+((S.stepAdj||{})[k]||0);
  const o={...(S.val[k]||{})},nv=Math.max(0,Math.round(w));if((o[h.id]||0)!==nv){if(nv)o[h.id]=nv;else delete o[h.id];if(Object.keys(o).length)S.val[k]=o;else delete S.val[k];ch=true}}}
 return ch}
let stepBusy=false;
async function syncSteps(){if(!NATIVE||!S.stepAuto||stepBusy)return;stepBusy=true;
 try{const r=await StepCounter.getDays();STEP={days:r.days||{},vehicle:!!r.vehicle,live:!!r.live};if(autoApply())save();render()}catch(e){}stepBusy=false}
async function enableAuto(h){
 try{let st=await StepCounter.status();
  if(!st.available){toast("Bu telefonda qadam sensori topilmadi",null);return}
  if(!st.granted)st=await StepCounter.requestPermission();
  if(!st.granted){toast("«Jismoniy faollik» ruxsati kerak — Sozlamalardan bering",null);return}
  await StepCounter.start();
  const k=key(today()),cur=val(h,today());S.stepAuto=true;S.stepAdj={...(S.stepAdj||{})};if(cur)S.stepAdj[k]=cur;save();
  await syncSteps();toast("Avtomatik sanash yoqildi",null);
 }catch(e){toast("Yoqib bo‘lmadi: "+(e&&e.message||"xato"),null)}}
const mkHabit=p=>{const h={id:uid(),name:p[0],cat:p[1],days:[0,1,2,3,4,5,6],created:key(today())};if(p[2]){h.goal=p[2];h.unit=p[3]}return h};
const due=(h,d)=>h.days.includes(d.getDay())&&key(d)>=h.created;
const done=(h,d)=>h.goal?val(h,d)>=h.goal:(S.log[key(d)]||[]).includes(h.id);
function streak(h,from){let d=new Date(from),n=0;if(due(h,d)&&!done(h,d))d=add(d,-1);
 for(let i=0;i<1000&&key(d)>=h.created;i++){if(due(h,d)){if(done(h,d))n++;else break}d=add(d,-1)}return n}
function rate(h,days){let a=0,b=0;for(let i=0;i<days;i++){const d=add(today(),-i);if(due(h,d)){b++;if(done(h,d))a++}}return b?Math.round(a/b*100):null}

function toggle(id,d){const hh=S.habits.find(x=>x.id===id);if(hh&&isAuto(hh)){toast("Qadamlar avtomatik sanaladi. Tuzatish uchun raqamni bosing",null);return}if(hh&&hh.goal){setVal(id,d,done(hh,d)?0:hh.goal);return}
 const k=key(d),a=(S.log[k]||[]).slice(),i=a.indexOf(id);i<0?a.push(id):a.splice(i,1);
 if(a.length)S.log[k]=a;else delete S.log[k];save();render()}

function save(){try{localStorage.setItem("odat-v1",JSON.stringify(S))}catch(e){}}
const sync=t=>$("#sync").textContent=t;

function render(){
 const t=today(),vk=key(view),isT=vk===key(t);
 $("#dlabel").textContent=(isT?"Bugun, ":"")+WDF[view.getDay()]+", "+view.getDate()+"-"+MON[view.getMonth()];
 $("#next").disabled=isT;$("#next").style.opacity=isT?.35:1;$("#tod").style.display=isT?"none":"";
 const dueH=S.habits.filter(h=>due(h,view)),dn=dueH.filter(h=>done(h,view)).length;
 $("#rn").textContent=dn+"/"+dueH.length;
 $("#rg").style.strokeDashoffset=364.4*(1-(dueH.length?dn/dueH.length:0));
 $("#vOdat").hidden=tab!=="odat";$("#vCal").hidden=tab!=="cal";$("#tOdat").setAttribute("aria-pressed",tab==="odat");$("#tCal").setAttribute("aria-pressed",tab==="cal");
 $(".ring").classList.toggle("sm",tab==="cal");if(tab==="cal"){const T=calT(),ea=Math.round(eaten(view));$("#rn").textContent=T?kk(ea):"—";$("#rsub").textContent=T?"/ "+kk(T.t)+" kkal":"kkal";
  $("#rg").style.strokeDashoffset=364.4*(1-(T?Math.min(ea/T.t,1):0));$("#rg").style.stroke=T&&ea>T.t?"var(--osh)":""}
 else{$("#rsub").textContent="bajarildi";$("#rg").style.stroke=""}
 const cnt=c=>S.habits.filter(h=>c==="all"||h.cat===c).length;
 $("#chips").innerHTML=[["all","Hammasi",""]].concat(Object.entries(CATS).map(([k,v])=>[k,v[0],v[1]]))
  .map(([k,n,c])=>`<button class="chip" data-f="${k}" aria-pressed="${filter===k}" style="--c:${c}">${c?"<i></i>":""}${n} · ${cnt(k)}</button>`).join("")
  +`<button class="chip" id="libb">G‘oyalar · ${PRE.length}</button><button class="addb" id="addb" aria-label="Yangi odat"><span class="pl">+</span><span class="lt"> Yangi odat</span></button>`;
 const week=[...Array(7)].map((_,i)=>add(view,i-6));
 $("#wkhead").innerHTML=S.habits.length?`<span></span><span></span><div class="wkl">${week.map(d=>`<span>${WD[d.getDay()]}</span>`).join("")}</div><span></span>`:"";
 const hs=S.habits.filter(h=>filter==="all"||h.cat===filter).sort((a,b)=>due(b,view)-due(a,view));
 if(!S.habits.length){$("#list").innerHTML=`<li class="empty"><b style="font-size:18px">Daftar hali bo‘sh.</b><div>Birinchi odatingizni qo‘shing. Kichikdan boshlang: 2–3 ta odat yetarli. Tayyor g‘oyalardan birini bosing:</div>
  <div class="presets">${EMPTY_PRE.map(i=>`<button class="chip" data-p="${i}" style="--c:${CATS[PRE[i][1]][1]}"><i></i>${esc(PRE[i][0])}</button>`).join("")}<button class="chip" data-libopen="1">Yana ${PRE.length-EMPTY_PRE.length} ta g‘oya…</button></div></li>`}
 else if(!hs.length){$("#list").innerHTML=`<li class="empty">Bu yo‘nalishda hali odat yo‘q.</li>`}
 else $("#list").innerHTML=hs.map(h=>{const on=done(h,view),dd=due(h,view),st=streak(h,view);
  return `<li class="h ${dd?"":"off"} ${h.goal?"has-ctl":""}" style="--c:${CATS[h.cat][1]}">
  <button class="chk ${on?"on":""}" data-t="${h.id}" aria-pressed="${on}" aria-label="${esc(h.name)} bajarildi" ${key(view)<h.created?"disabled":""}><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
  <div class="hm"><b>${esc(h.name)}</b><small>${CATS[h.cat][0]} · ${dd?(st?st+" kun ketma-ket":"seriya hali yo‘q"):"bu kun rejada yo‘q"}</small></div>${h.goal?(()=>{const v=val(h,view);return `<div class="ctl"><div class="cnt"><button data-dv="${h.id}|-1" aria-label="Kamaytirish">−</button><button class="cv" data-setv="${h.id}">${kk(v)} / ${kk(h.goal)}<span class="u"> ${esc(h.unit)}</span></button><button data-dv="${h.id}|1" aria-label="Ko‘paytirish">+</button>${h.unit==="qadam"&&key(view)===key(t)&&!isAuto(h)?`<button class="walkb" data-walk="${h.id}">Yurish</button>`:""}${h.unit==="qadam"&&NATIVE&&!S.stepAuto?`<button class="walkb" data-auto="${h.id}">Avtomatik</button>`:""}</div>${isAuto(h)?`<div class="autonote">Avtomatik sanaladi${((STEP.days[key(view)]||{}).vehicle)?` · transportda ${kk(STEP.days[key(view)].vehicle)} qadam ayirildi`:""}${STEP.vehicle&&key(view)===key(t)?" · hozir transportda":""}</div>`:""}<div class="pt"><i style="width:${Math.min(100,v/h.goal*100)}%"></i></div></div>`})():""}
  <div class="wk">${week.map(d=>{const k=key(d),cls=k>key(t)||k<h.created?"no":done(h,d)?"on":due(h,d)?"":"na";
   return `<button class="c ${cls} ${k===vk?"cur":""}" data-c="${h.id}|${k}" aria-label="${d.getDate()}-${MON[d.getMonth()]}"></button>`}).join("")}</div>
  <button class="ed" data-e="${h.id}" aria-label="Tahrirlash"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button></li>`}).join("");
 stats();renderCal();try{$("#bk").value=JSON.stringify(S)}catch(e){}
}

function stats(){
 const t=today(),all=S.habits;
 const tdDue=all.filter(h=>due(h,t)),td=tdDue.length?Math.round(tdDue.filter(h=>done(h,t)).length/tdDue.length*100):0;
 const top=all.reduce((m,h)=>Math.max(m,streak(h,t)),0);
 const rs=all.map(h=>rate(h,30)).filter(r=>r!==null),avg=rs.length?Math.round(rs.reduce((a,b)=>a+b,0)/rs.length):0;
 const total=Object.values(S.log).reduce((a,b)=>a+b.length,0)+Object.values(S.val).reduce((a,o)=>a+Object.keys(o).filter(id=>{const h=all.find(x=>x.id===id);return h&&h.goal&&o[id]>=h.goal}).length,0);
 $("#stats").innerHTML=[[td+"%","bugun"],[top,"eng uzun seriya"],[avg+"%","30 kun o‘rtacha"],[total,"jami belgi"]]
  .map(([v,l])=>`<div class="st"><b>${v}</b><span>${l}</span></div>`).join("");
 const start=add(t,-((t.getDay()+6)%7)-28);let h="";
 ORD.forEach((wd,r)=>{h+=`<span>${WD[wd]}</span>`;for(let w=0;w<5;w++){const d=add(start,w*7+r);
  if(d>t){h+=`<div class="hc fut"></div>`;continue}
  const du=all.filter(x=>due(x,d)),p=du.length?Math.round(du.filter(x=>done(x,d)).length/du.length*100):0;
  h+=`<div class="hc" ${du.length?`data-p style="--p:${Math.max(p,8)}"`:""} title="${d.getDate()}-${MON[d.getMonth()]}: ${p}%"></div>`}});
 $("#heat").innerHTML=h;
 $("#bars").innerHTML=all.length?all.map(x=>{const r=rate(x,30);return `<div class="pr" style="--c:${CATS[x.cat][1]}"><span>${esc(x.name)}</span><div class="pt"><i style="width:${r||0}%"></i></div><b>${r===null?"—":r+"%"}</b></div>`}).join(""):`<div class="leg">Odat qo‘shganingizdan keyin bu yerda natijalar chiqadi.</div>`;
}

let fc="sal",fd=[],ft="c";
function openForm(h){editing=h||null;$("#mt").textContent=h?"Odatni tahrirlash":"Yangi odat";$("#fn").value=h?h.name:"";
 fc=h?h.cat:(filter!=="all"?filter:"sal");fd=h?h.days.slice():[0,1,2,3,4,5,6];ft=h&&h.goal?"n":"c";$("#fgv").value=h&&h.goal?h.goal:"";$("#fgu").value=h&&h.unit?h.unit:"";$("#fdel").style.display=h?"":"none";drawForm();
 $("#modal").classList.add("open");setTimeout(()=>$("#fn").focus(),30)}
function drawForm(){$("#fcat").innerHTML=Object.entries(CATS).map(([k,v])=>`<button type="button" class="chip" data-fc="${k}" aria-pressed="${fc===k}" style="--c:${v[1]}"><i></i>${v[0]}</button>`).join("");
 $("#fdays").innerHTML=ORD.map(d=>`<button type="button" data-fd="${d}" aria-pressed="${fd.includes(d)}">${WD[d]}</button>`).join("");
 $("#ftype").innerHTML=[["c","Bajardim / yo‘q"],["n","Son bilan (maqsad)"]].map(([k,n])=>`<button type="button" class="chip" data-ft="${k}" aria-pressed="${ft===k}">${n}</button>`).join("");$("#fgoal").hidden=ft!=="n"}
const close=()=>{document.querySelectorAll(".modal").forEach(m=>m.classList.remove("open"));$("#rmodal").classList.remove("open");editing=null};
function toast(m,fn){undo=fn;$("#tmsg").textContent=m;$("#tund").style.display=fn?"":"none";$("#toast").classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>$("#toast").classList.remove("show"),6000)}

document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;
 if(d.t)toggle(d.t,view);
 else if(d.c){const[id,k]=d.c.split("|");const[y,m,dd]=k.split("-").map(Number);toggle(id,new Date(y,m-1,dd))}
 else if(d.f){filter=d.f;render()}
 else if(d.e)openForm(S.habits.find(h=>h.id===d.e));
 else if(d.p){S.habits.push(mkHabit(PRE[d.p]));save();render()}
 else if(d.ft){ft=d.ft;const nm=$("#fn").value;drawForm();$("#fn").value=nm}
 else if(d.dv){const[id,dir]=d.dv.split("|"),h=S.habits.find(x=>x.id===id);
  if(isAuto(h)){const k=key(view);S.stepAdj={...S.stepAdj,[k]:(S.stepAdj[k]||0)+(+dir)*stepOf(h)};autoApply();save();render()}
  else setVal(id,view,val(h,view)+(+dir)*stepOf(h))}
 else if(d.auto)enableAuto(S.habits.find(x=>x.id===d.auto));
 else if(d.setv)openVal(S.habits.find(x=>x.id===d.setv));
 else if(d.walk)openWalk(S.habits.find(x=>x.id===d.walk));
 else if(d.libopen||b.id==="libb")openLib();
 else if(d.lib){const p=PRE[+d.lib];S.habits.push(mkHabit(p));save();render();drawLib();toast("«"+p[0]+"» qo‘shildi",null)}
 else if(d.fc){fc=d.fc;drawForm()}
 else if(d.fd){const n=+d.fd,i=fd.indexOf(n);i<0?fd.push(n):fd.length>1&&fd.splice(i,1);drawForm()}
 else if(b.id==="addb")openForm();
});
// ---- son kiritish ----
let vh=null;
function openVal(h){vh=h;$("#vt").textContent=h.name;$("#vin").value=val(h,view)||"";$("#vu").textContent="Maqsad: "+kk(h.goal)+" "+h.unit;$("#vmodal").classList.add("open");setTimeout(()=>$("#vin").focus(),30)}
$("#vform").onsubmit=e=>{e.preventDefault();const v=+String($("#vin").value).replace(/\s/g,"");$("#vmodal").classList.remove("open");if(!(vh&&v>=0))return;
 if(isAuto(vh)){const k=key(view);S.stepAdj={...S.stepAdj,[k]:Math.round(v-((STEP.days[k]||{}).walk||0))};autoApply();save();render()}else setVal(vh.id,view,v)};
$("#vcan").onclick=()=>$("#vmodal").classList.remove("open");
// ---- g'oyalar ----
function openLib(){drawLib();$("#lmodal").classList.add("open")}
function drawLib(){const have=new Set(S.habits.map(h=>h.name));
 $("#llist").innerHTML=Object.entries(CATS).map(([c,v])=>`<h3 class="lh" style="--c:${v[1]}"><i></i>${v[0]}</h3>`+PRE.map((p,i)=>[p,i]).filter(([p])=>p[1]===c).map(([p,i])=>{const h=have.has(p[0]);
  return `<button type="button" class="fr" data-lib="${i}" ${h?"disabled":""}><span><b>${esc(p[0])}</b>${p[2]?`<small>maqsad: ${kk(p[2])} ${esc(p[3])}</small>`:""}</span><span class="fk">${h?"qo‘shilgan":"+ qo‘shish"}</span></button>`}).join("")).join("")}
$("#lcan").onclick=()=>$("#lmodal").classList.remove("open");
// ---- yurish rejimi (qadam sanash) ----
const W={on:false,n:0,last:0,avg:0,above:false,lock:null,h:null,got:0,chk:null};
function onMotion(e){const a=e.accelerationIncludingGravity;if(!a||a.x==null)return;W.got++;
 const m=Math.hypot(a.x,a.y,a.z);if(!W.avg)W.avg=m;W.avg=W.avg*0.92+m*0.08;const dlt=m-W.avg,t=performance.now();
 if(!W.above&&dlt>1.3&&t-W.last>320){W.above=true;W.n++;W.last=t;$("#wn").textContent=kk(W.n)}
 else if(W.above&&dlt<0.3)W.above=false}
async function lockScreen(){try{if(navigator.wakeLock)W.lock=await navigator.wakeLock.request("screen")}catch(e){W.lock=null}}
function openWalk(h){W.h=h;W.n=0;$("#wn").textContent="0";$("#wst").textContent="Boshlash tugmasini bosing, telefonni qo‘lda yoki cho‘ntakda tuting va yuring.";
 $("#wgo").hidden=false;$("#wstop").hidden=true;$("#wadd").hidden=true;$("#wmodal").classList.add("open")}
$("#wgo").onclick=async()=>{try{if(typeof DeviceMotionEvent!=="undefined"&&DeviceMotionEvent.requestPermission){const r=await DeviceMotionEvent.requestPermission();if(r!=="granted"){$("#wst").textContent="Harakat sensoriga ruxsat berilmadi.";return}}}catch(e){}
 W.on=true;W.got=0;W.avg=0;W.above=false;window.addEventListener("devicemotion",onMotion);await lockScreen();
 $("#wgo").hidden=true;$("#wstop").hidden=false;$("#wadd").hidden=true;$("#wst").textContent="Sanayapti… Ekran o‘chmasin, ilovadan chiqmang.";
 clearTimeout(W.chk);W.chk=setTimeout(()=>{if(W.on&&!W.got)$("#wst").textContent="Bu qurilmada harakat sensori topilmadi. Qadamlarni qo‘lda kiriting."},3000)};
function stopWalk(){W.on=false;window.removeEventListener("devicemotion",onMotion);try{W.lock&&W.lock.release()}catch(e){}W.lock=null}
$("#wstop").onclick=()=>{stopWalk();$("#wstop").hidden=true;$("#wgo").hidden=false;$("#wgo").textContent="Davom ettirish";$("#wadd").hidden=!W.n;$("#wst").textContent=W.n?"To‘xtatildi. Natijani bugungi qadamlarga qo‘shing.":"Qadam sanalmadi."};
$("#wadd").onclick=()=>{const n=W.n;stopWalk();$("#wmodal").classList.remove("open");$("#wgo").textContent="Boshlash";if(W.h&&n){setVal(W.h.id,today(),val(W.h,today())+n);toast(kk(n)+" qadam qo‘shildi",null)}};
$("#wcan").onclick=()=>{stopWalk();$("#wgo").textContent="Boshlash";$("#wmodal").classList.remove("open")};
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&W.on)lockScreen()});
$("#prev").onclick=()=>{view=add(view,-1);render()};
$("#next").onclick=()=>{if(view<today()){view=add(view,1);render()}};
$("#tod").onclick=()=>{view=today();render()};
$("#fcan").onclick=close;
$("#modal").onclick=e=>{if(e.target.id==="modal")close()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
$("#form").onsubmit=e=>{e.preventDefault();const n=$("#fn").value.trim();if(!n)return;
 let g=null,u="";if(ft==="n"){g=Math.round(+$("#fgv").value);u=$("#fgu").value.trim()||"marta";if(!(g>0)){toast("Maqsad sonini kiriting",null);return}}
 const h=editing||{id:uid(),created:key(today())};Object.assign(h,{name:n,cat:fc,days:fd.slice()});if(g){h.goal=g;h.unit=u}else{delete h.goal;delete h.unit}
 if(!editing)S.habits.push(h);
 close();save();render()};
$("#fdel").onclick=()=>{const h=editing,i=S.habits.indexOf(h),snap=JSON.stringify(S);if(i<0)return;S.habits.splice(i,1);close();save();render();
 toast("«"+h.name+"» o‘chirildi",()=>{S=norm(JSON.parse(snap));save();render()})};
$("#tund").onclick=()=>{$("#toast").classList.remove("show");if(undo)undo();undo=null};
$("#cpy").onclick=async()=>{try{await navigator.clipboard.writeText($("#bk").value);toast("Nusxa olindi",null)}catch(e){$("#bk").select();toast("Matnni belgilab, o‘zingiz nusxalang",null)}};
$("#imp").onclick=()=>{try{const d=norm(JSON.parse($("#bk").value));const old=JSON.stringify(S);S=d;save();render();remText();applyRem(false);toast("Zaxiradan tiklandi",()=>{S=norm(JSON.parse(old));save();render()})}catch(e){toast("Bu matn zaxira nusxaga o‘xshamaydi",null)}};

try{const l=localStorage.getItem("odat-v1");if(l)S=norm(JSON.parse(l))}catch(e){}
render();
const native=Capacitor.isNativePlatform();
if(!native)$("#bell").style.display="none";
if(!native&&"serviceWorker" in navigator&&location.protocol==="https:"){navigator.serviceWorker.register("sw.js").catch(()=>{})}
const remText=()=>{const on=S.rem.filter(r=>r.on);sync(!native?"Shu qurilmada saqlanadi":on.length?"Telefonda saqlanadi · eslatma "+on.map(r=>r.t).join(" va "):"Telefonda saqlanadi · eslatma o‘chiq")};
remText();
async function applyRem(ask){
 if(!native)return "web";
 try{
  let p=await LocalNotifications.checkPermissions();
  if(p.display!=="granted"&&ask)p=await LocalNotifications.requestPermissions();
  await LocalNotifications.cancel({notifications:[{id:1},{id:2}]});
  if(p.display!=="granted")return "denied";
  try{await LocalNotifications.createChannel({id:"odat",name:"Odat eslatmalari",importance:4,visibility:1,vibration:true})}catch(e){}
  const list=S.rem.filter(r=>r.on).map(r=>{const[h,m]=r.t.split(":").map(Number);
   return {id:r.id,title:"Odatlar daftari",body:r.x,channelId:"odat",smallIcon:"ic_stat_odat",iconColor:"#e0453a",schedule:{on:{hour:h,minute:m},allowWhileIdle:true}}});
  if(list.length)await LocalNotifications.schedule({notifications:list});
  return "ok";
 }catch(e){return "err"}
}
let draft=[];
function drawRem(){$("#rlist").innerHTML=draft.map((r,i)=>`<div class="rem"><button type="button" class="sw" data-rs="${i}" aria-pressed="${r.on}" aria-label="${r.id===1?"Kechki":"Ertalabki"} eslatma"></button>
 <div><b>${r.id===1?"Kechki eslatma":"Ertalabki eslatma"}</b><div class="note" style="margin:0">${esc(r.x)}</div></div>
 <input type="time" data-rt="${i}" value="${r.t}" aria-label="Vaqt"></div>`).join("")}
$("#bell").onclick=()=>{draft=JSON.parse(JSON.stringify(S.rem));drawRem();
 $("#rnote").textContent=native?"Belgilangan vaqtda telefon har kuni eslatadi. Birinchi marta ruxsat so‘raladi — «Ruxsat berish» ni bosing.":"Eslatmalar faqat telefondagi ilovada ishlaydi.";
 $("#rmodal").classList.add("open")};
$("#rlist").addEventListener("click",e=>{const b=e.target.closest("[data-rs]");if(b){draft[+b.dataset.rs].on=!draft[+b.dataset.rs].on;drawRem()}});
$("#rlist").addEventListener("change",e=>{const t=e.target.closest("[data-rt]");if(t&&t.value)draft[+t.dataset.rt].t=t.value});
$("#rcan").onclick=()=>$("#rmodal").classList.remove("open");
$("#rmodal").onclick=e=>{if(e.target.id==="rmodal")$("#rmodal").classList.remove("open")};
$("#rsave").onclick=async()=>{S.rem=draft;save();$("#rmodal").classList.remove("open");remText();
 const r=await applyRem(true);
 if(r==="denied")toast("Bildirishnomaga ruxsat berilmagan — sozlamalardan yoqing",null);
 else if(r==="err")toast("Eslatmani o‘rnatib bo‘lmadi",null);
 else if(r==="ok")toast("Eslatma saqlandi",null)};
applyRem(true);
if(NATIVE&&S.stepAuto){StepCounter.start().catch(()=>{}).then(syncSteps)}
setInterval(()=>{if(!document.hidden)syncSteps()},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncSteps()});
let lastDay=key(today());
function dayCheck(){const k=key(today());if(k!==lastDay){if(key(view)===lastDay)view=today();lastDay=k;render()}}
setInterval(dayCheck,60000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)dayCheck()});

