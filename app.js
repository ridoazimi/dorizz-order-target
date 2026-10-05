import {chartLabelIndices} from "./chart.js";
import {createParser} from "./stream.js";
const API="https://dorizzstore.com/api/order-target";
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat("id-ID").format(n);
const date=d=>new Date(d+"T00:00:00+07:00").toLocaleDateString("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"short"});
let token=null,popup=null,state=null,generation=0,controller=null,lastTotal=null,currentData=null;
function connection(text,kind=""){$("connection").textContent=text;$("connection").className=kind;}
function notice(text){$("notice").textContent=text;$("notice").hidden=!text;}
function logout(message=""){
 token=null;currentData=null;generation++;controller?.abort();popup?.close();popup=null;state=null;lastTotal=null;
 $("dashboard").hidden=true;$("logout").hidden=true;$("gate").hidden=false;
 for(const id of ["total","today","days","needed","percentage"])$(id).textContent="…";
 $("chart").replaceChildren();$("daily-list").replaceChildren();
 $("remaining").textContent="Menunggu data";$("updated").textContent="Menunggu data server";
 $("progress-fill").style.width="0%";$("progress").setAttribute("aria-valuenow","0");
 $("progress").removeAttribute("aria-valuetext");notice("");

 $("login-status").textContent=message;connection("Belum terhubung");
}
$("logout").addEventListener("click",()=>logout());
$("login").addEventListener("click",()=>{
 state=crypto.randomUUID();
 popup=window.open(`${API}/connect?state=${encodeURIComponent(state)}`,"dorizz-target-login","popup,width=520,height=740");
 $("login-status").textContent=popup?"Selesaikan login di jendela Dorizz Store. Jika jendelanya tertutup, klik login lagi.":"Jendela login diblokir. Izinkan pop-up atau buka link ini di Chrome/Safari, lalu coba lagi.";
});
window.addEventListener("message",event=>{
 if(event.origin!=="https://dorizzstore.com" || event.source!==popup || event.data?.type!=="dorizz-order-target-login" || event.data.state!==state || typeof event.data.token!=="string")return;
 token=event.data.token;state=null;popup?.close();popup=null;
 $("gate").hidden=true;$("dashboard").hidden=false;$("logout").hidden=false;
 $("login-status").textContent="";notice("");controller?.abort();
 const current=++generation;void listen(current);
});
function svgNode(name,attributes={},text){
 const node=document.createElementNS("http://www.w3.org/2000/svg",name);
 for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));
 if(text!==undefined)node.textContent=text;
 return node;
}
function draw(data){
 const today=new Date(new Date(data.generatedAt).getTime()+7*3600000).toISOString().slice(0,10);
 const max=Math.max(98,...data.daily.map(d=>d.orders));
 const width=Math.max(260,$("chart").clientWidth),height=215,left=40,top=12,chartHeight=165,step=(width-left-10)/30;
 const svg=svgNode("svg",{viewBox:`0 0 ${width} ${height}`,role:"img","aria-label":`Order harian periode 29 September sampai 28 Oktober. Total ${data.total} order.`});
 const y=n=>top+chartHeight-n/max*chartHeight;
 svg.append(svgNode("line",{x1:left,y1:y(98),x2:width-8,y2:y(98),stroke:"#9fa7a9","stroke-dasharray":"4 5"}));
 svg.append(svgNode("text",{x:0,y:y(98)+4,fill:"#5c6367","font-size":13},"98"));
 svg.append(svgNode("line",{x1:left,y1:y(0),x2:width-8,y2:y(0),stroke:"#d8dcdd"}));
 data.daily.forEach((d,i)=>{
  const future=d.date>today;const x=left+i*step+4;
  if(!future){
   const bar=svgNode("rect",{x,y:y(d.orders),width:step-Math.max(2,step*.25),height:Math.max(0,chartHeight*d.orders/max),fill:d.date===today?"#b63b21":"#525c62",rx:1});
   bar.append(svgNode("title",{},`${date(d.date)}: ${fmt(d.orders)} order`));svg.append(bar);
  }
  if(chartLabelIndices(width).includes(i))svg.append(svgNode("text",{x:x+(step-Math.max(2,step*.25))/2,y:203,"text-anchor":i===29?"end":"middle",fill:"#5c6367","font-size":12},date(d.date)));
 });
 $("chart").replaceChildren(svg);$("daily-list").replaceChildren();
 data.daily.forEach(d=>{
  const row=document.createElement("div");row.className="daily-row";
  const label=document.createElement("span");label.textContent=date(d.date);
  const count=document.createElement("strong");count.textContent=d.date>today?"Belum berjalan":`${fmt(d.orders)} order`;
  row.append(label,count);$("daily-list").append(row);
 });
}
function render(data){
 currentData=data;
 if(!Number.isInteger(data.total)||!Array.isArray(data.daily)||data.daily.length!==30)throw new Error("Data tidak valid");
 $("total").textContent=fmt(data.total);
 if(lastTotal!==null&&lastTotal!==data.total){$("total").classList.remove("changed");void $("total").offsetWidth;$("total").classList.add("changed");}
 lastTotal=data.total;
 $("percentage").textContent=`${data.progress.toLocaleString("id-ID",{maximumFractionDigits:1})}% tercapai`;
 $("remaining").textContent=data.remaining?`${fmt(data.remaining)} order lagi`:"Target tercapai";
 $("progress-fill").style.width=`${Math.min(100,Math.max(0,data.progress))}%`;
 $("progress").setAttribute("aria-valuenow",Math.min(data.total,2940));
 $("progress").setAttribute("aria-valuetext",`${fmt(data.total)} dari 2.940 order`);
 $("today").textContent=fmt(data.today);$("days").textContent=`${data.daysLeft} hari`;
 $("days-note").textContent=data.phase==="upcoming"?"Periode belum dimulai":data.phase==="ended"?"Periode sudah berakhir":"Termasuk hari ini";
 $("needed").textContent=data.dailyNeeded===null?"Selesai":fmt(data.dailyNeeded);
 $("needed-note").textContent=data.dailyNeeded===null?"Siklus ditutup 28 Oktober":"Sisa target ÷ sisa hari";
 $("updated").textContent=`Data ${new Date(data.generatedAt).toLocaleString("id-ID",{timeZone:"Asia/Jakarta",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"})} WIB`;
 draw(data);connection("Realtime terhubung","live");notice("");
}
async function listen(current){
 let retry=1000;
 while(token&&current===generation){
  controller=new AbortController();const active=controller;
  let watchdog;
  try{
   connection("Menghubungkan...");
   watchdog=setTimeout(()=>active.abort(),20000);
   const response=await fetch(`${API}/stream`,{headers:{Authorization:`Bearer ${token}`},signal:active.signal,cache:"no-store"});
   if(current!==generation)return;
   if(response.status===401||response.status===403){logout("Sesi berakhir atau akses dicabut. Silakan login kembali.");return;}
   if(!response.ok||!response.body)throw new Error("Stream belum tersedia");
   const resetWatchdog=()=>{clearTimeout(watchdog);watchdog=setTimeout(()=>active.abort(),45000);};
   resetWatchdog();
   const parser=createParser(({event,data})=>{
    if(current!==generation)return;
    resetWatchdog();
    if(event==="snapshot"){render(data);retry=1000;}
    if(event==="expired"){logout("Sesi berakhir. Silakan login kembali.");}
    if(event==="unavailable")throw new Error("Sambungan server terputus");
   });
   const reader=response.body.getReader();const decoder=new TextDecoder();
   try{while(current===generation){const {value,done}=await reader.read();if(done)break;parser(decoder.decode(value,{stream:true}));}}
   finally{await reader.cancel().catch(()=>{});}
   if(current===generation)throw new Error("Stream ditutup");
  }catch{
   if(current!==generation||!token)return;
   connection("Terputus","stale");notice(lastTotal===null?"Belum mendapat data. Mencoba menghubungkan kembali...":"Koneksi terputus. Angka terakhir belum diperbarui; menyambungkan kembali secara otomatis.");
  }finally{clearTimeout(watchdog);active.abort();}
  await new Promise(resolve=>setTimeout(resolve,retry));retry=Math.min(15000,retry*2);
 }
}
window.addEventListener("pagehide",()=>{generation++;controller?.abort();token=null;});
window.addEventListener("pageshow",event=>{if(event.persisted)logout();});

new ResizeObserver(()=>{if(currentData)draw(currentData)}).observe($("chart"));

window.addEventListener("offline",()=>{
 if(!token)return;
 controller?.abort();connection("Terputus","stale");
 notice("Koneksi terputus. Angka terakhir belum diperbarui; menyambungkan kembali secara otomatis.");
});
