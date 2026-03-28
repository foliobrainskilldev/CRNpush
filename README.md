# 🚀 NexusCRM (CRNpush)

![NexusCRM Banner](https://via.placeholder.com/1200x400/4318ff/ffffff?text=NexusCRM+-+Modern+Vanilla+JS+CRM)

> Um painel de CRM (Customer Relationship Management) moderno, rápido e responsivo construído inteiramente com **Vanilla JavaScript**, **HTML5** e **CSS3**. Focado em alta performance, UI/UX premium e funcionamento *offline-first* utilizando **IndexedDB**.

[![GitHub license](https://img.shields.io/github/license/foliobrainskilldev/CRNpush?style=flat-square)](https://github.com/foliobrainskilldev/CRNpush/blob/main/LICENSE)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)]()
[![IndexedDB](https://img.shields.io/badge/Database-IndexedDB-4318ff?style=flat-square)]()

---

## ✨ Funcionalidades Principais

*   📊 **Dashboard Interativo:** Gráficos dinâmicos (Linhas, Barras e Doughnut) construídos com **D3.js** para análise de receitas, conversões e leads.
*   🗂️ **Gestão de Clientes e Leads:** Perfis detalhados, histórico de atividades (timeline), anotações e qualificação de prospectos.
*   🤝 **Funil de Vendas (Kanban):** Pipeline de negócios visual com funcionalidade de arrastar e soltar (*Drag & Drop*) usando **SortableJS**.
*   ✅ **Gestão de Tarefas:** Acompanhamento de tarefas diárias, prazos e prioridades (High, Medium, Low).
*   📦 **Catálogo de Produtos:** Registo de produtos e serviços com categorias e preços.
*   🌍 **Internacionalização (i18n):** Suporte nativo para troca de idiomas em tempo real (**Inglês** e **Português**).
*   🌗 **Temas (Light/Dark Mode):** Alternância instantânea entre modo claro e modo escuro 100% OLED, respeitando a preferência do sistema operacional.
*   💾 **Banco de Dados Local (Offline-First):** Todos os dados são guardados de forma segura no navegador usando **IndexedDB**, garantindo que a aplicação funciona mesmo sem internet.
*   📥 **Exportação e Backup:** 
    *   Exportação de tabelas individuais para **.CSV**.
    *   Sistema robusto de Backup (Exportação) e Restauro (Importação) de toda a base de dados em formato **.JSON**.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+ Vanilla)
*   **Armazenamento de Dados:**[IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via Wrapper customizado)
*   **Gráficos e Data Viz:** [D3.js (v7)](https://d3js.org/)
*   **Drag & Drop (Kanban):** [SortableJS](https://sortablejs.github.io/Sortable/)
*   **Ícones:** [Iconify](https://iconify.design/)
*   **Avatares Automáticos:** Imagens geradas dinamicamente via [Unsplash API](https://unsplash.com/).
*   **Servidor Local (Opcional/Dev):** Node.js & Express.

## 🚀 Como Executar o Projeto Localmente

Como o projeto faz requisições `fetch()` para carregar componentes dinâmicos (como a *Sidebar* e a *Topbar*), é necessário executá-lo através de um servidor local.

### Pré-requisitos
*   [Node.js](https://nodejs.org/) instalado na sua máquina.

### Instalação
1. Clone este repositório:
   ```bash
   git clone https://github.com/foliobrainskilldev/CRNpush.git
   cd CRNpush
2.Instale as dependências do servidor:
```bash
npm install
```
3.Inicie o servidor local:
```
npm start
```
4.Abra o seu navegador e aceda a:
```
http://localhost:3000
```
```
CRNpush/
│
├── components/          # Componentes HTML injetados via JS
│   ├── sidebar.html     # Menu de navegação lateral
│   └── topbar.html      # Barra superior (Busca, Idioma, Tema)
│
├── css/                 
│   └── style.css        # Estilos globais, variáveis CSS e Dark Mode
│
├── js/                  
│   ├── app.js           # Lógica principal, UI Utils, Inicialização
│   ├── db.js            # Wrapper do IndexedDB (CRUD Operations)
│   ├── data.js          # Seed inicial de dados falsos (Mock Data)
│   ├── dashboard.js     # Lógica dos gráficos (D3) e KPIs
│   ├── clients.js       # CRUD de Clientes
│   ├── client-detail.js # Timeline e Uploads do perfil do Cliente
│   ├── leads.js         # Gestão de Prospectos
│   ├── deals.js         # Lógica do Kanban Board
│   ├── tasks.js         # Gestão de Tarefas
│   ├── products.js      # CRUD de Produtos
│   └── settings.js      # Lógica de Backup/Restore JSON e Wipe Data
│
├── *.html               # Páginas da aplicação (index, clients, leads, etc.)
├── server.js            # Servidor Express básico para servir os ficheiros estáticos
├── package.json         # Dependências do Node.js
└── vercel.json          # Configuração para deploy na Vercel
```
🔒 Segurança e Arquitetura de Scripts

A base de código JavaScript deste projeto utiliza IIFE (Immediately Invoked Function Expressions) (() => { ... })(); para isolar o escopo das variáveis de cada página. Isso garante que não ocorrem conflitos de variáveis globais entre módulos (ex: tasks.js não colide com leads.js), resultando num carregamento de páginas limpo e livre de fugas de memória.

🤝Como Contribuir
Faça um Fork do projeto.
Crie a sua Feature Branch (git checkout -b feature/MinhaFuncionalidade).
Faça Commit das suas alterações (git commit -m 'Adiciona uma nova funcionalidade').
Faça Push para a branch (git push origin feature/MinhaFuncionalidade).
Abra um Pull Request.
📄 Licença
Este projeto está sob a licença ISC. Veja o ficheiro LICENSE para mais detalhes.
