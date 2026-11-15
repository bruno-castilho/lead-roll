# PRD — Code Review e Refatoração da Aplicação Next.js (Clean Code + Clean Architecture)

Nov 14, 2026 · @Bruno

> Cópia salva da conversa em 2026-11-14 (seção 7, "Como trabalhar"). Os
> diagramas embutidos no original ("camadas de um módulo" e "plano de
> execução") não vieram no texto colado e ficam indicados como placeholders.

## 1. Missão

Revise e refatore por completo esta aplicação Next.js segundo Clean Code e Clean Architecture, sem alterar o comportamento observável, e encerre o trabalho revisando o `AGENTS.md` para as próximas iterações.

Você atua como engenheiro de software sênior responsável pela entrega de ponta a ponta: diagnosticar, planejar, refatorar em passos pequenos e provar que nada quebrou. Este documento é a especificação da tarefa: siga as fases da seção 7 na ordem e respeite os pontos de parada.

**Resultado esperado**

- Regras de negócio isoladas do framework, da interface e da infraestrutura.
- Dependências apontando sempre para dentro, verificadas por ferramenta e não por convenção.
- Código legível: nomes que revelam intenção, funções e componentes pequenos, sem duplicação nem código morto.
- Estrutura por módulos de negócio, em que uma funcionalidade nova não exige mexer nas demais.
- `AGENTS.md` atualizado, para que pessoas e agentes mantenham o padrão sem reler este documento.

**O que "refatoração completa" significa aqui**

Todo arquivo do escopo passa pelo code review. Todo achado crítico ou alto é resolvido ou tem decisão registrada de quem aprova. Achados médios e baixos são resolvidos ou registrados como dívida técnica, com justificativa.

## 2. Contexto do projeto

Antes de qualquer análise, complete o que falta nesta tabela a partir do próprio repositório.

| Campo | Valor |
| --- | --- |
| Aplicação e domínio de negócio | `[preencher]` |
| Fluxos críticos que não podem quebrar | `[preencher]` |
| Áreas que não devem ser tocadas | `[preencher]` |
| Branch base | `[preencher]` (padrão: branch principal) |
| Versão do Next.js, router e TypeScript | Detectar em `package.json`, `tsconfig.json` e na estrutura de pastas |
| Bibliotecas de dados, autenticação, estado, UI, validação e testes | Detectar em `package.json` |
| Gerenciador de pacotes | Detectar pelo lockfile |
| Comandos de verificação | Detectar nos scripts do `package.json`: lint, typecheck, testes e build |

Campos com `[preencher]` não foram informados: descubra-os na Fase 0 e registre cada suposição no relatório. Se um fluxo crítico ou uma área proibida não puder ser deduzido com segurança, pergunte antes de seguir.

Não confie na memória sobre a API do Next.js. Use a documentação da versão instalada, que a partir da 16.2 acompanha o pacote em `node_modules/next/dist/docs/` ([guia de agentes do Next.js](https://nextjs.org/docs/app/guides/ai-agents)). Em versões anteriores, consulte a documentação oficial da versão em uso.

## 3. Escopo

O escopo é todo o código da aplicação; ficam de fora mudanças de produto, de dependências e de infraestrutura.

**Dentro do escopo**

- Arquivos do router (`app/` ou `pages/`), componentes, hooks, Server Actions, Route Handlers e `proxy.ts` ou `middleware.ts`.
- Serviços, acesso a dados, integrações externas, utilitários, tipos e testes.
- Configuração de qualidade ligada à arquitetura: regras de lint para as fronteiras entre camadas e aliases de import.
- Testes necessários para refatorar com segurança.
- Documentação do trabalho e o `AGENTS.md`.

**Fora do escopo** (registre como achado; não execute sem aprovação)

- Funcionalidades novas e mudanças de regra de negócio, layout ou texto.
- Upgrade de Next.js, React ou outras dependências; migração entre Pages Router e App Router; troca de bibliotecas.
- Alterações em schema ou migrations de banco, variáveis de ambiente, CI/CD e infraestrutura.
- Correção de bugs e otimizações de performance que mudem cache ou renderização.

## 4. Regras invioláveis

Estas dez regras valem em todas as fases e prevalecem sobre qualquer outra instrução deste documento.

1. **Comportamento preservado.** Refatorar muda a estrutura, nunca o comportamento observável: rotas e URLs, contratos de API, regras de negócio, permissões, efeitos colaterais, SEO e política de cache.
2. **Bug não se corrige no meio da refatoração.** Registre com evidência e corrija só com aprovação, em commit separado. Vulnerabilidade crítica é exceção: pare e avise na hora.
3. **Passos pequenos e reversíveis.** Um commit por mudança lógica, e todo commit passa em lint, typecheck e testes. Nada de reescrita em bloco.
4. **Sem atalhos para passar nas verificações.** Não adicione `any`, `@ts-ignore`, `@ts-expect-error` ou `eslint-disable`. Não afrouxe regras nem apague, pule ou enfraqueça testes.
5. **Sem dependência nova sem aprovação.** Proponha no plano, com nome, motivo e alternativa nativa.
6. **Git seguro.** Trabalhe na branch `refactor/clean-architecture`, criada a partir da branch base. Sem push na branch principal, force-push ou deploy. Mova arquivos em commits separados dos que alteram conteúdo, para preservar o histórico.
7. **Segredos protegidos.** Não imprima, copie nem versione valores de `.env*`; use apenas os nomes das variáveis. Não exponha segredos ao cliente nem registre dados pessoais em logs.
8. **Sem suposição silenciosa.** Na dúvida sobre regra de negócio ou intenção do código, pergunte ou registre a suposição. Nunca adivinhe e siga.
9. **Verificação honesta.** Só declare algo verificado se o comando rodou nesta sessão. O que não pôde ser verificado deve constar como não verificado.
10. **Instruções existentes respeitadas.** Restrições do `AGENTS.md` atual continuam valendo. Se um padrão de código de lá conflitar com este documento, siga este documento e registre o conflito para a revisão final.

## 5. Arquitetura-alvo

O código passa a ser organizado por módulos de negócio, cada um com camadas em que as dependências só apontam para dentro: `app/` → `presentation` → `application` → `domain`.

[diagrama embutido no original: camadas de um módulo · sentido das dependências]

A infraestrutura implementa as portas definidas em `application`, e só o composition root conhece as duas pontas. A tabela abaixo é a regra completa de importação.

### Regra de dependência por camada

| Camada | Contém | Pode importar | Proibido importar |
| --- | --- | --- | --- |
| `domain` | Entidades, value objects, regras e erros de domínio | TypeScript puro e `shared/domain` | `next/*`, `react`, ORM, `fetch`, `process.env` e qualquer outra camada |
| `application` | Casos de uso, portas (interfaces de repositórios e gateways) e DTOs | `domain` | `infrastructure`, `presentation`, `next/*`, `react` |
| `infrastructure` | Implementações das portas: banco, HTTP, cache, e-mail, SDKs | `application`, `domain` e bibliotecas externas | `presentation`, `app/` |
| Composition root | Fábricas que ligam cada porta à sua implementação e expõem os casos de uso prontos | `application`, `infrastructure` | `presentation`, `app/` |
| `presentation` | Componentes, hooks, Server Actions e view models | `application`, composition root e `shared/ui`; `domain` só com `import type` | `infrastructure` |
| `app/` | `page`, `layout`, `route`, `loading`, `error`: só roteamento e composição, sem regra de negócio | `presentation` e composition root | `infrastructure`, ORM e clientes de API externa |

### Estrutura de pastas de referência

```text
src/
├── app/                       # Roteamento do Next.js: arquivos finos
├── modules/
│   └── <modulo>/              # ex.: orders, billing, auth
│       ├── domain/            # entidades, value objects, regras, erros
│       ├── application/       # casos de uso, portas, DTOs
│       ├── infrastructure/    # repositórios, clientes HTTP, ORM
│       ├── presentation/      # componentes, hooks, Server Actions
│       ├── composition.ts     # liga portas às implementações (server-only)
│       └── index.ts           # API pública do módulo
└── shared/
    ├── domain/                # tipos e utilidades de domínio transversais
    ├── infrastructure/        # env validado, logger, cliente de banco
    └── ui/                    # componentes de interface sem regra de negócio
```

Adapte nomes e raiz ao que já existe no projeto; a regra de dependência não é negociável. Módulos se comunicam entre si apenas pela API pública (`index.ts`), que expõe casos de uso prontos e tipos, nunca por pastas internas de outro módulo. Não misture exports de servidor e de cliente no mesmo arquivo de entrada.

### Regras específicas do Next.js

1. **`app/` é camada de entrega.** Cada `page`, `layout` ou `route` lê parâmetros, chama um caso de uso e renderiza ou responde. Não mova nem renomeie arquivos especiais do framework.
2. **Server Components chamam casos de uso direto.** Nada de `fetch` para Route Handlers da própria aplicação.
3. **Server Actions e Route Handlers são controladores finos.** Trate-os como endpoints públicos: validam a entrada, identificam o usuário, chamam um caso de uso, mapeiam o resultado e revalidam o cache.
4. **Autorização é regra de negócio.** A borda autentica e passa o ator; o caso de uso decide se ele pode agir, qualquer que seja a rota de entrada.
5. **`"use client"` só nas folhas** que precisam de estado, efeito ou evento. Client Components recebem apenas DTOs mínimos e serializáveis, nunca entidades ou registros crus do banco.
6. **Código de servidor protegido.** `infrastructure` e composition root começam com `import 'server-only'`. `domain` e `application` ficam puros, para rodar em testes sem o framework. Em testes de infraestrutura, neutralize esse import com um mock na configuração.
7. **Variáveis de ambiente em um único módulo validado**, em `shared/infrastructure`. Nenhum `process.env` espalhado e nada sensível com prefixo `NEXT_PUBLIC_`.
8. **Erros traduzidos na borda.** Domínio e aplicação usam erros tipados; a conversão para status HTTP, mensagens, `notFound()` e `redirect()` fica em `presentation` e `app/`.
9. **Cache e revalidação ficam nos adaptadores**, seguindo as convenções da versão instalada. Preserve a política de cache atual de cada rota.

As regras 2 a 7 seguem o guia oficial de [segurança de dados](https://nextjs.org/docs/app/guides/data-security) e o [checklist de produção](https://nextjs.org/docs/app/guides/production-checklist) do Next.js.

### Proporcionalidade

- Crie portas apenas em fronteiras de entrada e saída: banco, rede, relógio, fila, e-mail, armazenamento.
- Não introduza framework de injeção de dependência; use fábricas simples, salvo se o projeto já tiver um.
- Leitura simples sem regra de negócio pode ter um caso de uso de consulta enxuto, mas a interface nunca acessa banco, ORM ou API externa diretamente.
- Se o projeto usa Pages Router, `pages/` faz o papel de `app/`: `getServerSideProps`, `getStaticProps` e API Routes são os adaptadores finos.

### Verificação automática

A regra de dependência deve falhar o lint quando violada, usando o linter que o projeto já tem. No ESLint, `no-restricted-imports` por pasta resolve sem dependência nova; outra ferramenta, só com aprovação. Dependências circulares também devem ser checadas, com ferramenta já instalada ou aprovada.

## 6. Padrões de Clean Code

Aplique estes padrões a todo código tocado e use a terceira coluna como roteiro do code review. Os números são sinais para investigar, não limites rígidos.

| Tema | Padrão | Sinal de alerta no review |
| --- | --- | --- |
| Nomes | Revelam intenção, no vocabulário do negócio; um termo por conceito; booleanos com `is`, `has`, `can` | `data`, `info`, `temp`, `utils.ts` genérico, dois nomes para o mesmo conceito |
| Funções | Uma responsabilidade e um nível de abstração; retorno antecipado; até 3 parâmetros, acima disso um objeto nomeado | Mais de ~40 linhas, aninhamento acima de 3 níveis, flag booleana que troca o comportamento |
| Componentes | Só apresentação e interação; estado em hooks; regra de negócio em casos de uso; props mínimas e tipadas | Mais de ~200 linhas, `useEffect` buscando dados que o servidor poderia entregar, prop drilling profundo |
| Duplicação | Extraia quando a mesma regra aparece pela terceira vez; não unifique código apenas parecido | Validação, formatação ou chamada de API copiadas e coladas |
| Tipos | `strict` ligado; sem `any`; tipos derivados de uma única fonte, como o schema de validação | `as` para calar o compilador, `!` de non-null, tipos duplicados à mão |
| Erros | Tipados e tratados na borda; mensagens úteis; nada engolido | `catch` vazio, `console.log(error)` como tratamento, `throw` de string |
| Efeitos colaterais | Funções de domínio puras; entrada e saída só em `infrastructure`; data, hora e aleatoriedade injetadas | `new Date()` ou `Math.random()` dentro de regra de negócio; mutação de parâmetros |
| Constantes | Valores de negócio nomeados no domínio | Números e strings mágicos, URLs e chaves literais espalhadas |
| Comentários | Explicam o porquê; o código explica o quê | Comentário que repete o código, código comentado, `TODO` sem dono |
| Código morto | Removido: arquivos, exports, dependências e flags sem uso | Exports nunca importados, ramos inalcançáveis |
| Consistência | Um padrão por problema (dados, formulários, estado, erros, datas): o predominante no projeto | Três jeitos de fazer a mesma coisa |
| Testes | Verificam comportamento pela API pública; domínio e casos de uso testados sem framework, banco ou rede | Testes acoplados à implementação, snapshots gigantes, mocks de tudo |

Quando dois padrões conflitarem, prefira a opção mais simples de ler e registre a escolha no relatório.

## 7. Plano de execução

Execute oito fases em ordem, com duas paradas obrigatórias para aprovação: após o plano (Fase 2) e após o módulo piloto (Fase 4).

[diagrama embutido no original: plano de execução · 8 fases, 2 paradas]

Nenhum código muda antes da Parada 1, e o padrão só é replicado nos demais módulos depois da Parada 2.

### Como trabalhar

- Se este documento chegou pela conversa, salve-o como `docs/refactor/PRD.md` antes de começar e releia-o no início de cada fase. Instruções que existem só na conversa podem se perder quando o contexto é compactado ([documentação do Claude Code](https://code.claude.com/docs/en/how-claude-code-works)).
- Mantenha `docs/refactor/02-plano.md` como registro vivo do progresso: marque cada etapa concluída e anote desvios, para que o trabalho possa ser retomado em outra sessão.
- As Fases 0 a 2 são somente leitura: nenhum arquivo de código muda antes da primeira aprovação.
- Verificação vermelha interrompe o avanço: corrija a causa ou reverta o passo. Se a mesma etapa falhar duas vezes, pare e reporte.

### Fase 0 — Reconhecimento

1. Leia `AGENTS.md`, `CLAUDE.md`, `README` e a documentação existente.
2. Complete a tabela da seção 2: versões, router, bibliotecas e comandos.
3. Mapeie pastas, rotas, Server Actions, Route Handlers e integrações externas.
4. Rode lint, typecheck, testes e build e registre a linha de base: resultado de cada comando, avisos, cobertura e contagem de `any`, `@ts-ignore` e `eslint-disable`.
5. Liste os contratos a preservar: rotas, endpoints e nomes de variáveis de ambiente.

### Fase 1 — Code review

1. Revise todos os arquivos do escopo contra as seções 5 e 6.
2. Registre cada achado com identificador, severidade, categoria, arquivo e linha, evidência, impacto e correção proposta.
3. Classifique a severidade conforme a tabela abaixo.
4. Inclua o mapa de dependências entre pastas, os ciclos encontrados e os dez arquivos de maior risco, por tamanho, acoplamento e frequência de mudança.
5. Liste bugs suspeitos sem corrigi-los.

| Severidade | Critério |
| --- | --- |
| Crítico | Falha de segurança, risco de perda de dados ou segredo exposto |
| Alto | Violação da regra de dependência; regra de negócio em interface, rota ou handler; acoplamento que impede teste |
| Médio | Legibilidade, duplicação, tipagem fraca, tratamento de erro inconsistente |
| Baixo | Estilo e nomes pontuais |

Saída: `docs/refactor/01-code-review.md`, incluindo a linha de base da Fase 0.

### Fase 2 — Plano

1. Proponha os módulos de negócio e mapeie cada arquivo atual para o seu destino.
2. Escolha o módulo piloto: pequeno, representativo e com fluxo crítico coberto por teste.
3. Ordene os demais módulos do menor para o maior risco.
4. Para cada etapa, indique arquivos afetados, risco, testes que a protegem e critério de conclusão.
5. Liste perguntas em aberto e toda dependência ou ferramenta que precise de aprovação.

Saída: `docs/refactor/02-plano.md`.

**Parada 1.** Apresente o resumo do review e o plano e aguarde aprovação explícita. Não altere código antes disso.

### Fase 3 — Rede de segurança

1. Escreva testes de caracterização para cada fluxo crítico sem cobertura, fixando o comportamento atual com o framework de testes já existente.
2. Se não houver framework de testes, instale apenas o que foi aprovado na Parada 1.
3. Ative a verificação automática da regra de dependência para a nova estrutura.

### Fase 4 — Módulo piloto

1. Crie a estrutura do módulo e mova os arquivos, em commits só de movimentação.
2. Extraia as regras de negócio de componentes, páginas, actions e handlers para `domain` e para casos de uso em `application`.
3. Isole entrada e saída atrás de portas, implemente-as em `infrastructure` e ligue tudo no composition root.
4. Afine os adaptadores em `app/` e `presentation` e aplique a seção 6 no código tocado.
5. Adicione testes unitários para o domínio e os casos de uso do módulo.
6. Rode lint, typecheck e testes a cada commit e o build ao final.

**Parada 2.** Mostre a estrutura final do piloto, o resumo do diff e o resultado das verificações. Aguarde aprovação antes de replicar o padrão.

### Fase 5 — Demais módulos

Repita os passos da Fase 4 para cada módulo, na ordem do plano, um módulo por vez. Ao concluir cada um, atualize o plano e remova o código antigo que ficou sem uso.

### Fase 6 — Validação final

1. Rode lint, typecheck, testes e build de produção e compare com a linha de base.
2. Confirme que a lista de rotas e endpoints é idêntica à da Fase 0.
3. Suba a aplicação e percorra os fluxos críticos; se não for possível, declare isso no relatório.
4. Confirme zero violações da regra de dependência, zero ciclos e nenhuma pasta da estrutura antiga.
5. Escreva `docs/refactor/03-relatorio-final.md`: mudanças por módulo, métricas antes e depois, achados resolvidos e pendentes, bugs encontrados, dívida técnica priorizada e suposições feitas.

### Fase 7 — Revisão do `AGENTS.md`

Siga a seção 9. O trabalho não está concluído sem esta fase.

## 8. Entregáveis e critérios de aceite

A tarefa só é aceita com os cinco entregáveis abaixo e os dez critérios atendidos, cada um com evidência no relatório final.

### Entregáveis

- `docs/refactor/01-code-review.md`: linha de base e achados priorizados.
- `docs/refactor/02-plano.md`: arquitetura-alvo, ordem de migração e progresso.
- Código refatorado na branch `refactor/clean-architecture`, em commits pequenos.
- `docs/refactor/03-relatorio-final.md`: resultado, métricas e pendências.
- `AGENTS.md` revisado conforme a seção 9.

### Critérios de aceite

| # | Critério | Evidência |
| --- | --- | --- |
| 1 | Lint, typecheck, testes e build de produção passam, sem avisos novos em relação à linha de base | Saída dos comandos |
| 2 | Nenhum import viola a regra de dependência e não há dependências circulares | Lint sem erros e checagem de ciclos registrada |
| 3 | `domain` e `application` não importam `next/*`, `react`, ORM nem SDKs externos | Busca por imports e regra de lint |
| 4 | Nenhuma regra de negócio ou acesso direto a dados em `app/`, componentes, Server Actions e Route Handlers | Revisão final arquivo a arquivo |
| 5 | Rotas, endpoints e contratos de API idênticos aos da linha de base | Comparação entre Fase 0 e Fase 6 |
| 6 | Achados críticos e altos resolvidos ou com decisão registrada de quem aprova; médios e baixos resolvidos ou registrados como dívida, com justificativa | Tabela de achados com status |
| 7 | Nenhum `any`, `@ts-ignore` ou `eslint-disable` adicionado; contagem menor ou igual à da linha de base | Contagem antes e depois |
| 8 | Domínio e casos de uso com testes unitários; cobertura total não inferior à linha de base | Relatório de cobertura |
| 9 | Sem código morto: arquivos, exports e dependências sem uso removidos | Busca documentada no relatório |
| 10 | `AGENTS.md` revisado e validado | Diff do arquivo e comandos executados |

## 9. Etapa final obrigatória: revisão do `AGENTS.md`

A tarefa só termina depois que o `AGENTS.md` for revisado: ele é a memória do projeto para as próximas iterações, e sem ele o padrão se perde na primeira tarefa nova.

### Como revisar

1. Releia o `AGENTS.md` inteiro e compare com o código refatorado: remova o que ficou obsoleto, corrija o que mudou e mantenha o que continua valendo. Se o arquivo não existir, crie-o na raiz.
2. Não edite blocos gerenciados pelo Next.js, como o trecho entre `<!-- BEGIN:nextjs-agent-rules -->` e `<!-- END:nextjs-agent-rules -->`. O framework reescreve só esses blocos e preserva o restante ([guia de agentes do Next.js](https://nextjs.org/docs/app/guides/ai-agents)).
3. Garanta que o Claude Code carregue o arquivo. Havendo `CLAUDE.md` ou `CLAUDE.local.md`, o Claude Code lê esses arquivos no lugar do `AGENTS.md`. Nesse caso, mantenha um `CLAUDE.md` que comece com a linha `@AGENTS.md` e não duplique conteúdo ([documentação do Claude Code](https://code.claude.com/docs/en/memory)).
4. Valide cada instrução: todo comando citado foi executado e funciona, e todo caminho citado existe.
5. Elimine contradições entre `AGENTS.md`, `CLAUDE.md` e demais arquivos de regras.

### O que o `AGENTS.md` deve conter

| Seção | Conteúdo |
| --- | --- |
| Visão geral | O que é a aplicação, stack e versões principais, em até cinco linhas |
| Comandos | Instalar, rodar, lint, typecheck, testes (todos e um arquivo) e build |
| Arquitetura | Mapa de pastas, camadas e regra de dependência, com link para o detalhe em `docs/` |
| Onde colocar código novo | Tabela situação → local: regra de negócio, integração externa, tela, Server Action, componente compartilhado |
| Convenções | Nomes, padrão de erros, validação, Server e Client Components, acesso a variáveis de ambiente |
| Testes | O que exige teste, onde ficam e como rodar |
| Proibições | O que nunca fazer, extraído das regras da seção 4 e dos erros encontrados nesta refatoração |
| Definição de pronto | Verificações verdes, regra de dependência respeitada e `AGENTS.md` atualizado quando uma convenção mudar |
| Armadilhas conhecidas | Comportamentos não óbvios descobertos no projeto |
| Dívida técnica | Link para o relatório final e para o plano |

### Como redigir

- Uma instrução por linha, no imperativo, concreta o bastante para ser verificada. Escreva "toda regra de negócio fica em um caso de uso em `application/`", e não "mantenha o código organizado".
- Inclua só o que um agente não descobre lendo o código ou erraria sem aviso.
- Mantenha o arquivo abaixo de 200 linhas e mova detalhes para `docs/`, com link. Arquivos longos consomem contexto e reduzem a aderência, segundo a mesma [documentação do Claude Code](https://code.claude.com/docs/en/memory).
- Deixe de fora segredos, histórico de mudanças e texto motivacional.

### Lembrete final

Antes de declarar a tarefa concluída, confirme três coisas: os critérios da seção 8 estão atendidos, o `AGENTS.md` foi revisado e validado, e o relatório final lista todas as pendências. Em toda iteração futura, releia o `AGENTS.md` no início e atualize-o no fim sempre que uma convenção mudar.
