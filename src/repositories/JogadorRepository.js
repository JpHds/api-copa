let iterator = 1;

class JogadorRepository {
    constructor(nome) {
        this.id = iterator;
        this.nome = nome;
        this.golsMarcados = 0;
        iterator++
    }

    zerarGolsJogador() {
        this.golsMarcados = 0;
    }

    reiniciarContador() {
        iterator -=20;
    }
}

export default JogadorRepository;