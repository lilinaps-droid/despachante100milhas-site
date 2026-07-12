/* =========================================================================
   AGENDA DA LILI — orientação sobre direitos PCD
   Fala com a API do próprio site (/api/agenda/*, Worker + D1 da Cloudflare).
   Sem n8n, sem serviço externo. Se a API estiver fora, mostra o
   caminho honesto pelo WhatsApp PCD — nunca um botão falso.
   ========================================================================= */
(function(){
  var raiz = document.getElementById('agenda-pcd');
  if(!raiz) return;

  var ZAP_PCD = '5513978091064';
  var p1=document.getElementById('ag-p1'), p2=document.getElementById('ag-p2'), p3=document.getElementById('ag-p3');
  var elDias=document.getElementById('ag-dias'), elHoras=document.getElementById('ag-horas');
  var form=document.getElementById('ag-form'), erro=document.getElementById('ag-erro');
  var ok=document.getElementById('ag-ok'), off=document.getElementById('ag-off');
  var sel={dia:null, hora:null};
  var MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var SEMANA=['dom','seg','ter','qua','qui','sex','sáb'];

  function fmt(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function mostraErro(msg){ erro.textContent=msg||''; }

  // ---------- Passo 1: próximos 10 dias úteis ----------
  function montaDias(){
    var d=new Date(); var feitos=0; var html='';
    while(feitos<10){
      d.setDate(d.getDate()+ (feitos===0 && montaDias.primeira!==false ? 0 : 1));
      montaDias.primeira=false;
      var dow=d.getDay();
      if(dow===0||dow===6){ continue; }
      var iso=fmt(d);
      html+='<button type="button" class="ag-chip" data-dia="'+iso+'">'+
        '<small>'+SEMANA[dow]+'</small><b>'+d.getDate()+'</b><small>'+MESES[d.getMonth()]+'</small></button>';
      feitos++;
    }
    elDias.innerHTML=html;
    elDias.querySelectorAll('.ag-chip').forEach(function(b){
      b.addEventListener('click', function(){ escolheDia(b); });
    });
  }

  function escolheDia(b){
    mostraErro('');
    elDias.querySelectorAll('.ag-chip').forEach(function(x){x.classList.remove('ativo');});
    b.classList.add('ativo');
    sel.dia=b.dataset.dia; sel.hora=null;
    p2.hidden=false; p3.hidden=true;
    elHoras.innerHTML='<span class="ag-carregando">Verificando horários…</span>';
    fetch('/api/agenda/slots?dia='+sel.dia)
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j.ok) throw new Error(j.erro||'erro');
        var livres=j.horarios.filter(function(h){return h.livre;});
        if(!livres.length){ elHoras.innerHTML='<span class="ag-carregando">Sem horários livres neste dia — escolha outro.</span>'; return; }
        elHoras.innerHTML=j.horarios.map(function(h){
          return '<button type="button" class="ag-chip ag-hora'+(h.livre?'':'" disabled title="Horário ocupado')+'" data-hora="'+h.hora+'"><b>'+h.hora+'</b></button>';
        }).join('');
        elHoras.querySelectorAll('.ag-chip:not([disabled])').forEach(function(x){
          x.addEventListener('click', function(){ escolheHora(x); });
        });
      })
      .catch(function(){ foraDoAr(); });
  }

  function escolheHora(b){
    mostraErro('');
    elHoras.querySelectorAll('.ag-chip').forEach(function(x){x.classList.remove('ativo');});
    b.classList.add('ativo');
    sel.hora=b.dataset.hora;
    p3.hidden=false;
    p3.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  // ---------- Passo 3: confirmar ----------
  form.addEventListener('submit', function(ev){
    ev.preventDefault(); mostraErro('');
    var nome=document.getElementById('ag-nome').value.trim();
    var tel=document.getElementById('ag-tel').value.replace(/\D/g,'');
    var assunto=document.getElementById('ag-assunto').value.trim();
    if(!sel.dia||!sel.hora){ mostraErro('Escolha o dia e o horário acima.'); return; }
    if(nome.length<3){ mostraErro('Informe o seu nome completo.'); return; }
    if(tel.length<10||tel.length>11){ mostraErro('Informe um WhatsApp válido, com DDD.'); return; }

    var b=form.querySelector('button[type=submit]');
    var rotulo=b.textContent; b.disabled=true; b.textContent='Reservando horário…';

    fetch('/api/agenda/reservar',{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({dia:sel.dia,hora:sel.hora,nome:nome,telefone:tel,assunto:assunto})
    })
    .then(function(r){ return r.json().then(function(j){ return {st:r.status,j:j}; }); })
    .then(function(x){
      b.disabled=false; b.textContent=rotulo;
      if(x.j.ok){ confirmado(nome,assunto); return; }
      mostraErro(x.j.erro||'Não foi possível reservar. Tente de novo.');
      if(x.st===409){ // horário levado por outra pessoa: recarrega horários
        var ativo=elDias.querySelector('.ag-chip.ativo'); if(ativo) escolheDia(ativo);
        p3.hidden=true;
      }
    })
    .catch(function(){ b.disabled=false; b.textContent=rotulo; foraDoAr(); });
  });

  function confirmado(nome, assunto){
    p1.hidden=true; p2.hidden=true; p3.hidden=true; mostraErro('');
    var partes=sel.dia.split('-');
    var bonito=partes[2]+'/'+partes[1]+'/'+partes[0];
    document.getElementById('ag-ok-txt').textContent=
      'Orientação sobre direitos PCD em '+bonito+' às '+sel.hora+', com a Lili. Até lá!';
    var msg='#site\n\nAGENDAMENTO CONFIRMADO ✅\nOrientação sobre direitos PCD\nDia: '+bonito+' às '+sel.hora+
      '\nNome: '+nome+(assunto?('\nAssunto: '+assunto):'');
    document.getElementById('ag-ok-zap').href=
      'https://api.whatsapp.com/send?phone='+ZAP_PCD+'&text='+encodeURIComponent(msg);
    ok.hidden=false;
    ok.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function foraDoAr(){
    p1.hidden=true; p2.hidden=true; p3.hidden=true; ok.hidden=true; mostraErro('');
    off.hidden=false;
  }

  montaDias();
})();
