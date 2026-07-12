/* =========================================================================
   AGENTE LILI — widget flutuante presente em todas as páginas
   Um botão discreto abre um painel com a mesma triagem da Central da Lili
   (central.js). Nunca abre o WhatsApp direto: quem decide é a pessoa,
   no final da triagem.

   Regras de convivência com a página:
   - fechada, a Agente não intercepta nenhum clique (pointer-events:none);
   - abre/fecha por clique, Esc e toque no fundo (celular);
   - qualquer elemento com [data-lili] abre o painel (fallback: /central).
   ========================================================================= */
(function(){
  if(document.getElementById('lili-agente')) return;
  if(!window.montarCentralLili) return; // central.js precisa vir antes

  // Na página /central a triagem já está aberta na tela — o widget seria redundante.
  var ehCentral = /^\/central\/?(index\.html)?$/.test(location.pathname);

  var aberto = false;

  // ---------- LAUNCHER ----------
  var lan = document.createElement('button');
  lan.type = 'button';
  lan.className = 'lili-lan';
  lan.setAttribute('aria-haspopup','dialog');
  lan.setAttribute('aria-expanded','false');
  lan.setAttribute('aria-label','Abrir a Lili — assistente da 100 Milhas');
  lan.innerHTML =
    '<span class="lili-lan-foto"><img src="/assets/lili-ia-mini.webp" alt="" width="46" height="46"></span>' +
    '<span class="lili-lan-txt">Falar com<br><b>a Lili</b></span>';

  // ---------- PAINEL ----------
  var fundo = document.createElement('div');
  fundo.className = 'lili-fundo';

  var pan = document.createElement('div');
  pan.className = 'lili-painel';
  pan.id = 'lili-agente';
  pan.setAttribute('role','dialog');
  pan.setAttribute('aria-modal','true');
  pan.setAttribute('aria-label','Lili — assistente da 100 Milhas');
  pan.innerHTML =
    '<div class="lili-topo">' +
      '<img src="/assets/lili-ia-mini.webp" alt="" width="44" height="44">' +
      '<div class="lili-topo-txt"><b>Lili</b><span>Assistente da 100 Milhas · online</span></div>' +
      '<button type="button" class="lili-fechar" aria-label="Fechar a Lili">&times;</button>' +
    '</div>' +
    '<div class="lili-corpo"><div class="central-corpo"></div></div>' +
    '<div class="lili-pe">Orientação preliminar, sem compromisso. Nada é enviado sem você decidir.</div>';

  if(!ehCentral) document.body.appendChild(lan);
  document.body.appendChild(fundo);
  document.body.appendChild(pan);

  var montada = false;
  function abrir(){
    if(aberto) return;
    aberto = true;
    if(!montada){ window.montarCentralLili(pan.querySelector('.lili-corpo')); montada = true; }
    pan.classList.add('aberto');
    fundo.classList.add('aberto');
    lan.setAttribute('aria-expanded','true');
    requestAnimationFrame(function(){
      pan.querySelector('.lili-fechar').focus({preventScroll:true});
    });
  }
  function fechar(){
    if(!aberto) return;
    aberto = false;
    pan.classList.remove('aberto');
    fundo.classList.remove('aberto');
    lan.setAttribute('aria-expanded','false');
    if(document.body.contains(lan)) lan.focus({preventScroll:true});
  }

  lan.addEventListener('click', function(){ aberto ? fechar() : abrir(); });
  pan.querySelector('.lili-fechar').addEventListener('click', fechar);
  fundo.addEventListener('click', fechar);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') fechar(); });

  // "Abrir a Lili" em qualquer CTA: nunca WhatsApp, sempre a Agente.
  document.querySelectorAll('[data-lili]').forEach(function(el){
    el.addEventListener('click', function(e){
      if(ehCentral) return; // na /central o link rola até a triagem da própria página
      e.preventDefault();
      abrir();
    });
  });
})();
