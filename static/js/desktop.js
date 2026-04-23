console.log("🪟 Desktop carregado com drag & drop, busca e relógio");

// ======================== RELÓGIO ========================
// ======================== RELÓGIO ========================
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        clockElement.innerHTML = `${timeString}<br><span class="clock-date">${dateString}</span>`;
    }
}
setInterval(updateClock, 1000);
updateClock();

// ======================== DRAG & DROP CORRIGIDO ========================
function dragStart(event) {
    const icon = event.target.closest('.icon');
    if (!icon) return;
    const app = icon.getAttribute('data-app');
    event.dataTransfer.setData("text/plain", app);
    event.dataTransfer.effectAllowed = "copy";
    // Remove a imagem fantasma padrão (opcional)
    event.dataTransfer.setDragImage(new Image(), 0, 0);
    // NÃO chame event.preventDefault() aqui!
}

function dragEnd(event) {
    // Não precisa fazer nada, mas pode manter vazio
    // Não chame event.preventDefault()
}

function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    document.querySelector('.taskbar').classList.add('drag-over');
}

function dropOnTaskbar(event) {
    event.preventDefault();
    document.querySelector('.taskbar').classList.remove('drag-over');
    const app = event.dataTransfer.getData("text/plain");
    if (app) {
        addPinnedIcon(app);
        savePinnedIcons();
    }
}

// ======================== GERENCIAR ÍCONES FIXADOS ========================
function addPinnedIcon(app) {
    const pinnedContainer = document.getElementById('pinnedIcons');
    if (pinnedContainer.querySelector(`[data-app="${app}"]`)) return;

    // Mapeamento com o nome correto da imagem (notepad.png, sem o 1)
    const appsMap = {
        explorer: { img: '/static/img/folder.png', nome: 'Documentos', fun: 'abrirExplorer()' },
        chrome:   { img: '/static/img/chrome.png', nome: 'Chrome', fun: 'abrirChrome()' },
        cmd:      { img: '/static/img/cmd.png', nome: 'CMD', fun: 'abrirCMD()' },
        notepad:  { img: '/static/img/notepad.png', nome: 'Bloco de Notas', fun: 'abrirNotepad()' }
    };
    const info = appsMap[app];
    if (!info) return;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'pinned-icon';
    iconDiv.setAttribute('data-app', app);
    iconDiv.setAttribute('onclick', info.fun);
    iconDiv.innerHTML = `
        <img src="${info.img}" alt="${info.nome}" title="${info.nome}" onerror="this.src='https://via.placeholder.com/32'">
        <span class="remove-btn" onclick="unpinIcon(this)">✕</span>
    `;
    pinnedContainer.appendChild(iconDiv);
}

function unpinIcon(btn) {
    const iconDiv = btn.closest('.pinned-icon');
    iconDiv.remove();
    savePinnedIcons();
}

function savePinnedIcons() {
    const icons = [];
    document.querySelectorAll('#pinnedIcons .pinned-icon').forEach(icon => {
        icons.push(icon.getAttribute('data-app'));
    });
    localStorage.setItem('pinnedTaskbarIcons', JSON.stringify(icons));
}

function loadPinnedIcons() {
    const saved = localStorage.getItem('pinnedTaskbarIcons');
    if (saved) {
        const apps = JSON.parse(saved);
        apps.forEach(app => addPinnedIcon(app));
    }
}

// ======================== ABRIR APLICATIVOS ========================
function abrirExplorer() { window.open("/explorer", "_blank", "width=800,height=600"); }
function abrirCMD() { window.open("/cmd", "_blank", "width=900,height=600"); }
function abrirChrome() { window.open("https://www.google.com", "_blank"); }
function abrirNotepad() { window.open("/notepad", "_blank", "width=800,height=600"); }

