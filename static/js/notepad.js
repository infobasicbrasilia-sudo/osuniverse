console.log("📝 Bloco de Notas avançado carregado");

let currentFullPath = null;
let isModified = false;
let currentFontSize = 14;
let wordWrap = true;

// Obter parâmetro fullpath da URL
const urlParams = new URLSearchParams(window.location.search);
const fullPathParam = urlParams.get('fullpath');

// Função para obter diretório e nome do arquivo a partir do caminho completo
function getFileFromPath(fullPath) {
    if (!fullPath) return null;
    const parts = fullPath.split('\\');
    const fileName = parts.pop();
    let dir = window.fileSystem;
    for (let p of parts) {
        if (dir && dir[p]) dir = dir[p];
        else return null;
    }
    return { dir, fileName };
}

// Carregar conteúdo do arquivo
function loadFile() {
    if (!currentFullPath) {
        document.getElementById('editor').value = '';
        updateStatusMessage('Novo arquivo');
        return;
    }
    const result = getFileFromPath(currentFullPath);
    if (result && result.dir[result.fileName] !== undefined) {
        const content = result.dir[result.fileName];
        document.getElementById('editor').value = content;
        updateStatusMessage(`Aberto: ${result.fileName}`);
    } else {
        document.getElementById('editor').value = '';
        updateStatusMessage('Arquivo não encontrado, criando novo');
        isModified = true;
    }
    isModified = false;
    updateWindowTitle();
}

// Salvar arquivo atual (se existir caminho)
function saveFile() {
    if (!currentFullPath) {
        saveAsFile();
        return;
    }
    const content = document.getElementById('editor').value;
    const result = getFileFromPath(currentFullPath);
    if (result) {
        result.dir[result.fileName] = content;
        if (window.saveFileSystem) window.saveFileSystem();
        isModified = false;
        updateStatusMessage(`Salvo: ${result.fileName}`);
        updateWindowTitle();
    } else {
        alert('Erro ao salvar: caminho inválido');
    }
}

// Salvar como
function saveAsFile() {
    let fileName = prompt('Nome do arquivo (com .txt ou sem):', 'novo_arquivo.txt');
    if (!fileName) return;
    if (!fileName.endsWith('.txt')) fileName += '.txt';
    // Obtém o diretório atual do sistema (usando window.currentPath)
    let currentDirPath = window.currentPath || ["C:", "Users", "USUARIO"];
    let dir = window.fileSystem;
    for (let p of currentDirPath) {
        if (dir && dir[p]) dir = dir[p];
        else {
            alert('Diretório atual inválido');
            return;
        }
    }
    if (dir[fileName]) {
        if (!confirm('Arquivo já existe. Substituir?')) return;
    }
    const content = document.getElementById('editor').value;
    dir[fileName] = content;
    if (window.saveFileSystem) window.saveFileSystem();
    currentFullPath = [...currentDirPath, fileName].join('\\');
    isModified = false;
    updateWindowTitle();
    updateStatusMessage(`Salvo como: ${fileName}`);
}

// Novo arquivo (limpa editor, pergunta se quiser salvar)
function newFile() {
    if (isModified) {
        const resp = confirm('O arquivo atual foi modificado. Deseja salvar as alterações?');
        if (resp) saveFile();
    }
    currentFullPath = null;
    document.getElementById('editor').value = '';
    isModified = false;
    updateWindowTitle();
    updateStatusMessage('Novo arquivo');
}

// Abrir arquivo (selecionar via prompt)
function openFile() {
    if (isModified) {
        const resp = confirm('O arquivo atual foi modificado. Deseja salvar?');
        if (resp) saveFile();
    }
    const filePath = prompt('Digite o caminho completo do arquivo (ex: C:\\Users\\USUARIO\\meu_arquivo.txt):', '');
    if (!filePath) return;
    const result = getFileFromPath(filePath);
    if (result && result.dir[result.fileName] !== undefined) {
        currentFullPath = filePath;
        loadFile();
    } else {
        alert('Arquivo não encontrado. Criando novo arquivo com esse nome.');
        // Cria o arquivo vazio no diretório especificado (se possível)
        const parts = filePath.split('\\');
        const fileName = parts.pop();
        let dir = window.fileSystem;
        for (let p of parts) {
            if (dir && dir[p]) dir = dir[p];
            else {
                alert('Caminho inválido');
                return;
            }
        }
        dir[fileName] = '';
        if (window.saveFileSystem) window.saveFileSystem();
        currentFullPath = filePath;
        loadFile();
    }
}

// Fechar janela
function exitNotepad() {
    if (isModified) {
        const resp = confirm('Há alterações não salvas. Deseja salvar antes de sair?');
        if (resp) saveFile();
    }
    window.close();
}

// Atualizar título da janela
function updateWindowTitle() {
    let title = 'Bloco de Notas';
    if (currentFullPath) {
        const parts = currentFullPath.split('\\');
        const fileName = parts.pop();
        title = `${fileName} - Bloco de Notas`;
    }
    if (isModified) title = '* ' + title;
    document.title = title;
}

// Atualizar mensagem na barra de status
function updateStatusMessage(msg) {
    const statusSpan = document.getElementById('statusMsg');
    if (statusSpan) statusSpan.textContent = msg;
}

// Atualizar posição do cursor
function updateCursorPosition() {
    const editor = document.getElementById('editor');
    const text = editor.value;
    const cursorPos = editor.selectionStart;
    const lines = text.substring(0, cursorPos).split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    document.getElementById('statusCursor').innerText = `Linha ${line}, Coluna ${col}`;
}

