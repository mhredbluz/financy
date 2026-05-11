# Financy — Guia Rápido de Uso

Este documento resume as principais funcionalidades do app. É uma visão estrutural; podemos aprofundar cada área depois.

## Visão Geral
O Financy é um app local-first para:
- Controle de receitas e despesas
- Orçamento diário com carry-over
- Recorrências (entradas/saídas fixas)
- Metas e acompanhamento
- Importação de faturas de cartão (PDF)
- Relatórios visuais e alertas

## Fluxo Recomendo (Primeiro uso)
1. Cadastre categorias e metas
2. Crie recorrências fixas (salário, aluguel, assinaturas)
3. Lance despesas e receitas do mês
4. Acompanhe o limite diário no card “Hoje”
5. Use o Resumo do mês para ver “Real vs Previsto”

## Dashboard
### Card “Hoje”
- Navegue entre dias com as setas
- Veja:
  - Dias restantes
  - Limite diário (com carry-over)
  - Gasto hoje e diferença
  - Contas do dia, recorrências de hoje e metas pendentes

### Resumo do mês
Exibe:
- Receita/Despesas **previstas** (inclui recorrências)
- Receita/Despesas **reais** (apenas lançamentos)
- Saldo previsto e saldo real
- Base diária e status do mês

### Relatórios
Gráficos com distribuição de gastos e evolução do saldo.

### Recorrências Ativas
Lista próximas recorrências e o total previsto para hoje.

## Transações
### Lançar receita/despesa
- Defina tipo, data, valor, categoria e descrição
- Escolha o método de pagamento (débito, crédito, pix, etc.)

### Editar / Excluir
Use os botões de ação na lista de transações.

### Filtros e Ordenação
Filtre por categoria, tipo e método de pagamento.

## Recorrências
Crie transações que se repetem (diária, semanal, mensal, anual).
Exemplos:
- Salário mensal (receita)
- Aluguel, internet, assinatura (despesa)

As recorrências:
- Geram lançamentos automaticamente
- Também entram como **previsão** no resumo do mês

## Metas
Crie metas de:
- Poupança
- Limite por categoria
- Meta mensal

O app mostra metas pendentes no card “Hoje” e status no painel de metas.

## Cartão de crédito (Importar fatura)
No menu “Cartões”:
- Importe PDF de fatura
- O app tenta extrair as transações de crédito

Observação:
- O pagamento da fatura não entra como gasto novo

## Backup e Exportação
Em “Configurações”:
- Exportar dados
- Restaurar backups anteriores

## Notificações e Alertas
O app sinaliza:
- Estouro de limite diário
- Recorrências próximas
- Status de orçamento mensal

## Exemplos Práticos (Problemas Reais)
### 1) “Sempre estouro o orçamento antes do fim do mês”
Objetivo: entender o limite diário e evitar estourar.
Como usar:
- No card “Hoje”, veja o **Limite diário**.
- Se estourar um dia, o carry-over reduz o limite do dia seguinte.
- Ajuste o **orçamento mensal** até o limite diário ficar realista.

Exemplo:
- Saldo previsto do mês: R$ 2.100
- Dias restantes: 30
- Limite diário: R$ 70
- Gastou R$ 50 no Dia 1 → sobra +R$ 20
- Dia 2: limite = R$ 70 + R$ 20 = R$ 90

### 2) “Tenho gastos fixos e quero prever o mês todo”
Objetivo: ver previsões reais considerando recorrências.
Como usar:
- Cadastre recorrências (salário, aluguel, assinaturas).
- No **Resumo do mês**, compare:
  - Previsto (inclui recorrências)
  - Real (lançamentos feitos)

Exemplo:
- Salário mensal: R$ 3.500
- Aluguel: R$ 1.200
- Assinaturas: R$ 120
Resumo previsto já vai mostrar tudo isso mesmo sem lançamentos reais.

### 3) “Quero controlar gastos por categoria”
Objetivo: ver onde o dinheiro vai.
Como usar:
- No cadastro de transações, use categorias consistentes.
- Em Transações, abra “Agregação por categoria”.
- No relatório visual, veja a distribuição.

Exemplo:
- Alimentação: R$ 800
- Transporte: R$ 300
- Lazer: R$ 200
-> O app mostra a categoria mais pesada do mês.

### 4) “Tenho cartão de crédito e não sei lançar”
Objetivo: registrar compras no crédito corretamente.
Como usar:
- Importe a fatura no menu **Cartões**.
- Cada compra vira um lançamento de despesa no crédito.
- O pagamento da fatura não entra como gasto novo.

Exemplo:
- Fatura: R$ 650 (10 compras)
-> Você importa e o app cria 10 lançamentos.

### 5) “Quero guardar dinheiro todo mês”
Objetivo: criar metas realistas.
Como usar:
- Crie uma meta de poupança ou meta mensal.
- O card “Hoje” mostra metas pendentes no mês.
- Lance transferências para metas (quando aplicável).

Exemplo:
- Meta: “Guardar R$ 500 até o fim do mês”
-> O app mostra o quanto falta para completar.

### 6) “Quero saber se estou gastando demais hoje”
Objetivo: decisão rápida no dia.
Como usar:
- Veja “Gasto hoje” e “Diferença hoje” no card Hoje.
- Se a diferença for negativa, pare gastos extras.

Exemplo:
- Orçamento hoje: R$ 60
- Gasto hoje: R$ 75
-> Diferença hoje = -R$ 15 (estouro)

---

## Próximo passo
Se quiser, posso expandir cada seção com:
- Exemplos reais
- Regras de cálculo
- Dicas de organização financeira
