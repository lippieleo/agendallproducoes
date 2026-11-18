/* Bloqueios publicados pelo painel da agenda; não exibe motivos internos. */
(function(){
  'use strict';
  const SOURCE='https://raw.githubusercontent.com/lippieleo/site-lippi-e-leo/main/agenda/bloqueios.json';
  const CACHE='lippi_leo_bloqueios_publicos_v1';
  const calendar=document.getElementById('calendar');
  if(!calendar)return;
  let ranges=[];

  function normalize(value){
    if(!Array.isArray(value))throw new Error('Lista de bloqueios inválida');
    return value.filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.start||''))&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.end||''))&&x.end>=x.start)
      .map(x=>({start:String(x.start),end:String(x.end),status:String(x.status||'bloqueado')}));
  }
  function blocked(date){
    return ranges.some(x=>x.status!=='liberado'&&date>=x.start&&date<=x.end);
  }
  function dateForCell(cell){
    const number=Number(cell.querySelector('.num')?.textContent);
    if(!Number.isInteger(number)||number<1||number>31)return '';
    return dateKey(current.getFullYear(),current.getMonth(),number);
  }
  function decorateCalendar(){
    for(const cell of calendar.querySelectorAll('.day:not(.empty)')){
      const unavailable=blocked(dateForCell(cell));
      cell.classList.toggle('agenda-blocked',unavailable);
      const tag=cell.querySelector('.agenda-blocked-tag');
      if(unavailable){
        cell.title='Data bloqueada para agendamentos';
        if(!tag){
          const label=document.createElement('span');
          label.className='agenda-blocked-tag';
          label.textContent='BLOQUEADO';
          label.setAttribute('aria-label','Data bloqueada');
          cell.append(label);
        }
      }else{
        if(tag)tag.remove();
        if(cell.title==='Data bloqueada para agendamentos')cell.removeAttribute('title');
      }
    }
  }
  const style=document.createElement('style');
  style.textContent=[
    '#calendar .day.agenda-blocked{background:rgba(70,13,23,.93)!important;border:1px solid rgba(243,92,107,.75)!important;cursor:not-allowed!important}',
    '#calendar .day.agenda-blocked .agenda-blocked-tag{position:absolute;z-index:15;left:2px;right:2px;bottom:2px;min-height:17px;display:flex;align-items:center;justify-content:center;border-radius:3px;background:#a52035;color:#fff;font-size:9px;line-height:12px;font-weight:900;letter-spacing:.1px;text-shadow:0 1px 2px #000;pointer-events:none}',
    '@media(max-width:700px){#calendar .day.agenda-blocked .agenda-blocked-tag{font-size:8px;min-height:16px;letter-spacing:0}}'
  ].join('\n');
  document.head.append(style);

  try{
    const cached=JSON.parse(localStorage.getItem(CACHE)||'null');
    if(cached)ranges=normalize(cached);
  }catch(err){console.warn('Cache de bloqueios não disponível',err)}

  const observer=new MutationObserver(decorateCalendar);
  observer.observe(calendar,{childList:true});
  decorateCalendar();

  async function refreshBlocks(){
    try{
      const response=await fetch(SOURCE+'?v='+Date.now(),{cache:'no-store'});
      if(!response.ok)throw new Error('Bloqueios: HTTP '+response.status);
      const updated=normalize(await response.json());
      ranges=updated;
      try{localStorage.setItem(CACHE,JSON.stringify(updated))}catch(e){/* cache opcional */}
      decorateCalendar();
    }catch(err){console.warn('Não foi possível atualizar bloqueios; preservando a última leitura',err)}
  }
  refreshBlocks();
  setInterval(()=>{if(!document.hidden)refreshBlocks()},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBlocks()});
  window.addEventListener('focus',refreshBlocks);

  function notice(){
    window.alert('Esta data está bloqueada pela produção e não está disponível para agendamentos.');
  }
  calendar.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('.day:not(.empty)'):null;
    if(!target||!calendar.contains(target))return;
    if(!blocked(dateForCell(target)))return;
    if(event.target instanceof Element&&event.target.closest('.show-entry'))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    notice();
  },true);
  document.addEventListener('agenda:request-booking',event=>{
    if(!blocked(String(event.detail?.date||'')))return;
    event.stopImmediatePropagation();
    notice();
  },true);
  document.addEventListener('submit',event=>{
    const form=document.getElementById('booking-form');
    if(!form||event.target!==form)return;
    const value=String(form.elements.namedItem('date')?.value||'');
    if(!blocked(value))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const message=document.getElementById('booking-message');
    if(message)message.textContent='Data bloqueada pela produção. Escolha outra data.';
  },true);
})();
