let allClients =[];

if (window.db && typeof window.db.deleteItem !== 'function') {
    window.db.deleteItem = function(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.instance.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.crmData && window.crmData.translations) {
        Object.assign(window.crmData.translations.en, {
            "clients.title": "Clients Directory", "clients.addBtn": "Add Client", "clients.searchPlaceholder": "Search by name or company...",
            "clients.filterAll": "All Statuses", "clients.filterActive": "Active", "clients.filterInactive": "Inactive", "clients.filterVIP": "VIP",
            "clients.colCompany": "Company / Name", "clients.colContact": "Main Contact", "clients.colEmail": "Email", "clients.colStatus": "Status"
        });
        Object.assign(window.crmData.translations.pt, {
            "clients.title": "Diretório de Clientes", "clients.addBtn": "Adicionar Cliente", "clients.searchPlaceholder": "Buscar por nome ou empresa...",
            "clients.filterAll": "Todos os Status", "clients.filterActive": "Ativo", "clients.filterInactive": "Inativo", "clients.filterVIP": "VIP",
            "clients.colCompany": "Empresa / Nome", "clients.colContact": "Contato Principal", "clients.colEmail": "E-mail", "clients.colStatus": "Status"
        });
        if (window.app) window.app.applyTranslations();
    }

    // Agora aguarda os componentes HTML serem injetados!
    window.addEventListener('componentsLoaded', initClients); 
});

async function initClients() {
    window.showLoader();
    try {
        await new Promise(r => setTimeout(r, 400)); 
        allClients = await window.db.getAllData('clients');
        
        renderClients(allClients);
        bindFilters();
        bindCrudModal();
        bindExportCSVModal();
        bindNotificationsPanel();

        // INTEGRAÇÃO COM A PESQUISA GLOBAL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            const searchInput = document.getElementById('searchClient');
            if(searchInput) {
                searchInput.value = searchQuery;
                applyFilters(searchQuery, 'All', false);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
    } finally {
        window.hideLoader();
    }
}

/* =========================================================
   SISTEMA DE DROPDOWNS CUSTOMIZADOS
========================================================= */
function initCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const header = dropdown.querySelector('.dropdown-header');
        const list = dropdown.querySelector('.dropdown-list');
        
        const newHeader = header.cloneNode(true);
        header.replaceWith(newHeader);

        newHeader.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-list').forEach(l => {
                if (l !== list) l.classList.remove('show');
            });
            list.classList.toggle('show');
        };

        const items = list.querySelectorAll('div');
        items.forEach(item => {
            const newItem = item.cloneNode(true);
            item.replaceWith(newItem);

            newItem.onclick = (e) => {
                e.stopPropagation();
                const value = newItem.getAttribute('data-value');
                const text = newItem.innerText;
                
                newHeader.querySelector('span:first-child').innerText = text;
                list.classList.remove('show');
                dropdown.setAttribute('data-current-value', value);

                const hiddenInputId = dropdown.id.replace('Dropdown', '');
                const hiddenInput = document.getElementById(hiddenInputId);
                if(hiddenInput) hiddenInput.value = value;

                const event = new CustomEvent('dropdownChange', { detail: { value, text } });
                dropdown.dispatchEvent(event);
            };
        });
    });

    document.removeEventListener('click', closeAllDropdowns);
    document.addEventListener('click', closeAllDropdowns);
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-list').forEach(l => l.classList.remove('show'));
}

/* =========================================================
   MODAL DE CONFIRMAÇÃO E TOASTS
========================================================= */
window.customConfirm = function(message, title = "Confirm", isPt = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        if (!modal) return resolve(false);

        document.getElementById('confirmTitle').innerText = title;
        document.getElementById('confirmMessage').innerText = message;
        
        const btnCancel = document.getElementById('btnConfirmCancel');
        const btnAccept = document.getElementById('btnConfirmAccept');
        
        btnCancel.innerText = isPt ? "Cancelar" : "Cancel";
        btnAccept.innerText = isPt ? "Eliminar" : "Delete";

        modal.classList.add('active');

        const cleanup = () => {
            btnCancel.onclick = null;
            btnAccept.onclick = null;
            modal.classList.remove('active');
        };

        btnCancel.onclick = () => { cleanup(); resolve(false); };
        btnAccept.onclick = () => { cleanup(); resolve(true); };
    });
};

