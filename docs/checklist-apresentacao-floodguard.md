# Checklist de Apresentação — FloodGuard

## 1. Antes da apresentação

- [ ] `git checkout main`
- [ ] `git pull origin main`
- [ ] Backend: rodar testes (`pytest`) — confirmar **62 de 62 passando**
- [ ] Frontend: rodar build (`npm run build`) — confirmar sem erro
- [ ] Verificar portas 8000 e 5173 livres (matar processo antigo se preciso)
- [ ] Confirmar internet ativa (mapa-base OpenStreetMap depende disso)
- [ ] Abrir navegador limpo, sem abas de distração
- [ ] Ajustar zoom da tela para leitura confortável de quem está longe
- [ ] Terminal limpo, fonte grande, sem histórico de comando confidencial
- [ ] Ter este checklist e o roteiro de demo (`docs/roteiro-demo-floodguard.md`) abertos numa segunda tela/aba

## 2. Comandos para rodar

Backend:
```bash
cd services/api
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

Frontend (outro terminal):
```bash
cd apps/web
npm run dev
```

## 3. URLs obrigatórias

Backend:
- http://localhost:8000/docs
- http://localhost:8000/api/risk/status
- http://localhost:8000/api/scenarios/demo
- http://localhost:8000/api/geo/demo-map
- http://localhost:8000/api/alerts/demo
- http://localhost:8000/api/shelters/demo

Frontend:
- http://localhost:5173/sobre
- http://localhost:5173/painel
- http://localhost:5173/mapa
- http://localhost:5173/telemetria
- http://localhost:5173/alertas
- http://localhost:5173/alertas/critico
- http://localhost:5173/abrigos

## 4. O que conferir visualmente

- [ ] `/sobre` mostra os 3 blocos Implementado/Simulado/Roadmap
- [ ] `/painel` mostra os 4 indicadores e os 3 cards de cenário com score
- [ ] `/mapa` mostra as 4 zonas coloridas + limite municipal (linha ciano) +
      marcadores — clicar em pelo menos 1 zona e 1 marcador antes da
      apresentação para confirmar que os popups abrem
- [ ] `/telemetria` — testar o atalho "Crítico" e confirmar que o resultado
      aparece com score, fatores, explicação e ação recomendada
- [ ] `/alertas` mostra os filtros e os cards com badge "simulado"
- [ ] `/alertas/critico` mostra o detalhe completo
- [ ] `/abrigos` mostra os 4 perfis de ocupação com cor distinta
- [ ] Nenhuma tela mostra erro cru (stack trace, tela branca) — se aparecer,
      não é hora de debugar ao vivo, seguir para "O que não mostrar"

## 5. O que não mostrar se estiver instável

- Não abrir o console do navegador na frente dos avaliadores se houver erro
  — investigar depois, fora da apresentação.
- Não tentar forçar o caminho `source: "postgis"` ao vivo se o PostGIS não
  estiver configurado neste ambiente — o fallback estático já é o
  comportamento correto e esperado, não uma falha a esconder.
- Não abrir `/alertas/nao-existe` de propósito só para "mostrar o erro" a
  menos que o roteiro peça — foco é nas telas que funcionam.
- Se algum endpoint estiver respondendo devagar (rede lenta), não insistir
  clicando várias vezes — esperar ou pular para a próxima tela do roteiro.

## 6. Plano B

Ver seção 7 de `docs/roteiro-demo-floodguard.md` — resumo:

- PostGIS falhar → já é o fallback esperado, dizer isso com naturalidade.
- Internet falhar → mapa-base some, camadas de dado continuam.
- Backend cair → religar com o comando da seção 2, seguir explicando por
  cima enquanto sobe.
- Frontend cair → mesma lógica, `/docs` da API como plano B de conteúdo.
- Perguntarem sobre sensor real → responder direto: não existe, é
  software-only por decisão de escopo.

## 7. Perguntas difíceis

Ver seção 6 completa de `docs/roteiro-demo-floodguard.md` — cobre: como o
HAND foi feito e se foi tratado devidamente, se o mapa usa PostGIS real, o
que é simulado, se existe sensor real, como o risco é calculado, por que
Blumenau, se o sistema substitui a Defesa Civil, como a telemetria e a
"mensagem" funcionam, como evoluir para produção, quais limitações
existem, como lidar com LGPD, e o que cada integrante fez (resposta honesta
quando não há divisão de tarefas documentada).

## 8. Última checagem

- [ ] Backend e frontend respondendo nas URLs da seção 3, agora, minutos
      antes de começar
- [ ] Terminal e navegador visíveis e legíveis para quem está na sala
- [ ] Água por perto, celular no silencioso
- [ ] Confirmar quem começa a falar e em que tela
