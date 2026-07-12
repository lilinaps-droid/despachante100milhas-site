#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera as paginas HTML estaticas do site oficial da 100 Milhas."""
import os, html

SAIDA = "./public"
BASE = "https://www.despachante100milhas.com.br"

# Versao dos assets: fura o cache "immutable" de 1 ano dos navegadores que
# guardaram os arquivos antigos. Incremente a cada mudanca em CSS/JS.
V = "?v=12"

# --- CANAIS DE WHATSAPP ---
# doc: licenciamento, transferencia, multas, recursos, CNH, documentacao
# pcd: isencao PCD, laudos, IMESC, IR doenca grave, cartao DEFIS
ZAP_DOC = "5513978144035"
ZAP_PCD = "5513978091064"
FONE_DOC = "(13) 97814-4035"
FONE_PCD = "(13) 97809-1064"

def zap(msg, canal="doc"):
    from urllib.parse import quote
    num = ZAP_PCD if canal == "pcd" else ZAP_DOC
    return f"https://api.whatsapp.com/send?phone={num}&text={quote('#site' + chr(10)+chr(10) + msg)}"


# ---- Icones SVG (substituem os emoji: renderizam igual em todo sistema) ----
def ic(nome):
    p = {
      "carro":'<path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M3 17v-4l2-5h14l2 5v4"/><path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>',
      "moeda":'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5A2.5 2.5 0 0 1 12 8h1a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h1a2.5 2.5 0 0 0 2.5-1.5"/>',
      "balanca":'<path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0L5 8Zm14 0-3 6a3 3 0 0 0 6 0l-3-6Z"/>',
      "doc":'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
      "cartao":'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h3"/>',
      "envio":'<path d="M21 3 3 10l7 3 3 7 8-17Z"/><path d="m10 13 4-4"/>',
      "relogio":'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      "raio":'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
      "check":'<path d="M20 6 9 17l-5-5"/>',
      "mapa":'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
      "fone":'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z"/>',
      "presente":'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M12 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z"/>',
      "escudo":'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
      "lupa":'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    }
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{p[nome]}</svg>'


# =========================================================================
#  CONFIGURACAO — edite so aqui. Depois rode:  python3 gerar.py
# =========================================================================
GA_ID    = ""   # Google Analytics 4. Ex.: "G-XXXXXXXXXX"   (peça para a Lili)
PIXEL_ID = ""   # Pixel do Meta.      Ex.: "1234567890123"  (peça para a Lili)

def tracking():
    t = ""
    if GA_ID:
        t += f"""<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}
gtag('js',new Date());gtag('config','{GA_ID}');</script>"""
    if PIXEL_ID:
        t += f"""<script>!function(f,b,e,v,n,t,s){{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)}};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','{PIXEL_ID}');fbq('track','PageView');</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id={PIXEL_ID}&ev=PageView&noscript=1" alt=""></noscript>"""
    return t

NAV = [
    ("/licenciamento", "Licenciamento"),
    ("/transferencia", "Transferência"),
    ("/debitos", "Débitos e IPVA"),
    ("/cnh-suspensa", "CNH"),
    ("/isencaopcd", "Isenção PCD"),
    ("/impostoderenda", "Imposto de Renda"),
    ("/quem-somos", "A 100 Milhas"),
]

SVG_ZAP = '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.4.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>'

def head(titulo, desc, url, extra="", pilar="", canal="doc"):
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{BASE}{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Despachante 100 Milhas">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}{url}">
<meta property="og:locale" content="pt_BR">
<meta property="og:image" content="{BASE}/assets/lili.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{titulo}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{BASE}/assets/lili.webp">
<meta name="theme-color" content="#6A0DAD">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"></noscript>
<link rel="preload" as="image" href="/assets/lili-ia.webp" fetchpriority="high">
<link rel="stylesheet" href="/assets/estilo.css{V}">
<script type="application/ld+json">
{{
  "@context":"https://schema.org",
  "@type":"ProfessionalService",
  "name":"Despachante 100 Milhas",
  "alternateName":"DESPACHANTE 100 MILHAS",
  "description":"Assessoria em documentação veicular e direitos: isenção PCD (IPI, ICMS, IPVA), isenção de Imposto de Renda, recursos de multa e CNH, transferência e regularização veicular.",
  "url":"https://www.despachante100milhas.com.br",
  "telephone":"+55-13-3466-7438",
  "email":"desp.100milhas@hotmail.com",
  "taxID":"12.109.034/0001-06",
  "address":{{"@type":"PostalAddress","streetAddress":"R. Jacob Emmerich, 700","addressLocality":"São Vicente","addressRegion":"SP","addressCountry":"BR"}},
  "areaServed":{{"@type":"Place","name":"Baixada Santista e Estado de São Paulo"}},
  "founder":{{"@type":"Person","name":"Liliane Pereira Rosa","jobTitle":"Despachante Documentalista"}},
  "sameAs":["https://www.instagram.com/despachante100milhas/","https://www.facebook.com/100milhasdespachante"]
}}
</script>
{extra}
</head>
<body{(' data-pilar="' + pilar + '"') if pilar else ''} data-canal="{canal}">
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
"""

def header(atual, canal="doc"):
    itens = ""
    for u, t in NAV:
        cur = ' aria-current="page"' if u == atual else ""
        itens += f'<a href="{u}"{cur}>{t}</a>'
    msg_zap = 'Olá, quero atendimento sobre isenção PCD / Imposto de Renda.' if canal == "pcd" else 'Olá, estou no site e tenho uma dúvida.'
    return f"""<header>
<div class="wrap nav">
  <a class="logo" href="/" aria-label="Despachante 100 Milhas — início">
    <img src="/assets/logo.webp" alt="Despachante 100 Milhas" width="160" height="46">
  </a>
  <button class="burger" aria-label="Abrir menu" aria-expanded="false" id="burger"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  <nav class="menu" id="menu">
    {itens}
    <a class="btn-zap" href="{zap(msg_zap, canal)}" target="_blank" rel="noopener">{SVG_ZAP}WhatsApp</a>
  </nav>
</div>
</header>
"""

SVG_ZAP_MINI = SVG_ZAP.replace('viewBox="0 0 24 24"','viewBox="0 0 24 24" style="width:22px;height:22px;fill:#25D366;flex:none"')

# Ícones de redes sociais (mesmo traço dos demais ícones do site)
IC_INSTA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>'
IC_FACE  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h2.5V4.5H14A4.5 4.5 0 0 0 9.5 9v2.5H7V15h2.5v6H13v-6h2.6l.6-3.5H13V9a1 1 0 0 1 1-1Z"/></svg>'
IC_GOOGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.2l5.9-.8L12 3Z"/></svg>'

def rodape(canal="doc"):
    msg_flut = 'Olá, quero atendimento sobre isenção PCD / Imposto de Renda.' if canal == "pcd" else 'Olá, quero falar com um especialista.'
    return f"""<footer>
<div class="wrap">
  <div class="foot-marca">
    <img class="foot-logo-img" src="/assets/logo.webp" alt="Despachante 100 Milhas" width="170" height="49">
    <p>Assessoria privada em documentação e regularização veicular — Isenção PCD, recurso de multa e direitos de aposentados. Presencial e 100% online, na Baixada Santista e em São Paulo.</p>
  </div>

  <div class="canais">
    <div class="canais-txt">
      <h2 class="foot-tit" style="margin-bottom:6px">Fale com a gente</h2>
      <p class="canais-sub">Dois canais de WhatsApp, cada um com a equipe certa. Escolha o seu assunto:</p>
    </div>
    <a class="canal canal-doc" href="{zap('Olá! Preciso de ajuda com a documentação do meu veículo.')}" target="_blank" rel="noopener">
      <span class="canal-tag">Documentação</span>
      <span class="canal-num">{SVG_ZAP_MINI}<b>{FONE_DOC}</b></span>
      <span class="canal-desc">Licenciamento &middot; Transferência &middot; Multas &middot; Recursos &middot; CNH</span>
    </a>
    <a class="canal canal-pcd" href="{zap('Olá! Quero atendimento PCD (isenções, laudos, IR).', 'pcd')}" target="_blank" rel="noopener">
      <span class="canal-tag">PCD</span>
      <span class="canal-num">{SVG_ZAP_MINI}<b>{FONE_PCD}</b></span>
      <span class="canal-desc">Isenção PCD &middot; Laudos &middot; Imposto de Renda &middot; Cartão DEFIS</span>
    </a>
  </div>

  <div class="rodape-central">
    <div>
      <h2 class="foot-tit">Unidade São Vicente — Centro</h2>
      <div class="mapa-box">
        <iframe loading="lazy" title="Mapa: R. Jacob Emmerich, 700, São Vicente/SP"
          src="https://www.google.com/maps?q=R.+Jacob+Emmerich,+700,+Centro,+S%C3%A3o+Vicente+-+SP&output=embed"
          referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      <div class="end-bloco">
        <b>R. Jacob Emmerich, 700 &middot; CEP 11310-070</b>
        <span>Atendimento presencial de segunda a sexta</span>
      </div>
    </div>

    <div>
      <h2 class="foot-tit">Atendimento</h2>
      <div class="end-bloco">
        <b>Sábado &middot; São Paulo/SP</b>
        <span>Av. Atlântica, 2905 — Jd. Santa Helena</span>
      </div>
      <div class="horario">
        <div><span>Telefone</span><b><a href="tel:+551334667438">(13) 3466-7438</a></b></div>
        <div><span>E-mail</span><b><a href="mailto:desp.100milhas@hotmail.com">desp.100milhas@hotmail.com</a></b></div>
      </div>
      <div class="redes">
        <a class="rede" href="https://www.instagram.com/despachante100milhas/" target="_blank" rel="noopener">Instagram</a>
        <a class="rede" href="https://www.facebook.com/100milhasdespachante" target="_blank" rel="noopener">Facebook</a>
        <a class="rede" href="https://www.google.com/search?q=100+milhas+despachante" target="_blank" rel="noopener">&#9733; Google</a>
      </div>
    </div>

    <div>
      <h2 class="foot-tit">Serviços</h2>
      <ul>
        <li><a href="/central"><strong style="color:#fff">Central da Lili</strong></a></li>
        <li><a href="/licenciamento">Licenciamento e CRLV</a></li>
        <li><a href="/ipva">IPVA atrasado</a></li>
        <li><a href="/debitos">Consulta de débitos</a></li>
        <li><a href="/transferencia">Transferência</a></li>
        <li><a href="/isencaopcd">Isenção PCD</a></li>
        <li><a href="/isencaopcd/2027">O que muda em 2027</a></li>
        <li><a href="/impostoderenda">Isenção de Imposto de Renda</a></li>
        <li><a href="/cnh-suspensa">CNH suspensa ou cassada</a></li>
        <li><a href="/recursos">Recursos de multa</a></li>
      </ul>
    </div>

    <div>
      <h2 class="foot-tit">A empresa</h2>
      <ul>
        <li><a href="/quem-somos">Quem somos</a></li>
        <li><a href="/quem-somos">Conheça a Lili</a></li>
        <li><a href="/privacidade">Política de Privacidade</a></li>
      </ul>
      <div class="aviso" style="margin-top:var(--e-5)">
        <strong style="color:#fff">Empresa privada de assessoria em documentação veicular.</strong><br>
        Não somos órgão público nem representamos o DETRAN. Auxiliamos proprietários de veículos na regularização de documentação e na orientação junto aos órgãos competentes.
      </div>
    </div>
  </div>
  <div class="foot-fim">
    <span>Razão Social: DESPACHANTE 100 MILHAS &middot; CNPJ 12.109.034/0001-06</span>
    <span>&copy; 2026 Despachante 100 Milhas. Todos os direitos reservados.</span>
  </div>
</div>
</footer>
<a class="zap-flut" href="{zap(msg_flut, canal)}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">{SVG_ZAP}</a>
<script src="/assets/analytics.js{V}" defer></script>
<script src="/assets/script.js{V}" defer></script>
<script src="/assets/central.js{V}" defer></script>
<script src="/assets/agente.js{V}" defer></script>
</body>
</html>"""

def pagina(arquivo, titulo, desc, url, corpo, extra="", pilar="", canal="doc"):
    conteudo = head(titulo, desc, url, extra, pilar, canal) + header(url, canal) + '<main id="conteudo">' + corpo + '</main>' + rodape(canal)
    caminho = os.path.join(SAIDA, arquivo)
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(conteudo)
    print(f"  {arquivo}  ({len(conteudo):,} bytes)")


def faixa_lili(fala, cta_texto, cta_msg, canal="doc"):
    return f"""<section style="padding-top:0">
  <div class="wrap" style="max-width:52rem">
    <div class="faixa-lili">
      <img src="/assets/lili.webp" width="88" height="88" loading="lazy" alt="Liliane Pereira Rosa, a Lili">
      <div class="fala">
        <p>&ldquo;{fala}&rdquo;</p>
        <div class="quem">— <b>Lili</b> · Liliane Pereira Rosa, fundadora da 100 Milhas</div>
      </div>
      <a class="btn btn-roxo" href="{zap(cta_msg, canal)}" target="_blank" rel="noopener">{cta_texto}</a>
    </div>
  </div>
</section>"""

# ============ FORMULARIO DE CAPTURA (substitui o motor da ONDESP) ============
def form_captura(titulo, ajuda, botao, origem):
    return f"""<div class="card-consulta">
  <h2>{titulo}</h2>
  <p class="ajuda">{ajuda}</p>
  <form class="form-lead" data-origem="{origem}">
    <div class="campo">
      <label for="renavam-{origem}">Renavam ou placa do veículo</label>
      <input id="renavam-{origem}" name="renavam" required autocomplete="off" placeholder="Ex.: 00123456789 ou ABC1D23">
    </div>
    <div class="campo">
      <label for="zap-{origem}">Seu WhatsApp</label>
      <input id="zap-{origem}" name="whatsapp" required inputmode="tel" placeholder="(13) 99999-9999">
    </div>
    <button class="btn btn-ouro btn-bloco" type="submit">{botao}</button>
  </form>
  <p class="seguro">&#128274; Seus dados ficam com a nossa equipe. Sem compromisso.</p>
</div>"""

# ==================== HOME ====================
DEPOIMENTOS = [
    ("Eu estava tentando fazer todo o processo PCD sozinha e acabei passando por um perito que me tratou mal. Decidi recomeçar tudo com a Lili e foi tudo muito rápido — até os peritos que ela agendou eram um amor. Hoje eu indico para todo mundo.", "Val Alves"),
    ("Fiz todo o processo de aquisição de um carro PCD com o acompanhamento e a documentação com a Liliane da 100 Milhas. Tirou dúvidas, auxiliou com a documentação e deu todo o suporte necessário. São muito profissionais e atenciosos.", "Waldemar Domingues"),
    ("Gostaria de agradecer imensamente pela agilidade e profissionalismo na resolução do processo PCD. A dedicação de toda a equipe foi fundamental para essa conquista. Super recomendo.", "Veronica Santos"),
]
depos = "".join(f'<div class="depo"><div class="estrelas">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p>&ldquo;{t}&rdquo;</p><div class="quem">{n}</div></div>' for t, n in DEPOIMENTOS)

FAQ_DEBITOS = [
    ("Quais são os prazos para a entrega dos documentos?", "Após a aprovação do seu pedido, cuidamos da quitação dos débitos e você é avisado assim que o veículo estiver regular. O CRLV digital fica disponível para download."),
    ("Como funciona a consulta?", "Você informa o Renavam ou a placa e o seu WhatsApp. Nossa equipe levanta todos os débitos do veículo e devolve o retorno com as opções de pagamento e regularização."),
    ("Débitos atrasados de IPVA e multas podem ser resolvidos?", "Sim. Trabalhamos com todo tipo de débito veicular. No caso do licenciamento anual, lembre-se de que a renovação exige a quitação integral dos débitos."),
    ("Quais são as formas de pagamento?", "Trabalhamos com parcelamento no cartão de crédito. As condições vigentes são informadas no atendimento, junto com o valor exato do seu caso."),
    ("Posso usar o cartão de outra pessoa?", "Sim. O pedido pode ser feito com o cartão de um familiar ou amigo, desde que os dados do titular sejam informados corretamente."),
    ("Como acompanho o andamento?", "Pelo WhatsApp, direto com a nossa equipe. Você não fica sem resposta."),
]
faq_html = "".join(f'<details><summary>{p}</summary><div class="corpo">{r}</div></details>' for p, r in FAQ_DEBITOS)

home = f"""
<section class="dobra topo7">
  <div class="wrap">
    <div class="hero-marca">
      <img src="/assets/lili-ia-mini.webp" width="44" height="44" alt="Lili, da Despachante 100 Milhas">
      <span><b>Despachante 100 Milhas</b><em>Um despachante muito mais digital</em></span>
    </div>
    <h1>Resolva a documentação do seu veículo <em>sem sair de casa</em></h1>
    <p class="sub">Licenciamento, transferência, ATPV-e, veículo 0 km, defesa da CNH, isenções PCD e Imposto de Renda, com acompanhamento especializado do início ao fim.</p>

    <!-- A CONSULTA É A PRIMEIRA AÇÃO DO SITE -->
    <div class="consulta2" id="consultar">
      <div class="c2-info">
        <span class="c2-placa" aria-hidden="true"><i>BR</i>ABC&middot;1D23</span>
        <h2>Consulte a situação do seu veículo</h2>
        <p>Informe a placa e o RENAVAM para solicitar o levantamento da documentação, débitos e possíveis pendências do veículo.</p>
        <ul class="c2-itens">
          <li>Débitos e multas</li>
          <li>Licenciamento</li>
          <li>IPVA</li>
          <li>Restrições e pendências</li>
        </ul>
        <p class="c2-nota">O levantamento é feito pela nossa equipe e devolvido a você pelo WhatsApp.</p>
      </div>
      <form id="form-veiculo" class="c2-form" novalidate>
        <div class="campo-g">
          <label for="placa">Placa</label>
          <input id="placa" name="placa" placeholder="ABC1D23" autocomplete="off"
                 inputmode="text" maxlength="8" aria-describedby="erro-placa" required>
          <div class="erro-campo" id="erro-placa" role="alert"></div>
        </div>
        <div class="campo-g">
          <label for="renavam">RENAVAM</label>
          <input id="renavam" name="renavam" placeholder="Digite o RENAVAM" autocomplete="off"
                 inputmode="numeric" maxlength="11" aria-describedby="erro-renavam" required>
          <div class="erro-campo" id="erro-renavam" role="alert"></div>
        </div>
        <button class="btn btn-ouro btn-grande" type="submit">Consultar agora</button>
      </form>
    </div>

    <h2 class="pergunta7">O que você precisa resolver hoje?</h2>

    <div class="svc7">
      <a class="s7" href="/licenciamento">
        <span class="s7-ico">{ic("doc")}</span>
        <h3>Licenciar veículo</h3>
        <p>Licenciamento, débitos e emissão do documento atualizado.</p>
        <span class="s7-cta">Iniciar &rarr;</span>
      </a>
      <a class="s7" href="/transferencia">
        <span class="s7-ico">{ic("carro")}</span>
        <h3>Transferência</h3>
        <p>Transferência de propriedade com orientação completa.</p>
        <span class="s7-cta">Iniciar &rarr;</span>
      </a>
      <a class="s7" href="{zap('Olá, preciso emitir o ATPV-e para compra ou venda de um veículo.')}" target="_blank" rel="noopener">
        <span class="s7-ico">{ic("envio")}</span>
        <h3>ATPV-e</h3>
        <p>Emissão e orientação para compra ou venda do veículo.</p>
        <span class="s7-cta">Iniciar &rarr;</span>
      </a>
      <a class="s7" href="{zap('Olá, preciso da documentação e do primeiro registro de um veículo 0 km.')}" target="_blank" rel="noopener">
        <span class="s7-ico">{ic("raio")}</span>
        <h3>Veículo 0 km</h3>
        <p>Documentação e primeiro registro do veículo novo.</p>
        <span class="s7-cta">Iniciar &rarr;</span>
      </a>
      <a class="s7" href="/cnh-suspensa">
        <span class="s7-ico">{ic("balanca")}</span>
        <h3>Suspensão da CNH</h3>
        <p>Análise de suspensão, cassação, pontuação e defesa.</p>
        <span class="s7-cta">Analisar &rarr;</span>
      </a>
      <a class="s7 s7-direito" href="/isencaopcd">
        <span class="s7-selo">Direitos</span>
        <span class="s7-ico">{ic("escudo")}</span>
        <h3>Isenção PCD</h3>
        <p>Análise de direito e acompanhamento de laudo, IPI, ICMS e IPVA.</p>
        <span class="s7-cta">Verificar direito &rarr;</span>
      </a>
      <a class="s7 s7-direito" href="/impostoderenda">
        <span class="s7-selo">Direitos</span>
        <span class="s7-ico">{ic("moeda")}</span>
        <h3>Isenção de Imposto de Renda</h3>
        <p>Análise para doenças previstas em lei e rendimentos abrangidos.</p>
        <span class="s7-cta">Verificar direito &rarr;</span>
      </a>
    </div>

    <div class="selo-prova">
      <div class="sp-linha">
        <div class="sp-item"><span class="sp-estrelas">&#9733;&#9733;&#9733;&#9733;&#9733;</span><b>4,9</b><span>no Google</span></div>
        <span class="sp-div"></span>
        <div class="sp-item"><b>657</b><span>avaliações</span></div>
        <span class="sp-div"></span>
        <div class="sp-item"><b>+5.000</b><span>processos</span></div>
        <span class="sp-div"></span>
        <div class="sp-item"><b>15 anos</b><span>de experiência</span></div>
      </div>
      <a class="sp-link" href="https://www.google.com/search?q=100+milhas+despachante" target="_blank" rel="noopener">Ver avaliações no Google &rarr;</a>
    </div>
  </div>
</section>

<!-- AGENDA DA LILI — ORIENTAÇÃO PCD (API própria no Worker, sem n8n) -->
<section class="sec-clara" style="padding:56px 0">
  <div class="wrap">
    <div class="agenda" id="agenda-pcd">
      <div class="ag-info">
        <img src="/assets/lili.webp" width="96" height="96" loading="lazy" alt="Lili, Despachante Documentalista">
        <h2>Converse com a Lili sobre seus direitos PCD</h2>
        <p>Escolha um dia e horário disponível para uma orientação personalizada sobre o seu caso.</p>
        <p class="ag-nota">Orientação de segunda a sexta &middot; análise inicial sem custo e sem compromisso.</p>
      </div>
      <div class="ag-caixa">
        <div class="ag-passo" id="ag-p1">
          <h3><b>1</b> Escolha o dia</h3>
          <div class="ag-dias" id="ag-dias"></div>
        </div>
        <div class="ag-passo" id="ag-p2" hidden>
          <h3><b>2</b> Escolha o horário</h3>
          <div class="ag-horas" id="ag-horas"></div>
        </div>
        <div class="ag-passo" id="ag-p3" hidden>
          <h3><b>3</b> Seus dados</h3>
          <form id="ag-form" novalidate>
            <div class="campo-g">
              <label for="ag-nome">Nome completo</label>
              <input id="ag-nome" maxlength="80" autocomplete="name" required>
            </div>
            <div class="campo-g">
              <label for="ag-tel">WhatsApp com DDD</label>
              <input id="ag-tel" name="whatsapp" inputmode="tel" autocomplete="tel" placeholder="(13) 99999-9999" required>
            </div>
            <div class="campo-g">
              <label for="ag-assunto">Assunto (opcional)</label>
              <input id="ag-assunto" maxlength="200" placeholder="Ex.: isenção para meu filho com TEA">
            </div>
            <button class="btn btn-ouro btn-bloco" type="submit">Agendar orientação PCD</button>
          </form>
        </div>
        <p class="ag-erro" id="ag-erro" role="alert"></p>
        <div class="ag-ok" id="ag-ok" hidden>
          <div class="ag-ok-selo">&#10003;</div>
          <h3>Agendamento confirmado!</h3>
          <p id="ag-ok-txt"></p>
          <a class="btn btn-roxo btn-bloco" id="ag-ok-zap" target="_blank" rel="noopener" href="#">Enviar comprovante no WhatsApp da Lili</a>
          <p class="ag-mini">O horário já ficou reservado para você. Enviar o comprovante ajuda a equipe a se preparar para o seu caso.</p>
        </div>
        <div class="ag-off" id="ag-off" hidden>
          <p>A agenda está temporariamente indisponível.</p>
          <a class="btn btn-ouro btn-bloco" href="{zap('Olá! Quero agendar uma orientação sobre direitos PCD.', 'pcd')}" target="_blank" rel="noopener">Agendar pelo WhatsApp PCD</a>
        </div>
      </div>
    </div>
  </div>
</section>


<!-- NÃO SEI QUAL SERVIÇO PRECISO -->
<section class="sec-clara">
  <div class="wrap">
    <div class="nao-sei">
      <img src="/assets/lili-ia.webp" width="132" height="132" alt="Lili, guia digital da Central da 100 Milhas">
      <div class="txt">
        <h2>Não sabe qual serviço precisa?</h2>
        <p>Conte o que aconteceu. A Lili ajuda você a encontrar o caminho certo — sem cadastro e sem compromisso.</p>
      </div>
      <a class="btn btn-ouro btn-grande" style="width:auto;min-width:260px" href="/central" data-lili>ABRIR A LILI</a>
    </div>
  </div>
</section>

<section class="sec-clara" style="padding-top:56px;padding-bottom:56px">
  <div class="wrap">
    <div class="relogio">
      <span class="placa claro">Prazo legal</span>
      <h2>As regras atuais de isenção PCD valem até <em>31 de dezembro de 2026</em>.</h2>
      <div class="linhas">
        <div><strong style="color:#fff">IPI:</strong>&nbsp;isenção garantida por lei até 31/12/2026.</div>
        <div><strong style="color:#fff">ICMS:</strong>&nbsp;o convênio venceria em 30/04/2026 e foi prorrogado pelo CONFAZ até 31/12/2026.</div>
        <div><strong style="color:#fff">A partir de 01/01/2027:</strong>&nbsp;entram as regras do novo sistema tributário (IBS/CBS), com prazo de troca do veículo mais curto.</div>
      </div>
      <a class="btn btn-ouro" href="/isencaopcd/2027">Entender o que muda para mim</a>
      <p class="rodape-nota">Informação de caráter geral, com base na legislação vigente e no Convênio ICMS 38/2012. Não constitui parecer jurídico. Cada caso é analisado individualmente — você <strong style="color:#DCCFEA">pode ter direito</strong>, e verificamos isso com você.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap lili">
    <div class="lili-foto">
      <img src="/assets/lili.webp" width="900" height="1125" loading="lazy"
           alt="Liliane Pereira Rosa, a Lili, fundadora da Despachante 100 Milhas, sentada de blazer preto e camisa branca">
    </div>
    <div>
      <span class="placa">Quem cuida do seu caso</span>
      <h2 style="font-size:clamp(1.7rem,3vw,2.3rem);color:var(--roxo-fundo);margin:16px 0 14px">Alguém olha o seu caso. E te diz a verdade.</h2>
      <p style="color:var(--texto-suave);font-size:1.05rem;margin-bottom:14px">Sou a <strong style="color:var(--texto)">Liliane Pereira Rosa</strong> — a Lili. Fundei a 100 Milhas para fazer o que quase ninguém faz nesse mercado: olhar o caso de cada pessoa antes de dizer qualquer coisa.</p>
      <p style="color:var(--texto-suave)">Não prometo aprovação. Prometo análise honesta: se você tem caminho, eu digo. Se não tem, eu digo também — e explico por quê.</p>
      <div class="credencial">&#9878;&nbsp;<strong>Despachante Documentalista</strong> — atuação junto aos órgãos de trânsito, com empresa registrada sob o CNPJ 12.109.034/0001-06</div>
      <div class="selos-mini">
        <span>15 anos</span><span>+5.000 processos</span><span>Atendimento especializado</span>
      </div>
      <div class="assinatura">— Lili, Despachante 100 Milhas</div>
      <a class="btn btn-linha" style="margin-top:22px" href="/quem-somos">Conhecer a nossa história</a>
    </div>
  </div>
</section>


<section>
  <div class="wrap">
    <div class="google-topo">
      <div class="estrelas">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <div style="max-width:22rem">
        <strong>Avaliações reais no Google</strong>
        <p style="color:var(--texto-suave);font-size:.93rem">Quem passou por aqui conta o que aconteceu.</p>
      </div>
      <a class="btn btn-linha" href="https://www.google.com/search?q=100+milhas+despachante" target="_blank" rel="noopener">Ver todas as avaliações</a>
    </div>
    <div class="grid g3">{depos}</div>
  </div>
</section>


<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca">
      <span class="placa claro">Por que aqui</span>
      <h2>Um despachante muito mais digital.</h2>
    </div>
    <div class="grid g4">
      <div class="card card-vidro"><h3>Agilidade no processo</h3><p>Simule valores de transferência veicular sem esperar por ninguém.</p></div>
      <div class="card card-vidro"><h3>Consultas 24 horas</h3><p>Envie sua consulta a qualquer hora. Retornamos com o levantamento completo.</p></div>
      <div class="card card-vidro"><h3>Comodidade</h3><p>Conforto em cada clique: resolva o que dá para resolver online.</p></div>
      <div class="card card-vidro"><h3>Atendimento no WhatsApp</h3><p>Atendimento personalizado onde quer que você esteja.</p></div>
    </div>
  </div>
</section>


<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">Sem pegadinha</span>
    <h2>As duas perguntas que todo mundo faz</h2></div>
    <div class="grid g2">
      <div class="card card-vidro">
        <h3>&ldquo;Quanto custa?&rdquo;</h3>
        <p>Depende do serviço e do seu caso — e quem te der um valor antes de olhar o caso está chutando. O que a gente garante: <strong style="color:#fff">o valor é informado antes de qualquer coisa começar.</strong> Você nunca é cobrado por algo que não aprovou.</p>
        <p style="margin-top:10px">A análise inicial do seu caso não tem custo.</p>
      </div>
      <div class="card card-vidro">
        <h3>&ldquo;E depois que eu chamar no WhatsApp?&rdquo;</h3>
        <p>Você fala com uma pessoa, não com um robô. A gente pede o mínimo: <strong style="color:#fff">nome, cidade, telefone e o que você precisa.</strong> Com isso, analisamos e voltamos dizendo se existe caminho — e qual é.</p>
        <p style="margin-top:10px">Se não existir caminho, a gente também diz. É isso que nos diferencia.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cabeca centro">
      <span class="placa">Compra e venda</span>
      <h2>Serviços úteis na hora de vender ou comprar um veículo</h2>
    </div>
    <div class="grid g2">
      <div class="card">
        <div class="icone">{ic("doc")}</div>
        <h3>ATPV-e</h3>
        <p>Para transferir um veículo, é preciso preencher o ATPV-e. Cuidamos disso com você, do começo ao fim.</p>
        <a class="btn btn-roxo" style="margin-top:18px" href="{zap('Olá, eu quero fazer o ATPV-e online. Pode me ajudar?')}" target="_blank" rel="noopener">Iniciar ATPV-e</a>
      </div>
      <div class="card">
        <div class="icone">{ic("envio")}</div>
        <h3>Comunicação de Venda</h3>
        <p>Sempre que vender um veículo, comunique a venda imediatamente. Sem isso, qualquer infração cometida antes da transferência recai sobre você.</p>
        <a class="btn btn-roxo" style="margin-top:18px" href="{zap('Olá, eu quero fazer a comunicação de venda online. Pode me ajudar?')}" target="_blank" rel="noopener">Comunicar venda</a>
      </div>
    </div>
  </div>
</section>

<section class="sec-clara">
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">Dúvidas</span><h2>Principais dúvidas dos nossos clientes</h2></div>
    <div class="faq">{faq_html}</div>
  </div>
</section>


<section class="sec-clara">
  <div class="wrap">
    <div class="cabeca centro">
      <span class="placa">Como funciona</span>
      <h2>Do problema até resolvido</h2>
      <p>Você nunca fica sem saber em que pé está. Cada etapa é avisada.</p>
    </div>
    <div class="trilha">
      <div class="etapa"><h3>Você conta o problema</h3><p>Pelo WhatsApp, pela Central ou aqui pelo site. Com as suas palavras — não precisa saber o nome técnico.</p></div>
      <div class="etapa"><h3>A Lili analisa</h3><p>Seu caso é olhado de verdade. Não é triagem automática: é gente lendo o que você mandou.</p></div>
      <div class="etapa"><h3>Conferimos a documentação</h3><p>Verificamos o que existe, o que falta e o que precisa ser corrigido antes de qualquer protocolo.</p></div>
      <div class="etapa"><h3>Explicamos as opções</h3><p>Com o valor exato e o prazo real. Se não houver caminho, a gente também diz — e explica por quê.</p></div>
      <div class="etapa"><h3>Você aprova</h3><p>Nada começa sem o seu sim. Você nunca é cobrado por algo que não autorizou.</p></div>
      <div class="etapa"><h3>Resolvemos</h3><p>Cuidamos do processo junto aos órgãos competentes, do começo ao fim.</p></div>
      <div class="etapa final"><h3>Você acompanha pelo WhatsApp</h3><p>Sem precisar perguntar. A gente avisa cada avanço, até o documento na sua mão.</p></div>
    </div>
  </div>
</section>

<!-- ATENDEMOS -->
<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca centro">
      <span class="placa claro">Atendemos</span>
      <h2>Perto de você — e onde você estiver</h2>
      <p>Unidade própria, regiões atendidas e atendimento online para todo o Brasil.</p>
    </div>
    <div class="atende-grid">
      <div class="atende destaque">
        <span class="atende-tag">Unidade própria</span>
        <div class="atende-ico">{ic("mapa")}</div>
        <h3>São Vicente / SP — Centro</h3>
        <p>R. Jacob Emmerich, 700 &middot; CEP 11310-070.<br>Atendimento presencial de segunda a sexta.</p>
      </div>
      <div class="atende">
        <span class="atende-tag">Região atendida</span>
        <div class="atende-ico">{ic("mapa")}</div>
        <h3>Baixada Santista</h3>
        <p>Santos, Praia Grande, Guarujá, Cubatão e demais cidades — presencial na sede ou online.</p>
      </div>
      <div class="atende">
        <span class="atende-tag">Aos sábados</span>
        <div class="atende-ico">{ic("relogio")}</div>
        <h3>São Paulo / SP</h3>
        <p>Av. Atlântica, 2905 — Jd. Santa Helena.</p>
      </div>
      <div class="atende">
        <span class="atende-tag">Online</span>
        <div class="atende-ico">{ic("envio")}</div>
        <h3>Todo o Brasil</h3>
        <p>Processos 100% online pelo WhatsApp — do primeiro contato ao documento na mão.</p>
      </div>
    </div>

    <div class="parceiros">
      <div class="parceiros-txt">
        <span class="parceiro-tag">Mediante agendamento</span>
        <h3>Também atendemos em lojas e concessionárias parceiras</h3>
        <p>Comprando o seu 0km? A 100 Milhas cuida da documentação e da isenção direto com a loja, por parceria e com hora marcada.</p>
      </div>
      <a class="btn btn-ouro" href="{zap('Olá! Quero agendar atendimento em uma loja ou concessionária parceira.')}" target="_blank" rel="noopener">Agendar atendimento</a>
    </div>
  </div>
</section>

<!-- REDES E CONTATO -->
<section class="sec-clara" style="padding-top:48px;padding-bottom:48px">
  <div class="wrap">
    <div class="redes-bloco">
      <div>
        <h2>Acompanhe a 100 Milhas</h2>
        <p>Conteúdo real sobre documentação, isenção PCD e direitos — direto de quem faz.</p>
      </div>
      <div class="redes-links">
        <a class="rede-link" href="https://www.instagram.com/despachante100milhas/" target="_blank" rel="noopener">{IC_INSTA}Instagram</a>
        <a class="rede-link" href="https://www.facebook.com/100milhasdespachante" target="_blank" rel="noopener">{IC_FACE}Facebook</a>
        <a class="rede-link" href="https://www.google.com/search?q=100+milhas+despachante" target="_blank" rel="noopener">{IC_GOOGLE}Avaliações no Google</a>
        <a class="rede-link rl-zap" href="{zap('Olá, estou no site e tenho uma dúvida.')}" target="_blank" rel="noopener">{SVG_ZAP}WhatsApp</a>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="fecho">
      <img src="/assets/lili.webp" width="104" height="104" alt="Liliane Pereira Rosa, a Lili">
      <h2>Ainda não sabe por onde começar?</h2>
      <p>Conversa comigo. Você conta o que aconteceu, eu olho o seu caso e te digo a verdade — mesmo quando a verdade é não.</p>
      <div class="fecho-btns">
        <a class="btn btn-ouro" href="#agenda-pcd">Agendar com a Lili</a>
        <a class="btn btn-linha btn-claro" href="{zap('Olá Lili! Não sei bem por onde começar, quero conversar.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
      </div>
      <div class="local">{ic("mapa")} Atendimento presencial e online</div>
    </div>
  </div>
</section>
"""

# ==================== ISENCAO PCD ====================
PATOLOGIAS = ["Problemas de coluna (hérnia de disco, escoliose)","Artrite / Artrose","Problemas nos joelhos / mobilidade reduzida","Amputações / limitações físicas","Paralisia (parcial ou total)","Monoparesia","Hemiparesia","Tetraparesia / Paraparesia","Lesão medular","Uso de prótese ou órtese","Encurtamento de membro","LER / DORT","AVC (sequelas)","Parkinson","Esclerose múltipla","Autismo (TEA)"]
pat = "".join(f'<span class="pilula">{p}</span>' for p in PATOLOGIAS)

pcd = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">Isenção PCD</span>
      <h1>Carro 0km com <em>isenção de impostos</em>.</h1>
      <p class="sub">Simplificamos todo o processo burocrático para você conquistar seu veículo novo com isenção de IPI, ICMS e IPVA.</p>
      <div class="selos">
        <span class="selo">&#10004; <b>IPI</b></span>
        <span class="selo">&#10004; <b>ICMS</b></span>
        <span class="selo">&#10004; <b>IPVA</b></span>
        <span class="selo">&#10004; Condutor e <b>não condutor</b></span>
      </div>
    </div>
    <div class="card-consulta">
      <h2>Consultar meu direito</h2>
      <p class="ajuda">Conte a sua condição e o seu estado. Fazemos a análise preliminar do seu caso.</p>
      <a class="btn btn-ouro btn-bloco" href="{zap('Olá, quero consultar meu direito à isenção PCD.', 'pcd')}" target="_blank" rel="noopener">Consultar meu direito agora</a>
      <p class="seguro">&#128274; Atendimento humano e sigiloso.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">Os três impostos</span><h2>O que você pode deixar de pagar</h2></div>
    <div class="grid g3">
      <div class="card"><div class="icone ouro">IPI</div><h3>Isenção de IPI</h3><p>Economia na compra de veículos nacionais dentro do teto vigente, reduzindo o valor de nota.</p></div>
      <div class="card"><div class="icone ouro">ICMS</div><h3>Isenção de ICMS</h3><p>Desconto estadual acumulativo para veículos que se enquadram nas categorias de teto vigentes.</p></div>
      <div class="card"><div class="icone ouro">IPVA</div><h3>Isenção de IPVA</h3><p>Fique livre do imposto anual do veículo. Cuidamos do protocolo e da renovação.</p></div>
    </div>
  </div>
</section>

<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">Quem tem direito</span><h2>O benefício não é só para cadeirantes</h2>
    <p>Ao contrário do que muita gente pensa, o direito não se limita a deficiências visíveis. Pessoas com limitações físicas, doenças crônicas ou que passaram por cirurgias que limitam movimentos podem ter direito. E o benefício também alcança <strong style="color:var(--dourado)">não condutores</strong>, quando o beneficiário é transportado por terceiros.</p></div>
    <p style="margin-bottom:16px;font-weight:700;color:#fff">Algumas das mais de 70 condições que podem dar direito:</p>
    <div class="pilulas">{pat}</div>
    <div style="margin-top:32px"><a class="btn btn-ouro" href="{zap('Olá, quero verificar se a minha condição dá direito à isenção PCD.', 'pcd')}" target="_blank" rel="noopener">Verificar minha condição</a></div>
  </div>
</section>

{faixa_lili(
  "A maior parte das pessoas que chega até mim já ouviu de alguém que não tem direito. Muitas vezes, quem disse isso nem chegou a olhar o laudo. Eu olho. E te digo a verdade — mesmo quando a verdade é não.",
  "Contar meu caso", "Olá Lili, quero contar meu caso de isenção PCD.", "pcd")}
<section>
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">O caminho</span><h2>Como funciona o processo</h2></div>
    <div class="passos" style="max-width:47rem;margin:0 auto">
      <div class="passo"><div><h3>Análise documental</h3><p>Avaliamos seus exames e laudos para verificar o enquadramento na lei.</p></div></div>
      <div class="passo"><div><h3>Laudo médico PCD</h3><p>Orientação completa para a obtenção do laudo junto aos órgãos credenciados.</p></div></div>
      <div class="passo"><div><h3>Protocolo das isenções</h3><p>Damos entrada nos pedidos de IPI, ICMS e IPVA de forma digital e ágil.</p></div></div>
    </div>
    <div style="text-align:center;margin-top:34px"><a class="btn btn-roxo" href="{zap('Olá, quero iniciar meu processo de isenção PCD.', 'pcd')}" target="_blank" rel="noopener">Iniciar meu processo</a></div>
  </div>
</section>

<section class="sec-clara">
  <div class="wrap">
    <div class="grid g2" style="align-items:start">
      <div>
        <span class="placa">Regras vigentes</span>
        <h2 style="font-size:1.9rem;color:var(--roxo-fundo);margin:16px 0 16px">Limites e prazos</h2>
        <ul class="lista">
          <li><strong>Teto do IPI:</strong> veículos de até R$ 200.000,00.</li>
          <li><strong>Teto do ICMS:</strong> isenção parcial até R$ 120.000,00.</li>
          <li><strong>Prazo de troca:</strong> 3 anos para veículos adquiridos com IPI; 4 anos com IPI + ICMS.</li>
        </ul>
        <p style="color:var(--texto-suave);margin-top:18px;font-size:.95rem">O mercado PCD muda com frequência. Nossa equipe acompanha cada atualização para que você não perca o prazo nem o benefício por erro de preenchimento ou documento vencido.</p>
        <a class="btn btn-linha" style="margin-top:20px" href="{zap('Olá, quero tirar dúvidas sobre valores e regras da isenção PCD.', 'pcd')}" target="_blank" rel="noopener">Tirar dúvidas sobre valores</a>
      </div>
      <div class="card">
        <div class="icone ouro">{ic("presente")}</div>
        <h3>Benefícios extras para PCD</h3>
        <p style="margin-bottom:14px">Além da compra do carro, você pode ter direito a:</p>
        <ul class="lista">
          <li>Cartão de vaga especial</li>
          <li>Isenção de rodízio</li>
          <li>Livre acesso de circulação</li>
        </ul>
        <a class="btn btn-roxo" style="margin-top:20px" href="{zap('Olá, quero solicitar os benefícios extras para PCD.', 'pcd')}" target="_blank" rel="noopener">Solicitar benefícios extras</a>
      </div>
    </div>
  </div>
</section>


<section class="sec-clara">
  <div class="wrap">
    <div class="cabeca centro">
      <span class="placa">Quem já passou por isso</span>
      <h2>Elas também acharam que não tinham direito</h2>
    </div>
    <div class="grid g3">{depos}</div>
    <p style="text-align:center;color:var(--texto-suave);margin-top:24px;font-size:.95rem">Avaliações reais, publicadas no Google por quem passou por aqui.</p>
  </div>
</section>

<section>
  <div class="wrap"><div class="chamada">
    <h2>Atendimento especializado em PCD</h2>
    <p>Atuamos em processos PCD com transparência do primeiro contato até a entrega do carro.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero falar com um especialista em isenção PCD.', 'pcd')}" target="_blank" rel="noopener">Falar com especialista agora</a>
  </div></div>
</section>
"""

# ==================== IMPOSTO DE RENDA ====================
DOENCAS = ["Câncer (neoplasia maligna)","Cardiopatia grave","Parkinson","Nefropatia grave","Esclerose múltipla","AIDS","Paralisia irreversível","Hepatopatia grave","Cegueira","Tuberculose ativa","Alienação mental","Espondiloartrose anquilosante"]
doe = "".join(f'<span class="pilula">{d}</span>' for d in DOENCAS)

ir = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">Isenção de Imposto de Renda</span>
      <h1>Pare de pagar Imposto de Renda e <em>recupere o que já pagou</em>.</h1>
      <p class="sub">Isenção prevista em lei para aposentados, pensionistas e militares reformados portadores de doenças graves.</p>
    </div>
    <div class="card-consulta">
      <h2>Analisar meu caso</h2>
      <p class="ajuda">Conte o seu diagnóstico e a sua situação. A análise preliminar é gratuita.</p>
      <a class="btn btn-ouro btn-bloco" href="{zap('Olá, quero analisar meu direito à isenção de Imposto de Renda.', 'pcd')}" target="_blank" rel="noopener">Falar com especialista agora</a>
      <p class="seguro">&#128274; Sigilo total sobre a sua condição de saúde.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="grid g3">
      <div class="card"><div class="icone ouro">{ic("escudo")}</div><h3>Isenção total</h3><p>Deixe de ter o imposto retido diretamente na sua fonte de rendimentos, mês a mês.</p></div>
      <div class="card"><div class="icone ouro">{ic("moeda")}</div><h3>Retroativos</h3><p>É possível buscar a devolução do que foi pago nos últimos 60 meses, pela via administrativa ou judicial.</p></div>
      <div class="card"><div class="icone ouro">{ic("lupa")}</div><h3>Análise técnica</h3><p>Verificamos a documentação para que o pedido seja apresentado dentro da legalidade.</p></div>
    </div>
  </div>
</section>

<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">A base legal</span><h2>Como funciona o seu direito</h2>
    <p>A <strong style="color:var(--dourado)">Lei 7.713/88</strong> prevê que aposentados e pensionistas que enfrentam diagnósticos graves não devem ser tributados. O objetivo é aliviar a carga financeira para que o foco seja o tratamento.</p>
    <p style="margin-top:12px">Um ponto importante: mesmo que a doença esteja controlada — um câncer em remissão, por exemplo — o entendimento dos tribunais superiores é de que a isenção deve ser mantida.</p></div>
    <p style="margin-bottom:16px;font-weight:700;color:#fff">Algumas doenças previstas em lei:</p>
    <div class="pilulas">{doe}</div>
    <div style="margin-top:32px"><a class="btn btn-ouro" href="{zap('Olá, quero analisar meu caso de isenção de Imposto de Renda.', 'pcd')}" target="_blank" rel="noopener">Analisar meu caso</a></div>
  </div>
</section>

{faixa_lili(
  "Muita gente para de pagar imposto e nem sabe que podia ter parado há cinco anos. O retroativo existe. Vale a pena olhar o seu caso antes que o prazo corra.",
  "Analisar meu caso", "Olá Lili, quero analisar meu caso de isenção de Imposto de Renda.", "pcd")}

<section>
  <div class="wrap"><div class="chamada">
    <h2>Ainda tem dúvidas?</h2>
    <p>Fale com a nossa equipe pelo WhatsApp. Explicamos o seu caso em linguagem simples, sem enrolação.</p>
    <a class="btn btn-ouro" href="{zap('Olá, tenho dúvidas sobre a isenção de Imposto de Renda.', 'pcd')}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
  </div></div>
</section>
"""

# ==================== RECURSOS ====================
SERVICOS_R = [
    ("Recurso do bafômetro (Lei Seca)","Contestação especializada para defender motoristas em casos de teste do bafômetro."),
    ("Recurso de multas de trânsito","Análise detalhada e defesa contra multas, com estratégias para reduzir ou cancelar penalidades."),
    ("Transferência de pontos","Assistência para a transferência de pontos entre condutores, com a aplicação correta das penalidades."),
    ("Veículo vendido e não transferido","Soluções para proteger o antigo proprietário de um veículo vendido que não foi transferido."),
    ("Suspensão e cassação da CNH","Defesa administrativa para proteger o direito de dirigir e reverter suspensões e cassações."),
    ("Acidentes de trânsito","Atendimento em casos de acidente, buscando ressarcimento e proteção dos direitos dos envolvidos."),
]
srv = "".join(f'<div class="card"><div class="icone">{ic("balanca")}</div><h3>{t}</h3><p>{d}</p><a class="btn btn-linha btn-card" href="{zap("Olá, preciso de ajuda com: " + t + ".")}" target="_blank" rel="noopener">Analisar meu caso</a></div>' for t, d in SERVICOS_R)

rec = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">Direito de trânsito</span>
      <h1>Não perca o seu <em>direito de dirigir</em>.</h1>
      <p class="sub">Defesa especializada em multas, suspensão e cassação da CNH. Soluções ágeis, com acompanhamento individual do seu caso.</p>
      <div style="margin-bottom:22px">
        <a class="btn btn-ouro" href="/central">Descobrir se eu tenho direito &rarr;</a>
      </div>
      <div class="selos">
        <span class="selo">&#10004; Desde <b>2011</b></span>
        <span class="selo">&#9733; <b>4,9</b> no Google</span>
      </div>
    </div>
    <div class="card-consulta">
      <h2>Análise do seu caso</h2>
      <p class="ajuda">Conte o que aconteceu. Verificamos se há caminho de defesa.</p>
      <a class="btn btn-ouro btn-bloco" href="{zap('Olá, quero uma análise do meu caso de multa/CNH.')}" target="_blank" rel="noopener">Solicitar análise</a>
      <p class="seguro">&#128274; Atendimento direto com a nossa equipe.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">O que fazemos</span><h2>Serviços que podem resolver o seu problema</h2>
    <p>Cada caso é analisado individualmente. Não prometemos resultado — verificamos o que a lei permite no seu caso.</p></div>
    <div class="grid g3">{srv}</div>
  </div>
</section>

<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">Como trabalhamos</span><h2>Especializados em demandas de trânsito</h2></div>
    <div class="grid g4">
      <div class="card card-vidro"><h3>Análise especializada</h3><p>Seu caso é analisado em detalhe para identificar o melhor caminho de defesa.</p></div>
      <div class="card card-vidro"><h3>Desde 2011</h3><p>Atuando desde 2011 na Baixada Santista, com milhares de processos acompanhados.</p></div>
      <div class="card card-vidro"><h3>Reputação</h3><p>Avaliações reais no Google, escritas por quem passou por aqui.</p></div>
      <div class="card card-vidro"><h3>Atendimento individual</h3><p>Você acompanha o andamento do seu processo e fala com quem cuida dele.</p></div>
    </div>
  </div>
</section>

{faixa_lili(
  "Em multa e CNH, prazo é tudo. Quanto mais cedo o caso chega, mais caminho existe. Não prometo resultado — prometo olhar rápido e dizer se dá.",
  "Falar agora", "Olá Lili, é urgente: preciso de ajuda com multa/CNH.")}

<section>
  <div class="wrap"><div class="chamada">
    <h2>Não arrisque perder a sua habilitação</h2>
    <p>Quanto antes o caso é analisado, mais caminhos existem. Fale com a nossa equipe hoje.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero solicitar uma análise do meu caso de multa ou CNH.')}" target="_blank" rel="noopener">Solicitar análise</a>
  </div></div>
</section>
"""

# ==================== TRANSFERENCIA ====================
FAQ_T = [
    ("Qual é o prazo para transferir o veículo?","Você tem até 30 dias após a compra para efetuar a transferência. Fora desse prazo, há multa."),
    ("Quem paga o valor da transferência?","O comprador. Os valores variam conforme o DETRAN de cada estado e mudam a cada ano."),
    ("E se o veículo tiver gravame?","O gravame é o registro que prova que o veículo é financiado. Quando ele é quitado, a transferência precisa ser feita para regularizar o veículo. Cuidamos disso."),
    ("Posso fazer tudo online?","Boa parte do processo, sim. Você envia a documentação, nós conduzimos o processo e informamos cada etapa pelo WhatsApp."),
]
faq_t = "".join(f'<details><summary>{p}</summary><div class="corpo">{r}</div></details>' for p, r in FAQ_T)

trans = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">Transferência veicular</span>
      <h1>Já pensou em transferir um veículo <em>sem sair de casa</em>?</h1>
      <p class="sub">Aqui você consegue. Envie os dados do veículo e devolvemos o orçamento completo da transferência.</p>
    </div>
    {form_captura("Orçamento de transferência", "Informe o veículo e o seu WhatsApp. Devolvemos o orçamento completo.", "Iniciar processo", "transf")}
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">Facilitamos tudo</span><h2>Do jeito que deveria ser</h2></div>
    <div class="grid g3">
      <div class="card"><div class="icone">{ic("relogio")}</div><h3>Orçamento 24 horas</h3><p>A qualquer dia e a qualquer hora, você envia o pedido de orçamento de transferência aqui pelo site.</p></div>
      <div class="card"><div class="icone">{ic("raio")}</div><h3>Processo ágil</h3><p>Atendimento online para resolver a sua demanda o mais rápido possível.</p></div>
      <div class="card"><div class="icone">{ic("check")}</div><h3>Praticidade</h3><p>Você não precisa mais ligar para ninguém para saber o valor da transferência.</p></div>
    </div>
  </div>
</section>

<section class="sec-clara">
  <div class="wrap texto" style="margin:0 auto">
    <span class="placa">Guia</span>
    <h2>Transferência de veículo: o que é e como fazer</h2>
    <p>Comprar um veículo é uma alegria. Mas, para dirigir tranquilo e dentro da lei, é preciso transferir o veículo quando há mudança de proprietário ou de localidade. <strong>Você tem até 30 dias para efetuar a transferência</strong> — passar disso gera multa.</p>

    <h3>Documentos necessários</h3>
    <p>Os documentos variam conforme o DETRAN de cada estado. Estes são os essenciais:</p>
    <ul>
      <li>Cópia da CNH ou de outro documento com foto (RG, OAB, CREA, etc.);</li>
      <li>CRV preenchido e assinado por vendedor e comprador, com firma reconhecida de ambos — ou o ATPV-e (Autorização para Transferência de Propriedade do Veículo, eletrônica);</li>
      <li>Cópia do comprovante de residência dos últimos três meses do comprador (ou de parente de 1º grau, com documento que comprove o vínculo);</li>
      <li>Laudo de vistoria feito por empresa credenciada;</li>
      <li>Comprovantes de quitação dos débitos do veículo: IPVA, licenciamento e multas;</li>
      <li>Pagamento das taxas referentes.</li>
    </ul>

    <h3>Valor da transferência</h3>
    <p>Assim como os documentos, os valores mudam conforme o DETRAN de cada estado e são atualizados todo ano. Quem paga é o comprador. Envie os dados do veículo e devolvemos o valor exato do seu caso — sem surpresa.</p>

    <h3>Transferir veículo com gravame</h3>
    <p>O gravame é o registro que prova que o veículo é financiado. Quando o veículo é quitado, é preciso fazer a transferência para que ele fique regularizado. Além de você andar de carro novo, nós resolvemos essa burocracia.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">Dúvidas</span><h2>Perguntas frequentes sobre transferência</h2></div>
    <div class="faq">{faq_t}</div>
  </div>
</section>

{faixa_lili(
  "Transferência tem prazo de 30 dias. Passou disso, vira multa. Manda os dados que eu te devolvo o valor exato, sem surpresa.",
  "Pedir orçamento", "Olá Lili, quero um orçamento de transferência.")}

<section class="sec-clara">
  <div class="wrap"><div class="chamada">
    <h2>Comece o seu orçamento agora</h2>
    <p>Sem ligação, sem fila, sem espera. Envie o veículo e a gente devolve o valor.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero um orçamento de transferência veicular.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div></div>
</section>
"""

# ==================== DEBITOS ====================
deb = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">Débitos veiculares</span>
      <h1>Consulte os débitos do seu veículo e <em>parcele no cartão</em>.</h1>
      <p class="sub">IPVA, licenciamento e multas. Levantamos tudo o que está em aberto e apresentamos o caminho para regularizar.</p>
    </div>
    {form_captura("Consultar meus débitos", "Informe o veículo e o seu WhatsApp. Devolvemos o levantamento completo.", "Iniciar consulta", "debitos")}
  </div>
</section>

<section>
  <div class="wrap">
    <div class="grid g3">
      <div class="card"><div class="icone">{ic("relogio")}</div><h3>Consultas 24 horas</h3><p>Envie o seu pedido a qualquer hora. Nossa equipe faz o levantamento e retorna com tudo.</p></div>
      <div class="card"><div class="icone">{ic("raio")}</div><h3>Processo ágil</h3><p>Atendimento online para resolver a sua demanda o mais rápido possível.</p></div>
      <div class="card"><div class="icone">{ic("cartao")}</div><h3>Parcelamento</h3><p>Trabalhamos com parcelamento no cartão de crédito. As condições vigentes são informadas no atendimento.</p></div>
    </div>
  </div>
</section>

<section class="sec-clara">
  <div class="wrap texto" style="margin:0 auto">
    <span class="placa">Guia</span>
    <h2>Como fazer o licenciamento</h2>
    <p>O licenciamento assegura a emissão do CRLV, documento que comprova que o veículo está apto a circular nas vias públicas brasileiras.</p>
    <p>Se o motorista atrasar o licenciamento e for parado por um agente de trânsito, recebe <strong>multa gravíssima</strong> e o veículo pode ser recolhido ao pátio do DETRAN até a regularização. Por isso, quanto antes resolver, melhor.</p>

    <h2>O que acontece se não pagar o IPVA</h2>
    <p>Deixar de pagar o IPVA gera uma bola de neve: os acréscimos por dia de atraso vão crescendo. No início, incide um percentual diário sobre o valor do imposto, até atingir um teto. Depois disso, o proprietário pode ser inscrito na dívida ativa do estado, com acréscimos ainda maiores.</p>
    <p>E os problemas continuam: sem o IPVA pago, não há licenciamento. Sem licenciamento, o motorista flagrado dirigindo o veículo irregular paga multa gravíssima, recebe pontos na CNH e tem o veículo apreendido.</p>

    <h2>Isenção de IPVA: quem tem direito</h2>
    <p>Algumas pessoas têm direito à isenção do IPVA. Para obter o benefício, é preciso se enquadrar em uma das categorias estabelecidas pelo seu estado — entre elas, pessoas com deficiência. <strong>Você pode ter direito.</strong> <a href="/isencaopcd" style="color:var(--roxo);font-weight:700">Veja a página de isenção PCD</a> e fale com a nossa equipe para uma análise do seu caso.</p>
  </div>
</section>


<section style="padding-top:0">
  <div class="wrap">
    <div class="cruz">
      <div class="txt">
        <h3>Você paga IPVA todo ano. E se não precisasse?</h3>
        <p>Pessoas com deficiência, doenças crônicas ou limitações de mobilidade podem ter direito à isenção de IPVA — e também de IPI e ICMS na compra de um carro 0km. São mais de 70 condições, e não é só para cadeirantes. <strong>As regras atuais valem até 31/12/2026.</strong></p>
      </div>
      <a class="btn btn-roxo" href="/isencaopcd">Ver se eu tenho direito</a>
    </div>
  </div>
</section>
<section>
  <div class="wrap"><div class="chamada">
    <h2>Regularize o seu veículo hoje</h2>
    <p>Evite multa, bloqueio e apreensão. Envie o Renavam e a gente cuida do resto.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero consultar os débitos do meu veículo.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div></div>
</section>
"""

# ==================== PRIVACIDADE ====================
priv = f"""
<section style="padding-top:56px">
  <div class="wrap texto" style="margin:0 auto">
    <span class="placa">Documento</span>
    <h1 style="font-size:2.2rem;color:var(--roxo-fundo);margin:16px 0 10px">Política de Privacidade</h1>
    <p style="color:var(--texto-suave)">Última atualização: julho de 2026.</p>

    <h2>Quem somos</h2>
    <p><strong>DESPACHANTE 100 MILHAS</strong>, CNPJ 12.109.034/0001-06, com endereço na R. Jacob Emmerich, 700, Centro, São Vicente/SP. Somos uma empresa privada de assessoria em documentação veicular. <strong>Não somos órgão público e não representamos o DETRAN.</strong></p>

    <h2>Quais dados coletamos</h2>
    <p>Coletamos apenas os dados que você nos envia voluntariamente pelos formulários e canais de atendimento:</p>
    <ul>
      <li>Nome e telefone/WhatsApp;</li>
      <li>Dados do veículo, como placa e Renavam;</li>
      <li>Informações que você compartilhar sobre o seu caso durante o atendimento.</li>
    </ul>
    <p>Também utilizamos ferramentas de análise de navegação para entender como o site é usado.</p>

    <h2>Para que usamos</h2>
    <ul>
      <li>Responder ao seu contato e prestar o atendimento solicitado;</li>
      <li>Elaborar orçamentos e conduzir os serviços contratados;</li>
      <li>Cumprir obrigações legais e regulatórias.</li>
    </ul>
    <p>Não vendemos os seus dados.</p>

    <h2>Dados sensíveis</h2>
    <p>Alguns serviços — como isenção PCD e isenção de Imposto de Renda por doença grave — envolvem informações de saúde. Esses dados são tratados com sigilo, usados exclusivamente para a análise do seu caso e o protocolo junto aos órgãos competentes.</p>

    <h2>Seus direitos (LGPD)</h2>
    <p>Você pode, a qualquer momento, solicitar acesso, correção ou exclusão dos seus dados, além de revogar consentimentos. Basta escrever para <a href="mailto:desp.100milhas@hotmail.com" style="color:var(--roxo);font-weight:700">desp.100milhas@hotmail.com</a>.</p>

    <h2>Cookies</h2>
    <p>Utilizamos cookies para melhorar a sua experiência de navegação e medir o desempenho do site. Você pode desativá-los nas configurações do seu navegador.</p>

    <h2>Contato</h2>
    <p>Dúvidas sobre esta política? Fale conosco pelo WhatsApp <a href="{zap('Olá, tenho uma dúvida sobre a Política de Privacidade.')}" target="_blank" rel="noopener" style="color:var(--roxo);font-weight:700">(13) 97814-4035</a> ou pelo e-mail desp.100milhas@hotmail.com.</p>
  </div>
</section>
"""


quem = f"""
<section class="hero">
  <div class="wrap" style="max-width:52rem">
    <span class="placa claro">Quem somos</span>
    <h1 style="margin:20px 0 16px">Alguém olha o seu caso. E te diz <em>a verdade</em>.</h1>
    <p class="sub">A 100 Milhas nasceu para fazer o que quase ninguém faz nesse mercado: analisar cada caso antes de prometer qualquer coisa.</p>
  </div>
</section>

<section>
  <div class="wrap lili">
    <div class="lili-foto">
      <img src="/assets/lili-retrato.webp" width="900" height="1125"
           alt="Liliane Pereira Rosa, Despachante Documentalista, fundadora da Despachante 100 Milhas">
    </div>
    <div>
      <span class="placa">A fundadora</span>
      <h2 style="font-size:2rem;color:var(--roxo-fundo);margin:16px 0 14px">Liliane Pereira Rosa</h2>
      <p style="color:var(--texto-suave);margin-bottom:12px">Todo mundo me chama de Lili. Fundei a Despachante 100 Milhas e, desde então, acompanho pessoalmente os processos que chegam até aqui.</p>
      <p style="color:var(--texto-suave);margin-bottom:12px">A maior parte das pessoas que me procura chega assustada. Já ouviu que não tem direito. Já foi mal atendida. Já quase desistiu. O meu trabalho começa aí: <strong style="color:var(--texto)">olhar o caso de verdade</strong> e dizer o que a lei permite — sem promessa e sem enrolação.</p>
      <p style="color:var(--texto-suave)">Se você tem caminho, eu digo. Se não tem, eu digo também, e explico por quê. É por isso que as pessoas voltam e indicam.</p>
      <div class="credencial">&#9878;&nbsp;<strong>Despachante Documentalista</strong> — atuação junto aos órgãos de trânsito, com empresa registrada sob o CNPJ 12.109.034/0001-06</div>
      <div class="assinatura">— Lili</div>
    </div>
  </div>
</section>


<section class="sec-clara">
  <div class="wrap lili" style="direction:rtl">
    <div class="lili-foto" style="direction:ltr">
      <img src="/assets/lili-historia.webp" width="900" height="1125" loading="lazy"
           alt="Lili, fundadora da Despachante 100 Milhas, no escritório em São Vicente">
    </div>
    <div style="direction:ltr">
      <span class="placa">Desde 2011</span>
      <h2 style="font-size:1.9rem;color:var(--roxo-fundo);margin:16px 0 14px">Quinze anos ouvindo a mesma frase</h2>
      <p style="color:var(--texto-suave);margin-bottom:12px">&ldquo;Me disseram que eu não tenho direito.&rdquo;</p>
      <p style="color:var(--texto-suave);margin-bottom:12px">Ouço isso desde 2011. E, muitas vezes, quem disse isso estava errado — ou nem chegou a olhar o caso direito.</p>
      <p style="color:var(--texto-suave)">A 100 Milhas existe para dar a segunda opinião que a pessoa merecia ter recebido na primeira. Não é promessa de aprovação. É o compromisso de <strong style="color:var(--texto)">olhar de verdade</strong>.</p>
    </div>
  </div>
</section>

<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">A equipe</span><h2>Você não fala com um robô</h2>
    <p>Quem atende, analisa e acompanha o seu processo é gente — com nome, rosto e responsabilidade sobre o seu caso.</p></div>
    <div class="grid g3">
      <div class="card card-vidro"><h3>Lili</h3><p>Fundadora e Despachante Documentalista. Analisa os casos e responde pelos processos.</p></div>
      <div class="card card-vidro"><h3>Kamila</h3><p>Financeiro e organização dos processos.</p></div>
      <div class="card card-vidro"><h3>Pedro</h3><p>Comunicação e relacionamento.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">Onde estamos</span><h2>Endereço real, porta aberta</h2>
    <p>Se você quiser olhar no olho, o endereço é este. Atendemos presencialmente em São Vicente.</p></div>
    <div class="grid g2" style="max-width:47rem;margin:0 auto">
      <div class="card"><div class="icone">{ic("mapa")}</div><h3>Onde atendemos</h3><p><strong>São Vicente/SP</strong> (seg–sex): R. Jacob Emmerich, 700 — Centro &middot; CEP 11310-070<br><strong>São Paulo/SP</strong> (sáb): Av. Atlântica, 2905 — Jd. Santa Helena</p></div>
      <div class="card"><div class="icone">{ic("fone")}</div><h3>Fale conosco</h3><p>Telefone: (13) 3466-7438<br>Documentação: {FONE_DOC}<br>PCD e Imposto de Renda: {FONE_PCD}</p><a class="btn btn-roxo" style="margin-top:16px" href="{zap('Olá, quero falar com a equipe da 100 Milhas.')}" target="_blank" rel="noopener">Chamar no WhatsApp</a></div>
    </div>
  </div>
</section>

<section class="sec-clara">
  <div class="wrap"><div class="chamada">
    <h2>Conte o seu caso</h2>
    <p>Sem compromisso e sem promessa. Só uma análise honesta do que a lei permite para você.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero contar meu caso para a 100 Milhas.')}" target="_blank" rel="noopener">Falar com a Lili e a equipe</a>
  </div></div>
</section>
"""


mudanca2027 = f"""
<section class="hero">
  <div class="wrap" style="max-width:54rem">
    <span class="placa claro">Prazo legal</span>
    <h1 style="margin:20px 0 16px">O que muda na isenção PCD <em>em 2027</em>.</h1>
    <p class="sub">As regras que valem hoje têm data para acabar. Entenda o que está garantido, o que muda e por que a data importa para o seu caso.</p>
  </div>
</section>

<section>
  <div class="wrap" style="max-width:52rem">
    <div class="relogio" style="margin-bottom:44px">
      <span class="placa claro">Contagem</span>
      <h2>As regras atuais valem até <em>31 de dezembro de 2026</em>.</h2>
    </div>

    <div class="texto" style="max-width:none">
      <h2>O que está valendo agora (até 31/12/2026)</h2>
      <ul>
        <li><strong>IPI:</strong> isenção para veículos de até R$ 200.000, garantida por lei até 31/12/2026.</li>
        <li><strong>ICMS:</strong> isenção total até R$ 70.000 e proporcional entre R$ 70.000 e R$ 120.000. O convênio venceria em 30/04/2026 e foi <strong>prorrogado pelo CONFAZ até 31/12/2026</strong>.</li>
        <li><strong>IPVA:</strong> regra estadual. Em São Paulo, segue os limites estaduais vigentes.</li>
      </ul>

      <h2>O que muda a partir de 01/01/2027</h2>
      <p>Com a reforma tributária sancionada, o ICMS e o PIS/Cofins dão lugar ao <strong>IBS e à CBS</strong>. Os direitos das pessoas com deficiência foram <strong>preservados</strong> — isso é o mais importante. Mas a estrutura muda:</p>
      <ul>
        <li><strong>Novo escalonamento:</strong> isenção integral prevista para veículos de até R$ 100.000 e proporcional entre R$ 100.000 e R$ 200.000.</li>
        <li><strong>Prazo de troca mais curto</strong> do que o atual.</li>
        <li><strong>A exigência de adaptação externa foi retirada</strong> — quem não precisa de modificação física no carro continua tendo acesso ao benefício.</li>
      </ul>

      <h2>Então é melhor comprar agora ou esperar?</h2>
      <p>Não existe resposta única — <strong>depende do carro, do seu estado e do seu laudo.</strong> Para alguns perfis, a regra de 2027 pode ser melhor. Para outros, pior. O que não dá é decidir no escuro.</p>
      <p>É exatamente esse tipo de conta que a gente faz com você, olhando o seu caso.</p>

      <h2>E se as regras mudarem de novo?</h2>
      <p>Podem mudar. O convênio de ICMS já foi prorrogado uma vez. Acompanhamos cada movimento do CONFAZ e da Receita — e esta página é atualizada quando algo muda.</p>
    </div>
  </div>
</section>

{faixa_lili(
  "Muita gente vai perder o prazo por não saber que existe prazo. Se você está pensando em carro PCD, essa conta precisa ser feita agora — não em dezembro.",
  "Fazer minha conta", "Olá Lili, quero entender se compensa comprar agora ou esperar 2027.", "pcd")}

<section class="sec-clara">
  <div class="wrap"><div class="chamada">
    <h2>Descubra o que vale mais para o seu caso</h2>
    <p>Você pode ter direito. A gente verifica, faz a conta dos dois cenários e te diz a verdade.</p>
    <a class="btn btn-ouro" href="{zap('Olá Lili, quero saber o que muda para mim em 2027.', 'pcd')}" target="_blank" rel="noopener">Falar com a Lili</a>
  </div></div>
</section>
"""


ipva = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">IPVA</span>
      <h1>IPVA atrasado? <em>Resolva antes que vire bola de neve.</em></h1>
      <p class="sub">Atraso gera acréscimo diário, dívida ativa e impede o licenciamento. Levantamos tudo e mostramos o caminho para regularizar.</p>
    </div>
    {form_captura("Consultar meu IPVA", "Informe o veículo e o seu WhatsApp. Devolvemos o levantamento completo.", "Consultar agora", "ipva")}
  </div>
</section>

<section>
  <div class="wrap" style="max-width:52rem">
    <div class="texto" style="max-width:none">
      <span class="placa">Guia</span>
      <h2>O que acontece se você não pagar o IPVA</h2>
      <p>O atraso funciona como uma bola de neve. Primeiro incide um percentual diário sobre o valor do imposto, até bater um teto. Depois disso, o proprietário pode ser inscrito na <strong>dívida ativa do estado</strong>, com acréscimos ainda maiores.</p>
      <p>E os problemas não param aí: <strong>sem IPVA pago, não há licenciamento.</strong> Sem licenciamento, o motorista flagrado dirigindo o veículo irregular paga multa gravíssima, recebe pontos na CNH e tem o veículo apreendido.</p>

      <h2>Dá para parcelar?</h2>
      <p>Sim. Trabalhamos com parcelamento no cartão de crédito. As condições vigentes são informadas no atendimento, junto com o valor exato do seu caso — sem número inventado.</p>

      <h2>Posso pagar com o cartão de outra pessoa?</h2>
      <p>Pode. O pedido pode ser feito com o cartão de um familiar ou amigo, desde que os dados do titular sejam informados corretamente.</p>
    </div>
  </div>
</section>

<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">O que quase ninguém sabe</span>
    <h2>Existe gente pagando IPVA sem precisar</h2>
    <p>A isenção de IPVA não é só para cadeirantes. Pessoas com deficiência, doenças crônicas, limitações de mobilidade ou TEA podem ter direito — inclusive <strong style="color:var(--dourado)">não condutores</strong>. São mais de 70 condições.</p>
    <p style="margin-top:12px">Se você paga IPVA todo ano sem nunca ter verificado isso, <strong style="color:#fff">vale a pena olhar.</strong></p></div>
    <a class="btn btn-ouro" href="/isencaopcd">Ver se eu tenho direito à isenção</a>
  </div>
</section>

{faixa_lili(
  "Já vi cliente que pagou IPVA por seis anos seguidos tendo direito à isenção o tempo todo. Ninguém tinha olhado. É por isso que eu insisto: deixa eu olhar.",
  "Consultar meu caso", "Olá Lili, quero saber se tenho direito à isenção de IPVA (PCD).", "pcd")}

<section>
  <div class="wrap"><div class="chamada">
    <h2>Regularize seu IPVA hoje</h2>
    <p>Quanto antes, menor o acréscimo. Manda o Renavam que a gente cuida do resto.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero regularizar o IPVA do meu veículo.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div></div>
</section>
"""


cnh = f"""
<section class="hero">
  <div class="wrap" style="max-width:54rem">
    <span class="placa claro">CNH em risco</span>
    <h1 style="margin:20px 0 16px">Recebeu a notificação? <em>Você tem prazo — e ele já começou.</em></h1>
    <p class="sub">Suspensão e cassação da CNH têm prazo de defesa. Cada dia que passa fecha uma porta. Fale agora e a gente verifica o que dá para fazer.</p>
    <div style="margin-top:28px">
      <a class="btn btn-ouro" href="{zap('É URGENTE. Recebi notificação de suspensão/cassação da CNH e preciso de ajuda.')}" target="_blank" rel="noopener">Falar agora — é urgente</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap" style="max-width:52rem">
    <div class="texto" style="max-width:none">
      <span class="placa">Entenda</span>
      <h2>Qual é a diferença entre suspensão e cassação?</h2>
      <p><strong>Suspensão:</strong> você fica um período sem poder dirigir. Depois do prazo e do curso de reciclagem, recupera a CNH.</p>
      <p><strong>Cassação:</strong> é mais grave. A CNH é anulada. Para voltar a dirigir, é preciso fazer todo o processo de habilitação de novo, e só depois de cumprido o prazo legal.</p>

      <h2>Quando existe defesa?</h2>
      <p>Existe defesa em mais casos do que a maioria das pessoas imagina — erro na notificação, vício no processo, prazo descumprido pelo órgão, ausência de intimação válida, entre outros.</p>
      <p><strong>Isso não é promessa de resultado.</strong> É a constatação de que muita gente perde a CNH sem sequer tentar, por achar que não há o que fazer.</p>

      <h2>Qual é o prazo?</h2>
      <p>O prazo começa a correr da notificação. <strong>Ele é curto.</strong> Por isso a única recomendação honesta é: não deixe para depois. Mesmo que você ainda não tenha decidido nada, verifique agora quanto tempo resta.</p>

      <h2>E o processo já está andando?</h2>
      <p>Mesmo com o processo em curso, muitas vezes ainda há etapa de defesa disponível. Traga a notificação que a gente lê e te diz em que fase você está.</p>
    </div>
  </div>
</section>

{faixa_lili(
  "Em CNH, o inimigo é o relógio. Já atendi gente que perdeu o direito de dirigir porque deixou a carta em cima da mesa. Se você recebeu algo, me manda hoje.",
  "Mandar minha notificação", "Olá Lili, recebi uma notificação sobre minha CNH e quero que você olhe.")}

<section class="sec-clara">
  <div class="wrap"><div class="chamada">
    <h2>Não perca o seu direito de dirigir</h2>
    <p>Para muita gente, a CNH é o emprego. Quanto antes o caso é olhado, mais caminho existe.</p>
    <a class="btn btn-ouro" href="{zap('Olá, preciso de ajuda com suspensão ou cassação da minha CNH.')}" target="_blank" rel="noopener">Falar com a Lili agora</a>
  </div></div>
</section>
"""


licenciamento = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="placa claro">Documento do veículo</span>
      <h1>Licenciamento e <em>CRLV</em>. O documento que o seu carro precisa ter.</h1>
      <p class="sub">É o serviço que mais fazemos. Sem o licenciamento em dia, o veículo não pode circular — e o risco é multa gravíssima, pontos na CNH e apreensão.</p>
      <div class="selos">
        <span class="selo">&#10004; CRLV digital</span>
        <span class="selo">&#10004; Débitos quitados</span>
        <span class="selo">&#10004; Parcelamento no cartão</span>
      </div>
    </div>
    <div class="crlv">
      <div class="crlv-topo">
        <div class="sigla">CRLV-e</div>
        <div class="ano">Exercício 2026</div>
      </div>
      <div class="crlv-corpo">
        <div class="crlv-linha"><span>Situação do veículo</span><b>Licenciado</b></div>
        <div class="crlv-linha"><span>IPVA</span><b>Quitado</b></div>
        <div class="crlv-linha"><span>Multas</span><b>Sem pendência</b></div>
        <div class="crlv-linha"><span>Licenciamento</span><b>Em dia</b></div>
        <div class="crlv-selo">É assim que o seu documento deve estar. A gente coloca ele nesse estado.</div>
        <a class="btn btn-roxo btn-bloco" style="margin-top:16px" href="{zap('Olá, quero licenciar meu veículo e receber o CRLV.')}" target="_blank" rel="noopener">Licenciar meu veículo</a>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap" style="max-width:52rem">
    <div class="texto" style="max-width:none">
      <span class="placa">Entenda</span>
      <h2>O que é o CRLV</h2>
      <p>O <strong>CRLV (Certificado de Registro e Licenciamento de Veículo)</strong> é o documento que comprova que o seu veículo está apto a circular nas vias públicas. Hoje ele é digital — o <strong>CRLV-e</strong> — e você recebe em PDF, pronto para guardar no celular ou imprimir.</p>

      <h2>O que acontece se estiver vencido</h2>
      <p>Circular com o licenciamento vencido é <strong>infração gravíssima</strong>. Além da multa, o veículo pode ser recolhido ao pátio do DETRAN e só sai de lá depois de regularizado — com custo de guincho e diária somados à conta.</p>
      <p>É o tipo de problema que custa dez vezes mais depois do que antes.</p>

      <h2>Como funciona o licenciamento</h2>
      <p>Para licenciar, <strong>todos os débitos do veículo precisam estar quitados</strong>: IPVA, multas e a taxa de licenciamento. Não dá para licenciar deixando pendência para trás — o sistema não emite.</p>
      <p>É aí que a gente entra: levantamos tudo o que está em aberto, apresentamos o valor exato, cuidamos da quitação e emitimos o CRLV-e.</p>

      <h2>Dá para parcelar?</h2>
      <p>Sim. Trabalhamos com parcelamento no cartão de crédito, inclusive de terceiros. As condições vigentes são informadas no atendimento — nunca um número inventado.</p>

      <h2>Quanto tempo demora?</h2>
      <p>Depois da aprovação, cuidamos da quitação dos débitos e você é avisado assim que o veículo estiver regular. O CRLV-e fica disponível para download.</p>
    </div>
  </div>
</section>

<section class="sec-escura">
  <div class="wrap">
    <div class="cabeca"><span class="placa claro">Enquanto estamos aqui</span>
    <h2>Você licencia todo ano. E se não precisasse pagar o IPVA?</h2>
    <p>Pessoas com deficiência, doenças crônicas, limitações de mobilidade ou TEA podem ter direito à <strong style="color:var(--dourado)">isenção de IPVA</strong> — inclusive quem não dirige. São mais de 70 condições, e a maioria das pessoas nunca verificou.</p></div>
    <a class="btn btn-ouro" href="/isencaopcd">Ver se eu tenho direito</a>
  </div>
</section>

{faixa_lili(
  "Licenciamento é o que eu mais faço, e é onde eu mais descubro coisa. Muita gente chega aqui só para pegar o documento e sai sabendo que tinha direito a isenção há anos.",
  "Licenciar meu veículo", "Olá Lili, quero licenciar meu veículo.")}

<section>
  <div class="wrap"><div class="chamada">
    <h2>Coloque o documento do seu carro em dia</h2>
    <p>Manda o Renavam. A gente levanta os débitos, apresenta o valor e emite o CRLV-e.</p>
    <a class="btn btn-ouro" href="{zap('Olá, quero licenciar meu veículo e receber o CRLV.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>
  </div></div>
</section>
"""


central = f"""
<section class="hero">
  <div class="wrap" style="max-width:50rem;text-align:center">
    <span class="placa claro">Central da Lili</span>
    <h1 style="margin:20px 0 16px">Não sabe se tem direito? <em>Vamos descobrir juntas.</em></h1>
    <p class="sub" style="margin:0 auto">Cinco perguntas simples. No final, você sabe qual é o seu caminho — e a nossa equipe já chega sabendo do seu caso.</p>
  </div>
</section>

<section style="padding-top:44px">
  <div class="wrap">
    <div class="central" id="central">
      <div class="central-topo">
        <img src="/assets/lili-ia.webp" width="56" height="56" alt="Lili, anfitriã da Central da 100 Milhas">
        <div>
          <b>Central da Lili</b>
          <span>Respondo com você, passo a passo. Sem compromisso.</span>
        </div>
      </div>
      <div class="central-corpo">
        <p style="color:var(--texto-suave)">Carregando as perguntas…</p>
        <noscript>
          <p style="color:var(--texto)"><strong>Seu navegador está sem JavaScript</strong>, então as perguntas não carregam — mas você não fica sem atendimento. Fale direto com a gente:</p>
          <p style="margin-top:12px"><a class="btn btn-roxo btn-bloco" href="{zap('Olá! Preciso de ajuda com a documentação do meu veículo.')}">Documentação — (13) 97814-4035</a></p>
          <p style="margin-top:8px"><a class="btn btn-ouro btn-bloco" href="{zap('Olá! Quero atendimento PCD (isenções, laudos, IR).', 'pcd')}">PCD e Imposto de Renda — (13) 97809-1064</a></p>
        </noscript>
      </div>
    </div>

    <p style="text-align:center;color:var(--texto-suave);font-size:.9rem;margin-top:24px;max-width:38rem;margin-left:auto;margin-right:auto">
      A Central faz uma leitura preliminar do seu caso. <strong>Ela não aprova nem reprova nada</strong> — quem analisa de verdade é a nossa equipe, com a sua documentação.
    </p>
  </div>
</section>

<section class="sec-clara" style="padding-top:56px;padding-bottom:56px">
  <div class="wrap">
    <div class="cabeca centro"><span class="placa">Por que existe</span><h2>Você não deveria precisar explicar tudo três vezes</h2></div>
    <div class="grid g3">
      <div class="card"><div class="icone">{ic("lupa")}</div><h3>Entende antes de responder</h3><p>Em vez de você adivinhar o que perguntar, a gente pergunta o que importa — na ordem certa.</p></div>
      <div class="card"><div class="icone">{ic("escudo")}</div><h3>Sem promessa</h3><p>A Central diz se existe caminho. Nunca diz que está aprovado — quem aprova é o órgão.</p></div>
      <div class="card"><div class="icone">{ic("raio")}</div><h3>Atendimento mais rápido</h3><p>Você chega no WhatsApp com o caso resumido. A equipe já começa de onde importa.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap lili">
    <div class="lili-foto">
      <img src="/assets/lili-retrato.webp" width="900" height="1125" loading="lazy" alt="Liliane Pereira Rosa, fundadora da Despachante 100 Milhas">
    </div>
    <div>
      <span class="placa">Depois da Central</span>
      <h2 style="font-size:1.9rem;color:var(--roxo-fundo);margin:16px 0 14px">Quem olha o seu caso é uma pessoa</h2>
      <p style="color:var(--texto-suave);margin-bottom:12px">A Central organiza o que você contou e economiza o seu tempo. Mas ela não decide nada.</p>
      <p style="color:var(--texto-suave);margin-bottom:12px">Quem lê o seu laudo, quem confere o seu documento e quem te diz a verdade sobre o seu direito <strong style="color:var(--texto)">sou eu, com a minha equipe</strong>.</p>
      <p style="color:var(--texto-suave)">Você chega no WhatsApp e a gente já sabe do que se trata. Aí a conversa começa do meio, não do zero.</p>
      <div class="assinatura">— Lili, Despachante 100 Milhas</div>
    </div>
  </div>
</section>
"""

# ==================== ESCREVER ====================
print("Gerando páginas:")
pagina("index.html","Despachante 100 Milhas — Regularização veicular, isenção PCD e recursos de multa","Assessoria em documentação veicular em São Vicente/SP. Isenção PCD (IPI, ICMS, IPVA), isenção de Imposto de Renda, recursos de multa e transferência. Desde 2011, com 4,9 no Google.","/",home,extra=f'<script src="/assets/agenda.js{V}" defer></script>')
pagina("transferencia/index.html","Transferência de Veículo Online | Despachante 100 Milhas","Orçamento de transferência veicular online. Documentos, prazos, valores e gravame explicados. Envie o veículo e receba o orçamento completo pelo WhatsApp.","/transferencia",trans,pilar="doc")
pagina("debitos/index.html","Consultar Débitos do Veículo — IPVA, Multas e Licenciamento | 100 Milhas","Consulte IPVA, multas e licenciamento do seu veículo e parcele no cartão. Levantamento completo dos débitos e regularização com quem entende.","/debitos",deb,pilar="doc")
pagina("isencaopcd/index.html","Isenção PCD: IPI, ICMS e IPVA para Carro 0km | Despachante 100 Milhas","Mais de 70 condições podem dar direito à isenção PCD — e não é só para cadeirantes. Vale para condutor e não condutor. Fazemos a análise do seu caso, sem compromisso.","/isencaopcd",pcd,pilar="pcd",canal="pcd")
pagina("impostoderenda/index.html","Isenção de Imposto de Renda para Aposentados com Doença Grave | 100 Milhas","Lei 7.713/88: aposentados e pensionistas com doenças graves podem ter direito à isenção do IR e à recuperação dos valores pagos nos últimos 5 anos.","/impostoderenda",ir,pilar="ir",canal="pcd")
pagina("recursos/index.html","Recurso de Multa, Suspensão e Cassação da CNH | Despachante 100 Milhas","Defesa especializada em direito de trânsito: recurso de multa, bafômetro, suspensão e cassação da CNH. Não perca o seu direito de dirigir.","/recursos",rec,pilar="cnh")
pagina("quem-somos/index.html","Quem Somos — Liliane Pereira Rosa | Despachante 100 Milhas","Conheça a Lili, fundadora da Despachante 100 Milhas e Despachante Documentalista. Atuação desde 2011 na Baixada Santista, com escritório em São Vicente/SP.","/quem-somos",quem)
pagina("isencaopcd/2027/index.html","Isenção PCD em 2027: o que muda com a reforma tributária | 100 Milhas","As regras atuais de isenção PCD (IPI e ICMS) valem até 31/12/2026. Entenda o novo escalonamento, o prazo de troca e se compensa comprar agora ou esperar.","/isencaopcd/2027",mudanca2027,pilar="pcd",canal="pcd")
pagina("ipva/index.html","IPVA Atrasado: como regularizar e quem tem isenção | Despachante 100 Milhas","IPVA em atraso gera acréscimo diário, dívida ativa e impede o licenciamento. Consulte, parcele e descubra se você tem direito à isenção.","/ipva",ipva,pilar="doc")
pagina("cnh-suspensa/index.html","CNH Suspensa ou Cassada: existe defesa e existe prazo | 100 Milhas","Recebeu notificação de suspensão ou cassação da CNH? O prazo de defesa é curto. Entenda a diferença, quando cabe recurso e o que fazer agora.","/cnh-suspensa",cnh,pilar="cnh")
pagina("licenciamento/index.html","Licenciamento e CRLV: documento do veículo em dia | Despachante 100 Milhas","Licenciamento anual e emissão do CRLV-e. Levantamos os débitos, parcelamos no cartão e colocamos o documento do seu veículo em dia. O serviço que mais fazemos.","/licenciamento",licenciamento,pilar="doc")
pagina("central/index.html","Central da Lili — descubra se você tem direito | Despachante 100 Milhas","Responda cinco perguntas simples e descubra em qual direito o seu caso se encaixa: isenção PCD, Imposto de Renda, CNH ou documentação. Orientação preliminar, sem compromisso.","/central",central)
pagina("privacidade/index.html","Política de Privacidade | Despachante 100 Milhas","Como a Despachante 100 Milhas coleta, usa e protege os seus dados. Seus direitos sob a LGPD.","/privacidade",priv)
print("\nOK.")
