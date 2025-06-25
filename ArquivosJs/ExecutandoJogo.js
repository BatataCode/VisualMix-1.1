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
          ajustarTamanhoCanvas(); // já faz o ajuste certo
          resolve();
        }, 200); // Espera 200ms após estabilizar
      } else {
        setTimeout(checar, delay);
      }
    };

    checar();
  });
}

const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");

let larguraVisual = window.innerWidth;
let alturaVisual = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

function ajustarTamanhoCanvas() {
  // Salva o centro visual do mundo ANTES de mudar o tamanho
  const centroVisualX = cameraOffsetX + larguraVisual / 2;
  const centroVisualY = cameraOffsetY + alturaVisual / 2;

  // Atualiza tamanho
  dpr = window.devicePixelRatio || 1;
  larguraVisual = window.innerWidth;
  alturaVisual = window.innerHeight;

  canvas.width = larguraVisual * dpr;
  canvas.height = alturaVisual * dpr;

  canvas.style.width = larguraVisual + "px";
  canvas.style.height = alturaVisual + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // Reposiciona a câmera para manter o centro visual fixo
  cameraOffsetX = centroVisualX - larguraVisual / 2;
  cameraOffsetY = centroVisualY - alturaVisual / 2;
}

const  caixasCanvas = [];
const textosCanvas = [];
const eventosToqueCanvas = [];
let cameraAlvoId = null;
let cameraOffsetX = 0;
let cameraOffsetY = 0;
let suavidadeCamera = 0.05;
let mudouCena = false;

window.toqueX_global = 0;
window.toqueY_global = 0;

