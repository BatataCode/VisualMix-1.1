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
  
function fecharCalculadora() {  
  document.getElementById("modalCalculadora").style.display = "none";  
  inputSelecionado = null;  
}  

function avaliarExpressao(expr) {
  expr = expr.trim();
  if (/^[\d\s+\-*/().]+$/.test(expr) === false) {
    if (!/^["'].*["']$/.test(expr)) {
      expr = `'${expr.replace(/'/g, "\\'")}'`;
    }
  }
  return Function("return " + expr)();
}

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

function inserirNoCursor(input, texto) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const valorAtual = input.value;

  input.value = valorAtual.slice(0, start) + texto + valorAtual.slice(end);
  
  const novaPosicao = start + texto.length;
  input.selectionStart = input.selectionEnd = novaPosicao;

}  
  
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
  
  }  
}

function coletarSugestoesDosBlocos() {
  const sugestoes = new Set();

  document.querySelectorAll(".bloco").forEach(bloco => {
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
  
  sugestoes.add("aleatorio(1, 10)");
  sugestoes.add("colisao('caixa1', 'caixa2')");
  sugestoes.add("toqueX");
  sugestoes.add("toqueY");
  sugestoes.add("toque_caixa1");
  sugestoes.add("posX('caixa1')");
  sugestoes.add("posY('caixa1')");
  sugestoes.add("posY('comprimento')");

  return sugestoes;
}

function ativarAutoCompleteCalculadora(variaveis) {
  const input = document.getElementById("inputExpressao");
  const sugestoes = document.getElementById("sugestoesCalculadora");

  if (!sugestoes) return;

  input.addEventListener("input", () => {
    const termo = input.value.trim().split(/[^a-zA-Z0-9_]/).pop();
    sugestoes.innerHTML = "";

    if (!termo || termo.length < 1) {
      sugestoes.style.display = "none";
      return;
    }

    const filtradas = Array.from(variaveis).filter(nome => nome.startsWith(termo));

if (filtradas.length === 0 || (filtradas.length === 1 && filtradas[0] === termo)) {
  sugestoes.style.display = "none";
  return;
}

    for (const nome of filtradas) {
      const item = document.createElement("div");
      item.textContent = nome;
      item.style.padding = "6px 8px";
      item.style.cursor = "pointer";
      item.onmousedown = () => {
        input.value = input.value.replace(new RegExp(termo + '$'), nome);
        sugestoes.style.display = "none";
        input.focus();
        atualizarResultado();
      };
      sugestoes.appendChild(item);
    }

    const rect = input.getBoundingClientRect();
    sugestoes.style.left = rect.left + "px";
    sugestoes.style.top = rect.bottom + window.scrollY + "px";
    sugestoes.style.width = rect.width + "px";
    sugestoes.style.display = "block";
    sugestoes.style.borderRadius = '5px';
  });

  document.addEventListener("click", (e) => {      
    if (e.target !== input) sugestoes.style.display = "none"; input.focus();
  });      
}
