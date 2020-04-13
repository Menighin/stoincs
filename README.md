# Porquinho Digital (porquinho-digital) 🐽

App desktop para acompanhamento da sua carteira de investimentos.

## Features
* **Integração com CEI**: Integra com o [Canal Eletrônico do Investidor](https://cei.b3.com.br/CEI_Responsivo/) para buscar o seu histórico de negociações da bolsa
* **Integração com Alpha Vantage**: Integra com a [Alpha Vantage](https://www.alphavantage.co/) para fazer atualização dos preços das ações
* **Integração com Google Drive**: Integra com o Google Drive para manter seus dados na nuvem de forma que você possa acessar de qualquer lugar
* **Gráficos**: Exibições da sua carteira de ativos em gráficos utilizando [Highcharts](https://www.highcharts.com/)

## Desenvolvendo

Clone o repositório e instale as dependências:

```bash
npm install
```

Crie um arquivo `GoogleCredentials.js` no diretório`src-electron/resources`. Esse arquivo é utilizado para integração com Google Drive. Está comitado um arquivo de exemplo com valores falsos.

Inicie a aplicação executando:

```bash
quasar dev -m electron
```

Caso precise de alguns dados de teste, copie os arquivos da pasta `sample_data` para o diretório `.quasar/electron/data`, que é criado após o projeto ser executado uma vez

## Roadmap
- [x] Integração com CEI - Histórico de negociações
- [x] Integração Alpha Vantage
- [x] Integração Google Drive
- [x] Gráficos
- [ ] Tesouro direto
- [ ] Dividendos
- [ ] Histórico de valorização da carteira
- [ ] Alertas