function atualizarToqueTouchCanvas(e) {
  const canvasRect = canvas.getBoundingClientRect();

  let toque;
  if (e.touches && e.touches.length > 0) {
    toque = e.touches[0];
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    toque = e.changedTouches[0];
  } else {
    return;
  }

  const x = toque.clientX - canvasRect.left;
  const y = toque.clientY - canvasRect.top;

  const larguraCanvas = canvas.width / (window.devicePixelRatio || 1);
  const alturaCanvas = canvas.height / (window.devicePixelRatio || 1);

  window.toqueX_global = x - larguraCanvas / 2;
  window.toqueY_global = -(y - alturaCanvas / 2);
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
      const caixa = caixasCanvas.find(c => c.id === id);
      if (!caixa) return 0;
      const centroX = caixa.x + caixa.largura / 2;
      const canvasCentroX = larguraVisual / 2;
      return Math.round(centroX - canvasCentroX);
    },

    posY: (id) => {
      const caixa = caixasCanvas.find(c => c.id === id);
      if (!caixa) return 0;
      const centroY = caixa.y + caixa.altura / 2;
      const canvasCentroY = alturaVisual / 2;
      return Math.round(canvasCentroY - centroY);
    },

    aleatorio: (min, max) => {
      min = Number(min);
      max = Number(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    colisao,
    variaveis
  };

  texto = texto.replace(/\$\{([^\}]+)\}/g, (_, exprOriginal) => {
    try {
      const expr = transformarExpressao(substituirSimples(exprOriginal));
      return Function("with(this) { return " + expr + "}").call(contexto);
    } catch {
      return '${' + exprOriginal + '}';
    }
  });

  texto = texto.replace(/\$([a-zA-Z_]\w*)([^\s]*)/g, (_, nome, resto) => {
    if (!(nome in variaveis)) return `$${nome}${resto}`;
    try {
      const expr = transformarExpressao(`(${JSON.stringify(variaveis[nome])})${resto}`);
      return Function("with(this) { return " + expr + "}").call(contexto);
    } catch {
      return `$${nome}${resto}`;
    }
  });

  if (/^[0-9+\-*/().\s]+$/.test(texto.trim())) {
    try {
      return Function("with(this) { return " + texto + "}").call(contexto);
    } catch {
      return texto;
    }
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

  const c1 = caixasCanvas.find(c => c.id === id1);
  const c2 = caixasCanvas.find(c => c.id === id2);

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
        const caixa = caixasCanvas.find(c => c.id === evento.id);
        const chave = `toque_${evento.id}`;

        if (caixa && pontoDentroDaCaixa(x, y, caixa)) {
          variaveis[chave] = true;
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
        const caixa = caixasCanvas.find(c => c.id === evento.id);
        const chave = `toque_${evento.id}`;
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
      const chave = `toque_${evento.id}`;
      variaveis[chave] = toquesAtivos.some(t => {
        const caixa = caixasCanvas.find(c => c.id === evento.id);
        return caixa && pontoDentroDaCaixa(t.x, t.y, caixa);
      });
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

      const caixa = caixasCanvas.find(c => c.id === id);
      if (caixa) {
        variaveis[`toque_${id}`] = false;

        eventosToqueCanvas.push({
          id,
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

if (!caixasCanvas.some(c => c.id === id)) {
  caixasCanvas.push({
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
    });
  }
} else if (bloco.tipo === 'cor') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const novaCor = substituirVariaveis(bloco.valor, variaveis);

  const caixa = caixasCanvas.find(c => c.id === id);
  if (caixa) {
    caixa.cor = novaCor;
  }
} else if (bloco.tipo === 'border') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const novoRaio = parseInt(substituirVariaveis(bloco.valor, variaveis)) || 0;

  const caixa = caixasCanvas.find(c => c.id === id);
  if (caixa) {
    caixa.raio = novoRaio;
  }
} else if (bloco.tipo === 'transparencia') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const valor = parseFloat(substituirVariaveis(bloco.valor, variaveis));

  const caixa = caixasCanvas.find(c => c.id === id);
  if (caixa && !isNaN(valor)) {
    caixa.opacidade = Math.max(0, Math.min(1, valor / 100));
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
    console.warn(`A lista '${nome}' não existe ou não é uma lista.`);
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

  if (!textosCanvas.some(t => t.id === id)) {
    textosCanvas.push({
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
    });
  } else {
    const texto = textosCanvas.find(t => t.id === id);
    if (texto) texto.valor = valor;
  }
} else if (bloco.tipo === 'fonteTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const fonteNome = substituirVariaveis(bloco.valor, variaveis);
  const texto = textosCanvas.find(t => t.id === id);

  if (texto && fonteNome) {
    const tamanhoAtual = texto.fonte.match(/\d+px/)?.[0] || '20px';
    texto.fonte = `${tamanhoAtual} ${fonteNome}`;
  }
} else if (bloco.tipo === 'tamanhoFonte') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const tamanho = substituirVariaveis(bloco.valor, variaveis);
  const texto = textosCanvas.find(t => t.id === id);

  if (texto && tamanho) {
    const fonteAtual = texto.fonte.split(' ').slice(1).join(' ') || 'sans-serif';
    texto.fonte = `${tamanho} ${fonteAtual}`;
  }
} else if (bloco.tipo === 'corTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const cor = substituirVariaveis(bloco.valor, variaveis);
  const texto = textosCanvas.find(t => t.id === id);

  if (texto && cor) {
    texto.cor = cor;
  }
} else if (bloco.tipo === 'posicionarCaixa') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const x = parseFloat(substituirVariaveis(bloco.posicaoX, variaveis));
  const y = parseFloat(substituirVariaveis(bloco.posicaoY, variaveis));
  const caixa = caixasCanvas.find(c => c.id === id);

  if (caixa && !isNaN(x) && !isNaN(y)) {
    const larguraVisual = canvas.width / (window.devicePixelRatio || 1);
    const alturaVisual = canvas.height / (window.devicePixelRatio || 1);

    caixa.x = larguraVisual / 2 + x - caixa.largura / 2;
    caixa.y = alturaVisual / 2 - y - caixa.altura / 2;
  }
} else if (bloco.tipo === 'posicionarTexto') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const x = parseFloat(substituirVariaveis(bloco.posicaoX, variaveis));
  const y = parseFloat(substituirVariaveis(bloco.posicaoY, variaveis));
  const texto = textosCanvas.find(t => t.id === id);

  if (texto && !isNaN(x) && !isNaN(y)) {
    const larguraVisual = canvas.width / (window.devicePixelRatio || 1);
    const alturaVisual = canvas.height / (window.devicePixelRatio || 1);

    texto.x = larguraVisual / 2 + x;
    texto.y = alturaVisual / 2 - y;
  }
} else if (bloco.tipo === 'textura') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const nomeImagem = substituirVariaveis(bloco.valor, variaveis);
  const caixa = caixasCanvas.find(c => c.id === id);

  if (caixa && nomeImagem) {
    const src = carregarImagemPorNome(nomeImagem); // <- agora sem passar o id

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
  const nomes = substituirVariaveis(bloco.valorImagens, variaveis); // lista de nomes, separados por vírgula
  const velocidade = parseInt(substituirVariaveis(bloco.valorVelocidade, variaveis));

  const caixa = caixasCanvas.find(c => c.id === id);
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
      velocidade,       // número de frames antes de trocar
      indice: 0,
      contador: 0
    };
  }
} else if (bloco.tipo === 'pararAnimacao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasCanvas.find(c => c.id === id);

  if (caixa?.animacao) {
    caixa.animacao.pausado = true; // apenas pausa, não apaga
  }
} else if (bloco.tipo === 'continuarAnimacao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasCanvas.find(c => c.id === id);

  if (caixa?.animacao) {
    caixa.animacao.pausado = false;
  }
} else if (bloco.tipo === 'mover') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const passos = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 0;
  const direcao = parseFloat(variaveis[`direcao_${id}`]) || 90;

  const rad = (Math.PI / 180) * direcao;
  const dx = Math.sin(rad) * passos;
  const dy = -Math.cos(rad) * passos;

  const caixa = caixasCanvas.find(c => c.id === id);
  if (caixa) {
    caixa.x += dx;
    caixa.y += dy;
  }

  const texto = textosCanvas.find(t => t.id === id);
  if (texto) {
    texto.x += dx;
    texto.y += dy;
  }
} else if (bloco.tipo === 'direcao') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const valor = parseFloat(substituirVariaveis(bloco.valor, variaveis)) || 90;
  variaveis[`direcao_${id}`] = valor;
} else if (bloco.tipo === 'tamanho') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const novaLargura = parseInt(substituirVariaveis(bloco.larguraElemento, variaveis));
  const novaAltura = parseInt(substituirVariaveis(bloco.alturaElemento, variaveis));

  const caixa = caixasCanvas.find(c => c.id === id);
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

  const caixa = caixasCanvas.find(c => c.id === id);
  if (caixa && !isNaN(z)) {
    caixa.camada = z;
  }
} else if (bloco.tipo === 'mostrar') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasCanvas.find(c => c.id === id);
  const texto = textosCanvas.find(t => t.id === id);

  if (caixa) caixa.visivel = true;
  if (texto) texto.visivel = true;
}

