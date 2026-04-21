console.log("📝 Notepad iniciado");

document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor");
    const params = new URLSearchParams(window.location.search);
    const fullPath = params.get("fullpath");

    console.log("📂 Arquivo:", fullPath);

    // Função para navegar até o diretório do arquivo
    function getFileFromPath(path) {
        if (!path) return null;
        let parts = path.split("\\");
        let fileName = parts.pop();
        let dir = window.fileSystem;
        for (let p of parts) {
            if (dir && dir[p]) {
                dir = dir[p];
            } else {
                return null;
            }
        }
        return { dir, fileName };
    }

    function loadFile() {
        if (!fullPath) {
            editor.value = "Nenhum arquivo especificado. Use 'notepad arquivo.txt' no terminal.";
            return;
        }
        let result = getFileFromPath(fullPath);
        if (result) {
            let content = result.dir[result.fileName];
            editor.value = (content !== undefined) ? content : "";
        } else {
            editor.value = "Arquivo não encontrado ou caminho inválido.";
        }
    }

    function saveFile() {
        if (!fullPath) return;
        let result = getFileFromPath(fullPath);
        if (result) {
            result.dir[result.fileName] = editor.value;
            if (window.saveFileSystem) window.saveFileSystem();
        }
    }

    loadFile();
    editor.addEventListener("input", saveFile);
});