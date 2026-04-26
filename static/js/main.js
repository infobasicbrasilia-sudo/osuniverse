function ligar() {
    // Adiciona efeito de clique no botão
    const btn = document.querySelector('.power-btn');
    btn.style.opacity = '0.5';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

    // Simula o POST (ligar o computador) e redireciona para a BIOS
    setTimeout(() => {
        window.location.href = "/bios";
    }, 800);
}