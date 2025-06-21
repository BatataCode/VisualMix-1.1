function abrirModal() {  
  document.getElementById("modalCriarProjetos").style.display = "flex";  
}  
  
function fecharModal() {  
  document.getElementById("modalCriarProjetos").style.display = "none";  
}  
  
function criarProjeto() {  
  const input = document.getElementById("inputNomeProjeto");  
  const nome = input.value.trim();  
  const erro = document.getElementById("mensagemErro");  
  
  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];  
  const nomesExistentes = projetos.map(p => typeof p === 'string' ? p : p.nome);  
  
  // Reset estilo  
  input.classList.remove("erro");  
  erro.style.display = "none";  
  
  // Validação  
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
  
  // Tudo ok  
  adicionarProjetoNaTela(nome);  
  salvarProjeto(nome);  
  input.value = "";  
  fecharModal();  
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

// Ao clicar em qualquer parte do conteúdo esquerdo, redireciona para objetos.html
conteudoEsquerda.onclick = () => {
  localStorage.setItem("projetoSelecionado", nome);
  window.location.href = "ProjetoAberto.html";
};
  
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
  
function salvarProjeto(nome) {  
  let projetos = JSON.parse(localStorage.getItem("projetos")) || [];  
  projetos.push({ nome }); // salva como objeto  
  localStorage.setItem("projetos", JSON.stringify(projetos));  
}  
  
function removerProjeto(nome) {
  // Remove da lista de projetos
  let projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  projetos = projetos.filter(p => p.nome !== nome);
  localStorage.setItem("projetos", JSON.stringify(projetos));

  // Remove os objetos associados ao projeto
  let objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
  delete objetosPorProjeto[nome];
  localStorage.setItem("objetosPorProjeto", JSON.stringify(objetosPorProjeto));

  // Remove os blocos associados ao projeto
  let blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};
  delete blocosPorProjeto[nome];
  localStorage.setItem("blocosPorProjeto", JSON.stringify(blocosPorProjeto));
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
  
window.onload = carregarProjetosSalvos;
