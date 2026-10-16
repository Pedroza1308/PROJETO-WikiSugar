# 🍎 Projeto WikiSugar

# GRUPO:
* Helena Victoria
* Lucas Ribeiro
* Pablo Felipe
* Pedro Alves
* Vinícius Mergulhão

## 📖 Sobre o Projeto
O WikiSugar é uma aplicação web/mobile projetada para auxiliar pessoas com diabetes ou restrições alimentares (como doença celíaca e intolerância à lactose) no monitoramento diário das suas rotinas de saúde. O objetivo do sistema é unificar a gestão de dieta, monitorização de treino, hidratação, sono e gamificação, oferecendo suporte avançado através de visão computacional.

## ✨ Funcionalidades Principais

### 1. Onboarding e Introdução
*   A tela de boas-vindas apresenta o WikiSugar como uma ferramenta "user friendly".
*   Oferece opções diretas para "Começar agora" ou logar em uma conta existente através de "Já tenho uma conta".

<p align="center">
  <img src="assets/captura 310.png" width="250" alt="Ecrã de Onboarding">
</p>

### 2. Dashboard Pessoal (Separador "Início")
*   **Acompanhamento de Gamificação:** Exibe as informações gerais do utilizador, como por exemplo, a contagem de dias consecutivos de acompanhamento (ex: "12 dias de cuidado seguido").
*   **Progresso Diário:** Mostra barras de progresso visual para as principais metas de saúde:
    *   **Calorias:** Total consumido em relação à meta diária.
    *   **Água:** Volume ingerido em relação à meta, contendo um botão rápido ("+ 250 mL") para facilitar novos registos.
    *   **Sono:** Horas dormidas comparadas à meta estabelecida.
*   **Lembretes:** Exibe alertas para a "Próxima refeição", indicando qual será e em que horário ocorrerá.
*   **Gestão de Metas:** Acesso direto à secção de "Meta pessoal" para revisão e ajustes dos objetivos.

<p align="center">
  <img src="assets/captura 311.png" width="250" alt="Dashboard Pessoal">
</p>

### 3. Registo Rápido (Separador "Diário")
*   Possui um formulário rápido, com a promessa de levar "menos de dois minutos para registrar", para centralizar os hábitos diários.
*   **Hidratação:** Campo para inserção direta da quantidade de água bebida em mililitros (mL).
*   **Sono:** Campo para inserir a quantidade de horas e minutos que o utilizador dormiu.
*   **Medicação:** Controlo para marcar se o utilizador tomou a sua medicação (botões "Sim" e "Não") e registar o horário exato.

<p align="center">
  <img src="assets/captura 314.png" width="250" alt="Ecrã de Registo Diário">
</p>

### 4. Planeamento Alimentar (Separador "Sua Dieta")
*   Visualização do plano do dia organizado de acordo com a rotina do utilizador.
*   Mostra o balanço de calorias planeadas (ex: "49% planejado").
*   Separação das refeições em blocos horários estruturados: Café da manhã, Almoço, Lanche / Pós-treino e Jantar.
*   Lista detalhada dos alimentos consumidos em cada refeição, incluindo gramaturas ou porções (ex: "Frango grelhado - 120 g", "Feijão carioca - 1 concha").
*   Opções interativas para "Editar" ou "+ Adicionar" alimentos em cada etapa da dieta.

<p align="center">
  <img src="assets/captura 313.png" width="250" alt="Ecrã de Planeamento Alimentar">
</p>

### 5. Busca Inteligente e Alertas de Saúde (Separador "Buscar")
*   Barra de pesquisa livre para encontrar alimentos pelo nome.
*   Secção de "Buscas recentes" para acesso rápido a alimentos consultados anteriormente.
*   **Análise Nutricional:** Informa ao utilizador que a busca revelará calorias e carboidratos dos alimentos.
*   **Alertas Personalizados:** O sistema cruza os alimentos procurados com as comorbilidades do utilizador (ex: disparando alertas se um alimento apresentar um alto índice glicémico para um diabético).

<p align="center">
  <img src="assets/captura 312.png" width="250" alt="Ecrã de Busca Inteligente">
</p>

### 6. Visão Computacional (Leitura de Rótulos)
*   Utiliza a câmara nativa do dispositivo para aceder a recursos de Visão Computacional, ajudando o utilizador a ler rótulos e a identificar componentes de alimentos.

## 🛠️ Arquitetura e Tecnologias

A solução baseia-se numa arquitetura Cliente-Servidor dividida em três camadas principais:

*   **Front-end (Camada de Apresentação):** Desenvolvido em React Native e Kotlin, com foco em performance nativa no Android, integrações vitais de acessibilidade (TalkBack) e otimização para captura de media.
*   **Back-end API REST (Camada de Negócios):** Construído em Java e Kotlin (Spring Boot), processa as lógicas críticas como validações nutricionais, gamificação, autenticação JWT e integrações. Utiliza também a API do FATSECRET (MVP) para procurar tabelas nutricionais.
*   **Base de Dados (Camada de Dados):** O sistema utiliza a base de dados relacional PostgreSQL (gerida via Amazon RDS) para assegurar conformidade ACID na gestão de tabelas nutricionais e dados clínicos.
*   **Infraestrutura Cloud (AWS):** O serviço utiliza múltiplos serviços da AWS, como o Amazon S3 para armazenar imagens de alimentos, Load Balancers, e ferramentas de IA (Amazon Rekognition/Textract) voltadas para a análise de imagens e extração de texto em rótulos.