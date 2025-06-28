function obterOrientacaoProjetoAtual() {
  const nome = localStorage.getItem("projetoSelecionado");
  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  const projeto = projetos.find(p => p.nome === nome);
  return projeto ? projeto.orientacao : null;
}

function esperarRotacaoEstabilizar(tentativas = 10, delay = 50) {
  return new Promise(resolve => {
    const larguraInicial = window.innerWidth;
    const alturaInicial = window.innerHeight;
    let contador = 0;

    const checar = () => {
      contador++;
      if (
        window.innerWidth !== larguraInicial ||
        window.innerHeight !== alturaInicial ||
        contador >= tentativas
      ) {
        setTimeout(() => {
          ajustarTamanhoCanvas();
          resolve();
        }, 200);
      } else {
        setTimeout(checar, delay);
      }
    };

    checar();
  });
}

const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");

const canvasCarimbos = document.createElement("canvas");
const ctxCarimbos = canvasCarimbos.getContext("2d");

let larguraVisual = window.innerWidth;
let alturaVisual = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

let cameraOffsetX = 0;
let cameraOffsetY = 0;

function ajustarTamanhoCanvas() {
  const centroVisualX = cameraOffsetX + larguraVisual / 2;
  const centroVisualY = cameraOffsetY + alturaVisual / 2;

  dpr = window.devicePixelRatio || 1;
  larguraVisual = window.innerWidth;
  alturaVisual = window.innerHeight;

  const larguraPx = larguraVisual * dpr;
  const alturaPx = alturaVisual * dpr;

  canvas.width = larguraPx;
  canvas.height = alturaPx;

  canvasCarimbos.width = larguraPx;
  canvasCarimbos.height = alturaPx;

  canvas.style.width = larguraVisual + "px";
  canvas.style.height = alturaVisual + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  ctxCarimbos.setTransform(1, 0, 0, 1, 0, 0); // reset no contexto dos carimbos
  ctxCarimbos.scale(dpr, dpr);

  cameraOffsetX = centroVisualX - larguraVisual / 2;
  cameraOffsetY = centroVisualY - alturaVisual / 2;
}

const caixasCanvas = [];
const caixasMap = new Map();
const textosCanvas = [];
const textosMap = new Map();
const eventosToqueCanvas = [];
let cameraAlvoId = null;
let suavidadeCamera = 0.05;
let mudouCena = false;
const eventosCloneCanvas = [];
const contadorClones = {};
const poolClones = {};

window.toqueX_global = 0;
window.toqueY_global = 0;

function atualizarToqueTouchCanvas(e) {
  const rect = canvas.getBoundingClientRect();

  const toque = (e.touches?.[0]) || (e.changedTouches?.[0]);
  if (!toque) return;

  const x = toque.clientX - rect.left;
  const y = toque.clientY - rect.top;

  const largura = canvas.width / (window.devicePixelRatio || 1);
  const altura = canvas.height / (window.devicePixelRatio || 1);

  window.toqueX_global = x - largura / 2;
  window.toqueY_global = -(y - altura / 2);
}