else if (bloco.tipo === 'esconder') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasCanvas.find(c => c.id === id);
  const texto = textosCanvas.find(t => t.id === id);

  if (caixa) caixa.visivel = false;
  if (texto) texto.visivel = false;
} else if (bloco.tipo === 'remover') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);

  const iCaixa = caixasCanvas.findIndex(c => c.id === id);
  if (iCaixa !== -1) caixasCanvas.splice(iCaixa, 1);

  const iTexto = textosCanvas.findIndex(t => t.id === id);
  if (iTexto !== -1) textosCanvas.splice(iTexto, 1);
} else if (bloco.tipo === 'camera') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  if (caixasCanvas.some(c => c.id === id)) {
    cameraAlvoId = id;
  }
} else if (bloco.tipo === 'fixarCaixa') {
  const id = substituirVariaveis(bloco.idElemento, variaveis);
  const caixa = caixasCanvas.find(c => c.id === id);
  const texto = textosCanvas.find(t => t.id === id);
  
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

  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};
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
    fade.style.opacity = "1"; // faz escurecer

    setTimeout(() => {
      location.replace("ExecutandoJogo.html");
    }, 500); // espera o fade-out terminar
  } else {
    location.replace("ExecutandoJogo.html");
  }
  return;
} else if (bloco.tipo === 'orientacao') {
  const modo = substituirVariaveis(bloco.valor, variaveis).toLowerCase();
  if (modo === 'paisagem' || modo === 'retrato') {
    if (window.AndroidInterface && typeof AndroidInterface.changeOrientation === 'function') {
      if(modo === 'paisagem') {
     AndroidInterface.changeOrientation('landscape');
      } else {
     AndroidInterface.changeOrientation('portrait');
      }
    }
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
      if (caixa.visivel === false) return;

      const x = caixa.fixo ? caixa.x : caixa.x - offsetX;
      const y = caixa.fixo ? caixa.y : caixa.y - offsetY;
      const alpha = caixa.opacidade ?? 1; // valor de 0 a 1

      ctx.save(); // 🔒 salva o estado original do canvas
      ctx.globalAlpha = alpha; // 💡 aplica a opacidade

      // 🎞️ Animação por imagem (sequência de frames)
      if (caixa.animacao && Array.isArray(caixa.animacao.frames)) {
        const anim = caixa.animacao;

        if (!anim.pausado) {
          anim.contador = (anim.contador || 0) + 1;

          if (anim.contador >= anim.velocidade) {
            anim.contador = 0;
            anim.indice = (anim.indice + 1) % anim.frames.length;
          }
        }

        const frameAtual = anim.frames[anim.indice];
        if (frameAtual && frameAtual.complete) {
          ctx.drawImage(frameAtual, x, y, caixa.largura, caixa.altura);
          ctx.restore(); // 🔓 restaura para não afetar o próximo desenho
          return;
        }
      }

      // 🖼️ Textura estática
      if (caixa.textura instanceof Image) {
        ctx.drawImage(caixa.textura, x, y, caixa.largura, caixa.altura);
      } else {
        // 🎨 Caixa padrão com cor e raio
        desenharCaixaArredondada(
          ctx,
          x,
          y,
          caixa.largura,
          caixa.altura,
          caixa.raio || 0,
          caixa.cor || 'gray'
        );
      }

      ctx.restore(); // 🔓 sempre restaurar ao final
    });
}

