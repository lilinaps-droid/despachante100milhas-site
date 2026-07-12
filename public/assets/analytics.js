/* ============================================================
   100 MILHAS — MEDICAO E CONSENTIMENTO (LGPD)
   ------------------------------------------------------------
   COMO LIGAR (unico lugar que voce mexe):
     1. Crie o Pixel no Gerenciador de Eventos da Meta -> cole o ID abaixo.
     2. Crie a propriedade no Google Analytics 4 -> cole o ID (G-XXXXXXX).
   Enquanto os campos estiverem vazios, NADA e carregado (sem codigo morto,
   sem cookie, sem risco de LGPD). O rastreio so liga apos o "Aceitar".
   ============================================================ */
window.M100_CONFIG = {
  GA4_ID: '',          // ex: 'G-ABC123XYZ'
  META_PIXEL_ID: ''    // ex: '1234567890123456'
};

(function () {
  'use strict';

  var CFG = window.M100_CONFIG;
  var CHAVE = 'm100_consentimento';

  /* Identificador da pagina — vai junto no evento e na mensagem do WhatsApp */
  function slugDaPagina() {
    var p = location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
    return p === '' ? 'home' : p.replace(/^\//, '').replace(/\//g, '-');
  }

  /* ---------- Carregadores (so rodam apos consentimento) ---------- */
  function ligarGA4() {
    if (!CFG.GA4_ID) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CFG.GA4_ID);
  }

  function ligarPixel() {
    if (!CFG.META_PIXEL_ID) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CFG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function ligarTudo() {
    ligarGA4();
    ligarPixel();
  }

  /* ---------- Evento de clique no WhatsApp (a metrica que importa) ---------- */
  function rastrearWhatsApp() {
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href*="api.whatsapp.com"], a[href*="wa.me"]');
      if (!a) return;
      var origem = slugDaPagina();
      if (window.gtag) {
        window.gtag('event', 'clique_whatsapp', {
          pagina_origem: origem,
          botao: (a.textContent || '').trim().slice(0, 60) || 'flutuante'
        });
      }
      if (window.fbq) {
        window.fbq('track', 'Contact', { content_name: origem });
      }
    }, true);
  }

  /* ---------- Banner de consentimento (LGPD) ---------- */
  function banner() {
    if (localStorage.getItem(CHAVE) === 'aceito') { ligarTudo(); return; }
    if (localStorage.getItem(CHAVE) === 'recusado') { return; }

    var css = document.createElement('style');
    css.textContent =
      '.m100-lgpd{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#1a0b2e;' +
      'color:#fff;border:1px solid #D4AF37;border-radius:14px;padding:16px 18px;display:flex;' +
      'gap:14px;align-items:center;flex-wrap:wrap;justify-content:space-between;' +
      'box-shadow:0 10px 40px rgba(0,0,0,.35);font-family:"DM Sans",system-ui,sans-serif;' +
      'font-size:14px;line-height:1.5;max-width:900px;margin:0 auto}' +
      '.m100-lgpd p{margin:0;flex:1 1 320px}' +
      '.m100-lgpd a{color:#D4AF37;text-decoration:underline}' +
      '.m100-lgpd-btns{display:flex;gap:8px;flex:0 0 auto}' +
      '.m100-lgpd button{cursor:pointer;border-radius:999px;padding:10px 20px;font-weight:700;' +
      'font-size:14px;border:1px solid transparent;font-family:inherit}' +
      '.m100-ok{background:#D4AF37;color:#1a0b2e}' +
      '.m100-nao{background:transparent;color:#fff;border-color:rgba(255,255,255,.35)}' +
      '@media(max-width:600px){.m100-lgpd{bottom:88px}.m100-lgpd-btns{width:100%}' +
      '.m100-lgpd button{flex:1}}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.className = 'm100-lgpd';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Aviso de privacidade');
    box.innerHTML =
      '<p>Usamos cookies para entender como você usa o site e melhorar seu atendimento. ' +
      'Você decide. <a href="/privacidade">Política de Privacidade</a></p>' +
      '<div class="m100-lgpd-btns">' +
      '<button class="m100-nao" type="button">Recusar</button>' +
      '<button class="m100-ok" type="button">Aceitar</button>' +
      '</div>';
    document.body.appendChild(box);
    document.body.classList.add('com-lgpd');

    box.querySelector('.m100-ok').addEventListener('click', function () {
      localStorage.setItem(CHAVE, 'aceito');
      box.remove();
      document.body.classList.remove('com-lgpd');
      ligarTudo();
    });
    box.querySelector('.m100-nao').addEventListener('click', function () {
      localStorage.setItem(CHAVE, 'recusado');
      box.remove();
      document.body.classList.remove('com-lgpd');
    });
  }

  /* ---------- Boot ---------- */
  rastrearWhatsApp();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', banner);
  } else {
    banner();
  }
})();
