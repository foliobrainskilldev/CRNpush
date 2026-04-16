(() => {
    document.addEventListener('DOMContentLoaded', () => {
        window.addEventListener('componentsLoaded', initDashboard);
    });

    async function initDashboard() {
        if (!document.getElementById('kpiClients')) return; 

        window.showLoader();

        try {
            await new Promise(resolve => setTimeout(resolve, 400));

            const clients = await window.db.getAllData('clients');
            const leads = await window.db.getAllData('leads');
            const deals = await window.db.getAllData('deals');
            const tasks = await window.db.getAllData('tasks');
            const activities = await window.db.getAllData('activities');
            
            const lineData = await window.db.getAllData('multiLineData').then(res => res.length ? res : window.crmData.multiLineData);
            const barData = await window.db.getAllData('barChartData').then(res => res.length ? res : window.crmData.barChartData);
            const doughnutData = window.crmData.doughnutData; 

            updateKPIs(clients, leads, deals, tasks);
            renderTasks(tasks);
            renderActivities(activities);
            
            bindKPIInteractions(leads, deals, tasks);
            populateClientDropdown(clients);
            bindTopControls(lineData, barData, doughnutData);
            bindCrudModal();
            bindExportCSVModal(deals);
            
            renderMultiLineChart(lineData);
            renderDoughnutChart(doughnutData);
            renderHorizontalBarChart(barData);

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    renderMultiLineChart(lineData);
                    renderDoughnutChart(doughnutData);
                    renderHorizontalBarChart(barData);
                }, 250);
            });

        } catch (error) {
            console.error(error);
            window.showToast("Error loading dashboard data.", "error");
        } finally {
            window.hideLoader();
        }
    }

    function bindExportCSVModal(deals) {
        const btnOpen = document.getElementById('btnExportCSV');
        if (!btnOpen) return;

        btnOpen.onclick = () => {
            if (deals.length === 0) return window.showToast("No data available to export.", "warning");
            
            const dateStr = new Date().toISOString().split('T')[0];
            const defaultName = `NexusCRM_Report_${dateStr}`;
            
            window.openExportModal(
                defaultName, 
                "Name your file to save the latest Deals report offline.", 
                "Defina o nome do seu arquivo para baixar o relatório de negócios:",
                async (fileName) => {
                    const headers = Object.keys(deals[0]);
                    const rowsData = deals.map(deal => headers.map(h => deal[h]));
                    window.downloadCSV(fileName, headers, rowsData);
                }
            );
        };
    }

    function bindTopControls(lineData, barData, doughnutData) {
        const dateDropdown = document.getElementById('globalDateFilterDropdown');
        if(dateDropdown){
            dateDropdown.addEventListener('dropdownChange', async () => {
                window.showLoader();
                await new Promise(r => setTimeout(r, 500)); 
                renderMultiLineChart(lineData);
                renderDoughnutChart(doughnutData);
                renderHorizontalBarChart(barData);
                window.hideLoader();
                window.showToast("Dashboard data filtered.", "info");
            });
        }
        window.initCustomDropdowns();
    }

    function populateClientDropdown(clients) {
        const list = document.getElementById('dealClientList');
        if(!list) return;
        list.innerHTML = '';
        clients.forEach(c => { list.innerHTML += `<div data-value="${c.id}">${c.name}</div>`; });
        window.initCustomDropdowns();
    }

    function bindCrudModal() {
        const modal = document.getElementById('crudDealModal');
        const form = document.getElementById('formCreateDeal');
        if(!modal || !form) return;

        document.getElementById('btnOpenAddDeal').onclick = () => {
            form.reset();
            document.getElementById('dealId').value = ''; 
            
            document.getElementById('dealClientSelect').value = '';
            document.getElementById('dealClientDropdown').querySelector('span:first-child').innerText = 'Select a client...';
            
            document.getElementById('dealStage').value = 'Prospecting';
            document.getElementById('dealStageDropdown').querySelector('span:first-child').innerText = 'Prospecting';

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
            
            const targetId = Date.now();
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
                await new Promise(r => setTimeout(r, 600)); 
                await window.db.updateItem('deals', dealData);
                
                const lang = window.app ? window.app.currentLang : 'en';
                window.showToast(lang === 'pt' ? "Novo negócio criado!" : "New Deal created successfully!", "success");
                
                const actText = lang === 'pt' ? `Criou o negócio: ${dealData.title}` : `Created new deal: ${dealData.title}`;
                await window.db.updateItem('activities', { date: "Just now", text: actText });
                
                window.addNotificationTrigger(); 
                fechar();
                initDashboard(); 
            } catch (error) {
                console.error(error);
                window.hideLoader();
                window.showToast("Failed to save Deal.", "error");
            }
        });
    }

    function updateKPIs(clients, leads, deals, tasks) {
        document.getElementById('kpiClients').innerText = clients.length;
        document.getElementById('kpiLeads').innerText = leads.filter(l => l.status === 'New').length;
        document.getElementById('kpiDeals').innerText = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length;
        document.getElementById('kpiTasks').innerText = tasks.filter(t => t.status === 'Pending').length;

        const wonDeals = deals.filter(d => d.stage === 'Won').length;
        const totalFinished = deals.filter(d => d.stage === 'Won' || d.stage === 'Lost').length;
        document.getElementById('kpiWinRate').innerText = (totalFinished > 0 ? Math.round((wonDeals / totalFinished) * 100) : 0) + '%';

        const revenue = deals.filter(d => d.stage === 'Won').reduce((sum, deal) => sum + deal.value, 0);
        const lang = window.app ? window.app.currentLang : 'en';
        const fmt = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        document.getElementById('kpiRevenue').innerText = fmt.format(revenue);
    }

    function renderTasks(tasks) {
        const list = document.getElementById('dashboardTasks');
        if(!list) return;
        list.innerHTML = '';
        const pendingTasks = tasks.filter(t => t.status === 'Pending').slice(0, 4);
        
        if (pendingTasks.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="iconify" data-icon="ph:folder-open-fill"></span><p>No upcoming tasks. You're all caught up!</p></div>`;
            return;
        }
        
        pendingTasks.forEach(task => {
            list.innerHTML += `<li><div><h4 style="font-weight: 600; color:var(--text-main); font-size: 14px;">${task.title}</h4><p style="font-size:12px; color:var(--text-muted);">${task.dueDate}</p></div><span style="font-size: 12px; font-weight: 600; color: #111c44; padding:4px 8px; background:var(--warning); border-radius:6px;">${task.priority}</span></li>`;
        });
    }

    function renderActivities(activities) {
        const list = document.getElementById('dashboardActivity');
        if(!list) return;
        list.innerHTML = '';
        const recent = activities.slice().reverse().slice(0, 4);
        const lang = window.app ? window.app.currentLang : 'en';
        
        if (recent.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="iconify" data-icon="ph:clock-fill"></span><p>No recent activity logged.</p></div>`;
            return;
        }

        recent.forEach(act => {
            const text = act.text[lang] || act.text['en'] || act.text; 
            list.innerHTML += `
                <li>
                    <div style="margin-top: 2px;"><span class="iconify" data-icon="ph:check-circle-fill" style="color: var(--primary); font-size: 20px;"></span></div>
                    <div style="flex: 1;">
                        <h4 style="font-weight: 600; font-size: 14px; color:var(--text-main); margin-bottom: 2px;">${text}</h4>
                        <p style="font-size:12px; color:var(--text-muted);">${act.date}</p>
                    </div>
                </li>`;
        });
    }

    function bindKPIInteractions(leads, deals, tasks) {
        const modalOverlay = document.getElementById('kpiModalOverlay');
        const modalTitle = document.getElementById('kpiModalTitle');
        const modalList = document.getElementById('kpiModalList');
        
        document.getElementById('kpiModalClose').onclick = () => modalOverlay.classList.remove('active');

        const openModal = (title, iconHTML, listHTML) => {
            modalTitle.innerHTML = `${iconHTML} ${title}`;
            modalList.innerHTML = listHTML || `<li style="color:var(--text-muted); justify-content:center; border:none; background:transparent;">No data found.</li>`;
            modalOverlay.classList.add('active');
        };

        const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

        document.getElementById('kpiCardLeads').onclick = () => {
            let html = '';
            leads.filter(l => l.status === 'New').forEach(l => {
                html += `<li><div><div class="modal-list-title">${l.name}</div><div class="modal-list-meta">${l.company} | ${l.source}</div></div><span style="color:var(--success); font-weight:600;">${formatMoney(l.estimatedValue)}</span></li>`;
            });
            openModal('New Leads', '<span class="iconify" data-icon="ph:magnet-fill" style="color:var(--success)"></span>', html);
        };

        document.getElementById('kpiCardDeals').onclick = () => {
            let html = '';
            deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').forEach(d => {
                html += `<li><div><div class="modal-list-title">${d.title}</div><div class="modal-list-meta">Stage: ${d.stage}</div></div><span style="color:var(--warning); font-weight:600;">${formatMoney(d.value)}</span></li>`;
            });
            openModal('Active Deals', '<span class="iconify" data-icon="ph:handshake-fill" style="color:var(--warning)"></span>', html);
        };

        document.getElementById('kpiCardTasks').onclick = () => {
            let html = '';
            tasks.filter(t => t.status === 'Pending').forEach(t => {
                html += `<li><div><div class="modal-list-title">${t.title}</div><div class="modal-list-meta">Due: ${t.dueDate}</div></div><span style="color:white; font-size:12px; font-weight:600; padding:4px 8px; border-radius:4px; background:var(--danger);">${t.priority}</span></li>`;
            });
            openModal('Pending Tasks', '<span class="iconify" data-icon="ph:check-circle-fill" style="color:var(--danger)"></span>', html);
        };

        document.getElementById('kpiCardWinRate').onclick = () => {
            const won = deals.filter(d => d.stage === 'Won').length;
            const lost = deals.filter(d => d.stage === 'Lost').length;
            let html = `
                <li style="background:rgba(0, 181, 226, 0.05); border-radius:12px; padding:16px; border:1px solid rgba(0, 181, 226, 0.2);"><div><div class="modal-list-title">Total Closed Deals</div></div><span style="font-size:18px; font-weight:700;">${won + lost}</span></li>
                <li><div><div class="modal-list-title" style="color:var(--success)">Won</div></div><span style="color:var(--success); font-weight:600;">${won}</span></li>
                <li><div><div class="modal-list-title" style="color:var(--danger)">Lost</div></div><span style="color:var(--danger); font-weight:600;">${lost}</span></li>`;
            openModal('Win Rate Details', '<span class="iconify" data-icon="ph:trend-up-fill" style="color:var(--info)"></span>', html);
        };

        document.getElementById('kpiCardRevenue').onclick = () => {
            let html = '';
            deals.filter(d => d.stage === 'Won').forEach(d => {
                html += `<li><div><div class="modal-list-title">${d.title}</div><div class="modal-list-meta">Closed on ${d.closeDate}</div></div><span style="color:var(--purple); font-weight:600;">${formatMoney(d.value)}</span></li>`;
            });
            openModal('Revenue Breakdown', '<span class="iconify" data-icon="ph:currency-dollar-fill" style="color:var(--purple)"></span>', html);
        };
    }

    function getTooltip() {
        let tt = d3.select("#d3-tooltip");
        if (tt.empty()) {
            tt = d3.select("body").append("div").attr("id", "d3-tooltip")
                .style("position", "absolute").style("background", "var(--bg-card)").style("color", "var(--text-main)")
                .style("padding", "8px 16px").style("border-radius", "8px").style("box-shadow", "0px 10px 20px rgba(0,0,0,0.5)")
                .style("font-size", "13px").style("font-weight", "600").style("pointer-events", "none")
                .style("opacity", 0).style("z-index", 9999).style("transition", "opacity 0.2s ease, transform 0.1s ease");
        }
        return tt;
    }

    function renderMultiLineChart(data) {
        const container = document.getElementById('multiLineChart');
        if (!container || data.length === 0) return;
        container.innerHTML = ''; document.getElementById('multiLineLegend').innerHTML = '';

        const lang = window.app ? window.app.currentLang : 'en';
        const clientKeys = Object.keys(data[0]).filter(k => k !== 'monthEn' && k !== 'monthPt' && k !== 'id');

        const margin = { top: 20, right: 10, bottom: 30, left: 40 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;

        const svg = d3.select("#multiLineChart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const defs = svg.append("defs");
        const colorScale = d3.scaleOrdinal().domain(clientKeys).range(["#4318ff", "#01b574", "#00b5e2", "#ee5d50"]);

        clientKeys.forEach((key, i) => {
            const filter = defs.append("filter").attr("id", `shadow-${i}`).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
            filter.append("feDropShadow").attr("dx", "0").attr("dy", "8").attr("stdDeviation", "6").attr("flood-color", colorScale(key)).attr("flood-opacity", "0.4");
        });

        const x = d3.scalePoint().domain(data.map(d => lang === 'pt' ? d.monthPt : d.monthEn)).range([0, width]).padding(0);
        const maxValue = d3.max(data, d => d3.max(clientKeys, key => d[key]));
        const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height, 0]);

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).call(g => g.select(".domain").remove()).selectAll("text").style("fill", "var(--text-muted)");
        svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d/1000}k`).tickSize(-width)).call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").attr("stroke", "var(--border)").attr("stroke-dasharray", "4,4")).selectAll("text").style("fill", "var(--text-muted)");

        clientKeys.forEach((key, i) => {
            const line = d3.line().x(d => x(lang === 'pt' ? d.monthPt : d.monthEn)).y(d => y(d[key])).curve(d3.curveMonotoneX);
            const path = svg.append("path").datum(data).attr("fill", "none").attr("stroke", colorScale(key)).attr("stroke-width", 3).attr("d", line).style("filter", `url(#shadow-${i})`);
            const totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength).attr("stroke-dashoffset", totalLength).transition().duration(1500).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0);

            svg.selectAll(".dot-" + key.replace(/\s+/g, '')).data(data).enter().append("circle")
                .attr("cx", d => x(lang === 'pt' ? d.monthPt : d.monthEn)).attr("cy", d => y(d[key])).attr("r", 0).attr("fill", colorScale(key)).attr("stroke", "var(--bg-card)").attr("stroke-width", 2).style("cursor", "pointer")
                .on("mouseover", function(event, d) {
                    d3.select(this).transition().duration(200).attr("r", 7).attr("stroke-width", 3);
                    getTooltip().html(`<span style="color:${colorScale(key)}">${key}</span><br>$${d[key].toLocaleString()}`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px").style("opacity", 1);
                }).on("mouseout", function() {
                    d3.select(this).transition().duration(200).attr("r", 5).attr("stroke-width", 2);
                    getTooltip().style("opacity", 0);
                }).transition().delay(1300).duration(400).attr("r", 5);
        });

        clientKeys.forEach(key => {
            document.getElementById('multiLineLegend').innerHTML += `<div class="legend-item"><div class="legend-color" style="background-color: ${colorScale(key)}"></div>${key}</div>`;
        });
    }

    function renderDoughnutChart(data) {
        const container = document.getElementById('doughnutChart');
        if (!container || !data) return;
        container.innerHTML = ''; document.getElementById('doughnutLegend').innerHTML = '';

        const width = container.clientWidth, height = container.clientHeight, radius = Math.min(width, height) / 2;
        const svg = d3.select("#doughnutChart").append("svg").attr("width", width).attr("height", height).append("g").attr("transform", `translate(${width / 2},${height / 2})`);
        const color = d3.scaleOrdinal().domain(data.map(d => d.label)).range(["#4318ff", "#01b574", "#ffce20", "#ee5d50", "#00b5e2"]);
        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius * 0.85).cornerRadius(6);

        const path = svg.selectAll("path").data(pie(data)).enter().append("path").attr("fill", d => color(d.data.label)).attr("stroke", "var(--bg-card)").attr("stroke-width", "3px").style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 0.7).attr("transform", "scale(1.05)");
                getTooltip().html(`${d.data.label}<br><span style="color:var(--primary)">$${d.data.value.toLocaleString()}</span>`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px").style("opacity", 1);
            }).on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("opacity", 1).attr("transform", "scale(1)");
                getTooltip().style("opacity", 0);
            });

        path.transition().duration(1000).attrTween("d", function(d) {
            const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
            return function(t) { d.endAngle = i(t); return arc(d); }
        });

        data.forEach(d => {
            document.getElementById('doughnutLegend').innerHTML += `<div class="legend-item"><div class="legend-color" style="background-color: ${color(d.label)}"></div>${d.label}</div>`;
        });
    }

    function renderHorizontalBarChart(data) {
        const container = document.getElementById('barChart');
        if (!container || data.length === 0) return;
        container.innerHTML = '';

        const lang = window.app ? window.app.currentLang : 'en';
        const margin = { top: 10, right: 20, bottom: 20, left: 110 }; 
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;

        const svg = d3.select("#barChart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        const colors =["#4318ff", "#01b574", "#ffce20", "#ee5d50", "#00b5e2", "#8a2be2"];

        const iconMap = {
            "Website": "ph:globe", "Site": "ph:globe",
            "Referral": "ph:users", "Indicação": "ph:users",
            "Social": "ph:share-network",
            "Ads": "ph:megaphone", "Anúncios": "ph:megaphone",
            "Events": "ph:calendar-star", "Eventos": "ph:calendar-star",
            "Cold Call": "ph:phone", "Contato": "ph:phone"
        };

        const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([0, width]);
        const y = d3.scaleBand().domain(data.map(d => lang === 'pt' ? d.labelPt : d.labelEn)).range([0, height]).paddingInner(0.15);

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickSize(-height))
            .call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").attr("stroke", "var(--border)").attr("stroke-dasharray", "2,2")).selectAll("text").style("fill", "var(--text-muted)");

        svg.append("g").call(d3.axisLeft(y).tickSize(0)).call(g => g.select(".domain").remove()).selectAll("text").remove();

        data.forEach(d => {
            const labelText = lang === 'pt' ? d.labelPt : d.labelEn;
            const yPos = y(labelText);
            
            svg.append("foreignObject")
                .attr("x", -100)
                .attr("y", yPos)
                .attr("width", 90)
                .attr("height", y.bandwidth())
                .append("xhtml:div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("justify-content", "flex-end")
                .style("gap", "6px")
                .style("height", "100%")
                .style("font-size", "12px")
                .style("font-weight", "600")
                .style("color", "var(--text-main)")
                .html(`<span class="iconify" data-icon="${iconMap[labelText]}" style="font-size: 16px; color: var(--text-muted);"></span> ${labelText}`);
        });

        svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar")
            .attr("y", d => y(lang === 'pt' ? d.labelPt : d.labelEn)).attr("x", 0).attr("height", y.bandwidth()).attr("width", 0).attr("fill", (d, i) => colors[i % colors.length]).attr("rx", 4).style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 0.7);
                const label = lang === 'pt' ? d.labelPt : d.labelEn;
                getTooltip().html(`${label}<br><span style="color:var(--text-muted)">${d.value} Leads</span>`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px").style("opacity", 1);
            }).on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("opacity", 1);
                getTooltip().style("opacity", 0);
            }).transition().duration(1000).delay((d, i) => i * 150).attr("width", d => x(d.value));
    }
})();