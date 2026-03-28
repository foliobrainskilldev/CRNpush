(() => {
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
        window.addEventListener('componentsLoaded', initClients); 
    });

    async function initClients() {
        if (!document.getElementById('clientsTableBody')) return;

        window.showLoader();
        try {
            await new Promise(r => setTimeout(r, 400)); 
            allClients = await window.db.getAllData('clients');
            
            renderClients(allClients);
            bindFilters();
            bindCrudModal();
            bindExportCSVModal();

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

    function bindExportCSVModal() {
        const btnOpenExport = document.getElementById('btnExportClientsCSV');
        if (!btnOpenExport) return;

        btnOpenExport.addEventListener('click', () => {
            if (allClients.length === 0) return window.showToast("No data available to export.", "warning");

            const dateStr = new Date().toISOString().split('T')[0];
            const defaultName = `NexusCRM_Clients_${dateStr}`;

            window.openExportModal(
                defaultName,
                "Name your file to save your clients data offline:",
                "Defina o nome do seu arquivo para baixar os seus clientes:",
                async (fileName) => {
                    const headers =["ID", "Company / Name", "Contact", "Email", "Phone", "Status", "Last Contact"];
                    const rowsData = allClients.map(client =>[
                        client.id || '',
                        client.name || '',
                        client.contact || '',
                        client.email || '',
                        client.phone || '',
                        client.status || '',
                        client.lastContact || ''
                    ]);
                    window.downloadCSV(fileName, headers, rowsData);
                }
            );
        });
    }

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
            tr.onclick = () => window.viewClient(client.id);
            
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
                    <button class="btn-action" title="Edit Client" onclick="window.editClient(event, '${client.id}')"><span class="iconify" data-icon="ph:pencil-simple-fill"></span></button>
                    <button class="btn-action delete" title="Delete Client" onclick="window.deleteClient(event, '${client.id}')"><span class="iconify" data-icon="ph:trash-fill"></span></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.viewClient = function(id) {
        window.location.href = `client-detail.html?id=${id}`;
    };

    window.deleteClient = async function(event, id) {
        event.stopPropagation(); 
        const lang = window.app ? window.app.currentLang : 'en';
        const isPt = lang === 'pt';
        
        const userConfirmed = await window.customConfirm(
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
                
                window.showToast(isPt ? "Cliente eliminado do sistema." : "Client deleted from system.", "success");
                applyFilters(document.getElementById('searchClient').value, document.getElementById('statusFilterDropdown').getAttribute('data-current-value'));
            } catch(e) {
                console.error(e);
                window.showToast("Failed to delete client.", "error");
            } finally {
                window.hideLoader();
            }
        }
    };

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
                    window.showToast(lang === 'pt' ? "Dados Atualizados!" : "Client Data Updated!", "success");
                } else {
                    window.showToast(lang === 'pt' ? "Novo cliente criado!" : "New Client created successfully!", "success");
                    const actText = lang === 'pt' ? `Criou uma nova conta: ${clientData.name}` : `Created new account: ${clientData.name}`;
                    await window.db.updateItem('activities', { date: "Just now", text: actText });
                    window.addNotificationTrigger();
                }

                closeModal();
                initClients(); 
            } catch (error) {
                console.error(error);
                window.hideLoader();
                window.showToast("Failed to save client.", "error");
            }
        });
    }

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
            window.showToast(msg, "info");
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
        
        window.initCustomDropdowns();
    }
})();