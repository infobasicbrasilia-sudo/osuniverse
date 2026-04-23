console.log("BIOS POST - Simulação avançada");

// Lista de etapas do POST (mensagens, atraso opcional)
const etapas = [
    "Iniciando POST (Power-On Self Test)...",
    "CPU: Intel(R) Core(TM) i7-12700K @ 3.60GHz detectado",
    "Cache L1: 384 KB, L2: 2.0 MB, L3: 25 MB - OK",
    "AES-NI, VT-x, Turbo Boost disponível",
    "Memória física instalada: 16384 MB (DDR4-3200)",
    "Teste de memória RAM: [##############] 100% OK",
    "Slot 0: 8192 MB, Slot 1: 8192 MB - ambos funcionando",
    "Placa-mãe: ASUS ROG STRIX Z790 (chipset Intel Z790)",
    "Controladora SATA: 6 portas detectadas",
    "Disco 0: SSD 512 GB (NVMe) - Samsung 980 Pro",
    "Disco 1: HD 1 TB (SATA) - Seagate Barracuda",
    "Inicializando periféricos PCIe...",
    "Placa de vídeo: NVIDIA GeForce RTX 4060 (8 GB VRAM)",
    "Áudio: Realtek HD Audio (ALC1220)",
    "Rede: Intel I225-V 2.5Gb Ethernet",
    "Conexão Bluetooth e Wi-Fi: detectados",
    "Portas USB: 8 hubs, dispositivos conectados: 2",
    "Teclado e mouse detectados",
    "Verificação de temperatura: CPU 38°C, GPU 42°C",
    "Fan CPU: 2100 RPM, Chassis fans: 3",
    "Integridade do sistema: OK",
    "Procurando dispositivo de boot...",
    "Carregando bootloader do sistema...",
    "✅ POST concluído com sucesso. Iniciando sistema operacional..."
];

let indice = 0;
let paused = false;
let intervalo = null;
let timeoutRedirect = null;

const postArea = document.getElementById('postArea');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');

// Função para adicionar linha com efeito de digitação (opcional)
function addMessage(text) {
    const p = document.createElement('div');
    p.textContent = text;
    postArea.appendChild(p);
    // Scroll para o final
    postArea.scrollTop = postArea.scrollHeight;
}

// Função para pular um passo (opcional)
function nextStep() {
    if (indice < etapas.length) {
        addMessage(etapas[indice]);
        indice++;
        return true;
    } else {
        // Todas as etapas concluídas
        if (!paused) {
            stopPOST();
            // Redireciona após 2 segundos
            timeoutRedirect = setTimeout(() => {
                window.location.href = "/boot";
            }, 2000);
        }
        return false;
    }
}

function stopPOST() {
    if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
    }
}

function startPOST() {
    if (intervalo) stopPOST();
    paused = false;
    pauseBtn.style.display = 'inline-block';
    resumeBtn.style.display = 'none';
    intervalo = setInterval(() => {
        if (!paused) {
            const hasMore = nextStep();
            if (!hasMore && !paused) {
                stopPOST();
            }
        }
    }, 600); // 0.6 segundos entre cada etapa (ajustável)
}

function pausePOST() {
    if (paused) return;
    paused = true;
    // Limpa o intervalo para não avançar enquanto pausado
    if (intervalo) {
        clearInterval(intervalo);
        intervalo = null;
    }
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'inline-block';
    addMessage("\n⏸️  [POST PAUSADO - use Continuar para retomar]");
    postArea.scrollTop = postArea.scrollHeight;
}

function resumePOST() {
    if (!paused) return;
    paused = false;
    pauseBtn.style.display = 'inline-block';
    resumeBtn.style.display = 'none';
    addMessage("\n▶️  [POST RESUMIDO]");
    postArea.scrollTop = postArea.scrollHeight;
    // Cria novo intervalo apenas se ainda não terminou
    if (indice < etapas.length) {
        intervalo = setInterval(() => {
            if (!paused) {
                const hasMore = nextStep();
                if (!hasMore && !paused) {
                    stopPOST();
                }
            }
        }, 600);
    } else {
        // Se já terminou, pode redirecionar imediatamente?
        if (!timeoutRedirect) {
            timeoutRedirect = setTimeout(() => {
                window.location.href = "/boot";
            }, 2000);
        }
    }
}

// Eventos dos botões
pauseBtn.addEventListener('click', pausePOST);
resumeBtn.addEventListener('click', resumePOST);

// Inicializar POST automático
startPOST();

// Para limpar timeout ao sair da página (boa prática)
window.addEventListener('beforeunload', () => {
    if (timeoutRedirect) clearTimeout(timeoutRedirect);
    if (intervalo) clearInterval(intervalo);
});