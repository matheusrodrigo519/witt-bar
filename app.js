(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, context = document) => context.querySelector(s);
  const $$ = (s, context = document) => [...context.querySelectorAll(s)];
  const icons = {plus:'<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>',check:'<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>',close:'<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>'};
  const menu = {
    caipirinhas: [
      ['Caipirinha de limão','O clássico brasileiro, cítrico e refrescante.'],
      ['Caipirinha de morango','O sabor da fruta em um dos favoritos da festa.'],
      ['Caipirinha de abacaxi','Um toque tropical para o seu brinde.'],
      ['Caipirinha de maracujá','Frutado, aromático e cheio de personalidade.']
    ],
    especiais: [
      ['Piña Colada','Um clássico tropical.'], ['Negroni','Um clássico de personalidade marcante.'],
      ['Gin Tônica','Leveza e frescor na medida do seu momento.'], ['Gin com energético','Mais uma combinação para o seu evento.'],
      ['Moscow Mule','Um dos especiais do cardápio Witt.'], ['Aperol Spritz','Vibrante, cítrico e perfeito para brindar.']
    ],
    batidas: [['Batida de frutas com leite condensado','Cremosidade e frutas na sua combinação.']],
    'sem-alcool': [['Tropical sem álcool','Um brinde tropical, sem álcool.'],['Morango sem álcool','Frutado e cheio de sabor.'],['Abacaxi com hortelã sem álcool','Uma combinação refrescante para celebrar.']]
  };
  const favorites = new Set();
  let currentCategory = 'caipirinhas';
  let toastTimeout;
  const toast = text => { $('.toast').textContent = text; $('.toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('.toast').classList.remove('visible'), 2600); };

  function renderMenu() {
    const panel = $('#menu-list');
    panel.replaceChildren();
    for (const [name, description] of menu[currentCategory]) {
      const item = document.createElement('div'); item.className = 'menu-item';
      const copy = document.createElement('div');
      const title = document.createElement('h4'); title.textContent = name;
      const subtitle = document.createElement('p'); subtitle.textContent = description;
      copy.append(title, subtitle);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'round-button add-drink'; button.dataset.drink = name;
      const selected = favorites.has(name);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remover' : 'Selecionar'} ${name} ${selected ? 'do' : 'para o'} orçamento`);
      button.innerHTML = selected ? icons.check : icons.plus;
      item.append(copy,button); panel.append(item);
    }
  }
  function updateFavorites() {
    $$('.add-drink').forEach(button => {
      const selected = favorites.has(button.dataset.drink);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remover' : 'Selecionar'} ${button.dataset.drink} ${selected ? 'do' : 'para o'} orçamento`);
      button.innerHTML = selected ? icons.check : icons.plus;
    });
    const list = $('#selected-drinks'); list.replaceChildren();
    favorites.forEach(name => {
      const chip = document.createElement('button'); chip.className = 'selected-chip'; chip.type = 'button';
      chip.setAttribute('aria-label',`Remover ${name} do orçamento`); chip.dataset.drink = name;
      chip.append(document.createTextNode(name)); chip.insertAdjacentHTML('beforeend',icons.close);
      list.append(chip);
    });
    $('#no-selection').hidden = favorites.size > 0;
    $$('.selection-count').forEach(count => {count.textContent = String(favorites.size);count.hidden = favorites.size === 0;});
    if (!$('#quote-ready').hidden) showQuote(false);
  }
  document.addEventListener('click',event => {
    const button = event.target.closest('.add-drink, .selected-chip');
    if (!button) return;
    const name = button.dataset.drink;
    if (favorites.has(name)) { favorites.delete(name); toast(`${name} removido do pedido.`); }
    else { favorites.add(name); toast(`${name} adicionado ao seu pedido.`); }
    updateFavorites();
  });
  function activateTab(tab, focus = false) {
    currentCategory = tab.dataset.category;
    $$('.menu-tabs [role=tab]').forEach(item => { const selected = item === tab; item.classList.toggle('active',selected);item.setAttribute('aria-selected',String(selected));item.tabIndex = selected ? 0 : -1;});
    $('#menu-panel').setAttribute('aria-labelledby',tab.id); renderMenu();
    if(focus)tab.focus();
  }
  $$('.menu-tabs [role=tab]').forEach(tab => {
    tab.addEventListener('click',() => activateTab(tab));
    tab.addEventListener('keydown', event => {
      const tabs = $$('.menu-tabs [role=tab]'); const index = tabs.indexOf(tab);
      let next;
      if(event.key === 'ArrowRight')next=(index+1)%tabs.length;
      if(event.key === 'ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      if(event.key === 'Home')next=0;
      if(event.key === 'End')next=tabs.length-1;
      if(next !== undefined){event.preventDefault();activateTab(tabs[next],true);}
    });
  });
  renderMenu();

  const navigation = $('#navigation'); const menuToggle = $('.menu-toggle');
  function closeMenu(){navigation.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Abrir menu');}
  menuToggle.addEventListener('click',() => {const open = menuToggle.getAttribute('aria-expanded') !== 'true';navigation.classList.toggle('open',open);menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
  $$('#navigation a').forEach(link => link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key === 'Escape')closeMenu();});

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = motionQuery.matches;
  function updateMotion(){root.classList.toggle('motion-paused',motionPaused);$('.motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('.motion-toggle').setAttribute('aria-label',motionPaused?'Ativar animações':'Pausar animações');$('.motion-label').textContent=motionPaused?'Ativar efeitos':'Pausar efeitos';$('.motion-mark').textContent=motionPaused?'▷':'Ⅱ';}
  $('.motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;updateMotion();});updateMotion();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
    $$('.reveal').forEach(item => observer.observe(item));
  } else $$('.reveal').forEach(item=>item.classList.add('is-visible'));

  const photoDialog = $('#gallery-dialog');
  $$('.gallery-photo').forEach(button=>button.addEventListener('click',()=>{
    $('#gallery-dialog-image').src=button.dataset.image;$('#gallery-dialog-image').alt=$('img',button).alt;
    $('#gallery-dialog-caption').textContent=button.dataset.caption;$('#gallery-dialog-source').href=button.dataset.post;
    photoDialog.showModal();document.body.classList.add('modal-open');
  }));
  const closePhoto = () => photoDialog.close();
  $('.dialog-close').addEventListener('click',closePhoto);
  photoDialog.addEventListener('click',event=>{if(event.target===photoDialog){const r=photoDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePhoto();}});
  photoDialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));

  const form = $('#quote-form'); const date = $('#date'); const noDate = $('#no-date');
  const formatter = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
  date.min = formatter.format(new Date());
  noDate.addEventListener('change',()=>{date.disabled=noDate.checked;date.required=!noDate.checked;if(noDate.checked)date.value='';});
  $$('[data-event]').forEach(link=>link.addEventListener('click',()=>{if(form.hidden){form.hidden=false;$('#quote-ready').hidden=true;}$('#event').value=link.dataset.event;}));
  function buildMessage(){
    const data = new FormData(form);
    const eventDate = noDate.checked ? 'Ainda não defini' : String(data.get('date')).split('-').reverse().join('/');
    const lines = ['Olá, Witt Bar! Quero um orçamento para a minha festa.','',`Nome: ${String(data.get('name')).trim()}`,`Ocasião: ${data.get('event')}`,`Convidados: ${data.get('guests')}`,`Data: ${eventDate}`,`Local: ${String(data.get('place')).trim()}`,'',`Drinks de interesse: ${favorites.size?[...favorites].join(', '):'Gostaria de ajuda para escolher.'}`];
    const message = String(data.get('message')||'').trim();if(message)lines.push('',`Mais detalhes: ${message}`);
    lines.push('','Podemos conversar sobre a disponibilidade e o que está incluído?');
    return lines.join('\n');
  }
  function showQuote(scroll=true){
    const message=buildMessage();$('#quote-preview').textContent=message;
    $('#prepared-whatsapp').href=`https://wa.me/5548996061098?text=${encodeURIComponent(message)}`;
    form.hidden=true;$('#quote-ready').hidden=false;
    if(scroll){$('#quote-ready').scrollIntoView({behavior:motionPaused?'instant':'smooth',block:'center'});$('#prepared-whatsapp').focus({preventScroll:true});}
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;if(!$('#name').value.trim()||!$('#place').value.trim()){toast('Preencha seu nome e o local da festa.');return;}showQuote();});
  $('.edit-quote').addEventListener('click',()=>{form.hidden=false;$('#quote-ready').hidden=true;$('#name').focus({preventScroll:true});form.scrollIntoView({behavior:motionPaused?'instant':'smooth',block:'center'});});
  $('#year').textContent=String(new Date().getFullYear());
})();
