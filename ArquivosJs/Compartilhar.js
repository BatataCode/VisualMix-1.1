document.getElementById("btnImportarProjeto").addEventListener("click", () => {
  document.getElementById("inputImportarProjeto").click();
});

document.getElementById("inputImportarProjeto").addEventListener("change", function () {
  const arquivo = this.files[0];
  if (arquivo) importarProjeto(arquivo);
});

function abrirModalExportar() {
  const modal = document.getElementById("modalExportarProjeto");
  const select = document.getElementById("selectProjetoExportar");
  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];

  // Limpa e popula o <select>
  select.innerHTML = "";
  projetos.forEach(p => {
    if (p?.nome) {
      const option = document.createElement("option");
      option.value = p.nome;
      option.textContent = p.nome;
      select.appendChild(option);
    }
  });

  if (projetos.length === 0) {
    const option = document.createElement("option");
    option.textContent = "Nenhum projeto disponível";
    option.disabled = true;
    option.selected = true;
    select.appendChild(option);
  }

  modal.style.display = "flex";
}

function fecharModalExportar() {
  document.getElementById("modalExportarProjeto").style.display = "none";
}

function confirmarExportacao() {
  const select = document.getElementById("selectProjetoExportar");
  const nomeProjeto = select.value;

  if (!nomeProjeto) return;

  exportarProjeto(nomeProjeto);
  fecharModalExportar();
}

function exportarProjeto(nomeProjeto) {
  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
  const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
  const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};

  const projeto = projetos.find(p => p.nome === nomeProjeto);
  const cenas = cenasPorProjeto[nomeProjeto] || [];

  const objetos = {};
  const blocos = {};
  const imagens = {};

  cenas.forEach(cena => {
    const nomeCena = cena.nome;
    const chaveCena = `${nomeProjeto}_${nomeCena}`;

    objetos[nomeCena] = objetosPorCena[chaveCena] || [];
    blocos[nomeCena] = blocosPorCena[nomeProjeto]?.[nomeCena] || {};

    const chaveImagens = `imagens_${nomeProjeto}_${nomeCena}`;
    imagens[nomeCena] = JSON.parse(localStorage.getItem(chaveImagens)) || [];
  });

  const pacote = { projeto, cenas, objetos, blocos, imagens };

  if (window.AndroidInterface && AndroidInterface.salvarJsonNaPastaDownloads) {
    AndroidInterface.salvarJsonNaPastaDownloads(JSON.stringify(pacote), nomeProjeto);
  } else {
    const blob = new Blob([JSON.stringify(pacote, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomeProjeto}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }
}

function importarProjeto(arquivo) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);
      if (!dados.projeto?.nome) return;

      let nome = dados.projeto.nome;
      const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
      const cenasPorProjeto = JSON.parse(localStorage.getItem("cenasPorProjeto")) || {};
      const objetosPorCena = JSON.parse(localStorage.getItem("objetosPorCena")) || {};
      const blocosPorCena = JSON.parse(localStorage.getItem("blocosPorCena")) || {};

      let nomeFinal = nome;
      let contador = 1;
      while (projetos.some(p => p.nome === nomeFinal)) {
        nomeFinal = `${nome}_${contador++}`;
      }

      projetos.push({
        nome: nomeFinal,
        orientacao: dados.projeto.orientacao || "portrait"
      });

      cenasPorProjeto[nomeFinal] = dados.cenas || [];

      for (const cena of dados.cenas || []) {
        const nomeCena = cena.nome;
        const chaveCena = `${nomeFinal}_${nomeCena}`;

        if (dados.objetos?.[nomeCena]) {
          objetosPorCena[chaveCena] = dados.objetos[nomeCena];
        }
      }

      blocosPorCena[nomeFinal] = blocosPorCena[nomeFinal] || {};
      for (const cena of dados.cenas || []) {
        const nomeCena = cena.nome;
        if (dados.blocos?.[nomeCena]) {
          blocosPorCena[nomeFinal][nomeCena] = dados.blocos[nomeCena];
        }
      }

      // ✅ Restaurar imagens
      for (const cena of dados.cenas || []) {
        const nomeCena = cena.nome;
        const chaveImagens = `imagens_${nomeFinal}_${nomeCena}`;
        const imagensCena = dados.imagens?.[nomeCena] || [];
        localStorage.setItem(chaveImagens, JSON.stringify(imagensCena));
      }

      localStorage.setItem("projetos", JSON.stringify(projetos));
      localStorage.setItem("cenasPorProjeto", JSON.stringify(cenasPorProjeto));
      localStorage.setItem("objetosPorCena", JSON.stringify(objetosPorCena));
      localStorage.setItem("blocosPorCena", JSON.stringify(blocosPorCena));

      location.reload();
    } catch (err) {
      console.error("Erro ao importar projeto:", err);
    }
  };

  reader.readAsText(arquivo);
}