function substituirVariaveis(texto, variaveis) {
  if (typeof texto !== "string") return texto;

  function substituirSimples(str) {
    return str.replace(/\$([a-zA-Z_]\w*)/g, (_, nome) =>
      nome in variaveis ? `(${JSON.stringify(variaveis[nome])})` : `$${nome}`
    );
  }

  function transformarExpressao(expr) {
    return expr
      .replace(/(\d+)\s*(\d+)/g, "($1).toString()[$2]")
      .replace(/\.comprimento\b/g, ".length")
      .replace(/\bnão\b/g, "!")
      .replace(/\bou\b/g, "||")
      .replace(/\be\b/g, "&&")
      .replace(/≠/g, "!==")
      .replace(/\b([a-zA-Z_]\w*)\b/g, (nome) =>
        nome in variaveis ? `variaveis["${nome}"]` : nome
      );
  }

  const contexto = {
    toqueX: window.toqueX_global || 0,
    toqueY: window.toqueY_global || 0,

    posX: (id) => {
      const caixa = caixasMap.get(id);
      if (!caixa) return 0;
      const centroX = caixa.x + caixa.largura / 2;
      const canvasCentroX = larguraVisual / 2;
      return Math.round(centroX - canvasCentroX);
    },

    posY: (id) => {
      const caixa = caixasMap.get(id);
      if (!caixa) return 0;
      const centroY = caixa.y + caixa.altura / 2;
      const canvasCentroY = alturaVisual / 2;
      return Math.round(canvasCentroY - centroY);
    },

    apontarPara: (idOrigem, idAlvo) => {  
      const a = caixasMap.get(idOrigem);  
      const b = caixasMap.get(idAlvo);  
      if (!a || !b) return 0;  
  
      const ax = a.x + a.largura / 2;  
      const ay = a.y + a.altura / 2;  
      const bx = b.x + b.largura / 2;  
      const by = b.y + b.altura / 2;  
  
      return Math.atan2(by - ay, bx - ax) * 180 / Math.PI;  
    },  

    direcao: (id) => {
      const caixa = caixasMap.get(id);
      return caixa?.direcao || 0;
    },

    aleatorio: (min, max) => {
      min = Number(min);
      max = Number(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    colisao,
    variaveis
  };

  function avaliarExpressao(expr) {
    try {
      return Function("with(this) { return " + expr + "}").call(contexto);
    } catch {
      return null;
    }
  }

  texto = texto.replace(/\$\{([^\}]+)\}/g, (_, exprOriginal) => {
    const expr = transformarExpressao(substituirSimples(exprOriginal));
    const resultado = avaliarExpressao(expr);
    return resultado != null ? resultado : '${' + exprOriginal + '}';
  });

  texto = texto.replace(/\$([a-zA-Z_]\w*)([^\s]*)/g, (_, nome, resto) => {
    if (!(nome in variaveis)) return `$${nome}${resto}`;
    const expr = transformarExpressao(`(${JSON.stringify(variaveis[nome])})${resto}`);
    const resultado = avaliarExpressao(expr);
    return resultado != null ? resultado : `$${nome}${resto}`;
  });

  if (/^[0-9+\-*/().\s]+$/.test(texto.trim())) {
    const resultado = avaliarExpressao(texto);
    if (resultado != null) return resultado;
  }

  return texto;
}

function colisao(id1, id2) {
  if (Array.isArray(id1) && Array.isArray(id2)) {
    return id1.some(a => id2.some(b => colisao(a, b)));
  }

  if (Array.isArray(id1)) {
    return id1.some(a => colisao(a, id2));
  }

  if (Array.isArray(id2)) {
    return id2.some(b => colisao(id1, b));
  }

  const c1 = caixasMap.get(id1);
  const c2 = caixasMap.get(id2);

  if (!c1 || !c2) return false;

  return !(
    c1.x + c1.largura < c2.x ||
    c1.x > c2.x + c2.largura ||
    c1.y + c1.altura < c2.y ||
    c1.y > c2.y + c2.altura
  );
}

async function executarBlocos(blocos, variaveis = {}, toquesAtivos = []) {

canvas.addEventListener("touchstart", (e) => {
  for (const toque of e.changedTouches) {
    const id = toque.identifier;
    const rect = canvas.getBoundingClientRect();
    const x = toque.clientX - rect.left;
    const y = toque.clientY - rect.top;

    toquesAtivos.push({ id, x, y });

    eventosToqueCanvas.forEach(evento => {
      const caixa = caixasMap.get(evento.id);
      const chave = `tocando_${evento.id}`;

      if (evento.id && caixa && pontoDentroDaCaixa(x, y, caixa)) {
        variaveis[chave] = true;
        executarBlocosInternos([...evento.filhos], variaveis);
      }

      if (!evento.id && evento.qualquerLugar) {
        executarBlocosInternos([...evento.filhos], variaveis);
      }
    });
  }
});

canvas.addEventListener("touchmove", (e) => {
  for (const toque of e.changedTouches) {
    const id = toque.identifier;
    const rect = canvas.getBoundingClientRect();
    const x = toque.clientX - rect.left;
    const y = toque.clientY - rect.top;

    const i = toquesAtivos.findIndex(t => t.id === id);
    if (i !== -1) toquesAtivos[i] = { id, x, y };

    eventosToqueCanvas.forEach(evento => {
      const caixa = caixasMap.get(evento.id);
      const chave = `tocando_${evento.id}`;
      if (!caixa) return;

      variaveis[chave] = toquesAtivos.some(t => pontoDentroDaCaixa(t.x, t.y, caixa));
    });
  }
});

canvas.addEventListener("touchend", (e) => {
  for (const toque of e.changedTouches) {
    const id = toque.identifier;
    const i = toquesAtivos.findIndex(t => t.id === id);
    if (i !== -1) toquesAtivos.splice(i, 1);
  }

  eventosToqueCanvas.forEach(evento => {
    const chave = `tocando_${evento.id}`;
    const caixa = caixasMap.get(evento.id);

    variaveis[chave] = !!(caixa && toquesAtivos.some(t => pontoDentroDaCaixa(t.x, t.y, caixa)));
  });
});

canvas.addEventListener("touchcancel", (e) => {
  for (const toque of e.changedTouches) {
    const id = toque.identifier;
    const i = toquesAtivos.findIndex(t => t.id === id);
    if (i !== -1) toquesAtivos.splice(i, 1);
  }
});

  let i = 0;
  while (i < blocos.length && !mudouCena) {
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

    } else if (bloco.tipo === 'toque') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
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

  const caixa = caixasMap.get(id);
  if (caixa) {
    variaveis[`tocando_${id}`] = false;

    eventosToqueCanvas.push({
      id,
      filhos
    });
  }

  i++;
  continue;
} else if (bloco.tipo === 'toqueNaTela') {
  const filhos = [];
  let profundidade = 1;
  i++;

  while (i < blocos.length) {
    const proximo = blocos[i];
    if (proximo.tipo === 'toqueNaTela') profundidade++;
    if (proximo.tipo === 'fimToqueNaTela') {
      profundidade--;
      if (profundidade === 0) break;
    }
    filhos.push(proximo);
    i++;
  }

  eventosToqueCanvas.push({
    id: null,
    filhos,
    qualquerLugar: true
  });

  i++;
  continue;
} else if (bloco.tipo === 'aoCriarClone') {
  const filhos = [];
  let profundidade = 1;
  i++;

  while (i < blocos.length) {
    const proximo = blocos[i];
    if (proximo.tipo === 'aoCriarClone') profundidade++;
    if (proximo.tipo === 'fimAoCriarClone') {
      profundidade--;
      if (profundidade === 0) break;
    }
    filhos.push(proximo);
    i++;
  }

  const idOrigem = substituirVariaveis(bloco.idElemento, variaveis);
  if (idOrigem) {
    eventosCloneCanvas.push({
      idOrigem,
      filhos
    });
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

  const larguraCaixa = 100;
  const alturaCaixa = 100;

  const x = (larguraVisual - larguraCaixa) / 2;
  const y = (alturaVisual - alturaCaixa) / 2;

  if (!caixasMap.has(id)) {
    const novaCaixa = {
      id,
      cor: cor || 'gray',
      x,
      y,
      largura: larguraCaixa,
      altura: alturaCaixa,
      raio: 0,
      camada: 0,
      visivel: true,
      fixo: false,
      opacidade: 1
    };
    caixasCanvas.push(novaCaixa);
    caixasMap.set(id, novaCaixa);
  }
} else if (bloco.tipo === 'cor') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const novaCor = substituirVariaveis(bloco.valor, variaveis);

  const caixa = caixasMap.get(id);
  if (caixa) {
    caixa.cor = novaCor;
  }
} else if (bloco.tipo === 'border') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const novoRaio = parseInt(substituirVariaveis(bloco.valor, variaveis)) || 0;

  const caixa = caixasMap.get(id); // ⬅️ acesso direto com Map
  if (caixa) {
    caixa.raio = novoRaio;
  }
} else if (bloco.tipo === 'transparencia') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const valor = parseFloat(substituirVariaveis(bloco.valor, variaveis));

  const caixa = caixasMap.get(id);
  if (caixa && !isNaN(valor)) {
    caixa.opacidade = Math.max(0, Math.min(1, valor / 100));
  }
} else if (bloco.tipo === 'esperar') {
  const tempo = substituirVariaveis(bloco.valor, variaveis);
  const segundos = parseFloat(tempo);

  if (!isNaN(segundos)) {
    const inicio = performance.now();
    const fim = inicio + segundos * 1000;

    while (performance.now() < fim) {
      await new Promise(r => requestAnimationFrame(r));
    }
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
    const avaliado = eval(itensTexto);
    if (Array.isArray(avaliado)) {
      lista = avaliado;
    } else {
      lista = itensTexto.split(",").map(e => e.trim());
    }
  } catch {
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

} else if (bloco.tipo === 'removerItemLista') {
  const nome = substituirVariaveis(bloco.nomeLista, variaveis);
  let item = substituirVariaveis(bloco.valoresLista, variaveis);

  if (!Array.isArray(variaveis[nome])) {
    console.warn(`A lista '${nome}' não existe.`);
    return;
  }

  const lista = variaveis[nome];
  if (!isNaN(item)) {
    const indice = parseInt(item);
    if (indice >= 0 && indice < lista.length) {
      lista.splice(indice, 1);
    }
  } else {
    const index = lista.indexOf(item);
    if (index !== -1) {
      lista.splice(index, 1);
    }
  }

} else if (bloco.tipo === 'limparLista') {
  const nome = substituirVariaveis(bloco.nomeLista, variaveis);

  if (!Array.isArray(variaveis[nome])) {
    return;
  }

  variaveis[nome].length = 0;
} else if (bloco.tipo === 'texto') {
  const idBruto = bloco.idElemento;
  const id = substituirVariaveis(idBruto, variaveis);
  const valor = substituirVariaveis(bloco.valor, variaveis);

  const larguraVisual = canvas.width / (window.devicePixelRatio || 1);
  const alturaVisual = canvas.height / (window.devicePixelRatio || 1);

  const x = larguraVisual / 2;
  const y = alturaVisual / 2;

  let texto = textosMap.get(id);
  if (!texto) {
    texto = {
      id,
      valor,
      x,
      y,
      cor: 'black',
      fonte: '20px sans-serif',
      alinhamento: 'center',
      camada: 0,
      visivel: true,
      fixo: false
    };
    textosCanvas.push(texto);
    textosMap.set(id, texto);
  } else {
    texto.valor = valor;
  }
} else if (bloco.tipo === 'fonteTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const fonteNome = substituirVariaveis(bloco.valor, variaveis);
  const texto = textosMap.get(id);

  if (texto && fonteNome) {
    const tamanhoAtual = texto.fonte.match(/\d+px/)?.[0] || '20px';
    texto.fonte = `${tamanhoAtual} ${fonteNome}`;
  }

} else if (bloco.tipo === 'tamanhoFonte') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const tamanho = substituirVariaveis(bloco.valor, variaveis);
  const texto = textosMap.get(id);

  if (texto && tamanho) {
    const fonteAtual = texto.fonte.split(' ').slice(1).join(' ') || 'sans-serif';
    texto.fonte = `${tamanho} ${fonteAtual}`;
  }

} else if (bloco.tipo === 'corTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const cor = substituirVariaveis(bloco.valor, variaveis);
  const texto = textosMap.get(id);

  if (texto && cor) {
    texto.cor = cor;
  }
} else if (bloco.tipo === 'posicionarCaixa') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const x = parseFloat(substituirVariaveis(bloco.posicaoX, variaveis));
  const y = parseFloat(substituirVariaveis(bloco.posicaoY, variaveis));
  const caixa = caixasMap.get(id);

  if (caixa && !isNaN(x) && !isNaN(y)) {
    caixa.x = larguraVisual / 2 + x - caixa.largura / 2;
    caixa.y = alturaVisual / 2 - y - caixa.altura / 2;
  }
} else if (bloco.tipo === 'posicionarTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const x = parseFloat(substituirVariaveis(bloco.posicaoX, variaveis));
  const y = parseFloat(substituirVariaveis(bloco.posicaoY, variaveis));
  const texto = textosMap.get(id);

  if (texto && !isNaN(x) && !isNaN(y)) {
    texto.x = larguraVisual / 2 + x;
    texto.y = alturaVisual / 2 - y;
  }
} else if (bloco.tipo === 'textura') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const nomeImagem = substituirVariaveis(bloco.valor, variaveis);
  const caixa = caixasMap.get(id);

  if (caixa && nomeImagem) {
    const src = carregarImagemPorNome(nomeImagem); // sem passar id
    if (src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        caixa.textura = img;
      };
    }
  }

} else if (bloco.tipo === 'criarAnimacao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const nomes = substituirVariaveis(bloco.valorImagens, variaveis); // nomes separados por vírgula
  const velocidade = parseInt(substituirVariaveis(bloco.valorVelocidade, variaveis));
  const caixa = caixasMap.get(id);

  if (caixa) {
    const nomesArray = nomes.split(',').map(n => n.trim());
    const imagens = nomesArray.map(nome => {
      const src = carregarImagemPorNome(nome);
      const img = new Image();
      img.src = src;
      return img;
    });

    caixa.animacao = {
      frames: imagens,
      velocidade,
      indice: 0,
      contador: 0
    };
  }

} else if (bloco.tipo === 'pararAnimacao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);
  if (caixa?.animacao) {
    caixa.animacao.pausado = true;
  }

} else if (bloco.tipo === 'continuarAnimacao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);
  if (caixa?.animacao) {
    caixa.animacao.pausado = false;
  }
} else if (bloco.tipo === 'gravidade') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const aceleracaoOriginal = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 0;

  const caixa = caixasMap.get(id);
  if (caixa) {
    if (typeof caixa.vy !== "number") caixa.vy = 0;
    caixa.vy -= aceleracaoOriginal;
  }
} else if (bloco.tipo === 'pular') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const forcaOriginal = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 0;

  const caixa = caixasMap.get(id);
  if (caixa) {
    if (typeof caixa.vy !== "number") caixa.vy = 0;
    caixa.vy = -forcaOriginal;
  }
} else if (bloco.tipo === 'colisaoSolida') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const idAlvo = substituirVariaveis(bloco.idAlvo, variaveis);

  const caixa = caixasMap.get(id);
  const alvo = caixasMap.get(idAlvo);

  if (!caixa || !alvo) return;

  if (colisao(id, idAlvo)) {
    const sobreX = Math.min(caixa.x + caixa.largura, alvo.x + alvo.largura) - Math.max(caixa.x, alvo.x);
    const sobreY = Math.min(caixa.y + caixa.altura, alvo.y + alvo.altura) - Math.max(caixa.y, alvo.y);

    if (sobreX < sobreY) {
      if (caixa.x < alvo.x) {
        caixa.x = alvo.x - caixa.largura;
      } else {
        caixa.x = alvo.x + alvo.largura;
      }
    } else {
      if (caixa.y < alvo.y) {
        caixa.y = alvo.y - caixa.altura;

      } else {
        caixa.y = alvo.y + alvo.altura;
      }

      if (typeof caixa.vy === "number") {
        caixa.vy = 0;
      }
    }
  }
} else if (bloco.tipo === 'mover') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const valorBruto = substituirVariaveis(bloco.valor, variaveis);
  const valor = parseFloat(valorBruto);

  if (!id || isNaN(valor) || valor === 0) return;

  const caixa = caixasMap.get(id);
  if (!caixa) return;

  // Cache de seno/cosseno para direção, evita recalcular sempre
  if (typeof caixa._cos === "undefined" || caixa._direcaoCache !== caixa.direcao) {
    const anguloRad = (caixa.direcao ?? 0) * (Math.PI / 180);
    caixa._cos = Math.cos(anguloRad);
    caixa._sin = Math.sin(anguloRad);
    caixa._direcaoCache = caixa.direcao;
  }

  caixa.x += caixa._cos * valor;
  caixa.y += caixa._sin * valor;
} else if (bloco.tipo === 'direcao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const valor = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 0;

  const caixa = caixasMap.get(id);
  const texto = textosMap.get(id);

  if (caixa) {
    caixa.direcao = valor;

    // ❌ Limpa cache de seno/cosseno da direção
    delete caixa._cos;
    delete caixa._sin;
    delete caixa._direcaoCache;
  }

  if (texto) texto.direcao = valor;

  variaveis[`direcao_${id}`] = valor;
} else if (bloco.tipo === 'tamanho') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const novaLargura = parseInt(substituirVariaveis(bloco.larguraElemento, variaveis));
  const novaAltura = parseInt(substituirVariaveis(bloco.alturaElemento, variaveis));

  const caixa = caixasMap.get(id);
  if (caixa) {
    const centroX = caixa.x + caixa.largura / 2;
    const centroY = caixa.y + caixa.altura / 2;

    if (!isNaN(novaLargura)) caixa.largura = novaLargura;
    if (!isNaN(novaAltura)) caixa.altura = novaAltura;

    caixa.x = centroX - caixa.largura / 2;
    caixa.y = centroY - caixa.altura / 2;
  }
} else if (bloco.tipo === 'camada') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const z = parseInt(substituirVariaveis(bloco.valor, variaveis));

  const caixa = caixasMap.get(id);
  if (caixa && !isNaN(z)) {
    caixa.camada = z;
  }

} else if (bloco.tipo === 'mostrar') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);
  const texto = textosMap.get(id);

  if (caixa) caixa.visivel = true;
  if (texto) texto.visivel = true;

} else if (bloco.tipo === 'esconder') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);
  const texto = textosMap.get(id);

  if (caixa) caixa.visivel = false;
  if (texto) texto.visivel = false;
} else if (bloco.tipo === 'remover') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);

  if (caixa) {
    const index = caixasCanvas.indexOf(caixa);
    if (index !== -1) caixasCanvas.splice(index, 1);

    if (caixa.usando) {
      caixa.usando = false;
      caixa.visivel = false;
    }

    caixasMap.delete(id);
  }

  const texto = textosMap.get(id);
  if (texto) {
    const index = textosCanvas.indexOf(texto);
    if (index !== -1) textosCanvas.splice(index, 1);
    textosMap.delete(id);
  }
} else if (bloco.tipo === 'camera') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  if (caixasMap.has(id)) {
    cameraAlvoId = id;
  }

} else if (bloco.tipo === 'fixarCaixa') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);
  const texto = textosMap.get(id);

  if (caixa) caixa.fixo = true;
  if (texto) texto.fixo = true;

} else if (bloco.tipo === 'suavidadeCamera') {
  const valor = parseFloat(substituirVariaveis(bloco.valor, variaveis));
  if (!isNaN(valor) && valor >= 0 && valor <= 1) {
    suavidadeCamera = valor;
  }
} else if (bloco.tipo === 'mudarCena') {
  const novaCena = substituirVariaveis(bloco.idElemento, variaveis);
  const projeto = localStorage.getItem("projetoSelecionado");
  if (!projeto || !novaCena) return;

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena") || "{}");
  const dadosDaCena = blocosPorCena[projeto]?.[novaCena];
  if (!dadosDaCena) return;

  mudouCena = true;

  localStorage.setItem("blocosParaExecucao", JSON.stringify({
    [projeto]: {
      [novaCena]: dadosDaCena
    }
  }));

  const fade = document.getElementById("fadePreto");
  if (fade) {
    fade.style.pointerEvents = "auto";
    fade.style.opacity = "1";

    setTimeout(() => {
      location.replace("ExecutandoJogo.html");
    }, 500);
  } else {
    location.replace("ExecutandoJogo.html");
  }

  return;
} else if (bloco.tipo === 'orientacao') {
  const modo = substituirVariaveis(bloco.valor, variaveis).toLowerCase();
  if ((modo === 'paisagem' || modo === 'retrato') &&
      window.AndroidInterface?.changeOrientation instanceof Function) {
    const orientacao = modo === 'paisagem' ? 'landscape' : 'portrait';
    AndroidInterface.changeOrientation(orientacao);
  }
} else if (bloco.tipo === 'clonar') {
  const idOriginal = substituirVariaveis(bloco.idElemento, variaveis);
  const base = idOriginal + '_clone';

  if (!contadorClones[base]) contadorClones[base] = 1;

  const novoId = `${base}_${contadorClones[base]++}`;
  const original = caixasMap.get(idOriginal);

  if (original) {
    let clone = obterCloneDisponivel(base);

    if (!clone) {
      if (!poolClones[base]) poolClones[base] = [];

      clone = {
        id: novoId,
        cor: original.cor,
        x: original.x,
        y: original.y,
        largura: original.largura,
        altura: original.altura,
        raio: original.raio,
        camada: original.camada,
        visivel: true,
        fixo: original.fixo,
        opacidade: original.opacidade,
        direcao: original.direcao,
        vx: original.vx ?? 0,
        vy: original.vy ?? 0,
        textura: original.textura ?? null,
        animacao: original.animacao ? {
          frames: original.animacao.frames,
          velocidade: original.animacao.velocidade,
          indice: 0,
          contador: 0,
          pausado: original.animacao.pausado ?? false
        } : undefined,
        usando: true
      };

      poolClones[base].push(clone);
    } else {
      clone.id = novoId;
      clone.x = original.x;
      clone.y = original.y;
      clone.vx = original.vx ?? 0;
      clone.vy = original.vy ?? 0;
      clone.direcao = original.direcao;
      clone.visivel = true;
      clone.opacidade = original.opacidade;
      clone.fixo = original.fixo;
      clone.cor = original.cor;
      clone.largura = original.largura;
      clone.altura = original.altura;
      clone.raio = original.raio;
      clone.camada = original.camada;
      clone.textura = original.textura ?? null;
      clone.animacao = original.animacao ? {
        frames: original.animacao.frames,
        velocidade: original.animacao.velocidade,
        indice: 0,
        contador: 0,
        pausado: original.animacao.pausado ?? false
      } : undefined;
      clone.usando = true;
    }

    if (!caixasCanvas.includes(clone)) {
      caixasCanvas.push(clone);
    }

    caixasMap.set(novoId, clone);

    for (const evento of eventosCloneCanvas) {
      if (!evento.idOrigem || evento.idOrigem === idOriginal) {
        const variaveisClone = { ...variaveis, ultimoClone: novoId };
        executarBlocosInternos([...evento.filhos], variaveisClone);
      }
    }
  }
} else if (bloco.tipo === 'carimbo') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasMap.get(id);
  if (!caixa) return;

  ctxCarimbos.setTransform(1, 0, 0, 1, 0, 0);

  const x = caixa.fixo ? caixa.x : caixa.x - cameraOffsetX;
  const y = caixa.fixo ? caixa.y : caixa.y - cameraOffsetY;

  ctxCarimbos.save();
  ctxCarimbos.globalAlpha = Math.max(0, Math.min(1, caixa.opacidade ?? 1));

  const cx = x + caixa.largura / 2;
  const cy = y + caixa.altura / 2;
  ctxCarimbos.translate(cx, cy);

  const angulo = (caixa.direcao || 0) * Math.PI / 180;
  ctxCarimbos.rotate(angulo);

  const dx = -caixa.largura / 2;
  const dy = -caixa.altura / 2;

  if (caixa.textura instanceof Image) {
    ctxCarimbos.drawImage(caixa.textura, dx, dy, caixa.largura, caixa.altura);
  } else {
    desenharCaixaArredondada(
      ctxCarimbos,
      dx,
      dy,
      caixa.largura,
      caixa.altura,
      caixa.raio || 0,
      caixa.cor || 'gray'
    );
  }

  ctxCarimbos.restore();
} else if (bloco.tipo === 'limparCarimbos') {
  ctxCarimbos.clearRect(0, 0, canvasCarimbos.width, canvasCarimbos.height);
} else if (bloco.tipo === 'efeito') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const efeito = substituirVariaveis(bloco.valor, variaveis)?.toLowerCase();
  const caixa = caixasMap.get(id);
  if (!caixa || !efeito) return;

  const valor = 10;

  if (efeito === "fantasma") {
    const opacidadeAtual = typeof caixa.opacidade === "number" ? caixa.opacidade : 1;
    let fantasmaAtual = 100 - (opacidadeAtual * 100);
    fantasmaAtual = Math.min(100, Math.max(0, fantasmaAtual + valor));
    caixa.opacidade = Math.max(0, 1 - (fantasmaAtual / 100));
  } else {
    if (!caixa.filtrosExtras) caixa.filtrosExtras = {};
    const atual = parseFloat(caixa.filtrosExtras[efeito]) || 0;
    caixa.filtrosExtras[efeito] = atual + valor;

    const filtros = Object.entries(caixa.filtrosExtras).map(([nome, v]) => {
      switch (nome) {
        case "blur":
          return `blur(${v}px)`;
        case "brightness":
          return `brightness(${v})`;
        case "saturate":
        case "saturation":
          return `saturate(${v})`;
        default:
          return "";
      }
    });

    caixa.filtro = filtros.join(" ");
  }
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

  while (true) {
    const condicao = substituirVariaveis(bloco.condicao, variaveis);
    try {
      if (eval(condicao)) break;
    } catch (e) {
      break;
    }
    await executarBlocosInternos([...filhos], variaveis);
    await new Promise(r => requestAnimationFrame(r));
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

  while (true) {
    await executarBlocosInternos([...filhos], variaveis);
    await new Promise(r => requestAnimationFrame(r));
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

  for (let contador = 0; contador < vezes; contador++) {
    await executarBlocosInternos([...filhos], variaveis);
    await new Promise(r => requestAnimationFrame(r));
         }
      }
   i++;
   }
}

