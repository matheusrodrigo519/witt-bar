(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  root.classList.add('js');

  const icons = {
    plus: '<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-plus"/></svg>',
    check: '<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-check"/></svg>',
    close: '<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#i-close"/></svg>'
  };
  const menu = {
    caipirinhas: [
      'Caipirinha de limão',
      'Caipirinha de morango',
      'Caipirinha de abacaxi',
      'Caipirinha de maracujá'
    ],
    especiais: [
      'Piña Colada',
      'Negroni',
      'Gin Tônica',
      'Gin com energético',
      'Moscow Mule',
      'Aperol Spritz'
    ],
    batidas: ['Batida de frutas com leite condensado'],
    'sem-alcool': [
      'Tropical sem álcool',
      'Morango sem álcool',
      'Abacaxi com hortelã sem álcool'
    ]
  };

  const favoritesKey = 'wittbar:drinks';
  const draftKey = $('.home-discover') ? 'wittbar:orcamento-inicio' : 'wittbar:orcamento';
  function readSession(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function writeSession(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Navigation and the current page still work when storage is unavailable.
    }
  }

  const drinkNames = new Set(Object.values(menu).flat());
  function readFavorites() {
    const stored = readSession(favoritesKey);
    return new Set(Array.isArray(stored) ? stored.filter(name => drinkNames.has(name)) : []);
  }

  let favorites = readFavorites();
  const menuList = $('#menu-list');
  const menuPanel = $('#menu-panel');
  const menuTabs = $$('.menu-tabs [role=tab]');
  const selectedDrinks = $('#selected-drinks');
  const quoteForm = $('#quote-form');
  const quoteReady = $('#quote-ready');
  const planField = $('#service-plan');
  const toastElement = $('.toast');
  let toastTimeout;

  function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastElement.classList.remove('visible'), 2600);
  }

  function updateDrinkButton(button) {
    const name = button.dataset.drink;
    const selected = favorites.has(name);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', selected ? 'Remover ' + name + ' do orçamento' : 'Selecionar ' + name + ' para o orçamento');
    button.innerHTML = selected ? icons.check : icons.plus;
  }

  function renderMenu(category) {
    menuList.replaceChildren();
    for (const name of menu[category]) {
      const item = document.createElement('div');
      item.className = 'menu-item';
      const title = document.createElement('h4');
      title.textContent = name;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'round-button add-drink';
      button.dataset.drink = name;
      updateDrinkButton(button);
      item.append(title, button);
      menuList.append(item);
    }
  }

  function updateFavorites() {
    $$('.add-drink').forEach(updateDrinkButton);
    $$('.selection-count').forEach(count => {
      count.textContent = String(favorites.size);
      count.hidden = favorites.size === 0;
    });

    if (selectedDrinks) {
      selectedDrinks.replaceChildren();
      for (const name of favorites) {
        const chip = document.createElement('button');
        chip.className = 'selected-chip';
        chip.type = 'button';
        chip.setAttribute('aria-label', 'Remover ' + name + ' do orçamento');
        chip.dataset.drink = name;
        chip.append(document.createTextNode(name));
        chip.insertAdjacentHTML('beforeend', icons.close);
        selectedDrinks.append(chip);
      }
      $('#no-selection').hidden = favorites.size > 0;
    }
    if (quoteReady && !quoteReady.hidden) showQuote(false);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.add-drink, .selected-chip');
    if (!button) return;
    const name = button.dataset.drink;
    if (favorites.delete(name)) {
      toast(name + ' removido do pedido.');
    } else {
      favorites.add(name);
      toast(name + ' adicionado ao seu pedido.');
    }
    writeSession(favoritesKey, [...favorites]);
    updateFavorites();
    if (button.classList.contains('selected-chip')) {
      (selectedDrinks.firstElementChild || $('.selected-label a')).focus();
    }
  });

  function activateTab(tab, focus = false) {
    for (const item of menuTabs) {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    }
    menuPanel.setAttribute('aria-labelledby', tab.id);
    renderMenu(tab.dataset.category);
    if (focus) tab.focus();
  }

  for (const [index, tab] of menuTabs.entries()) {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % menuTabs.length;
      if (event.key === 'ArrowLeft') next = (index + menuTabs.length - 1) % menuTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = menuTabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activateTab(menuTabs[next], true);
      }
    });
  }
  if (menuTabs.length) activateTab(menuTabs[0]);

  const navigation = $('#navigation');
  const menuToggle = $('.menu-toggle');
  function setMenu(open) {
    navigation.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  menuToggle.addEventListener('click', () => setMenu(!navigation.classList.contains('open')));
  $$('a', navigation).forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  const motionToggle = $('.motion-toggle');
  let motionPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function updateMotion() {
    root.classList.toggle('motion-paused', motionPaused);
    motionToggle.setAttribute('aria-pressed', String(motionPaused));
    motionToggle.setAttribute('aria-label', motionPaused ? 'Ativar animações' : 'Pausar animações');
    $('.motion-label').textContent = motionPaused ? 'Ativar efeitos' : 'Pausar efeitos';
    $('.motion-mark').textContent = motionPaused ? '▷' : 'Ⅱ';
  }
  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      motionPaused = !motionPaused;
      updateMotion();
    });
    updateMotion();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .08 });
    $$('.reveal').forEach(item => observer.observe(item));
  } else {
    $$('.reveal').forEach(item => item.classList.add('is-visible'));
  }

  const photoDialog = $('#gallery-dialog');
  if (photoDialog) {
    const photoImage = $('#gallery-dialog-image');
    const caption = $('#gallery-dialog-caption');
    const source = $('#gallery-dialog-source');
    const paging = $('.dialog-paging', photoDialog);
    const count = paging?.querySelector('.dialog-count');
    let photos = [];
    let photoIndex = 0;

    function renderPhoto() {
      const photo = photos[photoIndex];
      photoImage.src = photo.dataset.image;
      photoImage.alt = $('img', photo).alt;
      caption.textContent = photo.dataset.caption;
      source.hidden = !photo.dataset.post;
      if (photo.dataset.post) source.href = photo.dataset.post;
      else source.removeAttribute('href');
      if (paging) {
        paging.hidden = photos.length < 2;
        count.textContent = (photoIndex + 1) + ' / ' + photos.length;
      }
    }

    function stepPhoto(delta) {
      if (photos.length < 2) return;
      photoIndex = (photoIndex + delta + photos.length) % photos.length;
      renderPhoto();
    }

    for (const button of $$('.gallery-photo')) {
      button.addEventListener('click', () => {
        const collection = button.closest('.photo-collection');
        photos = collection ? $$('.gallery-photo', collection) : [button];
        photoIndex = photos.indexOf(button);
        renderPhoto();
        photoDialog.showModal();
        document.body.classList.add('modal-open');
      });
    }
    for (const button of $$('[data-photo-step]', photoDialog)) {
      button.addEventListener('click', () => stepPhoto(Number(button.dataset.photoStep)));
    }
    photoDialog.addEventListener('keydown', event => {
      if (photos.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    $('.dialog-close', photoDialog).addEventListener('click', () => photoDialog.close());
    photoDialog.addEventListener('click', event => {
      if (event.target !== photoDialog) return;
      const bounds = photoDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) {
        photoDialog.close();
      }
    });
    photoDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  }

  function buildMessage() {
    const data = new FormData(quoteForm);
    const eventDate = $('#no-date').checked ? 'Ainda não defini' : String(data.get('date')).split('-').reverse().join('/');
    const lines = [
      'Olá, Witt Bar! Quero um orçamento para a minha festa.',
      '',
      'Nome: ' + String(data.get('name')).trim(),
      'Ocasião: ' + data.get('event')
    ];
    if (planField?.value) {
      lines.push('Formato de bar: ' + planField.selectedOptions[0].textContent);
    }
    lines.push(
      'Convidados: ' + data.get('guests'),
      'Data: ' + eventDate,
      'Local: ' + String(data.get('place')).trim(),
      '',
      'Drinks de interesse: ' + (favorites.size ? [...favorites].join(', ') : 'Gostaria de ajuda para escolher.')
    );
    const message = String(data.get('message') || '').trim();
    if (message) lines.push('', 'Mais detalhes: ' + message);
    lines.push('', 'Podemos conversar sobre a disponibilidade e o que está incluído?');
    return lines.join('\n');
  }

  function showQuote(scroll = true) {
    const message = buildMessage();
    const whatsapp = $('#prepared-whatsapp');
    $('#quote-preview').textContent = message;
    whatsapp.href = 'https://wa.me/5548998292684?text=' + encodeURIComponent(message);
    quoteForm.hidden = true;
    quoteReady.hidden = false;
    if (scroll) {
      quoteReady.scrollIntoView({ behavior: motionPaused ? 'instant' : 'smooth', block: 'center' });
      whatsapp.focus({ preventScroll: true });
    }
  }

  if (quoteForm) {
    const date = $('#date');
    const noDate = $('#no-date');
    const eventField = $('#event');
    const guestsField = $('#guests');
    const estimate = $('#estimate-guests');
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    date.min = formatter.format(new Date());

    function updateDate() {
      date.disabled = noDate.checked;
      date.required = !noDate.checked;
      if (noDate.checked) date.value = '';
    }

    const draft = readSession(draftKey);
    if (draft?.fields) {
      for (const [name, value] of Object.entries(draft.fields)) {
        const field = quoteForm.elements.namedItem(name);
        if (field) field.value = value;
      }
      noDate.checked = Boolean(draft.noDate);
    }
    updateDate();
    noDate.addEventListener('change', updateDate);

    if (estimate) {
      const total = $('#estimate-total');
      const error = $('#estimate-error');
      const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
      const minPerGuest = 48;
      const maxPerGuest = 92;

      function updateEstimate() {
        const valid = estimate.validity.valid;
        const count = estimate.valueAsNumber;
        total.value = valid
          ? currency.format(count * minPerGuest) + ' a\u00a0' + currency.format(count * maxPerGuest)
          : '—';
        estimate.setAttribute('aria-invalid', String(!valid));
        error.hidden = valid;
      }

      if (guestsField.value) estimate.value = guestsField.value;
      updateEstimate();
      estimate.addEventListener('input', () => {
        guestsField.value = estimate.validity.valid ? String(estimate.valueAsNumber) : '';
        quoteForm.hidden = false;
        quoteReady.hidden = true;
        updateEstimate();
      });
      guestsField.addEventListener('input', () => {
        estimate.value = guestsField.value;
        updateEstimate();
      });
    }

    window.addEventListener('pagehide', () => {
      writeSession(draftKey, {
        fields: Object.fromEntries(new FormData(quoteForm)),
        noDate: noDate.checked
      });
    });

    for (const link of $$('[data-event], [data-service-plan]')) {
      link.addEventListener('click', () => {
        quoteForm.hidden = false;
        quoteReady.hidden = true;
        if (link.dataset.servicePlan && planField) {
          planField.value = link.dataset.servicePlan;
          if (estimate?.validity.valid) guestsField.value = String(estimate.valueAsNumber);
        } else if (link.dataset.event) {
          eventField.value = link.dataset.event;
        }
      });
    }
    quoteForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!quoteForm.reportValidity()) return;
      if (!$('#name').value.trim() || !$('#place').value.trim()) {
        toast('Preencha seu nome e o local da festa.');
        return;
      }
      showQuote();
    });
    $('.edit-quote').addEventListener('click', () => {
      quoteForm.hidden = false;
      quoteReady.hidden = true;
      $('#name').focus({ preventScroll: true });
      quoteForm.scrollIntoView({ behavior: motionPaused ? 'instant' : 'smooth', block: 'center' });
    });
  }

  updateFavorites();
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      favorites = readFavorites();
      updateFavorites();
    }
  });
  $('#year').textContent = String(new Date().getFullYear());
})();
