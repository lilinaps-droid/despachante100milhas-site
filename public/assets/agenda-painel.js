/* =========================================================================
   PAINEL DA AGENDA — área da Lili (/agenda)
   Aqui a agenda do site vira a agenda oficial do despachante:
     · ver todos os agendamentos de clientes
     · lançar os compromissos da própria Lili (os que vêm do Google)
       — e o horário some do site na mesma hora
     · cancelar e devolver o horário
     · exportar qualquer compromisso para o Google Agenda em 1 clique
   A senha nunca fica no código: é um secret do Worker (AGENDA_SENHA).
   ========================================================================= */
(function(){
  var raiz = document.getElementById('painel-agenda');
  if(!raiz) return;

  var HORARIOS = ['09:00','09:40','10:20','11:00','11:40','14:00','14:40','15:20','16:00','16:40'];
  var SEMANA   = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  var MESES    = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var senha = '';

  function api(rota, corpo){
    return fetch('/api/agenda/painel/'+rota, {
      method: corpo ? 'POST' : 'GET',
      headers: Object.assign({'x-agenda-senha': senha}, corpo ? {'Content-Type':'application/json'} : {}),
      body: corpo ? JSON.stringify(corpo) : undefined
    }).then(function(r){ return r.json().then(function(j){ j._status = r.status; return j; }); });
  }

  function dataLonga(iso){
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1]-1, +p[2]);
    return SEMANA[d.getDay()]+', '+(+p[2])+' de '+MESES[+p[1]-1];
  }

  /* Link de exportação para o Google Agenda. Sem API, sem chave, sem
     conta de serviço: o Google aceita um evento por URL. Um clique e
     o compromisso entra no calendário de quem estiver logado. */
  function linkGoogle(it){
    var p = it.dia.split('-'), h = it.hora.split(':');
    function z(n){ return String(n).padStart(2,'0'); }
    // horário de São Paulo (UTC-3) convertido para UTC, formato do Google
    var ini = new Date(Date.UTC(+p[0], +p[1]-1, +p[2], +h[0]+3, +h[1]));
    var fim = new Date(ini.getTime() + 40*60000);   // 40 min
    function g(d){
      return d.getUTCFullYear()+z(d.getUTCMonth()+1)+z(d.getUTCDate())+'T'+
             z(d.getUTCHours())+z(d.getUTCMinutes())+'00Z';
    }
    var titulo = it.tipo === 'lili'
      ? it.nome
      : '100 Milhas — ' + it.nome;
    var det = it.tipo === 'lili'
      ? 'Compromisso lançado no painel da agenda.'
      : 'Orientação PCD.\nWhatsApp: ' + (it.telefone || '—') + '\nAssunto: ' + (it.assunto || '—');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text='    + encodeURIComponent(titulo) +
      '&dates='   + g(ini) + '/' + g(fim) +
      '&details=' + encodeURIComponent(det) +
      '&ctz=America/Sao_Paulo';
  }

  /* ---------------- TELA DE ENTRADA ---------------- */
  function entrada(msg){
    raiz.innerHTML =
      '<div class="pa-porta">' +
        '<h2>Agenda da Lili</h2>' +
        '<p>Área restrita. Esta é a agenda oficial do despachante.</p>' +
        '<div class="campo"><label for="pa-senha">Senha</label>' +
        '<input id="pa-senha" type="password" autocomplete="current-password"></div>' +
        (msg ? '<p class="pa-erro">'+msg+'</p>' : '') +
        '<button class="btn btn-roxo btn-bloco" id="pa-entrar">Entrar</button>' +
      '</div>';
    var i = document.getElementById('pa-senha');
    function tentar(){
      senha = i.value;
      if(!senha) return entrada('Digite a senha.');
      api('entrar').then(function(j){
        if(j.ok) carregar();
        else entrada('Senha incorreta.');
      }).catch(function(){ entrada('Não consegui falar com o servidor.'); });
    }
    document.getElementById('pa-entrar').addEventListener('click', tentar);
    i.addEventListener('keydown', function(e){ if(e.key === 'Enter') tentar(); });
    i.focus();
  }

  /* ---------------- PAINEL ---------------- */
  function carregar(){
    raiz.innerHTML = '<p class="pa-carregando">Carregando a agenda…</p>';
    api('lista').then(function(j){
      if(!j.ok) return entrada('Sessão expirada. Entre de novo.');
      pintar(j.itens || []);
    }).catch(function(){
      raiz.innerHTML = '<p class="pa-erro">Não consegui carregar a agenda. Tente de novo.</p>';
    });
  }

  function pintar(itens){
    var clientes = itens.filter(function(i){ return i.tipo !== 'lili'; }).length;

    var dias = {};
    itens.forEach(function(i){ (dias[i.dia] = dias[i.dia] || []).push(i); });

    var lista = Object.keys(dias).sort().map(function(dia){
      return '<div class="pa-dia">' +
        '<h3>'+dataLonga(dia)+'</h3>' +
        dias[dia].map(function(it){
          var lili = it.tipo === 'lili';
          return '<div class="pa-item'+(lili ? ' pa-lili' : '')+'">' +
            '<span class="pa-hora">'+it.hora+'</span>' +
            '<div class="pa-corpo">' +
              '<b>'+it.nome+'</b>' +
              (lili
                ? '<small>Compromisso seu · bloqueia o horário no site</small>'
                : '<small>' + (it.telefone
                    ? '<a href="https://wa.me/55'+it.telefone.replace(/^55/,'')+'" target="_blank" rel="noopener">'+it.telefone+'</a> · '
                    : '') + (it.assunto || 'Orientação PCD') + '</small>') +
            '</div>' +
            '<div class="pa-acoes">' +
              '<a class="pa-btn" href="'+linkGoogle(it)+'" target="_blank" rel="noopener" title="Enviar para o Google Agenda">Google&nbsp;Agenda</a>' +
              '<button class="pa-btn pa-del" data-id="'+it.id+'" data-nome="'+it.nome+'">Cancelar</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }).join('');

    raiz.innerHTML =
      '<div class="pa-topo">' +
        '<div><b>Agenda da Lili</b><span>'+clientes+' cliente(s) agendado(s) · atendimento de segunda a sexta</span></div>' +
        '<button class="btn btn-linha" id="pa-recarregar">Atualizar</button>' +
      '</div>' +

      '<div class="pa-novo">' +
        '<h3>Lançar um compromisso meu</h3>' +
        '<p>Traga aqui o que está no seu Google Agenda. O horário sai do site na hora — o cliente não consegue marcar por cima.</p>' +
        '<div class="pa-form">' +
          '<div class="campo"><label for="pa-dia">Dia</label><input id="pa-dia" type="date"></div>' +
          '<div class="campo"><label for="pa-hora">Horário</label><select id="pa-hora">' +
            HORARIOS.map(function(h){ return '<option>'+h+'</option>'; }).join('') +
          '</select></div>' +
          '<div class="campo"><label for="pa-tit">O que é</label><input id="pa-tit" placeholder="Ex.: perícia no IMESC"></div>' +
        '</div>' +
        '<button class="btn btn-ouro" id="pa-bloquear">Bloquear este horário</button>' +
        '<p class="pa-erro" id="pa-msg"></p>' +
      '</div>' +

      (lista || '<p class="pa-vazio">Nenhum agendamento daqui para a frente.</p>');

    document.getElementById('pa-recarregar').addEventListener('click', carregar);

    document.getElementById('pa-bloquear').addEventListener('click', function(){
      var dia = document.getElementById('pa-dia').value;
      var hora = document.getElementById('pa-hora').value;
      var tit = document.getElementById('pa-tit').value.trim();
      var msg = document.getElementById('pa-msg');
      if(!dia){ msg.textContent = 'Escolha o dia.'; return; }
      api('bloquear', {dia:dia, hora:hora, titulo: tit || 'Compromisso'})
        .then(function(j){
          if(j.ok) carregar();
          else msg.textContent = j.erro || 'Não consegui bloquear.';
        });
    });

    raiz.querySelectorAll('.pa-del').forEach(function(b){
      b.addEventListener('click', function(){
        if(!confirm('Cancelar "'+b.dataset.nome+'"? O horário volta a ficar livre no site.')) return;
        api('cancelar', {id: +b.dataset.id}).then(function(j){
          if(j.ok) carregar();
        });
      });
    });
  }

  entrada('');
})();
