let card = document.getElementById("card")
let pergunta = document.getElementById("pergunta")
let resposta = document.getElementById("resposta")
let pontos = document.getElementById("pontos")

let virou = false

async function carregar() {

    let r = await fetch("/quiz")
    let dados = await r.json()

    if (dados.fim) {
        pergunta.innerText = "Fim do Quiz 🎉"
        resposta.innerText = "Parabéns!"
        return
    }

    pergunta.innerText = dados.pergunta
    resposta.innerText = dados.resposta

    card.classList.remove("virar")
    virou = false
}

card.addEventListener("click", () => {

    if (!virou) {
        card.classList.add("virar")
        virou = true
    }

})

async function verificar() {

    try {

        let r = await fetch("/status")
        let dados = await r.json()

        if (dados.acertou && virou) {

            setTimeout(async () => {

                await fetch("/proximo")

                atualizarPontos()
                carregar()

            }, 1000)

        }

    } catch(e) {
        console.log("aguardando...")
    }

}

async function atualizarPontos() {

    let r = await fetch("/pontos")
    let dados = await r.json()

    pontos.innerText = dados.pontos

}

setInterval(verificar, 500)

carregar()
atualizarPontos()