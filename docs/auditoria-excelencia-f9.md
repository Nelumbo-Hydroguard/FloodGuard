# Auditoria de Excelência F9 — FloodGuard

> Revisão final antes de banca/entrega. Varredura de backend, frontend,
> documentação e demo, com correções controladas. Nenhuma mudança de escopo,
> nenhuma feature nova, nenhuma refatoração ampla — só bug, inconsistência e
> clareza. Tudo que não pôde ser corrigido com segurança está registrado
> como pendência, não escondido.

## 1. Resumo executivo

A auditoria encontrou **9 achados**, sendo **2 de severidade P1** que
afetariam diretamente a apresentação. O mais grave é um bug real de backend:
`GET /api/geo/demo-map` respondia **HTTP 500** quando o PostGIS estava
conectado mas a tabela `hand_zones` estava vazia — exatamente o estado de
quem segue o `docker compose up` do README sem rodar o importador. Como o
frontend usa esse endpoint para decidir a fonte do mapa, o resultado seria
`/mapa` inteiramente quebrado (tela de erro, sem mapa e sem fallback) numa
das rotas de setup mais prováveis da banca. O bug passava despercebido
porque, neste ambiente, o PostGIS nem responde — os testes existentes só
exercitavam o outro ramo.

O segundo P1 é de UI: em `/telemetria`, o seletor "Classe HAND" era
silenciosamente ignorado enquanto o campo "Peso HAND" estivesse preenchido
(o backend prioriza o peso). A tela exibia "peso 0.1" e o motor calculava
com 0.9 — contradição visível em cima do palco. Pior: escolher "sem contexto
HAND (fallback)" **não** ativava o fallback, impossibilitando demonstrar
justamente o comportamento de degradação de confiança que o projeto usa como
argumento de honestidade técnica.

Ambos foram corrigidos, com 3 testes de regressão novos (62 → **65 testes**,
todos passando). Frontend segue buildando limpo. Nenhuma limitação real foi
removida da documentação — o PostGIS continua descrito como preparado, não
obrigatório, e não validado ponta a ponta.

## 2. Estado inicial

| Item | Valor |
|---|---|
| Branch de trabalho | `audit/f9-quality-excellence-pass` |
| Commit base | `b21932e` (`docs: add final presentation materials (#4)`) |
| Testes backend (antes) | 62/62 passando |
| Build frontend (antes) | limpo — 432,49 kB JS / 130,90 kB gzip |
| Arquivos > 50 MB versionáveis | nenhum (o único é `libgdal` dentro de `.venv`, ignorado pelo git) |

## 3. Escopo auditado

- **Frontend** — `apps/web/src`: `router.tsx`, `main.tsx`, `Layout`, `lib/api.ts`, `lib/riskTheme.ts`, 10 componentes e 9 páginas.
- **Backend** — `services/api/app`: `main.py`, `config.py`, `database.py`, 7 routers, 6 schemas, 6 módulos de engine.
- **Testes** — 7 arquivos em `services/api/tests`.
- **Documentação** — README + 17 arquivos em `docs/`.
- **Dados/scripts** — `data/hand/`, `services/geo/scripts/`, `db/migrations/`, `scripts/dev/`.
- **Demo** — 12 endpoints de backend e 9 rotas de frontend por HTTP.

Excluídos do escopo, conforme instrução: `.git/`, `.venv/`, `node_modules/`,
`dist/`, `__pycache__/`, `data/raw/`, `*.tif`, `final_poc/`, `mentorias/`.

## 4. Achados por severidade

