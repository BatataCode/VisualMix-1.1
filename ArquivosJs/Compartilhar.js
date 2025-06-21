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

  if (!nomeProjeto) {
    return;
  }

  exportarProjeto(nomeProjeto);
  fecharModalExportar();
}

function exportarProjeto(nomeProjeto) {
  const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
  const objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
  const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};

  const projeto = projetos.find(p => p.nome === nomeProjeto);
  const objetos = objetosPorProjeto[nomeProjeto] || {};
  const blocos = blocosPorProjeto[nomeProjeto] || {};

  if (!projeto) {
    return;
  }

  const pacote = { projeto, objetos, blocos };

  const blob = new Blob([JSON.stringify(pacote, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomeProjeto}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

function importarProjeto(arquivo) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);

      if (!dados.projeto?.nome) {
        return;
      }

      let nome = dados.projeto.nome;
      const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
      const objetosPorProjeto = JSON.parse(localStorage.getItem("objetosPorProjeto")) || {};
      const blocosPorProjeto = JSON.parse(localStorage.getItem("blocosPorProjeto")) || {};

      let nomeFinal = nome;
      let contador = 1;
      while (projetos.some(p => p.nome === nomeFinal)) {
        nomeFinal = `${nome}_${contador++}`;
      }

      projetos.push({ nome: nomeFinal });
      objetosPorProjeto[nomeFinal] = dados.objetos;
      blocosPorProjeto[nomeFinal] = dados.blocos;

      localStorage.setItem("projetos", JSON.stringify(projetos));
      localStorage.setItem("objetosPorProjeto", JSON.stringify(objetosPorProjeto));
      localStorage.setItem("blocosPorProjeto", JSON.stringify(blocosPorProjeto));

      location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  reader.readAsText(arquivo);
}