let larguraAnterior = window.innerWidth;
let alturaAnterior = window.innerHeight;

window.addEventListener("resize", () => {
  setTimeout(() => {
    if (
      window.innerWidth !== larguraAnterior ||
      window.innerHeight !== alturaAnterior
    ) {
      larguraAnterior = window.innerWidth;
      alturaAnterior = window.innerHeight;
      ajustarTamanhoCanvas();
    }
  }, 100);
});

window.onload = async () => {
  const orientacao = obterOrientacaoProjetoAtual();

  if (orientacao && window.AndroidInterface && AndroidInterface.changeOrientation) {
    AndroidInterface.changeOrientation(orientacao);
    await esperarRotacaoEstabilizar(); // espera a rotação concluir
  }

  ajustarTamanhoCanvas(); // aplica o tamanho certo após rotação

  // Eventos de toque (já ajustados ao canvas novo)
  canvas.addEventListener("touchstart", atualizarToqueTouchCanvas);
  canvas.addEventListener("touchmove", atualizarToqueTouchCanvas);  

  // Fade de entrada
  const fade = document.getElementById("fadePreto");
  if (fade) {
    setTimeout(() => {
      fade.style.opacity = "0";
    }, 50);
  }

  // Carregamento dos blocos da cena atual
  const dados = JSON.parse(localStorage.getItem("blocosParaExecucao")) || {};
  const projeto = localStorage.getItem("projetoSelecionado");
  if (!projeto || !dados[projeto]) return;

  const cenas = Object.keys(dados[projeto]);
  if (cenas.length === 0) return;

  const cenaParaExecutar = cenas[0];
  const objetosDaCena = dados[projeto][cenaParaExecutar];

  for (const objeto in objetosDaCena) {
    const blocos = objetosDaCena[objeto];
    if (Array.isArray(blocos)) {
      await executarBlocos(blocos);
    }
  }
};

