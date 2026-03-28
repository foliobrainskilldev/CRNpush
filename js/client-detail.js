(() => {
    let currentClient = null;
    let clientNotes =[];

    document.addEventListener('DOMContentLoaded', () => {
        try {
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
        } catch(e) { console.error(e); }

        window.addEventListener('componentsLoaded', initClientDetail);

        window.addEventListener('languageChanged', () => {
            if (currentClient && document.getElementById('clientNameHeader')) {
                loadRelatedData(currentClient.id);
                const activeFilterBtn = document.querySelector('.filter-btn.active');
                if (activeFilterBtn) {
                    renderTimeline(activeFilterBtn.getAttribute('data-filter'));
                }
            }
        });
        
        setTimeout(() => { if (window.hideLoader) window.hideLoader(); }, 2500);
    });

    async function initClientDetail() {
        if (!document.getElementById('clientNameHeader')) return;

        if (window.showLoader) window.showLoader();
        try {
            await new Promise(r => setTimeout(r, 400)); 
            
            const urlParams = new URLSearchParams(window.location.search);
            const clientId = parseInt(urlParams.get('id'));

            if (!clientId) {
                window.location.href = 'clients.html';
                return;
            }

            let allClients =[];
            if (window.db) {
                allClients = await window.db.getAllData('clients') ||[];
            }
            
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

        } catch (error) {
            console.error("Erro ao carregar detalhes do cliente:", error);
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    }

    function populateClientInfo() {
        document.getElementById('clientNameHeader').innerText = currentClient.name;
        document.getElementById('clientContact').innerText = currentClient.contact;
        document.getElementById('clientEmail').innerText = currentClient.email;
        document.getElementById('clientPhone').innerText = currentClient.phone || 'N/A';
        
        const avatarUrl = window.app ? window.app.getUnsplashAvatar(currentClient.name, 'company') : '';
        document.getElementById('clientInitials').innerHTML = `<img src="${avatarUrl}" alt="${currentClient.name}" style="width:100%; height:100%; object-fit:cover;">`;

        const badge = document.getElementById('clientStatusBadge');
        if (badge) {
            badge.innerText = currentClient.status;
            badge.className = 'badge';
            if (currentClient.status === 'Active') badge.classList.add('active');
            else if (currentClient.status === 'Inactive') badge.classList.add('inactive');
            else if (currentClient.status === 'VIP') badge.classList.add('vip');
        }
    }

    async function loadRelatedData(clientId) {
        let allDeals =[];
        let allTasks =[];
        
        if (window.db) {
            allDeals = await window.db.getAllData('deals') ||[];
            allTasks = await window.db.getAllData('tasks') ||[];
        }
        
        const lang = window.app ? window.app.currentLang : 'en';
        const t = (window.crmData && window.crmData.translations) ? window.crmData.translations[lang] : {};

        const clientDeals = allDeals.filter(d => d.clientId === clientId && d.stage !== 'Lost');
        const clientTasks = allTasks.filter(task => task.clientId === clientId && task.status === 'Pending');

        const dealsList = document.getElementById('clientDealsList');
        if (dealsList) {
            if (clientDeals.length === 0) {
                dealsList.innerHTML = `<li style="color:var(--text-muted); font-size:13px;">${t['clientDetail.emptyDeals'] || 'No active deals.'}</li>`;
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
        }

        const tasksList = document.getElementById('clientTasksList');
        if (tasksList) {
            if (clientTasks.length === 0) {
                tasksList.innerHTML = `<li style="color:var(--text-muted); font-size:13px;">${t['clientDetail.emptyTasks'] || 'No pending tasks.'}</li>`;
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
    }

    function initTimeline() {
        clientNotes =[
            { id: 1, type: 'note', text: { en: 'Client showed interest in Q4 expansion.', pt: 'Cliente demonstrou interesse em expandir no Q4.' }, date: 'Today, 10:00 AM' },
            { id: 2, type: 'email', text: { en: 'Sent institutional presentation.', pt: 'Enviada apresentação institucional.' }, date: 'Yesterday, 14:30 PM' },
            { id: 3, type: 'call', text: { en: 'Technical alignment meeting held successfully.', pt: 'Reunião de alinhamento técnico realizada com sucesso.' }, date: 'Mar 10, 2026' }
        ];

        renderTimeline('all');

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(window.showLoader) window.showLoader();
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                await new Promise(r => setTimeout(r, 200)); 
                renderTimeline(e.target.getAttribute('data-filter'));
                if(window.hideLoader) window.hideLoader();
            });
        });

        const formAddNote = document.getElementById('formAddNote');
        if (formAddNote) {
            formAddNote.addEventListener('submit', async (e) => {
                e.preventDefault();
                if(window.showLoader) window.showLoader(); 

                try {
                    await new Promise(r => setTimeout(r, 600)); 
                    
                    const text = document.getElementById('newNoteText').value;
                    const newEntry = { id: Date.now(), type: 'note', text: text, date: 'Just now' };
                    clientNotes.unshift(newEntry);
                    
                    document.getElementById('newNoteText').value = '';
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
                    if(allBtn) allBtn.classList.add('active');
                    
                    renderTimeline('all');

                    if(window.showToast) {
                        const lang = window.app ? window.app.currentLang : 'en';
                        const msg = lang === 'pt' ? 'Nota adicionada com sucesso!' : 'Note added successfully!';
                        window.showToast(msg, 'success');
                    }
                } finally {
                    if(window.hideLoader) window.hideLoader();
                }
            });
        }
    }

    function renderTimeline(filter) {
        const container = document.getElementById('clientTimeline');
        if (!container) return;
        container.innerHTML = '';

        const lang = window.app ? window.app.currentLang : 'en';
        const t = (window.crmData && window.crmData.translations) ? window.crmData.translations[lang] : {};
        const filtered = filter === 'all' ? clientNotes : clientNotes.filter(n => n.type === filter);

        if (filtered.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; margin-top: 16px;">${t['clientDetail.emptyHistory'] || 'No history found.'}</p>`;
            return;
        }

        filtered.forEach(note => {
            let iconName = 'ph:note-fill';
            let iconClass = 'icon-note';
            let typeLabel = t['clientDetail.typeNote'] || 'Note';

            if (note.type === 'email') { iconName = 'ph:envelope-simple-fill'; iconClass = 'icon-email'; typeLabel = t['clientDetail.typeEmail'] || 'Email'; }
            if (note.type === 'call') { iconName = 'ph:phone-fill'; iconClass = 'icon-call'; typeLabel = t['clientDetail.typeCall'] || 'Call'; }
            if (note.type === 'meeting') { iconName = 'ph:users-fill'; iconClass = 'icon-meeting'; typeLabel = t['clientDetail.typeMeeting'] || 'Meeting'; }

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

    function initFileUpload() {
        const dropZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');

        if(!dropZone || !fileInput) return;

        dropZone.addEventListener('click', () => fileInput.click());
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
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
            if(window.showLoader) window.showLoader(); 
            
            try {
                await new Promise(r => setTimeout(r, 1000)); 
                ([...files]).forEach(uploadFile);
            } finally {
                if(window.hideLoader) window.hideLoader();
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
            if (fileList) fileList.prepend(fileDiv);
        }
    }
})();