| ID | Sev. | Área | Problema | Impacto | Ação | Status |
|---|---|---|---|---|---|---|
| F9-01 | **P1** | Backend / geo | `demo-map` levantava `RuntimeError` (não capturado pelo `except SQLAlchemyError`) quando o banco respondia mas `hand_zones` estava vazia | HTTP 500 → `/mapa` inteiro cai em tela de erro, sem fallback, no cenário `docker compose up` sem importador | Tabela vazia passou a ser tratada como indisponibilidade de dado, caindo no mesmo fallback estático; 3 testes de regressão | Corrigido |
| F9-02 | **P1** | UI / Telemetria | Seletor "Classe HAND" ignorado enquanto "Peso HAND" preenchido (backend prioriza o peso) | Tela mostra um peso e o motor usa outro; "sem contexto HAND" não ativa o fallback — impede demonstrar a degradação de confiança | Seletor passou a sincronizar o campo de peso (e limpá-lo em "sem contexto HAND"); peso segue editável para override | Corrigido |
| F9-03 | P2 | UI / Painel | Título do card vinha da *chave* do cenário, não do `risk_level` real | Mesma contradição título×badge que a F6.2 corrigiu em `Alertas.tsx`; latente até alguém ajustar um cenário | Título derivado de `RISK_THEME[risk_level]`, fonte única de rótulos | Corrigido |
| F9-04 | P2 | UI / Layout | Nav de 6 itens sem `flex-wrap` (transborda em tela estreita) e destaque por igualdade exata (perdido em `/alertas/:id`) | Quebra de layout em janela estreita; navegação perde o "você está aqui" no detalhe | `flex-wrap` no header/nav + destaque por prefixo de seção | Corrigido |
| F9-05 | P2 | Docs | `relatorio-geral` citava "27 testes" e "5 telas" em seções lidas como estado atual — inclusive na "Resumo para apresentação", a cola da banca | Número factualmente errado (e subestimado) sendo levado para a apresentação | Números atualizados para o estado da F9, preservando o histórico por fase | Corrigido |
| F9-06 | P3 | Docs | Faixas de risco documentadas como `0.00–0.25 / 0.26–0.50` — lacuna entre 0.25 e 0.26; código usa intervalos semiabertos | Divergência doc×código no valor exato de fronteira | Notação corrigida para `0.00 ≤ score < 0.25` etc., com nota explicando o comportamento | Corrigido |
| F9-07 | P3 | Backend / geo | `_raise_postgis_unavailable` sempre levanta, mas anotada `-> None`; callers usam variáveis atribuídas dentro do `try` | Funciona hoje; uma alteração futura que fizesse a função retornar viraria `UnboundLocalError` silencioso | Anotada `NoReturn`, com o motivo no docstring | Corrigido |
| F9-08 | P3 | UI / Painel | Hint "entre os 3 cenários" fixo no texto | Ficaria errado se a quantidade de cenários mudasse | Passou a usar `results.length` | Corrigido |
| F9-09 | P3 | Docs | `docs/arvore-arquivos-floodguard.md` (F5.0, superseda pela versão "-detalhada") ainda cita 27 testes e status "placeholder" | Baixo — o próprio arquivo tem nota de que é registro histórico e aponta o sucessor | **Não corrigido de propósito** — é registro histórico datado; reescrever apagaria o rastro da evolução | Pendência aceita |

## 5. Correções aplicadas

| Arquivo | Mudança |
|---|---|
| `services/api/app/routers/geo.py` | F9-01: `demo-map` reestruturado — falha de banco e tabela vazia caem no mesmo helper `_static_fallback_map()`, sem caminho possível para 500; F9-07: `_raise_postgis_unavailable` anotada `NoReturn` |
| `services/api/tests/test_geo_demo.py` | 3 testes novos: fallback com tabela vazia, ausência de credencial na mensagem desse caminho, e caminho `postgis` com linhas reais (percentuais calculados sobre o total real) |
| `apps/web/src/pages/Telemetria.tsx` | F9-02: `handleHandClassChange` sincroniza o peso com a classe escolhida; label do campo de peso reescrito |
| `apps/web/src/pages/Dashboard.tsx` | F9-03: `scenarioTitle(risk_level)` no lugar do mapa por chave; F9-08: hint dinâmico |
| `apps/web/src/components/Layout.tsx` | F9-04: `flex-wrap` no header e na nav; destaque de rota por prefixo |
| `docs/motor-de-risco.md` | F9-06: tabela de classificação com notação de intervalo + nota sobre o valor de fronteira |
| `docs/plano-desenvolvimento-senai-floodguard.md` | F9-06 (mesma correção de faixas); contagem de testes 62 → 65 |
| `docs/relatorio-geral-floodguard.md` | F9-05: números de teste e de telas atualizados nas seções de estado atual |
| `README.md`, `docs/resumo-executivo-floodguard.md`, `docs/checklist-apresentacao-floodguard.md` | Contagem de testes 62 → 65 |
| `docs/auditoria-excelencia-f9.md` | Este relatório |