// Demais funções (Edge, Word, etc.)
function abrirEdge() { alert("Microsoft Edge (simulado)"); }
function abrirWord() { alert("Word (simulado)"); }
function abrirExcel() { alert("Excel (simulado)"); }
function abrirPowerPoint() { alert("PowerPoint (simulado)"); }
function abrirMail() { alert("Mail (simulado)"); }
function abrirCalendar() { alert("Calendar (simulado)"); }
function abrirStore() { alert("Microsoft Store (simulado)"); }
function abrirPhotos() { alert("Photos (simulado)"); }
function abrirCalc() { alert("Calculator (simulado)"); }
function abrirSettings() { alert("Settings (simulado)"); }
function abrirGetStarted() { alert("Get Started - Welcome to OS Universe"); }
function abrirReport() { alert("Quarterly Payroll Report"); }
function abrirItinerary() { alert("Travel Itinerary"); }
function abrirExpense() { alert("Expense Worksheet"); }

// ======================== MENU INICIAR E PESQUISA ========================
function toggleMenu() {
    const menu = document.getElementById("startMenu");
    menu.classList.toggle("show");
    if (menu.classList.contains("show")) {
        document.getElementById("searchInput").focus();
    }
}

document.addEventListener("click", function(event) {
    const menu = document.getElementById("startMenu");
    const startBtn = document.querySelector(".start");
    if (menu && startBtn && !menu.contains(event.target) && !startBtn.contains(event.target)) {
        menu.classList.remove("show");
    }
});

