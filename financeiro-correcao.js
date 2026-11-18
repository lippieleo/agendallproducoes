/* Painel financeiro — cartões para localizar divergências e editar lançamentos existentes. */
(function(){
 'use strict';
 const chaves=[
  {id:'dashLucro',titulo:'Lucro operacional dos shows',filtro:'todos'},
  {id:'dashLippi',titulo:'Parte calculada do Lippi',filtro:'todos'},
  {id:'dashLeo',titulo:'Parte calculada do Léo',filtro:'todos'},
  {id:'dashPendente',titulo:'Cachês a receber',filtro:'pendentes'},
  {id:'dashPessoal',titulo:'Shows classificados como pessoa física',filtro:'pessoal'},
  {id:'dashEmpresa',titulo:'Shows classificados como empresa',filtro:'empresa'},
  {id:'dashIndefinido',titulo:'Shows sem classificação de faturamento',filtro:'nao_classificado'}
 ];
 const el=id=>document.getElementById(id);
 function node(tag,classe,conteudo){
   const elemento=document.createElement(tag);
   if(classe)elemento.className=classe;
   if(conteudo!==undefined)elemento.textContent=conteudo;
   return elemento;
 }
 function iniciar(){
  const painel=el('dashboard'),tabela=el('showExtrato'),mes=el('mes'),app=el('app');
  if(!painel||!tabela||!mes||!app||painel.dataset.correcoesAtivas)return;
  painel.dataset.correcoesAtivas='1';

  const detalhes=node('section','fin-correcao');
  detalhes.id='fin-correcao';
  detalhes.hidden=true;
  detalhes.setAttribute('aria-label','Shows que compõem o valor selecionado');
  detalhes.setAttribute('role','region');
  const topo=node('div','fin-cor-topo');
  const cabecalho=node('div');
  const titulo=node('h3',null,'Detalhamento');
  titulo.id='fin-cor-titulo';
  titulo.tabIndex=-1;
  const explicacao=node('p','muted','Toque em Corrigir show para ajustar os registros que formam esse total.');
  const fechar=node('button','secondary','Fechar');
  fechar.type='button';fechar.setAttribute('aria-label','Fechar detalhamento');
  fechar.addEventListener('click',()=>{
    detalhes.hidden=true;
    if(ultimoCartao)ultimoCartao.focus();
  });
  cabecalho.append(titulo,explicacao);topo.append(cabecalho,fechar);
  const conteudo=node('div','fin-cor-conteudo');
  detalhes.append(topo,conteudo);
  painel.append(detalhes);
  let ultimoCartao=null,ativo=null;

  function acessarShow(item,etapa){
    const tab=el('fin-tab-shows');
    if(tab)tab.click();
    try{
      if(typeof abrirShow!=='function'||typeof agendaKey!=='function')throw Error('Abertura do show indisponível.');
      abrirShow(agendaKey(item));
      const escolha=el('fin-stage-tab-'+(etapa||'cache'));
      if(escolha)escolha.click();
    }catch(e){
      const mensagem=el('msg');
      if(mensagem)mensagem.textContent='Não foi possível abrir o show: '+(e.message||e);
    }
  }
  function resumoShow(reg,origemCartao){
    const somaDoShow=calc(reg);
    const arr=[
      'Cachê '+money(somaDoShow.combinado),
      'Recebido '+money(somaDoShow.receb),
      'Despesas '+money(somaDoShow.desp),
      'Lucro '+money(somaDoShow.lucro),
      'A receber '+money(somaDoShow.receber)
    ];
    if(origemCartao==='dashLippi'||origemCartao==='dashLeo')arr.push('Parte 50% '+money(somaDoShow.lucro/2));
    return arr;
  }
  function mostrar(id,cartao,rolar=true){
    const config=chaves.find(x=>x.id===id);
    if(!config)return;
    ativo=id;ultimoCartao=cartao||ultimoCartao;
    const mesSelecionado=mes.value;
    let relacionados=shows.filter(x=>String(x.data_show||'').startsWith(mesSelecionado));
    if(config.filtro==='pendentes')relacionados=relacionados.filter(x=>calc(x).receber>0);
    else if(config.filtro!=='todos')relacionados=relacionados.filter(x=>origem(x)===config.filtro);
    relacionados.sort((a,b)=>String(a.data_show||'').localeCompare(String(b.data_show||'')));
    titulo.textContent=config.titulo+' · '+mesSelecionado.slice(5,7)+'/'+mesSelecionado.slice(0,4);
    conteudo.replaceChildren();
    const observacao=node('p','fin-cor-ajuda',
      'Os totais são calculados a partir dos shows. Para corrigir, altere o cachê, a categoria PF/PJ ou os lançamentos do show correspondente. A divisão de 50% não é um pagamento efetuado.');
    conteudo.append(observacao);
    if(!relacionados.length){
      const vazio=node('p','notice','Nenhum show com financeiro registrado nesta classificação durante o mês selecionado.');
      const ir=node('button','secondary','Escolher um show na agenda');
      ir.type='button';ir.addEventListener('click',()=>el('fin-tab-shows')?.click());
      conteudo.append(vazio,ir);
    }else{
      const contador=node('p','fin-cor-quantidade',relacionados.length+' show'+(relacionados.length!==1?'s':'')+' encontrado'+(relacionados.length!==1?'s':''));
      conteudo.append(contador);
      for(const reg of relacionados){
        const linha=node('article','fin-cor-linha');
        const corpo=node('div','fin-cor-dados');
        const nome=node('strong',null,fmtData(reg.data_show)+' · '+(reg.descricao||'Show'));
        const classificacao=node('div','fin-cor-canal',nomeCanal(origem(reg))+(reg.finalizado_em?' · Finalizado':' · Aberto'));
        const valores=node('div','fin-cor-valores',resumoShow(reg,id).join('   •   '));
        corpo.append(nome,classificacao,valores);
        const item=agendaShows.find(x=>financeiroDaAgenda(x)?.id===reg.id);
        const acao=node('button','secondary fin-cor-abrir',item?'Corrigir show':'Sem vínculo com agenda');
        acao.type='button';
        acao.disabled=!item;
        if(item)acao.addEventListener('click',()=>acessarShow(item,'cache'));
        linha.append(corpo,acao);
        conteudo.append(linha);
      }
    }
    detalhes.hidden=false;
    if(rolar){
      detalhes.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      titulo.focus({preventScroll:true});
    }
  }
  for(const config of chaves){
    const valor=el(config.id);
    const card=valor?.closest('.card');
    if(!card)continue;
    card.classList.add('fin-card-interativo');
    card.tabIndex=0;card.setAttribute('role','button');
    card.setAttribute('aria-label',config.titulo+'. Toque para conferir e corrigir os shows.');
    const aviso=node('span','fin-card-aviso','Conferir e corrigir ›');
    card.append(aviso);
    card.addEventListener('click',()=>mostrar(config.id,card));
    card.addEventListener('keydown',evento=>{
      if(evento.key==='Enter'||evento.key===' '){
        evento.preventDefault();mostrar(config.id,card);
      }
    });
  }
  mes.addEventListener('change',()=>{detalhes.hidden=true;ativo=null});
  el('fin-tab-resumo')?.addEventListener('click',()=>{
    if(ativo&&!detalhes.hidden)mostrar(ativo,ultimoCartao,false);
  });

  // Edita somente um lançamento financeiro já existente do show selecionado.
  const dialog=node('dialog','fin-editor');
  dialog.id='fin-editor';
  dialog.innerHTML=[
    '<form id="fin-edit-form">',
    '<div class="fin-editor-cab"><h2 id="fin-editor-titulo">Corrigir lançamento</h2><p class="muted" id="fin-editor-contexto"></p></div>',
    '<div class="fin-edit-grid">',
    '<div><label for="fin-edit-valor">Valor (R$)</label><input id="fin-edit-valor" type="number" min="0.01" step="0.01" required></div>',
    '<div><label for="fin-edit-data">Data do lançamento</label><input id="fin-edit-data" type="date" required></div>',
    '<div><label for="fin-edit-categoria">Categoria</label><select id="fin-edit-categoria" required></select></div>',
    '<div><label for="fin-edit-forma">Forma de pagamento / recebimento</label><select id="fin-edit-forma"></select></div>',
    '</div>',
    '<div id="fin-edit-fav-wrap"><label for="fin-edit-fav">Músico, favorecido ou descrição</label><input id="fin-edit-fav" maxlength="200"></div>',
    '<div><label for="fin-edit-obs">Observações</label><input id="fin-edit-obs" maxlength="400"></div>',
    '<p id="fin-edit-msg" class="fin-edit-msg" role="status" aria-live="polite"></p>',
    '<div class="fin-edit-botoes"><button type="button" class="secondary" id="fin-edit-cancelar">Cancelar</button>',
    '<button type="submit" id="fin-edit-salvar">Salvar correção</button></div>',
    '</form>'
  ].join('');
  document.body.append(dialog);
  const formulario=el('fin-edit-form'),campoCategoria=el('fin-edit-categoria'),campoForma=el('fin-edit-forma'),
    campoValor=el('fin-edit-valor'),campoData=el('fin-edit-data'),campoFav=el('fin-edit-fav'),
    campoObs=el('fin-edit-obs'),wrapFav=el('fin-edit-fav-wrap'),msgEdit=el('fin-edit-msg');
  let idMov=null;

  function opcoes(select,valores,atual){
    select.replaceChildren();
    const unicos=[...new Set([...valores,atual].filter(Boolean))];
    for(const valor of unicos){
      const original=valor.label!==undefined?valor:{label:String(valor),value:String(valor)};
      select.add(new Option(original.label,original.value));
    }
    select.value=atual||unicos[0]?.value||'';
  }
  function abrirEditor(id){
    const mov=lanc.find(x=>String(x.id)===String(id));
    const reg=showEscolhido?financeiroDaAgenda(showEscolhido):null;
    if(!mov||!reg||String(mov.caixa_show_id)!==String(reg.id))return;
    if(reg.finalizado_em){
      const mensagem=el('showMsg');
      if(mensagem)mensagem.textContent='Para corrigir este lançamento, reabra primeiro o financeiro do show.';
      return;
    }
    if(!['despesa','recebimento'].includes(mov.tipo))return;
    idMov=mov.id;
    el('fin-editor-titulo').textContent=mov.tipo==='despesa'?'Editar despesa':'Editar recebimento';
    el('fin-editor-contexto').textContent=fmtData(showEscolhido.date)+' · '+showEscolhido.city;
    campoValor.value=String(mov.valor);
    campoData.value=mov.data_lancamento;
    campoFav.value=mov.favorecido||'';
    campoObs.value=mov.observacoes||'';
    const src=el(mov.tipo==='despesa'?'categoria':'entradaCategoria');
    opcoes(campoCategoria,[...src.options].map(o=>({label:o.text,value:o.value})),mov.categoria||src.options[0]?.value);
    const formaSrc=el(mov.tipo==='despesa'?'forma':'entradaForma');
    opcoes(campoForma,[...formaSrc.options].map(o=>({label:o.text,value:o.value})),mov.forma||'outro');
    wrapFav.hidden=mov.tipo==='recebimento';
    campoFav.required=mov.tipo==='despesa';
    msgEdit.textContent='Confirme os dados antes de salvar. A alteração atualiza o resumo e os extratos.';
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    campoValor.focus();
  }
  function fecharEditor(){
    if(dialog.open&&typeof dialog.close==='function')dialog.close();
    else dialog.removeAttribute('open');
    idMov=null;
  }
  el('fin-edit-cancelar').addEventListener('click',fecharEditor);
  dialog.addEventListener('close',()=>{idMov=null});
  formulario.addEventListener('submit',async evento=>{
    evento.preventDefault();
    const atual=lanc.find(x=>String(x.id)===String(idMov));
    const reg=showEscolhido?financeiroDaAgenda(showEscolhido):null;
    if(!atual||!reg||reg.finalizado_em||String(atual.caixa_show_id)!==String(reg.id)){
      msgEdit.textContent='O lançamento não está disponível para edição. Atualize os dados e tente novamente.';
      return;
    }
    const valor=Number(campoValor.value),data=campoData.value,categoria=campoCategoria.value,
      forma=campoForma.value,favorecido=campoFav.value.trim(),observacoes=campoObs.value.trim();
    if(!Number.isFinite(valor)||valor<=0||!/^\d{4}-\d{2}-\d{2}$/.test(data)||!categoria||!forma||
      (atual.tipo==='despesa'&&!favorecido)){
      msgEdit.textContent='Confira o valor, a data, a categoria e o favorecido.';
      return;
    }
    const corpo={valor,data_lancamento:data,categoria,forma,observacoes:observacoes||null};
    if(atual.tipo==='despesa')corpo.favorecido=favorecido;
    const salvar=el('fin-edit-salvar');
    salvar.disabled=true;msgEdit.textContent='Salvando a correção…';
    try{
      const filtro='?id=eq.'+encodeURIComponent(atual.id)+'&caixa_show_id=eq.'+encodeURIComponent(reg.id);
      await requisicao('/rest/v1/caixa_lancamentos'+filtro,{method:'PATCH',auth:true,body:corpo});
      const conferir=await requisicao('/rest/v1/caixa_lancamentos'+filtro+'&select=id,valor,data_lancamento,categoria,forma,favorecido,observacoes',{auth:true});
      const salvo=conferir?.[0];
      if(!salvo||Math.abs(Number(salvo.valor)-valor)>0.005||salvo.data_lancamento!==data||
        salvo.categoria!==categoria||salvo.forma!==forma||(atual.tipo==='despesa'&&salvo.favorecido!==favorecido)){
        throw Error('A alteração não pôde ser confirmada. Verifique o lançamento antes de tentar novamente.');
      }
      let aviso='';
      if(atual.tipo==='despesa'&&categoria==='Músicos'&&typeof MUSICOS!=='undefined'&&MUSICOS.includes(favorecido)){
        try{
          const regAtual=await requisicao('/rest/v1/caixa_shows?select=id,musicos_presentes&id=eq.'+encodeURIComponent(reg.id),{auth:true});
          const presentes=Array.isArray(regAtual?.[0]?.musicos_presentes)?regAtual[0].musicos_presentes:[];
          if(!presentes.includes(favorecido)){
            await requisicao('/rest/v1/caixa_shows?id=eq.'+encodeURIComponent(reg.id),{
              method:'PATCH',auth:true,body:{musicos_presentes:[...presentes,favorecido]}
            });
          }
        }catch(_){aviso=' Confira também a lista de músicos participantes do show.'}
      }
      fecharEditor();
      await refresh();
      const destino=el('showMsg');
      if(destino)destino.textContent='✓ Lançamento corrigido com sucesso.'+aviso;
    }catch(err){
      msgEdit.textContent='Não foi possível concluir: '+(err.message||err);
    }finally{salvar.disabled=false}
  });

  function incluirEdicao(){
    for(const excluir of tabela.querySelectorAll('button.remover[data-id]')){
      const celula=excluir.parentElement;
      if(celula.querySelector('.fin-editar'))continue;
      const id=excluir.dataset.id;
      const dado=lanc.find(x=>String(x.id)===String(id));
      if(!dado||!['despesa','recebimento'].includes(dado.tipo))continue;
      const editar=node('button','secondary mini fin-editar','Editar');
      editar.type='button';
      editar.addEventListener('click',()=>abrirEditor(id));
      celula.insertBefore(editar,excluir);
    }
  }
  incluirEdicao();
  new MutationObserver(incluirEdicao).observe(tabela,{childList:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});
 else iniciar();
})();
