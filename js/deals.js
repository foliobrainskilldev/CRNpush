let allDeals =[];
let allClients =[];

document.addEventListener('DOMContentLoaded', () => {
    if (window.crmData && window.crmData.translations) {
        Object.assign(window.crmData.translations.en, {
            "deals.title": "Sales Pipeline", "deals.addBtn": "Create Deal",
            "deals.stageProspecting": "Prospecting", "deals.stageNegotiation": "Negotiation",
            "deals.stageWon": "Closed Won", "deals.stageLost": "Closed Lost"
        });
        Object.assign(window.crmData.translations.pt, {
            "deals.title": "Funil de Vendas", "deals.addBtn": "Criar Negócio",
            "deals.stageProspecting": "Prospecção", "deals.stageNegotiation": "Negociação",
            "deals.stageWon": "Ganho", "deals.stageLost": "Perdido"
        });
        if (window.app) window.app.applyTranslations();
    }

    window.addEventListener('componentsLoaded', initDeals);
});

async function initDeals() {
    window.showLoader();
    try {
        await new Promise(r => setTimeout(r, 400));
        allDeals = await window.db.getAllData('deals');
        allClients = await window.db.getAllData('clients');
        
        populateClientDropdown();
        bindDragAndDrop();
        bindCrudModal();
        bindExportCSVModal();
        bindSearch();

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            const searchInput = document.getElementById('searchDeal');
            if(searchInput) searchInput.value = searchQuery;
            const filtered = allDeals.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
            renderDeals(filtered);
        } else {
            renderDeals(allDeals);
        }
    } catch (error) {
        console.error("Erro ao inicializar deals:", error);
    } finally {
        window.hideLoader();
    }
}

function populateClientDropdown() {
    const list = document.getElementById('dealClientList');
    list.innerHTML = '';
    allClients.forEach(c => { list.innerHTML += `<div data-value="${c.id}">${c.name}</div>`; });
    window.initCustomDropdowns(); 
}

