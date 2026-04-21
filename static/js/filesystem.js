console.log("📁 Filesystem carregado - versão corrigida");

function loadFileSystem() {
    let data = localStorage.getItem("win11fs");
    if (data) {
        return JSON.parse(data);
    }
    // Estrutura inicial padrão
    return {
        "C:": {
            Users: {
                USUARIO: {
                    Desktop: {},
                    Documents: {},
                    Downloads: {}
                }
            }
        }
    };
}

function saveFileSystem() {
    if (window.fileSystem) {
        localStorage.setItem("win11fs", JSON.stringify(window.fileSystem));
    }
}

// SINGLE SOURCE OF TRUTH
window.fileSystem = window.fileSystem || loadFileSystem();
window.currentPath = window.currentPath || ["C:", "Users", "USUARIO"];

// Retorna o objeto do diretório atual, ou {} se o caminho for inválido
window.getCurrentDir = function() {
    if (!window.fileSystem) return {};
    let dir = window.fileSystem;
    for (let p of window.currentPath) {
        if (dir && typeof dir === 'object' && dir.hasOwnProperty(p)) {
            dir = dir[p];
        } else {
            console.warn("Caminho inválido:", window.currentPath.join("\\"));
            return {};
        }
    }
    return dir;
};

window.getPathString = function() {
    return window.currentPath.join("\\");
};

// Busca uma pasta/arquivo por nome (case insensitive) dentro de um diretório
window.findFolder = function(dir, name) {
    if (!dir || typeof dir !== 'object') return null;
    for (let item in dir) {
        if (item.toLowerCase() === name.toLowerCase()) {
            return item;
        }
    }
    return null;
};

// (Opcional) Função auxiliar para garantir que um caminho existe (cria pastas intermediárias)
window.ensurePath = function(pathArray) {
    let current = window.fileSystem;
    for (let i = 0; i < pathArray.length; i++) {
        let part = pathArray[i];
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }
    return current;
};