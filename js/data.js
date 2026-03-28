window.crmData = {
    clients:[
        { id: 1, name: "Acme Corp", contact: "Alice Smith", email: "alice@acme.com", phone: "+1 555-0101", status: "Active", lastContact: "2026-03-20" },
        { id: 2, name: "Global Tech", contact: "Bob Jones", email: "bob@globaltech.com", phone: "+1 555-0102", status: "VIP", lastContact: "2026-03-25" },
        { id: 3, name: "Stark Industries", contact: "Tony Stark", email: "tony@stark.com", phone: "+1 555-0103", status: "Inactive", lastContact: "2026-02-15" }
    ],
    leads:[
        { id: 101, name: "Charlie Davis", company: "Wayne Enterprises", source: "Website", interest: "Premium Plan", status: "New", estimatedValue: 12000, email: "charlie@wayne.com", phone: "+1 555-0201" },
        { id: 102, name: "Diana Prince", company: "Themyscira Co", source: "Referral", interest: "Basic Plan", status: "Contacted", estimatedValue: 5000, email: "diana@themyscira.com", phone: "+1 555-0202" }
    ],
    deals:[
        { id: 201, title: "Q2 Software License", clientId: 1, value: 15000, stage: "Negotiation", probability: 60, closeDate: "2026-05-15" },
        { id: 202, title: "Server Upgrade", clientId: 2, value: 45000, stage: "Prospecting", probability: 20, closeDate: "2026-06-01" },
        { id: 203, title: "Annual Maintenance", clientId: 3, value: 8000, stage: "Won", probability: 100, closeDate: "2026-01-10" }
    ],
    tasks:[
        { id: 301, title: "Follow up call with Acme", clientId: 1, dueDate: "2026-03-30", priority: "High", status: "Pending" },
        { id: 302, title: "Send proposal to Wayne Ent", clientId: null, dueDate: "2026-04-02", priority: "Medium", status: "Pending" },
        { id: 303, title: "Onboarding Global Tech", clientId: 2, dueDate: "2026-03-15", priority: "Low", status: "Done" }
    ],
    activities:[
        { id: 401, date: "Today, 09:30 AM", text: { en: "Created new deal for Acme Corp", pt: "Criou novo negócio para a Acme Corp" } },
        { id: 402, date: "Yesterday, 14:15 PM", text: { en: "Completed task: Onboarding Global Tech", pt: "Concluiu a tarefa: Integração Global Tech" } },
        { id: 403, date: "Mar 25, 2026", text: { en: "Lead Qualified: Charlie Davis", pt: "Lead Qualificado: Charlie Davis" } }
    ],
    products:[
        { id: 501, name: "Nexus CRM Pro", sku: "NXC-PRO", category: "Software", price: 999.00, status: "Active", description: "Full CRM suite with advanced analytics." },
        { id: 502, name: "Cloud Storage 1TB", sku: "CS-1TB", category: "Service", price: 120.00, status: "Active", description: "Annual 1TB cloud storage subscription." }
    ],
    multiLineData:[
        { id: 1, monthEn: "Jan", monthPt: "Jan", "Acme Corp": 4000, "Global Tech": 2400, "Stark Industries": 2400 },
        { id: 2, monthEn: "Feb", monthPt: "Fev", "Acme Corp": 3000, "Global Tech": 1398, "Stark Industries": 2210 },
        { id: 3, monthEn: "Mar", monthPt: "Mar", "Acme Corp": 2000, "Global Tech": 9800, "Stark Industries": 2290 },
        { id: 4, monthEn: "Apr", monthPt: "Abr", "Acme Corp": 2780, "Global Tech": 3908, "Stark Industries": 2000 },
        { id: 5, monthEn: "May", monthPt: "Mai", "Acme Corp": 1890, "Global Tech": 4800, "Stark Industries": 2181 },
        { id: 6, monthEn: "Jun", monthPt: "Jun", "Acme Corp": 2390, "Global Tech": 3800, "Stark Industries": 2500 }
    ],
    barChartData:[
        { labelEn: "Website", labelPt: "Site", value: 120 },
        { labelEn: "Referral", labelPt: "Indicação", value: 85 },
        { labelEn: "Social", labelPt: "Social", value: 65 },
        { labelEn: "Ads", labelPt: "Anúncios", value: 45 },
        { labelEn: "Events", labelPt: "Eventos", value: 30 },
        { labelEn: "Cold Call", labelPt: "Contato", value: 15 }
    ],
    doughnutData:[
        { label: "Software", value: 45000 },
        { label: "Services", value: 25000 },
        { label: "Hardware", value: 15000 },
        { label: "Support", value: 10000 },
        { label: "Other", value: 5000 }
    ],
    translations: {
        en: {
            "app.title": "NexusCRM Dashboard", "app.processing": "Processing...", "sidebar.dashboard": "Dashboard", "sidebar.clients": "Clients",
            "sidebar.leads": "Leads", "sidebar.deals": "Deals", "sidebar.tasks": "Tasks", "sidebar.products": "Products",
            "topbar.search": "Search across CRM..."
        },
        pt: {
            "app.title": "NexusCRM Painel", "app.processing": "A Processar...", "sidebar.dashboard": "Painel Principal", "sidebar.clients": "Clientes",
            "sidebar.leads": "Prospectos", "sidebar.deals": "Negócios", "sidebar.tasks": "Tarefas", "sidebar.products": "Produtos",
            "topbar.search": "Pesquisar no CRM..."
        }
    }
};