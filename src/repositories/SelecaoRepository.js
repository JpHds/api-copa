let iterator = 1;

class SelecaoRepository {

    constructor(nome) {
        this.id = iterator;
        this.nome = nome;
        this.goleiros = [];
        this.jogadores = [];
        this.partidas = [];
        iterator++;
    }

    adicionarGoleiro(goleiro){
        if(this.goleiros.length != 3) {
            this.goleiros.push(goleiro);
        }
    }

    adicionarJogador(jogador) {
        if(this.jogadores.length != 20) {
            this.jogadores.push(jogador);
        }
    }
    
}

export default SelecaoRepository;