(function(){
    // ELEMENTOS
    const editor = document.getElementById('wordEditor');
    const headerSec = document.getElementById('headerSection');
    const footerSec = document.getElementById('footerSection');
    const rulerHor = document.getElementById('rulerHor');

    // Configurações da régua
    const maxCm = 20;
    let rulerWidth = 0;
    let pxPerCm = 0;
    let markers = { firstLine: 0, left: 0, right: 0 };

    // ======================== FUNÇÕES DA RÉGUA ========================
    function drawRuler() {
        if (!rulerHor) return;
        rulerWidth = rulerHor.clientWidth;
        pxPerCm = rulerWidth / maxCm;
        rulerHor.innerHTML = '';
        const canvas = document.createElement('div');
        canvas.className = 'ruler-canvas';
        canvas.style.position = 'relative';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        rulerHor.appendChild(canvas);
        
        for (let cm = 0; cm <= maxCm; cm += 0.5) {
            const pos = cm * pxPerCm;
            const isMajor = (cm % 1 === 0);
            const mark = document.createElement('div');
            mark.style.position = 'absolute';
            mark.style.bottom = '0';
            mark.style.left = pos + 'px';
            mark.style.width = isMajor ? '2px' : '1px';
            mark.style.height = isMajor ? '16px' : '8px';
            mark.style.backgroundColor = '#8a8a8a';
            canvas.appendChild(mark);
            if (isMajor) {
                const num = document.createElement('div');
                num.style.position = 'absolute';
                num.style.bottom = '18px';
                num.style.left = pos + 'px';
                num.style.transform = 'translateX(-50%)';
                num.style.fontSize = '9px';
                num.style.color = '#333';
                num.innerText = cm;
                canvas.appendChild(num);
            }
        }
        addMarkers();
    }

    function addMarkers() {
        // Remover marcadores antigos se existirem
        const oldMarkers = rulerHor.querySelectorAll('.ruler-marker');
        oldMarkers.forEach(m => m.remove());
        
        // Primeira linha (ampulheta)
        const firstMarker = document.createElement('div');
        firstMarker.className = 'ruler-marker first-line-marker';
        firstMarker.setAttribute('data-type', 'first');
        rulerHor.appendChild(firstMarker);
        // Recuo esquerdo
        const leftMarker = document.createElement('div');
        leftMarker.className = 'ruler-marker left-marker';
        leftMarker.setAttribute('data-type', 'left');
        rulerHor.appendChild(leftMarker);
        // Recuo direito
        const rightMarker = document.createElement('div');
        rightMarker.className = 'ruler-marker right-marker';
        rightMarker.setAttribute('data-type', 'right');
        rulerHor.appendChild(rightMarker);
        
        makeDraggable(firstMarker, 'first');
        makeDraggable(leftMarker, 'left');
        makeDraggable(rightMarker, 'right');
        
        updateMarkersFromParagraph();
    }
    
    function makeDraggable(marker, type) {
        let dragging = false;
        let startX, startCm;
        marker.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            const currentCm = getCurrentCm(type);
            startCm = currentCm;
            document.body.style.cursor = 'ew-resize';
            const onMouseMove = (moveEvent) => {
                if (!dragging) return;
                let deltaX = moveEvent.clientX - startX;
                let deltaCm = (deltaX / rulerWidth) * maxCm;
                let newCm = startCm + deltaCm;
                if (type === 'right') newCm = startCm - deltaCm;
                newCm = Math.min(maxCm, Math.max(0, newCm));
                applyIndentToParagraph(type, newCm);
                updateMarkerPosition(marker, newCm, type);
            };
            const onMouseUp = () => {
                dragging = false;
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    
    function getCurrentCm(type) {
        const p = getParagraphAtCursor();
        if (!p) return 0;
        const pxToCm = 1 / 37.8;
        const style = window.getComputedStyle(p);
        if (type === 'first') return (parseFloat(style.textIndent) || 0) * pxToCm;
        if (type === 'left') return (parseFloat(style.marginLeft) || 0) * pxToCm;
        if (type === 'right') return (parseFloat(style.marginRight) || 0) * pxToCm;
        return 0;
    }
    
    function applyIndentToParagraph(type, cmValue) {
        const p = getParagraphAtCursor();
        if (!p) return;
        const cmToPx = cmValue * 37.8;
        if (type === 'first') p.style.textIndent = cmToPx + 'px';
        else if (type === 'left') p.style.marginLeft = cmToPx + 'px';
        else if (type === 'right') p.style.marginRight = cmToPx + 'px';
    }
    
    function updateMarkerPosition(marker, cmValue, type) {
        let percent = (cmValue / maxCm) * 100;
        if (type === 'right') percent = 100 - percent;
        marker.style.left = `calc(${percent}% - 8px)`;
    }
    
    function getParagraphAtCursor() {
        let sel = window.getSelection();
        if (!sel.rangeCount) return null;
        let node = sel.getRangeAt(0).startContainer;
        while (node && node !== editor && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
        while (node && node !== editor && node.tagName !== 'P') node = node.parentNode;
        return (node && node.tagName === 'P') ? node : null;
    }
    
    function updateMarkersFromParagraph() {
        const p = getParagraphAtCursor();
        if (!p) return;
        const style = window.getComputedStyle(p);
        const pxToCm = 1 / 37.8;
        const firstCm = (parseFloat(style.textIndent) || 0) * pxToCm;
        const leftCm = (parseFloat(style.marginLeft) || 0) * pxToCm;
        const rightCm = (parseFloat(style.marginRight) || 0) * pxToCm;
        const firstMarker = document.querySelector('.first-line-marker');
        const leftMarker = document.querySelector('.left-marker');
        const rightMarker = document.querySelector('.right-marker');
        if (firstMarker) updateMarkerPosition(firstMarker, firstCm, 'first');
        if (leftMarker) updateMarkerPosition(leftMarker, leftCm, 'left');
        if (rightMarker) updateMarkerPosition(rightMarker, rightCm, 'right');
    }
    
    // ======================== RÉGUA VERTICAL ========================
    function buildVerticalScale() {
        const container = document.getElementById('verticalScale');
        if (!container) return;
        container.innerHTML = '';
        const maxCmVert = 30;
        const pxPerCmVert = 20;
        for (let cm = 1; cm <= maxCmVert; cm++) {
            const pos = (cm-1) * pxPerCmVert;
            const mark = document.createElement('div');
            mark.className = 'vertical-mark';
            mark.style.top = pos + 'px';
            const num = document.createElement('div');
            num.className = 'vertical-number';
            num.style.top = pos + 'px';
            num.innerText = cm;
            container.appendChild(mark);
            container.appendChild(num);
        }
    }
    
    // ======================== COMANDOS DE EDIÇÃO ========================
    function exec(command, value=null) { 
        editor.focus(); 
        document.execCommand(command, false, value); 
        editor.focus(); 
    }
    
    // Vincular botões
    document.getElementById('boldBtn')?.addEventListener('click', () => exec('bold'));
    document.getElementById('italicBtn')?.addEventListener('click', () => exec('italic'));
    document.getElementById('underlineBtn')?.addEventListener('click', () => exec('underline'));
    document.getElementById('fontFamily')?.addEventListener('change', (e) => exec('fontName', e.target.value));
    document.getElementById('fontSize')?.addEventListener('change', (e) => exec('fontSize', e.target.value));
    document.getElementById('fontColor')?.addEventListener('input', (e) => exec('foreColor', e.target.value));
    document.getElementById('alignLeftBtn')?.addEventListener('click', () => exec('justifyLeft'));
    document.getElementById('alignCenterBtn')?.addEventListener('click', () => exec('justifyCenter'));
    document.getElementById('alignRightBtn')?.addEventListener('click', () => exec('justifyRight'));
    document.getElementById('alignJustifyBtn')?.addEventListener('click', () => exec('justifyFull'));
    document.getElementById('bulletListBtn')?.addEventListener('click', () => exec('insertUnorderedList'));
    document.getElementById('numberedListBtn')?.addEventListener('click', () => exec('insertOrderedList'));
    document.getElementById('indentBtn')?.addEventListener('click', () => exec('indent'));
    document.getElementById('outdentBtn')?.addEventListener('click', () => exec('outdent'));
    document.getElementById('clearFormatBtn')?.addEventListener('click', () => exec('removeFormat'));
    document.getElementById('insertImageBtn')?.addEventListener('click', () => {
        let url = prompt("URL da imagem:");
        if(url) exec('insertImage', url);
    });
    document.getElementById('insertTableBtn')?.addEventListener('click', () => {
        let rows = prompt("Linhas:", "3");
        let cols = prompt("Colunas:", "3");
        if(rows && cols) {
            let html = '<table border="1" cellpadding="5" style="border-collapse:collapse">';
            for(let i=0;i<parseInt(rows);i++){ html += '<tr>'; for(let j=0;j<parseInt(cols);j++) html += '<td>&nbsp;</td>'; html += '</tr>'; }
            html += '</table><br>';
            exec('insertHTML', html);
        }
    });
    document.getElementById('insertLinkBtn')?.addEventListener('click', () => {
        let link = prompt("URL do link:");
        if(link) exec('createLink', link);
    });
    document.getElementById('insertSymbolBtn')?.addEventListener('click', () => {
        let sym = prompt("Símbolo (©, ®, ™, •, §, ¶, ★):", "©");
        if(sym) exec('insertText', sym);
    });
    
    // ======================== SALVAR ARQUIVOS ========================
    let lastFormat = 'docx';
    async function saveAsDocx() {
        const { Document, Packer, Paragraph, TextRun } = docx;
        const text = editor.innerText;
        const lines = text.split('\n');
        const paragraphs = [];
        for (let line of lines) {
            if (line.trim()) paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
        }
        const doc = new Document({ sections: [{ children: paragraphs }] });
        const blob = await Packer.toBlob(doc);
        downloadBlob(blob, 'documento.docx');
        lastFormat = 'docx';
    }
    function saveAsPdf() {
        const element = editor;
        const opt = { margin: 0.5, filename: 'documento.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(element).save();
        lastFormat = 'pdf';
    }
    function saveAsTxt() {
        const content = editor.innerText;
        const blob = new Blob([content], {type: 'text/plain'});
        downloadBlob(blob, 'documento.txt');
        lastFormat = 'txt';
    }
    function downloadBlob(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    function save() {
        if (lastFormat === 'docx') saveAsDocx();
        else if (lastFormat === 'pdf') saveAsPdf();
        else saveAsTxt();
    }
    document.getElementById('saveBtn')?.addEventListener('click', save);
    document.getElementById('saveAsDocx')?.addEventListener('click', saveAsDocx);
    document.getElementById('saveAsPdf')?.addEventListener('click', saveAsPdf);
    document.getElementById('saveAsTxt')?.addEventListener('click', saveAsTxt);
    
    // ======================== DROPDOWN ARQUIVO ========================
    const fileMenuBtn = document.getElementById('fileMenuBtn');
    const fileDropdown = document.getElementById('fileDropdown');
    fileMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileDropdown.style.display = fileDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
        if (fileDropdown) fileDropdown.style.display = 'none';
    });
    
    // ======================== CABEÇALHO / RODAPÉ ========================
    let editingMode = 'body'; // 'header', 'footer', 'body'
    function setEditableMode(mode) {
        editingMode = mode;
        if (mode === 'header') {
            headerSec.contentEditable = 'true';
            footerSec.contentEditable = 'false';
            editor.contentEditable = 'false';
            headerSec.focus();
        } else if (mode === 'footer') {
            headerSec.contentEditable = 'false';
            footerSec.contentEditable = 'true';
            editor.contentEditable = 'false';
            footerSec.focus();
        } else {
            headerSec.contentEditable = 'false';
            footerSec.contentEditable = 'false';
            editor.contentEditable = 'true';
            editor.focus();
        }
    }
    document.getElementById('editHeaderBtn')?.addEventListener('click', () => setEditableMode('header'));
    document.getElementById('editFooterBtn')?.addEventListener('click', () => setEditableMode('footer'));
    document.getElementById('editBodyBtn')?.addEventListener('click', () => setEditableMode('body'));
    
    // Placeholder para cabeçalho/rodapé
    function applyPlaceholders() {
        if (headerSec.innerText.trim() === '') headerSec.innerText = 'Clique para adicionar cabeçalho';
        if (footerSec.innerText.trim() === '') footerSec.innerText = 'Clique para adicionar rodapé';
    }
    headerSec.addEventListener('focus', () => { if (headerSec.innerText === 'Clique para adicionar cabeçalho') headerSec.innerText = ''; });
    headerSec.addEventListener('blur', () => { if (headerSec.innerText.trim() === '') headerSec.innerText = 'Clique para adicionar cabeçalho'; });
    footerSec.addEventListener('focus', () => { if (footerSec.innerText === 'Clique para adicionar rodapé') footerSec.innerText = ''; });
    footerSec.addEventListener('blur', () => { if (footerSec.innerText.trim() === '') footerSec.innerText = 'Clique para adicionar rodapé'; });
    applyPlaceholders();
    
    // ======================== TROCAR ABAS ========================
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toolbar-container').forEach(cont => cont.classList.add('hidden'));
            const tabId = btn.dataset.tab;
            if (tabId === 'home') document.getElementById('home-tools').classList.remove('hidden');
            else if (tabId === 'insert') document.getElementById('insert-tools').classList.remove('hidden');
            else if (tabId === 'headerfooter') document.getElementById('headerfooter-tools').classList.remove('hidden');
            document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // ======================== INICIALIZAÇÃO ========================
    window.addEventListener('resize', () => {
        drawRuler();
        updateMarkersFromParagraph();
    });
    editor.addEventListener('click', updateMarkersFromParagraph);
    editor.addEventListener('keyup', updateMarkersFromParagraph);
    editor.addEventListener('input', updateMarkersFromParagraph);
    buildVerticalScale();
    drawRuler();
    setTimeout(() => {
        rulerWidth = rulerHor.clientWidth;
        drawRuler();
    }, 100);
})();