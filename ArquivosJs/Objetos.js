AndroidInterface.changeOrientation('portrait');

let objetoParaEditar = null;
let tempoPressionado = null;

function abrirModal() {
document.getElementById("modalCriarObjetos").style.display = "flex";
}

function fecharModal() {
document.getElementById("modalCriarObjetos").style.display = "none";
}

function abrirModalEditarObjeto(nomeAntigo) {
  objetoParaEditar = nomeAntigo;
  document.getElementById("inputEditarNomeObjeto").value = nomeAntigo;
  document.getElementById("modalEditarObjeto").style.display = "flex";
}

function fecharModalEditarObjeto() {
  document.getElementById("modalEditarObjeto").style.display = "none";
  objetoParaEditar = null;
}

function confirmarEdicaoObjeto() {
  const novoNome = document.getElementById("inputEditarNomeObjeto").value.trim();
  const erro = document.getElementById("mensagemErroEditarObjeto");

  erro.style.display = "none";

  if (!novoNome) {
    erro.textContent = "Digite um novo nome.";
    erro.style.display = "block";
    return;
  }

  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const chaveCena = `${projeto}_${cena}`;

  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const objetos = objetosPorCena[chaveCena] || [];

  if (objetos.some(o => o.nome === novoNome)) {
    erro.textContent = "Já existe um objeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  const objeto = objetos.find(o => o.nome === objetoParaEditar);
  if (objeto) objeto.nome = novoNome;
  localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  if (blocosPorCena[projeto]?.[cena]?.[objetoParaEditar]) {
    blocosPorCena[projeto][cena][novoNome] = blocosPorCena[projeto][cena][objetoParaEditar];
    delete blocosPorCena[projeto][cena][objetoParaEditar];
    localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));
  }

  fecharModalEditarObjeto();
  location.reload();
}

function criarObjeto() {
  const input = document.getElementById("inputNomeObjeto");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  const cenaSelecionada = localStorage.getItem("cenaSelecionada");
  const projetoSelecionado = localStorage.getItem("projetoSelecionado");

  if (!cenaSelecionada || !projetoSelecionado) {
    return;
  }

  const chaveCena = `${projetoSelecionado}_${cenaSelecionada}`;
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const objetos = objetosPorCena[chaveCena] || [];

  const nomesExistentes = objetos.map(obj => obj.nome);

  input.classList.remove("erro");
  erro.style.display = "none";

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

  // Pressionar e segurar para editar nome
  conteudoEsquerda.addEventListener("mousedown", () => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarObjeto(nome);
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
      abrirModalEditarObjeto(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("touchend", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("click", () => {
    if (!tempoPressionado) {
      localStorage.setItem("objetoSelecionado", nome);
      window.location.href = "Scripts.html";
    }
  });

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
  const cena = localStorage.getItem("cenaSelecionada");

  if (!cena || !projeto) return;

  const chaveCena = `${projeto}_${cena}`;
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  objetosPorCena[chaveCena] = objetosPorCena[chaveCena] || [];
  objetosPorCena[chaveCena].push({ nome });
  localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  blocosPorCena[projeto] = blocosPorCena[projeto] || {};
  blocosPorCena[projeto][cena] = blocosPorCena[projeto][cena] || {};
  blocosPorCena[projeto][cena][nome] = [
    { tipo: "inicioInstantaneo" },
    { tipo: "fimInstantaneo" }
  ];
  localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));
}

function removerObjeto(nome) {
  const cenaSelecionada = localStorage.getItem("cenaSelecionada");
  const projeto = localStorage.getItem("projetoSelecionado");
  if (!cenaSelecionada || !projeto) return;

  const chaveCena = `${projeto}_${cenaSelecionada}`;
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const objetos = objetosPorCena[chaveCena] || [];
  objetosPorCena[chaveCena] = objetos.filter(obj => obj.nome !== nome);
  localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  if (blocosPorCena[projeto]?.[cenaSelecionada]) {
    delete blocosPorCena[projeto][cenaSelecionada][nome];
    localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));
  }
}

function carregarObjetosSalvos() {
  const cena = localStorage.getItem("cenaSelecionada");
  const projeto = localStorage.getItem("projetoSelecionado");
  if (!cena || !projeto) return;

  const chaveCena = `${projeto}_${cena}`;
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const objetos = objetosPorCena[chaveCena] || [];

  objetos.forEach(p => {
    if (p && typeof p.nome === "string") {
      adicionarObjetoNaTela(p.nome);
    }
  });
}

function executarTodos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");

  if (!projeto || !cena) {
    return;
  }

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
  const dadosDaCena = blocosPorCena[projeto]?.[cena] || {};

  localStorage.setItem("blocosParaExecucao", JSON.stringify({
    [projeto]: {
      [cena]: dadosDaCena
    }
  }));

  window.location.href = "ExecutandoJogo.html";
}

document.getElementById("inputNomeObjeto").addEventListener("input", () => {
  const input = document.getElementById("inputNomeObjeto");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

document.getElementById("inputEditarNomeObjeto").addEventListener("input", () => {
  const input = document.getElementById("inputEditarNomeObjeto");
  const erro = document.getElementById("mensagemErroEditarObjeto");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarObjetosSalvos;