function desenharCaixasCanvas(ctx, offsetX = 0, offsetY = 0) {
  caixasCanvas
    .slice()
    .sort((a, b) => (a.camada || 0) - (b.camada || 0))
    .forEach(caixa => {
      if (!caixa?.visivel) return;

      const x = caixa.fixo ? caixa.x : caixa.x - offsetX;
      const y = caixa.fixo ? caixa.y : caixa.y - offsetY;

      // 🧠 Pula se estiver fora da tela
      if (
        x + caixa.largura < 0 || x > larguraVisual ||
        y + caixa.altura < 0 || y > alturaVisual
      ) {
        return;
      }

      const alpha = Math.max(0, Math.min(1, caixa.opacidade ?? 1));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = caixa.filtro || "none";

      const cx = x + caixa.largura / 2;
      const cy = y + caixa.altura / 2;
      ctx.translate(cx, cy);

      const angulo = (caixa.direcao || 0) * Math.PI / 180;
      ctx.rotate(angulo);

      const dx = -caixa.largura / 2;
      const dy = -caixa.altura / 2;

      // 🎞️ Animação com frames
      if (caixa.animacao?.frames?.length) {
        const anim = caixa.animacao;

        if (!anim.pausado) {
          anim.contador = (anim.contador || 0) + 1;
          if (anim.contador >= anim.velocidade) {
            anim.contador = 0;
            anim.indice = (anim.indice + 1) % anim.frames.length;
          }
        }

        const frameAtual = anim.frames[anim.indice];
        if (frameAtual?.complete) {
          ctx.drawImage(frameAtual, dx, dy, caixa.largura, caixa.altura);
          ctx.restore();
          return;
        }
      }

      // 🖼️ Textura estática ou caixa arredondada
      if (caixa.textura instanceof Image) {
        ctx.drawImage(caixa.textura, dx, dy, caixa.largura, caixa.altura);
      } else {
        desenharCaixaArredondada(
          ctx,
          dx,
          dy,
          caixa.largura,
          caixa.altura,
          caixa.raio || 0,
          caixa.cor || 'gray'
        );
      }

      ctx.restore();
      ctx.filter = "none";
    });
}