## 6. UI/UX

**Pontos fortes.** Identidade visual consistente e centralizada
(`riskTheme.ts` como fonte única de cor/rótulo de risco — nenhuma tela
redefine cor por conta própria). Estados de interface bem cobertos:
`EmptyState`, `ErrorState`, `DemoNotice` aparecem de forma sistemática, e o
mapa distingue corretamente "API fora do ar" de "PostGIS sem dado". A
transparência sobre simulação é forte e repetida em todos os níveis — badge
fixo no header, aviso por página, selo por card, `implemented: false`
destacado no payload. A explicação da bacia contribuinte na própria tela do
mapa antecipa uma pergunta previsível da banca em vez de esperar por ela.

**Problemas encontrados.** F9-02 (seletor HAND sem efeito — o mais grave,
porque quebra uma interação que o apresentador provavelmente vai fazer),
F9-03 (contradição latente título×badge), F9-04 (nav sem wrap e destaque
perdido no detalhe), F9-08 (texto fixo).

**Melhorias aplicadas.** Todas as quatro acima.

**Pendências.** Não há suíte de testes de frontend (Vitest/Testing Library)
— `npm run build` valida tipo e bundle, não comportamento. Criar essa suíte
é maior que o escopo desta rodada e está registrado como próximo passo. A
responsividade foi melhorada no ponto de quebra mais provável (a nav), mas
não houve verificação visual em breakpoints reais.

## 7. Backend/API

**Pontos fortes.** Separação limpa entre regra pura (`risk_rules.py`),
orquestração (`risk_engine.py`) e transporte (routers). O motor não depende
de banco, o que é a razão de a demo sobreviver sem PostGIS. Tratamento de
erro já era cuidadoso antes desta auditoria: 503 controlado em vez de 500
cru, e nenhuma mensagem de driver repassada ao cliente (o log registra só o
tipo da exceção, não a string que carrega host/usuário). `geo/status` é
honesto — consulta o banco de verdade em vez de afirmar "connected" fixo.

**Problemas encontrados.** F9-01 (500 em tabela vazia — o único bug
funcional real da auditoria) e F9-07 (anotação de tipo frágil).

**Melhorias aplicadas.** Ambas, com testes de regressão para o caminho que
não era exercitado.

**Pendências.** Nenhuma persistência real (alertas e abrigos são
recalculados ou fixos em memória); sem autenticação; caminho
`source: "postgis"` nunca exercitado de ponta a ponta neste ambiente. Todos
já registrados em `docs/limitacoes.md` e `docs/roadmap.md` — nenhum é
regressão desta fase.

## 8. Documentação

**Pontos fortes.** Volume e profundidade acima do usual para uma PoC
acadêmica, com separação explícita entre "comprovado por arquivo",
"inferido" e "pendente de validação" (`hand-processamento-detalhado.md` é o
melhor exemplo). Os documentos históricos trazem nota de atualização no topo
em vez de serem reescritos, o que preserva o rastro da evolução.

**Problemas encontrados.** F9-05 (números de teste/telas desatualizados em
seções lidas como estado atual — com agravante de estarem na cola de
apresentação) e F9-06 (faixas de risco divergindo do código na fronteira).

**Melhorias aplicadas.** Ambas, mais o alinhamento da contagem de testes
(62 → 65) em todos os documentos que a citam.

**Pendências.** F9-09: `arvore-arquivos-floodguard.md` (F5.0) mantém números
antigos — decisão consciente, é registro datado e já aponta o sucessor.

## 9. Demo