// ======================== BUSCA NO MENU INICIAR (com keywords) ========================
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    // Lista de aplicativos do menu (com name e keywords)
    const appsMenu = [
        { name: "Explorador de Arquivos", keywords: ["explorer", "arquivos", "pasta"], element: null, action: abrirExplorer },
        { name: "Google Chrome", keywords: ["chrome", "navegador", "google"], element: null, action: abrirChrome },
        { name: "Prompt de Comando", keywords: ["cmd", "prompt", "terminal", "comando"], element: null, action: abrirCMD },
        { name: "Bloco de Notas", keywords: ["notepad", "bloco", "notas", "texto"], element: null, action: abrirNotepad },
        { name: "Microsoft Edge", keywords: ["edge"], element: null, action: abrirEdge },
        { name: "Word", keywords: ["word"], element: null, action: abrirWord },
        { name: "Excel", keywords: ["excel"], element: null, action: abrirExcel },
        { name: "PowerPoint", keywords: ["powerpoint"], element: null, action: abrirPowerPoint },
        { name: "Mail", keywords: ["mail", "email"], element: null, action: abrirMail },
        { name: "Calendar", keywords: ["calendar", "calendário"], element: null, action: abrirCalendar },
        { name: "Microsoft Store", keywords: ["store", "loja"], element: null, action: abrirStore },
        { name: "Photos", keywords: ["photos", "fotos"], element: null, action: abrirPhotos },
        { name: "Calculator", keywords: ["calculator", "calculadora"], element: null, action: abrirCalc },
        { name: "Settings", keywords: ["settings", "configurações"], element: null, action: abrirSettings }
    ];

    // Mapeia os elementos .app-item
    const appItems = document.querySelectorAll(".app-item");
    appItems.forEach(item => {
        const text = item.innerText.trim();
        const found = appsMenu.find(app => text.includes(app.name) || app.keywords.some(kw => text.toLowerCase().includes(kw)));
        if (found) {
            found.element = item;
            // Garante que o clique original continue funcionando
            if (!item.getAttribute('data-original-onclick')) {
                item.setAttribute('data-original-onclick', item.getAttribute('onclick'));
            }
        }
    });

    function matchesQuery(app, query) {
        const lowerQuery = query.toLowerCase();
        return app.name.toLowerCase().includes(lowerQuery) ||
               app.keywords.some(kw => kw.includes(lowerQuery));
    }

    searchInput.addEventListener("input", function(e) {
        const query = e.target.value.trim();
        let anyVisible = false;
        appItems.forEach(item => {
            const text = item.innerText.trim();
            const app = appsMenu.find(a => text.includes(a.name) || a.keywords.some(kw => text.toLowerCase().includes(kw)));
            if (!query) {
                item.style.display = "block";
                anyVisible = true;
            } else if (app && matchesQuery(app, query)) {
                item.style.display = "block";
                anyVisible = true;
            } else {
                item.style.display = "none";
            }
        });
        // Opcional: tratar a seção "Recommended" também (pode ser feito de forma similar, mas deixamos simples)
        const recItems = document.querySelectorAll(".rec-item");
        recItems.forEach(item => {
            const text = item.innerText.toLowerCase();
            if (!query || text.includes(query.toLowerCase())) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    });
}

// ======================== BUSCA NA TASKBAR ========================
// ======================== BUSCA NA TASKBAR (melhorada) ========================
function setupTaskbarSearch() {
    const searchInput = document.getElementById("taskbarSearch");
    const resultsDiv = document.getElementById("searchResults");
    if (!searchInput || !resultsDiv) return;

    // Lista de aplicativos (inclui sinônimos)
    const apps = [
        { name: "Explorador de Arquivos", keywords: ["explorer", "arquivos", "pasta"], action: abrirExplorer },
        { name: "Google Chrome", keywords: ["chrome", "navegador", "google"], action: abrirChrome },
        { name: "Prompt de Comando", keywords: ["cmd", "prompt", "terminal", "comando"], action: abrirCMD },
        { name: "Bloco de Notas", keywords: ["notepad", "bloco", "notas", "texto"], action: abrirNotepad },
        { name: "Microsoft Edge", keywords: ["edge"], action: abrirEdge },
        { name: "Word", keywords: ["word"], action: abrirWord },
        { name: "Excel", keywords: ["excel"], action: abrirExcel },
        { name: "PowerPoint", keywords: ["powerpoint"], action: abrirPowerPoint },
        { name: "Mail", keywords: ["mail", "email"], action: abrirMail },
        { name: "Calendar", keywords: ["calendar", "calendário"], action: abrirCalendar },
        { name: "Microsoft Store", keywords: ["store", "loja"], action: abrirStore },
        { name: "Photos", keywords: ["photos", "fotos"], action: abrirPhotos },
        { name: "Calculator", keywords: ["calculator", "calculadora"], action: abrirCalc },
        { name: "Settings", keywords: ["settings", "configurações"], action: abrirSettings }
    ];

    function filterApps(query) {
        const lowerQuery = query.toLowerCase();
        return apps.filter(app => 
            app.name.toLowerCase().includes(lowerQuery) ||
            app.keywords.some(keyword => keyword.includes(lowerQuery))
        );
    }

    searchInput.addEventListener("input", function() {
        const query = searchInput.value.trim();
        resultsDiv.innerHTML = "";
        if (query === "") {
            resultsDiv.style.display = "none";
            return;
        }
        const filtered = filterApps(query);
        if (filtered.length === 0) {
            resultsDiv.style.display = "none";
            return;
        }
        filtered.forEach(app => {
            const item = document.createElement("div");
            item.textContent = app.name;
            item.addEventListener("click", () => {
                app.action();
                searchInput.value = "";
                resultsDiv.style.display = "none";
            });
            resultsDiv.appendChild(item);
        });
        resultsDiv.style.display = "block";
    });

    document.addEventListener("click", function(e) {
        if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.style.display = "none";
        }
    });
}

// ======================== DESLIGAR ========================
// ======================== DESLIGAR ========================
function desligar() {
    if (confirm("Deseja desligar o sistema?")) {
        // Mostra tela preta de desligamento
        document.body.innerHTML = `
            <div style="background: black; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: 'Segoe UI', sans-serif; flex-direction: column;">
                <h1>Desligando...</h1>
                <p>O sistema será desligado em 2 segundos.</p>
            </div>
        `;
        setTimeout(() => {
            // Redireciona para a página inicial (index.html - primeira tela de ligar o PC)
            window.location.href = "/";
        }, 2000);
    }
}

// ======================== INICIALIZAÇÃO ========================
document.addEventListener("DOMContentLoaded", () => {
    loadPinnedIcons();
    setupSearch();
    setupTaskbarSearch();
    const taskbar = document.querySelector('.taskbar');
    if (taskbar) taskbar.addEventListener('dragleave', () => taskbar.classList.remove('drag-over'));
});