// Alternar quebra de linha
function toggleWordWrap() {
    wordWrap = !wordWrap;
    const editor = document.getElementById('editor');
    editor.style.whiteSpace = wordWrap ? 'pre-wrap' : 'pre';
    editor.style.overflowX = wordWrap ? 'auto' : 'scroll';
    updateStatusMessage(`Quebra automática ${wordWrap ? 'ativada' : 'desativada'}`);
}

// Configurar fonte (simples)
function changeFont() {
    const newSize = prompt('Tamanho da fonte (em pixels):', currentFontSize);
    if (newSize && !isNaN(newSize)) {
        currentFontSize = parseInt(newSize);
        document.getElementById('editor').style.fontSize = currentFontSize + 'px';
        updateStatusMessage(`Fonte alterada para ${currentFontSize}px`);
    }
}

// Eventos de teclado (Ctrl+S, Ctrl+O, Ctrl+N)
function handleKeydown(e) {
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                saveFile();
                break;
            case 'o':
                e.preventDefault();
                openFile();
                break;
            case 'n':
                e.preventDefault();
                newFile();
                break;
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    if (!editor) return;

    // Define caminho inicial
    if (fullPathParam) {
        currentFullPath = decodeURIComponent(fullPathParam);
    } else {
        currentFullPath = null;
    }
    loadFile();

    // Eventos do editor
    editor.addEventListener('input', () => {
        isModified = true;
        updateWindowTitle();
        updateStatusMessage('Editando...');
    });
    editor.addEventListener('keyup', updateCursorPosition);
    editor.addEventListener('click', updateCursorPosition);
    editor.addEventListener('select', updateCursorPosition);
    editor.addEventListener('keydown', handleKeydown);

    // Menus suspensos
    function setupMenu(menuId, dropdownId) {
        const menu = document.getElementById(menuId);
        const dropdown = document.getElementById(dropdownId);
        if (!menu || !dropdown) return;
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        // Fechar ao clicar fora
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });
        dropdown.addEventListener('click', (e) => e.stopPropagation());
    }
    setupMenu('menuArquivo', 'dropdownArquivo');
    setupMenu('menuEditar', 'dropdownEditar');
    setupMenu('menuFormatar', 'dropdownFormatar');
    setupMenu('menuAjuda', 'dropdownAjuda');

    // Ações do menu Arquivo
    document.getElementById('novoBtn')?.addEventListener('click', newFile);
    document.getElementById('abrirBtn')?.addEventListener('click', openFile);
    document.getElementById('salvarBtn')?.addEventListener('click', saveFile);
    document.getElementById('salvarComoBtn')?.addEventListener('click', saveAsFile);
    document.getElementById('sairBtn')?.addEventListener('click', exitNotepad);

    // Ações do menu Editar (básicas)
    document.getElementById('desfazerBtn')?.addEventListener('click', () => document.execCommand('undo'));
    document.getElementById('recortarBtn')?.addEventListener('click', () => document.execCommand('cut'));
    document.getElementById('copiarBtn')?.addEventListener('click', () => document.execCommand('copy'));
    document.getElementById('colarBtn')?.addEventListener('click', () => document.execCommand('paste'));
    document.getElementById('deletarBtn')?.addEventListener('click', () => {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        if (start !== end) {
            editor.value = editor.value.slice(0, start) + editor.value.slice(end);
            editor.setSelectionRange(start, start);
            editor.dispatchEvent(new Event('input'));
        }
    });
    document.getElementById('selecionarTudoBtn')?.addEventListener('click', () => editor.select());
    document.getElementById('horaDataBtn')?.addEventListener('click', () => {
        const now = new Date();
        const datetime = now.toLocaleString();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.slice(0, start) + datetime + editor.value.slice(end);
        editor.setSelectionRange(start + datetime.length, start + datetime.length);
        editor.dispatchEvent(new Event('input'));
    });
    // Localizar, substituir, ir para (simples)
    document.getElementById('localizarBtn')?.addEventListener('click', () => {
        const search = prompt('Localizar:', '');
        if (search) {
            const text = editor.value;
            const pos = text.indexOf(search);
            if (pos !== -1) {
                editor.setSelectionRange(pos, pos + search.length);
                editor.focus();
            } else alert('Não encontrado');
        }
    });
    document.getElementById('substituirBtn')?.addEventListener('click', () => {
        const search = prompt('Localizar:', '');
        if (search) {
            const replace = prompt('Substituir por:', '');
            const newText = editor.value.split(search).join(replace);
            editor.value = newText;
            editor.dispatchEvent(new Event('input'));
        }
    });
    document.getElementById('irParaBtn')?.addEventListener('click', () => {
        const line = prompt('Ir para linha:', '1');
        if (line && !isNaN(line)) {
            const lines = editor.value.split('\n');
            let pos = 0;
            for (let i = 0; i < parseInt(line)-1 && i < lines.length; i++) {
                pos += lines[i].length + 1;
            }
            editor.setSelectionRange(pos, pos);
            editor.focus();
        }
    });

    // Menu Formatar
    document.getElementById('quebraLinhaBtn')?.addEventListener('click', toggleWordWrap);
    document.getElementById('fonteBtn')?.addEventListener('click', changeFont);

    // Menu Ajuda
    document.getElementById('sobreBtn')?.addEventListener('click', () => {
        alert('Bloco de Notas Simulado\nVersão 1.0\nSimulador Windows 11 Educacional');
    });

    // Status inicial
    updateCursorPosition();
    toggleWordWrap(); // ativa quebra por padrão
});