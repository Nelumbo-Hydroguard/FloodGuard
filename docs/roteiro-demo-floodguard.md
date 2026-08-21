# Roteiro de Demonstração — FloodGuard

## 1. Objetivo da apresentação

Mostrar, ao vivo, a integração ponta a ponta do FloodGuard — dado
geoespacial real (HAND de Blumenau/SC), motor de risco explicável e
interface operacional — deixando claro em cada tela o que é real
(processamento, código, testes) e o que é simulado (telemetria, alertas,
abrigos, comunicação). Não é uma venda de produto pronto: é demonstração de
PoC acadêmica, com limitações assumidas abertamente.

## 2. Tempo recomendado

**10 minutos** de demonstração + margem para perguntas. Sugestão de
distribuição:

| Bloco | Tempo |
|---|---|
| Abertura + `/sobre` | 1 min |
| `/painel` | 1,5 min |
| `/mapa` | 2 min |
| `/telemetria` (teste ao vivo) | 2 min |
| `/alertas` + `/alertas/critico` | 1,5 min |
| `/abrigos` | 1 min |
| `/docs` da API (se sobrar tempo) | 1 min |

Se o tempo apertar, corte `/docs` primeiro, depois reduza `/abrigos` a uma
frase — nunca corte `/telemetria` (é a única interação ao vivo que prova o
motor funcionando com dado digitado na hora).

## 3. Ordem de apresentação das telas

1. `/sobre`
2. `/painel`
3. `/mapa`
4. `/telemetria`
5. `/alertas`
6. `/alertas/critico`
7. `/abrigos`
8. `/docs` da API — se houver tempo

## 4. O que falar em cada tela

### `/sobre`

- **Objetivo da tela:** situar o avaliador antes de mostrar qualquer dado.
- **O que mostrar:** os 3 blocos "Implementado / Simulado / Roadmap".
- **Frase curta:** "FloodGuard é uma PoC acadêmica de apoio à decisão da
  Defesa Civil, com piloto em Blumenau — aqui já deixamos explícito o que é
  real e o que é simulado, antes mesmo de entrar no sistema."
- **Cuidado:** não dizer "o sistema está pronto" — dizer "PoC".

### `/painel`

- **Objetivo da tela:** mostrar o resumo operacional que a Defesa Civil
  veria primeiro.
- **O que mostrar:** os 4 indicadores, o card "próxima ação operacional recomendada",
  os 3 cards de cenário com score/fatores/explicação.
- **Frase curta:** "Estes 3 cenários vêm do motor de risco de verdade — não
  são números fixos na tela, são recalculados a cada chamada à API."
- **Cuidado:** não chamar os cenários de "alertas reais" nesta tela — são
  cenários de demonstração do motor.

### `/mapa`

- **Objetivo da tela:** mostrar o diferencial geoespacial — suscetibilidade
  HAND real de Blumenau, não um número solto.
- **O que mostrar:** as 4 zonas coloridas, o limite municipal (linha
  ciano), os marcadores de alerta simulado e de abrigo, clique num
  polígono e num marcador de alerta para abrir o popup (mostra score,
  confiança, explicação, ação recomendada e link para o detalhe). O
  marcador do alerta crítico pulsa — destaque de gravidade.
- **Frase curta:** "Essas cores vêm de dado geoespacial real, processado
  uma vez a partir de elevação e bacias hidrográficas — não são
  aproximação visual. E o alerta que você vê aqui é o mesmo de `/alertas`,
  na localização real do cenário."
- **Cuidado:** se perguntarem por que a cor passa da linha do município,
  explicar que é a bacia contribuinte (intencional, não erro) — não fingir
  que não percebeu.

### `/telemetria`

- **Objetivo da tela:** provar que o motor de risco funciona com dado
  digitado na hora, não só com os 3 cenários fixos.
- **O que mostrar:** clicar no atalho "Crítico", depois "Avaliar risco",
  mostrar o resultado (score, fatores, explicação, ação recomendada).
- **Frase curta:** "Isso não é um resultado fixo — é o motor rodando agora,
  com os valores que acabamos de mandar."
- **Cuidado:** ao mostrar o payload UniMesh/LoRa, apontar o
  `implemented: false` explicitamente — "essa camada de comunicação é só
  simulada, não há transmissão de rádio real".

### `/alertas`

- **Objetivo da tela:** mostrar como o mesmo motor alimenta uma lista
  operacional.
- **O que mostrar:** os filtros por nível, o badge "simulado" em cada card,
  e o link "Ver no mapa →" em cada card (leva direto pro marcador certo em
  `/mapa?alert=<id>`).
