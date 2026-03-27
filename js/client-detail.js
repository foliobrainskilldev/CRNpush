let currentClient = null;
let clientNotes =[];

document.addEventListener('DOMContentLoaded', () => {
    if (window.crmData && window.crmData.translations) {
        Object.assign(window.crmData.translations.en, {
            "clientDetail.back": "Back to Clients", "clientDetail.contactInfo": "Contact Information", "clientDetail.mainContact": "Main Contact",
            "clientDetail.emailAddress": "Email Address", "clientDetail.phoneNumber": "Phone Number", "clientDetail.documents": "Documents & Files",
            "clientDetail.dragDrop": "Drag & Drop files here", "clientDetail.timeline": "Activity Timeline", "clientDetail.activeDeals": "Active Deals",
            "clientDetail.pendingTasks": "Pending Tasks", "clientDetail.filterAll": "All", "clientDetail.filterNotes": "Notes",
            "clientDetail.filterEmails": "Emails", "clientDetail.filterCalls": "Calls", "clientDetail.notePlaceholder": "Write a note, log a call...",
            "clientDetail.typeNote": "Note", "clientDetail.typeEmail": "Email Sent", "clientDetail.typeCall": "Call Logged",
            "clientDetail.typeMeeting": "Meeting", "clientDetail.emptyDeals": "No active deals.", "clientDetail.emptyTasks": "No pending tasks.",
            "clientDetail.emptyHistory": "No history found."
        });

        Object.assign(window.crmData.translations.pt, {
            "clientDetail.back": "Voltar aos Clientes", "clientDetail.contactInfo": "Informação de Contacto", "clientDetail.mainContact": "Contacto Principal",
            "clientDetail.emailAddress": "Endereço de E-mail", "clientDetail.phoneNumber": "Número de Telefone", "clientDetail.documents": "Documentos e Ficheiros",
            "clientDetail.dragDrop": "Arraste ficheiros para aqui", "clientDetail.timeline": "Histórico de Atividades", "clientDetail.activeDeals": "Negócios Ativos",
            "clientDetail.pendingTasks": "Tarefas Pendentes", "clientDetail.filterAll": "Todos", "clientDetail.filterNotes": "Notas",
            "clientDetail.filterEmails": "E-mails", "clientDetail.filterCalls": "Chamadas", "clientDetail.notePlaceholder": "Escreva uma nota, registe uma chamada...",
            "clientDetail.typeNote": "Nota", "clientDetail.typeEmail": "E-mail Enviado", "clientDetail.typeCall": "Chamada Registada",
            "clientDetail.typeMeeting": "Reunião", "clientDetail.emptyDeals": "Sem negócios ativos.", "clientDetail.emptyTasks": "Sem tarefas pendentes.",
            "clientDetail.emptyHistory": "Nenhum histórico encontrado."
        });
        
        if (window.app) window.app.applyTranslations();
    }

    // Agora aguarda os componentes HTML serem injetados!
    window.addEventListener('componentsLoaded', initClientDetail);

    window.addEventListener('languageChanged', () => {
        if (currentClient) {
            loadRelatedData(currentClient.id);
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            renderTimeline(activeFilter);
        }
    });
});

async function initClientDetail() {
    window.showLoader();
    try {
        await new Promise(r => setTimeout(r, 400)); 
        
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = parseInt(urlParams.get('id'));

        if (!clientId) {
            window.location.href = 'clients.html';
            return;
        }

        const allClients = await window.db.getAllData('clients');
        currentClient = allClients.find(c => c.id === clientId);

        if (!currentClient) {
            alert('Cliente não encontrado.');
            window.location.href = 'clients.html';
            return;
        }

        populateClientInfo();
        loadRelatedData(clientId);
        initTimeline();
        initFileUpload();
        bindNotificationsPanel();

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
    } finally {
        window.hideLoader();
    }
}

function populateClientInfo() {
    document.getElementById('clientNameHeader').innerText = currentClient.name;
    document.getElementById('clientContact').innerText = currentClient.contact;
    document.getElementById('clientEmail').innerText = currentClient.email;
    document.getElementById('clientPhone').innerText = currentClient.phone || 'N/A';
    
    // Injeção do Avatar Unsplash no lugar das iniciais
    const avatarUrl = window.app.getUnsplashAvatar(currentClient.name, 'company');
    document.getElementById('clientInitials').innerHTML = `<img src="${avatarUrl}" alt="${currentClient.name}" style="width:100%; height:100%; object-fit:cover;">`;

    const badge = document.getElementById('clientStatusBadge');
    badge.innerText = currentClient.status;
    badge.className = 'badge';
    if (currentClient.status === 'Active') badge.classList.add('active');
    else if (currentClient.status === 'Inactive') badge.classList.add('inactive');
    else if (currentClient.status === 'VIP') badge.classList.add('vip');
}

