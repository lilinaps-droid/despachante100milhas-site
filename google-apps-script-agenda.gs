/**
 * PONTE INSTANTÂNEA: SITE -> GOOGLE AGENDA DA LILI
 * ------------------------------------------------
 * O que faz: quando um cliente reserva no site, o Worker chama esta ponte
 * e o compromisso ENTRA NA HORA no Google Agenda. Cancelou no painel do
 * site? O evento some do Google também.
 *
 * COMO ATIVAR (5 minutos, uma única vez):
 * 1. Abra script.google.com logada na conta Google da agenda oficial.
 * 2. "Novo projeto" → apague tudo → cole este arquivo inteiro → salve.
 * 3. Troque o TOKEN abaixo por uma senha sua (letras/números, sem espaço).
 * 4. Implantar → Nova implantação → tipo "App da Web":
 *      - Executar como: Você
 *      - Quem pode acessar: Qualquer pessoa
 *    → Implantar → copie a URL (termina em /exec).
 * 5. No painel da Cloudflare → Worker "odd-hall-da24" → Settings →
 *    Variables and Secrets → adicione:
 *      GCAL_PUSH_URL   = a URL copiada
 *      GCAL_PUSH_TOKEN = o mesmo TOKEN do passo 3
 * Pronto. Não precisa de n8n, não precisa de API paga.
 */

var TOKEN = 'TROQUE-POR-UMA-SENHA-SUA';

function doPost(e) {
  var b = {};
  try { b = JSON.parse(e.postData.contents || '{}'); } catch (err) {}
  if (!b.token || b.token !== TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, erro: 'token' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var cal = CalendarApp.getDefaultCalendar();
  var ini = new Date(b.dia + 'T' + b.hora + ':00-03:00');
  var fim = new Date(ini.getTime() + 40 * 60000);

  if (b.acao === 'criar') {
    cal.createEvent('Site: Orientação — ' + (b.nome || 'Cliente'), ini, fim, {
      description: 'WhatsApp: ' + (b.telefone || '—') +
                   '\nAssunto: ' + (b.assunto || '—') +
                   '\n(Agendado pelo site — não editar o título "Site:")'
    });
  } else if (b.acao === 'cancelar') {
    var evs = cal.getEvents(ini, fim);
    for (var i = 0; i < evs.length; i++) {
      if (evs[i].getTitle().indexOf('Site:') === 0) evs[i].deleteEvent();
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