window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ph:check-circle-fill';
    let iconColor = 'var(--success)';
    
    if (type === 'error') { icon = 'ph:warning-circle-fill'; iconColor = 'var(--danger)'; } 
    else if (type === 'info') { icon = 'ph:info-fill'; iconColor = 'var(--info)'; }
    else if (type === 'warning') { icon = 'ph:warning-fill'; iconColor = 'var(--warning)'; }

    toast.innerHTML = `<span class="iconify toast-icon" data-icon="${icon}" style="color:${iconColor}"></span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
};

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
            showToast(window.app.currentLang === 'pt' ? "Notificações lidas." : "Notifications marked as read.", "info");
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
function addNotificationTrigger() {
    const badge = document.getElementById('notifBadge');
    if(badge) badge.classList.add('show');
    refreshNotificationsList();
}

/* =========================================================
   EXPORTAR CSV VIA MODAL (DRAWER)
========================================================= */
function bindExportCSVModal() {
    const btnOpenExport = document.getElementById('btnExportClientsCSV');
    const modalExport = document.getElementById('exportCsvModal');
    const btnCloseExport = document.getElementById('closeExportModal');
    const btnCancelExport = document.getElementById('cancelExportBtn');
    const btnConfirmExport = document.getElementById('confirmExportBtn');
    const inputFileName = document.getElementById('csvFileNameInput');

    if (!btnOpenExport || !modalExport) return;

    const closeModal = () => modalExport.classList.remove('active');
    btnCloseExport.onclick = closeModal;
    btnCancelExport.onclick = closeModal;

    btnOpenExport.addEventListener('click', () => {
        if (allClients.length === 0) return showToast("No data available to export.", "warning");

        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('exportModalText').innerText = lang === 'pt' ? "Defina o nome do seu arquivo para baixar os clientes:" : "Name your file to save your clients data offline:";
        btnCancelExport.innerText = lang === 'pt' ? "Cancelar" : "Cancel";

        inputFileName.value = `NexusCRM_Clients_${new Date().toISOString().split('T')[0]}`;
        modalExport.classList.add('active');
    });

    btnConfirmExport.onclick = async () => {
        const lang = window.app ? window.app.currentLang : 'en';
        let fileName = inputFileName.value.trim() || 'NexusCRM_Data';
        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';

        window.showLoader(); 

        await new Promise(r => setTimeout(r, 700));

        const headers =["ID", "Company / Name", "Contact", "Email", "Phone", "Status", "Last Contact"];
        const csvRows =[headers.join(',')]; 

        allClients.forEach(client => {
            const values =[
                client.id || '',
                `"${(client.name || '').replace(/"/g, '""')}"`,
                `"${(client.contact || '').replace(/"/g, '""')}"`,
                `"${(client.email || '').replace(/"/g, '""')}"`,
                `"${(client.phone || '').replace(/"/g, '""')}"`,
                `"${client.status || ''}"`,
                `"${client.lastContact || ''}"`
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);

        closeModal();
        window.hideLoader();
        setTimeout(() => showToast(lang === 'pt' ? "Exportação iniciada com sucesso!" : "Export started successfully!", "success"), 200);
    };
}

