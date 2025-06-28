AndroidInterface.changeOrientation('portrait');

let cenaParaEditar = null;
let tempoPressionado = null;

function abrirModal() { 
document.getElementById("modalCriarCenas").style.display = "flex";
}

function fecharModal() { 
document.getElementById("modalCriarCenas").style.display = "none";
}

function abrirModalEditarCena(nomeAntigo) {
  cenaParaEditar = nomeAntigo;
  document.getElementById("inputEditarNomeCena").value = nomeAntigo;
  document.getElementById("modalEditarCena").style.display = "flex";
}

function fecharModalEditarCena() {
  document.getElementById("modalEditarCena").style.display = "none";
  cenaParaEditar = null;
}

function confirmarEdicaoCena() {
  const novoNome = document.getElementById("inputEditarNomeCena").value.trim();
  const erro = document.getElementById("mensagemErroEditarCena");

  erro.style.display = "none";

  if (!novoNome) {
    erro.textContent = "Digite um novo nome.";
    erro.style.display = "block";
    return;
  }

  const projeto = localStorage.getItem("projetoSelecionado");
  const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  const cenas = cenasPorProjeto[projeto] || [];

  if (cenas.some(c => c.nome === novoNome)) {
    erro.textContent = "Já existe uma cena com esse nome.";
    erro.style.display = "block";
    return;
  }

  // Atualiza nome
  const cena = cenas.find(c => c.nome === cenaParaEditar);
  if (cena) cena.nome = novoNome;
  localStorage.setItem("cenasPorProjeto", JSON.stringify(cenasPorProjeto));

  // Atualizar objetos
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const chaveAntiga = `${projeto}_${cenaParaEditar}`;
  const chaveNova = `${projeto}_${novoNome}`;
  if (objetosPorCena[chaveAntiga]) {
    objetosPorCena[chaveNova] = objetosPorCena[chaveAntiga];
    delete objetosPorCena[chaveAntiga];
    localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));
  }

  // Atualizar blocos
  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  if (blocosPorCena[projeto]?.[cenaParaEditar]) {
    blocosPorCena[projeto][novoNome] = blocosPorCena[projeto][cenaParaEditar];
    delete blocosPorCena[projeto][cenaParaEditar];
    localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));
  }

  // Atualizar imagens
  const chaveImgAntiga = `imagens_${projeto}_${cenaParaEditar}`;
  const chaveImgNova = `imagens_${projeto}_${novoNome}`;
  if (localStorage.getItem(chaveImgAntiga)) {
    localStorage.setItem(chaveImgNova, localStorage.getItem(chaveImgAntiga));
    localStorage.removeItem(chaveImgAntiga);
  }

  fecharModalEditarCena();
  location.reload(); // Recarrega a lista
}

function criarCena() {
  const input = document.getElementById("inputNomeCena");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  const projetoSelecionado = localStorage.getItem("projetoSelecionado");
  if (!projetoSelecionado) return;

  const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  const cenas = cenasPorProjeto[projetoSelecionado] || [];

  const nomesExistentes = cenas.map(c => c.nome);

  input.classList.remove("erro");
  erro.style.display = "none";

  if (!nome) {
    input.classList.add("erro");
    erro.textContent = "Digite um nome para a cena.";
    erro.style.display = "block";
    return;
  }

  if (nomesExistentes.includes(nome)) {
    input.classList.add("erro");
    erro.textContent = "Já existe uma cena com esse nome.";
    erro.style.display = "block";
    return;
  }

  adicionarCenaNaTela(nome);
  salvarCena(nome);
  input.value = "";
  fecharModal();
}