async function loadRelatedData(clientId) {
    const allDeals = await window.db.getAllData('deals');
    const allTasks = await window.db.getAllData('tasks');
    const lang = window.app ? window.app.currentLang : 'en';
    const t = window.crmData.translations[lang];

    const clientDeals = allDeals.filter(d => d.clientId === clientId && d.stage !== 'Lost');
    const clientTasks = allTasks.filter(task => task.clientId === clientId && task.status === 'Pending');

    const dealsList = document.getElementById('clientDealsList');
    if (clientDeals.length === 0) {
        dealsList.innerHTML = `<li style="color:var(--text-muted); font-size:13px;">${t['clientDetail.emptyDeals']}</li>`;
    } else {
        dealsList.innerHTML = '';
        clientDeals.forEach(d => {
            dealsList.innerHTML += `
                <li>
                    <div><div class="mini-title">${d.title}</div><div class="mini-meta">${d.stage}</div></div>
                    <span style="color:var(--primary); font-weight:600;">$${d.value.toLocaleString()}</span>
                </li>`;
        });
    }

    const tasksList = document.getElementById('clientTasksList');
    if (clientTasks.length === 0) {
        tasksList.innerHTML = `<li style="color:var(--text-muted); font-size:13px;">${t['clientDetail.emptyTasks']}</li>`;
    } else {
        tasksList.innerHTML = '';
        clientTasks.forEach(task => {
            tasksList.innerHTML += `
                <li>
                    <div><div class="mini-title">${task.title}</div><div class="mini-meta">Due: ${task.dueDate}</div></div>
                    <span style="color:var(--danger); font-size:18px;"><span class="iconify" data-icon="ph:clock-fill"></span></span>
                </li>`;
        });
    }
}

/* =========================================================
   TIMELINE (NOTAS COM SIMULAÇÃO DE LOADER)
========================================================= */
function initTimeline() {
    clientNotes =[
        { id: 1, type: 'note', text: { en: 'Client showed interest in Q4 expansion.', pt: 'Cliente demonstrou interesse em expandir no Q4.' }, date: 'Today, 10:00 AM' },
        { id: 2, type: 'email', text: { en: 'Sent institutional presentation.', pt: 'Enviada apresentação institucional.' }, date: 'Yesterday, 14:30 PM' },
        { id: 3, type: 'call', text: { en: 'Technical alignment meeting held successfully.', pt: 'Reunião de alinhamento técnico realizada com sucesso.' }, date: 'Mar 10, 2026' }
    ];

    renderTimeline('all');

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            window.showLoader();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            await new Promise(r => setTimeout(r, 200)); 
            renderTimeline(e.target.getAttribute('data-filter'));
            window.hideLoader();
        });
    });

    document.getElementById('formAddNote').addEventListener('submit', async (e) => {
        e.preventDefault();
        window.showLoader(); 

        try {
            await new Promise(r => setTimeout(r, 600)); 
            
            const text = document.getElementById('newNoteText').value;
            const newEntry = { id: Date.now(), type: 'note', text: text, date: 'Just now' };
            clientNotes.unshift(newEntry);
            
            document.getElementById('newNoteText').value = '';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
            
            renderTimeline('all');

            if(window.showToast) {
                const lang = window.app ? window.app.currentLang : 'en';
                const msg = lang === 'pt' ? 'Nota adicionada com sucesso!' : 'Note added successfully!';
                window.showToast(msg, 'success');
            }

        } finally {
            window.hideLoader();
        }
    });
}

