# 🍎 WikiSugar

# GRUPO:
* Helena Victoria
* Lucas Ribeiro
* Pablo Felipe
* Pedro Alves
* Vinícius Mergulhão

## 📖 Sobre o Projeto
O WikiSugar é uma aplicação web/mobile projetada para auxiliar pessoas com diabetes ou restrições alimentares (como doença celíaca e intolerância à lactose) no monitoramento diário de suas rotinas de saúde. O objetivo do sistema é unificar a gestão de dieta, monitoramento de treino, hidratação, sono e gamificação, oferecendo suporte avançado através de visão computacional.

## ✨ Funcionalidades Principais

### 1. Onboarding e Introdução
*   A tela de boas-vindas apresenta o WikiSugar como uma forma de tornar o "cuidado diário, mais simples".
*   Permite aos usuários acompanhar alimentação, água, sono e hábitos com tranquilidade.
*   Oferece opções diretas para "Começar agora" ou acessar uma conta existente ("Já tenho uma conta").

### 2. Dashboard Pessoal (Aba "Início")
*   **Acompanhamento de Gamificação:** Exibe a ofensiva do usuário, como por exemplo, a contagem de dias consecutivos de acompanhamento (ex: "12 dias de cuidado seguido").
*   **Progresso Diário:** Mostra barras de progresso visual para as principais metas de saúde:
    *   **Calorias:** Total consumido em relação à meta diária.
    *   **Água:** Volume ingerido em relação à meta, contendo um botão rápido ("+ 250 mL") para facilitar novos registros.
    *   **Sono:** Horas dormidas comparadas à meta estabelecida.
*   **Lembretes:** Exibe alertas para a "Próxima refeição", indicando qual será e em que horário ocorrerá.
*   **Gestão de Metas:** Acesso direto à seção de "Meta pessoal" para revisão e ajustes dos objetivos.

### 3. Registro Rápido (Aba "Diário")
*   Possui um formulário rápido (com a promessa de levar "menos de dois minutos para registrar") para centralizar os hábitos diários.
*   **Hidratação:** Campo para inserção direta da quantidade de água bebida em mililitros (mL).
*   **Sono:** Campo para inserir a quantidade de horas e minutos que o usuário dormiu.
*   **Medicação:** Controle para marcar se o usuário tomou sua medicação (botões "Sim" e "Não") e registrar o horário exato.

### 4. Planejamento Alimentar (Aba "Sua Dieta")
*   Visualização do plano do dia organizado de acordo com a rotina do usuário.
*   Mostra o balanço de calorias planejadas (ex: "49% planejado").
*   Separação das refeições em blocos horários estruturados: Café da manhã, Almoço, Lanche / Pós-treino e Jantar.
*   Lista detalhada dos alimentos consumidos em cada refeição, incluindo gramaturas ou porções (ex: "Frango grelhado - 120 g", "Feijão carioca - 1 concha").
*   Opções interativas para "Editar" ou "+ Adicionar" alimentos em cada etapa da dieta.

### 5. Busca Inteligente e Alertas de Saúde (Aba "Buscar")
*   Barra de pesquisa livre para encontrar alimentos pelo nome.
*   Seção de "Buscas recentes" para acesso rápido a alimentos consultados anteriormente.
*   **Análise Nutricional:** Informa ao usuário que a busca revelará calorias e carboidratos dos alimentos.
*   **Alertas Personalizados:** O sistema cruza os alimentos buscados com as comorbidades do usuário logado (ex: disparando alertas se um alimento apresentar alto índice glicêmico para um diabético).

### 6. Visão Computacional (Leitura de Rótulos)
*   Utiliza a câmera nativa do dispositivo para acessar recursos de Visão Computacional, ajudando o usuário a ler rótulos e identificar componentes de alimentos.

## 🛠️ Arquitetura e Tecnologias

A solução é baseada em uma arquitetura Cliente-Servidor dividida em três camadas principais:

*   **Front-end (Camada de Apresentação):** Desenvolvido em React Native e Kotlin, com foco em performance nativa no Android, integrações vitais de acessibilidade (TalkBack) e otimização para captura de mídia.
*   **Back-end API REST (Camada de Negócios):** Construído em Java e Kotlin (Spring Boot), processa as lógicas críticas como validações nutricionais, gamificação, autenticação JWT e integrações. Utiliza também a API do FATSECRET (MVP) para buscar tabelas nutricionais.
*   **Banco de Dados (Camada de Dados):** O sistema utiliza o banco relacional PostgreSQL (gerenciado via Amazon RDS) para assegurar conformidade ACID na gestão de tabelas nutricionais e dados clínicos.
*   **Infraestrutura Cloud (AWS):** O serviço utiliza múltiplos serviços da AWS, como o Amazon S3 para armazenar imagens de alimentos, Load Balancers, e ferramentas de IA (Amazon Rekognition/Textract) voltadas à análise de imagens e extração de texto em rótulos.