- **Frase curta:** "Cada evento simulado aqui vem do mesmo motor que vimos
  em Telemetria — mesma fonte de verdade, não dado inventado à parte. E dá
  pra ir direto pro mapa a partir daqui."
- **Cuidado:** nunca dizer "alerta emitido" sem qualificar "simulado".

### `/alertas/critico`

- **Objetivo da tela:** detalhe completo de um evento.
- **O que mostrar:** score, confiança, justificativa, os DOIS blocos de
  mensagem lado a lado — "Ação operacional recomendada" (Defesa Civil) e
  "Orientação à população" (cidadão, marcada como demonstrativa) —, aviso de
  origem simulada, links para mapa e telemetria.
- **Frase para os dois blocos:** "São públicos diferentes. O operador recebe
  instrução de plantão; o cidadão recebe orientação em linguagem simples,
  sem score nem número técnico. E nenhum dos dois textos ordena evacuação —
  quem determina deslocamento é a Defesa Civil, não o sistema." O link "Ver no
  Mapa" leva para `/mapa?alert=critico`, que dá `flyTo` até o marcador e
  abre o popup automaticamente.
- **Frase curta:** "Esse é o nível de detalhe que o operador veria antes de
  decidir uma ação — e o mesmo alerta, no mesmo lugar, no mapa."

### `/abrigos`

- **Objetivo da tela:** mostrar a outra ponta da decisão — para onde
  encaminhar.
- **O que mostrar:** os 4 perfis de ocupação (disponível, moderado, quase
  lotado, indisponível).
- **Frase curta:** "Nomes genéricos de propósito — são abrigos simulados
  para demonstração, sem vínculo confirmado com uma instituição real."
- **Cuidado:** nunca ler o nome de um abrigo como se fosse endereço real.

### `/docs` da API (se houver tempo)

- **Objetivo da tela:** mostrar que a API é real, documentada, testável.
- **O que mostrar:** o Swagger, expandir `POST /api/risk/evaluate` e rodar
  um "Try it out" ao vivo se der tempo.
- **Frase curta:** "Toda essa API é gerada automaticamente pelo FastAPI, a
  partir do mesmo código que roda o motor de risco."

## 5. Demonstração ao vivo passo a passo

1. Abrir backend (`uvicorn`, porta 8000).
2. Abrir frontend (`vite dev`, porta 5173).
3. Verificar `GET /api/risk/status` no navegador ou Swagger — confirma
   motor no ar antes de começar a falar.
4. Mostrar `/painel`.
5. Mostrar `/mapa`, clicar numa zona e num marcador.
6. Testar `/telemetria` com o atalho "Crítico" — avaliar risco ao vivo.
7. Abrir `/alertas`, depois `/alertas/critico`.
8. Mostrar `/abrigos`.

## 6. Perguntas prováveis dos professores

**O HAND foi feito como?**
Pipeline de 3 fases: fora do FloodGuard (repositório externo `HAND`) — DEM
Copernicus → processamento hidrológico com WhiteboxTools → raster de 4
classes de suscetibilidade; ponte documentada — vetorização do raster
(polygonize + dissolve) gerando um GeoPackage com estatística de área por
classe; dentro do FloodGuard — esse GeoPackage alimenta PostGIS e o
GeoJSON de fallback do mapa. Detalhes completos em
`docs/hand-processamento-detalhado.md`.

**O HAND foi tratado devidamente?**
Sim, dentro do que é verificável: as 4 classes usadas são as classes reais
do raster (não inventamos uma 5ª), a correspondência classe→rótulo foi
validada cruzando duas fontes independentes de percentual de área, e os
números batem nas 3 cópias existentes no repositório. Ressalva honesta: a
execução das etapas intermediárias do pipeline hidrológico (condicionamento,
direção de fluxo) não pôde ser reconstituída por arquivo dentro deste
repositório — ficou documentada como inferida, não confirmada por evidência
local.

**O mapa usa PostGIS real?**
Tenta primeiro. Se o PostGIS não responder — como é o caso neste ambiente
de desenvolvimento, sem Docker/sudo disponíveis —, cai automaticamente para
um GeoJSON estático gerado a partir dos mesmos dados HAND. O mapa nunca
fica vazio por causa disso.

