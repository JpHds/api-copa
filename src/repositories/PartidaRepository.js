let iterator = 1;

class PartidaRepository{
    constructor(idTime1, idTime2){
        this.idPartida = iterator;
        this.idTime1 = idTime1;
        this.idTime2 = idTime2;
        this.golsMarcados = 0;
        this.golsTime1 = 0;
        this.golsTime2 = 0;
        this.vencedor = undefined;
        this.marcouGol = [];
        iterator++;
    }

    adicionarGols(qtdGols) {
        this.golsMarcados = qtdGols;
    }

    zerarGolsPartida() {
        this.golsTime1 = 0;
        this.golsTime2 = 0;
        this.golsMarcados = 0;
    }

}

export default PartidaRepository;