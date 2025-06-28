AndroidInterface.changeOrientation('portrait');

let modoCopiaAtivo = false;

function abrirModal() {
  modoCopiaAtivo = false;
  document.body.style.cursor = "default";

  const botaoCopiar = document.getElementById("botaoCopiarBloco");
  botaoCopiar.classList.remove("ativo");

  document.getElementById("modalEscolha").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalEscolha").style.display = "none";
}

function avaliarExpressao(expr, variaveis = {}) {
  const comVars = expr.replace(/\$([a-zA-Z_]\w*)/g, (_, nome) =>
    nome in variaveis ? JSON.stringify(variaveis[nome]) : "undefined"
  );
  const comConcatenacao = comVars.replace(/\.\./g, "+");
  try {
    return eval(comConcatenacao);
  } catch {
    return expr;
  }
}

let blocoArrastando = null;
let blocosArrastandoGrupo = [];

function adicionarBloco(tipo, adicionarFimAutomatico = true) {
  fecharModal();

  const bloco = document.createElement("div");
  bloco.className = "bloco";
  bloco.draggable = true;

  bloco.addEventListener("dragstart", () => {
  const todosBlocos = Array.from(document.querySelectorAll("#area-blocos .bloco"));
  const indexInicio = todosBlocos.indexOf(bloco);
  blocosArrastandoGrupo = [bloco];

  const tipoClasse = [...bloco.classList].find(c => c.startsWith("bloco-"));
  const blocosComFim = {
    "bloco-if": "bloco-fimIf",
    "bloco-repetir": "bloco-fimRepetir",
    "bloco-repetirAte": "bloco-fimRepetirAte",
    "bloco-inicioInstantaneo": "bloco-fimInstantaneo",
    "bloco-toque": "bloco-fimToque",
    "bloco-loopInfinito": "bloco-fimLoopInfinito",
    "bloco-comentario": "bloco-fimComentario",
    "bloco-toqueNaTela": "bloco-fimToqueNaTela",
    "bloco-aoCriarClone": "bloco-fimAoCriarClone",
  };

  if (blocosComFim[tipoClasse]) {
    let profundidade = 1;
    for (let i = indexInicio + 1; i < todosBlocos.length; i++) {
      const atual = todosBlocos[i];
      if (atual.classList.contains(tipoClasse)) profundidade++;
      if (atual.classList.contains(blocosComFim[tipoClasse])) profundidade--;
      blocosArrastandoGrupo.push(atual);
      if (profundidade === 0) break;
    }
  }

  blocosArrastandoGrupo.forEach(b => b.classList.add("dragging"));
});

bloco.addEventListener("dragend", () => {
  blocosArrastandoGrupo.forEach(b => b.classList.remove("dragging"));
  blocoArrastando = null;
  blocosArrastandoGrupo = [];
  salvarBlocos();
});

  const blocosSemBotao = ['fimIf', 'fimRepetir', 'fimRepetirAte', 'fimLoopInfinito', 'fimInstantaneo', 'fimToque', 'fimToqueNaTela', 'fimComentario', 'fimAoCriarClone'];
if (!blocosSemBotao.includes(tipo)) {
  bloco.innerHTML = `<button class="fechar" onclick="removerBloco(this)">x</button>`;
}

  if (tipo === 'border') {
  bloco.classList.add('bloco-border');
  bloco.innerHTML += `
    <h3>Definir borda</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Raio da borda (ex: 10px)" class="valor-radius" data-tipo="border" />
  `;
} else if (tipo === 'cor') {
  bloco.classList.add('bloco-cor');
  bloco.innerHTML += `
    <h3>Definir cor</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Cor de fundo (ex: blue)" class="valor-radius" data-tipo="cor" />
  `;
} else if (tipo === 'caixa') {
  bloco.classList.add('bloco-caixa');
  bloco.innerHTML += `
    <h3>Criar caixa</h3>
    <input type="text" placeholder="ID da nova caixa (ex: nova1)" class="id-elemento" />
    <input type="text" placeholder="Cor de fundo (ex: pink)" class="valor-radius" data-tipo="caixa" />
  `;
} else if (tipo === 'transparencia') {
  bloco.classList.add('bloco-transparencia');
  bloco.innerHTML += `
    <h3>Definir transparência</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Transparência em % (ex: 50)" class="valor-radius" />
  `;
} else if (tipo === 'esperar') {
  bloco.classList.add('bloco-esperar');
  bloco.innerHTML += `
    <h3>Esperar (segundos)</h3>
    <input type="text" placeholder="Tempo em segundos (ex: 2)" class="valor-radius" data-tipo="esperar" />
  `;
} else if (tipo === 'if') {
  bloco.classList.add('bloco-if');
  bloco.innerHTML += `
    <h3>Se (condição)</h3>
    <input type="text" placeholder="Digite a condição (ex: x > 10)" class="condicao" />
  `;
} else if (tipo === 'fimIf') {
  bloco.classList.add('bloco-fimIf');
  bloco.innerHTML += `<h3>Fim do Se</h3>`;
} else if (tipo === 'inicioInstantaneo') {
  bloco.classList.add('bloco-inicioInstantaneo');
  bloco.innerHTML += `<h3>Ao iniciar</h3>`;
} else if (tipo === 'fimInstantaneo') {
  bloco.classList.add('bloco-fimInstantaneo');
  bloco.innerHTML += `<h3>Fim do Início</h3>`;
} else if (tipo === 'repetir') {
  bloco.classList.add('bloco-repetir');
  bloco.innerHTML += `
    <h3>Repetir (vezes)</h3>
    <input type="text" placeholder="Número de repetições (ex: 3)" class="valor-radius" data-tipo="repetir" />
  `;
} else if (tipo === 'fimRepetir') {
  bloco.classList.add('bloco-fimRepetir');
  bloco.innerHTML += `<h3>Fim do Repetir</h3>`;
} else if (tipo === 'criarVariavel') {
  bloco.classList.add('bloco-criarVariavel');
  bloco.innerHTML += `
    <h3>Criar variável</h3>
    <input type="text" placeholder="Nome da variável (ex: pontuacao)" class="nome-variavel" />
    <input type="text" placeholder="Valor inicial (ex: 0)" class="valor-variavel" />
  `;
} else if (tipo === 'alterarVariavel') {
  bloco.classList.add('bloco-alterarVariavel');
  bloco.innerHTML += `
    <h3>Alterar variável</h3>
    <input type="text" placeholder="Nome da variável (ex: pontuacao)" class="nome-variavel" />
    <input type="text" placeholder="Novo valor (ex: 10)" class="valor-variavel" />
  `;
} else if (tipo === 'toque') {
  bloco.classList.add('bloco-toque');
  bloco.innerHTML += `
    <h3>Ao tocar na caixa</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'fimToque') {
  bloco.classList.add('bloco-fimToque');
  bloco.innerHTML += `<h3>Fim do Toque</h3>`;
} else if (tipo === 'toqueNaTela') {
  bloco.classList.add('bloco-toqueNaTela');
  bloco.innerHTML += `<h3>Ao tocar na tela</h3>`;
} else if (tipo === 'fimToqueNaTela') {
  bloco.classList.add('bloco-fimToqueNaTela');
  bloco.innerHTML += `<h3>Fim do Toque na Tela</h3>`;
} else if (tipo === 'tamanho') {
  bloco.classList.add('bloco-tamanho');
  bloco.innerHTML += `
    <h3>Definir tamanho</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Largura (ex: 100px)" class="largura-elemento" />
    <input type="text" placeholder="Altura (ex: 50px)" class="altura-elemento" />
  `;
} else if (tipo === 'texto') {
  bloco.classList.add('bloco-texto');
  bloco.innerHTML += `
    <h3>Mostrar texto</h3>
    <input type="text" placeholder="ID do texto (ex: texto1)" class="id-elemento" />
    <input type="text" placeholder="Conteúdo do texto" class="valor-radius" data-tipo="texto" />
  `;
} else if (tipo === 'posicionarCaixa') {
  bloco.classList.add('bloco-posicionarCaixa');
  bloco.innerHTML += `
    <h3>Definir posição da caixa</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Posição X (ex: 100px)" class="posicao-x" />
    <input type="text" placeholder="Posição Y (ex: 50px)" class="posicao-y" />
  `;
} else if (tipo === 'posicionarTexto') {
  bloco.classList.add('bloco-posicionarTexto');
  bloco.innerHTML += `
    <h3>Definir posição do texto</h3>
    <input type="text" placeholder="ID do texto (ex: texto1)" class="id-elemento" />
    <input type="text" placeholder="Posição X (ex: 100px)" class="posicao-x" />
    <input type="text" placeholder="Posição Y (ex: 50px)" class="posicao-y" />
  `;
} else if (tipo === 'repetirAte') {
  bloco.classList.add('bloco-repetirAte');
  bloco.innerHTML += `
    <h3>Repetir até</h3>
    <input type="text" placeholder="Condição para parar (ex: vidas == 0)" class="condicao" />
  `;
} else if (tipo === 'fimRepetirAte') {
  bloco.classList.add('bloco-fimRepetirAte');
  bloco.innerHTML += `<h3>Fim do Repetir até</h3>`;
} else if (tipo === 'loopInfinito') {
  bloco.classList.add('bloco-loopInfinito');
  bloco.innerHTML += `<h3>Repetir sempre</h3>`;
} else if (tipo === 'fimLoopInfinito') {
  bloco.classList.add('bloco-fimLoopInfinito');
  bloco.innerHTML += `<h3>Fim do Repetir sempre</h3>`;
} else if (tipo === 'mostrar') {
  bloco.classList.add('bloco-mostrar');
  bloco.innerHTML += `
    <h3>Mostrar caixa</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'esconder') {
  bloco.classList.add('bloco-esconder');
  bloco.innerHTML += `
    <h3>Esconder caixa</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'fonteTexto') {
  bloco.classList.add('bloco-fonteTexto');
  bloco.innerHTML += `
    <h3>Fonte do texto</h3>
    <input type="text" placeholder="ID do texto (ex: texto1)" class="id-elemento" />
    <input type="text" placeholder="Nome da fonte (ex: Arial)" class="valor-radius" />
  `;
} else if (tipo === 'tamanhoFonte') {
  bloco.classList.add('bloco-tamanhoFonte');
  bloco.innerHTML += `
    <h3>Tamanho do texto</h3>
    <input type="text" placeholder="ID do texto (ex: texto1)" class="id-elemento" />
    <input type="text" placeholder="Tamanho da fonte (ex: 20px)" class="valor-radius" />
  `;
} else if (tipo === 'corTexto') {
  bloco.classList.add('bloco-corTexto');
  bloco.innerHTML += `
    <h3>Cor do texto</h3>
    <input type="text" placeholder="ID do texto (ex: texto1)" class="id-elemento" />
    <input type="text" placeholder="Cor do texto (ex: red)" class="valor-radius" />
  `;
} else if (tipo === 'criarLista') {
  bloco.classList.add('bloco-criarLista');
  bloco.innerHTML += `
    <h3>Criar lista</h3>
    <input type="text" placeholder="Nome da lista (ex: itens)" class="nome-lista" />
    <input type="text" placeholder="Valores separados por vírgula (ex: maça, banana)" class="valores-lista" />
  `;
} else if (tipo === 'adicionarLista') {
  bloco.classList.add('bloco-adicionarLista');
  bloco.innerHTML += `
    <h3>Adicionar na lista</h3>
    <input type="text" placeholder="Nome da lista (ex: itens)" class="nome-lista" />
    <input type="text" placeholder="Valor a adicionar (ex: laranja)" class="valores-lista" />
  `;
} else if (tipo === 'removerItemLista') {
  bloco.classList.add('bloco-removerItemLista');
  bloco.innerHTML += `
    <h3>Remover da lista</h3>
    <input type="text" placeholder="Nome da lista (ex: itens)" class="nome-lista" />
    <input type="text" placeholder="Índice ou valor para remover (ex: 2 ou laranja)" class="valores-lista" />
  `;
} else if (tipo === 'limparLista') {
  bloco.classList.add('bloco-limparLista');
  bloco.innerHTML += `
    <h3>Limpar lista</h3>
    <input type="text" placeholder="Nome da lista (ex: itens)" class="nome-lista" />
  `;
} else if (tipo === 'gravidade') {
  bloco.classList.add('bloco-gravidade');
  bloco.innerHTML += `
    <h3>Aplicar gravidade</h3>
    <input type="text" placeholder="ID da caixa (ex: jogador)" class="id-elemento" />
    <input type="text" placeholder="Força da gravidade (ex: -0.5)" class="valor-radius" />
  `;
} else if (tipo === 'pular') {
  bloco.classList.add('bloco-pular');
  bloco.innerHTML += `
    <h3>Pular</h3>
    <input type="text" placeholder="ID da caixa (ex: jogador)" class="id-elemento" />
    <input type="text" placeholder="Força do pulo (ex: 12)" class="valor-radius" />
  `;
} else if (tipo === 'mover') {
  bloco.classList.add('bloco-mover');
  bloco.innerHTML += `
    <h3>Mover (passos)</h3>
    <input type="text" placeholder="ID da caixa (ex: jogador)" class="id-elemento" />
    <input type="text" placeholder="Número de passos a mover (ex: 10)" class="valor-radius" />
  `;
} else if (tipo === 'direcao') {
  bloco.classList.add('bloco-direcao');
  bloco.innerHTML += `
    <h3>Definir direção</h3>
    <input type="text" placeholder="ID da caixa (ex: jogador)" class="id-elemento" />
    <input type="text" placeholder="Graus (ex: 90)" class="valor-radius" />
  `;
} else if (tipo === 'camada') {
  bloco.classList.add('bloco-camada');
  bloco.innerHTML += `
    <h3>Definir camada</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Número da camada (ex: 5)" class="valor-radius" data-tipo="camada" />
  `;
} else if (tipo === 'remover') {
  bloco.classList.add('bloco-remover');
  bloco.innerHTML += `
    <h3>Remover caixa</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'comentario') {
  bloco.classList.add('bloco-comentario');
  bloco.innerHTML += `
    <h3 style="display:flex; justify-content:space-between; align-items:center;">
      <span>Comentário</span>
      <button class="toggle-visibilidade" onclick="alternarVisibilidadeFilhos(this)">-</button>
    </h3>
    <input type="text" placeholder="Digite seu comentário aqui..." class="valor-radius" />
  `;
} else if (tipo === 'fimComentario') {
  bloco.classList.add('bloco-fimComentario');
  bloco.innerHTML += `<h3>Fim do comentário</h3>`;
} else if (tipo === 'textura') {
  bloco.classList.add('bloco-textura');
  bloco.innerHTML += `
    <h3>Definir imagem</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="ID da imagem (ex: img1)" class="valor-radius" />
  `;
} else if (tipo === 'criarAnimacao') {
  bloco.classList.add('bloco-criarAnimacao');
  bloco.innerHTML += `
    <h3>Criar animação</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Lista de imagens (ex: img1.png, img2.png)" class="valor-imagens" />
    <input type="text" placeholder="Velocidade da animação (ex: 5)" class="valor-velocidade" />
  `;
} else if (tipo === 'pararAnimacao') {
  bloco.classList.add('bloco-pararAnimacao');
  bloco.innerHTML += `
    <h3>Parar animação</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'continuarAnimacao') {
  bloco.classList.add('bloco-continuarAnimacao');
  bloco.innerHTML += `
    <h3>Continuar animação</h3>
    <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'camera') {
  bloco.classList.add('bloco-camera');
  bloco.innerHTML += `
    <h3>Ativar câmera</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'fixarCaixa') {
  bloco.classList.add('bloco-fixarCaixa');
  bloco.innerHTML += `
    <h3>Fixar na câmera</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
  `;
} else if (tipo === 'suavidadeCamera') {
  bloco.classList.add('bloco-suavidadeCamera');
  bloco.innerHTML += `
    <h3>Definir suavidade da câmera</h3>
    <input type="text" placeholder="Valor da suavidade (ex: 0.05)" class="valor-radius" />
  `;
} else if (tipo === 'mudarCena') {
  bloco.classList.add('bloco-mudarCena');
  bloco.innerHTML += `
    <h3>Mudar de cena</h3>
    <input type="text" placeholder="ID da cena (ex: cena1)" class="id-elemento" />
  `;
} else if (tipo === 'orientacao') {
  bloco.classList.add('bloco-orientacao');
  bloco.innerHTML += `
    <h3>Definir orientação da tela</h3>
    <input type="text" placeholder="Retrato ou Paisagem" class="valor-radius" />
  `;
} else if (tipo === 'colisaoSolida') {
  bloco.classList.add('bloco-colisaoSolida');
  bloco.innerHTML += `
    <h3>Habilitar colisão sólida</h3>
    <input type="text" placeholder="ID do objeto (ex: jogador)" class="id-elemento" />
    <input type="text" placeholder="ID do alvo (ex: chão)" class="id-alvo" />
  `;
} else if (tipo === 'clonar') {
  bloco.classList.add('bloco-clonar');
  bloco.innerHTML += `
    <h3>Clonar caixa</h3>
    <input type="text" placeholder="ID da caixa a clonar (ex: inimigo1)" class="id-elemento" />
  `;
} else if (tipo === 'aoCriarClone') {
  bloco.classList.add('bloco-aoCriarClone');
  bloco.innerHTML += `
    <h3>Ao criar clone</h3>
    <input type="text" placeholder="ID do original (ex: inimigo)" class="id-elemento" />
  `;
} else if (tipo === 'fimAoCriarClone') {
  bloco.classList.add('bloco-fimAoCriarClone');
  bloco.innerHTML += `<h3>Fim do Ao criar clone</h3>`;
} else if (tipo === 'carimbo') {
  bloco.classList.add('bloco-carimbo');
  bloco.innerHTML += `
    <h3>Carimbar caixa</h3>
    <input type="text" placeholder="ID da caixa (ex: inimigo1)" class="id-elemento" />
  `;
} else if (tipo === 'limparCarimbos') {
  bloco.classList.add('bloco-limparCarimbos');
  bloco.innerHTML += `<h3>Limpar carimbos</h3>`;
} else if (tipo === 'efeito') {
  bloco.classList.add('bloco-efeito');
  bloco.innerHTML += `
    <h3>Aplicar efeito</h3>
    <input type="text" placeholder="ID da caixa (ex: caixa1)" class="id-elemento" />
    <input type="text" placeholder="Tipo do efeito (ex: fantasma, blur, brilho)" class="valor-radius" />
  `;
}

  setTimeout(() => {
  bloco.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", salvarBlocos);
    
  });
}, 0.1);
  
  setTimeout(() => {
  bloco.querySelectorAll(".id-elemento").forEach(input => {
    input.setAttribute("list", "listaIdsGlobais");

    input.addEventListener("input", () => {
      salvarBlocos();
    });
  });
}, 0.1);

  const area = document.getElementById("area-blocos");  
  area.appendChild(bloco);  
  
 // Adiciona o bloco "fim" automaticamente se necessário  
if (adicionarFimAutomatico && ['if', 'repetir', 'inicioInstantaneo', 'toque', 'toqueNaTela', 'repetirAte', 'loopInfinito', 'comentario', 'aoCriarClone'].includes(tipo)) {
  const blocoFim = document.createElement("div");  
  blocoFim.className = "bloco";  
  blocoFim.draggable = true;  
  
  // Adiciona a classe correta de fim  
  let tipoFim = '';  
  let titulo = '';  
  
  if (tipo === 'if') {  
    tipoFim = 'fimIf';  
    titulo = 'Fim Se';  
  } else if (tipo === 'repetir') {  
    tipoFim = 'fimRepetir';  
    titulo = 'Fim Repetir';  
  } else if (tipo === 'repetirAte') {  
    tipoFim = 'fimRepetirAte';  
    titulo = 'Fim Repetir Até';  
  } else if (tipo === 'loopInfinito') {  
    tipoFim = 'fimLoopInfinito';  
    titulo = 'Fim Repetir Sempre';  
  } else if (tipo === 'inicioInstantaneo') {  
    tipoFim = 'fimInstantaneo';  
    titulo = 'Fim Começar';  
  } else if (tipo === 'toque') {  
    tipoFim = 'fimToque';  
    titulo = 'Fim Tocar';  
  } else if (tipo === 'toqueNaTela') {
    tipoFim = 'fimToqueNaTela';
    titulo = 'Fim Tocar na Tela';
  } else if (tipo === 'comentario') {
    tipoFim = 'fimComentario';
    titulo = 'Fim Comentário';
  } else if (tipo === 'aoCriarClone') {
    tipoFim = 'fimAoCriarClone';
    titulo = 'Fim Criar Clone';
  }
  
  blocoFim.classList.add(`bloco-${tipoFim}`);  
  
  // Só adiciona botão "x" se NÃO for bloco de fim  
  const blocosSemX = ['fimIf', 'fimRepetir', 'fimRepetirAte', 'fimLoopInfinito', 'fimInstantaneo', 'fimToque', 'fimToqueNaTela', 'fimComentario', 'fimAoCriarClone'];  
  if (!blocosSemX.includes(tipoFim)) {  
    blocoFim.innerHTML = `<button class="fechar" onclick="removerBloco(this)">x</button>`;  
  }  
  
  blocoFim.innerHTML += `<h3>${titulo}</h3>`;  
  
  container.addEventListener("dragstart", (e) => {
  const bloco = e.target;
  if (!bloco.classList.contains("bloco")) return;

  blocoArrastando = bloco;

  // Verificar se é bloco pai que contém blocos filhos
  const tipoClasse = [...bloco.classList].find(c => c.startsWith("bloco-"));
  const blocosPais = ['bloco-if', 'bloco-repetir', 'bloco-repetirAte', 'bloco-loopInfinito', 'bloco-inicioInstantaneo', 'bloco-toque', 'bloco-toqueNaTela', 'bloco-comentario', 'bloco-aoCriarClone'];
  
  if (blocosPais.includes(tipoClasse)) {
    // Pegar todos blocos filhos até o bloco fim correspondente
    const blocos = [...container.querySelectorAll(".bloco")];
    const index = blocos.indexOf(bloco);
    
    // Determinar o tipo do fim correspondente
    let tipoFim = "";
    if (tipoClasse === "bloco-if") tipoFim = "bloco-fimIf";
    else if (tipoClasse === "bloco-repetir") tipoFim = "bloco-fimRepetir";
    else if (tipoClasse === "bloco-repetirAte") tipoFim = "bloco-fimRepetirAte";
    else if (tipoClasse === "bloco-loopInfinito") tipoFim = "bloco-fimLoopInfinito";
    else if (tipoClasse === "bloco-inicioInstantaneo") tipoFim = "bloco-fimInstantaneo";
    else if (tipoClasse === "bloco-toque") tipoFim = "bloco-fimToque";
    else if (tipoClasse === "bloco-toqueNaTela") tipoFim = "bloco-fimToqueNaTela";
    else if (tipoClasse === "bloco-comentario") tipoFim = "bloco-fimComentario";
    else if (tipoClasse === "bloco-aoCriarClone") tipoFim = "bloco-fimAoCriarClone";

    let profundidade = 1;
    blocosArrastandoGrupo = [bloco];
    
    for (let i = index + 1; i < blocos.length; i++) {
      const atual = blocos[i];
      if (atual.classList.contains(tipoClasse)) profundidade++;
      if (atual.classList.contains(tipoFim)) profundidade--;
      blocosArrastandoGrupo.push(atual);
      if (profundidade === 0) break;
    }

    // Adicionar classe 'dragging' para todos e mover no DOM juntos
    blocosArrastandoGrupo.forEach(b => b.classList.add("dragging"));
  } else {
    blocosArrastandoGrupo = [bloco];
    bloco.classList.add("dragging");
  }
});

container.addEventListener("dragend", (e) => {  
  if (!blocosArrastandoGrupo.length) return;  
  
  // Remove classe dragging de todos  
  blocosArrastandoGrupo.forEach(b => b.classList.remove("dragging"));  
    
  // Reseta variáveis  
  blocoArrastando = null;  
  blocosArrastandoGrupo = [];  
  
  salvarBlocos();  
});
  
    area.appendChild(blocoFim);
  }

  salvarBlocos();
  const variaveis = coletarSugestoesDosBlocos();
  ativarAutoCompleteCalculadora(variaveis);
}

function removerBloco(botao) {
  modoCopiaAtivo = false;
  const botaoCopiar = document.getElementById("botaoCopiarBloco");
  botaoCopiar.classList.remove("ativo");

  const bloco = botao.parentElement;
  const container = document.getElementById("area-blocos");
  const blocos = [...container.querySelectorAll(".bloco")];
  const index = blocos.indexOf(bloco);

  const tipoClasse = bloco.classList[1]; // ex: bloco-if
  let fimTipo = null;

  if (tipoClasse === "bloco-if") fimTipo = "bloco-fimIf";
  else if (tipoClasse === "bloco-repetir") fimTipo = "bloco-fimRepetir";
  else if (tipoClasse === "bloco-repetirAte") fimTipo = "bloco-fimRepetirAte";
  else if (tipoClasse === "bloco-loopInfinito") fimTipo = "bloco-fimLoopInfinito";
  else if (tipoClasse === "bloco-inicioInstantaneo") fimTipo = "bloco-fimInstantaneo";
  else if (tipoClasse === "bloco-toque") fimTipo = "bloco-fimToque";
  else if (tipoClasse === "bloco-toqueNaTela") fimTipo = "bloco-fimToqueNaTela";
  else if (tipoClasse === "bloco-comentario") fimTipo = "bloco-fimComentario";
  else if (tipoClasse === "bloco-aoCriarClone") fimTipo = "bloco-fimAoCriarClone";

  // Se for bloco com estrutura de filhos, remover todos os filhos também
  if (fimTipo) {
    let profundidade = 1;
    for (let i = index + 1; i < blocos.length; i++) {
      const atual = blocos[i];
      if (atual.classList.contains(tipoClasse)) profundidade++;
      if (atual.classList.contains(fimTipo)) profundidade--;

      atual.remove();
      if (profundidade === 0) break;
    }
  }

  bloco.remove();
  salvarBlocos(); // <- Certifique-se que salva por cena e objeto
  const variaveis = coletarSugestoesDosBlocos();
  ativarAutoCompleteCalculadora(variaveis);
}

const container = document.getElementById("area-blocos");

// Atualizar o dragover para mover o grupo inteiro
container.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!blocosArrastandoGrupo.length) return;

  const afterElement = getDragAfterElement(container, e.clientY);

  // Inserir o grupo de blocos todo junto
  if (afterElement == null) {
    blocosArrastandoGrupo.forEach(b => container.appendChild(b));
  } else {
    blocosArrastandoGrupo.forEach(b => container.insertBefore(b, afterElement));
  }

  // Auto-scroll quando arrastando perto do topo ou fundo
  const area = container;
  const limite = 100;
  const velocidade = 10;

  const rect = area.getBoundingClientRect();
  const y = e.clientY;

  if (y < rect.top + limite) {
    area.scrollTop -= velocidade;
  } else if (y > rect.bottom - limite) {
    area.scrollTop += velocidade;
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".bloco:not(.dragging)")];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function executarTodos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");

  if (!projeto || !cena) {
    return;
  }

  // Recupera os blocos salvos por cena
  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  const blocosDaCena = blocosPorCena?.[projeto]?.[cena] || {};

  // Prepara os dados para execução
  const dadosParaExecucao = {
    [projeto]: {
      [cena]: {}
    }
  };

  for (const nomeObjeto in blocosDaCena) {
    dadosParaExecucao[projeto][cena][nomeObjeto] = blocosDaCena[nomeObjeto];
  }

  localStorage.setItem("blocosParaExecucao", JSON.stringify(dadosParaExecucao));

  const area = document.getElementById("area-blocos");
  if (area) localStorage.setItem("scrollBlocos", area.scrollTop);

  window.location.href = "ExecutandoJogo.html";
}

function salvarBlocos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const objeto = localStorage.getItem("objetoSelecionado");

  if (!projeto || !cena || !objeto) return;

  const blocos = document.querySelectorAll("#area-blocos .bloco");
  const dados = [];

  blocos.forEach(bloco => {
    let tipo = "";
    if (bloco.classList.contains("bloco-border")) tipo = "border";
    else if (bloco.classList.contains("bloco-cor")) tipo = "cor";
    else if (bloco.classList.contains("bloco-caixa")) tipo = "caixa";
    else if (bloco.classList.contains("bloco-esperar")) tipo = "esperar";
    else if (bloco.classList.contains("bloco-if")) tipo = "if";
    else if (bloco.classList.contains("bloco-fimIf")) tipo = "fimIf";
    else if (bloco.classList.contains("bloco-inicioInstantaneo")) tipo = "inicioInstantaneo";
    else if (bloco.classList.contains("bloco-fimInstantaneo")) tipo = "fimInstantaneo";
    else if (bloco.classList.contains("bloco-repetir")) tipo = "repetir";
    else if (bloco.classList.contains("bloco-fimRepetir")) tipo = "fimRepetir";
    else if (bloco.classList.contains("bloco-repetirAte")) tipo = "repetirAte";
    else if (bloco.classList.contains("bloco-fimRepetirAte")) tipo = "fimRepetirAte";
    else if (bloco.classList.contains("bloco-criarVariavel")) tipo = "criarVariavel";
    else if (bloco.classList.contains("bloco-alterarVariavel")) tipo = "alterarVariavel";
    else if (bloco.classList.contains("bloco-toque")) tipo = "toque";
    else if (bloco.classList.contains("bloco-fimToque")) tipo = "fimToque";
    else if (bloco.classList.contains("bloco-toqueNaTela")) tipo = "toqueNaTela";
else if (bloco.classList.contains("bloco-fimToqueNaTela")) tipo = "fimToqueNaTela";
    else if (bloco.classList.contains("bloco-tamanho")) tipo = "tamanho";
    else if (bloco.classList.contains("bloco-texto")) tipo = "texto";
    else if (bloco.classList.contains("bloco-fonteTexto")) tipo = "fonteTexto";
    else if (bloco.classList.contains("bloco-posicionarCaixa")) tipo = "posicionarCaixa";
    else if (bloco.classList.contains("bloco-posicionarTexto")) tipo = "posicionarTexto";
    else if (bloco.classList.contains("bloco-loopInfinito")) tipo = "loopInfinito";
    else if (bloco.classList.contains("bloco-fimLoopInfinito")) tipo = "fimLoopInfinito";
    else if (bloco.classList.contains("bloco-mostrar")) tipo = "mostrar";
    else if (bloco.classList.contains("bloco-esconder")) tipo = "esconder";
    else if (bloco.classList.contains("bloco-tamanhoFonte")) tipo = "tamanhoFonte";
    else if (bloco.classList.contains("bloco-corTexto")) tipo = "corTexto";
    else if (bloco.classList.contains("bloco-criarLista")) tipo = "criarLista";
    else if (bloco.classList.contains("bloco-gravidade")) tipo = "gravidade";
    else if (bloco.classList.contains("bloco-pular")) tipo = "pular";
    else if (bloco.classList.contains("bloco-mover")) tipo = "mover";
    else if (bloco.classList.contains("bloco-direcao")) tipo = "direcao";
    else if (bloco.classList.contains("bloco-camada")) tipo = "camada";
    else if (bloco.classList.contains("bloco-remover")) tipo = "remover";
    else if (bloco.classList.contains("bloco-adicionarLista")) tipo = "adicionarLista";
    else if (bloco.classList.contains("bloco-removerItemLista")) tipo = "removerItemLista";
    else if (bloco.classList.contains("bloco-limparLista")) tipo = "limparLista";
    else if (bloco.classList.contains("bloco-comentario")) tipo = "comentario";
    else if (bloco.classList.contains("bloco-fimComentario")) tipo = "fimComentario";
    else if (bloco.classList.contains("bloco-textura")) tipo = "textura";
    else if (bloco.classList.contains("bloco-camera")) tipo = "camera";
    else if (bloco.classList.contains("bloco-fixarCaixa")) tipo = "fixarCaixa";
    else if (bloco.classList.contains("bloco-mudarCena")) tipo = "mudarCena";
    else if (bloco.classList.contains("bloco-suavidadeCamera")) tipo = "suavidadeCamera";
    else if (bloco.classList.contains("bloco-orientacao")) tipo = "orientacao";
    else if (bloco.classList.contains("bloco-criarAnimacao")) tipo = "criarAnimacao";
    else if (bloco.classList.contains("bloco-pararAnimacao")) tipo = "pararAnimacao";
    else if (bloco.classList.contains("bloco-continuarAnimacao")) tipo = "continuarAnimacao";
    else if (bloco.classList.contains("bloco-transparencia")) tipo = "transparencia";
    else if (bloco.classList.contains("bloco-colisaoSolida")) tipo = "colisaoSolida";
    else if (bloco.classList.contains("bloco-clonar")) tipo = "clonar";
    else if (bloco.classList.contains("bloco-aoCriarClone")) tipo = "aoCriarClone";
    else if (bloco.classList.contains("bloco-fimAoCriarClone")) tipo = "fimAoCriarClone";
    else if (bloco.classList.contains("bloco-carimbo")) tipo = "carimbo";
    else if (bloco.classList.contains("bloco-limparCarimbos")) tipo = "limparCarimbos";
    else if (bloco.classList.contains("bloco-efeito")) tipo = "efeito";

    const idElemento = bloco.querySelector(".id-elemento")?.value || '';
    const idAlvo = bloco.querySelector(".id-alvo")?.value || '';
    const valor = bloco.querySelector(".valor-radius")?.value || '';
    const condicao = bloco.querySelector(".condicao")?.value || '';
    const nomeVariavel = bloco.querySelector(".nome-variavel")?.value || '';
    const valorVariavel = bloco.querySelector(".valor-variavel")?.value || '';
    const larguraElemento = bloco.querySelector(".largura-elemento")?.value || '';
    const alturaElemento = bloco.querySelector(".altura-elemento")?.value || '';
    const posicaoX = bloco.querySelector(".posicao-x")?.value || '';
    const posicaoY = bloco.querySelector(".posicao-y")?.value || '';
    const nomeLista = bloco.querySelector(".nome-lista")?.value || '';
    const valoresLista = bloco.querySelector(".valores-lista")?.value || '';
    const comentarioOculto = bloco.classList.contains('comentario-oculto') || (bloco.querySelector('.toggle-visibilidade')?.innerText === 'oculto');
    const valorImagens = bloco.querySelector(".valor-imagens")?.value || '';
    const valorVelocidade = bloco.querySelector(".valor-velocidade")?.value || '';

    dados.push({
  tipo,
  idElemento,
  idAlvo,
  valor,
  condicao,
  nomeVariavel,
  valorVariavel,
  larguraElemento,
  alturaElemento,
  posicaoX,
  posicaoY,
  nomeLista,
  valoresLista,
  comentarioOculto,
  valorImagens,
  valorVelocidade
});
  });

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  blocosPorCena[projeto] = blocosPorCena[projeto] || {};
  blocosPorCena[projeto][cena] = blocosPorCena[projeto][cena] || {};
  blocosPorCena[projeto][cena][objeto] = dados;

  localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));
}

function carregarBlocos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const objeto = localStorage.getItem("objetoSelecionado");

  if (!projeto || !cena || !objeto) return;

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  const dados = blocosPorCena?.[projeto]?.[cena]?.[objeto];

  if (!dados) return;

  dados.forEach(({ 
  tipo,
  idElemento,
  idAlvo,
  valor,
  condicao,
  nomeVariavel,
  valorVariavel,
  larguraElemento,
  alturaElemento,
  posicaoX,
  posicaoY,
  nomeLista,
  valoresLista,
  comentarioOculto,
  valorImagens,
  valorVelocidade
}) => {
    adicionarBloco(tipo, false);

    const blocos = document.querySelectorAll("#area-blocos .bloco");
    const ultimoBloco = blocos[blocos.length - 1];

    if (ultimoBloco) {
      if ((tipo === 'if' || tipo === 'repetirAte') && condicao) {
        const inputCond = ultimoBloco.querySelector(".condicao");
        if (inputCond) inputCond.value = condicao;
      }

      const inputId = ultimoBloco.querySelector(".id-elemento");
      const inputValor = ultimoBloco.querySelector(".valor-radius");
      const inputAlvo = ultimoBloco.querySelector(".id-alvo");

      if (inputId) inputId.value = idElemento;
      if (inputValor) inputValor.value = valor;
      if (inputAlvo) inputAlvo.value = idAlvo;

      if (tipo === 'criarVariavel' || tipo === 'alterarVariavel') {
        const inputNome = ultimoBloco.querySelector(".nome-variavel");
        const inputVal = ultimoBloco.querySelector(".valor-variavel");
        if (inputNome) inputNome.value = nomeVariavel;
        if (inputVal) inputVal.value = valorVariavel;
      }

      if (tipo === 'tamanho') {
        const inputLargura = ultimoBloco.querySelector(".largura-elemento");
        const inputAltura = ultimoBloco.querySelector(".altura-elemento");
        if (inputLargura) inputLargura.value = larguraElemento;
        if (inputAltura) inputAltura.value = alturaElemento;
      }

      if (tipo === 'posicionarCaixa' || tipo === 'posicionarTexto') {
        const inputX = ultimoBloco.querySelector(".posicao-x");
        const inputY = ultimoBloco.querySelector(".posicao-y");
        if (inputX) inputX.value = posicaoX;
        if (inputY) inputY.value = posicaoY;
      }

      if (tipo === 'criarLista' || tipo === 'adicionarLista' || tipo === 'removerItemLista' || tipo === 'limparLista') {
        const inputNome = ultimoBloco.querySelector(".nome-lista");
        const inputValores = ultimoBloco.querySelector(".valores-lista");
        if (inputNome) inputNome.value = nomeLista;
        if (inputValores) inputValores.value = valoresLista;
      }
      
      if (tipo === 'criarAnimacao') {
        const inputIdElemento = ultimoBloco.querySelector(".id-elemento");
        const inputImagens = ultimoBloco.querySelector(".valor-imagens");
        const inputVelocidade = ultimoBloco.querySelector(".valor-velocidade");
        
        if (inputIdElemento) inputIdElemento.value = idElemento;
        if (inputImagens) inputImagens.value = valorImagens;
        if (inputVelocidade) inputVelocidade.value = valorVelocidade;
      }

      if (tipo === 'comentario' && comentarioOculto) {
        const botao = ultimoBloco.querySelector('.toggle-visibilidade');
        if (botao) {
          const bloco = botao.closest('.bloco');
          const todos = Array.from(document.querySelectorAll("#area-blocos .bloco"));
          const index = todos.indexOf(bloco);
          const fimClasse = "bloco-fimComentario";

          let profundidade = 1;
          let filhos = [];

          for (let i = index + 1; i < todos.length; i++) {
            const atual = todos[i];
            if (atual.classList.contains("bloco-comentario")) profundidade++;
            if (atual.classList.contains(fimClasse)) profundidade--;
            if (profundidade === 0) break;
            if (profundidade > 0) filhos.push(atual);
          }

          filhos.forEach(filho => filho.style.display = "none");
          botao.innerText = "+";
          bloco.classList.add('comentario-oculto');
        }
      }
    }
  });

  salvarBlocos(); // opcional, se quiser forçar atualização

  // Reaplicar visibilidade oculta nos comentários
  const blocos = Array.from(document.querySelectorAll("#area-blocos .bloco"));
  for (let i = 0; i < blocos.length; i++) {
    const bloco = blocos[i];
    if (bloco.classList.contains("bloco-comentario") && bloco.classList.contains("comentario-oculto")) {
      let profundidade = 1;
      for (let j = i + 1; j < blocos.length; j++) {
        const atual = blocos[j];
        if (atual.classList.contains("bloco-comentario")) profundidade++;
        if (atual.classList.contains("bloco-fimComentario")) profundidade--;
        if (profundidade === 0) break;
        if (profundidade > 0) atual.style.display = "none";
      }

      const botao = bloco.querySelector(".toggle-visibilidade");
      if (botao) botao.innerText = "+";
    }
  }
}

function aplicarVisibilidadeConformeEstado(blocoComentario) {
  const botao = blocoComentario.querySelector(".toggle-visibilidade");
  const oculto = blocoComentario.classList.contains("comentario-oculto");

  const todos = Array.from(document.querySelectorAll("#area-blocos .bloco"));
  const index = todos.indexOf(blocoComentario);

  const fimClasse = "bloco-fimComentario";

  let profundidade = 1;
  let filhos = [];

  for (let i = index + 1; i < todos.length; i++) {
    const atual = todos[i];

    if (atual.classList.contains("bloco-comentario")) {
      profundidade++;
    } else if (atual.classList.contains(fimClasse)) {
      profundidade--;
      if (profundidade === 0) break;
    }

    filhos.push(atual);
  }

  if (oculto) {
    filhos.forEach(filho => {
      filho.style.display = "none";
    });
    blocoComentario.classList.add("comentario-oculto");
    if (botao) botao.innerText = "-";
  } else {
    filhos.forEach(filho => {
      filho.style.display = "";
    });
    blocoComentario.classList.remove("comentario-oculto");
    if (botao) botao.innerText = "+";
  }

  filhos.forEach(filho => {
    if (filho.classList.contains("bloco-comentario")) {
      aplicarVisibilidadeConformeEstado(filho);
    }
  });
}

function alternarVisibilidadeFilhos(botao) {
  const bloco = botao.closest(".bloco");
  const tipoClasse = [...bloco.classList].find(c => c.startsWith("bloco-"));
  const todos = Array.from(document.querySelectorAll("#area-blocos .bloco"));
  const index = todos.indexOf(bloco);

  const fimClasse = {
    "bloco-comentario": "bloco-fimComentario"
  }[tipoClasse];

  if (!fimClasse) return;

  let profundidade = 1;
  let filhos = [];

  for (let i = index + 1; i < todos.length; i++) {
    const atual = todos[i];

    if (atual.classList.contains(tipoClasse)) {
      profundidade++;
    } else if (atual.classList.contains(fimClasse)) {
      profundidade--;
      if (profundidade === 0) break;
    }

    filhos.push(atual);
  }

  if (filhos.length === 0) return;

  const escondendo = filhos[0].style.display !== "none";

  if (escondendo) {
    filhos.forEach(filho => {
      filho.style.display = "none";
    });
    bloco.classList.add("comentario-oculto");
    botao.innerText = "+";
  } else {
    filhos.forEach(filho => {
      filho.style.display = "";
    });
    bloco.classList.remove("comentario-oculto");
    botao.innerText = "-";

    filhos.forEach(filho => {
      if (filho.classList.contains("bloco-comentario")) {
        aplicarVisibilidadeConformeEstado(filho);
      }
    });
  }

  salvarBlocos();
}

function atualizarNomeObjetoSelecionado() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const nome = localStorage.getItem("objetoSelecionado");

  const div = document.getElementById("nomeObjetoSelecionado");
  if (!div || !projeto || !cena || !nome) return;

  // Corrigido: usa a chave correta
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const chaveCena = `${projeto}_${cena}`;
  const objetos = objetosPorCena[chaveCena] || [];

  const objetoExiste = objetos.some(o => o.nome === nome);
  if (!objetoExiste) return;

  div.textContent = "Objeto: " + nome;
}

window.addEventListener("load", () => {
  const cena = localStorage.getItem("cenaSelecionada");
  const objeto = localStorage.getItem("objetoSelecionado");

  if (!cena || !objeto) {
    window.location.href = "Cenas.html";
    return;
  }

  carregarBlocos();
  atualizarNomeObjetoSelecionado();

  const area = document.getElementById("area-blocos");
  const scrollSalvo = localStorage.getItem("scrollBlocos");

  if (scrollSalvo !== null) {
    requestAnimationFrame(() => {
      area.scrollTop = parseInt(scrollSalvo);
      localStorage.removeItem("scrollBlocos");
    });
  }
});

document.getElementById("botaoCopiarBloco").addEventListener("click", () => {  
  // Alterna entre true e false  
  modoCopiaAtivo = !modoCopiaAtivo;  
  
  const botaoCopiar = document.getElementById("botaoCopiarBloco");  
  
  if (modoCopiaAtivo) {  
    document.body.style.cursor = "copy";  
    botaoCopiar.classList.add("ativo");  
  } else {  
    document.body.style.cursor = "default";  
    botaoCopiar.classList.remove("ativo");  
  }  
});

const blocosFim = [
  "bloco-fimIf",
  "bloco-fimRepetir",
  "bloco-fimRepetirAte",
  "bloco-fimLoopInfinito",
  "bloco-fimInstantaneo",
  "bloco-fimToque",
  "bloco-fimToqueNaTela",
  "bloco-fimComentario",
  "bloco-fimAoCriarClone"
];

document.addEventListener("click", (e) => {
  if (!modoCopiaAtivo) return;
  const blocoSelecionado = e.target.closest(".bloco");
  if (!blocoSelecionado) return;

  const tipoClasse = [...blocoSelecionado.classList].find(c => c.startsWith("bloco-"));
  if (blocosFim.includes(tipoClasse)) {
    modoCopiaAtivo = false;
    document.body.style.cursor = "default";
    const botaoCopiar =    document.getElementById("botaoCopiarBloco");
    botaoCopiar.classList.remove("ativo");
    return;
  }

  const container = document.getElementById("area-blocos");
  const todosBlocos = Array.from(container.querySelectorAll(".bloco"));
  const indexInicio = todosBlocos.indexOf(blocoSelecionado);

  const blocosComFim = {
    "bloco-if": "bloco-fimIf",
    "bloco-repetir": "bloco-fimRepetir",
    "bloco-repetirAte": "bloco-fimRepetirAte",
    "bloco-inicioInstantaneo": "bloco-fimInstantaneo",
    "bloco-toque": "bloco-fimToque",
    "bloco-toqueNaTela": "bloco-fimToqueNaTela",
    "bloco-loopInfinito": "bloco-fimLoopInfinito",
    "bloco-comentario": "bloco-fimComentario",
    "bloco-aoCriarClone": "bloco-fimAoCriarClone"
  };

  let grupoParaCopiar = [blocoSelecionado];
  if (blocosComFim[tipoClasse]) {
    let profundidade = 1;
    for (let i = indexInicio + 1; i < todosBlocos.length; i++) {
      const atual = todosBlocos[i];
      if (atual.classList.contains(tipoClasse)) profundidade++;
      if (atual.classList.contains(blocosComFim[tipoClasse])) profundidade--;
      grupoParaCopiar.push(atual);
      if (profundidade === 0) break;
    }
  }

  // Cria os clones
  const clones = grupoParaCopiar.map(bloco => {
    const clone = bloco.cloneNode(true);
    clone.classList.remove("dragging");
    return clone;
  });

  // Insere os clones logo após o último bloco do grupo original
  const blocoFinal = grupoParaCopiar[grupoParaCopiar.length - 1];
  const proximoBloco = blocoFinal.nextElementSibling;

  clones.forEach(clone => {
  if (proximoBloco) {
    container.insertBefore(clone, proximoBloco);
  } else {
    container.appendChild(clone);
  }

  configurarBloco(clone);
});

  salvarBlocos();
  
  modoCopiaAtivo = false;
document.body.style.cursor = "default";
document.getElementById("botaoCopiarBloco").classList.remove("ativo");
});

function configurarBloco(bloco) {
  bloco.classList.add("bloco");
  bloco.draggable = true;

  bloco.addEventListener("dragstart", () => {
    const todosBlocos = Array.from(document.querySelectorAll("#area-blocos .bloco"));
    const indexInicio = todosBlocos.indexOf(bloco);
    blocosArrastandoGrupo = [bloco];

    const tipoClasse = [...bloco.classList].find(c => c.startsWith("bloco-"));
    const blocosComFim = {
      "bloco-if": "bloco-fimIf",
      "bloco-repetir": "bloco-fimRepetir",
      "bloco-repetirAte": "bloco-fimRepetirAte",
      "bloco-inicioInstantaneo": "bloco-fimInstantaneo",
      "bloco-toque": "bloco-fimToque",
      "bloco-toqueNaTela": "bloco-fimToqueNaTela",
      "bloco-loopInfinito": "bloco-fimLoopInfinito",
      "bloco-comentario": "bloco-fimComentario",
      "bloco-aoCriarClone": "bloco-fimAoCriarClone"
    };

    if (blocosComFim[tipoClasse]) {
      let profundidade = 1;
      for (let i = indexInicio + 1; i < todosBlocos.length; i++) {
        const atual = todosBlocos[i];
        if (atual.classList.contains(tipoClasse)) profundidade++;
        if (atual.classList.contains(blocosComFim[tipoClasse])) profundidade--;
        blocosArrastandoGrupo.push(atual);
        if (profundidade === 0) break;
      }
    }

    blocosArrastandoGrupo.forEach(b => b.classList.add("dragging"));
  });

  bloco.addEventListener("dragend", () => {
    blocosArrastandoGrupo.forEach(b => b.classList.remove("dragging"));
    blocoArrastando = null;
    blocosArrastandoGrupo = [];
    salvarBlocos();
  });

  setTimeout(() => {
    bloco.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", salvarBlocos);
    });
  }, 0.1);

  setTimeout(() => {
    bloco.querySelectorAll(".id-elemento").forEach(input => {
      input.setAttribute("list", "listaIdsGlobais");
      input.addEventListener("input", () => {
        salvarBlocos();
      });
    });
  }, 0.1);
}
