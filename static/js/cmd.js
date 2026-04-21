console.log("🖥️ CMD iniciado - versão corrigida");

// ==========================
// INICIALIZAÇÃO SEGURA (usa filesystem.js se disponível)
// ==========================
if (!window.fileSystem) {
    console.warn("⚠️ filesystem.js não carregado. Criando estrutura padrão.");
    window.fileSystem = {
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
if (!window.currentPath) {
    window.currentPath = ["C:", "Users", "USUARIO"];
}
if (!window.saveFileSystem) {
    window.saveFileSystem = function() {
        console.log("⚠️ saveFileSystem não definido, alterações não serão persistidas.");
    };
}

// ==========================
// SYNC SYSTEM (salva no localStorage via filesystem.js)
// ==========================
function syncFS() {
    if (window.saveFileSystem) window.saveFileSystem();
}

// ==========================
// OUTPUT SAFE
// ==========================
function writeOutput(text) {
    const output = document.getElementById("cmd-output");
    if (!output) {
        console.log("❌ cmd-output não existe no HTML");
        return;
    }
    output.innerHTML += text + "\n";
    output.scrollTop = output.scrollHeight;
}

// ==========================
// PATH SAFE (usa função global getPathString)
// ==========================
function updatePath() {
    const path = document.getElementById("cmd-path");
    if (!path) {
        console.log("❌ cmd-path não existe no HTML");
        return;
    }
    if (typeof window.getPathString === 'function') {
        path.innerText = window.getPathString() + ">";
    } else {
        path.innerText = window.currentPath.join("\\") + ">";
    }
}

// ==========================
// COMMANDS
// ==========================
function executeCommand(cmd) {
    const args = cmd.trim().split(" ");
    const command = args[0].toLowerCase();

    // Obtém as funções globais (do filesystem.js) ou fallbacks
    const getCurrentDir = window.getCurrentDir || function() {
        let dir = window.fileSystem;
        for (let p of window.currentPath) {
            if (dir && dir[p]) dir = dir[p];
            else return {};
        }
        return dir;
    };
    const findFolder = window.findFolder || function(dir, name) {
        for (let item in dir) {
            if (item.toLowerCase() === name.toLowerCase()) return item;
        }
        return null;
    };
    const getPathString = window.getPathString || function() {
        return window.currentPath.join("\\");
    };

    switch (command) {

        // ================= DIR =================
        case "dir":
            let dir = getCurrentDir();
            for (let item in dir) {
                if (typeof dir[item] === "object") {
                    writeOutput("[DIR] " + item);
                } else {
                    writeOutput(item);
                }
            }
            break;

        // ================= CD =================
        case "cd":
            if (args[1] === "..") {
                if (window.currentPath.length > 1) {   // corrigido: permite voltar até a raiz "C:"
                    window.currentPath.pop();
                }
                break;
            }
            let folder = findFolder(getCurrentDir(), args[1]);
            if (folder) {
                window.currentPath.push(folder);
            } else {
                writeOutput("Pasta não encontrada");
            }
            break;

        // ================= MKDIR =================
        case "mkdir":
            if (!args[1]) {
                writeOutput("Nome inválido");
                break;
            }
            getCurrentDir()[args[1]] = {};
            syncFS();
            writeOutput("Pasta criada");
            break;

        // ================= RMDIR =================
     // ================= RMDIR (remove pasta, com /s para recursivo) =================
case "rmdir":
    let rmdirTarget = args[1];
    let recursive = false;
    
    // Verifica se o primeiro argumento é /s
    if (rmdirTarget === "/s") {
        recursive = true;
        rmdirTarget = args[2];
    }
    
    if (!rmdirTarget) {
        writeOutput("Uso: rmdir <pasta>   ou   rmdir /s <pasta>");
        break;
    }
    
    let targetFolderName = window.findFolder(window.getCurrentDir(), rmdirTarget);
    if (!targetFolderName) {
        writeOutput("Pasta não encontrada: " + rmdirTarget);
        break;
    }
    
    let currentDir = window.getCurrentDir();
    let targetFolder = currentDir[targetFolderName];
    
    // Verifica se é realmente uma pasta
    if (typeof targetFolder !== 'object') {
        writeOutput("Não é uma pasta. Use 'del' para remover arquivos.");
        break;
    }
    
    // Função recursiva para deletar todo o conteúdo
    function deleteRecursive(folder) {
        for (let item in folder) {
            if (typeof folder[item] === 'object') {
                deleteRecursive(folder[item]); // subpasta
            }
            delete folder[item]; // arquivo ou pasta vazia
        }
    }
    
    if (recursive) {
        // Remove todo o conteúdo recursivamente
        deleteRecursive(targetFolder);
        delete currentDir[targetFolderName];
        writeOutput("Pasta removida com sucesso (incluindo subitens): " + targetFolderName);
    } else {
        // Remove apenas se estiver vazia
        if (Object.keys(targetFolder).length === 0) {
            delete currentDir[targetFolderName];
            writeOutput("Pasta removida: " + targetFolderName);
        } else {
            writeOutput("A pasta não está vazia. Use 'rmdir /s " + rmdirTarget + "' para remover todos os arquivos e subpastas.");
        }
    }
    
    syncFS();
    break;
            let delDir = findFolder(getCurrentDir(), args[1]);
            if (delDir) {
                let dirObj = getCurrentDir();
                let conteudo = dirObj[delDir];
                // Verifica se a pasta está vazia (objeto sem propriedades próprias)
                if (typeof conteudo === 'object' && Object.keys(conteudo).length === 0) {
                    delete dirObj[delDir];
                    syncFS();
                    writeOutput("Pasta removida");
                } else {
                    writeOutput("Pasta não está vazia");
                }
            } else {
                writeOutput("Pasta não encontrada");
            }
            break;

        // ================= DEL =================
      // ================= DEL (excluir arquivo) =================
case "del":
    if (!args[1]) {
        writeOutput("Uso: del <arquivo>");
        break;
    }
    let delFile = window.findFolder(window.getCurrentDir(), args[1]);
    if (!delFile) {
        writeOutput("Arquivo não encontrado: " + args[1]);
        break;
    }
    let dirDel = window.getCurrentDir();
    // Verifica se é um arquivo (string) e não uma pasta (objeto)
    if (typeof dirDel[delFile] === 'string') {
        delete dirDel[delFile];
        window.syncFS ? window.syncFS() : (window.saveFileSystem && window.saveFileSystem());
        writeOutput("Arquivo removido: " + delFile);
    } else {
        writeOutput("Não é um arquivo. Use 'rmdir' para remover pastas.");
    }
    break;
            let file = findFolder(getCurrentDir(), args[1]);
            if (file) {
                let dirObj = getCurrentDir();
                if (typeof dirObj[file] !== 'object') {   // apenas arquivos (não objetos)
                    delete dirObj[file];
                    syncFS();
                    writeOutput("Arquivo removido");
                } else {
                    writeOutput("Use 'rmdir' para remover pastas");
                }
            } else {
                writeOutput("Arquivo não encontrado");
            }
            break;


            

        // ================= ECHO (CORRIGIDO) =================
        case "echo":
            let full = cmd.substring(4).trim();
            let parts = full.split(">");
            if (parts.length < 2) {
                writeOutput("Uso: echo texto > arquivo.txt");
                break;
            }
            let content = parts[0].trim();
            let fileName = parts.slice(1).join(">").trim();
            if (fileName === "") {
                writeOutput("Nome do arquivo inválido");
                break;
            }
            if (!fileName.includes(".")) {
                fileName += ".txt";
            }
            let dirEcho = getCurrentDir();
            if (!dirEcho) {
                writeOutput("Erro no filesystem");
                break;
            }
            dirEcho[fileName] = content;
            syncFS();
            writeOutput("Arquivo criado: " + fileName);
            break;

        // ================= NOTEPAD (com caminho absoluto) =================
        case "notepad":
            if (!args[1]) {
                writeOutput("Uso: notepad arquivo.txt");
                break;
            }
            let fullPath = getPathString() + "\\" + args[1];
            window.open("/notepad?fullpath=" + encodeURIComponent(fullPath), "_blank");
            break;

        // ================= CLS =================
        case "cls":
            document.getElementById("cmd-output").innerHTML = "";
            break;

            case "exit":
        case "sair":
            writeOutput("Encerrando o terminal...");
            setTimeout(() => window.close(), 100);
            break;

        // ================= HELP =================
        case "help":
            writeOutput("Comandos disponíveis:");
            writeOutput("  dir                 - Lista arquivos e pastas");
            writeOutput("  cd <pasta>          - Entra na pasta");
            writeOutput("  cd ..               - Volta uma pasta");
            writeOutput("  mkdir <nome>        - Cria uma pasta");
            writeOutput("  rmdir <nome>        - Remove pasta vazia");
            writeOutput("  del <arquivo>       - Remove arquivo");
            writeOutput("  echo texto > arquivo.txt - Cria arquivo de texto");
            writeOutput("  notepad <arquivo>   - Abre o bloco de notas");
            writeOutput("  cls                 - Limpa a tela");
            writeOutput("  help                - Exibe esta ajuda");
            break;

        default:
            writeOutput("Comando não reconhecido: " + command);
    }

    
}

// ==========================
// START - Inicialização da página
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const output = document.getElementById("cmd-output");
    const input = document.getElementById("cmd-input");
    const path = document.getElementById("cmd-path");

    if (!output || !input || !path) {
        console.log("❌ CMD executado fora da página correta");
        return;
    }

    // Banner inicial
    writeOutput("Microsoft Windows [versão 10.0.26200.8246]");
    writeOutput("(c) Microsoft Corporation. Todos os direitos reservados.");
    writeOutput("");

    updatePath();

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            let value = input.value;
            writeOutput((typeof window.getPathString === 'function' ? window.getPathString() : window.currentPath.join("\\")) + "> " + value);
            executeCommand(value);
            input.value = "";
            updatePath();
        }
    });

    // Foco automático no input
    input.focus();
});