
window.crmData = {
    translations: {
        en: {
            "app.processing": "Processing...",
            "app.title": "CRM Dashboard",
            "sidebar.dashboard": "Dashboard",
            "sidebar.clients": "Clients",
            "sidebar.leads": "Leads",
            "sidebar.deals": "Deals",
            "sidebar.tasks": "Tasks",
            "sidebar.products": "Products",
            "sidebar.settings": "Settings",
            "topbar.search": "Search...",
            "dashboard.greeting": "Welcome back, John",
            "dashboard.subtitle": "Here is what's happening today.",
            "dashboard.addDeal": "Create Deal",
            "dashboard.kpi.clients": "Total Clients",
            "dashboard.kpi.leads": "New Leads",
            "dashboard.kpi.deals": "Active Deals",
            "dashboard.kpi.revenue": "Revenue",
            "dashboard.kpi.tasks": "Pending Tasks",
            "dashboard.kpi.winRate": "Win Rate",
            "dashboard.chartTitle": "Client Revenue Evolution",
            "dashboard.doughnutTitle": "Deals Volume",
            "dashboard.barChartTitle": "Leads by Source",
            "dashboard.upcomingTasks": "Upcoming Tasks",
            "dashboard.recentActivity": "Recent Activity"
        },
        pt: {
            "app.processing": "Processando...",
            "app.title": "Painel CRM",
            "sidebar.dashboard": "Painel",
            "sidebar.clients": "Clientes",
            "sidebar.leads": "Prospectos",
            "sidebar.deals": "Negócios",
            "sidebar.tasks": "Tarefas",
            "sidebar.products": "Produtos",
            "sidebar.settings": "Configurações",
            "topbar.search": "Buscar...",
            "dashboard.greeting": "Bem-vindo de volta, João",
            "dashboard.subtitle": "Aqui está o resumo de hoje.",
            "dashboard.addDeal": "Criar Negócio",
            "dashboard.kpi.clients": "Total de Clientes",
            "dashboard.kpi.leads": "Novos Prospectos",
            "dashboard.kpi.deals": "Negócios Ativos",
            "dashboard.kpi.revenue": "Faturamento",
            "dashboard.kpi.tasks": "Tarefas Pendentes",
            "dashboard.kpi.winRate": "Taxa de Sucesso",
            "dashboard.chartTitle": "Evolução de Negócios por Cliente",
            "dashboard.doughnutTitle": "Volume de Negócios",
            "dashboard.barChartTitle": "Prospectos por Origem",
            "dashboard.upcomingTasks": "Próximas Tarefas",
            "dashboard.recentActivity": "Atividades Recentes"
        }
    },

    clients:[
        { id: 1, name: "Acme Corp", contact: "Alice Smith", email: "alice@acme.com", phone: "+1 555-0101", status: "Active", lastContact: "2026-03-20" },
        { id: 2, name: "Globex", contact: "Bob Jones", email: "bob@globex.com", phone: "+1 555-0102", status: "VIP", lastContact: "2026-03-22" },
        { id: 3, name: "Soylent", contact: "Carol White", email: "carol@soylent.com", phone: "+1 555-0103", status: "Inactive", lastContact: "2026-02-15" },
        { id: 4, name: "TechCorp", contact: "Dan Black", email: "dan@techcorp.com", phone: "+1 555-0104", status: "Active", lastContact: "2026-03-23" },
        { id: 5, name: "InnoSystems", contact: "Eva Green", email: "eva@inno.com", phone: "+1 555-0105", status: "VIP", lastContact: "2026-03-24" },
        { id: 6, name: "BlueSky", contact: "Frank Ocean", email: "frank@bluesky.com", phone: "+1 555-0106", status: "Active", lastContact: "2026-03-20" },
        { id: 7, name: "RedOcean", contact: "Grace Lee", email: "grace@redocean.com", phone: "+1 555-0107", status: "Inactive", lastContact: "2026-01-10" },
        { id: 8, name: "GreenLeaf", contact: "Hank Hill", email: "hank@greenleaf.com", phone: "+1 555-0108", status: "Active", lastContact: "2026-03-18" }
    ],

    leads:[
        { id: 1, name: "Dave Brown", company: "Initech", source: "Website", interest: "Pro Plan", status: "New", estimatedValue: 5000, email: "dave@initech.com", phone: "+1 555-9000" },
        { id: 2, name: "Eve Davis", company: "Umbrella", source: "Referral", interest: "Enterprise", status: "Contacted", estimatedValue: 15000, email: "eve@umbrella.com", phone: "+1 555-9001" }
    ],

    deals:[
        { id: 1, title: "Acme Q1 Expansion", clientId: 1, value: 12000, stage: "Negotiation", probability: 80, closeDate: "2026-04-15" },
        { id: 2, title: "Globex Licensing", clientId: 2, value: 45000, stage: "Won", probability: 100, closeDate: "2026-03-10" },
        { id: 3, title: "Soylent Renewal", clientId: 3, value: 8500, stage: "Prospecting", probability: 30, closeDate: "2026-05-01" },
        { id: 4, title: "TechCorp APIs", clientId: 4, value: 18000, stage: "Negotiation", probability: 60, closeDate: "2026-04-20" },
        { id: 5, title: "Inno Servers", clientId: 5, value: 35000, stage: "Won", probability: 100, closeDate: "2026-03-01" }
    ],

    tasks:[
        { id: 1, title: "Call Alice regarding Q1 Expansion", clientId: 1, priority: "High", dueDate: "2026-03-25", status: "Pending" },
        { id: 2, title: "Send proposal to Dave", clientId: null, priority: "Medium", dueDate: "2026-03-26", status: "Pending" },
        { id: 3, title: "Review contract for Globex", clientId: 2, priority: "High", dueDate: "2026-03-24", status: "Done" }
    ],

    products:[
        { id: 1, name: "Nexus Pro Subscription", sku: "NEX-PRO-01", category: "Software", price: 499.00, status: "Active", description: "Monthly SaaS subscription for Pro users." },
        { id: 2, "name": "Dedicated Server", "sku": "HW-SRV-99", "category": "Hardware", "price": 2500.00, "status": "Active", "description": "High performance dedicated hosting server." },
        { id: 3, "name": "API Access (Enterprise)", "sku": "NEX-API-ENT", "category": "Software", "price": 999.00, "status": "Draft", "description": "Unlimited API requests for enterprise clients." },
        { id: 4, "name": "Consulting Setup", "sku": "SRV-CON-01", "category": "Service", "price": 150.00, "status": "Active", "description": "Hourly consulting rate for custom setup." }
    ],

    activities:[
        { id: 1, date: "Just now", text: { en: "You closed the Inno Servers deal.", pt: "Você fechou o negócio Inno Servers." } },
        { id: 2, date: "2 hours ago", text: { en: "Eva Green updated her contact info.", pt: "Eva Green atualizou suas informações de contato." } },
        { id: 3, date: "Yesterday", text: { en: "New lead Dave Brown registered.", pt: "Novo prospecto Dave Brown registrado." } }
    ],

    multiLineData:[
        { monthEn: "Jan", monthPt: "Jan", "Acme": 5000, "Globex": 8000, "TechCorp": 2000, "Inno": 0 },
        { monthEn: "Feb", monthPt: "Fev", "Acme": 12000, "Globex": 15000, "TechCorp": 8000, "Inno": 12000 },
        { monthEn: "Mar", monthPt: "Mar", "Acme": 17000, "Globex": 45000, "TechCorp": 15000, "Inno": 28000 },
        { monthEn: "Apr", monthPt: "Abr", "Acme": 22000, "Globex": 48000, "TechCorp": 22000, "Inno": 35000 }
    ],

    barChartData:[
        { labelEn: "Website", labelPt: "Site", value: 65 },
        { labelEn: "Referral", labelPt: "Indicação", value: 45 },
        { labelEn: "Social", labelPt: "Social", value: 30 },
        { labelEn: "Ads", labelPt: "Anúncios", value: 25 },
        { labelEn: "Events", labelPt: "Eventos", value: 15 },
        { labelEn: "Cold Call", labelPt: "Contato", value: 10 }
    ],

    doughnutData:[
        { label: "Globex", value: 45000 },
        { label: "InnoSys", value: 35000 },
        { label: "TechCorp", value: 18000 },
        { label: "Acme", value: 12000 },
        { label: "Soylent", value: 8500 }
    ]
};