function adicionarCenaNaTela(nome) {
  const lista = document.getElementById("listaCenas");

  const cena = document.createElement("div");
  cena.className = "cena";

  const conteudoEsquerda = document.createElement("div");
  conteudoEsquerda.className = "cena-conteudo";

  const imagem = document.createElement("img");
  imagem.src = "https://i.ibb.co/mrjDhnSN/1750551944048.png";
  imagem.alt = "Ícone da cena";
  imagem.className = "icone-cena";
  imagem.style.borderRadius = "5px";

  const texto = document.createElement("span");
  texto.textContent = nome;
  texto.className = "nome-cena";
  texto.title = nome;

  conteudoEsquerda.appendChild(imagem);
  conteudoEsquerda.appendChild(texto);

  // Pressionar e segurar para editar nome
  conteudoEsquerda.addEventListener("mousedown", () => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarCena(nome);
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
      abrirModalEditarCena(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("touchend", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("click", () => {
    if (!tempoPressionado) {
      localStorage.setItem("cenaSelecionada", nome);
      window.location.href = "Objetos.html";
    }
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.onclick = () => {
    lista.removeChild(cena);
    removerCena(nome);
  };

  cena.appendChild(conteudoEsquerda);
  cena.appendChild(botaoExcluir);
  lista.appendChild(cena);
}

function salvarCena(nome) {
  const projeto = localStorage.getItem("projetoSelecionado");
  let cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};

  cenasPorProjeto[projeto] = cenasPorProjeto[projeto] || [];

  // Verifica se já existe uma cena com o mesmo nome
  if (cenasPorProjeto[projeto].some(c => c.nome === nome)) {
    console.warn("Cena já existe.");
    return;
  }

  cenasPorProjeto[projeto].push({ nome });
  localStorage.setItem("cenasPorProjeto", JSON.stringify(cenasPorProjeto));

  // ✅ Prepara chave única para dados futuros
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const chaveCena = `${projeto}_${nome}`;
  objetosPorCena[chaveCena] = []; // ou {} dependendo do formato
  localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));
}

function removerCena(nome) {
  const projetoSelecionado = localStorage.getItem("projetoSelecionado");
  if (!projetoSelecionado) return;

  // Remover a cena da lista
  const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  const cenas = cenasPorProjeto[projetoSelecionado] || [];
  cenasPorProjeto[projetoSelecionado] = cenas.filter(c => c.nome !== nome);
  localStorage.setItem("cenasPorProjeto", JSON.stringify(cenasPorProjeto));

  // Remover objetos da cena
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const chaveCena = `${projetoSelecionado}_${nome}`;
  if (objetosPorCena[chaveCena]) {
    delete objetosPorCena[chaveCena];
    localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));
  }

  // Remover blocos da cena
  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  if (blocosPorCena[projetoSelecionado]?.[nome]) {
    delete blocosPorCena[projetoSelecionado][nome];
    localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));
  }

  // ✅ Remover imagens da cena
  const chaveImagens = `imagens_${projetoSelecionado}_${nome}`;
  if (localStorage.getItem(chaveImagens)) {
    localStorage.removeItem(chaveImagens);
  }
}

function carregarCenasSalvas() {
  const projeto = localStorage.getItem("projetoSelecionado");
  let cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  let cenas = cenasPorProjeto[projeto] || [];

  cenas.forEach(c => {
    if (c && typeof c.nome === "string") {
      adicionarCenaNaTela(c.nome);
    }
  });
}

function executarTodos() {
  const projeto = localStorage.getItem("projetoSelecionado");

  if (!projeto) return;

  const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};

  const listaCenas = cenasPorProjeto[projeto];
  if (!listaCenas || listaCenas.length === 0) return;

  const primeiraCena = listaCenas[0]?.nome;
  const dadosDaCena = blocosPorCena[projeto]?.[primeiraCena] || {};

  if (!primeiraCena) return;

  localStorage.setItem("blocosParaExecucao", JSON.stringify({
    [projeto]: {
      [primeiraCena]: dadosDaCena
    }
  }));

  localStorage.setItem("cenaSelecionada", primeiraCena);
  window.location.href = "ExecutandoJogo.html";
}

document.getElementById("inputNomeCena").addEventListener("input", () => {
  const input = document.getElementById("inputNomeCena");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

document.getElementById("inputEditarNomeCena").addEventListener("input", () => {
  const input = document.getElementById("inputEditarNomeCena");
  const erro = document.getElementById("mensagemErroEditarCena");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarCenasSalvas;
