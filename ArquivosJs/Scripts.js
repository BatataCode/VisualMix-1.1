function abrirModal() {
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
    "bloco-loopInfinito": "bloco-fimLoopInfinito"
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

  const blocosSemBotao = ['fimIf', 'fimRepetir', 'fimRepetirAte', 'fimLoopInfinito', 'fimInstantaneo', 'fimToque'];
if (!blocosSemBotao.includes(tipo)) {
  bloco.innerHTML = `<button class="fechar" onclick="removerBloco(this)">x</button>`;
}

  if (tipo === 'border') {
    bloco.classList.add('bloco-border');
    bloco.innerHTML += `
      <h3>Alterar Borda</h3>
      <input type="text" placeholder="ID do Elemento (ex: caixa1)" class="id-elemento" />
      <input type="text" placeholder="Border-Radius (ex: 10px)" class="valor-radius" data-tipo="border" />
    `;
  } else if (tipo === 'cor') {
    bloco.classList.add('bloco-cor');
    bloco.innerHTML += `
      <h3>Alterar Cor de Fundo</h3>
      <input type="text" placeholder="ID do Elemento (ex: caixa1)" class="id-elemento" />
      <input type="text" placeholder="Cor (ex: blue)" class="valor-radius" data-tipo="cor" />
    `;
  } else if (tipo === 'caixa') {
    bloco.classList.add('bloco-caixa');
    bloco.innerHTML += `
      <h3>Criar Nova Caixa</h3>
      <input type="text" placeholder="ID da Nova Caixa (ex: nova1)" class="id-elemento" />
      <input type="text" placeholder="Cor de Fundo (ex: pink)" class="valor-radius" data-tipo="caixa" />
    `;
  } else if (tipo === 'esperar') {
    bloco.classList.add('bloco-esperar');
    bloco.innerHTML += `
      <h3>Aguardar Segundos</h3>
      <input type="text" placeholder="Tempo em segundos (ex: 2)" class="valor-radius" data-tipo="esperar" />
    `;
  } else if (tipo === 'if') {
    bloco.classList.add('bloco-if');
    bloco.innerHTML += `
      <h3>Se (condição)</h3>
      <input type="text" placeholder="Digite a condição (ex: 1 > 2)" class="condicao" />
    `;
  } else if (tipo === 'fimIf') {
    bloco.classList.add('bloco-fimIf');
    bloco.innerHTML += `<h3>Fim Se</h3>`;
  } else if (tipo === 'inicioInstantaneo') {
    bloco.classList.add('bloco-inicioInstantaneo');
    bloco.innerHTML += `<h3>Quando Começar</h3>`;
  } else if (tipo === 'fimInstantaneo') {
    bloco.classList.add('bloco-fimInstantaneo');
    bloco.innerHTML += `<h3>Fim Começar</h3>`;
  } else if (tipo === 'repetir') {
    bloco.classList.add('bloco-repetir');
    bloco.innerHTML += `
      <h3>Repetir (vezes)</h3>
      <input type="number" placeholder="Número de vezes (ex: 3)" class="valor-radius" data-tipo="repetir" />
    `;
  } else if (tipo === 'fimRepetir') {
    bloco.classList.add('bloco-fimRepetir');
    bloco.innerHTML += `<h3>Fim Repetir</h3>`;
  } else if (tipo === 'criarVariavel') {
    bloco.classList.add('bloco-criarVariavel');
    bloco.innerHTML += `
      <h3>Criar Variável</h3>
      <input type="text" placeholder="Nome da variável" class="nome-variavel" />
      <input type="text" placeholder="Valor inicial" class="valor-variavel" />
    `;
  } else if (tipo === 'alterarVariavel') {
    bloco.classList.add('bloco-alterarVariavel');
    bloco.innerHTML += `
      <h3>Alterar Variável</h3>
      <input type="text" placeholder="Nome da variável" class="nome-variavel" />
      <input type="text" placeholder="Novo valor" class="valor-variavel" />
    `;
  } else if (tipo === 'toque') {
    bloco.classList.add('bloco-toque');
    bloco.innerHTML += `
      <h3>Quando Tocar em</h3>
      <input type="text" placeholder="ID do elemento (ex: caixa1)" class="id-elemento" />
    `;
  } else if (tipo === 'fimToque') {
    bloco.classList.add('bloco-fimToque');
    bloco.innerHTML += `<h3>Fim Tocar</h3>`;
  } else if (tipo === 'tamanho') {
    bloco.classList.add('bloco-tamanho');
    bloco.innerHTML += `
      <h3>Alterar Tamanho</h3>
      <input type="text" placeholder="ID do Elemento (ex: caixa1)" class="id-elemento" />
      <input type="text" placeholder="Largura (ex: 100px)" class="largura-elemento" />
      <input type="text" placeholder="Altura (ex: 50px)" class="altura-elemento" />
    `;
  } else if (tipo === 'texto') {
    bloco.classList.add('bloco-texto');
    bloco.innerHTML += `
      <h3>Mostrar Texto</h3>
      <input type="text" placeholder="ID do Texto" class="id-elemento" />
      <input type="text" placeholder="Conteúdo do texto" class="valor-radius" data-tipo="texto" />
    `;
  } else if (tipo === 'posicionarCaixa') {
    bloco.classList.add('bloco-posicionarCaixa');
    bloco.innerHTML += `
      <h3>Posicionar Caixa</h3>
      <input type="text" placeholder="ID da caixa" class="id-elemento" />
      <input type="text" placeholder="Posição X (ex: 100px)" class="posicao-x" />
      <input type="text" placeholder="Posição Y (ex: 50px)" class="posicao-y" />
    `;
  } else if (tipo === 'posicionarTexto') {
    bloco.classList.add('bloco-posicionarTexto');
    bloco.innerHTML += `
      <h3>Posicionar Texto</h3>
      <input type="text" placeholder="ID do texto" class="id-elemento" />
      <input type="text" placeholder="Posição X (ex: 100px)" class="posicao-x" />
      <input type="text" placeholder="Posição Y (ex: 50px)" class="posicao-y" />
    `;
  } else if (tipo === 'repetirAte') {
  bloco.classList.add('bloco-repetirAte');
  bloco.innerHTML += `
    <h3>Repetir até (condição)</h3>
    <input type="text" placeholder="Digite a condição (ex: $N > 10)" class="condicao" />
  `;
} else if (tipo === 'fimRepetirAte') {
  bloco.classList.add('bloco-fimRepetirAte');
  bloco.innerHTML += `<h3>Fim Repetir até</h3>`;
} else if (tipo === 'loopInfinito') {
  bloco.classList.add('bloco-loopInfinito');
  bloco.innerHTML += `
    <h3>Repetir Sempre</h3>
  `;
} else if (tipo === 'fimLoopInfinito') {
  bloco.classList.add('bloco-fimLoopInfinito');
  bloco.innerHTML += `
    <h3>Fim Repetir Sempre</h3>
  `;
} else if (tipo === 'mostrar') {
  bloco.classList.add('bloco-mostrar');
  bloco.innerHTML += `
    <h3>Mostrar Caixa</h3>
    <input type="text" placeholder="ID da caixa" class="id-elemento" />
  `;
} else if (tipo === 'esconder') {
  bloco.classList.add('bloco-esconder');
  bloco.innerHTML += `
    <h3>Esconder Caixa</h3>
    <input type="text" placeholder="ID da caixa" class="id-elemento" />
  `;
} else if (tipo === 'fonteTexto') {
  bloco.classList.add('bloco-fonteTexto');
  bloco.innerHTML += `
    <h3>Fonte do Texto</h3>
    <input type="text" placeholder="ID do texto" class="id-elemento" />
    <input type="text" placeholder="Fonte (ex: Arial)" class="valor-radius" />
  `;
} else if (tipo === 'tamanhoFonte') {
  bloco.classList.add('bloco-tamanhoFonte');
  bloco.innerHTML += `
    <h3>Tamanho do Texto</h3>
    <input type="text" placeholder="ID do texto" class="id-elemento" />
    <input type="text" placeholder="Tamanho da fonte (ex: 20px)" class="valor-radius" />
  `;
} else if (tipo === 'corTexto') {
  bloco.classList.add('bloco-corTexto');
  bloco.innerHTML += `
    <h3>Cor do Texto</h3>
    <input type="text" placeholder="ID do texto" class="id-elemento" />
    <input type="text" placeholder="Cor (ex: red" class="valor-radius" />
  `;
} else if (tipo === 'criarLista') {
  bloco.classList.add('bloco-criarLista');
  bloco.innerHTML += `
    <h3>Criar Lista</h3>
    <input type="text" placeholder="Nome da lista" class="nome-lista" />
    <input type="text" placeholder="Valores separados por vírgula" class="valores-lista" />
  `;
} else if (tipo === 'adicionarLista') {
  bloco.classList.add('bloco-adicionarLista');
  bloco.innerHTML += `
    <h3>Adicionar na Lista</h3>
    <input type="text" placeholder="Nome da lista" class="nome-lista" />
    <input type="text" placeholder="Valor a adicionar" class="valores-lista" />
  `;
} else if (tipo === 'mover') {
  bloco.classList.add('bloco-mover');
  bloco.innerHTML += `
    <h3>Mover Passos</h3>
    <input type="text" placeholder="ID da caixa" class="id-elemento" />
    <input type="text" placeholder="Passos a mover" class="valor-radius" />
  `;
} else if (tipo === 'direcao') {
  bloco.classList.add('bloco-direcao');
  bloco.innerHTML += `
    <h3>Definir Direção</h3>
    <input type="text" placeholder="ID da caixa" class="id-elemento" />
    <input type="text" placeholder="Graus (ex: 90)" class="valor-radius" />
  `;
} else if (tipo === 'camada') {
  bloco.classList.add('bloco-camada');
  bloco.innerHTML += `
    <h3>Alterar Camada</h3>
    <input type="text" placeholder="ID do Elemento (ex: caixa1)" class="id-elemento" />
    <input type="number" placeholder="Camada (ex: 5)" class="valor-radius" data-tipo="camada" />
  `;
} else if (tipo === 'remover') {
  bloco.classList.add('bloco-remover');
  bloco.innerHTML += `
    <h3>Remover Caixa</h3>
    <input type="text" placeholder="ID do Elemento (ex: caixa1)" class="id-elemento" />
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
      atualizarAutoCompleteIds();
    });
  });

  atualizarAutoCompleteIds();
}, 0.1);

  const area = document.getElementById("area-blocos");  
  area.appendChild(bloco);  
  
 // Adiciona o bloco "fim" automaticamente se necessário  
if (adicionarFimAutomatico && ['if', 'repetir', 'inicioInstantaneo', 'toque', 'repetirAte', 'loopInfinito'].includes(tipo)) {  
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
  }  
  
  blocoFim.classList.add(`bloco-${tipoFim}`);  
  
  // Só adiciona botão "x" se NÃO for bloco de fim  
  const blocosSemX = ['fimIf', 'fimRepetir', 'fimRepetirAte', 'fimLoopInfinito', 'fimInstantaneo', 'fimToque'];  
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
  const blocosPais = ['bloco-if', 'bloco-repetir', 'bloco-repetirAte', 'bloco-loopInfinito', 'bloco-inicioInstantaneo', 'bloco-toque'];
  
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
}

function removerBloco(botao) {
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
  else if (tipoClasse === "bloco-loopInfinito") fimTipo = "bloco-fimLoopInfinito";

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
  salvarBlocos();
  atualizarAutoCompleteIds();
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
  const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};
  const projeto = localStorage.getItem("projetoSelecionado");

  if (!projeto || !blocosPorProjeto[projeto]) return;

  const dadosDoProjeto = blocosPorProjeto[projeto];

  // Mesmo que não tenha blocos em algum objeto, garante que ele vá como lista vazia
  const dadosPreparados = {};
  for (const objeto in dadosDoProjeto) {
    dadosPreparados[objeto] = dadosDoProjeto[objeto] || [];
  }

  localStorage.setItem("blocosParaExecucao", JSON.stringify(dadosPreparados));
  
  const area = document.getElementById("area-blocos");
localStorage.setItem("scrollBlocos", area.scrollTop);

  window.location.href = "ExecutandoJogo.html";
}

function salvarBlocos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const objeto = localStorage.getItem("objetoSelecionado");

  if (!projeto || !objeto) return;

  const blocos = document.querySelectorAll("#area-blocos .bloco");
  const dados = [];

  blocos.forEach(bloco => {
    let tipo = '';
    if (bloco.classList.contains('bloco-border')) tipo = 'border';
    else if (bloco.classList.contains('bloco-cor')) tipo = 'cor';
    else if (bloco.classList.contains('bloco-caixa')) tipo = 'caixa';
    else if (bloco.classList.contains('bloco-esperar')) tipo = 'esperar';
    else if (bloco.classList.contains('bloco-if')) tipo = 'if';
    else if (bloco.classList.contains('bloco-fimIf')) tipo = 'fimIf';
    else if (bloco.classList.contains('bloco-inicioInstantaneo')) tipo = 'inicioInstantaneo';
    else if (bloco.classList.contains('bloco-fimInstantaneo')) tipo = 'fimInstantaneo';
    else if (bloco.classList.contains('bloco-repetir')) tipo = 'repetir';
    else if (bloco.classList.contains('bloco-fimRepetir')) tipo = 'fimRepetir';
    else if (bloco.classList.contains('bloco-repetirAte')) tipo = 'repetirAte';
    else if (bloco.classList.contains('bloco-fimRepetirAte')) tipo = 'fimRepetirAte';
    else if (bloco.classList.contains('bloco-criarVariavel')) tipo = 'criarVariavel';
    else if (bloco.classList.contains('bloco-alterarVariavel')) tipo = 'alterarVariavel';
    else if (bloco.classList.contains('bloco-toque')) tipo = 'toque';
    else if (bloco.classList.contains('bloco-fimToque')) tipo = 'fimToque';
    else if (bloco.classList.contains('bloco-tamanho')) tipo = 'tamanho';
    else if (bloco.classList.contains('bloco-texto')) tipo = 'texto';
    else if (bloco.classList.contains('bloco-fonteTexto')) tipo = 'fonteTexto';
    else if (bloco.classList.contains('bloco-posicionarCaixa')) tipo = 'posicionarCaixa';
    else if (bloco.classList.contains('bloco-posicionarTexto')) tipo = 'posicionarTexto';
    else if (bloco.classList.contains('bloco-loopInfinito')) tipo = 'loopInfinito';
    else if (bloco.classList.contains('bloco-fimLoopInfinito')) tipo = 'fimLoopInfinito';
    else if (bloco.classList.contains('bloco-mostrar')) tipo = 'mostrar';
    else if (bloco.classList.contains('bloco-esconder')) tipo = 'esconder';
    else if (bloco.classList.contains('bloco-tamanhoFonte')) tipo = 'tamanhoFonte';
    else if (bloco.classList.contains('bloco-corTexto')) tipo = 'corTexto';
    else if (bloco.classList.contains('bloco-criarLista')) tipo = 'criarLista';
    else if (bloco.classList.contains('bloco-criarLista')) tipo = 'criarLista';
    else if (bloco.classList.contains('bloco-mover')) tipo = 'mover';
    else if (bloco.classList.contains('bloco-direcao')) tipo = 'direcao';
    else if (bloco.classList.contains('bloco-camada')) tipo = 'camada';
    else if (bloco.classList.contains('bloco-remover')) tipo = 'remover';
    else if (bloco.classList.contains('bloco-adicionarLista')) tipo = 'adicionarLista';

    const idElemento = bloco.querySelector(".id-elemento")?.value || '';
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

dados.push({
  tipo,
  idElemento,
  valor,
  condicao,
  nomeVariavel,
  valorVariavel,
  larguraElemento,
  alturaElemento,
  posicaoX,
  posicaoY,
  nomeLista,
  valoresLista
});
  });

  const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};
  blocosPorProjeto[projeto] = blocosPorProjeto[projeto] || {};
  blocosPorProjeto[projeto][objeto] = dados;
  localStorage.setItem("blocosPorProjeto", JSON.stringify(blocosPorProjeto));
}

function carregarBlocos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const objeto = localStorage.getItem("objetoSelecionado");

  if (!projeto || !objeto) return;

  const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};
  const dados = blocosPorProjeto[projeto]?.[objeto];

  if (!dados) return;

  dados.forEach(({ tipo, idElemento, valor, condicao, nomeVariavel, valorVariavel, larguraElemento, alturaElemento, posicaoX, posicaoY, nomeLista, valoresLista }) => {
    // Passa 'false' para não adicionar bloco "fim" automaticamente ao carregar
    adicionarBloco(tipo, false);

    const blocos = document.querySelectorAll("#area-blocos .bloco");
    const ultimoBloco = blocos[blocos.length - 1];

    if (ultimoBloco) {
      if (tipo === 'if' && condicao) {
        const inputCondicao = ultimoBloco.querySelector(".condicao");
        if (inputCondicao) inputCondicao.value = condicao;
      }

      const inputId = ultimoBloco.querySelector(".id-elemento");
      const inputValor = ultimoBloco.querySelector(".valor-radius");

      if (inputId) inputId.value = idElemento;
      if (inputValor) inputValor.value = valor;

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
      
      if (tipo === 'repetirAte' && condicao) {
  const inputCond = ultimoBloco.querySelector(".condicao");
  if (inputCond) inputCond.value = condicao;
         }
         
      if (tipo === 'criarLista' || tipo === 'adicionarLista') {
  const inputNome = ultimoBloco.querySelector(".nome-lista");
  const inputValores = ultimoBloco.querySelector(".valores-lista");
  if (inputNome) inputNome.value = nomeLista;
  if (inputValores) inputValores.value = valoresLista;
       }
    }
  });

  salvarBlocos();
  atualizarAutoCompleteIds();
}

function atualizarAutoCompleteIds() {
  document.getElementById("listaIdsCaixas")?.remove();
  document.getElementById("listaIdsTextos")?.remove();

  const datalistCaixas = document.createElement("datalist");
  datalistCaixas.id = "listaIdsCaixas";

  const datalistTextos = document.createElement("datalist");
  datalistTextos.id = "listaIdsTextos";

  const idsCaixas = new Set();
  const idsTextos = new Set();

  const classesCaixas = [
    "bloco-caixa", "bloco-posicionarCaixa", "bloco-mover", "bloco-direcao",
    "bloco-mostrar", "bloco-esconder", "bloco-border", "bloco-cor",
    "bloco-tamanho", "bloco-toque", "bloco-camada"
  ];

  const classesTextos = [
    "bloco-texto", "bloco-posicionarTexto", "bloco-fonteTexto",
    "bloco-tamanhoFonte", "bloco-corTexto"
  ];

  const isCaixa = bloco => classesCaixas.some(classe => bloco.classList.contains(classe));
  const isTexto = bloco => classesTextos.some(classe => bloco.classList.contains(classe));

  document.querySelectorAll(".bloco").forEach(bloco => {
    const input = bloco.querySelector(".id-elemento");
    if (input && input.value.trim()) {
      const id = input.value.trim();
      if (isCaixa(bloco)) idsCaixas.add(id);
      if (isTexto(bloco)) idsTextos.add(id);
    }
  });
  
  for (const id of idsCaixas) {
    datalistCaixas.appendChild(Object.assign(document.createElement("option"), { value: id }));
  }

  for (const id of idsTextos) {
    datalistTextos.appendChild(Object.assign(document.createElement("option"), { value: id }));
  }

  document.body.appendChild(datalistCaixas);
  document.body.appendChild(datalistTextos);

  document.querySelectorAll(".bloco").forEach(bloco => {
    const input = bloco.querySelector(".id-elemento");
    if (!input) return;

    if (isCaixa(bloco)) input.setAttribute("list", "listaIdsCaixas");
    if (isTexto(bloco)) input.setAttribute("list", "listaIdsTextos");
  });
}

window.addEventListener("load", () => {
  carregarBlocos();
  const area = document.getElementById("area-blocos");
  const scrollSalvo = localStorage.getItem("scrollBlocos");

  if (scrollSalvo !== null) {
    requestAnimationFrame(() => {
      area.scrollTop = parseInt(scrollSalvo);
      localStorage.removeItem("scrollBlocos");
    });
  }
});