'use strict';
const data = JSON.parse(document.getElementById('guide-data').textContent);
const main = document.getElementById('main');
const languagePicker = document.getElementById('guide-language');
const languageKey = 'fmii-guide-language';
const translations = typeof ENGLISH === 'undefined' ? {} : ENGLISH;
let language;
let number;
let percent;
function t(message, values = {}) {
  const text = language === 'en' && Object.hasOwn(translations, message) ? translations[message] : message;
  return text.replace(/\{(\w+)\}/g, (token, key) => values[key] ?? token);
}
const headingInPortuguese = new Map(Object.entries(translations).map(([pt,en]) => [en,pt]));
function setLanguage(value) {
  language = value === 'en' ? 'en' : 'pt-BR';
  const locale = language === 'en' ? 'en-US' : 'pt-BR';
  number = new Intl.NumberFormat(locale);
  percent = new Intl.NumberFormat(locale, {style:'percent', maximumFractionDigits:4});
  document.documentElement.lang = language;
  document.getElementById('version').textContent = t('Versão {version}', {version:data.version}) +
    (data.development ? ' · ' + t('Em desenvolvimento') : '');
  if (!languagePicker) return;
  languagePicker.value = language;
  document.title = t('Guia do FMII-Recomp');
  document.getElementById('guide-title').textContent = document.title;
  document.getElementById('guide-intro').textContent = t('Consulte cartas, receitas e recompensas da expansão de Forbidden Memories II.');
  document.getElementById('guide-nav').setAttribute('aria-label', t('Seções do guia'));
  document.getElementById('guide-footer').textContent = t('Dados do FMII-Recomp com o disco americano SLUS-01411, sem modificações de outros mods.');
  document.getElementById('language-label').textContent = t('Idioma');
}
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
const labelWeight = weight => `${number.format(weight)} / ${number.format(2048)}`;
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
const backLink = (route, label) => {
  const from = history.state?.from || label;
  const page = escapeHtml(t(headingInPortuguese.get(from) ?? from));
  return `<a data-back class="back-link" href="${escapeHtml(history.state?.returnTo || `#${route}`)}">← ${t('Voltar para {page}', {page})}</a>`;
};
const row = values => `<tr>${values.map((value,i)=>`<td${i && typeof value==='number'?' class="number"':''}>${value}</td>`).join('')}</tr>`;
const table = (headers, rows, empty='Nenhum resultado.') => rows.length ? `<div class="scroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${escapeHtml(t(h))}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="empty">${escapeHtml(t(empty))}</p>`;
const field = (id,label,placeholder) => `<label for="${id}">${escapeHtml(t(label))}<input id="${id}" type="search" placeholder="${escapeHtml(t(placeholder))}" autocomplete="off"></label>`;
const select = (id,label,options) => `<label for="${id}">${escapeHtml(t(label))}<select id="${id}">${options.map(([key,value])=>`<option value="${escapeHtml(key)}">${escapeHtml(typeof value === 'string' ? t(value) : value)}</option>`).join('')}</select></label>`;
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
  const collator = new Intl.Collator(language, {numeric:true, sensitivity:'base'});
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
      `<div class="paging"><span class="meta">${t('{count} resultados',{count:number.format(rows.length)})}</span>${select('page-size','Itens por página',pageSizes.map(count=>[count,count]))}${toCsv ? `<button id="export">${t('Baixar CSV')}</button>` : ''}<button id="prev" ${page===0?'disabled':''}>${t("Anterior")}</button><span class="meta">${t('{page} de {total}',{page:page+1,total})}</span><button id="next" ${page+1===total?'disabled':''}>${t("Próxima")}</button></div>`;
    if (sortValues) area.querySelectorAll('thead th').forEach((header,column)=>{
      const selected = sortColumn === column;
      const next = selected && sortDirection === 1 ? 'decrescente' : 'crescente';
      header.setAttribute('aria-sort', selected ? (sortDirection === 1 ? 'ascending' : 'descending') : 'none');
      header.innerHTML = `<button class="sort-column" type="button" aria-label="${escapeHtml(t('{column}: ordenar em ordem {direction}',{column:t(names[column]),direction:t(next)}))}">${escapeHtml(t(names[column]))}<span aria-hidden="true">${selected ? (sortDirection === 1 ? '▲' : '▼') : '↕'}</span></button>`;
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
    if (toCsv) document.getElementById('export').onclick = () => download(toCsv[0],names.map(name=>t(name)),rows.map(toCsv[1]));
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
const frameColor = color => `<span class="frame-color" data-color="${escapeHtml(color)}">${escapeHtml(t(color))}</span>`;
function catalog() {
  const types = [...new Set(data.cards.map(c=>c.type))].sort();
  main.innerHTML = `<h2>${t("Cartas")}</h2><p class="notice muted">${t("As cartas do FMII usam os passwords e custos da planilha de referência. Um traço indica ausência de compra por password.")}</p><div class="tools">${field('q','Nome ou ID','Ex. Mystical Elf')}${select('origin','Origem',[['','Todas'],['original','Original'],['fmii','Expansão FMII']])}${select('type','Tipo',[['','Todos'],...types.map(t=>[t,t])])}</div><div id="results"></div>`;
  paged(()=>{const q=query('q'),o=document.getElementById('origin').value,t=document.getElementById('type').value;return data.cards.filter(c=>matchesCard(c.id,q)&&(!o || c.expansion===(o==='fmii'))&&(!t||c.type===t));},
    ['ID','Carta','Origem','Tipo','Moldura','ATK','DEF','Password','Custo (Star Chips)'],c=>row([c.id,cardLink(c.id,false,false),c.expansion?'FMII':'Original',escapeHtml(c.type),frameColor(c.frameColor),c.attack??'-',c.defense??'-',c.password?`<code>${escapeHtml(c.password)}</code>`:'-',c.starchips!=null?number.format(c.starchips):'-']),
    ['cartas-fmii-recomp',c=>[c.id,c.name,c.expansion?'FMII':'Original',c.type,t(c.frameColor),c.attack,c.defense,c.password,c.starchips]]);
}
const dropHeaders = ['Carta','Duelista','Rank','Peso','Chance por sorteio'];
const dropRow = ([id,duelist,rank,weight], withArt = false) => row([cardLink(id,withArt),duelistLink(duelist),escapeHtml(rank),labelWeight(weight),odds(weight)]);
function drops() {
  const rankOptions = data.duelists[0].drops.map(p=>[p.rank,p.rank]);
  main.innerHTML = `<h2>${t("Drops")}</h2><p class="notice muted">${t("As cartas do FMII seguem a planilha Compilation - FM II. As cartas originais ausentes no FMII também usam os drops do disco original quando o duelista mantém o nome ou tem correspondência definida; Kaiba corresponde a Seto Kaiba e Pegasus a Maximillion Pegasus. As demais correspondências e as cartas sem drop no disco aguardam definição. Os drops estão disponíveis desde a primeira vitória. As chances são por carta sorteada, e a quantidade de cartas por vitória é configurada no Recomp.")}</p><div class="tools">${field('q','Carta','Ex. Slifer')}${select('who','Duelista',[['','Todos'],...data.duelists.map(d=>[d.id,d.name])])}${select('rank','Rank',[['','Todos'],...rankOptions])}</div><div id="results"></div>`;
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
const fusionRow = ([a,b,r,source])=>row([recipeCard(a),recipeCard(b),recipeCard(r),t(source)]);
const ritualHeaders = ['Carta ritual','Tributo 1','Tributo 2','Tributo 3','Resultado','Origem'];
const ritualRow = ([card,a,b,c,result,source])=>row([recipeCard(card),recipeCard(a),recipeCard(b),recipeCard(c),recipeCard(result),t(source)]);
function recipes(ritual, initial='') {
  const headers=ritual?ritualHeaders:fusionHeaders;
  const list=ritual?data.rituals:data.fusions;
  const origins = [['','Todas'],['Original','Original'],['FMII','FMII']];
  if (!ritual && hasInheritedFusions) origins.push(['Herdada','Herdada pelo Recomp']);
  main.innerHTML=`<h2>${t(ritual?'Rituais':'Fusões')}</h2>${ritual?'':`<p class="notice muted">${t('A receita original prevalece nos pares com resultados diferentes.')} <a href="#divergencias">${t('Conferir os {count} pares',{count:number.format(data.conflicts.length)})}</a>.${hasInheritedFusions?' '+t('Fusões herdadas usam a carta-base da expansão quando o Recomp procura uma receita.'):''}</p>`}<div class="tools">${field('q','Carta','Busque um ingrediente ou resultado')}${select('role','Buscar em',[['','Tudo'],['input','Ingredientes'],['result','Resultado']])}${select('origin','Origem',origins)}${ritual?'':select('power','ATK do resultado',[['','Qualquer'],['one','Menor que o de um ingrediente'],['both','Menor que o dos dois ingredientes']])}</div><div id="results"></div>`;
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
  paged(filtered,headers,ritual?ritualRow:fusionRow,[ritual?'rituais-fmii-recomp':'fusoes-fmii-recomp',x=>[...x.slice(0,-1).map(id=>cards.get(id)?.name??''),t(x.at(-1))]]);
}
function conflicts() {
  main.innerHTML=`<p>${backLink('fusoes','Fusões')}</p><h2>${t("Pares com resultados diferentes")}</h2><div class="tools">${field('q','Carta','Ex. Catapult Turtle')}</div><div id="results"></div>`;
  paged(()=>{const q=query('q');return data.conflicts.filter(x=>x.some(id=>matchesCard(id,q)));},
    ['Ingrediente 1','Ingrediente 2','Original','FMII na ISO','Resultado no Recomp'],x=>row(x.map(recipeCard)),
    ['fusoes-divergentes-fmii-recomp',x=>x.map(id=>cards.get(id)?.name??'')]);
}
function equipsPage(selected = '') {
  const options = data.equips.map(e => [cards.get(e.card).ref, cards.get(e.card).name]);
  main.innerHTML = `<h2>${t("Equipamentos do FMII")}</h2><p class="notice muted">${t("As compatibilidades do FMII foram estendidas às cartas originais ausentes no FMII, conforme tipo, atributo, nível, ATK ou família. As exceções existentes foram preservadas. Esta lista mostra os monstros compatíveis; efeitos e bônus variáveis continuam dependendo das condições do duelo.")}</p><div class="tools">${field('q','Carta','Ex. Battle Ox')}${select('equip','Equipamento',[['','Todos'],...options])}</div><div id="results"></div>`;
  document.getElementById('equip').value = selected;
  paged(() => {
    const q = query('q'), wanted = document.getElementById('equip').value;
    return data.equips.filter(e => !wanted || cards.get(e.card).ref === wanted)
      .flatMap(e => e.targets.filter(id => !q || matchesCard(id,q) || matchesCard(e.card,q)).map(id => [e.card,id]));
  }, ['Equipamento','Monstro compatível'], pair => row(pair.map(id => cardLink(id,true))),
  ['equipamentos-fmii', pair => pair.map(id => cards.get(id).name)]);
}
function cardPage(card) {
  if (!card) {main.innerHTML=`<p>${t('Carta desconhecida.')} <a href="#cartas">${t('Voltar ao catálogo')}</a>.</p>`;return;}
  const id=card.id;
  const drops=cardDrops.get(id).map(x=>[id,...x]);
  const deck=cardDecks.get(id);
  const fusions=data.fusions.filter(f=>f.slice(0,3).includes(id));
  const rituals=data.rituals.filter(f=>f.slice(0,5).includes(id));
  const equip = data.equips.find(e => e.card === id);
  const compatible = data.equips.filter(e => e.targets.includes(id));
  const equipSection = equip ? `<section><h3>${t('Monstros compatíveis')} (${equip.targets.length})</h3><p><a href="#equips/${encodeURIComponent(card.ref)}">${t("Consultar todos os monstros que podem receber este equipamento")}</a></p></section>` : compatible.length ? `<section><h3>${t('Equipamentos do FMII compatíveis')} (${compatible.length})</h3>${table(['Equipamento'],compatible.map(e => row([cardLink(e.card,true)])))}</section>` : '';
  const spelling = card.correctedSpelling
    ? `<p>${t("Erro de grafia · O nome correto é")} <strong>${escapeHtml(card.correctedSpelling)}</strong></p>`
    : '';
  const stats=[card.type,card.attribute,card.level==null?null:t('Nível {level}',{level:card.level}),card.attack==null?null:`${card.attack} ATK / ${card.defense} DEF`].filter(Boolean);
  main.innerHTML=`<p>${backLink('cartas','Cartas')}</p><div class="card-head">${img(card.art,card.name)}<div><p class="badge">${t(card.expansion?'Expansão FMII':'Original')} · ID ${id}</p><h2>${escapeHtml(card.name)}</h2><div class="tagline">${stats.map(s=>`<span>${escapeHtml(s)}</span>`).join('')}</div><p>${t("Moldura")} · ${frameColor(card.frameColor)}</p>${spelling}${card.stars.length?`<p>${t("Estrelas guardiãs")} · ${escapeHtml(card.stars.join(' / '))}</p>`:''}<p class="description">${escapeHtml(card.description)}</p>${card.effectNote ? `<p class="notice"><strong>${t("Efeito no duelo")}</strong> · ${escapeHtml(language === "en" ? card.effectNoteEn : card.effectNote)}</p>` : ''}${card.password?`<p>${t("Senha")} · <code>${escapeHtml(card.password)}</code>${card.starchips!=null?` · ${number.format(card.starchips)} star chips`:''}</p>`:''}${card.expansion?`<small>${t("Referência")} · ${escapeHtml(card.ref)}</small>`:''}</div></div><div class="sections">${equipSection}<section><h3>Drops (${drops.length})</h3>${table(dropHeaders,drops.map(drop=>dropRow(drop)),'Nenhum duelista oferece esta carta nos dados deste guia.')}</section><section><h3>${t("Decks dos duelistas")} (${deck.length})</h3>${table(['Duelista','Peso na tabela'],deck.map(([d,w])=>row([duelistLink(d),labelWeight(w)])))}</section><section><h3>${t("Fusões")} (${fusions.length})</h3>${table(fusionHeaders,fusions.slice(0,40).map(fusionRow))}${fusions.length>40?`<a href="#fusoes/${encodeURIComponent(card.ref)}">${t("Ver todas as fusões da carta")}</a>`:''}</section><section><h3>${t("Rituais")} (${rituals.length})</h3>${table(ritualHeaders,rituals.map(ritualRow))}</section></div>`;
}
function duelistList() {
  main.innerHTML=`<h2>${t("Duelistas")}</h2><div class="tools">${field('q','Nome ou slot','Ex. Pegasus')}</div><div class="grid" id="results"></div>`;
  const render=()=>{const q=query('q');document.getElementById('results').innerHTML=data.duelists.filter(d=>normalize(d.name).includes(q)||String(d.id)===q).map(d=>`<a class="tile" href="#duelista/${d.id}">${portrait(d)}<span><small>Slot ${d.id}</small><br>${escapeHtml(d.name)}</span></a>`).join('')||`<p>${t('Nenhum duelista encontrado.')}</p>`;};
  document.getElementById('q').oninput=render;render();
}
function duelistPage(d) {
  if (!d) {main.innerHTML=`<p>${t('Duelista desconhecido.')} <a href="#duelistas">${t('Ver duelistas')}</a>.</p>`;return;}
  main.innerHTML=`<p>${backLink('duelistas','Duelistas')}</p><div class="card-head">${portrait(d)}<div><p class="badge">Slot ${d.id}</p><h2>${escapeHtml(d.name)}</h2><p>${t('{count} cartas possíveis no deck',{count:number.format(d.deck.length)})}</p></div></div><div class="sections"><section><h3>${t("Deck do FMII")}</h3><p class="muted">${t("O peso é usado para montar o deck de 40 cartas. O limite de cópias afeta os sorteios seguintes.")}</p>${table(['Carta','Peso na tabela'],[...d.deck].sort((a,b)=>b[1]-a[1]).map(([id,w])=>row([cardLink(id,true),labelWeight(w)])))}</section><section><h3>${t("Drops por rank")}</h3>${d.drops.map(p=>`<details><summary>${escapeHtml(p.rank)} · ${t('{count} cartas',{count:number.format(p.cards.length)})}</summary>${p.empty?`<p class="muted">${t("Sorteio sem carta")} · ${odds(p.empty)}</p>`:''}${table(['Carta','Peso','Chance por sorteio'],[...p.cards].sort((a,b)=>b[1]-a[1]).map(([id,w])=>row([cardLink(id,true),labelWeight(w),odds(w)])))}</details>`).join('')}</section></div>`;
}
function starter() {
  const rows = pools => pools.map((p,i)=>`<details ${i===0?'open':''}><summary>${t('Grupo {count}',{count:i+1})} · ${p.draws} ${t(p.draws===1?'carta sorteada':'cartas sorteadas')}</summary>${table(['Carta','Peso no grupo'],p.cards.map(([id,w])=>row([cardLink(id,true),labelWeight(w)])))}</details>`).join('');
  main.innerHTML=`<h2>${t("Deck inicial")}</h2><p class="notice">${t("Uma campanha nova sorteia com chances iguais entre o deck do original e o do FMII. São 40 cartas em ambos.")}</p><div class="tools">${select('family','Tabela',[['fmii','FMII'],['original','Original']])}</div><div id="results"></div>`;
  const redraw=()=>{document.getElementById('results').innerHTML=rows(document.getElementById('family').value==='fmii'?data.starter:data.originalStarter);};
  document.getElementById('family').oninput=redraw;redraw();
}
function campaignPage() {
  const [wins,rounds,reward]=data.campaign.palace;
  main.innerHTML=`<h2>${t("Campanha")}</h2><p class="notice">${t("O FMII-Recomp adapta a história com cenas, retratos e bustos do FMII. As cenas aprovadas do mod aparecem nos dois modos: em resolução nativa com HD desligado, ou em alta resolução com HD ligado. Para ativar as artes HD, marque Texturas HD nas configurações do FMII-Recomp e reinicie o jogo.")}</p><details><summary>${t("Desafio do Palácio e requisitos")}</summary><p>${t('O desafio acontece na campanha. A entrada exige {wins} vitórias contra {duelist}. São {rounds} duelos e a recompensa de conclusão é de {reward} star chips.',{wins:number.format(wins),duelist:duelistLink(38),rounds:number.format(rounds),reward:number.format(reward)})}</p></details><details><summary>${t("Duelos e saídas do roteiro")}</summary><p class="notice muted">${t("Índice na ordem dos arquivos de diálogo. A ordem de jogo depende das escolhas da campanha. Os valores das saídas são índices de cena em hexadecimal.")}</p>${table(['Diálogo','Duelista do roteiro','Vitória','Derrota'],data.campaign.duels.map(([d,id,w,l])=>row([d,duelists.has(id)?duelistLink(id):`Slot ${id} · ${t("definido pelo roteiro")}`,w,l])))}</details>`;
}
function about() {
  const developmentNotice = data.development ? `<p class="notice">${t('A versão {version} está em desenvolvimento. Para testar a cópia atual, copie o conteúdo de <code>mod/</code> para a pasta <code>mods/FMII-Recomp</code> do jogo.',{version:escapeHtml(data.version.split('-')[0])})}</p>` : '';
  main.innerHTML=`<h2>${t("Instalação")}</h2>${developmentNotice}<p>${t("Use o Recomp 0.3.1-preview.2 no Windows ou o APK Android arm64 e a imagem BIN do disco americano SLUS-01411. O pacote inclui código para PC e Android; a execução no Android ainda aguarda validação em aparelho.")}</p><ol><li>${t("Feche o jogo.")}</li><li>${t("Copie a pasta <code>FMII-Recomp</code> do pacote publicado para a pasta de mods do Recomp.")}</li><li>${t("Abra o jogo e confira <strong>Game &gt; Mods</strong>.")}</li></ol><p>${t("Use o save normal para continuar de uma compilação anterior.")}</p><p>${t("No Android, use Import mod no painel Mods e selecione o ZIP da versão que você quer instalar. Ative FMII-Recomp e reinicie. Em Mods &gt; FMII-Recomp &gt; Settings, Texturas HD começa desativado; marque a opção e reinicie para usar o HD. As cartas e regras do mod permanecem disponíveis nos dois modos.")}</p><ul>${data.publishedVersion?`<li><a href="docs/LEIA-ME-${encodeURIComponent(data.publishedVersion)}.md">${t('Instruções da versão {version}',{version:escapeHtml(data.publishedVersion)})}</a></li>`:''}<li><a href="#changelog">${t("Changelog")}</a></li><li><a href="docs/ESTADO-ATUAL.md">${t("Estado do desenvolvimento")}</a></li></ul><p class="notice muted">${t("Os IDs numéricos da expansão correspondem ao FMII-Recomp sem outros mods de cartas. As referências nas fichas continuam identificando as cartas quando esses IDs mudam. As ilustrações vêm do disco original e do pacote do mod.")}</p>`;
}
function changelogPage() {
  main.innerHTML = `<div class="changelog">${language === "en" ? data.changelogEn : data.changelog}</div>`;
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
function render(view = history.state?.view) {
  renderedUrl = location.href;
  activePager = undefined;
  const [requested,key='']=location.hash.slice(1).split('/');
  const route = requested || 'cartas';
  const active=route==='carta'?'cartas':route==='duelista'?'duelistas':route==='divergencias'?'fusoes':route;
  document.getElementById('nav').innerHTML=Object.entries(navNames).map(([id,name])=>`<a href="#${id}" ${id===active?'aria-current="page"':''}>${escapeHtml(t(name))}</a>`).join('');
  const pages = {cartas:catalog,drops,equips:()=>equipsPage(decodeURIComponent(key||'')),duelistas:duelistList,fusoes:()=>recipes(false,decodeURIComponent(key)),divergencias:conflicts,rituais:()=>recipes(true),inicio:starter,campanha:campaignPage,changelog:changelogPage,sobre:about,carta:()=>cardPage(cardsByRef.get(decodeURIComponent(key))),duelista:()=>duelistPage(duelists.get(Number(key)))};
  (pages[route]||catalog)();
  restoreView(view);
}
const requestedLanguage = new URLSearchParams(location.search).get('lang');
let preferredLanguage;
try { preferredLanguage = localStorage.getItem(languageKey); } catch { /* Storage may be unavailable for local files. */ }
setLanguage(languagePicker ? (requestedLanguage ?? preferredLanguage) : 'pt-BR');
languagePicker?.addEventListener('change', () => {
  const view = captureView();
  setLanguage(languagePicker.value);
  try { localStorage.setItem(languageKey, language); } catch { /* The switch still works without storage. */ }
  if (location.protocol === 'https:' || location.protocol === 'http:') {
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(history.state, '', url);
  }
  render(view);
});
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
