(function() {
    // ========== ELEMENTOS ==========
    const pagesContainer = document.getElementById('pagesContainer');
    const rulerHor = document.getElementById('rulerHor');
    const globalHeader = document.getElementById('globalHeader');
    const globalFooter = document.getElementById('globalFooter');
    
    // ========== ESTADO ==========
    let pages = [];
    let currentPageIndex = 0;
    let lastFormat = 'docx';
    
    const maxCm = 20;
    let rulerWidth = 0;
    let pxPerCm = 0;
    
    // ========== HISTÓRICO COM DEBOUNCE ==========
    let history = [];
    let historyIndex = -1;
    let ignoreNextChange = false;
    let changeTimeout = null;
    
    function captureState() {
        return {
            pagesHtml: pages.map(p => p.innerHTML),
            headerHtml: globalHeader.innerHTML,
            footerHtml: globalFooter.innerHTML,
            currentPageIndex: currentPageIndex
        };
    }
    
    function restoreState(state) {
        ignoreNextChange = true;
        while (pagesContainer.firstChild) pagesContainer.removeChild(pagesContainer.firstChild);
        pages = [];
        state.pagesHtml.forEach(html => {
            const page = createPage(html);
            pages.push(page);
        });
        globalHeader.innerHTML = state.headerHtml;
        globalFooter.innerHTML = state.footerHtml;
        currentPageIndex = state.currentPageIndex;
        pages.forEach(page => attachPageEvents(page));
        updateMarkersFromParagraph();
        ignoreNextChange = false;
    }
    
    function pushState() {
        if (ignoreNextChange) return;
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        const newState = captureState();
        history.push(newState);
        historyIndex++;
        if (history.length > 50) {
            history.shift();
            historyIndex--;
        }
    }
    
    function debouncedPushState() {
        if (ignoreNextChange) return;
        if (changeTimeout) clearTimeout(changeTimeout);
        changeTimeout = setTimeout(() => {
            pushState();
            changeTimeout = null;
        }, 300);
    }
    
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            restoreState(history[historyIndex]);
        } else {
            alert("Nada para desfazer");
        }
    }
    
    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            restoreState(history[historyIndex]);
        } else {
            alert("Nada para refazer");
        }
    }
    
    function onContentChange() {
        debouncedPushState();
    }
    
    // ========== HELPER: ALTURA A4 ==========
    function applyA4Height(pageElement) {
        // 29.7 cm = 1122.66px (1cm ≈ 37.8px)
        pageElement.style.height = (29.7 * 37.8) + 'px';
        pageElement.style.overflowY = 'auto';
        pageElement.style.backgroundColor = 'white';
    }
    
    // ========== GARANTIR PARÁGRAFOS ==========
    function ensureParagraphs(html) {
        if (!html) return '<p><br></p>';
        if (!/<(p|div|h[1-6]|blockquote|pre)>/i.test(html)) {
            let text = html.trim();
            if (text === '') return '<p><br></p>';
            let paragraphs = text.split(/\n\s*\n/);
            let result = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            return result;
        }
        return html;
    }
    
    // ========== NORMALIZAR TEXTO ==========
    function normalizeText(html) {
        let tmp = document.createElement('div');
        tmp.innerHTML = html;
        let removals = tmp.querySelectorAll('script, style, meta, link, iframe, object, embed');
        removals.forEach(el => el.remove());
        let allElements = tmp.querySelectorAll('*');
        allElements.forEach(el => {
            const attrs = el.attributes;
            for (let i = attrs.length-1; i >= 0; i--) {
                const attrName = attrs[i].name;
                if (attrName.startsWith('on') || attrName === 'style' || attrName === 'class' || attrName === 'id') {
                    el.removeAttribute(attrName);
                }
            }
        });
        let cleanHtml = tmp.innerHTML;
        cleanHtml = cleanHtml.replace(/<div[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>');
        cleanHtml = cleanHtml.replace(/<span[^>]*>/gi, '<p>').replace(/<\/span>/gi, '</p>');
        cleanHtml = cleanHtml.replace(/<p>\s*<\/p>/gi, '<p><br></p>');
        return ensureParagraphs(cleanHtml);
    }
    
    function applyNormalizeToCurrentPage() {
        const activePage = pages[currentPageIndex];
        if (!activePage) return;
        pushState();
        const originalHtml = activePage.innerHTML;
        const normalizedHtml = normalizeText(originalHtml);
        activePage.innerHTML = normalizedHtml;
        updateMarkersFromParagraph();
        alert('Texto normalizado: formatação externa e macros removidos.');
    }
    
    // ========== CRIAÇÃO DE PÁGINAS ==========
    function createPage(contentHtml = '') {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        applyA4Height(pageDiv);
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        pageContent.contentEditable = 'true';
        pageContent.innerHTML = ensureParagraphs(contentHtml);
        pageDiv.appendChild(pageContent);
        pagesContainer.appendChild(pageDiv);
        pages.push(pageContent);
        attachPageEvents(pageContent);
        return pageContent;
    }
    
    function attachPageEvents(page) {
        page.addEventListener('click', () => {
            currentPageIndex = pages.indexOf(page);
            updateMarkersFromParagraph();
        });
        page.addEventListener('keyup', () => {
            onContentChange();
            updateMarkersFromParagraph();
        });
        page.addEventListener('input', () => {
            onContentChange();
            updateMarkersFromParagraph();
        });
        page.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            const formatted = ensureParagraphs(text.replace(/\n/g, '<br>'));
            pushState();
            document.execCommand('insertHTML', false, formatted);
            updateMarkersFromParagraph();
        });
    }
    
    function initPages() {
        pagesContainer.innerHTML = '';
        pages = [];
        const firstPage = createPage(`
            <p><strong>Bem-vindo ao Simulador Word</strong> — experiência com réguas e recuos.</p>
            <p>Use a ampulheta (☝️) para definir o recuo da primeira linha. O triângulo inferior ajusta o recuo esquerdo.</p>
            <p>Pressione Ctrl+Enter para criar uma nova página.</p>
            <p><br></p>
        `);
        currentPageIndex = 0;
        pushState();
        updateMarkersFromParagraph();
    }
    
    // ========== RÉGUA HORIZONTAL (com marcas ABNT) ==========
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
        
        for (let cm = 0; cm <= maxCm; cm += 0.25) {
            const pos = cm * pxPerCm;
            const isMajor = (Math.abs(cm - Math.round(cm)) < 0.01) ||
                            (Math.abs(cm - 1.25) < 0.01) ||
                            (Math.abs(cm - 1.5) < 0.01) ||
                            (Math.abs(cm - 4.0) < 0.01);
            const isAbnt = (Math.abs(cm - 1.25) < 0.01) || (Math.abs(cm - 1.5) < 0.01) || (Math.abs(cm - 4.0) < 0.01);
            const mark = document.createElement('div');
            mark.style.position = 'absolute';
            mark.style.bottom = '0';
            mark.style.left = pos + 'px';
            mark.style.width = isMajor ? '2px' : '1px';
            mark.style.height = isMajor ? (isAbnt ? '20px' : '16px') : '8px';
            mark.style.backgroundColor = isAbnt ? '#e67e22' : '#8a8a8a';
            canvas.appendChild(mark);
            if (isMajor) {
                const num = document.createElement('div');
                num.style.position = 'absolute';
                num.style.bottom = '20px';
                num.style.left = pos + 'px';
                num.style.transform = 'translateX(-50%)';
                num.style.fontSize = '9px';
                num.style.color = isAbnt ? '#e67e22' : '#333';
                num.style.fontWeight = isAbnt ? 'bold' : 'normal';
                let valor = cm;
                if (Math.abs(cm - Math.round(cm)) < 0.01) valor = Math.round(cm);
                num.innerText = valor;
                canvas.appendChild(num);
            }
        }
        addMarkers();
    }
    
    function addMarkers() {
        const oldMarkers = rulerHor.querySelectorAll('.ruler-marker');
        oldMarkers.forEach(m => m.remove());
        const markers = {
            first: createMarker('first-line-marker', 'first'),
            left: createMarker('left-marker', 'left'),
            right: createMarker('right-marker', 'right')
        };
        rulerHor.append(markers.first, markers.left, markers.right);
        makeDraggable(markers.first, 'first');
        makeDraggable(markers.left, 'left');
        makeDraggable(markers.right, 'right');
        updateMarkersFromParagraph();
    }
    
    function createMarker(className, type) {
        const marker = document.createElement('div');
        marker.className = `ruler-marker ${className}`;
        marker.setAttribute('data-type', type);
        return marker;
    }
    
    function getParagraphAtCursor() {
        const activePage = pages[currentPageIndex];
        if (!activePage) return null;
        let sel = window.getSelection();
        if (!sel.rangeCount) return null;
        let node = sel.getRangeAt(0).startContainer;
        while (node && node !== activePage && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
        while (node && node !== activePage && !(node.tagName === 'P' || node.tagName === 'DIV' || node.tagName === 'H1' || node.tagName === 'H2')) {
            node = node.parentNode;
        }
        if (!node || node === activePage) return null;
        return node;
    }
    
    function getCurrentCm(type) {
        const p = getParagraphAtCursor();
        if (!p) return 0;
        const style = window.getComputedStyle(p);
        const pxToCm = 1 / 37.8;
        if (type === 'first') return (parseFloat(style.textIndent) || 0) * pxToCm;
        if (type === 'left') return (parseFloat(style.marginLeft) || 0) * pxToCm;
        if (type === 'right') return (parseFloat(style.marginRight) || 0) * pxToCm;
        return 0;
    }
    
    function applyIndent(type, cmValue) {
        const p = getParagraphAtCursor();
        if (!p) return;
        const cmToPx = cmValue * 37.8;
        if (type === 'first') p.style.textIndent = cmToPx + 'px';
        else if (type === 'left') p.style.marginLeft = cmToPx + 'px';
        else if (type === 'right') p.style.marginRight = cmToPx + 'px';
        updateMarkersFromParagraph();
    }
    
    function updateMarkerPosition(marker, cmValue, type) {
        if (!marker) return;
        let percent = (cmValue / maxCm) * 100;
        if (type === 'right') percent = 100 - percent;
        marker.style.left = `calc(${percent}% - 8px)`;
    }
    
    function makeDraggable(marker, type) {
        let dragging = false;
        let startX, startCm;
        let stateAtDragStart = null;
        
        marker.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startCm = getCurrentCm(type);
            stateAtDragStart = captureState();
            document.body.style.cursor = 'ew-resize';
            
            const onMouseMove = (moveEvent) => {
                if (!dragging) return;
                let deltaX = moveEvent.clientX - startX;
                let deltaCm = (deltaX / rulerWidth) * maxCm;
                let newCm = startCm + deltaCm;
                if (type === 'right') newCm = startCm - deltaCm;
                newCm = Math.min(maxCm, Math.max(0, newCm));
                applyIndent(type, newCm);
                updateMarkerPosition(marker, newCm, type);
            };
            
            const onMouseUp = () => {
                if (dragging) {
                    dragging = false;
                    const finalState = captureState();
                    if (JSON.stringify(stateAtDragStart) !== JSON.stringify(finalState)) {
                        ignoreNextChange = true;
                        history.push(finalState);
                        historyIndex++;
                        if (history.length > 50) { history.shift(); historyIndex--; }
                        ignoreNextChange = false;
                    }
                }
                document.body.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
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
    
    // ========== RÉGUA VERTICAL ==========
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
    
    // ========== COMANDOS DE FORMATAÇÃO ==========
    function exec(command, value = null) {
        const activePage = pages[currentPageIndex];
        if (!activePage) return;
        pushState();
        activePage.focus();
        document.execCommand(command, false, value);
        activePage.focus();
        updateMarkersFromParagraph();
    }
    
    // ========== RECUOS RÁPIDOS E MARGENS ==========
    function applyParagraphIndent(cm) {
        const p = getParagraphAtCursor();
        if (p) {
            pushState();
            p.style.textIndent = (cm * 37.8) + 'px';
            updateMarkersFromParagraph();
        }
    }
    
    function applyLeftMargin(cm) {
        const p = getParagraphAtCursor();
        if (p) {
            pushState();
            p.style.marginLeft = (cm * 37.8) + 'px';
            updateMarkersFromParagraph();
        }
    }
    
    function applyDocumentMargins(leftCm, rightCm) {
        pushState();
        pages.forEach(page => {
            page.style.marginLeft = (leftCm * 37.8) + 'px';
            page.style.marginRight = (rightCm * 37.8) + 'px';
        });
        updateMarkersFromParagraph();
        alert(`Margens do documento definidas: esquerda ${leftCm} cm, direita ${rightCm} cm.`);
    }
    
    function applyStyle(styleName) {
        const p = getParagraphAtCursor();
        if (!p) return;
        pushState();
        switch(styleName) {
            case 'Normal':
                p.style.fontSize = '12pt';
                p.style.fontFamily = 'Calibri';
                p.style.fontWeight = 'normal';
                p.style.fontStyle = 'normal';
                p.style.textDecoration = 'none';
                p.style.margin = '0 0 0 0';
                p.style.lineHeight = '1.5';
                break;
            case 'SemEspacamento':
                p.style.margin = '0';
                p.style.padding = '0';
                p.style.lineHeight = '1.2';
                break;
            case 'Titulo1':
                p.style.fontSize = '24pt';
                p.style.fontWeight = 'bold';
                p.style.fontFamily = 'Calibri';
                p.style.margin = '12pt 0 6pt 0';
                p.style.color = '#2c3e50';
                break;
            case 'Titulo2':
                p.style.fontSize = '18pt';
                p.style.fontWeight = 'bold';
                p.style.fontFamily = 'Calibri';
                p.style.margin = '10pt 0 4pt 0';
                p.style.color = '#34495e';
                break;
        }
        updateMarkersFromParagraph();
    }
    
    // ========== VINCULAR BOTÕES ==========
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
    document.getElementById('undoBtn')?.addEventListener('click', undo);
    document.getElementById('redoBtn')?.addEventListener('click', redo);
    document.getElementById('clearFormatBtn')?.addEventListener('click', () => exec('removeFormat'));
    document.getElementById('normalizeBtn')?.addEventListener('click', applyNormalizeToCurrentPage);
    document.getElementById('styleNormal')?.addEventListener('click', () => applyStyle('Normal'));
    document.getElementById('styleNoSpacing')?.addEventListener('click', () => applyStyle('SemEspacamento'));
    document.getElementById('styleTitle1')?.addEventListener('click', () => applyStyle('Titulo1'));
    document.getElementById('styleTitle2')?.addEventListener('click', () => applyStyle('Titulo2'));
    document.getElementById('indent125')?.addEventListener('click', () => applyParagraphIndent(1.25));
    document.getElementById('indent15')?.addEventListener('click', () => applyParagraphIndent(1.5));
    document.getElementById('citaçãoLonga')?.addEventListener('click', () => applyLeftMargin(4.0));
    document.getElementById('margensPadrao')?.addEventListener('click', () => applyDocumentMargins(3.0, 2.0));
    
    document.getElementById('insertImageBtn')?.addEventListener('click', () => {
        let url = prompt("URL da imagem:");
        if(url) exec('insertImage', url);
    });
    document.getElementById('insertTableBtn')?.addEventListener('click', () => {
        let rows = prompt("Linhas:", "3");
        let cols = prompt("Colunas:", "3");
        if(rows && cols) {
            let html = '<table border="1" cellpadding="5" style="border-collapse:collapse">';
            for(let i=0;i<parseInt(rows);i++) {
                html += '<tr>';
                for(let j=0;j<parseInt(cols);j++) html += '<td>&nbsp;</td>';
                html += '</tr>';
            }
            html += '</td><br>';
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
    
    // ========== QUEBRA DE PÁGINA ==========
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            pushState();
            const newPage = createPage('<p><br></p>');
            currentPageIndex = pages.length - 1;
            newPage.focus();
            updateMarkersFromParagraph();
        }
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            redo();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            redo();
        }
    });
    
    // ========== EXPORTAÇÃO ==========
    function getAllPagesHTML() {
        let html = '';
        pages.forEach(page => {
            html += `<div style="margin-bottom: 2cm;">${page.innerHTML}</div>`;
        });
        return html;
    }
    
    function getCompleteDocumentHTML() {
        const headerHtml = globalHeader.innerHTML.trim() ? `<div style="text-align:center; margin-bottom:1cm;">${globalHeader.innerHTML}</div>` : '';
        const footerHtml = globalFooter.innerHTML.trim() ? `<div style="text-align:center; margin-top:1cm;">${globalFooter.innerHTML}</div>` : '';
        return `${headerHtml}${getAllPagesHTML()}${footerHtml}`;
    }
    
    async function saveAsDocx() {
        const { Document, Packer, Paragraph, TextRun } = docx;
        const text = getCompleteDocumentHTML().replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n');
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
        const element = document.createElement('div');
        element.innerHTML = getCompleteDocumentHTML();
        element.style.padding = '20px';
        element.style.fontFamily = 'Calibri, sans-serif';
        const opt = { margin: 0.5, filename: 'documento.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
        html2pdf().set(opt).from(element).save();
        lastFormat = 'pdf';
    }
    
    function saveAsTxt() {
        const text = getCompleteDocumentHTML().replace(/<[^>]*>/g, '').replace(/\n+/g, '\n');
        const blob = new Blob([text], {type: 'text/plain'});
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
    
    // ========== NOVO, ABRIR, IMPRIMIR ==========
    function newDocument() {
        if (confirm("Criar um novo documento? Todo o conteúdo não salvo será perdido.")) {
            while (pagesContainer.firstChild) pagesContainer.removeChild(pagesContainer.firstChild);
            pages = [];
            const newPage = createPage('<p><br></p>');
            currentPageIndex = 0;
            globalHeader.innerText = '';
            globalFooter.innerText = '';
            applyPlaceholders();
            history = [];
            historyIndex = -1;
            pushState();
            updateMarkersFromParagraph();
        }
    }
    
    const fileInput = document.getElementById('fileOpenInput');
    function openDocument() {
        fileInput.click();
    }
    
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const fileName = file.name;
        const fileType = file.type;
        
        if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.doc')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                let content = e.target.result;
                content = content.replace(/\n/g, '<br>');
                content = ensureParagraphs(content);
                if (confirm('O conteúdo atual será substituído. Deseja continuar?')) {
                    while (pagesContainer.firstChild) pagesContainer.removeChild(pagesContainer.firstChild);
                    pages = [];
                    const newPage = createPage(content);
                    currentPageIndex = 0;
                    applyPlaceholders();
                    history = [];
                    historyIndex = -1;
                    pushState();
                    updateMarkersFromParagraph();
                }
            };
            reader.readAsText(file, 'UTF-8');
        } 
        else if (fileName.endsWith('.docx')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                let htmlContent = result.value;
                htmlContent = ensureParagraphs(htmlContent);
                if (confirm('O conteúdo atual será substituído. Deseja continuar?')) {
                    while (pagesContainer.firstChild) pagesContainer.removeChild(pagesContainer.firstChild);
                    pages = [];
                    const newPage = createPage(htmlContent);
                    currentPageIndex = 0;
                    applyPlaceholders();
                    history = [];
                    historyIndex = -1;
                    pushState();
                    updateMarkersFromParagraph();
                }
            } catch (error) {
                console.error('Erro ao ler .docx:', error);
                alert('Não foi possível abrir este arquivo .docx. Pode estar corrompido ou usar recursos muito avançados.');
            }
        } 
        else {
            alert('Formato de arquivo não suportado. Use .txt, .doc ou .docx (conversão básica).');
        }
        fileInput.value = '';
    });
    
    function printDocument() {
        const printWindow = window.open('', '_blank');
        const headerHtml = globalHeader.innerHTML.trim() ? `<div style="text-align:center; margin-bottom:1cm;">${globalHeader.innerHTML}</div>` : '';
        const footerHtml = globalFooter.innerHTML.trim() ? `<div style="text-align:center; margin-top:1cm;">${globalFooter.innerHTML}</div>` : '';
        const pagesHtml = getAllPagesHTML();
        const style = `
            <style>
                body { font-family: Calibri, Arial, sans-serif; margin: 2cm; line-height: 1.4; }
                .page { margin-bottom: 1.5cm; page-break-after: always; height: 29.7cm; overflow-y: auto; }
                .page:last-child { page-break-after: auto; }
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1px solid #aaa; padding: 5px; }
            </style>
        `;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>Imprimir Documento</title>${style}</head>
            <body>${headerHtml}${pagesHtml}${footerHtml}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
    
    // ========== PLACEHOLDERS ==========
    function applyPlaceholders() {
        if (globalHeader.innerText.trim() === '') globalHeader.innerText = 'Cabeçalho (clique para adicionar)';
        if (globalFooter.innerText.trim() === '') globalFooter.innerText = 'Rodapé (clique para adicionar)';
    }
    globalHeader.addEventListener('focus', () => {
        if (globalHeader.innerText === 'Cabeçalho (clique para adicionar)') globalHeader.innerText = '';
    });
    globalHeader.addEventListener('blur', () => {
        if (globalHeader.innerText.trim() === '') globalHeader.innerText = 'Cabeçalho (clique para adicionar)';
    });
    globalFooter.addEventListener('focus', () => {
        if (globalFooter.innerText === 'Rodapé (clique para adicionar)') globalFooter.innerText = '';
    });
    globalFooter.addEventListener('blur', () => {
        if (globalFooter.innerText.trim() === '') globalFooter.innerText = 'Rodapé (clique para adicionar)';
    });
    
    // ========== EDIÇÃO CABEÇALHO/RODAPÉ ==========
    let editingMode = 'body';
    function setEditableMode(mode) {
        editingMode = mode;
        if (mode === 'header') {
            globalHeader.contentEditable = 'true';
            globalFooter.contentEditable = 'false';
            pages.forEach(p => p.contentEditable = 'false');
            globalHeader.focus();
        } else if (mode === 'footer') {
            globalHeader.contentEditable = 'false';
            globalFooter.contentEditable = 'true';
            pages.forEach(p => p.contentEditable = 'false');
            globalFooter.focus();
        } else {
            globalHeader.contentEditable = 'false';
            globalFooter.contentEditable = 'false';
            pages.forEach(p => p.contentEditable = 'true');
            pages[currentPageIndex]?.focus();
        }
    }
    document.getElementById('editHeaderBtn')?.addEventListener('click', () => setEditableMode('header'));
    document.getElementById('editFooterBtn')?.addEventListener('click', () => setEditableMode('footer'));
    document.getElementById('editBodyBtn')?.addEventListener('click', () => setEditableMode('body'));
    
    // ========== DROPDOWN ARQUIVO ==========
    const fileMenuBtn = document.getElementById('fileMenuBtn');
    const fileDropdown = document.getElementById('fileDropdown');
    fileMenuBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileDropdown.style.display = fileDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
        if (fileDropdown) fileDropdown.style.display = 'none';
    });
    
    document.getElementById('newBtn')?.addEventListener('click', newDocument);
    document.getElementById('openBtn')?.addEventListener('click', openDocument);
    document.getElementById('saveBtn')?.addEventListener('click', save);
    document.getElementById('saveAsDocx')?.addEventListener('click', saveAsDocx);
    document.getElementById('saveAsPdf')?.addEventListener('click', saveAsPdf);
    document.getElementById('saveAsTxt')?.addEventListener('click', saveAsTxt);
    document.getElementById('printBtn')?.addEventListener('click', printDocument);
    
    // ========== TROCAR ABAS ==========
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toolbar-container').forEach(cont => cont.classList.add('hidden'));
            const tabId = btn.dataset.tab;
            if (tabId === 'home') document.getElementById('home-tools').classList.remove('hidden');
            else if (tabId === 'edit') document.getElementById('edit-tools').classList.remove('hidden');
            else if (tabId === 'insert') document.getElementById('insert-tools').classList.remove('hidden');
            else if (tabId === 'headerfooter') document.getElementById('headerfooter-tools').classList.remove('hidden');
            document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // ========== INICIALIZAÇÃO ==========
    window.addEventListener('resize', () => {
        drawRuler();
        updateMarkersFromParagraph();
    });
    initPages();
    buildVerticalScale();
    drawRuler();
    applyPlaceholders();
    setTimeout(() => {
        rulerWidth = rulerHor.clientWidth;
        drawRuler();
    }, 100);
})();