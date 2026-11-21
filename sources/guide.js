'use strict';
const data = JSON.parse(document.getElementById('guide-data').textContent);
const main = document.getElementById('main');
const navNames = {cartas:'Cartas',drops:'Drops',equips:'Equipamentos',duelistas:'Duelistas',fusoes:'Fusões',rituais:'Rituais',inicio:'Deck inicial',campanha:'Campanha',changelog:'Changelog',sobre:'Instalação'};
const cards = new Map(data.cards.map(card => [card.id, card]));
const cardsByRef = new Map(data.cards.map(card => [card.ref, card]));
const duelists = new Map(data.duelists.map(duelist => [duelist.id, duelist]));
const cardDrops = new Map(data.cards.map(card => [card.id, []]));
const cardDecks = new Map(data.cards.map(card => [card.id, []]));
for (const duelist of data.duelists) {
  for (const [card, weight] of duelist.deck) cardDecks.get(card).push([duelist.id, weight]);
  for (const pool of duelist.drops) for (const [card, weight] of pool.cards) cardDrops.get(card).push([duelist.id, pool.rank, weight]);
}
const number = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', {style:'percent', maximumFractionDigits:4});
const labelWeight = weight => `${number.format(weight)} / 2.048`;
const odds = weight => percent.format(weight / 2048);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = text => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
function cardLink(id, withArt = false, withStats = true) {
  const card = cards.get(id);
  if (!card) return '—';
  const picture = withArt && card.thumbnail ? `<img class="recipe-art" src="${escapeHtml(card.thumbnail)}" width="46" height="44" loading="lazy" alt="">` : '';
  const link = `<a${withArt ? ' class="recipe-card"' : ''} href="#carta/${encodeURIComponent(card.ref)}">${picture}<span>${escapeHtml(card.name)}</span></a>`;
  if (!withStats || card.attack == null || card.defense == null) return link;
  return `<div class="card-result">${link}<span class="card-result-stats"><span>ATK: ${number.format(card.attack)}</span><span>DEF: ${number.format(card.defense)}</span></span></div>`;
}
const recipeCard = id => cardLink(id, true);
const duelistLink = id => `<a href="#duelista/${id}">${escapeHtml(duelists.get(id).name)}</a>`;
const matchesCard = (id,q) => {const c = cards.get(id);return c && (normalize(c.name).includes(q) || String(id) === q || normalize(c.ref) === q);};
const img = (path, name) => path ? `<img class="art" src="${escapeHtml(path)}" alt="${escapeHtml(name)}">` : '';
const portrait = duelist => img(duelist.portrait ? duelist.portrait : '', duelist.name);
const backLink = (route, label) => `<a data-back class="back-link" href="${escapeHtml(history.state?.returnTo || `#${route}`)}">← Voltar para ${escapeHtml(history.state?.from || label)}</a>`;
const row = values => `<tr>${values.map((value,i)=>`<td${i && typeof value==='number'?' class="number"':''}>${value}</td>`).join('')}</tr>`;
const table = (headers, rows, empty='Nenhum resultado.') => rows.length ? `<div class="scroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="empty">${escapeHtml(empty)}</p>`;
const field = (id,label,placeholder) => `<label for="${id}">${label}<input id="${id}" type="search" placeholder="${placeholder}" autocomplete="off"></label>`;
const select = (id,label,options) => `<label for="${id}">${label}<select id="${id}">${options.map(([key,value])=>`<option value="${escapeHtml(key)}">${escapeHtml(value)}</option>`).join('')}</select></label>`;
function download(name, headers, rows) {
  const line = fields => fields.map(value=>`"${String(value ?? '').replaceAll('"','""')}"`).join(';');
  const url = URL.createObjectURL(new Blob(['\ufeff', [line(headers), ...rows.map(line)].join('\r\n')], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = `${name}.csv`; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
let activePager;
function paged(filters, names, render, toCsv=null, sortValues=toCsv?.[1]) {
  const area = document.getElementById('results');
  let page = 0;
  let sortColumn = null, sortDirection = 1;
  const collator = new Intl.Collator('pt-BR', {numeric:true, sensitivity:'base'});
  function compareValues(a, b) {
    const emptyA = a == null || a === '', emptyB = b == null || b === '';
    // Missing ATK, DEF or shop data stay at the end in both directions.
    if (emptyA || emptyB) return Number(emptyA) - Number(emptyB);
    return sortDirection * (typeof a === 'number' && typeof b === 'number' ? a-b : collator.compare(String(a),String(b)));
  }
  const pageSizes = [50, 75, 100];
  let size = pageSizes[0];
  function renderPage() {
    let rows = filters();
    if (sortValues && sortColumn !== null) rows = rows.map(item=>({item,value:sortValues(item)[sortColumn]}))
      .sort((a,b)=>compareValues(a.value,b.value)).map(entry=>entry.item);
    const total = Math.max(1, Math.ceil(rows.length/size));
    page = Math.min(page, total-1);
    area.innerHTML = table(names, rows.slice(page*size,(page+1)*size).map(render)) +
      `<div class="paging"><span class="meta">${number.format(rows.length)} resultados</span>${select('page-size','Itens por página',pageSizes.map(count=>[count,count]))}${toCsv ? '<button id="export">Baixar CSV</button>' : ''}<button id="prev" ${page===0?'disabled':''}>Anterior</button><span class="meta">${page+1} de ${total}</span><button id="next" ${page+1===total?'disabled':''}>Próxima</button></div>`;
    if (sortValues) area.querySelectorAll('thead th').forEach((header,column)=>{
      const selected = sortColumn === column;
      const next = selected && sortDirection === 1 ? 'decrescente' : 'crescente';
      header.setAttribute('aria-sort', selected ? (sortDirection === 1 ? 'ascending' : 'descending') : 'none');
      header.innerHTML = `<button class="sort-column" type="button" aria-label="${escapeHtml(names[column])}: ordenar em ordem ${next}">${escapeHtml(names[column])}<span aria-hidden="true">${selected ? (sortDirection === 1 ? '▲' : '▼') : '↕'}</span></button>`;
      header.querySelector('button').onclick = ()=>{
        const horizontal = area.querySelector('.scroll').scrollLeft;
        sortDirection = selected ? -sortDirection : 1;
        sortColumn = column; page = 0; renderPage();
        area.querySelector('.scroll').scrollLeft = horizontal;
        area.querySelectorAll('.sort-column')[column].focus({preventScroll:true});
      };
    });
    const sizeSelect = document.getElementById('page-size');
    sizeSelect.value = String(size);
    sizeSelect.oninput = () => {
      size = Number(sizeSelect.value);
      page = 0;
      renderPage();
      document.getElementById('page-size').focus({preventScroll:true});
    };
    document.getElementById('prev').onclick = () => {page--;renderPage();};
    document.getElementById('next').onclick = () => {page++;renderPage();};
    if (toCsv) document.getElementById('export').onclick = () => download(toCsv[0],names,rows.map(toCsv[1]));
  }
  for (const input of main.querySelectorAll('input,select')) input.oninput = () => {page=0;renderPage();};
  activePager = {get page() {return page;}, go(index) {page=index;renderPage();},
    get sort() {return sortColumn === null ? null : {column:sortColumn,direction:sortDirection};},
    restoreSort(sort) {
      if (!sortValues || !sort || !Number.isInteger(sort.column) || sort.column < 0 || sort.column >= names.length) return;
      sortColumn=sort.column;sortDirection=sort.direction === -1 ? -1 : 1;page=0;renderPage();
    }};
  renderPage();
}
const query = id => normalize(document.getElementById(id).value.trim());
function catalog() {
  const types = [...new Set(data.cards.map(c=>c.type))].sort();
  main.innerHTML = `<h2>Cartas</h2><p class="notice muted">As cartas do FMII usam os passwords e custos da planilha de referência. Um traço indica ausência de compra por password.</p><div class="tools">${field('q','Nome ou ID','Ex. Mystical Elf')}${select('origin','Origem',[['','Todas'],['original','Original'],['fmii','Expansão FMII']])}${select('type','Tipo',[['','Todos'],...types.map(t=>[t,t])])}</div><div id="results"></div>`;
  paged(()=>{const q=query('q'),o=document.getElementById('origin').value,t=document.getElementById('type').value;return data.cards.filter(c=>matchesCard(c.id,q)&&(!o || c.expansion===(o==='fmii'))&&(!t||c.type===t));},
    ['ID','Carta','Origem','Tipo','ATK','DEF','Password','Custo (Star Chips)'],c=>row([c.id,cardLink(c.id,false,false),c.expansion?'FMII':'Original',escapeHtml(c.type),c.attack??'-',c.defense??'-',c.password?`<code>${escapeHtml(c.password)}</code>`:'-',c.starchips!=null?number.format(c.starchips):'-']),
    ['cartas-fmii-recomp',c=>[c.id,c.name,c.expansion?'FMII':'Original',c.type,c.attack,c.defense,c.password,c.starchips]]);
}
const dropHeaders = ['Carta','Duelista','Rank','Peso','Chance por sorteio'];
const dropRow = ([id,duelist,rank,weight], withArt = false) => row([cardLink(id,withArt),duelistLink(duelist),escapeHtml(rank),labelWeight(weight),odds(weight)]);
function drops() {
  const rankOptions = data.duelists[0].drops.map(p=>[p.rank,p.rank]);
  main.innerHTML = `<h2>Drops</h2><p class="notice muted">As cartas do FMII seguem a planilha Compilation - FM II. As cartas originais ausentes no FMII também usam os drops do disco original quando o duelista mantém o nome ou tem correspondência definida; Kaiba corresponde a Seto Kaiba e Pegasus a Maximillion Pegasus. As demais correspondências e as cartas sem drop no disco aguardam definição. Os drops estão disponíveis desde a primeira vitória. As chances são por carta sorteada, e a quantidade de cartas por vitória é configurada no Recomp.</p><div class="tools">${field('q','Carta','Ex. Slifer')}${select('who','Duelista',[['','Todos'],...data.duelists.map(d=>[d.id,d.name])])}${select('rank','Rank',[['','Todos'],...rankOptions])}</div><div id="results"></div>`;
  const filtered = () => {
    const q = query('q');
    const who = document.getElementById('who').value;
    const rank = document.getElementById('rank').value;
    return data.duelists
      .filter(d=>!who || d.id===Number(who))
      .flatMap(d=>d.drops.filter(p=>!rank || p.rank===rank)
        .flatMap(p=>p.cards.filter(([id])=>matchesCard(id,q)).map(([id,w])=>[id,d.id,p.rank,w])))
      .sort((a,b)=>b[3]-a[3]);
  };
  paged(filtered,dropHeaders,drop=>dropRow(drop,true),
    ['drops-fmii-recomp',([id,d,r,w])=>[cards.get(id).name,duelists.get(d).name,r,w,odds(w)]],
    ([id,d,r,w])=>[cards.get(id).name,duelists.get(d).name,r,w,w/2048]);
}
const fusionHeaders = ['Ingrediente 1','Ingrediente 2','Resultado','Origem'];
const hasInheritedFusions = data.fusions.some(fusion=>fusion[3]==='Herdada');
const fusionRow = ([a,b,r,source])=>row([recipeCard(a),recipeCard(b),recipeCard(r),source]);
const ritualHeaders = ['Carta ritual','Tributo 1','Tributo 2','Tributo 3','Resultado','Origem'];
const ritualRow = ([card,a,b,c,result,source])=>row([recipeCard(card),recipeCard(a),recipeCard(b),recipeCard(c),recipeCard(result),source]);
function recipes(ritual, initial='') {
  const headers=ritual?ritualHeaders:fusionHeaders;
  const list=ritual?data.rituals:data.fusions;
  const origins = [['','Todas'],['Original','Original'],['FMII','FMII']];
  if (!ritual && hasInheritedFusions) origins.push(['Herdada','Herdada pelo Recomp']);
  main.innerHTML=`<h2>${ritual?'Rituais':'Fusões'}</h2>${ritual?'':`<p class="notice muted">A receita original prevalece nos pares com resultados diferentes. <a href="#divergencias">Conferir os ${data.conflicts.length} pares</a>.${hasInheritedFusions?' Fusões herdadas usam a carta-base da expansão quando o Recomp procura uma receita.':''}</p>`}<div class="tools">${field('q','Carta','Busque um ingrediente ou resultado')}${select('role','Buscar em',[['','Tudo'],['input','Ingredientes'],['result','Resultado']])}${select('origin','Origem',origins)}${ritual?'':select('power','ATK do resultado',[['','Qualquer'],['one','Menor que o de um ingrediente'],['both','Menor que o dos dois ingredientes']])}</div><div id="results"></div>`;
  document.getElementById('q').value=initial;
  const filtered=()=>{
    const q=query('q'),r=document.getElementById('role').value,o=document.getElementById('origin').value;
    const power=document.getElementById('power')?.value;
    return list.filter(x=>{
      const source=x.at(-1),ids=x.slice(0,-1),values=r==='result'?ids.slice(-1):r==='input'?ids.slice(0,-1):ids;
      if ((o && o!==source)||!values.some(id=>matchesCard(id,q))) return false;
      if (!power) return true;
      const [a,b,result]=ids.map(id=>cards.get(id)?.attack);
      return [a,b,result].every(Number.isFinite)&&result<(power==='both'?Math.min(a,b):Math.max(a,b));
    });
  };
  paged(filtered,headers,ritual?ritualRow:fusionRow,[ritual?'rituais-fmii-recomp':'fusoes-fmii-recomp',x=>[...x.slice(0,-1).map(id=>cards.get(id)?.name??''),x.at(-1)]]);
}
function conflicts() {
  main.innerHTML=`<p>${backLink('fusoes','Fusões')}</p><h2>Pares com resultados diferentes</h2><div class="tools">${field('q','Carta','Ex. Catapult Turtle')}</div><div id="results"></div>`;
  paged(()=>{const q=query('q');return data.conflicts.filter(x=>x.some(id=>matchesCard(id,q)));},
    ['Ingrediente 1','Ingrediente 2','Original','FMII na ISO','Resultado no Recomp'],x=>row(x.map(recipeCard)),
    ['fusoes-divergentes-fmii-recomp',x=>x.map(id=>cards.get(id)?.name??'')]);
}
function equipsPage(selected = '') {
  const options = data.equips.map(e => [cards.get(e.card).ref, cards.get(e.card).name]);
  main.innerHTML = `<h2>Equipamentos do FMII</h2><p class="notice muted">As compatibilidades do FMII foram estendidas às cartas originais ausentes no FMII, conforme tipo, atributo, nível, ATK ou família. As exceções existentes foram preservadas. Esta lista mostra os monstros compatíveis; efeitos e bônus variáveis continuam dependendo das condições do duelo.</p><div class="tools">${field('q','Carta','Ex. Battle Ox')}${select('equip','Equipamento',[['','Todos'],...options])}</div><div id="results"></div>`;
  document.getElementById('equip').value = selected;
  paged(() => {
    const q = query('q'), wanted = document.getElementById('equip').value;
    return data.equips.filter(e => !wanted || cards.get(e.card).ref === wanted)
      .flatMap(e => e.targets.filter(id => !q || matchesCard(id,q) || matchesCard(e.card,q)).map(id => [e.card,id]));
  }, ['Equipamento','Monstro compatível'], pair => row(pair.map(id => cardLink(id,true))),
  ['equipamentos-fmii', pair => pair.map(id => cards.get(id).name)]);
}
function cardPage(card) {
  if (!card) {main.innerHTML='<p>Carta desconhecida. <a href="#cartas">Voltar ao catálogo</a>.</p>';return;}
  const id=card.id;
  const drops=cardDrops.get(id).map(x=>[id,...x]);
  const deck=cardDecks.get(id);
  const fusions=data.fusions.filter(f=>f.slice(0,3).includes(id));
  const rituals=data.rituals.filter(f=>f.slice(0,5).includes(id));
  const equip = data.equips.find(e => e.card === id);
  const compatible = data.equips.filter(e => e.targets.includes(id));
  const equipSection = equip ? `<section><h3>Monstros compatíveis (${equip.targets.length})</h3><p><a href="#equips/${encodeURIComponent(card.ref)}">Consultar todos os monstros que podem receber este equipamento</a></p></section>` : compatible.length ? `<section><h3>Equipamentos do FMII compatíveis (${compatible.length})</h3>${table(['Equipamento'],compatible.map(e => row([cardLink(e.card,true)])))}</section>` : '';
  const stats=[card.type,card.attribute,card.level==null?null:`Nível ${card.level}`,card.attack==null?null:`${card.attack} ATK / ${card.defense} DEF`].filter(Boolean);
  main.innerHTML=`<p>${backLink('cartas','Cartas')}</p><div class="card-head">${img(card.art,card.name)}<div><p class="badge">${card.expansion?'Expansão FMII':'Original'} · ID ${id}</p><h2>${escapeHtml(card.name)}</h2><div class="tagline">${stats.map(s=>`<span>${escapeHtml(s)}</span>`).join('')}</div>${card.stars.length?`<p>Estrelas guardiãs · ${escapeHtml(card.stars.join(' / '))}</p>`:''}<p class="description">${escapeHtml(card.description)}</p>${card.password?`<p>Senha · <code>${escapeHtml(card.password)}</code>${card.starchips!=null?` · ${number.format(card.starchips)} star chips`:''}</p>`:''}${card.expansion?`<small>Referência · ${escapeHtml(card.ref)}</small>`:''}</div></div><div class="sections">${equipSection}<section><h3>Drops (${drops.length})</h3>${table(dropHeaders,drops.map(drop=>dropRow(drop)),'Nenhum duelista oferece esta carta nos dados deste guia.')}</section><section><h3>Decks dos duelistas (${deck.length})</h3>${table(['Duelista','Peso na tabela'],deck.map(([d,w])=>row([duelistLink(d),labelWeight(w)])))}</section><section><h3>Fusões (${fusions.length})</h3>${table(fusionHeaders,fusions.slice(0,40).map(fusionRow))}${fusions.length>40?`<a href="#fusoes/${encodeURIComponent(card.ref)}">Ver todas as fusões da carta</a>`:''}</section><section><h3>Rituais (${rituals.length})</h3>${table(ritualHeaders,rituals.map(ritualRow))}</section></div>`;
}
function duelistList() {
  main.innerHTML=`<h2>Duelistas</h2><div class="tools">${field('q','Nome ou slot','Ex. Pegasus')}</div><div class="grid" id="results"></div>`;
  const render=()=>{const q=query('q');document.getElementById('results').innerHTML=data.duelists.filter(d=>normalize(d.name).includes(q)||String(d.id)===q).map(d=>`<a class="tile" href="#duelista/${d.id}">${portrait(d)}<span><small>Slot ${d.id}</small><br>${escapeHtml(d.name)}</span></a>`).join('')||'<p>Nenhum duelista encontrado.</p>';};
  document.getElementById('q').oninput=render;render();
}
function duelistPage(d) {
  if (!d) {main.innerHTML='<p>Duelista desconhecido. <a href="#duelistas">Ver duelistas</a>.</p>';return;}
  main.innerHTML=`<p>${backLink('duelistas','Duelistas')}</p><div class="card-head">${portrait(d)}<div><p class="badge">Slot ${d.id}</p><h2>${escapeHtml(d.name)}</h2><p>${d.deck.length} cartas possíveis no deck</p></div></div><div class="sections"><section><h3>Deck do FMII</h3><p class="muted">O peso é usado para montar o deck de 40 cartas. O limite de cópias afeta os sorteios seguintes.</p>${table(['Carta','Peso na tabela'],[...d.deck].sort((a,b)=>b[1]-a[1]).map(([id,w])=>row([cardLink(id,true),labelWeight(w)])))}</section><section><h3>Drops por rank</h3>${d.drops.map(p=>`<details><summary>${escapeHtml(p.rank)} · ${p.cards.length} cartas</summary>${p.empty?`<p class="muted">Sorteio sem carta · ${odds(p.empty)}</p>`:''}${table(['Carta','Peso','Chance por sorteio'],[...p.cards].sort((a,b)=>b[1]-a[1]).map(([id,w])=>row([cardLink(id,true),labelWeight(w),odds(w)])))}</details>`).join('')}</section></div>`;
}
function starter() {
  const rows = pools => pools.map((p,i)=>`<details ${i===0?'open':''}><summary>Grupo ${i+1} · ${p.draws} ${p.draws===1?'carta sorteada':'cartas sorteadas'}</summary>${table(['Carta','Peso no grupo'],p.cards.map(([id,w])=>row([cardLink(id,true),labelWeight(w)])))}</details>`).join('');
  main.innerHTML=`<h2>Deck inicial</h2><p class="notice">Uma campanha nova sorteia com chances iguais entre o deck do original e o do FMII. São 40 cartas em ambos.</p><div class="tools">${select('family','Tabela',[['fmii','FMII'],['original','Original']])}</div><div id="results"></div>`;
  const redraw=()=>{document.getElementById('results').innerHTML=rows(document.getElementById('family').value==='fmii'?data.starter:data.originalStarter);};
  document.getElementById('family').oninput=redraw;redraw();
}
function campaignPage() {
  const [wins,rounds,reward]=data.campaign.palace;
  main.innerHTML=`<h2>Campanha</h2><p class="notice">O FMII-Recomp adapta a história com cenas, retratos e bustos do FMII. As cenas aprovadas do mod aparecem nos dois modos: em resolução nativa com HD desligado, ou em alta resolução com HD ligado. Para ativar as artes HD, marque Texturas HD nas configurações do FMII-Recomp e reinicie o jogo.</p><details><summary>Desafio do Palácio e requisitos</summary><p>O desafio acontece na campanha. A entrada exige ${wins} vitórias contra ${duelistLink(38)}. São ${rounds} duelos e a recompensa de conclusão é de ${reward} star chips.</p></details><details><summary>Duelos e saídas do roteiro</summary><p class="notice muted">Índice na ordem dos arquivos de diálogo. A ordem de jogo depende das escolhas da campanha. Os valores das saídas são índices de cena em hexadecimal.</p>${table(['Diálogo','Duelista do roteiro','Vitória','Derrota'],data.campaign.duels.map(([d,id,w,l])=>row([d,duelists.has(id)?duelistLink(id):`Slot ${id} · definido pelo roteiro`,w,l])))}</details>`;
}
function about() {
  const developmentNotice = data.development ? `<p class="notice">A versão ${escapeHtml(data.version.split('-')[0])} está em desenvolvimento. Para testar a cópia atual, copie o conteúdo de <code>mod/</code> para a pasta <code>mods/FMII-Recomp</code> do jogo.</p>` : '';
  main.innerHTML=`<h2>Instalação</h2>${developmentNotice}<p>Use o Recomp 0.3.1-preview.2 no Windows ou o APK Android arm64 e a imagem BIN do disco americano SLUS-01411. O pacote inclui código para PC e Android; a execução no Android ainda aguarda validação em aparelho.</p><ol><li>Feche o jogo.</li><li>Copie a pasta <code>FMII-Recomp</code> do pacote publicado para a pasta de mods do Recomp.</li><li>Abra o jogo e confira <strong>Game &gt; Mods</strong>.</li></ol><p>Use o save normal para continuar de uma compilação anterior.</p><p>No Android, use Import mod no painel Mods e selecione o ZIP de desenvolvimento preparado para teste. Ative FMII-Recomp e reinicie. Em Mods &gt; FMII-Recomp &gt; Settings, Texturas HD começa desativado; marque a opção e reinicie para usar o HD. As cartas e regras do mod permanecem disponíveis nos dois modos.</p><ul>${data.publishedVersion?`<li><a href="docs/LEIA-ME-${encodeURIComponent(data.publishedVersion)}.md">Instruções da versão publicada ${escapeHtml(data.publishedVersion)}</a></li>`:''}<li><a href="#changelog">Changelog</a></li><li><a href="docs/ESTADO-ATUAL.md">Estado do desenvolvimento</a></li></ul><p class="notice muted">Os IDs numéricos da expansão correspondem ao FMII-Recomp sem outros mods de cartas. As referências nas fichas continuam identificando as cartas quando esses IDs mudam. As ilustrações vêm do disco original e do pacote do mod.</p>`;
}
function changelogPage() {
  main.innerHTML = `<div class="changelog">${data.changelog}</div>`;
}
function captureView() {
  return {
    fields: [...main.querySelectorAll('input,select')].map(input=>[input.id,input.value]),
    page: activePager?.page ?? 0,
    sort: activePager?.sort ?? null,
    details: [...main.querySelectorAll('details')].map(detail=>detail.open),
    tableScroll: [...main.querySelectorAll('.scroll')].map(table=>table.scrollLeft),
    scrollY: window.scrollY
  };
}
function restoreView(view) {
  for (const [id,value] of view?.fields ?? []) {
    const input = document.getElementById(id);
    if (!input || input.value === value) continue;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  if (view?.sort) activePager?.restoreSort(view.sort);
  if (view?.page) activePager?.go(view.page);
  if (view) {
    main.querySelectorAll('details').forEach((detail,index)=>{detail.open = view.details[index];});
    main.querySelectorAll('.scroll').forEach((table,index)=>{table.scrollLeft = view.tableScroll[index] ?? 0;});
  }
  window.scrollTo(0,view?.scrollY ?? 0);
}
let renderedUrl;
function render() {
  renderedUrl = location.href;
  activePager = undefined;
  const [requested,key='']=location.hash.slice(1).split('/');
  const route = requested || 'cartas';
  const active=route==='carta'?'cartas':route==='duelista'?'duelistas':route==='divergencias'?'fusoes':route;
  document.getElementById('nav').innerHTML=Object.entries(navNames).map(([id,name])=>`<a href="#${id}" ${id===active?'aria-current="page"':''}>${name}</a>`).join('');
  const pages = {cartas:catalog,drops,equips:()=>equipsPage(decodeURIComponent(key||'')),duelistas:duelistList,fusoes:()=>recipes(false,decodeURIComponent(key)),divergencias:conflicts,rituais:()=>recipes(true),inicio:starter,campanha:campaignPage,changelog:changelogPage,sobre:about,carta:()=>cardPage(cardsByRef.get(decodeURIComponent(key))),duelista:()=>duelistPage(duelists.get(Number(key)))};
  (pages[route]||catalog)();
  restoreView(history.state?.view);
}
document.getElementById('version').textContent = `Versão ${data.version}${data.development?' · Em desenvolvimento':''}`;
history.scrollRestoration = 'manual';
document.addEventListener('click', event=>{
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.replaceState({...history.state, view:captureView()},'');
  if (link.hasAttribute('data-back') && history.state?.from) {
    history.back();
    return;
  }
  const target = link.getAttribute('href');
  if (target === location.hash) return;
  const from = link.hasAttribute('data-back') ? '' : main.querySelector('h2')?.textContent;
  history.pushState({from,returnTo:location.hash || '#cartas'},'',target);
  render();
});
window.addEventListener('popstate',()=>{if (renderedUrl !== location.href) render();});
window.addEventListener('hashchange',()=>{if (renderedUrl !== location.href) render();});
render();