**Endpoints validados** (backend em `:8000`): `/docs`, `/health`,
`/api/risk/status`, `/api/scenarios/demo`, `/api/geo/status`,
`/api/geo/demo-map`, `/api/geo/demo-points`, `/api/alerts/status`,
`/api/alerts/demo`, `/api/alerts/demo/critico`, `/api/shelters/status`,
`/api/shelters/demo`.

**Rotas validadas** (frontend em `:5173`): `/`, `/sobre`, `/painel`,
`/mapa`, `/telemetria`, `/alertas`, `/alertas/critico`, `/abrigos`,
`/rota-inexistente`.

**Resultado.** Todos respondendo. `geo/status` reporta honestamente
`unavailable`/`static_fallback` neste ambiente, e `demo-map` serve o
fallback com as 4 classes HAND de referência.

**Limitações da validação.** Sem browser real disponível nesta sessão — a
verificação foi por HTTP, build e leitura de código, não por captura visual
ou console de JavaScript. Rotas de SPA respondem 200 por natureza (o
roteamento é client-side); o comportamento do 404 amigável foi confirmado
lendo `router.tsx`/`NotFound.tsx`, não visualmente. O caminho
`source: "postgis"` continua sem exercício ponta a ponta com banco real —
agora, porém, com o ramo de tabela vazia coberto por teste.

## 10. Riscos restantes

| Risco | Severidade | Observação |
|---|---|---|
| Sem verificação visual real das telas | Médio | Nenhuma regressão visual seria detectada por `npm run build`; recomendo uma passada manual no navegador antes da banca |
| Caminho PostGIS real nunca exercitado | Médio | Mitigado pelo fallback, que agora cobre também o caso de tabela vazia |
| Ausência de suíte de teste de frontend | Médio | Toda a confiança do frontend vem de compilação e revisão de código |
| Motor de risco não calibrado | Médio | Limitação de projeto assumida, documentada — não é dívida escondida |
| Dependência de tiles externos (OSM) | Baixo | Sem internet, o mapa perde só o fundo; as camadas de dado continuam |

## 11. Recomendação para apresentação

O projeto está **apto para banca**. A correção do F9-01 elimina o pior
cenário de falha ao vivo (o mapa quebrar justamente em quem seguiu o README
à risca), e a do F9-02 destrava uma demonstração que antes falharia em
silêncio — agora dá para mostrar a degradação de confiança sem HAND, que é
um dos argumentos mais fortes do produto do ponto de vista de honestidade
técnica.

Recomendo, antes de apresentar: (1) uma passada manual no navegador pelas 8
telas, já que nenhuma validação visual automatizada existe; (2) usar o
`docs/roteiro-demo-floodguard.md` como está — a ordem de telas e as
respostas às perguntas difíceis continuam válidas; (3) não tentar forçar o
caminho PostGIS ao vivo, e tratar o fallback com naturalidade, como o
roteiro já orienta.

## 12. Próximos passos

1. Passada visual manual nas 8 telas antes da banca (não coberta por automação).
2. Suíte mínima de testes de frontend (Vitest) montando as páginas com a API mockada — cobriria regressão de import quebrado, que hoje só o build pega.
3. Exercitar o caminho `source: "postgis"` uma vez contra banco real, fechando a pendência aberta desde a F2.1.
4. Persistência real de alertas e abrigos (tabelas já existem no schema).
5. Autenticação, antes de qualquer uso fora de demonstração.

## 13. Conclusão

A auditoria confirma um projeto em bom estado técnico: arquitetura coerente,
tratamento de erro cuidadoso, documentação acima da média para uma PoC
acadêmica, e uma disciplina consistente de marcar o que é simulado. Os dois
achados P1 eram problemas reais e específicos — não sintomas de fragilidade
estrutural —, e ambos estavam exatamente no caminho da demonstração: um
quebraria o mapa em um setup plausível, o outro faria a tela contradizer o
motor na frente da banca. Corrigidos e cobertos por teste.

O que permanece pendente é o que já era pendente por decisão de escopo —
persistência, autenticação, calibração, validação end-to-end do PostGIS — e
segue documentado como tal. Nenhuma limitação foi suavizada nesta rodada, e
nenhuma afirmação nova de operação real foi introduzida.