function desenharTextosCanvas(ctx, offsetX = 0, offsetY = 0) {
  textosCanvas
    .filter(texto => texto.visivel !== false)
    .sort((a, b) => (a.camada || 0) - (b.camada || 0))
    .forEach(texto => {
      const { fixo, x: tx, y: ty, cor, fonte, alinhamento, valor, direcao } = texto;

      const x = fixo ? tx : tx - offsetX;
      const y = fixo ? ty : ty - offsetY;

      ctx.save();
      ctx.translate(x, y);

      const angulo = (direcao || 0) * Math.PI / 180;
      ctx.rotate(angulo);

      ctx.fillStyle = cor;
      ctx.font = fonte;
      ctx.textAlign = alinhamento;
      ctx.textBaseline = "middle";
      ctx.fillText(valor, 0, 0);

      ctx.restore();
    });
}

function desenharCaixaArredondada(ctx, x, y, w, h, r, cor) {
  r = Math.max(0, Math.min(r, Math.min(w / 2, h / 2)));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (typeof cor === "string" && cor.includes(",")) {
    let tipo = "horizontal";
    let coresString = cor;

    if (cor.includes(":")) {
      const partes = cor.split(":");
      tipo = partes[0].trim().toLowerCase();
      coresString = partes.slice(1).join(":"); // permite cores com :
    }

    const cores = coresString.split(",").map(c => c.trim());

    let grad;

    if (tipo.startsWith("diagonal")) {
      // Exemplo: diagonal45
      // Pega o número depois de 'diagonal'
      const anguloStr = tipo.slice(8);
      const angulo = parseFloat(anguloStr) || 45; // padrão 45 graus

      // Calcula ponto inicial e final do degradê baseado no ângulo
      // Usa trigonometria para posição no retângulo (x,y,w,h)
      const rad = (angulo * Math.PI) / 180;

      const x1 = x + w / 2 - (Math.cos(rad) * w) / 2;
      const y1 = y + h / 2 - (Math.sin(rad) * h) / 2;

      const x2 = x + w / 2 + (Math.cos(rad) * w) / 2;
      const y2 = y + h / 2 + (Math.sin(rad) * h) / 2;

      grad = ctx.createLinearGradient(x1, y1, x2, y2);

    } else if (tipo === "vertical") {
      grad = ctx.createLinearGradient(x, y, x, y + h);

    } else if (tipo === "radial") {
      grad = ctx.createRadialGradient(
        x + w / 2,
        y + h / 2,
        0,
        x + w / 2,
        y + h / 2,
        Math.max(w, h) / 2
      );

    } else {
      // horizontal padrão
      grad = ctx.createLinearGradient(x, y, x + w, y);
    }

    const passo = 1 / (cores.length - 1);
    cores.forEach((cor, i) => grad.addColorStop(i * passo, cor));

    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = cor || "gray";
  }

  ctx.fill();
}

