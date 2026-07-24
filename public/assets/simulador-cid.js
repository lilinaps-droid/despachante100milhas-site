/* =========================================================================
   SIMULADOR POR CONDIÇÃO / CID — /isencaopcd/simulador-cid
   Irmão do Simulador de Direitos PCD. Aqui a pessoa parte da DOENÇA/CID:
   digita a condição (ou o código do CID) e recebe uma leitura de
   enquadramento — nunca do valor do carro, sempre da condição.

   REGRAS INVIOLÁVEIS (README do projeto):
   - Nunca promete aprovação. Sempre "costuma / pode enquadrar".
   - Nunca crava um "não": no máximo "depende da análise do laudo".
   - O direito não vem do código do CID — vem da limitação funcional.
   - Nenhum dado sensível na URL do WhatsApp: sem condição, sem CID,
     sem laudo, sem CPF. A mensagem é NEUTRA.
   - Zero rastreio antes do consentimento LGPD. Busca 100% no navegador.
   ========================================================================= */
(function(){
  var raiz = document.getElementById('simulador-cid');
  if(!raiz) return;

  var ZAP_PCD  = '5513978144035';
  var MSG_ZAP  = 'Olá! Fiz o Simulador de Direitos PCD no site da 100 Milhas e quero uma análise do meu caso.';
  var CHECKOUT = 'https://chk.eduzz.com/G92KOVRXWE'; // Diagnóstico de Direitos PCD — R$ 47

  /* v = costuma enquadrar · a = depende da análise do laudo
     ir = também é doença grave para isenção de Imposto de Renda (Lei 7.713/88) */
  var D = [
    {n:'Amputação de membro', c:'CID Z89 · S48–S88', s:['amputacao','amputado','amputada','perna amputada','braco amputado','mao amputada','pe amputado','coto','ausencia de membro'], f:'v',
     t:'A amputação é um dos enquadramentos mais diretos: a perda do membro caracteriza a deficiência física de forma permanente, para condutor e não condutor.',
     l:'O laudo precisa registrar o membro amputado e o comprometimento funcional resultante.'},
    {n:'Paraplegia / paralisia dos membros inferiores', c:'CID G82', s:['paraplegia','paraplegico','paralisia','paralisia das pernas','cadeirante','paralisia total','paralisia parcial','paralisia inferior'], f:'v',
     t:'A paralisia de membros é enquadramento clássico da isenção PCD — vale inclusive para quem não dirige, indicando um condutor.',
     l:'O laudo deve descrever o nível da lesão e a limitação motora permanente.'},
    {n:'Tetraplegia / tetraparesia / paraparesia', c:'CID G82', s:['tetraplegia','tetraparesia','paraparesia','tetraplegico','tetra'], f:'v',
     t:'A perda de força nos quatro membros (ou nos inferiores) reúne, em regra, os elementos da deficiência física.',
     l:'O laudo deve trazer o grau da perda de força e o caráter permanente.'},
    {n:'Hemiparesia / hemiplegia', c:'CID G81', s:['hemiparesia','hemiplegia','lado paralisado','metade do corpo','sequela de avc'], f:'v',
     t:'A perda de força ou movimento de um lado do corpo costuma reunir os elementos da deficiência física.',
     l:'O laudo precisa indicar o lado afetado, o grau da perda e a permanência.'},
    {n:'Monoparesia / monoplegia', c:'CID G83', s:['monoparesia','monoplegia','paralisia de um membro','um braco paralisado','uma perna paralisada'], f:'v',
     t:'A perda de força em um membro costuma enquadrar quando é permanente e limita o uso do veículo comum.',
     l:'O laudo deve descrever o membro afetado e a limitação funcional.'},
    {n:'Lesão medular', c:'CID G95 · S14–S34', s:['lesao medular','medula','trauma raquimedular','medula espinhal'], f:'v',
     t:'A lesão medular é enquadramento típico da isenção PCD pela limitação motora que provoca.',
     l:'O laudo deve trazer o nível da lesão e as sequelas motoras permanentes.'},
    {n:'Paralisia cerebral', c:'CID G80', s:['paralisia cerebral','pc','encefalopatia'], f:'v',
     t:'A paralisia cerebral costuma enquadrar pela limitação motora, mesmo em graus mais leves.',
     l:'O laudo deve descrever o comprometimento motor e sua permanência.'},
    {n:'Poliomielite (sequelas)', c:'CID B91', s:['poliomielite','polio','sequela de polio','paralisia infantil'], f:'v',
     t:'As sequelas de poliomielite (atrofia, perda de força, encurtamento) costumam enquadrar.',
     l:'O laudo deve registrar a sequela e a limitação atual.'},
    {n:'Esclerose múltipla', c:'CID G35', s:['esclerose multipla','em'], f:'v', ir:1,
     t:'A esclerose múltipla costuma enquadrar quando já há limitação motora. Também é doença grave para a isenção de Imposto de Renda.',
     l:'O laudo deve descrever a limitação funcional atual e sua evolução.'},
    {n:'Esclerose lateral amiotrófica (ELA)', c:'CID G12.2', s:['ela','esclerose lateral','esclerose lateral amiotrofica'], f:'v', ir:1,
     t:'A ELA compromete progressivamente a força muscular e costuma enquadrar. Também é doença grave para o Imposto de Renda.',
     l:'O laudo deve trazer o grau atual de comprometimento motor.'},
    {n:'Doença de Parkinson', c:'CID G20', s:['parkinson','mal de parkinson','doenca de parkinson'], f:'v', ir:1,
     t:'O Parkinson costuma enquadrar quando os sintomas motores (rigidez, tremor, lentidão) limitam a condução comum. Também é doença grave para o Imposto de Renda.',
     l:'O laudo deve descrever o estágio e a limitação motora.'},
    {n:'Distrofia muscular', c:'CID G71', s:['distrofia muscular','duchenne','distrofia'], f:'v',
     t:'A distrofia muscular reduz a força de forma progressiva e permanente e costuma enquadrar.',
     l:'O laudo deve registrar o grau de perda de força atual.'},
    {n:'Encurtamento / dismetria de membro', c:'CID Q72 · M21', s:['encurtamento','dismetria','uma perna mais curta','perna mais curta','membro mais curto'], f:'v',
     t:'A diferença de comprimento entre os membros, quando relevante, costuma caracterizar a limitação física.',
     l:'O laudo deve quantificar o encurtamento e o impacto na marcha/condução.'},
    {n:'Uso de prótese ou órtese', c:'CID Z97', s:['protese','ortese','protese na perna','protese no braco','uso de protese'], f:'v',
     t:'O uso de prótese ou órtese indica uma limitação estrutural do membro que costuma enquadrar.',
     l:'O laudo deve descrever a condição de base e a limitação funcional.'},
    {n:'Nanismo / acondroplasia', c:'CID Q77', s:['nanismo','acondroplasia','baixa estatura'], f:'v',
     t:'O nanismo é reconhecido para fins de isenção PCD.',
     l:'O laudo deve trazer o diagnóstico e as medidas.'},
    {n:'Malformação congênita de membros', c:'CID Q71–Q73', s:['malformacao','focomelia','ma formacao','agenesia de membro','ma-formacao'], f:'v',
     t:'A ausência ou malformação congênita de membros costuma enquadrar de forma direta.',
     l:'O laudo deve descrever a malformação e a limitação resultante.'},
    {n:'Artrogripose', c:'CID Q74', s:['artrogripose'], f:'v',
     t:'A artrogripose limita a mobilidade das articulações e costuma enquadrar.',
     l:'O laudo deve registrar as articulações afetadas e a limitação.'},
    {n:'Autismo (TEA)', c:'CID F84', s:['autismo','tea','espectro autista','asperger','transtorno do espectro'], f:'v',
     t:'O Transtorno do Espectro Autista é expressamente reconhecido para fins de isenção PCD, em qualquer grau de suporte.',
     l:'Laudo com o diagnóstico (CID F84) e o nível de suporte.'},
    {n:'Síndrome de Down', c:'CID Q90', s:['sindrome de down','down','trissomia 21'], f:'v',
     t:'A Síndrome de Down é reconhecida para a isenção PCD.',
     l:'Laudo com o diagnóstico e a avaliação funcional.'},
    {n:'Deficiência intelectual / mental', c:'CID F70–F79', s:['deficiencia intelectual','deficiencia mental','atraso cognitivo','deficiencia cognitiva'], f:'v',
     t:'A deficiência intelectual é uma das categorias previstas para a isenção PCD.',
     l:'Laudo com o diagnóstico e o grau de comprometimento.'},
    {n:'Deficiência visual / cegueira / baixa visão', c:'CID H54', s:['cegueira','cego','baixa visao','deficiencia visual','visao monocular','perda de visao','pouca visao'], f:'v', ir:1,
     t:'Cegueira e baixa visão dentro dos parâmetros legais enquadram na isenção PCD. A cegueira também é doença grave para o Imposto de Renda.',
     l:'Laudo oftalmológico com a acuidade e o campo visual.'},
    {n:'Deficiência auditiva / surdez', c:'CID H90 · H91', s:['surdez','surdo','deficiencia auditiva','perda auditiva','nao escuta'], f:'v',
     t:'A surdez, dentro dos parâmetros legais, é reconhecida para a isenção PCD.',
     l:'Laudo audiológico com a perda em decibéis.'},
    {n:'Artrose / osteoartrose', c:'CID M15–M19', s:['artrose','osteoartrose','desgaste da articulacao','desgaste no quadril','coxartrose'], f:'a',
     t:'A artrose pode enquadrar — mas não pelo diagnóstico em si, e sim pelo grau de limitação de movimento que ela provoca.',
     l:'O laudo precisa quantificar a limitação funcional e o caráter permanente, não apenas citar a artrose.'},
    {n:'Artrite / artrite reumatoide', c:'CID M05 · M06', s:['artrite','artrite reumatoide','poliartrite'], f:'a',
     t:'A artrite entra na análise quando compromete a mobilidade de forma significativa e permanente.',
     l:'O laudo deve demonstrar a limitação articular e a permanência.'},
    {n:'Hérnia de disco', c:'CID M50 · M51', s:['hernia de disco','hernia','disco','protrusao discal','hernia lombar','hernia cervical'], f:'a',
     t:'A hérnia de disco entra na análise quando gera limitação funcional relevante e permanente — o que precisa estar comprovado.',
     l:'Exames e laudo demonstrando a limitação de movimento e a permanência.'},
    {n:'Problemas de coluna / lombalgia / espondilose', c:'CID M47 · M54', s:['coluna','lombalgia','dor na coluna','espondilose','bico de papagaio','osteofito','dor lombar'], f:'a',
     t:'Dores e desgastes da coluna são avaliados pela limitação que causam, não pelo diagnóstico isolado.',
     l:'O laudo deve descrever a limitação funcional e o caráter permanente.'},
    {n:'Escoliose', c:'CID M41', s:['escoliose','desvio de coluna'], f:'a',
     t:'A escoliose pode enquadrar em graus acentuados, quando limita a mobilidade de forma permanente.',
     l:'Laudo com o grau da curvatura e a limitação resultante.'},
    {n:'Problemas no joelho / gonartrose', c:'CID M17', s:['joelho','gonartrose','problema no joelho','menisco','desgaste no joelho','protese de joelho'], f:'a',
     t:'Limitações no joelho enquadram quando comprometem a marcha ou a condução de forma permanente.',
     l:'O laudo deve trazer a limitação de movimento e a permanência.'},
    {n:'LER / DORT / tendinite', c:'CID M65–M77', s:['ler','dort','tendinite','bursite','lesao por esforco','sindrome do tunel'], f:'a',
     t:'Lesões por esforço repetitivo são avaliadas caso a caso, pela limitação funcional que deixam.',
     l:'O laudo deve demonstrar a limitação atual e seu caráter permanente.'},
    {n:'Fibromialgia', c:'CID M79.7', s:['fibromialgia'], f:'a',
     t:'A fibromialgia é avaliada caso a caso: enquadra quando o laudo demonstra limitação funcional significativa e permanente.',
     l:'O laudo deve detalhar as limitações no dia a dia e a permanência.'},
    {n:'Espondilite anquilosante', c:'CID M45', s:['espondilite','espondilite anquilosante'], f:'a',
     t:'A espondilite anquilosante pode enquadrar quando reduz a mobilidade de forma permanente.',
     l:'Laudo com o comprometimento articular e a rigidez.'},
    {n:'AVC (Acidente Vascular Cerebral)', c:'CID I63 · I69', s:['avc','derrame','acidente vascular','isquemia cerebral','avc isquemico','avc hemorragico'], f:'v',
     t:'O AVC costuma enquadrar quando deixa sequela motora permanente (por exemplo, hemiparesia). É a sequela — não o episódio — que sustenta o pedido.',
     l:'Laudo com a sequela motora atual e seu caráter permanente.'},
    {n:'Epilepsia', c:'CID G40', s:['epilepsia','convulsao','crises convulsivas'], f:'a',
     t:'A epilepsia é avaliada caso a caso, conforme o controle das crises e a limitação que impõe.',
     l:'Laudo neurológico com a frequência das crises e a limitação.'},
    {n:'Miastenia grave', c:'CID G70', s:['miastenia','miastenia grave'], f:'a',
     t:'A miastenia grave pode enquadrar quando a fraqueza muscular limita a condução de forma relevante.',
     l:'Laudo com o grau de fraqueza e a permanência.'},
    {n:'Sequela de fratura / trauma', c:'CID T90–T98', s:['fratura','sequela de fratura','trauma','acidente','sequela de acidente'], f:'a',
     t:'Sequelas de fraturas ou traumas enquadram quando deixam limitação de movimento permanente.',
     l:'O laudo deve descrever a sequela e a limitação atual.'},
    {n:'Câncer / neoplasia maligna', c:'CID C00–C97', s:['cancer','neoplasia','tumor maligno','oncologico','quimioterapia','mastectomia'], f:'a', ir:1,
     t:'Para a isenção do veículo, o câncer entra quando deixa limitação física (por exemplo, amputação ou sequela). Já para o Imposto de Renda, a neoplasia maligna é doença grave prevista em lei.',
     l:'Laudo da limitação funcional para o veículo; laudo oncológico para o IR.'},
    {n:'Cardiopatia grave', c:'CID I00–I52', s:['cardiopatia','problema no coracao','coracao','insuficiencia cardiaca','cardiaco'], f:'a', ir:1,
     t:'A cardiopatia grave é avaliada caso a caso para o veículo. Para o Imposto de Renda, é doença grave prevista em lei.',
     l:'Laudo cardiológico com a gravidade e a limitação.'},
    {n:'Insuficiência renal / nefropatia grave', c:'CID N18', s:['insuficiencia renal','nefropatia','rim','hemodialise','dialise','renal cronico'], f:'a', ir:1,
     t:'A nefropatia grave é avaliada caso a caso para o veículo. Para o Imposto de Renda, é doença grave prevista em lei.',
     l:'Laudo nefrológico com o estágio e a limitação.'},
    {n:'HIV / AIDS', c:'CID B20–B24', s:['hiv','aids','sida','imunodeficiencia'], f:'a', ir:1,
     t:'Para o Imposto de Renda, a AIDS é doença grave prevista em lei. Para a isenção do veículo, depende de haver limitação física comprovada.',
     l:'Laudo médico conforme o direito pretendido.'},
    {n:'Hanseníase', c:'CID A30', s:['hanseniase','lepra'], f:'a', ir:1,
     t:'Para o Imposto de Renda, a hanseníase é doença grave prevista em lei. Para o veículo, depende de sequelas que limitem a condução.',
     l:'Laudo com as sequelas e a limitação, quando houver.'},
    {n:'Diabetes', c:'CID E10 · E11', s:['diabetes','diabetico','glicemia','diabete'], f:'a',
     t:'O diabetes, isoladamente, costuma não dar direito. O que pode enquadrar são as complicações — neuropatia com perda de força, amputação ou retinopatia grave.',
     l:'O laudo deve documentar a complicação e a limitação que ela causa.'},
    {n:'Hipertensão', c:'CID I10', s:['hipertensao','pressao alta'], f:'a',
     t:'A hipertensão, sozinha, em regra não dá direito. O que pode enquadrar são consequências graves (por exemplo, sequela de AVC).',
     l:'O laudo deve documentar a consequência e a limitação, quando houver.'}
  ];

  function norm(x){ return (x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  D.forEach(function(d){ d.k = norm(d.n + ' ' + d.c + ' ' + d.s.join(' ')); });

  var POP = ['amputacao','artrose','hernia de disco','problemas de coluna','acidente vascular','autismo','cegueira','parkinson'];
  var TAG = { v:'Costuma enquadrar', a:'Depende da análise do laudo' };

  var corpo = raiz.querySelector('.central-corpo');

  function opcoesHTML(lista){
    return lista.map(function(d,i){
      return '<button class="opcao" data-k="'+d.k+'"><span class="otxt"><b>'+d.n+'</b><small>'+d.c+'</small></span></button>';
    }).join('') +
    '<button class="opcao" data-generico="1"><span class="otxt"><b>Não encontrei a minha condição</b><small>A gente lê o seu laudo mesmo assim</small></span></button>';
  }

  function buscar(q){
    q = norm(q).trim();
    if(!q){
      var out = [];
      POP.forEach(function(t){
        var m = D.filter(function(d){ return d.k.indexOf(t) > -1; })[0];
        if(m && out.indexOf(m) < 0) out.push(m);
      });
      return out;
    }
    var termos = q.split(/\s+/);
    return D.filter(function(d){
      return termos.every(function(t){ return d.k.indexOf(t) > -1; });
    }).slice(0, 8);
  }

  function tela(){
    corpo.innerHTML =
      '<div class="barra"><i style="width:8%"></i></div>' +
      '<p class="sp-conta">Consulta por condição · sem cadastro · sem CPF</p>' +
      '<div class="pergunta" tabindex="-1">Qual é a sua condição ou diagnóstico?</div>' +
      '<div class="dica">Digite o nome da doença, a sequela ou o código do CID — por exemplo: <em>artrose</em>, <em>hérnia</em>, <em>AVC</em>, <em>autismo</em> ou <em>M51</em>.</div>' +
      '<div class="campo"><label for="cid-busca">Buscar condição ou CID</label>' +
      '<input id="cid-busca" type="text" autocomplete="off" placeholder="Ex.: artrose, hérnia de disco, autismo, M51…"></div>' +
      '<div class="opcoes" id="cid-opcoes" role="group" aria-label="Condições encontradas"></div>';

    var input = corpo.querySelector('#cid-busca');
    var lista = corpo.querySelector('#cid-opcoes');

    function pinta(){
      var achados = buscar(input.value);
      lista.innerHTML = opcoesHTML(achados);
      lista.querySelectorAll('.opcao').forEach(function(b){
        b.addEventListener('click', function(){
          if(b.dataset.generico){ return resultado(null); }
          var d = D.filter(function(x){ return x.k === b.dataset.k; })[0];
          resultado(d || null);
        });
      });
    }
    input.addEventListener('input', pinta);
    pinta();
    foco();
  }

  function base(){
    return '<div class="sp-passos">' +
        '<h3>Os seus próximos passos</h3>' +
        '<ol>' +
          '<li><b>Fazer (ou atualizar) o laudo médico</b><small>Com o CID e a descrição da limitação funcional. É a peça que sustenta tudo.</small></li>' +
          '<li><b>Separar a documentação</b><small>Identidade, comprovante de residência, CNH (se houver) e dados do condutor indicado.</small></li>' +
          '<li><b>Protocolar o pedido</b><small>Cada imposto tem um órgão e uma ordem certa. Fora de ordem, o processo trava.</small></li>' +
          '<li><b>Comprar o veículo</b><small>Só depois da autorização. Comprar antes é o erro mais caro que existe.</small></li>' +
        '</ol>' +
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
        '<h3>Esta busca leu o nome da condição. O Diagnóstico lê o seu caso.</h3>' +
        '<p>A nossa equipe analisa a sua situação e o seu laudo e devolve, por escrito, o caminho do seu processo — quais isenções pedir e em que ordem.</p>' +
        '<p class="sp-preco">R$ 47</p>' +
        '<a class="btn btn-ouro btn-bloco" href="'+CHECKOUT+'" rel="noopener" data-sp="checkout">Quero o Diagnóstico do meu caso</a>' +
        '<a class="btn btn-linha btn-bloco" href="https://api.whatsapp.com/send?phone='+ZAP_PCD+'&text='+encodeURIComponent(MSG_ZAP)+'" target="_blank" rel="noopener" data-sp="zap">Prefiro falar com a equipe</a>' +
      '</div>' +
      '<p class="aviso-legal">Esta simulação é informativa e não substitui a análise individual nem a decisão dos órgãos competentes. <strong>Não constitui parecer jurídico nem garantia de aprovação.</strong> A Despachante 100 Milhas é uma empresa privada de assessoria e não representa o DETRAN.</p>' +
      '<button class="voltar" data-refazer>← Consultar outra condição</button>';
  }

  function resultado(d){
    var generico = !d;
    var f = generico ? 'a' : d.f;
    var cls = (f === 'v') ? 'sp-verde' : 'sp-ambar';
    var nome = generico ? 'A sua condição' : d.n;

    var selo = generico
      ? 'A sua condição precisa da leitura do laudo para ser enquadrada.'
      : (f === 'v'
          ? '“'+d.n+'” costuma reunir elementos para a isenção PCD.'
          : '“'+d.n+'” pode dar direito — depende da limitação que o laudo comprovar.');

    var leitura = generico
      ? 'Nem toda condição cabe numa lista, e tudo bem: muitos direitos aparecem só quando alguém lê o laudo com atenção. É exatamente isso que a nossa equipe faz.'
      : d.t;

    var laudoTxt = generico
      ? 'Um laudo com o CID e a descrição clara da limitação funcional é o que permite enquadrar (ou não) o seu caso.'
      : d.l;

    var html =
      '<div class="barra"><i style="width:100%"></i></div>' +
      '<p class="sp-conta">Leitura da sua condição · orientação inicial</p>' +
      '<div class="resultado">' +

        '<div class="veredito'+(f==='v' ? '' : ' frio')+'">' +
          '<div class="selo-r" tabindex="-1">'+selo+'</div>' +
          '<p>Esta leitura é geral, feita só pelo nome da condição. <strong>O direito não vem do código do CID — vem da limitação funcional que o seu laudo comprova.</strong></p>' +
        '</div>' +

        '<div class="sp-item '+cls+'">' +
          '<span class="sp-luz" aria-hidden="true"></span>' +
          '<div>' +
            '<p class="sp-tag">'+TAG[f]+'</p>' +
            '<h3>'+nome+'</h3>' +
            (generico ? '' : '<p class="sp-sub">'+d.c+'</p>') +
            '<p>'+leitura+'</p>' +
          '</div>' +
        '</div>' +

        '<div class="sp-item '+cls+'">' +
          '<span class="sp-luz" aria-hidden="true"></span>' +
          '<div>' +
            '<p class="sp-tag">O laudo é o que decide</p>' +
            '<h3>O que o seu laudo precisa provar</h3>' +
            '<p>'+laudoTxt+'</p>' +
          '</div>' +
        '</div>' +

        '<div class="sp-item sp-ambar">' +
          '<span class="sp-luz" aria-hidden="true"></span>' +
          '<div>' +
            '<p class="sp-tag">Vale também para quem já tem carro</p>' +
            '<h3>IPVA — inclusive do veículo atual</h3>' +
            '<p>A isenção não é só para carro 0km. Muita gente paga IPVA há anos sem saber que, com o direito reconhecido, pode pedir isenção e até restituição de valores.</p>' +
          '</div>' +
        '</div>' +

        ((!generico && d.ir) ?
          '<div class="sp-vizinho">' +
            '<span class="sp-selo-v">Outro direito, separado deste</span>' +
            '<h3>Esta condição também pode isentar o Imposto de Renda</h3>' +
            '<p>Para aposentados e pensionistas, esta é uma das doenças graves previstas na <b>Lei 7.713/88</b> — a isenção de Imposto de Renda segue critérios diferentes da isenção do veículo, e muita gente tem os dois direitos e só pede um.</p>' +
            '<p>Pode haver, ainda, valores dos últimos anos a recuperar.</p>' +
            '<a class="btn btn-linha btn-bloco" href="/impostoderenda" data-sp="ir">Ver se o meu caso se encaixa no Imposto de Renda</a>' +
          '</div>' : '') +

        base() +
      '</div>';

    corpo.innerHTML = html;
    corpo.querySelector('[data-refazer]').addEventListener('click', tela);
    foco();
  }

  function foco(){
    var alvo = corpo.querySelector('.pergunta, .selo-r');
    if(alvo) alvo.focus({preventScroll:true});
    raiz.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  /* ---- Acessibilidade: ajuste de corpo de texto ---- */
  var esc = 100;
  function escala(dv){ esc = Math.min(130, Math.max(90, esc + dv)); raiz.style.fontSize = esc + '%'; }
  var mais  = document.getElementById('sp-mais');
  var menos = document.getElementById('sp-menos');
  if(mais)  mais.addEventListener('click',  function(){ escala(10); });
  if(menos) menos.addEventListener('click', function(){ escala(-10); });

  tela();
})();
