/* =========================================================================
   SIMULADOR DE DIREITOS PCD — /isencaopcd/simulador
   Aprofundamento da Central da Lili. A Central tria todos os serviços;
   este simulador mergulha só em PCD: 4 vereditos separados (IPI, ICMS,
   IPVA, restituição), próximos passos e o que costuma derrubar um pedido.

   REGRAS INVIOLÁVEIS (README do projeto):
   - Nunca promete aprovação. Sempre "pode ter direito".
   - Nenhum dado sensível na URL do WhatsApp: sem condição, sem laudo,
     sem diagnóstico, sem CPF. A mensagem é NEUTRA.
   - Zero rastreio antes do consentimento LGPD.
   ========================================================================= */
(function(){
  var raiz = document.getElementById('simulador-pcd');
  if(!raiz) return;

  var ZAP_PCD  = '5513978091064';                  // canal PCD, igual às demais páginas PCD
  var MSG_ZAP  = 'Olá! Fiz o Simulador de Direitos PCD no site da 100 Milhas e quero uma análise do meu caso.';
  var CHECKOUT = 'https://chk.eduzz.com/G92KOVRXWE'; // Diagnóstico de Direitos PCD — R$ 47

  var P = [
    { id:'quem', p:'Este diagnóstico é para você ou para outra pessoa?',
      d:'Familiares e responsáveis também podem dar entrada no pedido.',
      o:[ {t:'Para mim', s:'Eu sou a pessoa com deficiência'},
          {t:'Para um familiar', s:'Filho, cônjuge, pai, mãe ou dependente'},
          {t:'Para outra pessoa', s:'Sou responsável ou represento'} ] },

    { id:'condicao', p:'Qual condição se aproxima mais do caso?',
      d:'Se houver mais de uma, escolha a principal. A análise final considera todas.',
      o:[ {t:'Deficiência física ou motora', s:'Mobilidade reduzida, amputação, paralisia, sequelas', v:'ok'},
          {t:'Deficiência visual', s:'Cegueira ou baixa visão', v:'ok'},
          {t:'Deficiência intelectual ou mental', s:'Com diagnóstico médico', v:'ok'},
          {t:'Autismo (TEA)', s:'Transtorno do Espectro Autista', v:'ok'},
          {t:'Não sei encaixar / outra condição', s:'Precisa da leitura do laudo', v:'incerto'} ] },

    { id:'conduz', p:'A pessoa com deficiência dirige?',
      d:'Isso muda o caminho do processo, mas não impede o pedido.',
      o:[ {t:'Sim, dirige', s:'Tem CNH ativa', v:'conduz'},
          {t:'Não dirige', s:'Outra pessoa conduzirá o veículo', v:'naoconduz'},
          {t:'Ainda não tem CNH', s:'Pretende tirar ou está em processo', v:'naoconduz'} ] },

    { id:'laudo', p:'Já existe laudo médico do caso?',
      d:'O laudo é o documento que sustenta todo o pedido.',
      o:[ {t:'Sim, tenho laudo atualizado', v:'ok'},
          {t:'Tenho, mas é antigo', s:'Mais de 1 ano ou desatualizado', v:'parcial'},
          {t:'Ainda não tenho', s:'A gente orienta como obter', v:'nao'} ] },

    { id:'negado', p:'Você já teve algum pedido negado antes?',
      d:'Pedido negado não é o fim. Quase sempre o problema está na documentação.',
      o:[ {t:'Não, é a primeira vez'},
          {t:'Sim, já foi negado', s:'Vamos entender o motivo antes de refazer'},
          {t:'Tenho pedido em andamento', s:'Quero saber se está correto'} ] }
  ];

  var passo = 0, R = {};

  function analisar(){
    var incerto  = R.condicao === 'incerto';
    var laudoOk  = R.laudo === 'ok';
    var base     = (incerto || !laudoOk) ? 'ambar' : 'verde';

    return [
      { n:'IPI', sub:'Imposto federal — na compra de veículo novo', s:base,
        q: incerto
           ? 'Sem a leitura do laudo não dá para enquadrar a condição nas categorias previstas em lei.'
           : (R.conduz === 'naoconduz'
              ? 'O seu caso pode se enquadrar mesmo sem a pessoa dirigir — o veículo pode ser conduzido por terceiro indicado.'
              : 'O seu perfil aponta para o enquadramento como condutor.') },
      { n:'ICMS', sub:'Imposto estadual — na compra de veículo novo', s:base,
        q:'Depende das regras do seu estado e do valor do veículo. É a etapa que mais gera indeferimento por documentação incompleta.' },
      { n:'IPVA', sub:'Imposto anual — vale inclusive para o carro que você já tem', s:base,
        q:'Não é só para carro novo. Muita gente paga IPVA há anos sem saber que pode pedir isenção.' },
      { n:'Restituição de IPVA', sub:'Valores já pagos em anos anteriores', s:'ambar',
        q:'Se o direito já existia e o imposto foi pago mesmo assim, pode haver valores a restituir. Depende do prazo e do histórico do veículo.' }
    ];
  }

  var TAG = { verde:'Indicação favorável', ambar:'Precisa de análise' };

  function pintar(){
    var c = raiz.querySelector('.central-corpo');

    if(passo >= P.length) return resultado(c);

    var n = P[passo];
    var pct = (passo / P.length) * 100;

    c.innerHTML =
      '<div class="barra"><i style="width:'+pct+'%"></i></div>' +
      '<p class="sp-conta">Pergunta '+(passo+1)+' de '+P.length+' · '+Math.round(pct)+'%</p>' +
      '<div class="pergunta" tabindex="-1">'+n.p+'</div>' +
      '<div class="dica">'+n.d+'</div>' +
      '<div class="opcoes" role="group" aria-label="'+n.p+'">' +
        n.o.map(function(o,i){
          return '<button class="opcao" data-i="'+i+'"><span class="otxt"><b>'+o.t+'</b>' +
                 (o.s ? '<small>'+o.s+'</small>' : '') + '</span></button>';
        }).join('') +
      '</div>' +
      (passo > 0 ? '<button class="voltar" data-voltar>← Voltar</button>' : '');

    c.querySelectorAll('.opcao').forEach(function(b){
      b.addEventListener('click', function(){
        var o = n.o[+b.dataset.i];
        R[n.id] = o.v || o.t;
        passo++;
        pintar();
      });
    });

    var v = c.querySelector('[data-voltar]');
    if(v) v.addEventListener('click', function(){ passo--; pintar(); });

    foco(c);
  }

  function resultado(c){
    var itens  = analisar();
    var verdes = itens.filter(function(i){ return i.s === 'verde'; }).length;

    c.innerHTML =
      '<div class="barra"><i style="width:100%"></i></div>' +
      '<p class="sp-conta">Resultado da sua triagem · 100%</p>' +
      '<div class="resultado">' +

        '<div class="veredito'+(verdes ? '' : ' frio')+'">' +
          '<div class="selo-r" tabindex="-1">' +
            (verdes
              ? 'O seu caso reúne elementos que merecem análise de isenção.'
              : 'O seu caso precisa de análise documental para ser enquadrado.') +
          '</div>' +
          '<p>Orientação inicial, feita apenas com o que você respondeu. O direito só se confirma com a leitura do laudo e dos documentos.</p>' +
        '</div>' +

        itens.map(function(i){
          return '<div class="sp-item sp-'+i.s+'">' +
                   '<span class="sp-luz" aria-hidden="true"></span>' +
                   '<div>' +
                     '<p class="sp-tag">'+TAG[i.s]+'</p>' +
                     '<h3>'+i.n+'</h3>' +
                     '<p class="sp-sub">'+i.sub+'</p>' +
                     '<p>'+i.q+'</p>' +
                   '</div>' +
                 '</div>';
        }).join('') +

        '<div class="sp-passos">' +
          '<h3>Os seus próximos passos</h3>' +
          '<ol>' +
            '<li><b>Fazer o laudo médico</b><small>Com CID e descrição da limitação funcional. É a peça que sustenta tudo.</small></li>' +
            '<li><b>Separar a documentação</b><small>Identidade, comprovante de residência, CNH (se houver) e dados do condutor indicado.</small></li>' +
            '<li><b>Protocolar o pedido</b><small>Cada imposto tem um órgão e uma ordem certa. Fora de ordem, o processo trava.</small></li>' +
            '<li><b>Comprar o veículo</b><small>Só depois da autorização. Comprar antes é o erro mais caro que existe.</small></li>' +
          '</ol>' +
        '</div>' +

        '<div class="sp-vizinho">' +
          '<span class="sp-selo-v">Outro direito, separado deste</span>' +
          '<h3>Imposto de Renda: aposentado ou pensionista?</h3>' +
          '<p>A isenção de Imposto de Renda não depende de deficiência — depende de <b>aposentadoria ou pensão + doença grave prevista na Lei 7.713/88</b>. São critérios diferentes, e muita gente tem os dois direitos e só pede um.</p>' +
          '<p>Pode haver, ainda, valores dos últimos anos a recuperar.</p>' +
          '<a class="btn btn-linha btn-bloco" href="/impostoderenda" data-sp="ir">Ver se o meu caso se encaixa no Imposto de Renda</a>' +
        '</div>' +

        '<div class="sp-honesto">' +
          '<h3>Para ser justo com você: o que costuma derrubar um pedido</h3>' +
          '<ul>' +
            '<li>Laudo genérico, sem CID e sem descrever a limitação funcional.</li>' +
            '<li>Condição temporária, sem caráter permanente comprovado.</li>' +
            '<li>Veículo acima do teto de valor previsto para o benefício estadual.</li>' +
            '<li>Pedido dentro do prazo de carência de uma isenção anterior.</li>' +
            '<li>Documentação do condutor indicado incompleta ou fora do vínculo exigido.</li>' +
          '</ul>' +
        '</div>' +

        '<div class="sp-oferta">' +
          '<span class="sp-selo">Diagnóstico de Direitos PCD</span>' +
          '<h3>Cada um desses passos tem um erro que faz o pedido voltar do zero.</h3>' +
          '<p>Esta simulação leu as suas respostas. O Diagnóstico lê o seu caso: a nossa equipe analisa a sua situação e devolve o caminho do seu processo, por escrito.</p>' +
          '<p class="sp-preco">R$ 47</p>' +
          '<a class="btn btn-ouro btn-bloco" href="'+CHECKOUT+'" rel="noopener" data-sp="checkout">Quero o Diagnóstico do meu caso</a>' +
          '<a class="btn btn-linha btn-bloco" href="https://api.whatsapp.com/send?phone='+ZAP_PCD+'&text='+encodeURIComponent(MSG_ZAP)+'" target="_blank" rel="noopener" data-sp="zap">Prefiro falar com a equipe</a>' +
        '</div>' +

        '<p class="aviso-legal">Esta simulação é informativa e não substitui a análise individual nem a decisão dos órgãos competentes. <strong>Não constitui parecer jurídico nem garantia de aprovação.</strong> A Despachante 100 Milhas é uma empresa privada de assessoria e não representa o DETRAN.</p>' +
        '<button class="voltar" data-refazer>← Refazer a simulação</button>' +
      '</div>';

    c.querySelector('[data-refazer]').addEventListener('click', function(){
      passo = 0; R = {}; pintar();
    });

    foco(c);
  }

  function foco(c){
    var alvo = c.querySelector('.pergunta, .selo-r');
    if(alvo) alvo.focus({preventScroll:true});
    raiz.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  /* ---- Acessibilidade: ajuste de corpo de texto ---- */
  var esc = 100;
  function escala(d){
    esc = Math.min(130, Math.max(90, esc + d));
    raiz.style.fontSize = esc + '%';
  }
  var mais  = document.getElementById('sp-mais');
  var menos = document.getElementById('sp-menos');
  if(mais)  mais.addEventListener('click',  function(){ escala(10); });
  if(menos) menos.addEventListener('click', function(){ escala(-10); });

  pintar();
})();
