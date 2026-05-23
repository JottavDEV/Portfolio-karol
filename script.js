(function () {
  "use strict";

  var overlay = document.getElementById("modal-overlay");
  var modalIcon = document.getElementById("modal-icon");
  var modalTitle = document.getElementById("modal-title");
  var modalText = document.getElementById("modal-text");
  var modalBody = document.getElementById("modal-body");
  var modalActions = document.getElementById("modal-actions");

  function limparModal() {
    modalBody.innerHTML = "";
    modalActions.innerHTML = "";
    modalText.textContent = "";
    modalText.hidden = false;
  }

  var timerFecharModal = null;

  function fecharModal() {
    overlay.classList.remove("is-visible");
    if (timerFecharModal) {
      clearTimeout(timerFecharModal);
    }
    timerFecharModal = setTimeout(function () {
      timerFecharModal = null;
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      limparModal();
      modalAberto = false;
    }, 350);
  }

  function esperarAnimacaoFechar() {
    return new Promise(function (resolve) {
      setTimeout(resolve, 380);
    });
  }

  function iniciarFluxoAvaliacao() {
    if (avaliacaoConcluida || avaliacaoEmAndamento) {
      return;
    }

    if (modalEstaAberto()) {
      avaliacaoPendente = true;
      return;
    }

    avaliacaoEmAndamento = true;
    if (btnAvaliar) {
      btnAvaliar.disabled = true;
    }

    fluxoAvaliacao().then(function () {
      avaliacaoConcluida = true;
      avaliacaoEmAndamento = false;
      esconderBotaoAvaliar();
      sessionStorage.setItem(STORAGE_AVALIACAO, "1");
    }).catch(function () {
      avaliacaoEmAndamento = false;
      if (btnAvaliar) {
        btnAvaliar.disabled = false;
      }
    });
  }

  function abrirModal(opcoes) {
    if (timerFecharModal) {
      clearTimeout(timerFecharModal);
      timerFecharModal = null;
    }
    limparModal();
    modalIcon.textContent = opcoes.icon || "✨";
    modalTitle.textContent = opcoes.title || "";
    modalText.textContent = opcoes.text || "";
    modalText.hidden = !opcoes.text;

    if (opcoes.body) {
      modalBody.appendChild(opcoes.body);
    }

    if (opcoes.actions) {
      opcoes.actions.forEach(function (acao) {
        modalActions.appendChild(acao);
      });
    }

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modalAberto = true;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("is-visible");
      });
    });

  }

  function criarBotao(texto, classe, aoClicar) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "modal__btn " + (classe || "modal__btn--primary");
    btn.textContent = texto;
    btn.addEventListener("click", aoClicar);
    return btn;
  }

  function mostrarAlerta(opcoes) {
    return new Promise(function (resolve) {
      var btn = criarBotao(opcoes.botao || "Continuar", "modal__btn--primary", function () {
        fecharModal();
        resolve();
      });

      abrirModal({
        icon: opcoes.icon,
        title: opcoes.title,
        text: opcoes.text,
        actions: [btn]
      });
    });
  }

  function mostrarGostou() {
    return new Promise(function (resolve) {
      var grupo = document.createElement("div");
      grupo.className = "modal__choice-group";

      var btnSim = document.createElement("button");
      btnSim.type = "button";
      btnSim.className = "modal__choice modal__choice--yes";
      btnSim.textContent = "👍 Sim, adorei!";
      btnSim.addEventListener("click", function () {
        fecharModal();
        resolve("sim");
      });

      var btnNao = document.createElement("button");
      btnNao.type = "button";
      btnNao.className = "modal__choice modal__choice--no";
      btnNao.textContent = "👎 Não muito";
      btnNao.addEventListener("click", function () {
        fecharModal();
        resolve("nao");
      });

      grupo.appendChild(btnSim);
      grupo.appendChild(btnNao);

      abrirModal({
        icon: "💬",
        title: "O que achou?",
        text: "Você gostou do site?",
        body: grupo
      });
    });
  }

  function mostrarNota() {
    return esperarAnimacaoFechar().then(function () {
      return new Promise(function (resolve) {
        var wrap = document.createElement("div");
        wrap.className = "modal__rating";

        var stars = document.createElement("div");
        stars.className = "modal__stars";

        var numeros = document.createElement("div");
        numeros.className = "modal__notas";

        var label = document.createElement("p");
        label.className = "modal__star-label";
        label.textContent = "Escolha sua nota de 1 a 5";

        var notaSelecionada = 0;
        var botoesNumero = [];

        function selecionarNota(n) {
          notaSelecionada = n;
          label.textContent = "Sua nota: " + n + " de 5";
          label.style.color = "";

          stars.querySelectorAll(".modal__star").forEach(function (star, i) {
            star.classList.toggle("is-active", i < n);
            star.textContent = i < n ? "★" : "☆";
          });

          botoesNumero.forEach(function (btn, i) {
            btn.classList.toggle("is-selected", i + 1 === n);
          });
        }

        for (var i = 1; i <= 5; i++) {
          (function (num) {
            var star = document.createElement("button");
            star.type = "button";
            star.className = "modal__star";
            star.setAttribute("aria-label", "Nota " + num);
            star.textContent = "☆";
            star.addEventListener("click", function () {
              selecionarNota(num);
            });
            star.addEventListener("mouseenter", function () {
              stars.querySelectorAll(".modal__star").forEach(function (s, idx) {
                s.textContent = idx < num ? "★" : "☆";
                s.style.color = idx < num ? "#f5b942" : "#dde4ec";
              });
            });
            stars.appendChild(star);

            var btnNum = document.createElement("button");
            btnNum.type = "button";
            btnNum.className = "modal__nota-btn";
            btnNum.textContent = String(num);
            btnNum.setAttribute("aria-label", "Dar nota " + num);
            btnNum.addEventListener("click", function () {
              selecionarNota(num);
            });
            botoesNumero.push(btnNum);
            numeros.appendChild(btnNum);
          })(i);
        }

        stars.addEventListener("mouseleave", function () {
          selecionarNota(notaSelecionada);
        });

        wrap.appendChild(stars);
        wrap.appendChild(numeros);
        wrap.appendChild(label);

        var btnEnviar = criarBotao("Enviar nota", "modal__btn--primary", function () {
          if (notaSelecionada >= 1 && notaSelecionada <= 5) {
            fecharModal();
            resolve(notaSelecionada);
          } else {
            label.textContent = "Selecione uma nota de 1 a 5 antes de enviar";
            label.style.color = "#c0392b";
          }
        });

        var btnPular = criarBotao("Pular", "modal__btn--ghost", function () {
          fecharModal();
          resolve(null);
        });

        abrirModal({
          icon: "⭐",
          title: "Qual a sua nota?",
          text: "De 1 (ruim) a 5 (excelente), quanto você avalia este site?",
          body: wrap,
          actions: [btnPular, btnEnviar]
        });
      });
    });
  }

  var avaliacaoConcluida = false;
  var avaliacaoEmAndamento = false;
  var modalAberto = false;
  var avaliacaoPendente = false;
  var btnAvaliar = null;

  var STORAGE_BOAS_VINDAS = "karol-boas-vindas-visto";
  var STORAGE_AVALIACAO = "karol-avaliacao-feita";

  function esconderBotaoAvaliar() {
    if (btnAvaliar) {
      btnAvaliar.classList.add("is-hidden");
    }
  }

  function modalEstaAberto() {
    return modalAberto || overlay.classList.contains("is-visible");
  }

  function chegouAoFimDaPagina() {
    var margem = 120;
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var alturaVisivel = document.documentElement.clientHeight;
    var alturaTotal = document.documentElement.scrollHeight;
    return scrollTop + alturaVisivel >= alturaTotal - margem;
  }

  /* —— Boas-vindas (ao abrir o site, uma vez por sessão) —— */
  function fluxoBoasVindas() {
    if (sessionStorage.getItem(STORAGE_BOAS_VINDAS) === "1") {
      return Promise.resolve();
    }

    return mostrarAlerta({
      icon: "👋",
      title: "Bem-vindo(a)!",
      text: "Que bom ter você aqui no meu site pessoal. Espero que goste do conteúdo e da minha trajetória profissional.",
      botao: "Explorar o site"
    }).then(function () {
      sessionStorage.setItem(STORAGE_BOAS_VINDAS, "1");
      if (avaliacaoPendente) {
        avaliacaoPendente = false;
        iniciarFluxoAvaliacao();
      }
    });
  }

  /* —— Avaliação (fim da rolagem ou botão flutuante) —— */
  function fluxoAvaliacao() {
    return mostrarGostou()
      .then(function (resposta) {
        return esperarAnimacaoFechar().then(function () {
          if (resposta === "sim") {
            return mostrarAlerta({
              icon: "🎉",
              title: "Que alegria!",
              text: "Fico muito feliz que tenha gostado. Obrigada pela visita!",
              botao: "Dar minha nota"
            });
          }
          if (resposta === "nao") {
            return mostrarAlerta({
              icon: "💙",
              title: "Obrigada pelo retorno",
              text: "Seu feedback é importante. Sempre busco melhorar!",
              botao: "Dar minha nota"
            });
          }
        });
      })
      .then(function () {
        return mostrarNota();
      })
      .then(function (nota) {
      if (nota !== null && nota >= 1 && nota <= 5) {
        var emojis = ["", "😊", "🙂", "😄", "🤩", "💖"];
        var wrap = document.createElement("div");
        wrap.innerHTML =
          '<span class="modal__thanks-emoji">' + emojis[nota] + "</span>";

        return new Promise(function (resolve) {
          var btn = criarBotao("Fechar", "modal__btn--primary", function () {
            fecharModal();
            resolve();
          });

          abrirModal({
            icon: "🏆",
            title: "Obrigada!",
            text: "Você deu nota " + nota + " de 5. Sua avaliação foi registrada com carinho!",
            body: wrap,
            actions: [btn]
          });
        });
      }
      if (nota === null) {
        return;
      }
      return mostrarAlerta({
        icon: "ℹ️",
        title: "Ops!",
        text: "Por favor, escolha uma nota de 1 a 5 estrelas na próxima visita. Obrigada!",
        botao: "Entendi"
      });
    });
  }

  window.addEventListener("DOMContentLoaded", function () {
    btnAvaliar = document.getElementById("btn-avaliar");

    if (sessionStorage.getItem(STORAGE_AVALIACAO) === "1") {
      avaliacaoConcluida = true;
      esconderBotaoAvaliar();
    }

    setTimeout(fluxoBoasVindas, 500);

    if (btnAvaliar) {
      btnAvaliar.addEventListener("click", function () {
        iniciarFluxoAvaliacao();
      });
    }

    var scrollTimer = null;
    window.addEventListener("scroll", function () {
      if (avaliacaoConcluida || avaliacaoEmAndamento) {
        return;
      }
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        if (chegouAoFimDaPagina()) {
          iniciarFluxoAvaliacao();
        }
      }, 150);
    }, { passive: true });

    var navToggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");

    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var aberto = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", aberto);
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  });
})();
