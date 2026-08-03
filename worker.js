/* =========================================================================
   WORKER DO SITE 100 MILHAS
   - Serve os arquivos estáticos de ./public (binding ASSETS)
   - API da Agenda da Lili (orientação PCD), guardada no D1 (binding DB)
     GET  /api/agenda/slots?dia=YYYY-MM-DD  -> horários livres do dia
     POST /api/agenda/reservar              -> cria o agendamento
   Sem dependência de n8n: tudo roda dentro da própria Cloudflare.

   Sincronização com o Google Agenda (também sem n8n), por iCal:
   1) Google -> site: o secret GCAL_ICS_URL guarda o "endereço secreto em
      formato iCal" da agenda da Lili. O Worker lê e bloqueia no site os
      horários já ocupados no Google. Sem o secret, o site funciona como antes.
   2) Site -> Google: GET /api/agenda/feed.ics?t=<ICAL_TOKEN> devolve os
      agendamentos do site em iCal. A Lili assina essa URL uma única vez no
      Google Agenda (Adicionar agenda -> De URL) e tudo aparece lá.
   ========================================================================= */

// Horários de orientação (fuso de São Paulo) — grade REAL da Lili: blocos de 45 min,
// das 10h às 16h45, com almoço 12:15–13:00. Confirmada pela Lili em 30/07/2026.
const HORARIOS = ['10:00','10:45','11:30','13:00','13:45','14:30','15:15','16:00'];
const SLOT_MIN = 45; // duração de cada atendimento (min)
const DIAS_FUTUROS_MAX = 30; // não aceita agendar além de 30 dias

// Dias em que a Lili atende: segunda a sexta (1=seg ... 5=sex).
const DIAS_ATENDIMENTO = [1, 2, 3, 4, 5];

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

// Data/hora atual no fuso de São Paulo (UTC-3, sem horário de verão desde 2019)
function agoraSP() {
  const utc = new Date();
  return new Date(utc.getTime() - 3 * 3600 * 1000);
}
function ymd(d) { return d.toISOString().slice(0, 10); }

function validaDia(dia) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return 'Data inválida.';
  const d = new Date(dia + 'T12:00:00Z');
  if (isNaN(d)) return 'Data inválida.';
  const dow = d.getUTCDay();
  if (!DIAS_ATENDIMENTO.includes(dow))
    return 'A orientação acontece de segunda a sexta. Escolha um desses dias.';
  const hoje = ymd(agoraSP());
  if (dia < hoje) return 'Essa data já passou.';
  const lim = new Date(agoraSP().getTime() + DIAS_FUTUROS_MAX * 86400 * 1000);
  if (dia > ymd(lim)) return 'Escolha uma data mais próxima.';
  return null;
}

function horariosLivresDoDia(dia, ocupados) {
  const hoje = ymd(agoraSP());
  const agoraHM = agoraSP().toISOString().slice(11, 16);
  return HORARIOS.map(h => ({
    hora: h,
    livre: !ocupados.includes(h) && !(dia === hoje && h <= agoraHM)
  }));
}

/* ---------------- Ponte 1: Google Agenda -> site (iCal secreto) ---------- */

const DIAS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function minutosDe(hhmm) { return parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(3, 5), 10); }