**O que é simulado?**
Toda telemetria (chuva, nível d'água), a comunicação UniMesh/LoRa
(`implemented: false` sempre), os 3 cenários de demonstração, os alertas
derivados deles, e os 4 abrigos. O que **não** é simulado: os dados HAND
(processados sobre dado público real de Blumenau), o motor de risco (código
real, testado), e a API/frontend (código real).

**Existe sensor real?**
Não. Nenhum sensor físico, gateway LoRaWAN ou dispositivo Meshtastic está
em operação. O projeto é software-only e hardware-agnóstico por decisão de
escopo.

**Como o risco é calculado?**
Fórmula de fusão com 4 fatores: peso da classe HAND (0,45), chuva acumulada
normalizada (0,30), nível d'água normalizado (0,20), tendência do nível
(0,05). Score de 0 a 1, classificado em 4 níveis. Toda avaliação vem com
justificativa textual gerada a partir dos próprios fatores. Detalhes em
`docs/motor-de-risco.md`.

**Por que Blumenau?**
Histórico relevante de eventos de inundação na região e disponibilidade de
dados geoespaciais já processados (HAND) de fases anteriores do projeto.

**O sistema substitui a Defesa Civil?**
Não, em nenhuma hipótese. É uma ferramenta de apoio à decisão — a análise e
a decisão final continuam sendo humanas. Isso está escrito explicitamente
em `/sobre` e em `docs/limitacoes.md`.

**Como a mensagem chega ao usuário?**
Nesta PoC, não chega a ninguém fora do sistema — o "payload UniMesh/LoRa"
gerado em `/telemetria` é só uma simulação de como um alerta *poderia* ser
empacotado para uma rede de rádio de baixo consumo no futuro. Não há
transmissão real, `implemented: false` sempre.

**Como a telemetria funciona?**
Um formulário (ou um cenário fixo) manda os valores para
`POST /api/risk/evaluate`; o backend normaliza o payload, calcula o score e
devolve o resultado. Não há coleta automática nem sensor por trás.

**Como evoluir para produção?**
Validar PostGIS ponta a ponta, persistir alertas e abrigos de verdade,
adicionar autenticação, calibrar o motor de risco com dado histórico real,
e só então considerar hardware real — nessa ordem. Está detalhado em
`docs/roadmap.md`.

**Quais limitações existem?**
Motor não calibrado operacionalmente, sem persistência de alertas/abrigos,
sem autenticação, PostGIS não validado localmente, resolução do DEM (~30 m)
não captura microtopografia urbana. Lista completa em `docs/limitacoes.md`.

**Como lidar com LGPD?**
Ainda não implementado — é uma preocupação identificada, não resolvida.
Quando o cadastro real de abrigo e solicitação de ajuda do cidadão saírem
do roadmap para implementação, vão envolver dado pessoal (nome, localização)
e vão exigir política de acesso e retenção antes de sair de PoC.

**O que cada integrante fez?**
A autoria coletiva e a origem por componente (motor de risco e frontend do
`techguard-sentinela` por João Benvenutti; pipeline HAND e consolidação do
monorepo por Pedro Zanette) estão documentadas em `docs/autoria-licenca.md`.
Divisão de tarefas específica dentro de cada fase não está registrada em
nenhum artefato do repositório — resposta honesta é "a definir pela
equipe", não inventar uma divisão que não está comprovada.

## 7. Plano B da demo

- **Se PostGIS falhar:** já é o comportamento esperado neste ambiente —
  dizer isso com naturalidade ("aqui está caindo no fallback estático, que
  é exatamente o comportamento que queríamos garantir") em vez de tentar
  esconder.
- **Se a internet falhar:** o mapa-base (tiles do OpenStreetMap) não
  carrega, mas as camadas de dado (HAND, marcadores) continuam
  renderizando sobre fundo cinza — seguir a demo normalmente, mencionando
  que só o tile visual depende de rede externa.
- **Se o mapa-base OSM não carregar:** mesma resposta acima — camadas de
  dado não dependem disso.
- **Se o backend cair:** ter um terminal já preparado com o comando de
  subir (`uvicorn app.main:app --reload --port 8000`) para religar rápido;
  enquanto isso, seguir explicando por slide/screenshot já tirado antes.
- **Se o frontend cair:** mesma lógica — `npm run dev` já testado antes,
  reiniciar rápido; ter `/docs` da API como plano B para continuar
  mostrando algo funcionando.
- **Se perguntarem sobre sensor real:** resposta direta e sem rodeio —
  "não existe, o projeto é software-only por decisão de escopo, documentado
  desde o início".

## 8. Frases que devem ser evitadas

- "temos sensores reais"
- "alerta oficial"
- "a Defesa Civil usa isso"
- "previsão garantida"
- "sistema pronto para produção"
- "abrigo confirmado" / nome de instituição real sem checar se é o caso
- "dados em tempo real" (para telemetria simulada)

## 9. Frases corretas para usar

- "PoC acadêmica"
- "telemetria simulada"
- "fallback estático"
- "apoio à decisão"
- "não substitui a Defesa Civil"
- "HAND como suscetibilidade topográfica, não previsão"
- "cenário de demonstração"
- "sem persistência" / "recalculado a cada chamada"