function renderTimeline(filter) {
    const container = document.getElementById('clientTimeline');
    container.innerHTML = '';

    const lang = window.app ? window.app.currentLang : 'en';
    const t = window.crmData.translations[lang];
    const filtered = filter === 'all' ? clientNotes : clientNotes.filter(n => n.type === filter);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; margin-top: 16px;">${t['clientDetail.emptyHistory']}</p>`;
        return;
    }

    filtered.forEach(note => {
        // Ícones definidos como -fill
        let iconName = 'ph:note-fill';
        let iconClass = 'icon-note';
        let typeLabel = t['clientDetail.typeNote'];

        if (note.type === 'email') { iconName = 'ph:envelope-simple-fill'; iconClass = 'icon-email'; typeLabel = t['clientDetail.typeEmail']; }
        if (note.type === 'call') { iconName = 'ph:phone-fill'; iconClass = 'icon-call'; typeLabel = t['clientDetail.typeCall']; }
        if (note.type === 'meeting') { iconName = 'ph:users-fill'; iconClass = 'icon-meeting'; typeLabel = t['clientDetail.typeMeeting']; }

        const displayText = typeof note.text === 'object' ? (note.text[lang] || note.text['en']) : note.text;

        container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-icon ${iconClass}"><span class="iconify" data-icon="${iconName}"></span></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span>${typeLabel}</span>
                        <span>${note.date}</span>
                    </div>
                    <div class="timeline-text">${displayText}</div>
                </div>
            </div>
        `;
    });
}

/* =========================================================
   SIMULAÇÃO DE UPLOAD COM SPINNER E ÍCONES CHEIOS
========================================================= */
function initFileUpload() {
    const dropZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');

    if(!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.style.borderColor = 'var(--primary)', false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.style.borderColor = 'var(--border)', false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', function() { handleFiles(this.files); });

    function handleDrop(e) { handleFiles(e.dataTransfer.files); }
    
    async function handleFiles(files) {
        if(files.length === 0) return;
        window.showLoader(); 
        
        try {
            await new Promise(r => setTimeout(r, 1000)); 
            ([...files]).forEach(uploadFile);
        } finally {
            window.hideLoader();
        }
    }

    function uploadFile(file) {
        let icon = 'ph:file-fill';
        if (file.type === 'application/pdf') icon = 'ph:file-pdf-fill';
        else if (file.type.includes('image')) icon = 'ph:file-image-fill';
        else if (file.type.includes('word')) icon = 'ph:file-text-fill';

        const sizeKB = (file.size / 1024).toFixed(1);

        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';
        fileDiv.innerHTML = `
            <span class="iconify" data-icon="${icon}" style="font-size:24px; color:var(--primary);"></span>
            <div style="flex:1;">
                <div style="color:var(--text-main); font-weight:600;">${file.name}</div>
                <div style="color:var(--text-muted); font-size:11px;">${sizeKB} KB • Just now</div>
            </div>
            <button class="btn-action" style="color:var(--danger); font-size:18px; border:none; background:transparent; cursor:pointer;" onclick="this.parentElement.remove()">
                <span class="iconify" data-icon="ph:trash-fill"></span>
            </button>
        `;
        fileList.prepend(fileDiv);
    }
}

/* =========================================================
   SISTEMA DE NOTIFICAÇÕES
========================================================= */
async function bindNotificationsPanel() {
    const btnNotif = document.getElementById('btnNotifications');
    const panelNotif = document.getElementById('notificationsPanel');
    const badgeNotif = document.getElementById('notifBadge');
    
    if(btnNotif) {
        btnNotif.addEventListener('click', (e) => { e.stopPropagation(); panelNotif.classList.toggle('active'); });
    }
    document.addEventListener('click', (e) => { if (panelNotif && !panelNotif.contains(e.target) && e.target !== btnNotif) panelNotif.classList.remove('active'); });

    const markBtn = document.getElementById('markAllReadBtn');
    if(markBtn) {
        markBtn.addEventListener('click', () => {
            if(badgeNotif) badgeNotif.classList.remove('show');
            if(window.showToast) window.showToast(window.app && window.app.currentLang === 'pt' ? "Notificações lidas." : "Notifications marked as read.", "info");
        });
    }

    await refreshNotificationsList();
}

async function refreshNotificationsList() {
    const list = document.getElementById('notifList');
    if(!list) return;
    const activities = await window.db.getAllData('activities');
    const lang = window.app ? window.app.currentLang : 'en';

    list.innerHTML = '';
    if(activities.length === 0) { list.innerHTML = `<li style="text-align:center; color:var(--text-muted);">No notifications</li>`; return; }

    const recent = activities.slice().reverse().slice(0, 5);
    recent.forEach(act => {
        const text = act.text[lang] || act.text['en'] || act.text; 
        list.innerHTML += `<li><strong style="color:var(--primary)">Update:</strong> ${text} <span>${act.date}</span></li>`;
    });
}