// Converte um valor de data do ICS para o fuso de SP.
// Aceita 20260724T120000Z (UTC), 20260724T090000 (hora local) e 20260724 (dia inteiro).
function icsParaSP(valor) {
  if (/^\d{8}$/.test(valor))
    return { dia: valor.slice(0, 4) + '-' + valor.slice(4, 6) + '-' + valor.slice(6, 8), min: null };
  const m = valor.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!m) return null;
  let t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  if (valor.endsWith('Z')) t -= 3 * 3600 * 1000;
  const d = new Date(t);
  return { dia: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function eventosDoICS(texto) {
  // Desdobra as linhas contínuas do RFC 5545 (linha seguinte começa com espaço/tab)
  const linhas = texto.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const evs = []; let ev = null;
  for (const l of linhas) {
    if (l === 'BEGIN:VEVENT') { ev = {}; continue; }
    if (l === 'END:VEVENT') { if (ev) evs.push(ev); ev = null; continue; }
    if (!ev) continue;
    const i = l.indexOf(':'); if (i < 0) continue;
    const chave = l.slice(0, i).split(';')[0];
    if (['DTSTART', 'DTEND', 'STATUS', 'TRANSP', 'RRULE', 'UID', 'RECURRENCE-ID'].includes(chave)) ev[chave] = l.slice(i + 1);
    // EXDATE pode aparecer varias vezes e com lista separada por virgula
    if (chave === 'EXDATE') (ev.EXDATES = ev.EXDATES || []).push(...l.slice(i + 1).split(','));
  }
  return evs;
}

// Recorrência simples: diária e semanal (com BYDAY/UNTIL). Cobre os casos reais
// da agenda da Lili; recorrências exóticas não bloqueiam o site.
function recorreNoDia(ev, ini, dia) {
  const r = ev.RRULE || '';
  if (!r || dia < ini.dia) return false;
  const until = (r.match(/UNTIL=(\d{8})/) || [])[1];
  if (until && dia > until.slice(0, 4) + '-' + until.slice(4, 6) + '-' + until.slice(6, 8)) return false;
  const dow = new Date(dia + 'T12:00:00Z').getUTCDay();
  // INTERVAL=2 (quinzenal etc.): sem isso, a serie bloqueava TODA semana
  const intervalo = +((r.match(/INTERVAL=(\d+)/) || [])[1] || 1);
  const diffDias = Math.round((new Date(dia + 'T12:00:00Z') - new Date(ini.dia + 'T12:00:00Z')) / 86400000);
  if (r.includes('FREQ=DAILY')) return diffDias % intervalo === 0;
  if (r.includes('FREQ=WEEKLY')) {
    if (Math.floor(diffDias / 7) % intervalo !== 0) return false;
    const byday = (r.match(/BYDAY=([^;]+)/) || [])[1];
    if (byday) return byday.split(',').includes(DIAS_ICS[dow]);
    return dow === new Date(ini.dia + 'T12:00:00Z').getUTCDay();
  }
  return false;
}

// Intervalos ocupados (em minutos do dia, fuso SP) segundo o Google Agenda.
function ocupadosNoDia(texto, dia) {
  const out = [];
  const evs = eventosDoICS(texto);
  // Instancias remarcadas (RECURRENCE-ID) devem calar a ocorrencia ORIGINAL
  // da serie — senao o site bloqueia a hora antiga e a nova ao mesmo tempo.
  const remarcadas = new Set();
  for (const ev of evs) {
    if (ev['RECURRENCE-ID'] && ev.UID) {
      const rid = icsParaSP(ev['RECURRENCE-ID']);
      if (rid) remarcadas.add(ev.UID + '|' + rid.dia);
    }
  }
  for (const ev of evs) {
    if (ev.STATUS === 'CANCELLED' || !ev.DTSTART) continue;
    const ini = icsParaSP(ev.DTSTART);
    if (!ini) continue;
    // Evento de DIA INTEIRO no Google nasce marcado "Disponível" (TRANSPARENT)
    // por padrão — mas na agenda da Lili, dia inteiro = DIA FECHADO.
    // Então a marca "Disponível" só é respeitada em eventos com hora.
    if (ini.min !== null && ev.TRANSP === 'TRANSPARENT') continue;
    const fim = ev.DTEND ? icsParaSP(ev.DTEND) : null;
    if (ini.min === null) {
      // Dia inteiro (DTEND é exclusivo): bloqueia o dia todo
      const dentro = fim && fim.dia ? (dia >= ini.dia && dia < fim.dia) : dia === ini.dia;
      if (dentro) out.push([0, 1440]);
      continue;
    }
    const ocorreHoje = ini.dia === dia || (!ev['RECURRENCE-ID'] && recorreNoDia(ev, ini, dia));
    if (!ocorreHoje) continue;
    // Serie recorrente: respeita ocorrencia EXCLUIDA (EXDATE) e REMARCADA (RECURRENCE-ID)
    if (ev.RRULE) {
      if ((ev.EXDATES || []).some(function (x) { const p = icsParaSP(x); return p && p.dia === dia; })) continue;
      if (ev.UID && remarcadas.has(ev.UID + '|' + dia)) continue;
    }
    const fimMin = (fim && fim.min !== null && (fim.dia === ini.dia)) ? fim.min : ini.min + 40;
    out.push([ini.min, Math.max(fimMin, ini.min + 5)]);
  }
  return out;
}

async function ocupadosDoGoogle(env, dia) {
  if (!env.GCAL_ICS_URL) return [];
  try {
    const r = await fetch(env.GCAL_ICS_URL, { cf: { cacheTtl: 120, cacheEverything: true } });
    if (!r.ok) return [];
    return ocupadosNoDia(await r.text(), dia);
  } catch { return []; }
}

function livreNoGoogle(hora, ocupados) {
  const ini = minutosDe(hora), fim = ini + SLOT_MIN;
  return !ocupados.some(([a, b]) => a < fim && b > ini);
}

/* ---------------- Ponte 2: site -> Google Agenda (feed iCal) ------------- */

// Dobra linhas do iCal MEDINDO OCTETOS UTF-8 (RFC 5545: máx. 75 bytes/linha).
// Sem isso, nome/assunto longos com acento podem quebrar a importação no
// Google Agenda. Portado do repo despachante-100milhas-ds (3º sócio).
function dobraLinhaICS(linha) {
  const enc = new TextEncoder();
  if (enc.encode(linha).length <= 75) return linha;
  let saida = '', bytes = 0;
  for (const ch of linha) {
    const b = enc.encode(ch).length;
    if (bytes + b > 75) { saida += '\r\n '; bytes = 1; }
    saida += ch; bytes += b;
  }
  return saida;
}

function icsEscape(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function icsUTC(dia, hora, maisMin) {
  const t = new Date(dia + 'T' + hora + ':00-03:00').getTime() + (maisMin || 0) * 60000;
  return new Date(t).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

async function feedICS(env) {
  const r = await env.DB.prepare(
    "SELECT rowid AS id, dia, hora, nome, telefone, assunto FROM agendamentos " +
    "WHERE (tipo IS NULL OR tipo <> 'lili') AND dia >= date('now', '-60 days') ORDER BY dia, hora"
  ).all();
  const agora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const linhas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Despachante 100 Milhas//Agenda do Site//PT',
    'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Agenda do Site — 100 Milhas',
    'X-WR-TIMEZONE:America/Sao_Paulo'
  ];
  for (const a of (r.results || [])) {
    linhas.push(
      'BEGIN:VEVENT',
      'UID:site-' + a.id + '@despachante100milhas.com.br',
      'DTSTAMP:' + agora,
      'DTSTART:' + icsUTC(a.dia, a.hora),
      'DTEND:' + icsUTC(a.dia, a.hora, SLOT_MIN),
      'SUMMARY:' + icsEscape('Orientação — ' + a.nome),
      'DESCRIPTION:' + icsEscape('WhatsApp: ' + a.telefone + '\nAssunto: ' + (a.assunto || '—') + '\nAgendado pelo site.'),
      'END:VEVENT'
    );
  }
  linhas.push('END:VCALENDAR');
  return new Response(linhas.map(dobraLinhaICS).join('\r\n'), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function apiAgenda(req, env, url) {
  try {
    if (url.pathname === '/api/agenda/slots' && req.method === 'GET') {
      const dia = url.searchParams.get('dia') || '';
      const erro = validaDia(dia);
      if (erro) return json({ ok: false, erro }, 400);
      // Ocupa o horário o cliente, o compromisso lançado pela Lili e o Google Agenda.
      const [r, gcal] = await Promise.all([
        env.DB.prepare('SELECT hora FROM agendamentos WHERE dia = ?').bind(dia).all(),
        ocupadosDoGoogle(env, dia)
      ]);
      const ocupados = (r.results || []).map(x => x.hora);
      const horarios = horariosLivresDoDia(dia, ocupados)
        .map(h => ({ hora: h.hora, livre: h.livre && livreNoGoogle(h.hora, gcal) }));
      return json({ ok: true, dia, horarios });
    }

    if (url.pathname === '/api/agenda/reservar' && req.method === 'POST') {
      let b;
      try { b = await req.json(); } catch { return json({ ok: false, erro: 'Envio inválido.' }, 400); }
      const dia = String(b.dia || ''), hora = String(b.hora || '');
      const nome = String(b.nome || '').trim().slice(0, 80);
      const telefone = String(b.telefone || '').replace(/\D/g, '');
      const assunto = String(b.assunto || '').trim().slice(0, 200);

      const erroDia = validaDia(dia);
      if (erroDia) return json({ ok: false, erro: erroDia }, 400);
      if (!HORARIOS.includes(hora)) return json({ ok: false, erro: 'Horário inválido.' }, 400);
      const hoje = ymd(agoraSP());
      if (dia === hoje && hora <= agoraSP().toISOString().slice(11, 16))
        return json({ ok: false, erro: 'Esse horário já passou. Escolha outro.' }, 400);
      if (nome.length < 3) return json({ ok: false, erro: 'Informe o seu nome completo.' }, 400);
      if (telefone.length < 10 || telefone.length > 13)
        return json({ ok: false, erro: 'Informe um WhatsApp válido, com DDD.' }, 400);

      // Confere o Google Agenda antes de gravar, para não furar compromisso da Lili.
      const gcal = await ocupadosDoGoogle(env, dia);
      if (!livreNoGoogle(hora, gcal))
        return json({ ok: false, erro: 'Esse horário acabou de ser reservado. Escolha outro.' }, 409);

      try {
        await env.DB.prepare(
          'INSERT INTO agendamentos (dia, hora, nome, telefone, assunto) VALUES (?, ?, ?, ?, ?)'
        ).bind(dia, hora, nome, telefone, assunto).run();
      } catch (e) {
        if (String(e).includes('UNIQUE'))
          return json({ ok: false, erro: 'Esse horário acabou de ser reservado. Escolha outro.' }, 409);
        throw e;
      }
      // Ponte instantânea site -> Google Agenda (Apps Script da Lili), se configurada.
      // Falha aqui NUNCA derruba a reserva: o D1 é a fonte da verdade.
      if (env.GCAL_PUSH_URL) {
        try {
          await fetch(env.GCAL_PUSH_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: env.GCAL_PUSH_TOKEN || '', acao: 'criar', dia, hora, nome, telefone, assunto })
          });
        } catch {}
      }
      return json({ ok: true, dia, hora, nome });
    }

    // Feed iCal dos agendamentos do site, para a Lili assinar no Google Agenda.
    // Protegido por token (secret ICAL_TOKEN); sem o token certo, some (404).
    if (url.pathname === '/api/agenda/feed.ics' && req.method === 'GET') {
      if (!env.ICAL_TOKEN || url.searchParams.get('t') !== env.ICAL_TOKEN)
        return new Response('Não encontrado.', { status: 404 });
      return feedICS(env);
    }

    return json({ ok: false, erro: 'Rota não encontrada.' }, 404);
  } catch (e) {
    return json({ ok: false, erro: 'Erro interno. Tente de novo ou chame no WhatsApp.' }, 500);
  }
}


/* ---------------- ÁREA DA LILI (painel da agenda) ----------------
   Protegida por senha, guardada como secret do Worker: AGENDA_SENHA.
   Nunca fica no código. Se o secret não existir, o painel fica fechado. */

function autorizado(req, env) {
  if (!env.AGENDA_SENHA) return false;          // sem senha configurada = painel trancado
  const s = req.headers.get('x-agenda-senha') || '';
  if (s.length !== env.AGENDA_SENHA.length) return false;
  let dif = 0;                                   // comparação de tempo constante
  for (let i = 0; i < s.length; i++) dif |= s.charCodeAt(i) ^ env.AGENDA_SENHA.charCodeAt(i);
  return dif === 0;
}

async function apiPainel(req, env, url) {
  if (!autorizado(req, env)) return json({ ok: false, erro: 'Senha inválida.' }, 401);

  // Confere a senha (usado na tela de entrada)
  if (url.pathname === '/api/agenda/painel/entrar') return json({ ok: true });

  // Lista tudo de hoje em diante
  if (url.pathname === '/api/agenda/painel/lista' && req.method === 'GET') {
    const hoje = ymd(agoraSP());
    const r = await env.DB.prepare(
      'SELECT rowid AS id, dia, hora, nome, telefone, assunto, tipo FROM agendamentos WHERE dia >= ? ORDER BY dia, hora'
    ).bind(hoje).all();
    return json({ ok: true, itens: r.results || [] });
  }

  // Lança um compromisso da própria Lili (o que ela traz do Google Agenda).
  // Ocupa o horário no site na mesma hora — fim da agenda dupla.
  if (url.pathname === '/api/agenda/painel/bloquear' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, erro: 'Envio inválido.' }, 400); }
    const dia = String(b.dia || ''), hora = String(b.hora || '');
    const titulo = String(b.titulo || 'Compromisso').trim().slice(0, 120) || 'Compromisso';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return json({ ok: false, erro: 'Data inválida.' }, 400);
    if (!HORARIOS.includes(hora)) return json({ ok: false, erro: 'Horário inválido.' }, 400);
    try {
      await env.DB.prepare(
        "INSERT INTO agendamentos (dia, hora, nome, telefone, assunto, tipo) VALUES (?, ?, ?, '', ?, 'lili')"
      ).bind(dia, hora, titulo, titulo).run();
    } catch (e) {
      if (String(e).includes('UNIQUE')) return json({ ok: false, erro: 'Esse horário já está ocupado.' }, 409);
      throw e;
    }
    return json({ ok: true });
  }

  // Cancela um agendamento (libera o horário de volta para o site)
  if (url.pathname === '/api/agenda/painel/cancelar' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, erro: 'Envio inválido.' }, 400); }
    const id = parseInt(b.id, 10);
    if (!id) return json({ ok: false, erro: 'Registro inválido.' }, 400);
    // Guarda os dados antes de apagar, para avisar o Google Agenda do cancelamento.
    const reg = await env.DB.prepare('SELECT dia, hora, nome FROM agendamentos WHERE rowid = ?').bind(id).first();
    await env.DB.prepare('DELETE FROM agendamentos WHERE rowid = ?').bind(id).run();
    if (reg && env.GCAL_PUSH_URL) {
      try {
        await fetch(env.GCAL_PUSH_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: env.GCAL_PUSH_TOKEN || '', acao: 'cancelar', dia: reg.dia, hora: reg.hora, nome: reg.nome })
        });
      } catch {}
    }
    return json({ ok: true });
  }

  return json({ ok: false, erro: 'Rota não encontrada.' }, 404);
}

