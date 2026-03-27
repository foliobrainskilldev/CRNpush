let allLeads =[];

document.addEventListener('DOMContentLoaded', () => {
    if (window.crmData && window.crmData.translations) {
        Object.assign(window.crmData.translations.en, {
            "leads.title": "Leads Pipeline", "leads.addBtn": "Add Lead", "leads.searchPlaceholder": "Search by name or company...",
            "leads.filterAll": "All Statuses", "leads.colName": "Lead Info", "leads.colSource": "Source",
            "leads.colInterest": "Interest", "leads.colValue": "Est. Value", "leads.colStatus": "Status", "leads.colActions": "Actions"
        });
        Object.assign(window.crmData.translations.pt, {
            "leads.title": "Pipeline de Prospectos", "leads.addBtn": "Adicionar Prospecto", "leads.searchPlaceholder": "Buscar por nome ou empresa...",
            "leads.filterAll": "Todos os Status", "leads.colName": "Info do Prospecto", "leads.colSource": "Origem",
            "leads.colInterest": "Interesse", "leads.colValue": "Valor Est.", "leads.colStatus": "Status", "leads.colActions": "Ações"
        });
        if (window.app) window.app.applyTranslations();
    }

    // Aguarda que os componentes HTML carreguem
    window.addEventListener('componentsLoaded', initLeads);
});

