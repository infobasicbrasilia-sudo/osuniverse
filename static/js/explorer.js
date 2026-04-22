console.log("📂 Explorer carregado - com colapsar, criar e menu contexto");

let historyStack = [];
let historyIndex = -1;
let currentPathArray = [];

function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function getDirFromPath(pathArr) {
    let dir = window.fileSystem;
    for (let p of pathArr) {
        if (dir && dir[p]) dir = dir[p];
        else return null;
    }
    return dir;
}

function buildTree() {
    const treeContainer = document.getElementById('treeView');
    if (!treeContainer) return;
    treeContainer.innerHTML = '';
    const root = window.fileSystem;
    
    function renderNode(obj, pathArray, indent = 0, parentNode = null) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                const nodePath = [...pathArray, key];
                const isExpanded = localStorage.getItem('expanded_' + nodePath.join('_')) === 'true';
                const div = document.createElement('div');
                div.className = 'tree-item';
                div.style.paddingLeft = (indent * 16 + 20) + 'px';
                
                const toggleSpan = document.createElement('span');
                toggleSpan.style.cursor = 'pointer';
                toggleSpan.style.marginRight = '4px';
                toggleSpan.textContent = isExpanded ? '▼' : '▶';
                
                const folderSpan = document.createElement('span');
                folderSpan.textContent = ` 📁 ${key}`;
                folderSpan.style.cursor = 'pointer';
                
                div.appendChild(toggleSpan);
                div.appendChild(folderSpan);
                
                const childrenContainer = document.createElement('div');
                childrenContainer.style.display = isExpanded ? 'block' : 'none';
                
                toggleSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newExpanded = childrenContainer.style.display !== 'block';
                    childrenContainer.style.display = newExpanded ? 'block' : 'none';
                    toggleSpan.textContent = newExpanded ? '▼' : '▶';
                    localStorage.setItem('expanded_' + nodePath.join('_'), newExpanded);
                });
                
                folderSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigateToPath(nodePath);
                });
                
                treeContainer.appendChild(div);
                treeContainer.appendChild(childrenContainer);
                renderNodeInside(obj[key], nodePath, indent + 1, childrenContainer);
            }
        }
    }
    
    function renderNodeInside(obj, pathArray, indent, container) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                const nodePath = [...pathArray, key];
                const isExpanded = localStorage.getItem('expanded_' + nodePath.join('_')) === 'true';
                const div = document.createElement('div');
                div.className = 'tree-item';
                div.style.paddingLeft = (indent * 16 + 20) + 'px';
                
                const toggleSpan = document.createElement('span');
                toggleSpan.style.cursor = 'pointer';
                toggleSpan.style.marginRight = '4px';
                toggleSpan.textContent = isExpanded ? '▼' : '▶';
                
                const folderSpan = document.createElement('span');
                folderSpan.textContent = ` 📁 ${key}`;
                folderSpan.style.cursor = 'pointer';
                
                div.appendChild(toggleSpan);
                div.appendChild(folderSpan);
                
                const childrenContainer = document.createElement('div');
                childrenContainer.style.display = isExpanded ? 'block' : 'none';
                
                toggleSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newExpanded = childrenContainer.style.display !== 'block';
                    childrenContainer.style.display = newExpanded ? 'block' : 'none';
                    toggleSpan.textContent = newExpanded ? '▼' : '▶';
                    localStorage.setItem('expanded_' + nodePath.join('_'), newExpanded);
                });
                
                folderSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigateToPath(nodePath);
                });
                
                container.appendChild(div);
                container.appendChild(childrenContainer);
                renderNodeInside(obj[key], nodePath, indent + 1, childrenContainer);
            }
        }
    }
    
    renderNode(root, []);
}

function buildFileList() {
    const container = document.getElementById('fileList');
    if (!container) return;
    container.innerHTML = '';
    let currentDir = getDirFromPath(currentPathArray);
    if (!currentDir) return;
    const items = [];
    for (let name in currentDir) {
        const isFolder = typeof currentDir[name] === 'object';
        items.push({ name, isFolder, content: currentDir[name] });
    }
    items.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
    });
    for (let item of items) {
        const row = document.createElement('div');
        row.className = 'file-item';
        const icon = item.isFolder ? '📁' : '📄';
        const type = item.isFolder ? 'Pasta' : 'Arquivo';
        const size = item.isFolder ? '' : (item.content?.length || 0) + ' bytes';
        row.innerHTML = `
            <div class="file-icon"><span>${icon}</span> ${item.name}</div>
            <div>--</div>
            <div>${type}</div>
            <div>${size}</div>
        `;
        row.addEventListener('click', () => {
            if (item.isFolder) {
                navigateToPath([...currentPathArray, item.name]);
            } else {
                const fullPath = currentPathArray.join('\\') + '\\' + item.name;
                window.open('/notepad?fullpath=' + encodeURIComponent(fullPath), '_blank', 'width=800,height=600');
            }
        });
        container.appendChild(row);
    }
}