/* ---------------- YouTube: últimos vídeos do canal (RSS, sem chave) ------ */

const YT_CANAL = 'UCVhg_pXYt3DkfWpr9-URAkw'; // @despachante100milhas9

async function apiYoutube() {
  try {
    // 1º caminho: RSS oficial do canal (leve, estável, sem chave de API)
    const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + YT_CANAL,
      { cf: { cacheTtl: 1800, cacheEverything: true } });
    const xml = r.ok ? await r.text() : '';
    let videos = [...xml.matchAll(/<entry>[\s\S]*?<yt:videoId>([\w-]{11})<\/yt:videoId>[\s\S]*?<title>([^<]*)<\/title>[\s\S]*?<published>([^<]*)<\/published>/g)]
      .map(m => ({ id: m[1], title: m[2], published: m[3] }));
    // 2º caminho: Shorts nem sempre entram no RSS — raspa a página do canal
    if (!videos.length) {
      const p = await fetch('https://www.youtube.com/@despachante100milhas9/videos',
        { headers: { 'User-Agent': 'Mozilla/5.0' }, cf: { cacheTtl: 1800, cacheEverything: true } });
      const html = p.ok ? await p.text() : '';
      const ids = [...new Set([...html.matchAll(/"videoId":"([\w-]{11})"/g)].map(m => m[1]))];
      videos = ids.map(id => ({ id, title: '', published: '' }));
    }
    return json({ ok: true, canal: 'https://www.youtube.com/@despachante100milhas9', videos: videos.slice(0, 6) });
  } catch {
    return json({ ok: false, videos: [] });
  }
}

/* ---------------- LILI VIVA: ponte para o cérebro do app ----------------
   O site conversa com a MESMA Lili viva do app (Cloudflare Workers AI, grátis)
   por um proxy same-origin: o navegador fala só com o site (/api/lili) e o
   site repassa para o Worker do app. Assim não há CORS, o cérebro é UM só e
   nada é duplicado. É ADITIVO: não toca no D1 nem na agenda. */
const LILI_CEREBRO = 'https://lili.despachante100milhas.com.br/api/chat';
async function apiLili(req) {
  try {
    const corpo = await req.text();
    const r = await fetch(LILI_CEREBRO, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: corpo
    });
    return new Response(r.body, {
      status: r.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return json({ erro: 'ia_indisponivel' }, 502);
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/agenda/painel')) {
      try { return await apiPainel(req, env, url); }
      catch { return json({ ok: false, erro: 'Erro interno.' }, 500); }
    }
    if (url.pathname.startsWith('/api/agenda')) return apiAgenda(req, env, url);
    if (url.pathname === '/api/youtube') return apiYoutube();
    if (url.pathname === '/api/lili' && req.method === 'POST') return apiLili(req);
    return env.ASSETS.fetch(req);
  }
};
