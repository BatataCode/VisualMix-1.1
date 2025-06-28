// Detecta clique em inputs texto dentro de .bloco para abrir o modal
document.addEventListener("click", (e) => {
  const input = e.target;
  if (
    input.tagName === "INPUT" &&
    input.type === "text" &&
    input.closest(".bloco") &&
    !input.readOnly &&
    !input.disabled
  ) {
    e.preventDefault();
    abrirCalculadora(input);
    input.blur();
  }
});

let inputSelecionado = null;
// Abre o modal da calculadora e inicializa o input
function abrirCalculadora(input) {
  inputSelecionado = input;

  const expressaoInput = document.getElementById("inputExpressao");
  expressaoInput.value = input.value || "";
  atualizarResultado();

  expressaoInput.oninput = () => {
    atualizarResultado();
    const variaveis = coletarSugestoesDosBlocos();
    ativarAutoCompleteCalculadora(variaveis);
  };

  document.getElementById("modalCalculadora").style.display = "flex";
  expressaoInput.focus();
}

// Fecha o modal e limpa o input selecionado
function fecharCalculadora() {
  document.getElementById("modalCalculadora").style.display = "none";
  inputSelecionado = null;
}

// Avalia a expressão digitada (atenção: uso de Function pode ser perigoso)
function avaliarExpressao(expr) {
  expr = expr.trim();

  // Permite apenas caracteres válidos de expressão numérica básica
  if (/^[\d\s+\-*/().]+$/.test(expr) === false) {
    if (!/^["'].*["']$/.test(expr)) {
      expr = `'${expr.replace(/'/g, "\\'")}'`;
    }
  }

  return Function("return " + expr)();
}

// Atualiza a área de resultado com o valor avaliado ou erro
function atualizarResultado() {
  const input = document.getElementById("inputExpressao");
  const resultadoEl = document.getElementById("resultadoExpressao");

  try {
    const resultado = avaliarExpressao(input.value);
    resultadoEl.textContent = "= " + resultado;
  } catch {
    resultadoEl.textContent = "= erro";
  }
}

// Função para tratar cliques nos botões da calculadora
function clicarBotao(simbolo) {
  const input = document.getElementById("inputExpressao");

  if (simbolo === "←") {
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start === end && start > 0) {
      input.value = input.value.slice(0, start - 1) + input.value.slice(end);
      input.selectionStart = input.selectionEnd = start - 1;
    } else {
      input.value = input.value.slice(0, start) + input.value.slice(end);
      input.selectionStart = input.selectionEnd = start;
    }
  } else if (simbolo === "C") {
    input.value = "";
  } else {
    inserirNoCursor(input, simbolo);
  }

  input.focus();
  atualizarResultado();
}

// Insere texto no cursor do input na posição atual
function inserirNoCursor(input, texto) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const valorAtual = input.value;

  input.value = valorAtual.slice(0, start) + texto + valorAtual.slice(end);
  const novaPosicao = start + texto.length;
  input.selectionStart = input.selectionEnd = novaPosicao;
}

// Aplica o resultado avaliado no input original e fecha o modal
function aplicarResultado() {
  const input = document.getElementById("inputExpressao");

  try {
    const resultado = avaliarExpressao(input.value);
    if (inputSelecionado) {
      inputSelecionado.value = resultado;
      inputSelecionado.dispatchEvent(new Event("input"));
    }
    fecharCalculadora();
  } catch {
    // Pode avisar o usuário ou ignorar silenciosamente
  }
}

// Coleta sugestões de variáveis, listas e elementos para autocomplete
function coletarSugestoesDosBlocos() {
  const sugestoes = new Set();

  document.querySelectorAll(".bloco").forEach((bloco) => {
    const idElemento = bloco.querySelector(".id-elemento");
    const nomeVariavel = bloco.querySelector(".nome-variavel");
    const nomeLista = bloco.querySelector(".nome-lista");

    if (idElemento && idElemento.value.trim()) {
      sugestoes.add(idElemento.value.trim());
    }
    if (nomeVariavel && nomeVariavel.value.trim()) {
      sugestoes.add(nomeVariavel.value.trim());
    }
    if (nomeLista && nomeLista.value.trim()) {
      sugestoes.add(nomeLista.value.trim());
    }
  });

  // Sugestões extras fixas
  sugestoes.add("aleatorio(1, 10)");
  sugestoes.add("colisao('caixa1', 'caixa2')");
  sugestoes.add("toqueX");
  sugestoes.add("toqueY");
  sugestoes.add("tocando_caixa1");
  sugestoes.add("posX('caixa1')");
  sugestoes.add("posY('caixa1')");
  sugestoes.add("comprimento");
  sugestoes.add("direcao('caixa1')");
  sugestoes.add("apontarPara('caixa1', 'alvo1')");

  return sugestoes;
}

let monitorandoPosicao = false;

