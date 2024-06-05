import express, { json } from 'express';
import SelecaoRepository from './repositories/SelecaoRepository.js';
import JogadorRepository from './repositories/JogadorRepository.js'
import PartidaRepository from './repositories/PartidaRepository.js';

const app = express();

app.use(json());

const selecoesFase1 = [];

const partidasFase1 = [];

const selecoesFase2 = [];

const partidasFase2 = [];

const vencedoresFase2 = [];

const selecoesFinal = [];

let partidaFinal = undefined;

const jogadoresDaCopa = [];

let campeao;


app.post('/cadastrarSelecao', (req, res) => {
    if(selecoesFase1.length < 8) {
        const nome = req.body.nome;
        selecoesFase1.push(new SelecaoRepository(nome));
        return res.status(200).json({message: 'Seleção criada!', selecoesFase1});
    } else {
        return res.status(400).send('Número máximo de seleções cadastradas!')
    }
})

app.put('/cadastrar/goleiros/:id', (req, res) => {
    const goleiros = req.body.goleiros;
    const id = parseInt(req.params.id) -1
    if (!Array.isArray(goleiros) || goleiros.length !== 3) {
        return res.status(400).send('É necessário fornecer exatamente 3 goleiros');
    }

    if(!selecoesFase1[id]) {
        res.status(400).send('Seleção não encontrada!')
    }

    const selecao = selecoesFase1[id];
    const countGoleiros = selecao.goleiros.length;

    goleiros.forEach(goleiro => selecoesFase1[id].adicionarGoleiro(goleiro));

    if (selecao.goleiros.length === countGoleiros) {
        return res.status(400).send('Não foi possível adicionar goleiros, limite já atingido.');
    }

    return res.status(200).json({message: 'Goleiros adicionados!', selecoesFase1});

})

app.put('/cadastrar/jogadores/:id', (req, res) => {
    const jogadores = req.body.jogadores;
    const id = parseInt(req.params.id) -1
    if (!Array.isArray(jogadores) || jogadores.length !== 20) {
        return res.status(400).send('É necessário fornecer exatamente 20 jogadores.');
    }

    const selecao = selecoesFase1[id];

    if(!selecao) {
        res.status(400).send('Seleção não encontrada!')
    }

    const countJogadores = selecao.jogadores.length;

    jogadores.forEach(jogador => {
        const novoJogador = new JogadorRepository(jogador.nome);
        selecao.adicionarJogador(novoJogador);
        jogadoresDaCopa.push(novoJogador);
    });

    if (countJogadores === 20) {
        return res.status(400).send('Não foi possível adicionar jogadores, limite já atingido.')
    };

    return res.status(200).json({message: 'Jogadores adicionados!', selecoesFase1});

})

app.post('/partidasFase1/novapartida', (req,res) => {
    const idTime1 = parseInt(req.body.idTime1);
    const idTime2 = parseInt(req.body.idTime2);

    const selecao1 = selecoesFase1[idTime1 -1];
    const selecao2 = selecoesFase1[idTime2 -1];

    if(!selecao1 || !selecao2) {return res.status(400).send('Algum dos identificadores fornecidos não pertence a uma seleção.')}

    if(selecao1.goleiros == 0|| selecao2.goleiros == 0) {res.status(400).send('Alguma das seleções não teve os goleiros cadastrados.')}

    if(selecao1 === selecao2) {return res.status(400).send('Você não pode indicar um time para jogar contra si mesmo.');}

    partidasFase1.forEach((partida) => {
        if (partida.idTime1 == idTime1 || partida.idTime2 == idTime2 || partida.idTime1 == idTime2 || partida.idTime2 == idTime1) {
            return res.status(400).send('Impossível criar.');
        }
    })

    partidasFase1.push(new PartidaRepository(idTime1, idTime2));
    return res.status(200).json({message: 'Partida cadastrada!', partidasFase1});
    
})