/* =========================================================
   RENDERIZAÇÃO DA TABELA 
========================================================= */
function renderClients(clientsToRender) {
    const tbody = document.getElementById('clientsTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const lang = window.app ? window.app.currentLang : 'en';

    if (clientsToRender.length === 0) {
        const emptyMsg = lang === 'pt' ? "Nenhum cliente encontrado na sua base." : "No clients found. Start adding some!";
        tbody.innerHTML = `<tr><td colspan="5"><div style="text-align:center; padding:64px 16px; color:var(--text-muted);"><span class="iconify" data-icon="ph:folder-open-fill" style="font-size:64px; color:var(--border); margin-bottom:16px;"></span><p style="font-weight:500; font-size:15px;">${emptyMsg}</p></div></td></tr>`;
        return;
    }

    clientsToRender.forEach(client => {
        const tr = document.createElement('tr');
        tr.onclick = () => viewClient(client.id);
        
        let badgeClass = 'active';
        if (client.status === 'Inactive') badgeClass = 'inactive';
        if (client.status === 'VIP') badgeClass = 'vip';

        let displayStatus = client.status;
        if(lang === 'pt'){
            if(displayStatus === 'Active') displayStatus = 'Ativo';
            if(displayStatus === 'Inactive') displayStatus = 'Inativo';
        }

        tr.innerHTML = `
            <td>
                <div class="company-cell">
                    <div class="company-avatar">
                        <img src="${window.app.getUnsplashAvatar(client.name, 'company')}" alt="Logo">
                    </div>
                    <div style="font-weight: 600;">${client.name || '--'}</div>
                </div>
            </td>
            <td>${client.contact || '--'}</td>
            <td>${client.email || '--'}</td>
            <td><span class="badge ${badgeClass}">${displayStatus || '--'}</span></td>
            <td class="actions-cell">
                <button class="btn-action" title="Edit Client" onclick="editClient(event, '${client.id}')"><span class="iconify" data-icon="ph:pencil-simple-fill"></span></button>
                <button class="btn-action delete" title="Delete Client" onclick="deleteClient(event, '${client.id}')"><span class="iconify" data-icon="ph:trash-fill"></span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.viewClient = function(id) {
    window.location.href = `client-detail.html?id=${id}`;
};

/* =========================================================
   EXCLUSÃO COM LOADER
========================================================= */
window.deleteClient = async function(event, id) {
    event.stopPropagation(); 
    const lang = window.app ? window.app.currentLang : 'en';
    const isPt = lang === 'pt';
    
    const userConfirmed = await customConfirm(
        isPt ? "Tem a certeza que deseja eliminar este cliente e os seus dados?" : "Are you sure you want to completely remove this client and their data?",
        isPt ? "Remover Cliente" : "Delete Client", isPt
    );
    
    if (userConfirmed) {
        window.showLoader(); 
        try {
            await new Promise(r => setTimeout(r, 400));
            const targetId = isNaN(id) ? id : Number(id);
            await window.db.deleteItem('clients', targetId); 
            allClients = allClients.filter(c => String(c.id) !== String(id)); 
            
            showToast(isPt ? "Cliente eliminado do sistema." : "Client deleted from system.", "success");
            applyFilters(document.getElementById('searchClient').value, document.getElementById('statusFilterDropdown').getAttribute('data-current-value'));
        } catch(e) {
            console.error(e);
            showToast("Failed to delete client.", "error");
        } finally {
            window.hideLoader();
        }
    }
};

/* =========================================================
   MODAL CRUD
========================================================= */
window.editClient = function(event, id) {
    event.stopPropagation();
    const client = allClients.find(c => String(c.id) === String(id));
    if (!client) return;

    document.getElementById('hiddenClientId').value = client.id;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientContact').value = client.contact || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    
    document.getElementById('clientStatus').value = client.status || 'Active';
    document.getElementById('clientStatusDropdown').querySelector('span:first-child').innerText = client.status || 'Active';
    document.getElementById('clientStatusDropdown').setAttribute('data-current-value', client.status || 'Active');

    const lang = window.app ? window.app.currentLang : 'en';
    document.getElementById('clientModalTitle').innerHTML = `<span class="iconify" data-icon="ph:pencil-simple-fill"></span> ${lang === 'pt' ? 'Editar Perfil' : 'Edit Profile'}`;
    
    document.getElementById('crudClientModal').classList.add('active');
};

function bindCrudModal() {
    const modal = document.getElementById('crudClientModal');
    const form = document.getElementById('formCreateClient');
    const btnOpen = document.getElementById('btnOpenAddClient');
    if(!btnOpen || !modal || !form) return;

    btnOpen.addEventListener('click', () => {
        form.reset();
        document.getElementById('hiddenClientId').value = ''; 
        
        document.getElementById('clientStatus').value = 'Active';
        document.getElementById('clientStatusDropdown').querySelector('span:first-child').innerText = 'Active';
        document.getElementById('clientStatusDropdown').setAttribute('data-current-value', 'Active');

        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('clientModalTitle').innerHTML = `<span class="iconify" data-icon="ph:buildings-fill"></span> ${lang === 'pt' ? 'Criar Novo Cliente' : 'Add New Client'}`;
        
        modal.classList.add('active');
    });
    
    const closeModal = () => { modal.classList.remove('active'); form.reset(); };
    document.getElementById('closeClientModal').addEventListener('click', closeModal);
    document.getElementById('cancelClientBtn').addEventListener('click', closeModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.showLoader(); 

        const isEditing = document.getElementById('hiddenClientId').value !== '';
        const targetId = isEditing ? parseInt(document.getElementById('hiddenClientId').value) : Date.now();
        const currentClientData = isEditing ? allClients.find(c => String(c.id) === String(targetId)) : null;
        
        const clientData = {
            id: targetId,
            name: document.getElementById('clientName').value,
            contact: document.getElementById('clientContact').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            status: document.getElementById('clientStatus').value,
            lastContact: currentClientData ? currentClientData.lastContact : new Date().toISOString().split('T')[0] 
        };

        try {
            await new Promise(r => setTimeout(r, 400));
            await window.db.updateItem('clients', clientData);
            const lang = window.app ? window.app.currentLang : 'en';
            
            if(isEditing){
                showToast(lang === 'pt' ? "Dados Atualizados!" : "Client Data Updated!", "success");
            } else {
                showToast(lang === 'pt' ? "Novo cliente criado!" : "New Client created successfully!", "success");
                const actText = lang === 'pt' ? `Criou uma nova conta: ${clientData.name}` : `Created new account: ${clientData.name}`;
                await window.db.updateItem('activities', { date: "Just now", text: actText });
                addNotificationTrigger();
            }

            closeModal();
            initClients(); 
        } catch (error) {
            console.error(error);
            window.hideLoader();
            showToast("Failed to save client.", "error");
        }
    });
}

/* =========================================================
   FILTROS DA TABELA 
========================================================= */
function applyFilters(searchTerm, statusTerm, showNotification = false) {
    searchTerm = searchTerm.toLowerCase();
    
    if (statusTerm === 'Ativo') statusTerm = 'Active';
    if (statusTerm === 'Inativo') statusTerm = 'Inactive';
    if (statusTerm === 'Todos os Status') statusTerm = 'All';

    const filtered = allClients.filter(client => {
        const cName = client.name ? client.name.toLowerCase() : '';
        const cContact = client.contact ? client.contact.toLowerCase() : '';
        const matchesSearch = cName.includes(searchTerm) || cContact.includes(searchTerm);
        const matchesStatus = statusTerm === 'All' || client.status === statusTerm;
        return matchesSearch && matchesStatus;
    });

    renderClients(filtered);

    if (showNotification) {
        const lang = window.app ? window.app.currentLang : 'en';
        let msg = lang === 'pt' ? `Filtro aplicado: ${statusTerm}` : `Filter applied: ${statusTerm}`;
        if (statusTerm === 'All') msg = lang === 'pt' ? "Mostrando Todos os Status" : "Showing All Statuses";
        showToast(msg, "info");
    }
}

function bindFilters() {
    const searchInput = document.getElementById('searchClient');
    const statusFilterDropdown = document.getElementById('statusFilterDropdown');
    if(!searchInput || !statusFilterDropdown) return;

    searchInput.addEventListener('input', () => {
        applyFilters(searchInput.value, statusFilterDropdown.getAttribute('data-current-value'), false);
    });

    statusFilterDropdown.addEventListener('dropdownChange', async (e) => {
        window.showLoader();
        await new Promise(r => setTimeout(r, 300));
        applyFilters(searchInput.value, e.detail.value, true);
        window.hideLoader();
    });
    
    initCustomDropdowns();
}