function ativarAutoCompleteCalculadora(variaveis) {
  const input = document.getElementById("inputExpressao");
  const sugestoes = document.getElementById("sugestoesCalculadora");
  if (!sugestoes) return;

  sugestoes.innerHTML = "";
  const termo = input.value.trim().split(/[^a-zA-Z0-9_]/).pop();
  if (!termo || termo.length < 1) {
    sugestoes.style.display = "none";
    return;
  }

  const filtradas = Array.from(variaveis).filter((nome) =>
    nome.startsWith(termo)
  );

  if (filtradas.length === 0 || (filtradas.length === 1 && filtradas[0] === termo)) {
    sugestoes.style.display = "none";
    return;
  }

  filtradas.forEach((nome) => {
    const item = document.createElement("div");
    item.textContent = nome;
    item.style.padding = "6px 8px";
    item.style.cursor = "pointer";
    item.onmousedown = () => {
      input.value = input.value.replace(new RegExp(termo + "$"), nome);
      sugestoes.style.display = "none";
      input.focus();
      atualizarResultado();
    };
    sugestoes.appendChild(item);
  });

  // Exibe sugestões e inicia monitoramento de posição
  sugestoes.style.display = "block";
  monitorarPosicaoDoInput(input, sugestoes);
}

function monitorarPosicaoDoInput(input, sugestoes) {
  if (monitorandoPosicao) return;

  monitorandoPosicao = true;
  const atualiza = () => {
    const rect = input.getBoundingClientRect();
    sugestoes.style.position = "fixed";
    sugestoes.style.left = rect.left + "px";
    sugestoes.style.top = rect.bottom +20 + "px";
    sugestoes.style.width = rect.width + "px";

    if (sugestoes.style.display === "none") {
      monitorandoPosicao = false;
    } else {
      requestAnimationFrame(atualiza);
    }
  };
  requestAnimationFrame(atualiza);
}

// Fecha sugestões ao clicar fora
document.addEventListener("click", (e) => {
  const input = document.getElementById("inputExpressao");
  const sugestoes = document.getElementById("sugestoesCalculadora");

  if (!sugestoes) return;

  if (e.target !== input) {
    sugestoes.style.display = "none";
    if (input) input.focus();
  }
});

function abrirModalImagensSalvas(aoSelecionar) {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const chave = `imagens_${projeto}_${cena}`;

  let imagens = [];
  try {
    imagens = JSON.parse(localStorage.getItem(chave)) || [];
  } catch {
    imagens = [];
  }

  window._callbackImagemSelecionada = aoSelecionar;

  const modal = document.getElementById("modalImagens");
  const container = document.getElementById("listaImagens");
  container.innerHTML = "";

  imagens.forEach(({ nome, src }) => {
    const wrapper = document.createElement("div");
    wrapper.className = "imagemWrapper";

    const img = document.createElement("img");
    img.src = src;
    img.title = nome;
    img.className = "imagemMiniatura";

    // Clique simples → copiar nome
    img.addEventListener("click", () => {
      navigator.clipboard.writeText(nome);
    });

    // Hover (visualmente mantém destaque)
    img.onmouseover = () => img.style.border = "2px solid #4caf50";
    img.onmouseout = () => img.style.border = "2px solid transparent";

    // Botão de excluir
    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "✖";
    botaoExcluir.className = "botaoExcluirImagem";
    botaoExcluir.onclick = (e) => {
      e.stopPropagation(); // Impede que o clique propague para img
      excluirImagem(nome);
    };

    wrapper.appendChild(img);
    wrapper.appendChild(botaoExcluir);
    container.appendChild(wrapper);
  });

  modal.style.display = "flex";
}

function fecharModalImagens() {
  document.getElementById("modalImagens").style.display = "none";
  window._callbackImagemSelecionada = null;
}

function excluirImagem(nomeImagem) {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const chave = `imagens_${projeto}_${cena}`;

  let imagens = [];
  try {
    imagens = JSON.parse(localStorage.getItem(chave)) || [];
  } catch {
    imagens = [];
  }

  // Remove a imagem pelo nome
  imagens = imagens.filter(img => img.nome !== nomeImagem);
  localStorage.setItem(chave, JSON.stringify(imagens));

  // Reabre o modal com a lista atualizada
  abrirModalImagensSalvas(window._callbackImagemSelecionada);
}

function salvarNovaImagem(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 🛑 Verifica se é uma imagem
  if (!file.type.startsWith('image/')) {
    event.target.value = ''; // limpa o campo
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;

    const projeto = localStorage.getItem("projetoSelecionado");
    const cena = localStorage.getItem("cenaSelecionada");
    const chave = `imagens_${projeto}_${cena}`;

    let imagens = [];
    try {
      imagens = JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      imagens = [];
    }

    // 🔒 Evita nomes duplicados
    const existe = imagens.some(img => img.nome === file.name);
    if (existe) {
      return;
    }

    imagens.push({ nome: file.name, src: base64 });
    localStorage.setItem(chave, JSON.stringify(imagens));

    abrirModalImagensSalvas(window._callbackImagemSelecionada);
  };

  reader.readAsDataURL(file);
}

function abrirSeletorDeImagens() {
  abrirModalImagensSalvas((imagemSelecionada) => {
    if (inputSelecionado) {
      inputSelecionado.value = imagemSelecionada;
      inputSelecionado.dispatchEvent(new Event("input"));
    }
  });
}

const botoes = document.getElementById('AreaTodosBotoes');
const toggle = document.getElementById('toggleBotoes');

toggle.addEventListener('click', () => {
  botoes.classList.toggle('escondido');
});
