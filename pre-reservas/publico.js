(()=>{"use strict";
const API="https://zcfudytghjsosnpkmgzv.supabase.co/functions/v1/pre-reservas";
const ROOT="https://raw.githubusercontent.com/lippieleo/site-lippi-e-leo/main/agenda/";
const css=document.createElement("style");css.textContent=`
.ll-book-button{display:block;width:100%;margin-top:5px;border:1px solid rgba(255,255,255,.35);border-radius:6px;background:rgba(0,0,0,.45);color:#fff;font:inherit;font-size:11px;padding:5px 2px;cursor:pointer}
.ll-book-button:hover,.ll-book-button:focus-visible{background:#5a1725}
.ll-book-dialog{border:1px solid #8e5a64;border-radius:14px;max-width:min(440px,94vw);width:100%;padding:24px;background:#170d13;color:#fff;box-shadow:0 12px 70px #000}
.ll-book-dialog::backdrop{background:#000b}
.ll-book-dialog h2{margin:0 0 12px;font-size:21px}.ll-book-dialog label{display:block;margin:10px 0 4px;font-size:13px}
.ll-book-dialog input{width:100%;padding:10px;border-radius:7px;border:1px solid #755b63;background:#fff;color:#111;font:inherit}
.ll-book-actions{display:flex;gap:10px;margin-top:18px}.ll-book-actions button{flex:1;border:0;border-radius:8px;padding:12px;cursor:pointer;background:#a92d49;color:white;font-weight:700}
.ll-book-actions button[type=button]{background:#444}.ll-book-status{font-size:13px;min-height:20px;margin:10px 0 0}
`;document.head.append(css);
const dialog=document.createElement("dialog");dialog.className="ll-book-dialog";
dialog.innerHTML=`<form id="ll-book-form"><h2>Solicitar show</h2><p>Pedido sujeito à aprovação. Cada apresentação reserva 3 horas.</p><label for="ll-date">Data</label><input id="ll-date" name="date" readonly required><label for="ll-time">Horário desejado</label><input id="ll-time" name="time" type="time" required><label for="ll-name">Nome do contratante</label><input id="ll-name" name="name" maxlength="150" required><label for="ll-venue">Local do evento</label><input id="ll-venue" name="venue" maxlength="200" required><label for="ll-city">Cidade / UF</label><input id="ll-city" name="city" maxlength="150" required><label for="ll-phone">WhatsApp</label><input id="ll-phone" name="whatsapp" type="tel" maxlength="25" required><p id="ll-book-status" class="ll-book-status" role="status"></p><div class="ll-book-actions"><button type="button" id="ll-cancel">Cancelar</button><button type="submit" id="ll-submit">Enviar pedido</button></div></form>`;
document.body.append(dialog);
dialog.querySelector("#ll-cancel").onclick=()=>dialog.close();
const form=dialog.querySelector("form"),status=dialog.querySelector("#ll-book-status"),submit=dialog.querySelector("#ll-submit");
let blocked=[];
async function loadBlocks(){try{const r=await fetch(ROOT+"bloqueios.json?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();if(!Array.isArray(data))throw Error();blocked=data;}catch(e){blocked=null;console.warn("Bloqueios indisponíveis; pedidos temporariamente desativados")}}
function isBlocked(d){return blocked===null||blocked.some(b=>b.status!=="liberado"&&d>=b.start&&d<=b.end)}
function key(y,m,d){return y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
function decorate(){
 const grid=document.getElementById("calendar");if(!grid||typeof current==="undefined")return;
 const y=current.getFullYear(),m=current.getMonth();
 grid.querySelectorAll(".day").forEach(day=>{
  const num=day.querySelector(".num");if(!num)return;const old=day.querySelector(".ll-book-button");if(old)old.remove();
  const n=Number(num.textContent);if(!n)return;const date=key(y,m,n);
  if(isBlocked(date)||date<new Date().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"}))return;
  const b=document.createElement("button");b.type="button";b.className="ll-book-button";b.textContent="Solicitar horário";b.setAttribute("aria-label","Solicitar show para "+n+"/"+(m+1)+"/"+y);
  b.onclick=()=>{form.reset();form.elements.date.value=date;status.textContent="";dialog.showModal()};
  day.append(b);
 });
}
const originalDraw=typeof draw==="function"?draw:null;
if(originalDraw){draw=function(){originalDraw();decorate()};decorate()}
async function loadApproved(){try{const r=await fetch(API+"?action=approved",{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();if(typeof shows!=="undefined"&&Array.isArray(data.shows)){const known=new Set(shows.map(x=>[x.date,x.time,x.city].join("|")));for(const item of data.shows){const k=[item.date,item.time,item.city].join("|");if(!known.has(k)){shows.push(item);known.add(k)}}draw()}}catch(e){console.warn("Não foi possível sincronizar pré-reservas aprovadas")}}\nloadBlocks().then(()=>{if(typeof draw==="function")draw()});loadApproved();setInterval(loadApproved,60000);
setInterval(()=>loadBlocks().then(()=>{if(typeof draw==="function")draw()}),300000);
form.onsubmit=async e=>{
 e.preventDefault();submit.disabled=true;status.textContent="Enviando solicitação...";
 try{const values=Object.fromEntries(new FormData(form));const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,action:"request"})});const result=await r.json();if(!r.ok)throw Error(result.error||"Falha no envio");status.textContent="Pedido recebido! Aguarde a confirmação da equipe.";form.reset();form.elements.date.value=values.date;}
 catch(err){status.textContent=err.message||"Não foi possível enviar. Tente novamente."}
 finally{submit.disabled=false}
};
})();