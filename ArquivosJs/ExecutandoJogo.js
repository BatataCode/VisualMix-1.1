function substituirVariaveis(texto, variaveis) {
  if (typeof texto !== "string") return texto;

  function substituirSimples(str) {
    return str.replace(/\$([a-zA-Z_]\w*)/g, (_, nome) =>
      nome in variaveis ? `(${JSON.stringify(variaveis[nome])})` : `$${nome}`
    );
  }

  function transformarExpressao(expr) {
  return expr
    // operadores lógicos em português
    .replace(/\bnão\b/g, "!")
    .replace(/\bou\b/g, "||")
    .replace(/\be\b/g, "&&")
    // variáveis como variaveis["X"]
    .replace(/\b([a-zA-Z_]\w*)\b/g, (nome) =>
      nome in variaveis ? `variaveis["${nome}"]` : nome
    );
}

  // Define função aleatorio(min, max)
  const contexto = {  
  variaveis,  
  aleatorio: (min, max) => {  
    min = Number(min);  
    max = Number(max);  
    return Math.floor(Math.random() * (max - min + 1)) + min;  
  },
  colidiu // ← Aqui!
};

  // ${...}
  texto = texto.replace(/\$\{([^\}]+)\}/g, (_, exprOriginal) => {
    try {
      const expr = transformarExpressao(substituirSimples(exprOriginal));
      return Function("with(this) { return " + expr + "}").call(contexto);
    } catch {
      return '${' + exprOriginal + '}';
    }
  });

  // $var + algo
  texto = texto.replace(/\$([a-zA-Z_]\w*)([^\s]*)/g, (_, nome, resto) => {
    if (!(nome in variaveis)) return `$${nome}${resto}`;
    try {
      const expr = transformarExpressao(`(${JSON.stringify(variaveis[nome])})${resto}`);
      return Function("with(this) { return " + expr + "}").call(contexto);
    } catch {
      return `$${nome}${resto}`;
    }
  });

  // Se sobrou apenas uma expressão matemática pura
  if (/^[0-9+\-*/().\s]+$/.test(texto.trim())) {
    try {
      return Function("with(this) { return " + texto + "}").call(contexto);
    } catch {
      return texto;
    }
  }

  return texto;
}

function colidiu(id1, id2) {
  // Se ambos forem arrays
  if (Array.isArray(id1) && Array.isArray(id2)) {
    return id1.some(a =>
      id2.some(b => colidiu(a, b)) // chamada recursiva
    );
  }

  // Se apenas id1 for array
  if (Array.isArray(id1)) {
    return id1.some(a => colidiu(a, id2));
  }

  // Se apenas id2 for array
  if (Array.isArray(id2)) {
    return id2.some(b => colidiu(id1, b));
  }

  // Ambos são strings (caso base)
  const el1 = document.getElementById("caixa_" + id1);
  const el2 = document.getElementById("caixa_" + id2);
  if (!el1 || !el2) return false;

  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();

  return !(
    r1.right < r2.left ||
    r1.left > r2.right ||
    r1.bottom < r2.top ||
    r1.top > r2.bottom
  );
}

async function executarBlocos(blocos, variaveis = {}) {
  let i = 0;
  while (i < blocos.length) {
    const bloco = blocos[i];

    if (bloco.tipo === 'inicioInstantaneo') {
      const filhos = [];
      let profundidade = 1;
      i++;
      while (i < blocos.length) {
        const proximo = blocos[i];
        if (proximo.tipo === 'inicioInstantaneo') profundidade++;
        if (proximo.tipo === 'fimInstantaneo') {
          profundidade--;
          if (profundidade === 0) break;
        }
        filhos.push(proximo);
        i++;
      }

      if (profundidade === 0) {
        (async () => {
          await executarBlocosInternos([...filhos], variaveis);
        })();
      }

      i++;
      continue;
    }
    i++;
  }
}

