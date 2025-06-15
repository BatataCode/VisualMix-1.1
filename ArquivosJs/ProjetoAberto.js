function abrirModal() {
  document.getElementById("modalCriarObjetos").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalCriarObjetos").style.display = "none";
}

function criarObjeto() {
  const input = document.getElementById("inputNomeObjeto");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  const projetoSelecionado = localStorage.getItem("projetoSelecionado");
  if (!projetoSelecionado) {
    alert("Nenhum projeto selecionado!");
    return;
  }

  const objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
  const objetos = objetosPorProjeto[projetoSelecionado] || [];

  const nomesExistentes = objetos.map(obj => obj.nome);

  // Resetar estilo de erro
  input.classList.remove("erro");
  erro.style.display = "none";

  // Validações
  if (!nome) {
    input.classList.add("erro");
    erro.textContent = "Digite um nome para o objeto.";
    erro.style.display = "block";
    return;
  }

  if (nomesExistentes.includes(nome)) {
    input.classList.add("erro");
    erro.textContent = "Já existe um objeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  // Criar objeto
  adicionarObjetoNaTela(nome);
  salvarObjeto(nome);
  input.value = "";
  fecharModal();
}

function adicionarObjetoNaTela(nome) {
  const lista = document.getElementById("listaObjetos");

  const objeto = document.createElement("div");
  objeto.className = "objeto";

  const conteudoEsquerda = document.createElement("div");
  conteudoEsquerda.className = "objeto-conteudo";

  const imagem = document.createElement("img");
  imagem.src = "https://cdn-icons-png.flaticon.com/512/2620/2620993.png";
  imagem.alt = "Ícone do objeto";
  imagem.className = "icone-objeto";
  imagem.style.borderRadius = "5px";

  const texto = document.createElement("span");
  texto.textContent = nome;
  texto.className = "nome-objeto";
  texto.title = nome;

  conteudoEsquerda.appendChild(imagem);
  conteudoEsquerda.appendChild(texto);
  
  conteudoEsquerda.onclick = () => {
  localStorage.setItem("objetoSelecionado", nome);
  window.location.href = "Scripts.html";
};

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.onclick = () => {
    lista.removeChild(objeto);
    removerObjeto(nome);
  };

  objeto.appendChild(conteudoEsquerda);
  objeto.appendChild(botaoExcluir);
  lista.appendChild(objeto);
}

function salvarObjeto(nome) {
  const projeto = localStorage.getItem("projetoSelecionado");
  let objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
  objetosPorProjeto[projeto] = objetosPorProjeto[projeto] || [];
  objetosPorProjeto[projeto].push({ nome });
  localStorage.setItem("objetosPorProjeto", JSON.stringify(objetosPorProjeto));
}

function removerObjeto(nome) {
  const projetoSelecionado = localStorage.getItem("projetoSelecionado");
  if (!projetoSelecionado) return;

  // Remover objeto da lista de objetos
  const objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
  const objetos = objetosPorProjeto[projetoSelecionado] || [];
  objetosPorProjeto[projetoSelecionado] = objetos.filter(obj => obj.nome !== nome);
  localStorage.setItem("objetosPorProjeto", JSON.stringify(objetosPorProjeto));

  // Remover blocos associados a esse objeto
  const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};
  if (blocosPorProjeto[projetoSelecionado]) {
    delete blocosPorProjeto[projetoSelecionado][nome];
    localStorage.setItem("blocosPorProjeto", JSON.stringify(blocosPorProjeto));
  }
}

function carregarObjetosSalvos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  let objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
  let objetos = objetosPorProjeto[projeto] || [];

  objetos.forEach(p => {
    if (p && typeof p.nome === "string") {
      adicionarObjetoNaTela(p.nome);
    }
  });
}

function executarTodos() {
  const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};
  const projeto = localStorage.getItem("projetoSelecionado");

  if (!projeto) return;

  const dadosDoProjeto = blocosPorProjeto[projeto] || {};

  const dadosPreparados = {};
  for (const objeto in dadosDoProjeto) {
    dadosPreparados[objeto] = dadosDoProjeto[objeto] || [];
  }

  localStorage.setItem("blocosParaExecucao", JSON.stringify(dadosPreparados));
  window.location.href = "ExecutandoJogo.html";
}

document.getElementById("inputNomeObjeto").addEventListener("input", () => {
  const input = document.getElementById("inputNomeObjeto");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarObjetosSalvos;
