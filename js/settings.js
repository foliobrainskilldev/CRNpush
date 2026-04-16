document.addEventListener('DOMContentLoaded', () => {
    if (window.crmData && window.crmData.translations) {
        Object.assign(window.crmData.translations.en, {
            "sidebar.settings": "Settings", "settings.title": "System Settings",
            "settings.backupTitle": "Data Backup", "settings.backupDesc": "Export all your CRM data (Clients, Leads, Deals, Tasks, etc.) into a single secure JSON file. Keep this safe!",
            "settings.btnExport": "Download Full Backup", "settings.restoreTitle": "Restore Data",
            "settings.restoreDesc": "Upload a previously exported JSON backup file. WARNING: This will overwrite your current database.",
            "settings.dragDrop": "Drag & Drop JSON file here", "settings.clickBrowse": "or click to browse",
            "settings.dangerTitle": "Danger Zone", "settings.dangerDesc": "Permanently delete all data from your local database. This action cannot be reversed.",
            "settings.btnWipe": "Wipe All Data"
        });
        Object.assign(window.crmData.translations.pt, {
            "sidebar.settings": "Configurações", "settings.title": "Configurações do Sistema",
            "settings.backupTitle": "Backup de Dados", "settings.backupDesc": "Exporte todos os dados do CRM (Clientes, Prospectos, Negócios, Tarefas, etc.) num ficheiro JSON seguro.",
            "settings.btnExport": "Baixar Backup Completo", "settings.restoreTitle": "Restaurar Dados",
            "settings.restoreDesc": "Envie um ficheiro JSON de backup. AVISO: Isto irá substituir totalmente a sua base de dados atual.",
            "settings.dragDrop": "Arraste o ficheiro JSON para aqui", "settings.clickBrowse": "ou clique para selecionar",
            "settings.dangerTitle": "Zona de Perigo", "settings.dangerDesc": "Apague permanentemente todos os dados da sua base de dados local. Esta ação não pode ser desfeita.",
            "settings.btnWipe": "Apagar Todos os Dados"
        });
        if (window.app) window.app.applyTranslations();
    }

    window.addEventListener('componentsLoaded', () => {
        bindExportBackup();
        bindImportRestore();
        bindWipeData();
        
        window.hideLoader(); 
    });
});

function bindExportBackup() {
    const btn = document.getElementById('btnExportBackup');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        window.showLoader();
        const lang = window.app ? window.app.currentLang : 'en';

        try {
            await new Promise(r => setTimeout(r, 800)); 
            const fullBackup = {};
            const stores = window.db.stores;

            for (const store of stores) {
                fullBackup[store] = await window.db.getAllData(store);
            }

            const jsonData = JSON.stringify(fullBackup, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `NexusCRM_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.showToast(lang === 'pt' ? 'Backup realizado com sucesso!' : 'Backup downloaded successfully!', 'success');

        } catch (error) {
            console.error("Erro ao gerar backup:", error);
            window.showToast("Failed to generate backup.", "error");
        } finally {
            window.hideLoader();
        }
    });
}

function bindImportRestore() {
    const dropZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('backupFileInput');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', function() { handleFiles(this.files); });

    function handleDrop(e) { handleFiles(e.dataTransfer.files); }

    async function handleFiles(files) {
        if(files.length === 0) return;
        const file = files[0];

        if(file.type !== "application/json" && !file.name.endsWith('.json')) {
            window.showToast("Please upload a valid JSON file.", "error");
            return;
        }

        const lang = window.app ? window.app.currentLang : 'en';
        const isPt = lang === 'pt';

        const confirmed = await window.customConfirm(
            isPt ? "AVISO: Restaurar o backup vai SUBSTITUIR todos os seus dados atuais. Deseja continuar?" : "WARNING: Restoring a backup will OVERWRITE all your current data. Do you wish to continue?",
            isPt ? "Confirmar Restauro" : "Confirm Restore", isPt
        );

        if(!confirmed) {
            fileInput.value = ''; 
            return;
        }

        window.showLoader();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await new Promise(r => setTimeout(r, 600)); 
                
                const data = JSON.parse(e.target.result);
                const validStores = window.db.stores;

                for (const store of validStores) {
                    if(data[store] && Array.isArray(data[store])) {
                        await window.db.clearStore(store); 
                        for (const item of data[store]) {
                            await window.db.updateItem(store, item);
                        }
                    }
                }

                window.showToast(isPt ? 'Base de dados restaurada com sucesso!' : 'Database restored successfully!', 'success');
                setTimeout(() => window.location.reload(), 1500); 

            } catch (err) {
                console.error("Erro ao importar JSON:", err);
                window.showToast(isPt ? "Erro: Ficheiro JSON inválido ou corrompido." : "Error: Invalid or corrupted JSON file.", "error");
            } finally {
                window.hideLoader();
                fileInput.value = ''; 
            }
        };
        
        reader.readAsText(file);
    }
}

function bindWipeData() {
    const btn = document.getElementById('btnWipeData');
    if(!btn) return;

    btn.addEventListener('click', async () => {
        const lang = window.app ? window.app.currentLang : 'en';
        const isPt = lang === 'pt';

        const confirmed = await window.customConfirm(
            isPt ? "Esta ação é irreversível! Tem a certeza que deseja APAGAR TODOS os dados do CRM?" : "This action is irreversible! Are you sure you want to WIPE ALL CRM data?",
            isPt ? "APAGAR TUDO" : "WIPE EVERYTHING", isPt
        );

        if(!confirmed) return;

        window.showLoader();
        try {
            await new Promise(r => setTimeout(r, 1000));
            const stores = window.db.stores;
            for (const store of stores) {
                await window.db.clearStore(store);
            }
            window.showToast(isPt ? "Todos os dados foram apagados." : "All data wiped successfully.", "success");
            setTimeout(() => window.location.href = 'index.html', 1500);
        } catch (error) {
            console.error("Erro ao limpar dados:", error);
            window.hideLoader();
            window.showToast("Failed to wipe data.", "error");
        }
    });
}