console.log("📁 Filesystem carregado - com estrutura da área de trabalho");

function loadFileSystem() {
    let data = localStorage.getItem("win11fs");
    if (data) {
        return JSON.parse(data);
    }
    // Estrutura inicial com as quatro pastas na área de trabalho
    return {
        "C:": {
            Users: {
                USUARIO: {
                    Desktop: {
                        "Documentos": {},   // atalho/pasta
                        "Chrome": {},       // atalho/pasta
                        "CMD": {},          // atalho/pasta
                        "Bloco de Notas": {} // atalho/pasta
                    },
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

// Função auxiliar para garantir que um caminho existe (cria pastas intermediárias)
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