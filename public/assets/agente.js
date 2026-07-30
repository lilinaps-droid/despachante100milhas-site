/* =========================================================================
   AGENTE LILI — widget flutuante presente em todas as páginas
   Um botão discreto abre um painel com a LILI VIVA: chat de verdade,
   conectado ao MESMO cérebro do app (Cloudflare Workers AI, grátis),
   através do proxy same-origin /api/lili do próprio site.

   Nunca abre o WhatsApp direto: quem decide é a pessoa.
   Fallback sempre disponível: "Prefiro escolher por botões" volta para a
   triagem guiada (central.js), que roda 100% offline.

   Regras de convivência com a página:
   - fechada, a Agente não intercepta nenhum clique (pointer-events:none);
   - abre/fecha por clique, Esc e toque no fundo (celular);
   - qualquer elemento com [data-lili] abre o painel (fallback: /central).

   LGPD/compliance: o chat NUNCA promete aprovação e não pede dado de saúde
   detalhado (a persona do cérebro reforça isso); a URL do WhatsApp que sai
   da triagem é sempre neutra (ver central.js).
   ========================================================================= */
(function(){
  if(document.getElementById('lili-agente')) return;
  if(!window.montarCentralLili) return; // central.js precisa vir antes

  var ENDPOINT = '/api/lili'; // proxy same-origin -> cérebro vivo do app
  var SAUDACAO = 'Oi! Eu sou a Lili 💜 Me conta com as suas palavras o que você precisa — isenção PCD, Imposto de Renda de aposentado, multa ou CNH, ou documento do carro. Vou te orientar.';

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
    '<div class="lili-corpo"></div>' +
    '<div class="lili-pe">Orientação preliminar, sem compromisso. Não é parecer jurídico nem garantia de aprovação. A 100 Milhas é assessoria privada e não representa o DETRAN.</div>';

  if(!ehCentral) document.body.appendChild(lan);
  document.body.appendChild(fundo);
  document.body.appendChild(pan);

  var corpo = pan.querySelector('.lili-corpo');

  // ---------- CHAT VIVO ----------
  var historico = [];   // [{role:'user'|'assistant', content:'...'}]
  var aguardando = false;
  var msgsEl = null, inputEl = null;

  function esc(s){ var d=document.createElement('div'); d.textContent = s==null?'':String(s); return d.innerHTML; }

  function bolha(quem, htmlInterno){
    var b = document.createElement('div');
    if(quem === 'eu'){
      b.style.cssText = 'align-self:flex-end;max-width:82%;background:var(--roxo);color:#fff;padding:9px 13px;border-radius:16px;border-bottom-right-radius:5px;font-size:1rem;line-height:1.45;overflow-wrap:anywhere';
    } else {
      b.style.cssText = 'align-self:flex-start;max-width:88%;background:var(--claro);border:1px solid var(--linha);color:var(--texto);padding:9px 13px;border-radius:16px;border-top-left-radius:5px;font-size:1rem;line-height:1.5;overflow-wrap:anywhere';
    }
    b.innerHTML = htmlInterno;
    msgsEl.appendChild(b);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return b;
  }

  function perguntar(){
    aguardando = true;
    var dig = bolha('lili','<span style="opacity:.6">• • •</span>');
    fetch(ENDPOINT, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ mensagens: historico })
    })
    .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, d:j}; }); })
    .then(function(res){
      if(dig.parentNode) dig.parentNode.removeChild(dig);
      aguardando = false;
      if(res.ok && res.d && res.d.texto){
        historico.push({role:'assistant', content:res.d.texto});
        bolha('lili', esc(res.d.texto).replace(/\n/g,'<br>'));
      } else {
        bolha('lili','Tive um probleminha técnico agora. 🙏 Tenta de novo em instantes — ou toque em <b>“Prefiro escolher por botões”</b>, que funciona sempre.');
      }
      if(inputEl) inputEl.focus();
    })
    .catch(function(){
      if(dig.parentNode) dig.parentNode.removeChild(dig);
      aguardando = false;
      bolha('lili','Parece que estamos sem conexão. Verifica a internet e tenta de novo. 💜');
    });
  }

  function montarChat(){
    corpo.removeAttribute('data-central-montada');
    corpo.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden';
    corpo.innerHTML =
      '<div class="lili-msgs" style="flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:var(--e-5);display:flex;flex-direction:column;gap:10px"></div>' +
      '<form class="lili-form" style="flex:none;display:flex;gap:8px;padding:10px;border-top:1px solid var(--linha);background:#fff">' +
        '<input class="lili-in" type="text" autocomplete="off" enterkeyhint="send" placeholder="Escreva sua mensagem…" aria-label="Escreva sua mensagem" style="flex:1;min-width:0;padding:11px 14px;border:1px solid var(--linha);border-radius:var(--r-pill);font:inherit;color:var(--texto);background:#fff">' +
        '<button class="lili-send" type="submit" aria-label="Enviar" style="flex:none;width:44px;height:44px;border:0;border-radius:50%;background:var(--roxo);color:#fff;font-size:1.1rem;line-height:1;cursor:pointer">➤</button>' +
      '</form>' +
      '<div style="flex:none;padding:0 10px 9px;text-align:center">' +
        '<button type="button" class="lili-guiado" style="background:none;border:0;color:var(--roxo);font-size:.8rem;cursor:pointer;text-decoration:underline;font-family:var(--fonte-corpo)">Prefiro escolher por botões</button>' +
      '</div>';

    msgsEl = corpo.querySelector('.lili-msgs');
    inputEl = corpo.querySelector('.lili-in');
    var form = corpo.querySelector('.lili-form');

    if(!historico.length){ bolha('lili', SAUDACAO); }
    else {
      // reconstrói a conversa se o painel for remontado
      for(var i=0;i<historico.length;i++){
        bolha(historico[i].role==='user'?'eu':'lili', esc(historico[i].content).replace(/\n/g,'<br>'));
      }
    }

    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var t = inputEl.value.trim();
      if(!t || aguardando) return;
      inputEl.value = '';
      bolha('eu', esc(t));
      historico.push({role:'user', content:t});
      perguntar();
    });

    corpo.querySelector('.lili-guiado').addEventListener('click', montarGuiado);
  }

  function montarGuiado(){
    corpo.removeAttribute('style');            // volta ao bloco rolável padrão
    corpo.removeAttribute('data-central-montada');
    corpo.innerHTML = '<div class="central-corpo"></div>';
    // Lili TOP: em página de assunto claro, a triagem já começa nele
    var mapa = [
      [/^\/isencaopcd\/simulador/, null],
      [/^\/isencaopcd|^\/carros-pcd/, 'pcd_quem'],
      [/^\/impostoderenda/, 'ir_doenca'],
      [/^\/previdencia-pcd/, 'prev_tempo'],
      [/^\/cnh-suspensa|^\/recursos/, 'cnh_tipo'],
      [/^\/licenciamento|^\/ipva|^\/debitos|^\/transferencia/, 'doc_tipo']
    ];
    for(var mi=0; mi<mapa.length; mi++){
      if(mapa[mi][0].test(location.pathname)){ if(mapa[mi][1]) corpo.dataset.inicio = mapa[mi][1]; break; }
    }
    if(window.montarCentralLili) window.montarCentralLili(corpo);
  }

  // ---------- ABRIR / FECHAR ----------
  var montado = false;
  function abrir(){
    if(aberto) return;
    aberto = true;
    if(!montado){ montarChat(); montado = true; }
    pan.classList.add('aberto');
    fundo.classList.add('aberto');
    lan.setAttribute('aria-expanded','true');
    requestAnimationFrame(function(){
      if(inputEl){ try{ inputEl.focus({preventScroll:true}); }catch(e){ inputEl.focus(); } }
      else pan.querySelector('.lili-fechar').focus({preventScroll:true});
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
