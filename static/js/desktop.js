console.log("🪟 Desktop carregado com drag & drop");

// ======================== DRAG & DROP ========================
function dragStart(event) {
    // Guarda o tipo do aplicativo (explorer, chrome, cmd, notepad)
    const app = event.target.closest('.icon').getAttribute('data-app');
    event.dataTransfer.setData("text/plain", app);
    event.dataTransfer.effectAllowed = "copy";
    // Ícone fantasma opcional
    event.dataTransfer.setDragImage(new Image(), 0, 0);
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
    // Verifica se já está fixado
    const pinnedContainer = document.getElementById('pinnedIcons');
    if (pinnedContainer.querySelector(`[data-app="${app}"]`)) return;

    // Mapeia app -> ícone, nome e função de abrir
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
        <img src="${info.img}" alt="${info.nome}" title="${info.nome}">
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
// CORREÇÃO: Chrome agora abre diretamente o Google em nova aba
function abrirChrome() { window.open("https://www.google.com", "_blank"); }
function abrirNotepad() { window.open("/notepad", "_blank", "width=800,height=600"); }

// Demais funções (Edge, Word, etc.) mantidas iguais às anteriores
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
function abrirGetStarted() { alert("Get Started - Welcome to Windows"); }
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

function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    const appItems = document.querySelectorAll(".app-item");
    const recItems = document.querySelectorAll(".rec-item");
    searchInput.addEventListener("input", function(e) {
        const query = e.target.value.toLowerCase().trim();
        appItems.forEach(item => {
            const name = item.getAttribute("data-name") || item.innerText.toLowerCase();
            if (query === "" || name.includes(query)) {
                item.style.display = "block";
            } else {
                item.style.display = "none";
            }
        });
        recItems.forEach(item => {
            const text = item.innerText.toLowerCase();
            if (query === "" || text.includes(query)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    });
}

// ======================== DESLIGAR ========================
function desligar() {
    if (confirm("Deseja desligar o sistema?")) {
        document.body.innerHTML = `<div style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:'Segoe UI',sans-serif;flex-direction:column;"><h1>Desligando...</h1><p>O computador será desligado em 3 segundos.</p></div>`;
        setTimeout(() => window.close(), 3000);
    }
}

// ======================== INICIALIZAÇÃO ========================
document.addEventListener("DOMContentLoaded", () => {
    loadPinnedIcons();
    setupSearch();
    // Remove classe drag-over ao sair da taskbar
    const taskbar = document.querySelector('.taskbar');
    taskbar.addEventListener('dragleave', () => taskbar.classList.remove('drag-over'));
});