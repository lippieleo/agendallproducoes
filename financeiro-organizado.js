/* Layout organizado do financeiro. Mantém a lógica de autenticação, cálculos e gravação existente. */
(function(){
  'use strict';
  function iniciar(){
    const app=document.getElementById('app');
    const agenda=document.getElementById('agendaBox');
    const detalhe=document.getElementById('detalhe');
    const dashboard=document.getElementById('dashboard');
    const relatorio=document.getElementById('geradorExtrato');
    const mes=document.getElementById('mes');
    const recarregar=document.getElementById('recarregar');
    const sair=document.getElementById('sair');
    if(!app||!agenda||!detalhe||!dashboard||!relatorio||!mes||!recarregar||!sair||app.dataset.finOrganizado)return;
    app.dataset.finOrganizado='1';

    const resumoNumeros=app.querySelector(':scope > section.grid');
    const secoes=[...app.children].filter(x=>x.tagName==='SECTION');
    const extratoMensal=secoes.find(x=>x!==dashboard&&x!==agenda&&x!==detalhe&&x!==relatorio&&x.querySelector('#extrato'));
    if(!resumoNumeros||!extratoMensal)return;
    resumoNumeros.classList.add('fin-overview-summary');

    // Move os controles reais, sem recriar entradas ou perder eventos de atualização.
    const filtrosAntigos=agenda.querySelector(':scope > .grid');
    const toolbar=document.createElement('div');
    toolbar.className='fin-toolbar';
    toolbar.setAttribute('aria-label','Controles do painel financeiro');
    const blocoMes=document.createElement('div');
    blocoMes.className='fin-month';
    const labelMes=document.createElement('label');
    labelMes.htmlFor='mes';labelMes.textContent='Mês de referência';
    blocoMes.append(labelMes,mes);
    const acoes=document.createElement('div');
    acoes.className='fin-toolbar-actions';
    recarregar.textContent='Atualizar dados';
    acoes.append(recarregar,sair);
    toolbar.append(blocoMes,acoes);
    if(filtrosAntigos)filtrosAntigos.remove();

    const nav=document.createElement('nav');
    nav.className='fin-nav';
    nav.setAttribute('aria-label','Áreas do painel financeiro');
    nav.setAttribute('role','tablist');
    const views=[
      {id:'resumo',label:'Resumo financeiro',title:'Visão geral',subtitle:'Confira os valores do mês, resultados e movimentações de caixa.'},
      {id:'shows',label:'Shows e lançamentos',title:'Gestão dos shows',subtitle:'Escolha um show para cadastrar cachê, recebimentos, despesas e fazer o fechamento.'},
      {id:'relatorios',label:'Relatórios e extratos',title:'Relatórios financeiros',subtitle:'Consulte períodos, canais PF/PJ e gere arquivos PDF ou CSV.'}
    ];
    const buttons=new Map();
    const panels=new Map();
    for(const item of views){
      const button=document.createElement('button');
      button.type='button';button.className='fin-tab';button.textContent=item.label;
      button.id='fin-tab-'+item.id;
      button.setAttribute('role','tab');
      button.setAttribute('aria-controls','fin-view-'+item.id);
      nav.append(button);buttons.set(item.id,button);
      const panel=document.createElement('section');
      panel.className='fin-view';panel.id='fin-view-'+item.id;
      panel.setAttribute('role','tabpanel');
      panel.setAttribute('aria-labelledby',button.id);
      const heading=document.createElement('div');
      heading.className='fin-page-intro';
      const h=document.createElement('h2');h.textContent=item.title;
      const p=document.createElement('p');p.textContent=item.subtitle;
      heading.append(h,p);panel.append(heading);
      panels.set(item.id,panel);
    }
    const summary=panels.get('resumo');
    summary.append(resumoNumeros);
    const quick=document.createElement('div');quick.className='fin-jump-links';
    const goShows=document.createElement('button');goShows.type='button';goShows.textContent='Gerenciar um show';
    const goReports=document.createElement('button');goReports.type='button';goReports.textContent='Consultar extratos';
    quick.append(goShows,goReports);summary.append(quick,dashboard,extratoMensal);
    panels.get('shows').append(agenda,detalhe);
    panels.get('relatorios').append(relatorio);
    app.prepend(toolbar,nav);
    for(const {id} of views)app.append(panels.get(id));

    let active='resumo';
    function mostrar(id,scroll){
      if(!panels.has(id))return;
      active=id;
      for(const [key,panel] of panels){
        const on=key===id;
        panel.hidden=!on;
        buttons.get(key).setAttribute('aria-selected',String(on));
        buttons.get(key).tabIndex=on?0:-1;
      }
      if(scroll){
        const top=nav.getBoundingClientRect().top+window.scrollY-12;
        window.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      }
    }
    for(const [id,button] of buttons)button.addEventListener('click',()=>mostrar(id,false));
    goShows.addEventListener('click',()=>mostrar('shows',true));
    goReports.addEventListener('click',()=>mostrar('relatorios',true));
    nav.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const ids=views.map(x=>x.id);let position=ids.indexOf(active);
      if(event.key==='ArrowRight')position=(position+1)%ids.length;
      else if(event.key==='ArrowLeft')position=(position+ids.length-1)%ids.length;
      else if(event.key==='Home')position=0;
      else position=ids.length-1;
      event.preventDefault();mostrar(ids[position],false);buttons.get(ids[position]).focus();
    });

    for(const wrapper of app.querySelectorAll('div[style*="overflow-x:auto"]')){
      wrapper.classList.add('fin-table-wrap');
      wrapper.removeAttribute('style');
    }

    // Busca local: filtra apenas linhas já carregadas; não consulta nem modifica registros.
    const tabelaAgenda=document.getElementById('agendaBody');
    if(tabelaAgenda){
      const busca=document.createElement('div');busca.className='fin-show-search';
      const rotulo=document.createElement('label');
      rotulo.htmlFor='finBuscaShow';rotulo.textContent='Buscar show deste mês';
      const campo=document.createElement('input');
      campo.type='search';campo.id='finBuscaShow';campo.autocomplete='off';
      campo.placeholder='Cidade, local, data ou músico';
      busca.append(rotulo,campo);
      const tabela=agenda.querySelector('.fin-table-wrap');
      if(tabela)agenda.insertBefore(busca,tabela);
      function filtrar(){
        const valor=campo.value.toLocaleLowerCase('pt-BR').trim();
        for(const linha of tabelaAgenda.querySelectorAll('tr')){
          const selecionavel=Boolean(linha.querySelector('button.selecionar'));
          linha.hidden=selecionavel&&valor&&!linha.textContent.toLocaleLowerCase('pt-BR').includes(valor);
        }
      }
      campo.addEventListener('input',filtrar);
      new MutationObserver(filtrar).observe(tabelaAgenda,{childList:true});
    }

    // Cadastro por show, dividido em passos; todos os formulários originais permanecem.
    const titulos=[...detalhe.children].filter(el=>el.tagName==='H3');
    if(titulos.length===5&&
      titulos[0].textContent.includes('Cachê contratado')&&
      titulos[1].textContent.includes('Entradas recebidas')&&
      titulos[2].textContent.includes('Registrar somente saídas')&&
      titulos[3].textContent.includes('Extrato deste show')){
      const aviso=detalhe.querySelector('#showMsg');
      const navegacao=document.createElement('nav');navegacao.className='fin-step-nav';
      navegacao.setAttribute('aria-label','Etapas do financeiro do show');
      navegacao.setAttribute('role','tablist');
      if(aviso)detalhe.insertBefore(aviso,titulos[0]);
      const items=[...detalhe.children],inicios=titulos.map(h=>items.indexOf(h));
      const tabs=[
        {id:'cache',label:'1. Cachê'},
        {id:'entrada',label:'2. Recebimentos'},
        {id:'despesa',label:'3. Despesas'},
        {id:'fechar',label:'4. Conferir e fechar'}
      ];
      const stepButtons=new Map(),steps=new Map();
      const conteudo=document.createElement('div');conteudo.className='fin-step-content';
      tabs.forEach((tab,i)=>{
        const btn=document.createElement('button');btn.type='button';btn.textContent=tab.label;
        btn.id='fin-stage-tab-'+tab.id;btn.setAttribute('role','tab');
        btn.setAttribute('aria-controls','fin-stage-'+tab.id);
        navegacao.append(btn);stepButtons.set(tab.id,btn);
        const stage=document.createElement('div');stage.id='fin-stage-'+tab.id;
        stage.className='fin-step';stage.setAttribute('role','tabpanel');
        stage.setAttribute('aria-labelledby',btn.id);
        const inicio=inicios[i],fim=i===tabs.length-1?items.length:inicios[i+1];
        for(const node of items.slice(inicio,fim))stage.append(node);
        conteudo.append(stage);steps.set(tab.id,stage);
      });
      detalhe.append(navegacao,conteudo);
      function mostrarEtapa(id){
        for(const [key,node] of steps){
          const on=key===id;node.hidden=!on;
          stepButtons.get(key).setAttribute('aria-selected',String(on));
          stepButtons.get(key).tabIndex=on?0:-1;
        }
      }
      for(const [id,button] of stepButtons)button.addEventListener('click',()=>mostrarEtapa(id));
      mostrarEtapa('cache');
      if(tabelaAgenda)tabelaAgenda.addEventListener('click',event=>{
        if(event.target.closest('button.selecionar'))mostrarEtapa('cache');
      },true);
    }

    // Detalhes extensos dos relatórios ficam recolhidos, sem perder exportação ou dados.
    const result=document.getElementById('relResultado');
    if(result){
      const parts=[...result.children];
      const heads=parts.filter(x=>x.tagName==='H3');
      for(let i=1;i<heads.length;i++){
        const start=parts.indexOf(heads[i]);
        const end=i+1<heads.length?parts.indexOf(heads[i+1]):parts.length;
        const details=document.createElement('details');
        details.className='fin-report-details';
        const summaryTitle=document.createElement('summary');summaryTitle.textContent=heads[i].textContent;
        details.append(summaryTitle);
        for(const node of parts.slice(start+1,end))details.append(node);
        heads[i].replaceWith(details);
      }
    }
    mostrar('resumo',false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
  else iniciar();
})();
