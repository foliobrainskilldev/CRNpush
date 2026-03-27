let allProducts =[];

document.addEventListener('DOMContentLoaded', () => {
    if (window.crmData && window.crmData.translations) {
        Object.assign(window.crmData.translations.en, {
            "products.title": "Products & Services", "products.addBtn": "Add Product", "products.searchPlaceholder": "Search by name or SKU...",
            "products.colName": "Product / SKU", "products.colCategory": "Category", "products.colPrice": "Price", "products.colStatus": "Status"
        });
        Object.assign(window.crmData.translations.pt, {
            "products.title": "Produtos e Serviços", "products.addBtn": "Adicionar Produto", "products.searchPlaceholder": "Buscar por nome ou SKU...",
            "products.colName": "Produto / SKU", "products.colCategory": "Categoria", "products.colPrice": "Preço", "products.colStatus": "Status"
        });
        if (window.app) window.app.applyTranslations();
    }

    window.addEventListener('componentsLoaded', initProducts);
});

async function initProducts() {
    window.showLoader();
    try {
        await new Promise(r => setTimeout(r, 400));
        allProducts = await window.db.getAllData('products');
        
        renderProducts(allProducts);
        bindFilters();
        bindCrudModal();
        bindExportCSVModal();

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    } finally {
        window.hideLoader();
    }
}