function desenharTextosCanvas(ctx, offsetX = 0, offsetY = 0) {
  textosCanvas
    .slice()
    .sort((a, b) => (a.camada || 0) - (b.camada || 0))
    .forEach(texto => {
      if (texto.visivel === false) return;

      const x = texto.fixo ? texto.x : texto.x - offsetX;
      const y = texto.fixo ? texto.y : texto.y - offsetY;

      ctx.fillStyle = texto.cor;
      ctx.font = texto.fonte;
      ctx.textAlign = texto.alinhamento;
      ctx.textBaseline = "middle";
      ctx.fillText(texto.valor, x, y);
    });
}

function desenharCaixaArredondada(ctx, x, y, w, h, r, cor) {
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
  ctx.fillStyle = cor;
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

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (cameraAlvoId) {
    const alvo = caixasCanvas.find(c => c.id === cameraAlvoId);
    if (alvo) {
      const alvoX = alvo.x + alvo.largura / 2 - larguraVisual / 2;
      const alvoY = alvo.y + alvo.altura / 2 - alturaVisual / 2;

      cameraOffsetX += (alvoX - cameraOffsetX) * suavidadeCamera;
      cameraOffsetY += (alvoY - cameraOffsetY) * suavidadeCamera;
    }
  }

  desenharCaixasCanvas(ctx, cameraOffsetX, cameraOffsetY);
  desenharTextosCanvas(ctx, cameraOffsetX, cameraOffsetY);

  requestAnimationFrame(loop);
}

loop();