async function initLeads() {
    window.showLoader();
    try {
        await new Promise(r => setTimeout(r, 400)); 
        allLeads = await window.db.getAllData('leads');
        
        renderLeads(allLeads);
        bindFilters();
        bindCrudModal();
        bindExportCSVModal();

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            const searchInput = document.getElementById('searchLead');
            if(searchInput) {
                searchInput.value = searchQuery;
                applyFilters(searchQuery, 'All', false);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar leads:", error);
    } finally {
        window.hideLoader();
    }
}

function bindExportCSVModal() {
    const btnOpenExport = document.getElementById('btnExportLeadsCSV');
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
        if (allLeads.length === 0) return window.showToast("No data available to export.", "warning");

        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('exportModalText').innerText = lang === 'pt' ? "Defina o nome do seu arquivo para baixar os seus prospectos:" : "Name your file to save your leads data offline:";
        btnCancelExport.innerText = lang === 'pt' ? "Cancelar" : "Cancel";

        inputFileName.value = `NexusCRM_Leads_${new Date().toISOString().split('T')[0]}`;
        modalExport.classList.add('active');
    });

    btnConfirmExport.onclick = async () => {
        const lang = window.app ? window.app.currentLang : 'en';
        let fileName = inputFileName.value.trim() || 'NexusCRM_Data';
        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';

        window.showLoader(); 
        await new Promise(r => setTimeout(r, 800)); 

        const headers =["ID", "Name", "Company", "Source", "Interest", "Status", "Estimated Value", "Email", "Phone"];
        const csvRows =[headers.join(',')];

        allLeads.forEach(lead => {
            const values =[
                lead.id,
                `"${(lead.name || '').replace(/"/g, '""')}"`,
                `"${(lead.company || '').replace(/"/g, '""')}"`,
                `"${(lead.source || '')}"`,
                `"${(lead.interest || '').replace(/"/g, '""')}"`,
                `"${(lead.status || '')}"`,
                `"${lead.estimatedValue || 0}"`,
                `"${(lead.email || '').replace(/"/g, '""')}"`,
                `"${(lead.phone || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = fileName; 
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
        
        closeModal();
        window.hideLoader();
        setTimeout(() => window.showToast(lang === 'pt' ? "Exportação iniciada com sucesso!" : "Export started successfully!", "success"), 200);
    };
}

function renderLeads(leadsToRender) {
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '';
    const lang = window.app ? window.app.currentLang : 'en';

    if (leadsToRender.length === 0) {
        const emptyMsg = lang === 'pt' ? "Nenhum Lead encontrado. Adicione novos contatos para aquecer o funil!" : "No leads found. Start adding some prospects to heat up your pipeline!";
        tbody.innerHTML = `<tr><td colspan="6"><div style="text-align:center; padding:64px 16px; color:var(--text-muted);"><span class="iconify" data-icon="ph:folder-open-fill" style="font-size:64px; color:var(--border); margin-bottom:16px;"></span><p style="font-weight:500; font-size: 15px;">${emptyMsg}</p></div></td></tr>`;
        return;
    }

    const fmt = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    leadsToRender.forEach(lead => {
        const tr = document.createElement('tr');
        
        let selectClass = 'status-new';
        if (lead.status === 'Contacted') selectClass = 'status-contacted';
        else if (lead.status === 'Qualified') selectClass = 'status-qualified';
        else if (lead.status === 'Lost') selectClass = 'status-lost';

        tr.innerHTML = `
            <td>
                <div class="company-cell">
                    <div class="company-avatar">
                        <img src="${window.app.getUnsplashAvatar(lead.company, 'company')}" alt="Logo">
                    </div>
                    <div>
                        <div class="lead-info-title">${lead.name}</div>
                        <div class="lead-info-sub">${lead.company}</div>
                    </div>
                </div>
            </td>
            <td>${lead.source}</td>
            <td style="font-weight: 500;">${lead.interest}</td>
            <td style="color: var(--primary); font-weight: 600;">${fmt.format(lead.estimatedValue)}</td>
            <td>
                <div class="custom-dropdown table-dropdown ${selectClass}" data-lead-id="${lead.id}" data-current-value="${lead.status}">
                    <div class="dropdown-header"><span>${lead.status}</span> <span class="iconify" data-icon="ph:caret-down-fill"></span></div>
                    <div class="dropdown-list">
                        <div data-value="New">New</div>
                        <div data-value="Contacted">Contacted</div>
                        <div data-value="Qualified">Qualified</div>
                        <div data-value="Lost">Lost</div>
                    </div>
                </div>
            </td>
            <td class="actions-cell">
                <button class="btn-action" title="Edit Lead" onclick="editLead(${lead.id})"><span class="iconify" data-icon="ph:pencil-simple-fill"></span></button>
                <button class="btn-action email" title="Send Email" onclick="sendEmail('${lead.email || ''}')"><span class="iconify" data-icon="ph:envelope-simple-fill"></span></button>
                <button class="btn-action whatsapp" title="WhatsApp Message" onclick="sendWhatsApp('${lead.phone || ''}')"><span class="iconify" data-icon="ph:whatsapp-logo-fill"></span></button>
                <button class="btn-action delete" title="Delete Lead" onclick="deleteLead(${lead.id})"><span class="iconify" data-icon="ph:trash-fill"></span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    window.initCustomDropdowns();
    bindTableDropdowns();
}

window.sendEmail = function(email) {
    if (!email) return window.showToast('No email registered for this lead.', 'warning');
    window.location.href = `mailto:${email}?subject=Contact NexusCRM`;
};

window.sendWhatsApp = function(phone) {
    if (!phone) return window.showToast('No phone registered for this lead.', 'warning');
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
};

window.deleteLead = async function(id) {
    const lang = window.app ? window.app.currentLang : 'en';
    const isPt = lang === 'pt';
    
    const userConfirmed = await window.customConfirm(
        isPt ? "Tem a certeza que deseja eliminar este lead permanentemente?" : "Are you sure you want to completely remove this lead from the database?", 
        isPt ? "Remover Prospecto" : "Delete Lead", isPt
    );
    
    if (userConfirmed) {
        window.showLoader(); 
        try {
            await new Promise(r => setTimeout(r, 400));
            await window.db.deleteItem('leads', id);
            allLeads = allLeads.filter(l => l.id !== id);
            
            window.showToast(isPt ? "Lead eliminado com sucesso." : "Lead deleted successfully.", "success");
            applyFilters(document.getElementById('searchLead').value, document.getElementById('statusFilterDropdown').getAttribute('data-current-value'));
        } catch (error) {
            console.error(error);
            window.showToast("Error deleting lead.", "error");
        } finally {
            window.hideLoader();
        }
    }
};

window.editLead = function(id) {
    const lead = allLeads.find(l => l.id === id);
    if (!lead) return;

    document.getElementById('hiddenLeadId').value = lead.id;
    document.getElementById('leadName').value = lead.name;
    document.getElementById('leadCompany').value = lead.company;
    
    document.getElementById('leadSource').value = lead.source;
    document.getElementById('leadSourceDropdown').querySelector('span:first-child').innerText = lead.source;
    document.getElementById('leadSourceDropdown').setAttribute('data-current-value', lead.source);
    
    document.getElementById('leadValue').value = lead.estimatedValue;
    document.getElementById('leadInterest').value = lead.interest;
    
    document.getElementById('leadStatus').value = lead.status;
    document.getElementById('leadStatusDropdown').querySelector('span:first-child').innerText = lead.status;
    document.getElementById('leadStatusDropdown').setAttribute('data-current-value', lead.status);
    
    document.getElementById('leadPhone').value = lead.phone || '';
    document.getElementById('leadEmail').value = lead.email || '';

    const lang = window.app ? window.app.currentLang : 'en';
    document.getElementById('leadModalTitle').innerHTML = `<span class="iconify" data-icon="ph:pencil-simple-fill"></span> ${lang === 'pt' ? 'Editar Perfil do Lead' : 'Edit Lead Profile'}`;
    
    document.getElementById('crudLeadModal').classList.add('active');
};

function bindCrudModal() {
    const modal = document.getElementById('crudLeadModal');
    const form = document.getElementById('formCreateLead');

    document.getElementById('btnOpenAddLead').addEventListener('click', () => {
        form.reset();
        document.getElementById('hiddenLeadId').value = ''; 
        
        document.getElementById('leadSource').value = 'Website';
        document.getElementById('leadSourceDropdown').querySelector('span:first-child').innerText = 'Website';
        document.getElementById('leadSourceDropdown').setAttribute('data-current-value', 'Website');

        document.getElementById('leadStatus').value = 'New';
        document.getElementById('leadStatusDropdown').querySelector('span:first-child').innerText = 'New';
        document.getElementById('leadStatusDropdown').setAttribute('data-current-value', 'New');
        
        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('leadModalTitle').innerHTML = `<span class="iconify" data-icon="ph:magnet-fill"></span> ${lang === 'pt' ? 'Adicionar Novo Lead' : 'Add New Lead'}`;
        
        modal.classList.add('active');
    });

    const closeModal = () => { modal.classList.remove('active'); form.reset(); };
    document.getElementById('closeLeadModal').addEventListener('click', closeModal);
    document.getElementById('cancelLeadBtn').addEventListener('click', closeModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.showLoader(); 

        const isEditing = document.getElementById('hiddenLeadId').value !== '';
        const targetId = isEditing ? parseInt(document.getElementById('hiddenLeadId').value) : Date.now();

        const leadData = {
            id: targetId,
            name: document.getElementById('leadName').value,
            company: document.getElementById('leadCompany').value,
            source: document.getElementById('leadSource').value,
            interest: document.getElementById('leadInterest').value,
            status: document.getElementById('leadStatus').value,
            estimatedValue: parseFloat(document.getElementById('leadValue').value),
            phone: document.getElementById('leadPhone').value,
            email: document.getElementById('leadEmail').value
        };

        try {
            await new Promise(r => setTimeout(r, 500)); 
            await window.db.updateItem('leads', leadData);
            const lang = window.app ? window.app.currentLang : 'en';

            if (!isEditing) {
                window.showToast(lang === 'pt' ? "Novo lead salvo com sucesso!" : "New lead saved successfully!", "success");
                const actText = lang === 'pt' ? `Novo prospecto adicionado: ${leadData.name}` : `New lead added: ${leadData.name}`;
                await window.db.updateItem('activities', { date: "Just now", text: actText });
                window.addNotificationTrigger();
            } else {
                window.showToast(lang === 'pt' ? "Dados atualizados!" : "Lead updated successfully!", "success");
            }

            closeModal();
            initLeads(); 
        } catch (error) {
            console.error(error);
            window.hideLoader();
            window.showToast("Failed to save lead.", "error");
        }
    });
}

function bindTableDropdowns() {
    document.querySelectorAll('.table-dropdown').forEach(dropdown => {
        dropdown.addEventListener('dropdownChange', async (e) => {
            const leadId = parseInt(dropdown.getAttribute('data-lead-id'));
            const newStatus = e.detail.value;
            const text = e.detail.text;
            
            const leadToUpdate = allLeads.find(l => l.id === leadId);
            if (leadToUpdate) {
                leadToUpdate.status = newStatus;
                window.showLoader(); 

                try {
                    await new Promise(r => setTimeout(r, 400));
                    await window.db.updateItem('leads', leadToUpdate);
                    const lang = window.app ? window.app.currentLang : 'en';
                    
                    window.showToast(lang === 'pt' ? `Status alterado para ${text}` : `Status changed to ${text}`, "info");

                    if (newStatus === 'Qualified') {
                        const actText = lang === 'pt' ? `Lead Qualificado: ${leadToUpdate.name}` : `Lead Qualified: ${leadToUpdate.name}`;
                        await window.db.updateItem('activities', { date: "Just now", text: actText });
                        window.addNotificationTrigger();
                        setTimeout(() => window.showToast("🎯 Excellent Job!", "success"), 600);
                    }

                    applyFilters(document.getElementById('searchLead').value, document.getElementById('statusFilterDropdown').getAttribute('data-current-value'));

                } catch (err) {
                    console.error(err);
                    window.showToast("Error updating status.", "error");
                } finally {
                    window.hideLoader();
                }
            }
        });
    });
}

function applyFilters(searchTerm, statusTerm, showNotification = false) {
    searchTerm = searchTerm.toLowerCase();
    
    const filtered = allLeads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm) || lead.company.toLowerCase().includes(searchTerm);
        const matchesStatus = statusTerm === 'All' || lead.status === statusTerm;
        return matchesSearch && matchesStatus;
    });

    renderLeads(filtered);

    if (showNotification) {
        const lang = window.app ? window.app.currentLang : 'en';
        let msg = lang === 'pt' ? `Filtro aplicado: ${statusTerm}` : `Filter applied: ${statusTerm}`;
        if (statusTerm === 'All') msg = lang === 'pt' ? "Mostrando Todos os Status" : "Showing All Statuses";
        window.showToast(msg, "info");
    }
}

function bindFilters() {
    const searchInput = document.getElementById('searchLead');
    const statusFilterDropdown = document.getElementById('statusFilterDropdown');

    searchInput.addEventListener('input', () => {
        applyFilters(searchInput.value, statusFilterDropdown.getAttribute('data-current-value'), false);
    });

    statusFilterDropdown.addEventListener('dropdownChange', async (e) => {
        window.showLoader();
        await new Promise(r => setTimeout(r, 300));
        applyFilters(searchInput.value, e.detail.value, true); 
        window.hideLoader();
    });
}