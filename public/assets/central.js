/* =========================================================================
   CENTRAL DA LILI — triagem guiada
   Faz perguntas simples, entende o caso e leva a pessoa ao WhatsApp
   com o caso já resumido. Nunca promete resultado.
   Zero dependência externa. Roda offline.

   O motor é montável em qualquer container (página /central e o painel
   da Agente Lili usam o mesmo código): window.montarCentralLili(elemento).
   Cada resultado sai pelo canal certo: doc = documentação, pcd = PCD/IR.
   ========================================================================= */
(function(){
  if(window.montarCentralLili) return; // já carregado

  var ZAPS = { doc:'5513978144035', pcd:'5513978091064' };
  var ICO={carro:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M3 17v-4l2-5h14l2 5v4"/></svg>',moeda:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5A2.5 2.5 0 0 1 12 8h1a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h1a2.5 2.5 0 0 0 2.5-1.5"/></svg>',balanca:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0L5 8Zm14 0-3 6a3 3 0 0 0 6 0l-3-6Z"/></svg>',doc:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/></svg>'};

  // ---------- ÁRVORE DE TRIAGEM ----------
  var F = {
    inicio: {
      fala: 'Olá! Eu sou a Lili.',
      fala2: 'Me conta o que aconteceu — escolha o que mais se aproxima do seu caso.',
      p: '',
      d: '',
      o: [
        {i:'carro', t:'Quero comprar um carro com isenção', s:'Descubra se o seu caso merece análise PCD.', c:'Começar agora', ir:'pcd_quem'},
        {i:'moeda', t:'Sou aposentado ou pensionista', s:'Veja se faz sentido analisar a isenção de Imposto de Renda.', c:'Quero descobrir', ir:'ir_doenca'},
        {i:'balanca', t:'Recebi multa ou notificação da CNH', s:'Suspensão, cassação, pontos ou recurso.', c:'Analisar meu caso', ir:'cnh_tipo'},
        {i:'doc', t:'Preciso resolver documentos do veículo', s:'Transferência, IPVA, licenciamento, segunda via e regularização.', c:'Ver meu caminho', ir:'doc_tipo'},
        {i:'chat', t:'Não sei bem o que preciso', s:'Conte a sua situação e a Central ajuda a organizar.', c:'Conversar com a Central', ir:'geral'}
      ]
    },

    // ---- PCD ----
    pcd_quem: {
      p: 'O benefício seria para você ou para outra pessoa?',
      d: 'Isso muda o caminho do processo — e sim, quem não dirige também pode ter direito.',
      o: [
        {t:'Para mim', ir:'pcd_dirige', set:{beneficiario:'a própria pessoa'}},
        {t:'Para um filho, pai, mãe ou dependente', s:'A pessoa não dirige', ir:'pcd_condicao', set:{beneficiario:'um familiar (não condutor)', dirige:'não dirige — não condutor'}},
        {t:'Ainda não sei', ir:'pcd_condicao', set:{beneficiario:'a definir'}}
      ]
    },
    pcd_dirige: {
      p: 'Você dirige?',
      d: 'Quem não dirige também tem direito — nesse caso, outra pessoa conduz o veículo.',
      o: [
        {t:'Sim, eu dirijo', ir:'pcd_condicao', set:{dirige:'sim, condutor'}},
        {t:'Não dirijo', s:'Alguém dirigiria para mim', ir:'pcd_condicao', set:{dirige:'não dirige — não condutor'}}
      ]
    },
    pcd_condicao: {
      p: 'Qual condição melhor descreve o caso?',
      d: 'São mais de 70 condições possíveis. Se a sua não estiver aqui, escolha "outra".',
      o: [
        {t:'Problema de coluna, joelho ou mobilidade', s:'Hérnia de disco, artrose, dor crônica', ir:'pcd_laudo', set:{condicao:'limitação de mobilidade (coluna/joelho/artrose)'}},
        {t:'Amputação, prótese ou paralisia', ir:'pcd_laudo', set:{condicao:'amputação / prótese / paralisia'}},
        {t:'Sequela de AVC, Parkinson ou esclerose', ir:'pcd_laudo', set:{condicao:'condição neurológica (AVC/Parkinson/esclerose)'}},
        {t:'Autismo (TEA)', ir:'pcd_laudo', set:{condicao:'Transtorno do Espectro Autista (TEA)'}},
        {t:'Outra condição', s:'Explico no WhatsApp', ir:'pcd_laudo', set:{condicao:'outra condição — a detalhar'}}
      ]
    },
    pcd_laudo: {
      p: 'Você já tem laudo médico?',
      d: 'Não ter laudo não impede nada. A gente orienta como obter.',
      o: [
        {t:'Sim, já tenho', ir:'r_pcd', set:{laudo:'já tem laudo'}},
        {t:'Não tenho ainda', ir:'r_pcd', set:{laudo:'ainda sem laudo'}},
        {t:'Não sei o que é', ir:'r_pcd', set:{laudo:'precisa de orientação sobre o laudo'}}
      ]
    },

    // ---- IMPOSTO DE RENDA ----
    ir_doenca: {
      p: 'Existe algum diagnóstico grave envolvido?',
      d: 'A isenção de IR da Lei 7.713/88 depende do diagnóstico. Sua informação fica em sigilo.',
      o: [
        {t:'Sim, há um diagnóstico', s:'Prefiro detalhar no WhatsApp', ir:'ir_desconta', set:{diagnostico:'sim — a detalhar em sigilo'}},
        {t:'A doença está controlada ou em remissão', s:'Ex.: câncer em remissão', ir:'ir_desconta', set:{diagnostico:'doença controlada / em remissão'}},
        {t:'Não sei se se enquadra', ir:'ir_desconta', set:{diagnostico:'a verificar'}}
      ]
    },
    ir_desconta: {
      p: 'O imposto ainda é descontado do seu benefício?',
      d: 'Se já foi descontado no passado, pode haver valores a recuperar.',
      o: [
        {t:'Sim, é descontado todo mês', ir:'r_ir', set:{situacao:'imposto ainda descontado'}},
        {t:'Não é mais, mas já foi', s:'Quero saber do retroativo', ir:'r_ir', set:{situacao:'já foi descontado — interesse em retroativo'}},
        {t:'Não tenho certeza', ir:'r_ir', set:{situacao:'a verificar no holerite'}}
      ]
    },

    // ---- CNH ----
    cnh_tipo: {
      p: 'O que você recebeu?',
      d: 'Em CNH, prazo é tudo. Quanto antes, mais caminho existe.',
      o: [
        {t:'Notificação de suspensão da CNH', ir:'cnh_prazo', set:{caso:'suspensão da CNH'}},
        {t:'Notificação de cassação', ir:'cnh_prazo', set:{caso:'cassação da CNH'}},
        {t:'Uma multa que quero contestar', ir:'cnh_prazo', set:{caso:'recurso de multa'}},
        {t:'Bafômetro / Lei Seca', ir:'cnh_prazo', set:{caso:'bafômetro (Lei Seca)'}},
        {t:'Não sei bem o que é', ir:'cnh_prazo', set:{caso:'notificação a identificar'}}
      ]
    },
    cnh_prazo: {
      p: 'Quando você recebeu?',
      d: 'O prazo de defesa começa a correr a partir da notificação.',
      o: [
        {t:'Nos últimos dias', ir:'r_cnh', set:{prazo:'recebido há poucos dias'}},
        {t:'Há algumas semanas', ir:'r_cnh', set:{prazo:'recebido há algumas semanas'}},
        {t:'Faz tempo / não sei', ir:'r_cnh', set:{prazo:'data incerta'}}
      ]
    },

    // ---- DOCUMENTAÇÃO ----
    doc_tipo: {
      p: 'O que você precisa resolver?',
      d: 'É o que a gente mais faz. Costuma ser rápido.',
      o: [
        {t:'Licenciamento / CRLV', s:'Documento do carro em dia', ir:'r_doc', set:{servico:'licenciamento e CRLV'}},
        {t:'IPVA atrasado', ir:'r_doc', set:{servico:'IPVA atrasado'}},
        {t:'Transferência de veículo', ir:'r_doc', set:{servico:'transferência de veículo'}},
        {t:'Consultar débitos do carro', ir:'r_doc', set:{servico:'consulta de débitos'}},
        {t:'ATPV-e / comunicação de venda', ir:'r_doc', set:{servico:'ATPV-e / comunicação de venda'}}
      ]
    },

    // ---------- RESULTADOS ----------
    r_pcd: {
      fim:true, tom:'quente', canal:'pcd',
      link:{href:'/isencaopcd/simulador', txt:'Ver o diagnóstico detalhado do meu caso'},
      titulo:'Seu caso apresenta elementos que merecem análise especializada.',
      texto:'As condições que você descreveu estão entre as que costumam dar direito à isenção de IPI, ICMS e IPVA. <strong>Isso não é uma aprovação</strong> — quem aprova é o órgão, com base no laudo. Mas é caminho suficiente para valer a análise.<br><br><strong>E existe um prazo:</strong> as regras atuais valem até 31/12/2026.',
      msg:'Olá Lili! Passei pela Central e quero a análise do meu caso de isenção PCD.'
    },
    r_ir: {
      fim:true, tom:'quente', canal:'pcd',
      titulo:'Vale a pena olhar o seu caso.',
      texto:'A Lei 7.713/88 prevê isenção de Imposto de Renda para aposentados e pensionistas com doenças graves — e o entendimento dos tribunais é de que a isenção se mantém mesmo com a doença controlada. Pode haver, ainda, valores dos últimos 5 anos a recuperar.<br><br><strong>Não é promessa.</strong> É um caminho que precisa ser analisado com a sua documentação.',
      msg:'Olá Lili! Passei pela Central e quero analisar meu caso de isenção de Imposto de Renda.'
    },
    r_cnh: {
      fim:true, tom:'urgente',
      titulo:'Aqui o tempo joga contra. Fale hoje.',
      texto:'Casos de CNH têm prazo de defesa, e ele é curto. Existe defesa em mais situações do que a maioria das pessoas imagina — mas <strong>ninguém pode dizer se o seu caso tem saída sem ler a notificação.</strong><br><br>Traga o documento. A gente lê e te diz em que fase você está.',
      msg:'Olá Lili! É sobre minha CNH e passei pela Central. Preciso de ajuda.'
    },
    r_doc: {
      fim:true, tom:'frio',
      titulo:'Isso a gente resolve.',
      texto:'É o serviço que mais fazemos. Manda o Renavam ou a placa no WhatsApp que a gente levanta tudo, apresenta o valor exato — sem surpresa — e cuida do resto.<br><br><strong>E de quebra:</strong> se você paga IPVA todo ano, vale verificar se você não tem direito à isenção. Muita gente tem e nunca soube.',
      msg:'Olá Lili! Passei pela Central e preciso resolver a documentação do meu veículo.'
    },
    geral: {
      fim:true, tom:'frio',
      titulo:'Sem problema. A gente conversa.',
      texto:'Nem sempre a pessoa sabe nomear o que precisa — e tudo bem. Chama no WhatsApp, conta com as suas palavras, e a equipe te orienta a partir daí.',
      msg:'Olá Lili! Passei pela Central mas prefiro conversar direto.'
    }
  };

  function rotulo(k){
    var m = {beneficiario:'Beneficiário', dirige:'Dirige?', condicao:'Condição',
             laudo:'Laudo médico', diagnostico:'Diagnóstico', situacao:'Situação do imposto',
             caso:'Tipo de caso', prazo:'Quando recebeu', servico:'Serviço'};
    return m[k] || k;
  }

  // ---------- MOTOR (uma instância por container) ----------
  function montar(raiz){
    if(!raiz || raiz.dataset.centralMontada) return;
    raiz.dataset.centralMontada = '1';

    var hist = [];      // pilha de navegação
    var resp = {};      // respostas coletadas

    function pintar(id){
      var n = F[id];
      if(!n) return;
      var c = raiz.querySelector('.central-corpo');
      var passo = Math.min(hist.length, 4);
      var pct = n.fim ? 100 : (passo/4)*100;

      if(n.fim){
        var zapNum = ZAPS[n.canal] || ZAPS.doc;
        var linhas = Object.keys(resp).map(function(k){
          return '<div><span>'+rotulo(k)+'</span><b>'+resp[k]+'</b></div>';
        }).join('');
        // LGPD: a URL do WhatsApp leva mensagem NEUTRA.
        // Nada de condicao, laudo, diagnostico ou dado de saude na querystring.
        // O resumo continua visivel na tela, para a propria pessoa.
        var texto = n.msg;

        c.innerHTML =
          '<div class="barra"><i style="width:100%"></i></div>' +
          '<div class="resultado">' +
            '<div class="veredito'+(n.tom==='frio'?' frio':'')+'">' +
              '<div class="selo-r">'+n.titulo+'</div><p>'+n.texto+'</p>' +
            '</div>' +
            (linhas ? '<div class="resumo"><h4>O que eu já entendi do seu caso</h4>'+linhas+'</div>' : '') +
            (n.link ? '<a class="btn btn-roxo btn-bloco" href="'+n.link.href+'">'+n.link.txt+'</a>' : '') +
            '<a class="btn btn-ouro btn-bloco" target="_blank" rel="noopener" href="https://api.whatsapp.com/send?phone='+zapNum+'&text='+encodeURIComponent(texto)+'">Continuar no WhatsApp — a Lili já sabe do seu caso</a>' +
            '<p class="aviso-legal">Esta é uma orientação preliminar de caráter geral, com base nas suas respostas. <strong>Não constitui parecer jurídico nem garantia de aprovação.</strong> Cada caso é analisado individualmente pela nossa equipe. A Despachante 100 Milhas é uma empresa privada de assessoria e não representa o DETRAN.</p>' +
            '<button class="voltar" data-voltar>← Refazer</button>' +
          '</div>';
      } else {
        c.innerHTML =
          '<div class="barra"><i style="width:'+pct+'%"></i></div>' +
          (n.fala
            ? '<div class="fala-lili"><img src="/assets/lili-ia.webp" width="52" height="52" alt="Lili">' +
              '<div class="balao"><p>'+n.fala+'</p><p>'+(n.fala2||'')+'</p></div></div>'
            : '<div class="pergunta">'+n.p+'</div><div class="dica">'+n.d+'</div>') +
          '<div class="opcoes">' +
            n.o.map(function(o,i){
              return '<button class="opcao" data-i="'+i+'">' +
                (o.i ? '<span class="oico">'+ICO[o.i]+'</span>' : '') +
                '<span class="otxt"><b>'+o.t+'</b>' + (o.s?'<small>'+o.s+'</small>':'') +
                (o.c?'<span class="octa">'+o.c+' →</span>':'') + '</span></button>';
            }).join('') +
          '</div>' +
          (hist.length ? '<button class="voltar" data-voltar>← Voltar</button>' : '');
      }

      c.querySelectorAll('.opcao').forEach(function(b){
        b.addEventListener('click', function(){
          var o = n.o[+b.dataset.i];
          if(o.set) Object.keys(o.set).forEach(function(k){ resp[k]=o.set[k]; });
          hist.push(id);
          pintar(o.ir);
          raiz.scrollIntoView({behavior:'smooth', block:'nearest'});
        });
      });
      var v = c.querySelector('[data-voltar]');
      if(v) v.addEventListener('click', function(){
        if(!hist.length){ return; }
        var ant = hist.pop();
        if(F[ant] && F[ant].fim===undefined && !hist.length){ resp={}; }
        pintar(ant);
      });
    }

    pintar('inicio');
  }

  window.montarCentralLili = montar;

  // Monta automaticamente na página /central
  montar(document.getElementById('central'));
})();