async function executarBlocosInternos(blocos, variaveis = {}) {
  let i = 0;
  while (i < blocos.length) {
    const bloco = blocos[i];

    if (bloco.tipo === 'if') {
      let condicao = false;
      try {
        const expressao = substituirVariaveis(bloco.condicao, variaveis);
        condicao = eval(expressao);
      } catch (e) {
        console.warn("Erro ao avaliar condição:", bloco.condicao);
      }

      if (!condicao) {
        while (i < blocos.length && blocos[i].tipo !== 'fimIf') {
          i++;
        }
      }
    } else if (bloco.tipo === 'caixa') {
  const idBruto = bloco.idElemento;
  const id = substituirVariaveis(idBruto, variaveis);
  const cor = substituirVariaveis(bloco.valor, variaveis);
  const domId = `caixa_${id}`;

  if (!document.getElementById(domId)) {
    const nova = document.createElement("div");
    nova.id = domId;
    nova.className = "caixa";
    nova.style.background = cor || "gray";
    document.getElementById("areaExecucao").appendChild(nova);
  }
} else if (bloco.tipo === 'cor') {
      const id = substituirVariaveis(bloco.idElemento, variaveis);
      const el = document.getElementById(`caixa_${id}`);
      if (el) {
        const novaCor = substituirVariaveis(bloco.valor, variaveis);
        el.style.background = novaCor;
      }
    } else if (bloco.tipo === 'border') {
      const id = substituirVariaveis(bloco.idElemento, variaveis);
      const el = document.getElementById(`caixa_${id}`);
      if (el) {
        const novoRaio = substituirVariaveis(bloco.valor, variaveis);
        el.style.borderRadius = novoRaio;
      }
    } else if (bloco.tipo === 'esperar') {
      const tempo = substituirVariaveis(bloco.valor, variaveis);
      const segundos = parseFloat(tempo);
      if (!isNaN(segundos)) {
        await new Promise(resolve => setTimeout(resolve, segundos * 1000));
      }
    } else if (bloco.tipo === 'criarVariavel') {
      const nome = bloco.nomeVariavel;
      let valor = substituirVariaveis(bloco.valorVariavel, variaveis);
      try { valor = eval(valor); } catch {}
      variaveis[nome] = valor;
    } else if (bloco.tipo === 'alterarVariavel') {
      const nome = bloco.nomeVariavel;
      let valor = substituirVariaveis(bloco.valorVariavel, variaveis);
      try { valor = eval(valor); } catch {}

      if (nome in variaveis) {
        if (typeof variaveis[nome] === "number" && typeof valor === "number") {
          variaveis[nome] += valor;
        } else {
          variaveis[nome] = String(variaveis[nome]) + String(valor);
        }
      } else {
        console.warn(`Variável '${nome}' não foi criada.`);
      }
    } else if (bloco.tipo === 'criarLista') {
  const nome = bloco.nomeLista;
  let itensTexto = substituirVariaveis(bloco.valoresLista, variaveis);
  let lista = [];

  try {
    // Tenta transformar diretamente em array se possível (ex: [1,2,3])
    const avaliado = eval(itensTexto);
    if (Array.isArray(avaliado)) {
      lista = avaliado;
    } else {
      // Se não for array direto, tenta separar por vírgulas como texto
      lista = itensTexto.split(",").map(e => e.trim());
    }
  } catch {
    // Se der erro, tenta dividir por vírgulas mesmo assim
    lista = itensTexto.split(",").map(e => e.trim());
  }

  variaveis[nome] = lista;
} else if (bloco.tipo === 'adicionarLista') {
  const nome = substituirVariaveis(bloco.nomeLista, variaveis);
  const valor = substituirVariaveis(bloco.valoresLista, variaveis);

  if (!Array.isArray(variaveis[nome])) {
    console.warn(`A lista '${nome}' não existe.`);
  } else {
    variaveis[nome].push(valor);
}
  } else if (bloco.tipo === 'toque') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const domId = `caixa_${id}`;
  const alvo = document.getElementById(domId);
  const filhos = [];
  let profundidade = 1;
  i++;

  while (i < blocos.length) {
    const proximo = blocos[i];
    if (proximo.tipo === 'toque') profundidade++;
    if (proximo.tipo === 'fimToque') {
      profundidade--;
      if (profundidade === 0) break;
    }
    filhos.push(proximo);
    i++;
  }

  if (alvo) {
    variaveis[`tocando_${id}`] = false;

alvo.addEventListener("pointerdown", () => {
  variaveis[`tocando_${id}`] = true;
  executarBlocosInternos([...filhos], variaveis);
});

const finalizarToque = () => {
  variaveis[`tocando_${id}`] = false;
};

alvo.addEventListener("pointerup", finalizarToque);
alvo.addEventListener("pointercancel", finalizarToque);
alvo.addEventListener("pointerleave", finalizarToque);

  }
} else if (bloco.tipo === 'texto') {
  const idBruto = bloco.idElemento;
  const id = substituirVariaveis(idBruto, variaveis);
  const texto = substituirVariaveis(bloco.valor, variaveis);
  const domId = `texto_${id}`;
  
  let div = document.getElementById(domId);
  if (!div) {
    div = document.createElement("div");
    div.id = domId;
    div.className = "texto-fixo";
    document.getElementById("areaExecucao").appendChild(div);
  }

  div.textContent = texto;
} else if (bloco.tipo === 'fonteTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const fonte = substituirVariaveis(bloco.valor, variaveis);
  const el = document.getElementById(`texto_${id}`);
  if (el) {
    el.style.fontFamily = fonte;
  }
} else if (bloco.tipo === 'tamanhoFonte') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const tamanho = substituirVariaveis(bloco.valor, variaveis);
  const el = document.getElementById(`texto_${id}`);
  if (el) {
    el.style.fontSize = tamanho;
    }
} else if (bloco.tipo === 'corTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`texto_${id}`);
  if (el) {
    const cor = substituirVariaveis(bloco.valor, variaveis);
    el.style.color = cor;  // Aqui que muda a cor do texto
  }
} else if (bloco.tipo === 'posicionarCaixa') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) {
    const x = substituirVariaveis(bloco.posicaoX, variaveis);
    const y = substituirVariaveis(bloco.posicaoY, variaveis);

  if (el && el.classList.contains('caixa')) {
  el.style.position = 'absolute';
  el.style.left = `calc(50% + ${x})`;
  el.style.top = `calc(50% - ${y})`;
  el.style.transform = 'translate(-50%, -50%)';
    }
  }
} else if (bloco.tipo === 'posicionarTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`texto_${id}`);
  if (el) {
    const x = substituirVariaveis(bloco.posicaoX, variaveis);
    const y = substituirVariaveis(bloco.posicaoY, variaveis);

  if (el && el.classList.contains('texto-fixo')) {
  el.style.position = 'absolute';
  el.style.left = `calc(50% + ${x})`;
  el.style.top = `calc(50% - ${y})`;
  el.style.transform = 'translate(-50%, -50%)';
    }
  }
} else if (bloco.tipo === 'mover') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) {
    const passos = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 0;
    const direcao = parseFloat(variaveis[`direcao_${id}`]) || -90;
    
    const rad = (Math.PI / 180) * direcao;
    const dx = Math.sin(rad) * passos;
    const dy = -Math.cos(rad) * passos;

    // Pega a posição real da caixa na tela
    const pos = el.getBoundingClientRect();
    const container = document.getElementById("areaExecucao");
    const containerRect = container.getBoundingClientRect();

    // Calcula posição relativa ao container
    const atualX = pos.left - containerRect.left;
    const atualY = pos.top - containerRect.top;

    // Novo destino
    const novoX = atualX + dx;
    const novoY = atualY + dy;

    // Só remove o translate se ainda estiver com ele
   if (getComputedStyle(el).transform.includes("matrix")) {
  el.style.transform = "none";

  // Recalcula posição após remover o transform
  const posAjustada = el.getBoundingClientRect();
  const container = document.getElementById("areaExecucao");
  const containerRect = container.getBoundingClientRect();
  const ajustadoX = posAjustada.left - containerRect.left;
  const ajustadoY = posAjustada.top - containerRect.top;
  el.style.left = `${ajustadoX}px`;
  el.style.top = `${ajustadoY}px`;
}

    el.style.position = "absolute";
    el.style.left = `${novoX}px`;
    el.style.top = `${novoY}px`;
  }
} else if (bloco.tipo === 'direcao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const valor = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 0;
  variaveis[`direcao_${id}`] = valor;
} else if (bloco.tipo === 'tamanho') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) {
    const largura = substituirVariaveis(bloco.larguraElemento, variaveis);
    const altura = substituirVariaveis(bloco.alturaElemento, variaveis);
    if (largura) el.style.width = largura;
    if (altura) el.style.height = altura;
}
  } else if (bloco.tipo === 'camada') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const z = substituirVariaveis(bloco.valor, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) {
    el.style.zIndex = parseInt(z);
    el.style.position = el.style.position || 'absolute';
}
  } else if (bloco.tipo === 'mostrar') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) el.style.display = "block";

} else if (bloco.tipo === 'esconder') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) el.style.display = "none";
} else if (bloco.tipo === 'remover') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const el = document.getElementById(`caixa_${id}`);
  if (el) el.remove();
} else if (bloco.tipo === 'repetirAte') {
  const filhos = [];
  let profundidade = 1;
  i++;
  while (i < blocos.length) {
    const proximo = blocos[i];
    if (proximo.tipo === 'repetirAte') profundidade++;
    if (proximo.tipo === 'fimRepetirAte') {
      profundidade--;
      if (profundidade === 0) break;
    }
    filhos.push(proximo);
    i++;
  }

  // Repetir até a condição se tornar verdadeira
  while (true) {
    let condicaoAtendida = false;
    try {
      const cond = substituirVariaveis(bloco.condicao, variaveis);
      condicaoAtendida = eval(cond);
    } catch (e) {
      console.warn("Erro na condição do repetirAte:", bloco.condicao);
    }

    if (condicaoAtendida) break;
    await executarBlocosInternos([...filhos], variaveis);

    await new Promise(resolve => setTimeout(resolve, 0.001)); // pequena pausa para evitar travar
  }
} else if (bloco.tipo === 'loopInfinito') {
  const filhos = [];
  let profundidade = 1;
  i++;
  while (i < blocos.length) {
    const proximo = blocos[i];
    if (proximo.tipo === 'loopInfinito') profundidade++;
    if (proximo.tipo === 'fimLoopInfinito') {
      profundidade--;
      if (profundidade === 0) break;
    }
    filhos.push(proximo);
    i++;
  }

  // Loop para sempre
  while (true) {
    await executarBlocosInternos([...filhos], variaveis);
    await new Promise(resolve => setTimeout(resolve, 0.001)); // pequena pausa
  }
} else if (bloco.tipo === 'repetir') {
      const vezesTexto = substituirVariaveis(bloco.valor, variaveis);
      const vezes = parseInt(vezesTexto);
      if (isNaN(vezes)) {
        i++;
        continue;
      }

      const filhos = [];
      let profundidade = 1;
      i++;
      while (i < blocos.length) {
        const proximo = blocos[i];
        if (proximo.tipo === 'repetir') profundidade++;
        if (proximo.tipo === 'fimRepetir') {
          profundidade--;
          if (profundidade === 0) break;
        }
        filhos.push(proximo);
        i++;
      }

      for (let r = 0; r < vezes; r++) {
        await executarBlocosInternos([...filhos], variaveis);
        await new Promise(resolve => setTimeout(resolve, 0.001)); // pequena pausa
      }
    }

    i++;
  }
}

window.onload = async () => {
  const dadosDoProjeto = JSON.parse(localStorage.getItem("blocosParaExecucao")) || {};
  for (const objeto in dadosDoProjeto) {
    const blocos = dadosDoProjeto[objeto];
    if (Array.isArray(blocos)) {
      await executarBlocos(blocos);
    }
  }
};