app.put('/partidasFase1/definirResultado/:id', (req, res) => {
    const qtdGols = req.body.qtdGols;
    const marcaramGols = req.body.marcaramGols;
    const idPartida = parseInt(req.params.id) -1;
    const partida = partidasFase1[idPartida]

    if(!partida) {return res.status(400).send('Partida não encontrada.')}

    if(partida.vencedor) {return res.status(400).send('Essa partida já foi finalizada.')}

    if(qtdGols >= 0 && qtdGols%2 != 0) {
        partida.adicionarGols(qtdGols)
    } else {
        return res.status(400).send('Informe uma quantidade de gols válida.')
    }

    const time1 = selecoesFase1[partida.idTime1 -1]
    const time2 = selecoesFase1[partida.idTime2 -1]

    const idsJogadores = [];

    marcaramGols.forEach((idJogador) => {
        time1.jogadores.forEach((jogadorTime1) => {
            if(idJogador == jogadorTime1.id) {
                partida.golsTime1++;
                jogadorTime1.golsMarcados++;
                idsJogadores.push(jogadorTime1.id)
                partida.marcouGol.push(jogadorTime1);
            }
        })     

        time2.jogadores.forEach((jogadorTime2) => {
            if(idJogador == jogadorTime2.id) {
                partida.golsTime2++;
                jogadorTime2.golsMarcados++;
                idsJogadores.push(jogadorTime2.id)
                partida.marcouGol.push(jogadorTime2);
            }
        })

    })

    const validaJogadores = marcaramGols.every(idJogador => idsJogadores.includes(idJogador));

    function zerarGolsDaPartida() {
        time1.jogadores.forEach((jogadorTime1) => jogadorTime1.zerarGolsJogador());
        time2.jogadores.forEach((jogadorTime2) => jogadorTime2.zerarGolsJogador());
        partida.zerarGolsPartida();
    }
    
    if(!validaJogadores) {
        zerarGolsDaPartida();
        return res.status(400).send('Um ou mais IDs de jogador informados inválidos.')
    };

    if(marcaramGols.length != qtdGols) {
        zerarGolsDaPartida();
        return res.status(400).send('A quantidade de gols marcados é diferente da quantidade de gols da partida.')
    }

    if(partida.golsTime1 > partida.golsTime2) {
        partida.vencedor = {id: time1.id, nome: time1.nome};
        partidasFase2.push(time1)
    } else if(partida.golsTime1 < partida.golsTime2) {
        partida.vencedor = {id: time2.id, nome: time2.nome};
        partidasFase2.push(time2)
    }

    selecoesFase1[partida.idTime1 -1].partidas = partida;
    selecoesFase1[partida.idTime2 -1].partidas = partida;

    return res.status(200).json(partida);
})

app.post('/partidasFase2/novapartida', (req,res) => {

    if(qtdPartidasFase1 < 4) {return res.status(400).send('Impossível criar. Fase 1 ainda não foi finalizada.')}

    const idTime1 = parseInt(req.body.idTime1);
    const idTime2 = parseInt(req.body.idTime2);

    const selecao1 = selecoesFase1[idTime1 -1];
    const selecao2 = selecoesFase1[idTime2 -1];

    const qtdPartidasFase1 = partidasFase1.filter(partidas => partidas.vencedor).length;

    if(!selecao1 || !selecao2) {return res.status(400).send('Algum dos identificadores fornecidos não pertence a uma seleção.')}

    const existePartida = partidasFase2.some(partidas => (partidas.idTime1 == idTime1 || partidas.idTime2 == idTime2) && (partidas.idTime1 == idTime2 || partidas.idTime2 == idTime1));

    if(existePartida) {return res.status(400).send('Impossível criar, algum dos times informados não passou da primeira fase.')}

    if(selecao1 === selecao2) {return res.status(400).send('Você não pode indicar um time para jogar contra si mesmo.');}

    partidasFase2.forEach((partida) => {
        if (partida.idTime1 == idTime1 || partida.idTime2 == idTime2 || partida.idTime1 == idTime2 || partida.idTime2 == idTime1) {return res.status(400).send('Impossível criar.');}
    })

    partidasFase2.push(new PartidaRepository(idTime1, idTime2));
    return res.status(200).json({message: 'Partida cadastrada!', partidasFase2});
    
})

app.put('/partidasFase2/definirResultado/:id', (req, res) => {
    const qtdGols = req.body.qtdGols;
    const marcaramGols = req.body.marcaramGols;
    const idPartida = parseInt(req.params.id) -1;
    const partida = partidasFinal[idPartida]

    if(!partida) {return res.status(400).send('Partida não encontrada.')}

    if(partida.vencedor) {return res.status(400).send('Essa partida já foi finalizada.')}

    if(qtdGols >= 0 && qtdGols%2 != 0) {
        partida.adicionarGols(qtdGols)
    } else {
        return res.status(400).send('Informe uma quantidade de gols válida.')
    }

    const time1 = selecoesFase2[partida.idTime1 -1]
    const time2 = selecoesFase2[partida.idTime2 -1]

    const idsJogadores = [];

    marcaramGols.forEach((idJogador) => {
        time1.jogadores.forEach((jogadorTime1) => {
            if(idJogador == jogadorTime1.id) {
                partida.golsTime1++;
                jogadorTime1.golsMarcados++;
                idsJogadores.push(jogadorTime1.id)
                partida.marcouGol.push(jogadorTime1);
            }
        })     

        time2.jogadores.forEach((jogadorTime2) => {
            if(idJogador == jogadorTime2.id) {
                partida.golsTime2++;
                jogadorTime2.golsMarcados++;
                idsJogadores.push(jogadorTime2.id)
                partida.marcouGol.push(jogadorTime2);
            }
        })

    })

    const validaJogadores = marcaramGols.every(idJogador => idsJogadores.includes(idJogador));

    function zerarGolsDaPartida() {
        time1.jogadores.forEach((jogadorTime1) => jogadorTime1.zerarGolsJogador());
        time2.jogadores.forEach((jogadorTime2) => jogadorTime2.zerarGolsJogador());
        partida.zerarGolsPartida();
    }
    
    if(!validaJogadores) {
        zerarGolsDaPartida();
        return res.status(400).send('Um ou mais IDs de jogador informados inválidos.');
    };

    if(marcaramGols.length != qtdGols) {
        zerarGolsDaPartida();
        return res.status(400).send('A quantidade de gols marcados é diferente da quantidade de gols da partida.');
    }

    if(partida.golsTime1 > partida.golsTime2) {
        partida.vencedor = {id: time1.id, nome: time1.nome};
        vencedoresFase2.push(time1)
    } else if(partida.golsTime1 < partida.golsTime2) {
        partida.vencedor = {id: time2.id, nome: time2.nome};;
        vencedoresFase2.push(time2)
    }

    const qtdPartidasFase2 = partidasFase2.filter(partidas => partidas.vencedor).length;

    if(qtdPartidasFase2 == 2) {
        partidaFinal = new PartidaRepository(vencedoresFase2[0], vencedoresFase2[1]);
    }

    selecoesFase1[partida.idTime1 -1].partidas = partida;
    selecoesFase1[partida.idTime2 -1].partidas = partida;

    return res.status(200).json(partida);
})

