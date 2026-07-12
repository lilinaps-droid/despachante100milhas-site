/* 100 Milhas — comportamento do site */
(function(){
  // Menu mobile
  var b=document.getElementById('burger'), m=document.getElementById('menu');
  if(b&&m){b.addEventListener('click',function(){
    var a=m.classList.toggle('aberto');
    b.setAttribute('aria-expanded',a?'true':'false');
  });}

  // Máscara simples de telefone
  document.querySelectorAll('input[name="whatsapp"]').forEach(function(i){
    i.addEventListener('input',function(){
      var v=i.value.replace(/\D/g,'').slice(0,11);
      if(v.length>6) i.value='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);
      else if(v.length>2) i.value='('+v.slice(0,2)+') '+v.slice(2);
      else i.value=v;
    });
  });

  // CAPTURA DE LEAD
  // Hoje: envia direto para o WhatsApp da 100 Milhas com os dados preenchidos.
  // Amanhã: trocar por um POST para o 100 Milhas OS (endpoint em ENDPOINT_OS).
  var ENDPOINT_OS = null; // ex.: 'https://seu-endpoint/lead'
  // Canal por página: doc (documentação) ou pcd — definido no <body data-canal>.
  var ZAP = document.body.dataset.canal === 'pcd' ? '5513978091064' : '5513978144035';

  document.querySelectorAll('.form-lead').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var renavam=f.querySelector('[name=renavam]').value.trim();
      var whats=f.querySelector('[name=whatsapp]').value.trim();
      var origem=f.dataset.origem||'site';
      if(!renavam||!whats) return;

      if(ENDPOINT_OS){
        fetch(ENDPOINT_OS,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({renavam:renavam,whatsapp:whats,origem:origem})}).catch(function(){});
      }

      var msg='#site ('+origem+')\n\nOlá! Quero consultar os débitos do meu veículo.\n\nRenavam/Placa: '+renavam+'\nMeu WhatsApp: '+whats;
      window.open('https://api.whatsapp.com/send?phone='+ZAP+'&text='+encodeURIComponent(msg),'_blank');
    });
  });
})();




/* WhatsApp flutuante: aparece só quando o visitante já leu o suficiente
   para ter confiança (após 55% da primeira dobra). Não interrompe a leitura. */
(function(){
  var z=document.querySelector('.zap-flut'); if(!z) return;
  function ver(){
    if(window.scrollY > window.innerHeight*0.55) z.classList.add('visivel');
    else z.classList.remove('visivel');
  }
  window.addEventListener('scroll',ver,{passive:true}); ver();
})();

/* =========================================================================
   CONSULTA POR PLACA / RENAVAM
   NÃO simula resultado. Valida formato e leva ao WhatsApp com contexto.
   Nunca envia CPF nem dado sensível na URL.
   ========================================================================= */
(function(){
  var f=document.getElementById('form-veiculo'); if(!f) return;
  var ZAP=document.body.dataset.canal === 'pcd' ? '5513978091064' : '5513978144035';
  var iP=document.getElementById('placa'), iR=document.getElementById('renavam');
  var eP=document.getElementById('erro-placa'), eR=document.getElementById('erro-renavam');

  // máscara de placa: aceita antiga (ABC1234) e Mercosul (ABC1D23)
  iP.addEventListener('input',function(){
    var v=iP.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);
    iP.value=v; limpar(iP,eP);
  });
  iR.addEventListener('input',function(){
    iR.value=iR.value.replace(/\D/g,'').slice(0,11); limpar(iR,eR);
  });

  function limpar(i,e){ i.removeAttribute('aria-invalid'); e.textContent=''; }
  function marcar(i,e,msg){ i.setAttribute('aria-invalid','true'); e.textContent=msg; }

  var RE_PLACA=/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;   // cobre antiga e Mercosul

  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var p=iP.value.trim(), r=iR.value.trim(), ok=true;

    if(!p){ marcar(iP,eP,'Informe a placa do veículo.'); ok=false; }
    else if(!RE_PLACA.test(p)){ marcar(iP,eP,'Placa inválida. Ex.: ABC1D23 ou ABC1234.'); ok=false; }
    if(!r){ marcar(iR,eR,'Informe o RENAVAM (está no documento do veículo).'); ok=false; }
    else if(r.length<9){ marcar(iR,eR,'O RENAVAM tem de 9 a 11 dígitos.'); ok=false; }
    if(!ok){ (iP.getAttribute('aria-invalid')?iP:iR).focus(); return; }

    // carregamento visível: o pedido é encaminhado para a equipe no WhatsApp
    var b=f.querySelector('button[type=submit]');
    var rotulo=b.textContent;
    b.disabled=true; b.textContent='Encaminhando…';
    setTimeout(function(){ b.disabled=false; b.textContent=rotulo; },2200);

    var msg='Olá, equipe 100 Milhas. Vim pelo site e quero o levantamento da situação do meu veículo.'+
      '\nPlaca: '+p+'\nRENAVAM: '+r;
    window.open('https://api.whatsapp.com/send?phone='+ZAP+'&text='+encodeURIComponent(msg),'_blank');
  });
})();
