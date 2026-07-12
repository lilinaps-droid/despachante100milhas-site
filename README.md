# Site Oficial — Despachante 100 Milhas

Site institucional de **www.despachante100milhas.com.br**
Estático puro: HTML + CSS + JS. Sem servidor, sem banco, sem framework.

## Deploy

Automático. **Todo push na branch `main` publica o site.**
(Cloudflare Workers Builds → Worker `odd-hall-da24`)

⚠️ **Nunca mude o campo `name` no `wrangler.jsonc`.** Ele precisa bater
exatamente com o nome do Worker na Cloudflare, senão o build falha.

## Como editar

Tudo é gerado por um único script:

```bash
python3 gerar.py
```

Ele reescreve os 13 `index.html` dentro de `public/`.
**Nunca edite os `index.html` à mão** — são sobrescritos.

| O que mudar | Onde |
|---|---|
| Textos, páginas, menu, rodapé | `gerar.py` |
| Cores, espaçamentos, layout | `public/assets/estilo.css` (tokens no `:root`) |
| Formulário placa/RENAVAM | `public/assets/script.js` |
| Central da Lili | `public/assets/central.js` |
| Google Analytics / Pixel Meta | `public/assets/analytics.js` → `M100_CONFIG` |

## Identidade

- **Roxo `#6A0DAD` + dourado `#D4AF37`** — a marca
- **Vermelho `#C8102E`** — código da profissão, só no pilar de documento veicular
- Montserrat (títulos) + DM Sans (texto) · escala de espaçamento base 4pt

## Regras que não se quebram

1. **Nunca prometer aprovação.** Sempre "pode ter direito".
2. **Disclaimer do DETRAN** no rodapé de todas as páginas.
3. **Nenhum dado sensível na URL do WhatsApp** — sem CPF, sem diagnóstico detalhado.
4. **Zero rastreio antes do consentimento LGPD.**
5. **Não publicar número que não pode ser comprovado.**

## Páginas (13)

`/` · `/central` · `/licenciamento` · `/ipva` · `/debitos` · `/transferencia`
`/isencaopcd` · `/isencaopcd/2027` · `/impostoderenda` · `/cnh-suspensa`
`/recursos` · `/quem-somos` · `/privacidade`

## Rollback

Cloudflare → Worker `odd-hall-da24` → **Implantações** → escolher versão anterior.
Ou: **Settings → Builds → Disconnect** — volta ao upload manual, site nunca sai do ar.

## Contato

WhatsApp (13) 97814-4035 · R. Jacob Emmerich, 700 — São Vicente/SP
CNPJ 12.109.034/0001-06