function pontoDentroDaCaixa(x, y, caixa) {
  const caixaX = caixa.fixo ? caixa.x : caixa.x - cameraOffsetX;
  const caixaY = caixa.fixo ? caixa.y : caixa.y - cameraOffsetY;

  return (
    x >= caixaX &&
    x <= caixaX + caixa.largura &&
    y >= caixaY &&
    y <= caixaY + caixa.altura
  );
}

function carregarImagemPorNome(nomeImagem) {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const chave = `imagens_${projeto}_${cena}`;

  try {
    const imagens = JSON.parse(localStorage.getItem(chave)) || [];
    const imagem = imagens.find(img => img.nome === nomeImagem);
    return imagem ? imagem.src : null;
  } catch {
    return null;
  }
}

let fps = 0;
let frames = 0;
let tempoUltimoFPS = performance.now();

let ultimoFrame = performance.now();

function loop() {
  const agora = performance.now();
  const delta = agora - ultimoFrame;
  ultimoFrame = agora;

  frames++;
  if (agora - tempoUltimoFPS >= 1000) {
    fps = frames;
    frames = 0;
    tempoUltimoFPS = agora;
  }

  // 🧼 Limpa o canvas principal
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 🖌️ Desenha os carimbos fixos otimizados
  ctx.drawImage(canvasCarimbos, 0, 0);

  // 🎥 Atualiza a câmera, se tiver um alvo
  if (cameraAlvoId) {
    const alvo = caixasMap.get(cameraAlvoId);
    if (alvo) {
      const alvoX = alvo.x + alvo.largura / 2 - larguraVisual / 2;
      const alvoY = alvo.y + alvo.altura / 2 - alturaVisual / 2;

      cameraOffsetX += (alvoX - cameraOffsetX) * suavidadeCamera;
      cameraOffsetY += (alvoY - cameraOffsetY) * suavidadeCamera;
    }
  }
     for (const caixa of caixasCanvas) {
  if (typeof caixa.vx === "number") caixa.x += caixa.vx;
  if (typeof caixa.vy === "number") caixa.y += caixa.vy;
     }

  // 🧱 Desenha as caixas e textos
  desenharCaixasCanvas(ctx, cameraOffsetX, cameraOffsetY);
  desenharTextosCanvas(ctx, cameraOffsetX, cameraOffsetY);

  // ⏱️ Desenha o FPS com estilo bonito usando sua função personalizada
ctx.save();

ctx.globalAlpha = 0.6;

const textoFPS = `FPS: ${fps}`;
ctx.font = "18px 'Orbitron', sans-serif";
const paddingHorizontal = 20;
const paddingVertical = 12;

const larguraTexto = ctx.measureText(textoFPS).width;
const fpsBoxW = larguraTexto + paddingHorizontal;
const fpsBoxH = 32;
const fpsBoxX = 10;
const fpsBoxY = 10;

desenharCaixaArredondada(ctx, fpsBoxX, fpsBoxY, fpsBoxW, fpsBoxH, 10, "#000");

ctx.globalAlpha = 1;
ctx.fillStyle = "#00ff88";
ctx.shadowColor = "#000";
ctx.shadowBlur = 4;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

const centerX = fpsBoxX + fpsBoxW / 2;
const centerY = fpsBoxY + fpsBoxH / 2;

ctx.fillText(textoFPS, centerX, centerY);

ctx.restore();

  // 🔁 Próximo frame
  requestAnimationFrame(loop);
}

loop();

function obterCloneDisponivel(base) {
  if (!poolClones[base]) return null;

  for (const clone of poolClones[base]) {
    if (!clone.usando) {
      return clone;
    }
  }

  return null;
}
