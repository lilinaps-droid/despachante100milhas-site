/* =========================================================================
   WORKER DO SITE 100 MILHAS
   - Serve os arquivos estáticos de ./public (binding ASSETS)
   - API da Agenda da Lili (orientação PCD), guardada no D1 (binding DB)
     GET  /api/agenda/slots?dia=YYYY-MM-DD  -> horários livres do dia
     POST /api/agenda/reservar              -> cria o agendamento
   Sem dependência de n8n: tudo roda dentro da própria Cloudflare.
   ========================================================================= */

// Horários de orientação (fuso de São Paulo)
const HORARIOS = ['09:00','09:40','10:20','11:00','11:40','14:00','14:40','15:20','16:00','16:40'];
const DIAS_FUTUROS_MAX = 30; // não aceita agendar além de 30 dias

// Dias em que a Lili atende: 3=quarta, 4=quinta, 5=sexta.
// Segunda e terça ficam livres para perícia, cartório e órgão.
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

async function apiAgenda(req, env, url) {
  try {
    if (url.pathname === '/api/agenda/slots' && req.method === 'GET') {
      const dia = url.searchParams.get('dia') || '';
      const erro = validaDia(dia);
      if (erro) return json({ ok: false, erro }, 400);
      // Ocupa o horário tanto o cliente quanto o compromisso lançado pela Lili.
      const r = await env.DB.prepare('SELECT hora FROM agendamentos WHERE dia = ?').bind(dia).all();
      const ocupados = (r.results || []).map(x => x.hora);
      return json({ ok: true, dia, horarios: horariosLivresDoDia(dia, ocupados) });
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

      try {
        await env.DB.prepare(
          'INSERT INTO agendamentos (dia, hora, nome, telefone, assunto) VALUES (?, ?, ?, ?, ?)'
        ).bind(dia, hora, nome, telefone, assunto).run();
      } catch (e) {
        if (String(e).includes('UNIQUE'))
          return json({ ok: false, erro: 'Esse horário acabou de ser reservado. Escolha outro.' }, 409);
        throw e;
      }
      return json({ ok: true, dia, hora, nome });
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
    await env.DB.prepare('DELETE FROM agendamentos WHERE rowid = ?').bind(id).run();
    return json({ ok: true });
  }

  return json({ ok: false, erro: 'Rota não encontrada.' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/agenda/painel')) {
      try { return await apiPainel(req, env, url); }
      catch { return json({ ok: false, erro: 'Erro interno.' }, 500); }
    }
    if (url.pathname.startsWith('/api/agenda')) return apiAgenda(req, env, url);
    return env.ASSETS.fetch(req);
  }
};