app.put('/partidaFinal/definirResultado/', (req, res) => {
    const qtdGols = req.body.qtdGols;
    const marcaramGols = req.body.marcaramGols;

    if(!partidaFinal) {return res.status(400).send('Partida não encontrada.')}

    if(partidaFinal.vencedor) {return res.status(400).send('Essa partida já foi finalizada.')}

    if(qtdGols >= 0 && qtdGols%2 != 0) {
        partidaFinal.adicionarGols(qtdGols)
    } else {
        return res.status(400).send('Informe uma quantidade de gols válida.')
    }

    const time1 = selecoesFinal[partida.idTime1 -1]
    const time2 = selecoesFinal[partida.idTime2 -1]

    const idsJogadores = [];

    marcaramGols.forEach((idJogador) => {
        time1.jogadores.forEach((jogadorTime1) => {
            if(idJogador == jogadorTime1.id) {
                partidaFinal.golsTime1++;
                jogadorTime1.golsMarcados++;
                idsJogadores.push(jogadorTime1.id)
                partidaFinal.marcouGol.push(jogadorTime1);
            }
        })     

        time2.jogadores.forEach((jogadorTime2) => {
            if(idJogador == jogadorTime2.id) {
                partidaFinal.golsTime2++;
                jogadorTime2.golsMarcados++;
                idsJogadores.push(jogadorTime2.id)
                partidaFinal.marcouGol.push(jogadorTime2);
            }
        })

    })

    const validaJogadores = marcaramGols.every(idJogador => idsJogadores.includes(idJogador));

    function zerarGolsDaPartida() {
        time1.jogadores.forEach((jogadorTime1) => jogadorTime1.zerarGolsJogador());
        time2.jogadores.forEach((jogadorTime2) => jogadorTime2.zerarGolsJogador());
        partidaFinal.zerarGolsPartida();
    }
    
    if(!validaJogadores) {
        zerarGolsDaPartida();
        return res.status(400).send('Um ou mais IDs de jogador informados inválidos.');
    };

    if(marcaramGols.length != qtdGols) {
        zerarGolsDaPartida();
        return res.status(400).send('A quantidade de gols marcados é diferente da quantidade de gols da partida.');
    }

    if(partida.golsTime1 > partida.golsTime2) {
        partidaFinal.vencedor = {id: time1.id, nome: time1.nome};
        campeao = time1;
    } else if(partidaFinal.golsTime1 < partidaFinal.golsTime2) {
        partidaFinal.vencedor = {id: time2.id, nome: time2.nome};
        campeao = time2;
    }

    selecoesFase1[partida.idTime1 -1].partidas = partida;
    selecoesFase1[partida.idTime2 -1].partidas = partida;

    return res.status(200).json(partidaFinal, campeao);
})

app.get('/exibirArtilheiro/', (req, res) => {

    const count = 0;

    const artilheiro = jogadoresDaCopa.forEach((jogador) => {
        if(jogador > count) {
            count = jogador;
        }
    })

    if(!campeao) {res.status(400).json({message: 'A copa ainda não terminou.'})}

    return res.status(200).json({message: `O artilheiro da copa é o ${artilheiro}!!`})
})

app.get('/exibirCampeao/', (req, red) => {

    if(!campeao) {res.status(400).json({message: 'A copa ainda não terminou.'})}

    return res.status(200).json({message: `O CAMPEÃO DA COPA É O ${campeao}!!`})
})

app.get('/partidasPorSelecao/:id', (req, res) => {
    const idSelecao = parseInt(req.params.id);
    const selecao = selecoesFase1[idSelecao -1];

    return res.status(200).json(selecao.partidas);

})

app.get('/exibirGrafo/', (req, res) => {
    if(!campeao) {return res.status(400).send('A copa ainda não acabou. Impossível definir o grafo completo.')}
    return res.status(200).json(partidasFase1, partidasFase2, partidaFinal, campeao)
})

export default app;