function renderDeals(dealsToRender) {
    const stages =['Prospecting', 'Negotiation', 'Won', 'Lost'];
    const lang = window.app ? window.app.currentLang : 'en';
    const fmt = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    stages.forEach(stage => {
        const container = document.getElementById(`col${stage}`);
        const countBadge = document.getElementById(`count${stage}`);
        container.innerHTML = '';

        const stageDeals = dealsToRender.filter(d => d.stage === stage);
        countBadge.innerText = stageDeals.length;

        stageDeals.forEach(deal => {
            const client = allClients.find(c => String(c.id) === String(deal.clientId));
            const clientName = client ? client.name : 'Unknown Client';
            
            const card = document.createElement('div');
            card.className = 'deal-card';
            card.setAttribute('data-id', deal.id);
            
            card.innerHTML = `
                <div class="card-actions">
                    <button class="card-action-btn" onclick="editDeal(event, '${deal.id}')" title="Edit"><span class="iconify" data-icon="ph:pencil-simple-fill"></span></button>
                    <button class="card-action-btn del" onclick="deleteDeal(event, '${deal.id}')" title="Delete"><span class="iconify" data-icon="ph:trash-fill"></span></button>
                </div>
                <div class="deal-title">${deal.title}</div>
                <div class="deal-client" style="display:flex; align-items:center; gap:8px;">
                    <div style="width: 20px; height: 20px; border-radius: 4px; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <img src="${window.app.getUnsplashAvatar(clientName, 'company')}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    ${clientName}
                </div>
                <div class="deal-meta">
                    <span class="deal-value">${fmt.format(deal.value)}</span>
                    <span class="deal-prob">${deal.probability}%</span>
                </div>
                <div class="deal-footer">
                    <span class="deal-date"><span class="iconify" data-icon="ph:clock-fill"></span> ${deal.closeDate}</span>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

function bindDragAndDrop() {
    const containers =[
        document.getElementById('colProspecting'),
        document.getElementById('colNegotiation'),
        document.getElementById('colWon'),
        document.getElementById('colLost')
    ];

    containers.forEach(container => {
        new Sortable(container, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: async function(evt) {
                if (evt.to === evt.from && evt.oldIndex === evt.newIndex) return;

                const dealId = evt.item.getAttribute('data-id');
                const newStage = evt.to.getAttribute('data-stage');
                const deal = allDeals.find(d => String(d.id) === dealId);
                
                if (deal && deal.stage !== newStage) {
                    deal.stage = newStage;
                    window.showLoader(); 
                    try {
                        await new Promise(r => setTimeout(r, 400));
                        await window.db.updateItem('deals', deal);
                        const lang = window.app ? window.app.currentLang : 'en';
                        
                        updateStageCounts();

                        if (newStage === 'Won') {
                            window.showToast(lang === 'pt' ? `Negócio Ganho: ${deal.title}!` : `Deal Won: ${deal.title}!`, 'success');
                            const actText = lang === 'pt' ? `Negócio Fechado (Ganho): ${deal.title}` : `Deal Closed (Won): ${deal.title}`;
                            await window.db.updateItem('activities', { date: "Just now", text: actText });
                            window.addNotificationTrigger();
                        } else {
                            window.showToast(lang === 'pt' ? `Fase atualizada: ${newStage}` : `Stage updated to ${newStage}`, 'info');
                        }
                    } catch (err) {
                        console.error(err);
                        window.showToast("Failed to update deal stage.", "error");
                    } finally {
                        window.hideLoader();
                    }
                }
            }
        });
    });
}

function updateStageCounts() {
    const stages =['Prospecting', 'Negotiation', 'Won', 'Lost'];
    stages.forEach(stage => {
        const count = allDeals.filter(d => d.stage === stage).length;
        document.getElementById(`count${stage}`).innerText = count;
    });
}

function bindSearch() {
    const searchInput = document.getElementById('searchDeal');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const filtered = allDeals.filter(d => d.title.toLowerCase().includes(val));
            renderDeals(filtered);
        });
    }
}

window.deleteDeal = async function(event, id) {
    event.stopPropagation();
    const lang = window.app ? window.app.currentLang : 'en';
    const isPt = lang === 'pt';
    const userConfirmed = await window.customConfirm(
        isPt ? "Tem a certeza que deseja eliminar este negócio permanentemente?" : "Are you sure you want to completely remove this deal?",
        isPt ? "Eliminar Negócio" : "Delete Deal", 
        isPt
    );
    
    if (userConfirmed) {
        window.showLoader();
        try {
            await new Promise(r => setTimeout(r, 400));
            const targetId = isNaN(id) ? id : Number(id);
            await window.db.deleteItem('deals', targetId);
            allDeals = allDeals.filter(d => String(d.id) !== String(id));
            window.showToast(isPt ? "Negócio eliminado." : "Deal deleted successfully.", "success");
            renderDeals(allDeals);
        } catch (err) {
            console.error(err);
            window.showToast("Failed to delete deal.", "error");
        } finally {
            window.hideLoader();
        }
    }
};

function bindExportCSVModal() {
    const btnOpen = document.getElementById('btnExportDealsCSV');
    const modal = document.getElementById('exportCsvModal');
    if (!btnOpen || !modal) return;

    btnOpen.onclick = () => {
        if(allDeals.length === 0) return window.showToast("No data to export.", "warning");
        document.getElementById('csvFileNameInput').value = `NexusCRM_Deals_${new Date().toISOString().split('T')[0]}`;
        modal.classList.add('active');
    };
    
    document.getElementById('closeExportModal').onclick = () => modal.classList.remove('active');
    document.getElementById('cancelExportBtn').onclick = () => modal.classList.remove('active');

    document.getElementById('confirmExportBtn').onclick = async () => {
        const lang = window.app ? window.app.currentLang : 'en';
        let fileName = document.getElementById('csvFileNameInput').value.trim() || 'NexusCRM_Data';
        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';

        window.showLoader();
        await new Promise(r => setTimeout(r, 700));

        const headers =["ID", "Deal Title", "Client ID", "Value", "Stage", "Probability", "Close Date"];
        const csvRows =[headers.join(',')];

        allDeals.forEach(deal => {
            const values =[
                deal.id || '',
                `"${(deal.title || '').replace(/"/g, '""')}"`,
                `"${deal.clientId || ''}"`,
                `"${deal.value || 0}"`,
                `"${deal.stage || ''}"`,
                `"${deal.probability || 0}"`,
                `"${deal.closeDate || ''}"`
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
        
        modal.classList.remove('active');
        window.hideLoader();
        setTimeout(() => window.showToast(lang === 'pt' ? "Exportação concluída!" : "Export completed!", "success"), 200);
    };
}

window.editDeal = function(event, id) {
    event.stopPropagation();
    const deal = allDeals.find(d => String(d.id) === String(id));
    if (!deal) return;

    document.getElementById('dealId').value = deal.id;
    document.getElementById('dealTitle').value = deal.title || '';
    document.getElementById('dealValue').value = deal.value || '';
    document.getElementById('dealDate').value = deal.closeDate || '';
    document.getElementById('dealProb').value = deal.probability || '';

    const clientInput = document.getElementById('dealClientSelect');
    const clientDropdown = document.getElementById('dealClientDropdown');
    clientInput.value = deal.clientId;
    clientDropdown.setAttribute('data-current-value', deal.clientId);
    const client = allClients.find(c => String(c.id) === String(deal.clientId));
    clientDropdown.querySelector('span:first-child').innerText = client ? client.name : 'Select a client...';

    const stageInput = document.getElementById('dealStage');
    const stageDropdown = document.getElementById('dealStageDropdown');
    stageInput.value = deal.stage;
    stageDropdown.setAttribute('data-current-value', deal.stage);
    stageDropdown.querySelector('span:first-child').innerText = deal.stage;

    const lang = window.app ? window.app.currentLang : 'en';
    document.getElementById('dealModalTitle').innerHTML = `<span class="iconify" data-icon="ph:pencil-simple-fill"></span> ${lang === 'pt' ? 'Editar Negócio' : 'Edit Deal'}`;
    document.getElementById('crudDealModal').classList.add('active');
};

function bindCrudModal() {
    const modal = document.getElementById('crudDealModal');
    const form = document.getElementById('formCreateDeal');

    document.getElementById('btnOpenAddDeal').onclick = () => {
        form.reset();
        document.getElementById('dealId').value = ''; 
        
        document.getElementById('dealClientSelect').value = '';
        document.getElementById('dealClientDropdown').querySelector('span:first-child').innerText = 'Select a client...';
        document.getElementById('dealStage').value = 'Prospecting';
        document.getElementById('dealStageDropdown').querySelector('span:first-child').innerText = 'Prospecting';

        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('dealModalTitle').innerHTML = `<span class="iconify" data-icon="ph:handshake-fill"></span> ${lang === 'pt' ? 'Criar Novo Negócio' : 'Create New Deal'}`;
        modal.classList.add('active');
    };

    const fechar = () => { modal.classList.remove('active'); form.reset(); };
    document.getElementById('closeDealModal').onclick = fechar;
    document.getElementById('cancelDealBtn').onclick = fechar;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clientVal = document.getElementById('dealClientSelect').value;
        if(!clientVal) return window.showToast("Please select a client from the dropdown.", "error");

        window.showLoader();

        const isEditing = document.getElementById('dealId').value !== '';
        const targetId = isEditing ? parseInt(document.getElementById('dealId').value) : Date.now();
        
        const dealData = {
            id: targetId,
            title: document.getElementById('dealTitle').value,
            clientId: parseInt(clientVal),
            value: parseFloat(document.getElementById('dealValue').value),
            closeDate: document.getElementById('dealDate').value,
            stage: document.getElementById('dealStage').value,
            probability: parseInt(document.getElementById('dealProb').value)
        };

        try {
            await new Promise(r => setTimeout(r, 400));
            await window.db.updateItem('deals', dealData);
            const lang = window.app ? window.app.currentLang : 'en';

            if (!isEditing) {
                window.showToast(lang === 'pt' ? "Negócio adicionado ao funil!" : "Deal added to pipeline!", "success");
                const actText = lang === 'pt' ? `Criou o negócio: ${dealData.title}` : `Created new deal: ${dealData.title}`;
                await window.db.updateItem('activities', { date: "Just now", text: actText });
                window.addNotificationTrigger();
            } else {
                window.showToast(lang === 'pt' ? "Negócio atualizado!" : "Deal updated successfully!", "success");
            }

            fechar();
            initDeals(); 
        } catch (error) {
            console.error(error);
            window.hideLoader();
            window.showToast("Failed to save Deal.", "error");
        }
    });
}