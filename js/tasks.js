(() => {
    let allTasks = [];
    let allClients =[];

    document.addEventListener('DOMContentLoaded', () => {
        try {
            if (window.crmData) {
                window.crmData.translations = window.crmData.translations || { en: {}, pt: {} };
                Object.assign(window.crmData.translations.en, {
                    "tasks.title": "Task Management", "tasks.addBtn": "Add Task", "tasks.searchPlaceholder": "Search tasks...",
                    "tasks.filterStatusAll": "All Statuses", "tasks.filterPriorityAll": "All Priorities",
                    "tasks.colTask": "Task Details", "tasks.colPriority": "Priority", "tasks.colDue": "Due Date",
                    "tasks.colStatus": "Status", "tasks.colAction": "Actions", "tasks.btnDone": "Mark Done", "tasks.btnUndo": "Undo"
                });
                Object.assign(window.crmData.translations.pt, {
                    "tasks.title": "Gestão de Tarefas", "tasks.addBtn": "Adicionar Tarefa", "tasks.searchPlaceholder": "Buscar tarefas...",
                    "tasks.filterStatusAll": "Todos os Status", "tasks.filterPriorityAll": "Todas as Prioridades",
                    "tasks.colTask": "Detalhes da Tarefa", "tasks.colPriority": "Prioridade", "tasks.colDue": "Prazo",
                    "tasks.colStatus": "Status", "tasks.colAction": "Ações", "tasks.btnDone": "Concluir", "tasks.btnUndo": "Desfazer"
                });
                if (window.app) window.app.applyTranslations();
            }
        } catch(e) { 
            console.error(e); 
        }

        window.addEventListener('componentsLoaded', initTasks);
        setTimeout(() => { if (window.hideLoader) window.hideLoader(); }, 2500);
    });

    async function initTasks() {
        if (!document.getElementById('tasksTableBody')) return;

        if (window.showLoader) window.showLoader();
        try {
            await new Promise(r => setTimeout(r, 400));
            
            if (window.db) {
                allTasks = await window.db.getAllData('tasks') ||[];
                allClients = await window.db.getAllData('clients') || [];
            }
            if (!Array.isArray(allTasks)) allTasks =[];
            if (!Array.isArray(allClients)) allClients =[];
            
            populateClientDropdown();
            bindFilters();
            bindCrudModal();

            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            
            if (searchQuery) {
                const searchInput = document.getElementById('searchTask');
                if(searchInput) searchInput.value = searchQuery;
                applyFilters(searchQuery, 'All', 'All');
            } else {
                renderTasks(allTasks);
            }
        } catch (error) {
            console.error(error);
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    }

    function populateClientDropdown() {
        const list = document.getElementById('taskClientList');
        if(!list) return;
        list.innerHTML = `<div data-value="">-- No Client (Internal Task) --</div>`;
        allClients.forEach(c => { list.innerHTML += `<div data-value="${c.id}">${c.name}</div>`; });
        if (window.initCustomDropdowns) window.initCustomDropdowns(); 
    }

    function renderTasks(tasksToRender) {
        const tbody = document.getElementById('tasksTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const lang = window.app ? window.app.currentLang : 'en';

        if (!tasksToRender || tasksToRender.length === 0) {
            const emptyMsg = lang === 'pt' ? "Nenhuma tarefa encontrada. Está tudo em dia!" : "No tasks found. You're all caught up!";
            tbody.innerHTML = `<tr><td colspan="5"><div style="text-align: center; padding: 64px 16px; color: var(--text-muted);"><span class="iconify" data-icon="ph:folder-open-fill" style="font-size: 64px; color: var(--border); margin-bottom: 16px;"></span><p style="font-weight: 500; font-size: 15px;">${emptyMsg}</p></div></td></tr>`;
            return;
        }

        const btnDoneTxt = lang === 'pt' ? 'Concluir' : 'Mark Done';
        const btnUndoTxt = lang === 'pt' ? 'Desfazer' : 'Undo';

        tasksToRender.sort((a, b) => {
            if (a.status === 'Pending' && b.status === 'Done') return -1;
            if (a.status === 'Done' && b.status === 'Pending') return 1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        tasksToRender.forEach(task => {
            const tr = document.createElement('tr');
            const isDone = task.status === 'Done';
            if (isDone) tr.classList.add('task-done');

            let clientName = 'Internal Task';
            let clientHTML = `<span class="iconify" data-icon="ph:buildings-fill"></span> ${clientName}`;

            if (task.clientId) {
                const client = allClients.find(c => String(c.id) === String(task.clientId));
                if (client) {
                    clientName = client.name;
                    const avatar = window.app ? window.app.getUnsplashAvatar(clientName, 'company') : '';
                    clientHTML = `<div style="width: 20px; height: 20px; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 6px;"><img src="${avatar}" style="width:100%; height:100%; object-fit:cover;"></div>${clientName}`;
                }
            }

            let priorityClass = 'low';
            if (task.priority === 'High') priorityClass = 'high';
            else if (task.priority === 'Medium') priorityClass = 'medium';

            let actionBtnHTML = '';
            if (isDone) {
                actionBtnHTML = `<button class="btn-action btn-undo" title="Undo" onclick="window.toggleTaskStatus('${task.id}', 'Pending')"><span class="iconify" data-icon="ph:arrow-u-up-left-fill"></span> ${btnUndoTxt}</button>
                                 <button class="btn-action btn-delete" title="Delete Task" onclick="window.deleteTask('${task.id}')"><span class="iconify" data-icon="ph:trash-fill"></span></button>`;
            } else {
                actionBtnHTML = `<button class="btn-action btn-check" title="Complete" onclick="window.toggleTaskStatus('${task.id}', 'Done')"><span class="iconify" data-icon="ph:check-bold"></span> ${btnDoneTxt}</button>
                                 <button class="btn-action" title="Edit Task" style="background: var(--primary); color: #fff;" onclick="window.editTask('${task.id}')"><span class="iconify" data-icon="ph:pencil-simple-fill"></span></button>
                                 <button class="btn-action btn-delete" title="Delete Task" onclick="window.deleteTask('${task.id}')"><span class="iconify" data-icon="ph:trash-fill"></span></button>`;
            }

            const statusIcon = isDone ? '<span class="iconify" data-icon="ph:check-circle-fill"></span>' : '<span class="iconify" data-icon="ph:clock-fill"></span>';
            const statusClass = isDone ? 'done' : 'pending';
            const displayStatus = lang === 'pt' && isDone ? 'Concluído' : (lang === 'pt' && !isDone ? 'Pendente' : task.status);

            tr.innerHTML = `
                <td>
                    <div class="task-title">${task.title}</div>
                    <div class="task-client" style="display:flex; align-items:center; margin-top:4px; font-size:12px; color:var(--text-muted);">${clientHTML}</div>
                </td>
                <td><span class="badge ${priorityClass}">${task.priority}</span></td>
                <td style="font-weight: 500;">${task.dueDate}</td>
                <td><span class="status-badge ${statusClass}">${statusIcon} ${displayStatus}</span></td>
                <td class="actions-cell">${actionBtnHTML}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.toggleTaskStatus = async function(taskId, newStatus) {
        const task = allTasks.find(t => String(t.id) === String(taskId));
        if (!task) return;

        if (window.showLoader) window.showLoader(); 
        try {
            await new Promise(r => setTimeout(r, 400));
            task.status = newStatus;
            await window.db.updateItem('tasks', task);
            
            const lang = window.app ? window.app.currentLang : 'en';
            if (newStatus === 'Done') {
                if(window.showToast) window.showToast(lang === 'pt' ? 'Tarefa concluída!' : 'Task marked as done!', 'success');
                const actText = lang === 'pt' ? `Tarefa concluída: ${task.title}` : `Completed task: ${task.title}`;
                await window.db.updateItem('activities', { date: "Just now", text: actText });
                if(window.addNotificationTrigger) window.addNotificationTrigger();
            } else {
                if(window.showToast) window.showToast(lang === 'pt' ? 'Tarefa reaberta.' : 'Task status reset to Pending.', 'info');
            }

            const searchInput = document.getElementById('searchTask');
            const statusVal = document.getElementById('statusFilterDropdown');
            const priorityVal = document.getElementById('priorityFilterDropdown');
            
            applyFilters(
                searchInput ? searchInput.value : '', 
                statusVal ? statusVal.getAttribute('data-current-value') : 'All', 
                priorityVal ? priorityVal.getAttribute('data-current-value') : 'All'
            );
        } catch (err) {
            console.error(err);
            if(window.showToast) window.showToast("Error updating task status.", "error");
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    };

    window.deleteTask = async function(id) {
        const lang = window.app ? window.app.currentLang : 'en';
        const isPt = lang === 'pt';
        
        if (!window.customConfirm) return;
        
        const userConfirmed = await window.customConfirm(
            isPt ? "Tem a certeza que deseja eliminar esta tarefa?" : "Are you sure you want to delete this task?",
            isPt ? "Remover Tarefa" : "Delete Task", isPt
        );

        if (userConfirmed) {
            if (window.showLoader) window.showLoader();
            try {
                await new Promise(r => setTimeout(r, 400));
                const targetId = isNaN(id) ? id : Number(id);
                await window.db.deleteItem('tasks', targetId);
                allTasks = allTasks.filter(t => String(t.id) !== String(id));
                
                if (window.showToast) window.showToast(isPt ? "Tarefa removida com sucesso!" : "Task deleted successfully!", "success");
                
                const searchInput = document.getElementById('searchTask');
                const statusVal = document.getElementById('statusFilterDropdown');
                const priorityVal = document.getElementById('priorityFilterDropdown');
                
                applyFilters(
                    searchInput ? searchInput.value : '', 
                    statusVal ? statusVal.getAttribute('data-current-value') : 'All', 
                    priorityVal ? priorityVal.getAttribute('data-current-value') : 'All'
                );
            } catch (error) {
                console.error(error);
                if (window.showToast) window.showToast("Failed to delete task.", "error");
            } finally {
                if (window.hideLoader) window.hideLoader();
            }
        }
    };

    window.editTask = function(taskId) {
        const task = allTasks.find(t => String(t.id) === String(taskId));
        if (!task) return;

        const modal = document.getElementById('crudTaskModal');
        if(!modal) return;

        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDate').value = task.dueDate;

        const clientInput = document.getElementById('taskClientSelect');
        const clientDropdown = document.getElementById('taskClientDropdown');
        if (clientInput && clientDropdown) {
            clientInput.value = task.clientId || '';
            clientDropdown.setAttribute('data-current-value', task.clientId || '');
            if (task.clientId) {
                const client = allClients.find(c => String(c.id) === String(task.clientId));
                clientDropdown.querySelector('span:first-child').innerText = client ? client.name : '-- No Client --';
            } else {
                clientDropdown.querySelector('span:first-child').innerText = '-- No Client (Internal Task) --';
            }
        }

        const priorityInput = document.getElementById('taskPriority');
        const priorityDropdown = document.getElementById('taskPriorityDropdown');
        if (priorityInput && priorityDropdown) {
            priorityInput.value = task.priority;
            priorityDropdown.setAttribute('data-current-value', task.priority);
            priorityDropdown.querySelector('span:first-child').innerText = task.priority;
        }

        const lang = window.app ? window.app.currentLang : 'en';
        document.querySelector('#crudTaskModal .modal-title').innerHTML = `<span class="iconify" data-icon="ph:pencil-simple-fill"></span> ${lang === 'pt' ? 'Editar Tarefa' : 'Edit Task'}`;
        
        modal.classList.add('active');
    };

    function bindCrudModal() {
        const modal = document.getElementById('crudTaskModal');
        const form = document.getElementById('formCreateTask');
        const btnOpenAddTask = document.getElementById('btnOpenAddTask');
        const closeTaskModal = document.getElementById('closeTaskModal');
        const cancelTaskBtn = document.getElementById('cancelTaskBtn');

        if (!modal || !form || !btnOpenAddTask || !closeTaskModal || !cancelTaskBtn) return;

        btnOpenAddTask.addEventListener('click', () => {
            form.reset();
            document.getElementById('taskId').value = ""; 
            
            const clientInput = document.getElementById('taskClientSelect');
            const clientDropdown = document.getElementById('taskClientDropdown');
            if (clientInput && clientDropdown) {
                clientInput.value = '';
                clientDropdown.setAttribute('data-current-value', '');
                clientDropdown.querySelector('span:first-child').innerText = '-- No Client (Internal Task) --';
            }

            const priorityInput = document.getElementById('taskPriority');
            const priorityDropdown = document.getElementById('taskPriorityDropdown');
            if (priorityInput && priorityDropdown) {
                priorityInput.value = 'Medium';
                priorityDropdown.setAttribute('data-current-value', 'Medium');
                priorityDropdown.querySelector('span:first-child').innerText = 'Medium';
            }

            const lang = window.app ? window.app.currentLang : 'en';
            document.querySelector('#crudTaskModal .modal-title').innerHTML = `<span class="iconify" data-icon="ph:check-square-fill"></span> ${lang === 'pt' ? 'Criar Nova Tarefa' : 'Create New Task'}`;
            
            modal.classList.add('active');
        });

        const closeModal = () => { modal.classList.remove('active'); form.reset(); };
        closeTaskModal.addEventListener('click', closeModal);
        cancelTaskBtn.addEventListener('click', closeModal);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (window.showLoader) window.showLoader(); 
            
            const clientIdVal = document.getElementById('taskClientSelect') ? document.getElementById('taskClientSelect').value : null;
            const isEditing = document.getElementById('taskId').value !== "";
            const targetId = isEditing ? parseInt(document.getElementById('taskId').value) : Date.now();
            const currentTask = isEditing ? allTasks.find(t => String(t.id) === String(targetId)) : null;

            const taskData = {
                id: targetId,
                title: document.getElementById('taskTitle').value,
                clientId: clientIdVal ? parseInt(clientIdVal) : null,
                dueDate: document.getElementById('taskDate').value,
                priority: document.getElementById('taskPriority') ? document.getElementById('taskPriority').value : 'Medium',
                status: currentTask ? currentTask.status : 'Pending'
            };

            try {
                await new Promise(r => setTimeout(r, 400));
                await window.db.updateItem('tasks', taskData);
                const lang = window.app ? window.app.currentLang : 'en';

                if (isEditing) {
                    if(window.showToast) window.showToast(lang === 'pt' ? 'Tarefa atualizada com sucesso!' : 'Task updated successfully!', 'success');
                } else {
                    if(window.showToast) window.showToast(lang === 'pt' ? 'Nova tarefa agendada!' : 'New task scheduled!', 'success');
                    const actText = lang === 'pt' ? `Nova tarefa agendada: ${taskData.title}` : `New task scheduled: ${taskData.title}`;
                    await window.db.updateItem('activities', { date: "Just now", text: actText });
                    if(window.addNotificationTrigger) window.addNotificationTrigger();
                }

                closeModal();
                initTasks(); 
            } catch (error) {
                console.error(error);
                if(window.showToast) window.showToast("Failed to save task.", "error");
            } finally {
                if (window.hideLoader) window.hideLoader();
            }
        });
    }

    function applyFilters(searchTerm, statusTerm, priorityTerm) {
        searchTerm = searchTerm.toLowerCase();
        
        const filtered = allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm);
            const matchesStatus = statusTerm === 'All' || task.status === statusTerm;
            const matchesPriority = priorityTerm === 'All' || task.priority === priorityTerm;
            
            return matchesSearch && matchesStatus && matchesPriority;
        });

        renderTasks(filtered);
    }

    function bindFilters() {
        const searchInput = document.getElementById('searchTask');
        const statusFilterDropdown = document.getElementById('statusFilterDropdown');
        const priorityFilterDropdown = document.getElementById('priorityFilterDropdown');
        
        if(!searchInput || !statusFilterDropdown || !priorityFilterDropdown) return;

        const triggerFilter = () => {
            applyFilters(
                searchInput.value, 
                statusFilterDropdown.getAttribute('data-current-value'), 
                priorityFilterDropdown.getAttribute('data-current-value')
            );
        };

        searchInput.addEventListener('input', triggerFilter);
        
        statusFilterDropdown.addEventListener('dropdownChange', async () => {
            if(window.showLoader) window.showLoader();
            await new Promise(r => setTimeout(r, 300));
            triggerFilter();
            if(window.hideLoader) window.hideLoader();
        });
        
        priorityFilterDropdown.addEventListener('dropdownChange', async () => {
            if(window.showLoader) window.showLoader();
            await new Promise(r => setTimeout(r, 300));
            triggerFilter();
            if(window.hideLoader) window.hideLoader();
        });
    }
})();