function bindExportCSVModal() {
    const btnOpenExport = document.getElementById('btnExportProductsCSV');
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
        if (allProducts.length === 0) return window.showToast("No data available to export.", "warning");

        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('exportModalText').innerText = lang === 'pt' ? "Defina o nome do seu arquivo para baixar os produtos:" : "Name your file to save your products data offline:";
        btnCancelExport.innerText = lang === 'pt' ? "Cancelar" : "Cancel";

        inputFileName.value = `NexusCRM_Products_${new Date().toISOString().split('T')[0]}`;
        modalExport.classList.add('active');
    });

    btnConfirmExport.onclick = async () => {
        const lang = window.app ? window.app.currentLang : 'en';
        let fileName = inputFileName.value.trim() || 'NexusCRM_Data';
        if (!fileName.toLowerCase().endsWith('.csv')) fileName += '.csv';

        window.showLoader(); 
        await new Promise(r => setTimeout(r, 700));

        const headers =["ID", "Name", "SKU", "Category", "Price", "Status"];
        const csvRows =[headers.join(',')]; 

        allProducts.forEach(prod => {
            const values =[
                prod.id || '',
                `"${(prod.name || '').replace(/"/g, '""')}"`,
                `"${(prod.sku || '').replace(/"/g, '""')}"`,
                `"${prod.category || ''}"`,
                `"${prod.price || 0}"`,
                `"${prod.status || ''}"`
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

function renderProducts(productsToRender) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    const lang = window.app ? window.app.currentLang : 'en';

    if (productsToRender.length === 0) {
        const emptyMsg = lang === 'pt' ? "Nenhum produto cadastrado no seu portfólio." : "No products found in your portfolio.";
        tbody.innerHTML = `<tr><td colspan="5"><div style="text-align:center; padding:64px 16px; color:var(--text-muted);"><span class="iconify" data-icon="ph:box-cube-fill" style="font-size:64px; color:var(--border); margin-bottom:16px;"></span><p style="font-weight:500; font-size:15px;">${emptyMsg}</p></div></td></tr>`;
        return;
    }

    const fmt = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

    productsToRender.forEach(prod => {
        const tr = document.createElement('tr');
        
        let badgeClass = 'active';
        if (prod.status === 'Inactive') badgeClass = 'inactive';
        if (prod.status === 'Draft') badgeClass = 'draft';

        let displayStatus = prod.status;
        if(lang === 'pt'){
            if(displayStatus === 'Active') displayStatus = 'Ativo';
            if(displayStatus === 'Inactive') displayStatus = 'Inativo';
            if(displayStatus === 'Draft') displayStatus = 'Rascunho';
        }

        tr.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--text-main); font-size: 15px;">${prod.name}</div>
                <div style="font-size: 12px; color: var(--text-muted);">SKU: ${prod.sku || '--'}</div>
            </td>
            <td><span class="iconify" data-icon="ph:tag-fill" style="color:var(--text-muted); margin-right:4px;"></span> ${prod.category}</td>
            <td style="color: var(--primary); font-weight: 700;">${fmt.format(prod.price)}</td>
            <td><span class="badge ${badgeClass}">${displayStatus}</span></td>
            <td class="actions-cell">
                <button class="btn-action" title="Edit Product" onclick="editProduct(event, '${prod.id}')"><span class="iconify" data-icon="ph:pencil-simple-fill"></span></button>
                <button class="btn-action delete" title="Delete Product" onclick="deleteProduct(event, '${prod.id}')"><span class="iconify" data-icon="ph:trash-fill"></span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteProduct = async function(event, id) {
    event.stopPropagation(); 
    const lang = window.app ? window.app.currentLang : 'en';
    const isPt = lang === 'pt';
    
    const userConfirmed = await window.customConfirm(
        isPt ? "Tem a certeza que deseja eliminar este produto?" : "Are you sure you want to completely remove this product?",
        isPt ? "Remover Produto" : "Delete Product", isPt
    );
    
    if (userConfirmed) {
        window.showLoader(); 
        try {
            await new Promise(r => setTimeout(r, 400));
            const targetId = isNaN(id) ? id : Number(id);
            await window.db.deleteItem('products', targetId); 
            allProducts = allProducts.filter(p => String(p.id) !== String(id)); 
            
            window.showToast(isPt ? "Produto removido com sucesso." : "Product deleted successfully.", "success");
            applyFilters(document.getElementById('searchProduct').value, document.getElementById('categoryFilterDropdown').getAttribute('data-current-value'), document.getElementById('statusFilterDropdown').getAttribute('data-current-value'));
        } catch(e) {
            console.error(e);
            window.showToast("Failed to delete product.", "error");
        } finally {
            window.hideLoader();
        }
    }
};

window.editProduct = function(event, id) {
    event.stopPropagation();
    const prod = allProducts.find(p => String(p.id) === String(id));
    if (!prod) return;

    document.getElementById('hiddenProductId').value = prod.id;
    document.getElementById('productName').value = prod.name || '';
    document.getElementById('productSKU').value = prod.sku || '';
    document.getElementById('productPrice').value = prod.price || '';
    document.getElementById('productDesc').value = prod.description || '';
    
    document.getElementById('productCategory').value = prod.category || 'Software';
    document.getElementById('productCategoryDropdown').querySelector('span:first-child').innerText = prod.category || 'Software';
    document.getElementById('productCategoryDropdown').setAttribute('data-current-value', prod.category || 'Software');

    document.getElementById('productStatus').value = prod.status || 'Active';
    document.getElementById('productStatusDropdown').querySelector('span:first-child').innerText = prod.status || 'Active';
    document.getElementById('productStatusDropdown').setAttribute('data-current-value', prod.status || 'Active');

    const lang = window.app ? window.app.currentLang : 'en';
    document.getElementById('productModalTitle').innerHTML = `<span class="iconify" data-icon="ph:pencil-simple-fill"></span> ${lang === 'pt' ? 'Editar Produto' : 'Edit Product'}`;
    
    document.getElementById('crudProductModal').classList.add('active');
};

function bindCrudModal() {
    const modal = document.getElementById('crudProductModal');
    const form = document.getElementById('formCreateProduct');

    document.getElementById('btnOpenAddProduct').addEventListener('click', () => {
        form.reset();
        document.getElementById('hiddenProductId').value = ''; 
        
        document.getElementById('productStatus').value = 'Active';
        document.getElementById('productStatusDropdown').querySelector('span:first-child').innerText = 'Active';
        document.getElementById('productStatusDropdown').setAttribute('data-current-value', 'Active');

        document.getElementById('productCategory').value = 'Software';
        document.getElementById('productCategoryDropdown').querySelector('span:first-child').innerText = 'Software';
        document.getElementById('productCategoryDropdown').setAttribute('data-current-value', 'Software');

        const lang = window.app ? window.app.currentLang : 'en';
        document.getElementById('productModalTitle').innerHTML = `<span class="iconify" data-icon="ph:box-cube-fill"></span> ${lang === 'pt' ? 'Adicionar Novo Produto' : 'Add New Product'}`;
        
        modal.classList.add('active');
    });
    
    const closeModal = () => { modal.classList.remove('active'); form.reset(); };
    document.getElementById('closeProductModal').addEventListener('click', closeModal);
    document.getElementById('cancelProductBtn').addEventListener('click', closeModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.showLoader(); 

        const isEditing = document.getElementById('hiddenProductId').value !== '';
        const targetId = isEditing ? parseInt(document.getElementById('hiddenProductId').value) : Date.now();
        
        const prodData = {
            id: targetId,
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSKU').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            status: document.getElementById('productStatus').value,
            description: document.getElementById('productDesc').value
        };

        try {
            await new Promise(r => setTimeout(r, 400));
            await window.db.updateItem('products', prodData);
            const lang = window.app ? window.app.currentLang : 'en';
            
            if(isEditing){
                window.showToast(lang === 'pt' ? "Produto Atualizado!" : "Product Updated!", "success");
            } else {
                window.showToast(lang === 'pt' ? "Novo produto criado!" : "New Product created successfully!", "success");
                const actText = lang === 'pt' ? `Criou um novo produto: ${prodData.name}` : `Created new product: ${prodData.name}`;
                await window.db.updateItem('activities', { date: "Just now", text: actText });
                window.addNotificationTrigger();
            }

            closeModal();
            initProducts(); 
        } catch (error) {
            console.error(error);
            window.hideLoader();
            window.showToast("Failed to save product.", "error");
        }
    });
}

function applyFilters(searchTerm, categoryTerm, statusTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    const filtered = allProducts.filter(prod => {
        const pName = prod.name ? prod.name.toLowerCase() : '';
        const pSku = prod.sku ? prod.sku.toLowerCase() : '';
        
        const matchesSearch = pName.includes(searchTerm) || pSku.includes(searchTerm);
        const matchesCategory = categoryTerm === 'All' || prod.category === categoryTerm;
        const matchesStatus = statusTerm === 'All' || prod.status === statusTerm;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderProducts(filtered);
}

function bindFilters() {
    const searchInput = document.getElementById('searchProduct');
    const categoryDropdown = document.getElementById('categoryFilterDropdown');
    const statusDropdown = document.getElementById('statusFilterDropdown');

    const triggerFilter = () => {
        applyFilters(
            searchInput.value,
            categoryDropdown.getAttribute('data-current-value'),
            statusDropdown.getAttribute('data-current-value')
        );
    };

    searchInput.addEventListener('input', triggerFilter);

    categoryDropdown.addEventListener('dropdownChange', async (e) => {
        window.showLoader();
        await new Promise(r => setTimeout(r, 300));
        triggerFilter();
        window.hideLoader();
    });

    statusDropdown.addEventListener('dropdownChange', async (e) => {
        window.showLoader();
        await new Promise(r => setTimeout(r, 300));
        triggerFilter();
        window.hideLoader();
    });
    
    window.initCustomDropdowns();
}