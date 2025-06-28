AndroidInterface.changeOrientation('portrait');

let nomeProjetoTemp = "";
let projetoParaEditar = null;
let tempoPressionado = null;

function abrirModal() {
  document.getElementById("modalCriarProjetos").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalCriarProjetos").style.display = "none";
}

function abrirModalExportar() {
  document.getElementById("modalExportarProjeto").style.display = "flex";
}

function fecharModalExportar() {
  document.getElementById("modalExportarProjeto").style.display = "none";
}

function fecharModalOrientacao() {
  document.getElementById("modalOrientacaoDoProjeto").style.display = "none";
  document.getElementById("inputNomeProjeto").value = "";
}

function abrirModalEditarProjeto(nomeAntigo) {
  projetoParaEditar = nomeAntigo;
  document.getElementById("inputEditarNomeProjeto").value = nomeAntigo;
  document.getElementById("modalEditarProjeto").style.display = "flex";
}

function fecharModalEditarProjeto() {
  document.getElementById("modalEditarProjeto").style.display = "none";
  projetoParaEditar = null;
}

function confirmarEdicaoNome() {
  const novoNome = document.getElementById("inputEditarNomeProjeto").value.trim();
  const erro = document.getElementById("mensagemErroEditar");

  erro.style.display = "none";

  if (!novoNome) {
    erro.textContent = "Digite um novo nome.";
    erro.style.display = "block";
    return;
  }

  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  const existe = projetos.some(p => p.nome === novoNome);

  if (existe) {
    erro.textContent = "Já existe um projeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  // Atualizar nome no array de projetos
  const projeto = projetos.find(p => p.nome === projetoParaEditar);
  if (projeto) projeto.nome = novoNome;
  localStorage.setItem("projetos", JSON.stringify(projetos));

  // Atualizar blocos, cenas e objetos
  const atualizarChave = (obj, prefixo) => {
    const novo = {};
    for (const chave in obj) {
      if (chave.startsWith(projetoParaEditar)) {
        const novaChave = chave.replace(projetoParaEditar, novoNome);
        novo[novaChave] = obj[chave];
      } else {
        novo[chave] = obj[chave];
      }
    }
    localStorage.setItem(prefixo, JSON.stringify(novo));
  };

  atualizarChave(JSON.parse(localStorage.getItem("objetosPorCena")) || {}, "objetosPorCena");
  atualizarChave(JSON.parse(localStorage.getItem("blocosPorCena")) || {}, "blocosPorCena");

  const cenas = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  cenas[novoNome] = cenas[projetoParaEditar];
  delete cenas[projetoParaEditar];
  localStorage.setItem("cenasPorProjeto", JSON.stringify(cenas));

  // Atualizar imagens (nomes de chaves)
  const keys = Object.keys(localStorage);
  keys.forEach(k => {
    if (k.startsWith(`imagens_${projetoParaEditar}_`)) {
      const novoK = k.replace(`imagens_${projetoParaEditar}_`, `imagens_${novoNome}_`);
      localStorage.setItem(novoK, localStorage.getItem(k));
      localStorage.removeItem(k);
    }
  });

  fecharModalEditarProjeto();
  location.reload(); // recarrega a lista
}

function criarProjeto() {
  const input = document.getElementById("inputNomeProjeto");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  const nomesExistentes = projetos.map(p => typeof p === 'string' ? p : p.nome);

  input.classList.remove("erro");
  erro.style.display = "none";

  if (!nome) {
    input.classList.add("erro");
    erro.textContent = "Digite um nome para o projeto.";
    erro.style.display = "block";
    return;
  }

  if (nomesExistentes.includes(nome)) {
    input.classList.add("erro");
    erro.textContent = "Já existe um projeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  nomeProjetoTemp = nome;
  fecharModal();
  document.getElementById("modalOrientacaoDoProjeto").style.display = "flex";
}

function confirmarOrientacao() {
  const select = document.getElementById("selectOrientacao");
  const orientacao = select.value;

  if (!nomeProjetoTemp || !orientacao) return;

  adicionarProjetoNaTela(nomeProjetoTemp);
  salvarProjeto(nomeProjetoTemp, orientacao);

  nomeProjetoTemp = "";
  document.getElementById("inputNomeProjeto").value = "";
  fecharModalOrientacao();
}

function adicionarProjetoNaTela(nome) {
  const lista = document.getElementById("listaProjetos");

  const projeto = document.createElement("div");
  projeto.className = "projeto";

  const conteudoEsquerda = document.createElement("div");
  conteudoEsquerda.className = "projeto-conteudo";

  const imagem = document.createElement("img");
  imagem.src = "https://cdn-icons-png.freepik.com/256/12148/12148631.png?semt=ais_hybrid";
  imagem.alt = "Ícone do projeto";
  imagem.className = "icone-projeto";

  const texto = document.createElement("span");
  texto.textContent = nome;
  texto.className = "nome-projeto";
  texto.title = nome;

  conteudoEsquerda.appendChild(imagem);
  conteudoEsquerda.appendChild(texto);

  // Detecção de toque longo (3 segundos)
  conteudoEsquerda.addEventListener("mousedown", (e) => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarProjeto(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("mouseup", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("mouseleave", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("touchstart", () => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarProjeto(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("touchend", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("click", () => {
    if (!tempoPressionado) {
      localStorage.setItem("projetoSelecionado", nome);
      window.location.href = "Cenas.html";
    }
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.onclick = () => {
    lista.removeChild(projeto);
    removerProjeto(nome);
  };

  projeto.appendChild(conteudoEsquerda);
  projeto.appendChild(botaoExcluir);
  lista.appendChild(projeto);
}

function salvarProjeto(nome, orientacao) {
  let projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  projetos.push({ nome, orientacao }); // salva nome e orientação
  localStorage.setItem("projetos", JSON.stringify(projetos));
}

function removerProjeto(nome) {
  // Remove o projeto da lista
  let projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  projetos = projetos.filter(p => p.nome !== nome);
  localStorage.setItem("projetos", JSON.stringify(projetos));

  // Remove cenas do projeto
  const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  const cenas = cenasPorProjeto[nome] || [];
  delete cenasPorProjeto[nome];
  localStorage.setItem("cenasPorProjeto", JSON.stringify(cenasPorProjeto));

  // Remove objetos de todas as cenas
  let objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  cenas.forEach(cena => {
    const chaveCena = `${nome}_${cena.nome}`;
    delete objetosPorCena[chaveCena];
  });
  localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));

  // Remove blocos de todas as cenas
  let blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  delete blocosPorCena[nome];
  localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));

  // ✅ Remove imagens de todas as cenas
  cenas.forEach(cena => {
    const chaveImagem = `imagens_${nome}_${cena.nome}`;
    localStorage.removeItem(chaveImagem);
  });
}

function carregarProjetosSalvos() {
  let projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  projetos.forEach(p => {
    if (p && typeof p.nome === "string") {
      adicionarProjetoNaTela(p.nome);
    }
  });
}

document.getElementById("inputNomeProjeto").addEventListener("input", () => {
  const input = document.getElementById("inputNomeProjeto");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

document.getElementById("inputEditarNomeProjeto").addEventListener("input", () => {
  const input = document.getElementById("inputEditarNomeProjeto");
  const erro = document.getElementById("mensagemErroEditar");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarProjetosSalvos;