function updateAddressBar() {
    const addr = document.getElementById('addressBar');
    if (addr) addr.value = currentPathArray.join('\\');
}

function refresh() {
    buildTree();
    buildFileList();
    updateAddressBar();
}

function navigateToPath(newPath) {
    const testDir = getDirFromPath(newPath);
    if (!testDir) return;
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }
    historyStack.push([...newPath]);
    historyIndex++;
    currentPathArray = [...newPath];
    window.currentPath = currentPathArray;
    refresh();
}

function goBack() {
    if (historyIndex > 0) {
        historyIndex--;
        currentPathArray = [...historyStack[historyIndex]];
        window.currentPath = currentPathArray;
        refresh();
    }
}

function goForward() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        currentPathArray = [...historyStack[historyIndex]];
        window.currentPath = currentPathArray;
        refresh();
    }
}

function goUp() {
    if (currentPathArray.length > 1) {
        const parent = currentPathArray.slice(0, -1);
        navigateToPath(parent);
    }
}

function createNewFolder() {
    let folderName = prompt("Nome da nova pasta:", "Nova pasta");
    if (!folderName) return;
    let currentDir = getDirFromPath(currentPathArray);
    if (currentDir[folderName]) {
        alert("Já existe um item com esse nome.");
        return;
    }
    currentDir[folderName] = {};
    if (window.saveFileSystem) window.saveFileSystem();
    refresh();
}

function createNewFile() {
    let fileName = prompt("Nome do novo arquivo (com .txt ou sem):", "novo_arquivo.txt");
    if (!fileName) return;
    if (!fileName.endsWith('.txt')) fileName += '.txt';
    let currentDir = getDirFromPath(currentPathArray);
    if (currentDir[fileName]) {
        alert("Já existe um arquivo com esse nome.");
        return;
    }
    currentDir[fileName] = "";
    if (window.saveFileSystem) window.saveFileSystem();
    refresh();
}

// ======================== MENU DE CONTEXTO ========================
function showContextMenu(event, targetType, targetPath = null) {
    event.preventDefault();
    let menu = document.getElementById('contextMenu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.className = 'context-menu';
        document.body.appendChild(menu);
    }
    menu.innerHTML = '';
    const items = [
        { label: '📁 Nova pasta', action: () => createNewFolder() },
        { label: '📄 Novo arquivo .txt', action: () => createNewFile() },
        { label: '⟳ Atualizar', action: () => refresh() }
    ];
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.innerHTML = item.label;
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            item.action();
            closeContextMenu();
        });
        menu.appendChild(menuItem);
    });
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.display = 'block';
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
        document.addEventListener('contextmenu', closeContextMenu);
    }, 0);
}

function closeContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.style.display = 'none';
    document.removeEventListener('click', closeContextMenu);
    document.removeEventListener('contextmenu', closeContextMenu);
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.currentPath && window.currentPath.length) {
        currentPathArray = [...window.currentPath];
    } else {
        currentPathArray = ["C:", "Users", "USUARIO"];
        window.currentPath = currentPathArray;
    }
    historyStack = [[...currentPathArray]];
    historyIndex = 0;
    refresh();

    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const upBtn = document.getElementById('upBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const newFolderBtn = document.getElementById('newFolderBtn');
    const newFileBtn = document.getElementById('newFileBtn');
    if (backBtn) backBtn.addEventListener('click', goBack);
    if (forwardBtn) forwardBtn.addEventListener('click', goForward);
    if (upBtn) upBtn.addEventListener('click', goUp);
    if (refreshBtn) refreshBtn.addEventListener('click', refresh);
    if (newFolderBtn) newFolderBtn.addEventListener('click', createNewFolder);
    if (newFileBtn) newFileBtn.addEventListener('click', createNewFile);

    const fileListDiv = document.getElementById('fileList');
    const treeViewDiv = document.getElementById('treeView');
    if (fileListDiv) {
        fileListDiv.addEventListener('contextmenu', (e) => showContextMenu(e, 'list'));
    }
    if (treeViewDiv) {
        treeViewDiv.addEventListener('contextmenu', (e) => showContextMenu(e, 'tree'));
    }
});