document.addEventListener("DOMContentLoaded", function () {
  const apiBase = String(window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com").replace(/\/+$/, "");
  const developerPanel = document.getElementById("developerPanel");
  const gameForm = document.getElementById("gameForm");
  const gameFormContent = document.getElementById("gameFormContent");
  const gameFormToggleBtn = document.getElementById("gameFormToggleBtn");
  const gameFormToggleIcon = document.getElementById("gameFormToggleIcon");
  const gamesList = document.getElementById("gamesList");
  const refreshGamesBtn = document.getElementById("refreshGamesBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveGameLabel = document.getElementById("saveGameLabel");
  const gameFormMessage = document.getElementById("gameFormMessage");
  const homeTeamInput = document.getElementById("homeTeamInput");
  const awayTeamInput = document.getElementById("awayTeamInput");
  const homeTeamImageInput = document.getElementById("homeTeamImageInput");
  const awayTeamImageInput = document.getElementById("awayTeamImageInput");
  const matchDateInput = document.getElementById("matchDateInput");
  const matchTimeInput = document.getElementById("matchTimeInput");
  const predictionStartDateInput = document.getElementById("predictionStartDateInput");
  const predictionStartTimeInput = document.getElementById("predictionStartTimeInput");
  const predictionEndDateInput = document.getElementById("predictionEndDateInput");
  const predictionEndTimeInput = document.getElementById("predictionEndTimeInput");
  const competitionInput = document.getElementById("competitionInput");
  const prizeDescriptionInput = document.getElementById("prizeDescriptionInput");
  const rulesInput = document.getElementById("rulesInput");
  const sentPredictionsList = document.getElementById("sentPredictionsList");
  const sentPredictionsContent = document.getElementById("sentPredictionsContent");
  const sentPredictionsToggleBtn = document.getElementById("sentPredictionsToggleBtn");
  const sentPredictionsToggleIcon = document.getElementById("sentPredictionsToggleIcon");
  const sentPredictionsViewMount = document.getElementById("sentPredictionsViewMount");
  const sentFirstGoalList = document.getElementById("sentFirstGoalList");
  const sentFirstGoalContent = document.getElementById("sentFirstGoalContent");
  const sentFirstGoalToggleBtn = document.getElementById("sentFirstGoalToggleBtn");
  const sentFirstGoalToggleIcon = document.getElementById("sentFirstGoalToggleIcon");
  const winnersHistoryList = document.getElementById("winnersHistoryList");
  const firstGoalDeveloperPanel = document.getElementById("firstGoalDeveloperPanel");
  const firstGoalPeriodForm = document.getElementById("firstGoalPeriodForm");
  const firstGoalStartDateInput = document.getElementById("firstGoalStartDateInput");
  const firstGoalStartTimeInput = document.getElementById("firstGoalStartTimeInput");
  const firstGoalEndDateInput = document.getElementById("firstGoalEndDateInput");
  const firstGoalEndTimeInput = document.getElementById("firstGoalEndTimeInput");
  const firstGoalPrizeInput = document.getElementById("firstGoalPrizeInput");
  const firstGoalRulesInput = document.getElementById("firstGoalRulesInput");
  const firstGoalPeriodStatus = document.getElementById("firstGoalPeriodStatus");
  const firstGoalPrizeRules = document.getElementById("firstGoalPrizeRules");
  const firstGoalPlayerForm = document.getElementById("firstGoalPlayerForm");
  const firstGoalPlayerNameInput = document.getElementById("firstGoalPlayerNameInput");
  const firstGoalPlayerPhotoInput = document.getElementById("firstGoalPlayerPhotoInput");
  const firstGoalCancelEditBtn = document.getElementById("firstGoalCancelEditBtn");
  const firstGoalSavePlayerLabel = document.getElementById("firstGoalSavePlayerLabel");
  const firstGoalFormMessage = document.getElementById("firstGoalFormMessage");
  const firstGoalPlayersList = document.getElementById("firstGoalPlayersList");
  const firstGoalVotesPanel = document.getElementById("firstGoalVotesPanel");
  const firstGoalVotesList = document.getElementById("firstGoalVotesList");
  const tabButtons = Array.from(document.querySelectorAll("[data-tab-button]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const predictionSuccessModal = document.getElementById("predictionSuccessModal");
  const predictionSuccessCloseBtn = document.getElementById("predictionSuccessCloseBtn");
  const predictionSuccessMessage = document.getElementById("predictionSuccessMessage");
  const predictionSuccessScore = document.getElementById("predictionSuccessScore");
  const predictionConfetti = document.getElementById("predictionConfetti");

  const firstGoalWaitModal = document.getElementById("firstGoalWaitModal");
  const firstGoalWaitModalCard = document.getElementById("firstGoalWaitModalCard");
  const firstGoalWaitCountdown = document.getElementById("firstGoalWaitCountdown");
  const firstGoalWaitPeriod = document.getElementById("firstGoalWaitPeriod");
  const firstGoalWaitPrize = document.getElementById("firstGoalWaitPrize");
  const firstGoalWaitRules = document.getElementById("firstGoalWaitRules");
  const firstGoalWaitCloseBtn = document.getElementById("firstGoalWaitCloseBtn");
  let firstGoalWaitInterval = null;

  let games = [];
  let firstGoalData = { jogadores: [], palpites_enviados: [], meu_palpite: null, ja_enviou_palpite: false, status_palpites: "nao_configurado", palpite_aberto: false, escolhas_reveladas: false, descricao_premio: "", regras: "" };
  let isDeveloper = false;
  let editingGameId = "";
  let editingFirstGoalPlayerId = "";
  let sentPredictionsView = "list";

  try {
    sentPredictionsView = localStorage.getItem("superpop_sent_predictions_view") === "cards" ? "cards" : "list";
  } catch (error) {
    sentPredictionsView = "list";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initials(name) {
    const parts = String(name || "Usuário").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.length ? parts.map(function (part) { return part.charAt(0).toUpperCase(); }).join("") : "US";
  }

  function userAvatarHtml(item, sizeClass) {
    const photo = item && (item.usuario_foto || item.foto_perfil_data_url) || "";
    const name = item && item.usuario_nome || "Usuário";
    const size = sizeClass || "h-10 w-10";
    if (photo) {
      return '<img src="' + escapeHtml(photo) + '" alt="Foto de ' + escapeHtml(name) + '" class="' + size + ' shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200" />';
    }
    return '<div class="' + size + ' flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-red-100 to-amber-100 text-xs font-extrabold text-red-700 shadow-sm ring-1 ring-slate-200">' +
      escapeHtml(initials(name)) + '</div>';
  }

  function multilineHtml(value) {
    return String(value || "")
      .split(/\n+/)
      .map(function (line) { return escapeHtml(line.trim()); })
      .filter(Boolean)
      .join("<br>");
  }

  function updateSentViewButtons() {
    document.querySelectorAll("[data-sent-view]").forEach(function (button) {
      const active = button.dataset.sentView === sentPredictionsView;
      button.classList.toggle("bg-slate-900", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("shadow-sm", active);
      button.classList.toggle("text-slate-500", !active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setSentPredictionsExpanded(expanded) {
    if (!sentPredictionsContent || !sentPredictionsToggleBtn || !sentPredictionsToggleIcon) return;
    sentPredictionsContent.classList.toggle("hidden", !expanded);
    sentPredictionsToggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
    sentPredictionsToggleIcon.textContent = expanded ? "expand_less" : "expand_more";
  }

  function setupSentViewControls() {
    const mount = sentPredictionsViewMount || sentPredictionsList;
    if (!mount || document.getElementById("sentPredictionsViewControls")) return;
    mount.insertAdjacentHTML("beforeend",
      '<div class="mt-4 flex justify-end" id="sentPredictionsViewControls">' +
        '<div class="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Modo de visualizacao dos palpites">' +
          '<button class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-slate-500" data-sent-view="list" type="button"><span class="material-symbols-outlined text-base">view_list</span>Lista</button>' +
          '<button class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-slate-500" data-sent-view="cards" type="button"><span class="material-symbols-outlined text-base">grid_view</span>Cards</button>' +
        '</div>' +
      '</div>'
    );
    document.querySelectorAll("[data-sent-view]").forEach(function (button) {
      button.addEventListener("click", function () {
        sentPredictionsView = button.dataset.sentView === "cards" ? "cards" : "list";
        try {
          localStorage.setItem("superpop_sent_predictions_view", sentPredictionsView);
        } catch (error) {}
        updateSentViewButtons();
        renderSentPredictions();
      });
    });
    updateSentViewButtons();
  }

  async function api(path, options) {
    const response = await fetch(apiBase + path, Object.assign({
      cache: "no-store",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    }, options || {}));
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok || !payload.ok) {
      if (response.status === 401 || payload.error === "Nao autenticado.") {
        window.location.href = "login.html";
        return;
      }
      throw new Error(String(payload.error || "Não foi possível concluir a solicitação."));
    }

    // Log GitHub sync failures for debugging
    if (payload.github_sync && payload.github_sync.synced === false) {
      console.error("Falha ao sincronizar com o GitHub:", payload.github_sync.reason);
    }
    
    return payload;
  }

  function showFormMessage(message, error) {
    gameFormMessage.textContent = String(message || "");
    gameFormMessage.className = "rounded-xl px-4 py-3 text-sm font-bold " +
      (error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700");
    gameFormMessage.classList.toggle("hidden", !message);
  }

  function setGameFormExpanded(expanded) {
    if (!gameFormContent || !gameFormToggleBtn || !gameFormToggleIcon) return;
    gameFormContent.classList.toggle("hidden", !expanded);
    gameFormToggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
    gameFormToggleIcon.textContent = expanded ? "expand_less" : "expand_more";
  }

  function resetForm() {
    editingGameId = "";
    gameForm.reset();
    cancelEditBtn.classList.add("hidden");
    saveGameLabel.textContent = "Cadastrar jogo";
    showFormMessage("", false);
  }

  function formatDate(dateText) {
    const parts = String(dateText || "").split("-");
    return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : dateText;
  }

  function formatDateTime(isoValue) {
    const parsed = new Date(String(isoValue || ""));
    if (!Number.isFinite(parsed.getTime())) return "-";
    return parsed.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function splitIsoDateTime(isoValue) {
    const text = String(isoValue || "");
    return {
      date: text.slice(0, 10),
      time: text.slice(11, 16)
    };
  }

  function teamImage(url, team) {
    if (!url) {
      return '<span class="material-symbols-outlined mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-400">shield</span>';
    }
    return '<img class="mx-auto mb-2 h-16 w-16 rounded-full border border-slate-100 bg-white object-contain p-1 shadow-sm" src="' +
      escapeHtml(url) + '" alt="Escudo ' + escapeHtml(team) + '"/>';
  }

  function buildConfetti() {
    if (!predictionConfetti) return;
    predictionConfetti.innerHTML = "";
    const colors = ["#e63946", "#ffb703", "#ffffff", "#fb7185", "#facc15"];
    for (let index = 0; index < 48; index += 1) {
      const piece = document.createElement("span");
      piece.className = "prediction-confetti-piece";
      piece.style.left = Math.floor(Math.random() * 100) + "%";
      piece.style.backgroundColor = colors[index % colors.length];
      piece.style.setProperty("--duration", (2.1 + Math.random() * 1.8).toFixed(2) + "s");
      piece.style.setProperty("--delay", (Math.random() * 0.45).toFixed(2) + "s");
      piece.style.setProperty("--drift", (Math.random() * 180 - 90).toFixed(0) + "px");
      piece.style.setProperty("--rotation", (Math.random() * 900 - 450).toFixed(0) + "deg");
      piece.style.transform = "rotate(" + Math.floor(Math.random() * 180) + "deg)";
      predictionConfetti.appendChild(piece);
    }
  }

  function showPredictionSuccess(game, homeScore, awayScore) {
    if (!predictionSuccessModal) return;
    predictionSuccessMessage.textContent = "Seu palpite foi registrado e não poderá ser alterado.";
    predictionSuccessScore.textContent =
      String(game && game.time_casa || "Time da casa") + " " + homeScore +
      " x " + awayScore + " " + String(game && game.time_visitante || "Time visitante");
    buildConfetti();
    predictionSuccessModal.classList.add("is-open");
    predictionSuccessModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(function () {
      predictionSuccessCloseBtn.focus();
    }, 250);
    window.setTimeout(closePredictionSuccess, 5000);
  }

  function closePredictionSuccess() {
    if (!predictionSuccessModal) return;
    predictionSuccessModal.classList.remove("is-open");
    predictionSuccessModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function firstGoalPlayerPhotoHtml(player, sizeClass) {
    const photo = player && (player.foto_url || player.jogador_foto) || "";
    const name = player && (player.nome || player.jogador_nome) || "Jogador";
    const size = sizeClass || "h-20 w-20";
    if (photo) {
      return '<img src="' + escapeHtml(photo) + '" alt="Foto de ' + escapeHtml(name) + '" class="' + size + ' shrink-0 rounded-full border-4 border-white object-cover shadow-sm ring-1 ring-slate-200" />';
    }
    return '<div class="' + size + ' flex shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-100 to-yellow-100 text-lg font-extrabold text-emerald-700 shadow-sm ring-1 ring-slate-200">' +
      escapeHtml(initials(name)) + '</div>';
  }

  function showFirstGoalSuccess(player) {
    if (!predictionSuccessModal) return;
    predictionSuccessMessage.textContent = "Sua escolha foi registrada e n\u00e3o poder\u00e1 ser alterada.";
    predictionSuccessScore.textContent = String(player && player.nome || "Jogador selecionado");
    buildConfetti();
    predictionSuccessModal.classList.add("is-open");
    predictionSuccessModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(function () {
      predictionSuccessCloseBtn.focus();
    }, 250);
    window.setTimeout(closePredictionSuccess, 5000);
  }

  function showFirstGoalFormMessage(message, error) {
    if (!firstGoalFormMessage) return;
    firstGoalFormMessage.textContent = String(message || "");
    firstGoalFormMessage.className = "mt-3 rounded-xl px-4 py-3 text-sm font-bold " +
      (error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700");
    firstGoalFormMessage.classList.toggle("hidden", !message);
  }

  function resetFirstGoalPlayerForm() {
    editingFirstGoalPlayerId = "";
    if (firstGoalPlayerForm) firstGoalPlayerForm.reset();
    if (firstGoalCancelEditBtn) firstGoalCancelEditBtn.classList.add("hidden");
    if (firstGoalSavePlayerLabel) firstGoalSavePlayerLabel.textContent = "Cadastrar jogador";
    showFirstGoalFormMessage("", false);
  }

  function populateFirstGoalPeriodForm() {
    if (!firstGoalPeriodForm) return;
    const start = splitIsoDateTime(firstGoalData.inicio_palpites_iso || "");
    const end = splitIsoDateTime(firstGoalData.fim_palpites_iso || "");
    if (firstGoalStartDateInput) firstGoalStartDateInput.value = start.date || "";
    if (firstGoalStartTimeInput) firstGoalStartTimeInput.value = start.time || "";
    if (firstGoalEndDateInput) firstGoalEndDateInput.value = end.date || "";
    if (firstGoalEndTimeInput) firstGoalEndTimeInput.value = end.time || "";
    if (firstGoalPrizeInput) firstGoalPrizeInput.value = firstGoalData.descricao_premio || "";
    if (firstGoalRulesInput) firstGoalRulesInput.value = firstGoalData.regras || "";
  }

  function renderFirstGoalPeriodStatus() {
    if (!firstGoalPeriodStatus) return;
    const status = firstGoalData.status_palpites || "nao_configurado";
    const startText = formatDateTime(firstGoalData.inicio_palpites_iso);
    const endText = formatDateTime(firstGoalData.fim_palpites_iso);
    let text = "Período de envio não configurado pelo desenvolvedor.";
    let className = "mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600";
    if (status === "aguardando") {
      text = "As escolhas começam em " + startText + " e encerram em " + endText + ".";
      className = "mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900";
    } else if (status === "aberto") {
      text = "Escolhas abertas até " + endText + ". Depois de confirmar, não será possível alterar.";
      className = "mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800";
    } else if (status === "encerrado") {
      text = "Período encerrado. As escolhas dos colaboradores foram reveladas.";
      className = "mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700";
    }
    firstGoalPeriodStatus.textContent = text;
    firstGoalPeriodStatus.className = className;
  }

  function renderFirstGoalPrizeRules() {
    if (!firstGoalPrizeRules) return;
    const prize = String(firstGoalData.descricao_premio || "").trim();
    const rules = String(firstGoalData.regras || "").trim();
    if (!prize && !rules) {
      firstGoalPrizeRules.innerHTML = "";
      return;
    }
    const prizeHtml = prize
      ? '<div class="rounded-2xl border border-amber-100 bg-amber-50 p-4">' +
        '<p class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-700"><span class="material-symbols-outlined text-base">redeem</span>Premiação</p>' +
        '<p class="mt-2 text-sm font-bold leading-relaxed text-amber-950">' + multilineHtml(prize) + '</p></div>'
      : "";
    const rulesHtml = rules
      ? '<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">' +
        '<p class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-600"><span class="material-symbols-outlined text-base">rule</span>Regras</p>' +
        '<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-700">' + multilineHtml(rules) + '</p></div>'
      : "";
    firstGoalPrizeRules.innerHTML = prizeHtml + rulesHtml;
  }

  function firstGoalPlayerCardHtml(player) {
    const ownPrediction = firstGoalData.meu_palpite || {};
    const selected = ownPrediction.jogador_id === player.id;
    const alreadySent = Boolean(firstGoalData.ja_enviou_palpite);
    const predictionsOpen = Boolean(firstGoalData.palpite_aberto);
    const disabled = alreadySent || !predictionsOpen;
    const adminActions = isDeveloper
      ? '<div class="absolute right-3 top-3 flex gap-2">' +
          '<button class="rounded-lg bg-white/95 px-3 py-2 text-xs font-bold shadow-sm" data-edit-first-goal-player="' + escapeHtml(player.id) + '" type="button">Editar</button>' +
          '<button class="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm" data-delete-first-goal-player="' + escapeHtml(player.id) + '" type="button">Excluir</button>' +
        '</div>'
      : "";
    const cardClass = selected
      ? "relative rounded-3xl border-2 border-emerald-400 bg-emerald-50 p-5 text-center shadow-soft ring-4 ring-emerald-100"
      : "relative rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-soft";
    const buttonText = selected ? "Selecionado" : (alreadySent ? "Escolha enviada" : (predictionsOpen ? "Escolher jogador" : "Fora do período"));
    const buttonClass = selected ? "bg-emerald-600" : "bg-primary";
    return '<article class="' + cardClass + '">' +
      adminActions +
      '<div class="flex justify-center">' + firstGoalPlayerPhotoHtml(player, "h-24 w-24") + '</div>' +
      '<h3 class="mt-4 text-lg font-extrabold text-slate-900">' + escapeHtml(player.nome || "Jogador") + '</h3>' +
      (firstGoalData.escolhas_reveladas ? '<p class="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">' + Number(player.total_palpites || 0) + ' escolha(s)</p>' : '<p class="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Escolhas ocultas</p>') +
      '<form class="first-goal-prediction-form mt-4" data-player-id="' + escapeHtml(player.id) + '">' +
      '<button class="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60 ' + buttonClass + '" type="submit"' + (disabled ? " disabled" : "") + '>' +
      '<span class="material-symbols-outlined text-base">' + (selected ? "check_circle" : "sports_soccer") + '</span>' + buttonText + '</button>' +
      '<p class="first-goal-message mt-3 hidden rounded-xl px-3 py-2 text-sm font-bold"></p>' +
      '</form>' +
      '</article>';
  }

  function renderFirstGoalPlayers() {
    if (!firstGoalPlayersList) return;
    const players = Array.isArray(firstGoalData.jogadores) ? firstGoalData.jogadores : [];
    if (!players.length) {
      firstGoalPlayersList.innerHTML = '<div class="sm:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center font-semibold text-slate-500">Nenhum jogador cadastrado.</div>';
      return;
    }
    firstGoalPlayersList.innerHTML = players.map(firstGoalPlayerCardHtml).join("");
  }

  function renderFirstGoalVotes() {
    if (!firstGoalVotesPanel || !firstGoalVotesList) return;
    const canSeeVotes = Boolean(firstGoalData.escolhas_reveladas);
    firstGoalVotesPanel.classList.remove("hidden");
    const votes = Array.isArray(firstGoalData.palpites_enviados) ? firstGoalData.palpites_enviados : [];
    if (!votes.length) {
      firstGoalVotesList.className = "mt-4";
      firstGoalVotesList.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center font-semibold text-slate-500">Nenhuma escolha enviada.</div>';
      return;
    }
    firstGoalVotesList.className = "mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
    firstGoalVotesList.innerHTML = votes.map(function (item) {
      const selected = Boolean(item.ganhador_selecionado);
      const isHidden = Boolean(item.oculto);
      const roleHtml = item.usuario_funcao ? '<span class="text-xs font-bold text-slate-400">(' + escapeHtml(item.usuario_funcao) + ')</span>' : "";

      const articleClass = selected
        ? "flex h-full flex-col gap-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 shadow-sm ring-4 ring-yellow-100"
        : "flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft";

      const crownSvg = selected
        ? '<span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-yellow-900 shadow-sm" title="Palpite ganhador">' +
          '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3.7 8.2 8.6 12l3.1-6.4L15.2 12l5.1-3.8-1.6 10.2H5.3L3.7 8.2Z" fill="currentColor"/><path d="M5.4 20h13.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</span>'
        : "";

      const winnerButton = selected
        ? '<span class="rounded-lg bg-yellow-200 px-3 py-2 text-xs font-extrabold text-yellow-900">Ganhador</span>'
        : '<button class="rounded-lg bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-800 hover:bg-yellow-200" data-select-first-goal-winner="' + escapeHtml(item.id) + '" type="button">Marcar ganhador</button>';

      // Hidden player block: blurred overlay
      const playerBlock = isHidden
        ? '<div class="relative flex items-center gap-3 rounded-xl overflow-hidden" style="background:#ecfdf5;padding:12px;">' +
          '<div style="filter:blur(7px);opacity:0.7;pointer-events:none;display:flex;align-items:center;gap:12px;width:100%;">' +
          firstGoalPlayerPhotoHtml({ nome: item.jogador_nome, foto_url: item.jogador_foto }, "h-10 w-10 shrink-0") +
          '<div><p style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#059669;">Primeiro gol</p>' +
          '<p style="font-size:14px;font-weight:800;color:#065f46;">???</p></div></div>' +
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6px;">' +
          '<span class="material-symbols-outlined" style="font-size:16px;color:#6b7280;">lock</span>' +
          '<span style="font-size:11px;font-weight:700;color:#6b7280;">Oculto até encerrar</span></div></div>'
        : '<div class="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-extrabold text-emerald-800">' +
          firstGoalPlayerPhotoHtml({ nome: item.jogador_nome, foto_url: item.jogador_foto }, "h-10 w-10 shrink-0") +
          '<div><p class="text-xs uppercase tracking-widest text-emerald-600">Primeiro gol</p><p class="truncate">' + escapeHtml(item.jogador_nome || "Jogador") + '</p></div></div>';

      return '<article class="' + articleClass + '">' +
        '<div class="flex items-center justify-between gap-3"><p class="text-xs font-bold uppercase tracking-widest text-primary">Palpite enviado</p>' +
        '<div class="flex gap-2">' +
        (isDeveloper ? winnerButton + '<button class="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700" data-delete-first-goal-vote="' + escapeHtml(item.id) + '" type="button">Excluir</button>' : '') +
        '</div></div>' +
        '<div class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">' + userAvatarHtml(item, "h-11 w-11") +
        '<div class="min-w-0 mr-auto"><p class="truncate text-sm font-bold text-slate-900">' + escapeHtml(item.usuario_nome || "Usuario") + '</p>' +
        '<p class="truncate text-xs font-bold text-slate-400">' + roleHtml + '</p></div>' + crownSvg + '</div>' +
        playerBlock +
        '<div class="mt-auto flex items-center gap-2 text-xs font-bold text-slate-500"><span class="material-symbols-outlined text-base">schedule</span>' + escapeHtml(formatDateTime(item.enviado_em_iso)) + '</div>' +
        '</article>';
    }).join("");
  }

  async function loadFirstGoal() {
    if (!firstGoalPlayersList) return;
    firstGoalPlayersList.innerHTML = '<p class="text-slate-500 font-semibold">Carregando jogadores...</p>';
    try {
      const payload = await api("/api/primeiro-gol");
      firstGoalData = {
        jogadores: Array.isArray(payload.jogadores) ? payload.jogadores : [],
        palpites_enviados: Array.isArray(payload.palpites_enviados) ? payload.palpites_enviados : [],
        meu_palpite: payload.meu_palpite || null,
        ja_enviou_palpite: Boolean(payload.ja_enviou_palpite),
        inicio_palpites_iso: payload.inicio_palpites_iso || "",
        fim_palpites_iso: payload.fim_palpites_iso || "",
        descricao_premio: payload.descricao_premio || "",
        regras: payload.regras || "",
        status_palpites: payload.status_palpites || "nao_configurado",
        palpite_aberto: Boolean(payload.palpite_aberto),
        escolhas_reveladas: Boolean(payload.escolhas_reveladas)
      };
      isDeveloper = Boolean(payload.is_developer);
      if (firstGoalDeveloperPanel) firstGoalDeveloperPanel.classList.toggle("hidden", !isDeveloper);
      populateFirstGoalPeriodForm();
      renderFirstGoalPeriodStatus();
      renderFirstGoalPrizeRules();
      renderFirstGoalPlayers();
      renderFirstGoalVotes();
      renderSentFirstGoalPredictions();
      showFirstGoalWaitModal();
    } catch (error) {
      firstGoalPlayersList.innerHTML = '<div class="sm:col-span-2 xl:col-span-3 rounded-2xl bg-red-50 p-4 font-bold text-red-700">' + escapeHtml(error.message) + '</div>';
    }
  }

  function developerPredictionsHtml(game) {
    if (!isDeveloper) return "";
    const predictions = Array.isArray(game.palpites) ? game.palpites : [];
    if (!predictions.length) {
      return '<div class="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-400">Nenhum palpite recebido.</div>';
    }
    return '<div class="mt-5 border-t border-slate-100 pt-4">' +
      '<p class="text-xs font-bold uppercase tracking-widest text-primary">Gerenciar palpites</p>' +
      '<div class="mt-3 space-y-2">' +
      predictions.map(function (item) {
        const selected = Boolean(item.ganhador_selecionado);
        const predictionId = String(item.id || "").trim();
        const deletePredictionId = predictionId || "legacy";
        const deleteQuery = predictionId ? "" : (
          "?usuario_id=" + encodeURIComponent(item.usuario_id || "") +
          "&enviado_em_iso=" + encodeURIComponent(item.enviado_em_iso || "") +
          "&gols_casa=" + encodeURIComponent(item.gols_casa == null ? "" : item.gols_casa) +
          "&gols_visitante=" + encodeURIComponent(item.gols_visitante == null ? "" : item.gols_visitante)
        );
        const roleText = item.usuario_funcao ? '<span class="ml-1 text-xs font-bold text-slate-400">(' + escapeHtml(item.usuario_funcao) + ')</span>' : "";
        const selectedClass = selected
          ? "border-2 border-yellow-400 bg-yellow-50 ring-4 ring-yellow-100 shadow-sm"
          : "border border-transparent bg-slate-50";
        const crownSvg = selected
          ? '<span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-yellow-900 shadow-sm" title="Palpite ganhador">' +
            '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3.7 8.2 8.6 12l3.1-6.4L15.2 12l5.1-3.8-1.6 10.2H5.3L3.7 8.2Z" fill="currentColor"/><path d="M5.4 20h13.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '</span>'
          : "";
        const winnerButton = selected
          ? '<span class="rounded-lg bg-yellow-200 px-3 py-2 text-xs font-extrabold text-yellow-900">Ganhador</span>'
          : '<button class="rounded-lg bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-800 hover:bg-yellow-200" data-select-winner type="button">Marcar ganhador</button>';
        return '<form class="developer-prediction-form flex flex-wrap items-center gap-2 rounded-xl p-3 ' + selectedClass + '" data-game-id="' +
          escapeHtml(game.id) + '" data-prediction-id="' + escapeHtml(deletePredictionId) + '" data-delete-query="' + escapeHtml(deleteQuery) + '">' +
          crownSvg +
          userAvatarHtml(item, "h-10 w-10") +
          '<strong class="mr-auto min-w-[140px] text-sm">' + escapeHtml(item.usuario_nome || "Usuário") + roleText + '</strong>' +
          '<input class="w-16 rounded-lg border-slate-200 text-center font-bold" min="0" max="99" name="gols_casa" required type="number" value="' + escapeHtml(item.gols_casa) + '"/>' +
          '<span class="font-bold">x</span>' +
          '<input class="w-16 rounded-lg border-slate-200 text-center font-bold" min="0" max="99" name="gols_visitante" required type="number" value="' + escapeHtml(item.gols_visitante) + '"/>' +
          winnerButton +
          '<button class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white" type="submit">Salvar</button>' +
          '<button class="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700" data-delete-prediction type="button">Excluir</button>' +
          '</form>';
      }).join("") + '</div></div>';
  }

  function resultSummaryHtml(game) {
    const result = game.resultado || {};
    const selectedWinner = result.ganhador_selecionado || null;
    if (!result.definido && !selectedWinner) return "";
    const winners = selectedWinner ? [selectedWinner] : (Array.isArray(result.ganhadores) ? result.ganhadores : []);
    const winnersText = winners.length
      ? winners.map(function (item) { return item.usuario_nome || "Usuário"; }).join(", ")
      : "Sem ganhador selecionado";
    const scoreText = result.definido
      ? 'Resultado final: ' + escapeHtml(game.time_casa) + ' ' + escapeHtml(result.gols_casa) +
        ' x ' + escapeHtml(result.gols_visitante) + ' ' + escapeHtml(game.time_visitante)
      : 'Ganhador selecionado pelo desenvolvedor';
    return '<div class="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">' +
      '<span class="material-symbols-outlined mr-1 align-middle text-base">verified</span>' +
      scoreText +
      '<div class="mt-1 text-xs text-emerald-700">Ganhador: ' + escapeHtml(winnersText) + '</div>' +
      '</div>';
  }

  function developerResultHtml(game) {
    if (!isDeveloper) return "";
    const result = game.resultado || {};
    return '<form class="developer-result-form mt-4 rounded-xl border border-emerald-100 bg-white p-3" data-game-id="' + escapeHtml(game.id) + '">' +
      '<p class="text-xs font-bold uppercase tracking-widest text-emerald-700">Resultado final</p>' +
      '<div class="mt-3 flex flex-wrap items-center gap-2">' +
      '<input aria-label="Gols finais do time da casa" class="w-16 rounded-lg border-slate-200 text-center font-bold" min="0" max="99" name="gols_casa" required type="number" value="' + escapeHtml(result.definido ? result.gols_casa : "") + '"/>' +
      '<span class="font-bold">x</span>' +
      '<input aria-label="Gols finais do time visitante" class="w-16 rounded-lg border-slate-200 text-center font-bold" min="0" max="99" name="gols_visitante" required type="number" value="' + escapeHtml(result.definido ? result.gols_visitante : "") + '"/>' +
      '<button class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" type="submit">Salvar resultado</button>' +
      '</div>' +
      '<p class="mt-2 text-xs font-semibold text-slate-400">Ao salvar, o histórico calcula quem acertou o placar exato.</p>' +
      '</form>';
  }

  function prizeRulesHtml(game) {
    const prize = String(game.descricao_premio || "").trim();
    const rules = String(game.regras || "").trim();
    if (!prize && !rules) return "";
    const prizeHtml = prize
      ? '<div class="rounded-2xl border border-amber-100 bg-amber-50 p-4">' +
        '<p class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-700"><span class="material-symbols-outlined text-base">redeem</span>Prêmio</p>' +
        '<p class="mt-2 text-sm font-bold leading-relaxed text-amber-950">' + multilineHtml(prize) + '</p></div>'
      : "";
    const rulesHtml = rules
      ? '<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">' +
        '<p class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-600"><span class="material-symbols-outlined text-base">rule</span>Regras</p>' +
        '<p class="mt-2 text-sm font-semibold leading-relaxed text-slate-700">' + multilineHtml(rules) + '</p></div>'
      : "";
    return '<div class="mt-4 grid gap-3 sm:grid-cols-2">' + prizeHtml + rulesHtml + '</div>';
  }

  function gameHtml(game) {
    const prediction = game.meu_palpite || {};
    const alreadySent = Boolean(game.ja_enviou_palpite);
    const disabled = !game.palpite_aberto || alreadySent;
    const status = game.status_palpites === "aguardando"
      ? "Aguardando abertura"
      : (!game.palpite_aberto ? "Palpites encerrados" : (alreadySent ? "Palpite enviado" : "Palpites abertos"));
    const statusClass = disabled ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700";
    const adminActions = isDeveloper
      ? '<div class="flex gap-2">' +
          '<button class="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold" data-edit-game="' + escapeHtml(game.id) + '">Editar</button>' +
          '<button class="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700" data-delete-game="' + escapeHtml(game.id) + '">Excluir</button>' +
        '</div>'
      : "";
    const predictionHint = alreadySent
      ? ""
      : Number(game.total_palpites || 0) + " palpite(s) enviado(s)";

    return '<article class="match-card rounded-3xl border border-slate-100 p-5 shadow-soft">' +
      '<div class="flex items-start justify-between gap-3"><div><span class="rounded-full px-3 py-1 text-xs font-extrabold ' + statusClass + '">' + status + '</span>' +
      '<p class="mt-3 text-xs font-bold uppercase tracking-widest text-primary">' + escapeHtml(game.competicao || "Futebol do Brasil") + '</p></div>' + adminActions + '</div>' +
      '<div class="mt-5 grid grid-cols-[1fr,auto,1fr] items-center gap-3 text-center">' +
      '<div>' + teamImage(game.imagem_time_casa, game.time_casa) + '<strong class="text-lg">' + escapeHtml(game.time_casa) + '</strong></div>' +
      '<span class="font-display text-2xl text-slate-400">X</span>' +
      '<div>' + teamImage(game.imagem_time_visitante, game.time_visitante) + '<strong class="text-lg">' + escapeHtml(game.time_visitante) + '</strong></div></div>' +
      '<p class="mt-3 text-center text-sm font-bold text-slate-500">' + escapeHtml(formatDate(game.data_jogo)) + ' às ' + escapeHtml(game.horario_jogo) + '</p>' +
      '<div class="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">Período para palpites: ' +
      escapeHtml(formatDateTime(game.inicio_palpites_iso)) + ' até ' + escapeHtml(formatDateTime(game.fim_palpites_iso)) + '</div>' +
      prizeRulesHtml(game) +
      '<form class="prediction-form mt-5 border-t border-slate-100 pt-4" data-game-id="' + escapeHtml(game.id) + '">' +
      '<p class="text-center text-xs font-bold uppercase tracking-widest text-slate-400">Seu palpite</p>' +
      '<div class="mt-3 flex items-center justify-center gap-3">' +
      '<input aria-label="Gols do time da casa" class="score-input border-slate-200" min="0" max="99" name="gols_casa" required type="number" value="' + escapeHtml(prediction.gols_casa) + '"' + (disabled ? " disabled" : "") + '/>' +
      '<span class="font-display text-xl">x</span>' +
      '<input aria-label="Gols do time visitante" class="score-input border-slate-200" min="0" max="99" name="gols_visitante" required type="number" value="' + escapeHtml(prediction.gols_visitante) + '"' + (disabled ? " disabled" : "") + '/></div>' +
      '<div class="mt-4 text-center"><button class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" type="submit"' + (disabled ? " disabled" : "") + '>Enviar palpite</button>' +
      '<p class="mt-2 text-xs font-semibold text-slate-400">' + escapeHtml(predictionHint) + '</p></div>' +
      '<p class="prediction-message mt-3 hidden rounded-xl px-3 py-2 text-center text-sm font-bold"></p></form>' +
      resultSummaryHtml(game) +
      developerResultHtml(game) +
      developerPredictionsHtml(game) +
      '</article>';
  }

  function renderGames() {
    if (!games.length) {
      gamesList.innerHTML = '<div class="lg:col-span-2 rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center font-semibold text-slate-500">Nenhum jogo cadastrado.</div>';
      return;
    }
    gamesList.innerHTML = games.map(gameHtml).join("");
  }

  function renderSentFirstGoalPredictions() {
    if (!sentFirstGoalList) return;
    const votes = Array.isArray(firstGoalData.palpites_enviados) ? firstGoalData.palpites_enviados : [];
    if (!votes.length) {
      sentFirstGoalList.className = "mt-4";
      sentFirstGoalList.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center font-semibold text-slate-500">Nenhuma escolha enviada.</div>';
      return;
    }
    sentFirstGoalList.className = "mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
    sentFirstGoalList.innerHTML = votes.map(function (item) {
      const selected = Boolean(item.ganhador_selecionado);
      const isHidden = Boolean(item.oculto);
      const roleHtml = item.usuario_funcao ? '<span class="text-xs font-bold text-slate-400">(' + escapeHtml(item.usuario_funcao) + ')</span>' : "";
      const articleClass = selected
        ? "flex h-full flex-col gap-4 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 shadow-sm ring-4 ring-yellow-100"
        : "flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft";
      const crownSvg = selected
        ? '<span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-yellow-900 shadow-sm" title="Palpite ganhador"><svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3.7 8.2 8.6 12l3.1-6.4L15.2 12l5.1-3.8-1.6 10.2H5.3L3.7 8.2Z" fill="currentColor"/><path d="M5.4 20h13.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>'
        : "";
      const winnerBadge = selected ? '<span class="rounded-lg bg-yellow-200 px-3 py-2 text-xs font-extrabold text-yellow-900">Ganhador</span>' : "";
      const playerBlock = isHidden
        ? '<div class="relative flex items-center gap-3 rounded-xl overflow-hidden" style="background:#ecfdf5;padding:12px;"><div style="filter:blur(7px);opacity:0.7;pointer-events:none;display:flex;align-items:center;gap:12px;width:100%;"><div style="height:40px;width:40px;border-radius:50%;background:#a7f3d0;flex-shrink:0;"></div><div><p style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#059669;">Primeiro gol</p><p style="font-size:14px;font-weight:800;color:#065f46;">???</p></div></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:16px;color:#6b7280;">lock</span><span style="font-size:11px;font-weight:700;color:#6b7280;">Oculto até encerrar</span></div></div>'
        : '<div class="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3 text-sm font-extrabold text-emerald-800">' +
          firstGoalPlayerPhotoHtml({ nome: item.jogador_nome, foto_url: item.jogador_foto }, "h-10 w-10 shrink-0") +
          '<div><p class="text-xs uppercase tracking-widest text-emerald-600">Primeiro gol</p><p class="truncate">' + escapeHtml(item.jogador_nome || "Jogador") + '</p></div></div>';
      return '<article class="' + articleClass + '">' +
        '<div class="flex items-center justify-between gap-3"><p class="text-xs font-bold uppercase tracking-widest text-primary">Palpite enviado</p>' +
        '<div class="flex gap-2">' + winnerBadge + '</div></div>' +
        '<div class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">' + userAvatarHtml(item, "h-11 w-11") +
        '<div class="min-w-0 mr-auto"><p class="truncate text-sm font-bold text-slate-900">' + escapeHtml(item.usuario_nome || "Usuario") + '</p>' +
        '<p class="truncate text-xs font-bold text-slate-400">' + roleHtml + '</p></div>' + crownSvg + '</div>' +
        playerBlock +
        '<div class="mt-auto flex items-center gap-2 text-xs font-bold text-slate-500"><span class="material-symbols-outlined text-base">schedule</span>' + escapeHtml(formatDateTime(item.enviado_em_iso)) + '</div>' +
        '</article>';
    }).join("");
  }

  function renderSentPredictions() {
    const rows = [];
    games.forEach(function (game) {
      const predictions = Array.isArray(game.palpites_enviados) ? game.palpites_enviados : [];
      predictions.forEach(function (item) {
        rows.push({ game: game, prediction: item });
      });
    });
    rows.sort(function (left, right) {
      return Date.parse(right.prediction.enviado_em_iso || "") - Date.parse(left.prediction.enviado_em_iso || "");
    });
    if (!rows.length) {
      sentPredictionsList.className = "mt-4";
      sentPredictionsList.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center font-semibold text-slate-500">Nenhum palpite enviado.</div>';
      return;
    }
    sentPredictionsList.className = sentPredictionsView === "cards"
      ? "mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "mt-4 space-y-4";
    sentPredictionsList.innerHTML = rows.map(function (row) {
      const game = row.game;
      const item = row.prediction;
      const userRole = item.usuario_funcao || item.funcao || "";
      const photoHtml = userAvatarHtml(item, "h-12 w-12");
      const cardPhotoHtml = userAvatarHtml(item, "h-10 w-10");
      const roleHtml = userRole ? ' <span class="text-xs font-normal text-slate-400 block sm:inline">(' + escapeHtml(userRole) + ')</span>' : '';
      const cardRoleHtml = userRole ? '<span class="truncate text-xs font-bold text-slate-400">' + escapeHtml(userRole) + '</span>' : '';

      const isMyPrediction = game.meu_palpite && item.id === game.meu_palpite.id;
      const canSeePrediction = isDeveloper || isMyPrediction || (!game.palpite_aberto && game.status_palpites !== "aguardando");
      const selectedWinner = Boolean(item.ganhador_selecionado);
      const scoreHtml = canSeePrediction
        ? escapeHtml(item.gols_casa) + ' x ' + escapeHtml(item.gols_visitante)
        : '<span class="blur-sm select-none opacity-60" title="Palpite oculto">' + escapeHtml(item.gols_casa || "0") + ' x ' + escapeHtml(item.gols_visitante || "0") + '</span>';
      const winnerCrown = selectedWinner
        ? '<span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-yellow-900 shadow-sm" title="Palpite ganhador">' +
          '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3.7 8.2 8.6 12l3.1-6.4L15.2 12l5.1-3.8-1.6 10.2H5.3L3.7 8.2Z" fill="currentColor"/><path d="M5.4 20h13.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</span>'
        : "";
      const articleClass = selectedWinner
        ? "rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 shadow-soft ring-4 ring-yellow-100"
        : "rounded-2xl border border-slate-100 bg-white p-4 shadow-soft";

      if (sentPredictionsView === "cards") {
        return '<article class="' + articleClass + ' flex h-full flex-col gap-4">' +
          '<div class="flex items-start justify-between gap-3">' +
          '<div class="min-w-0"><p class="text-xs font-bold uppercase tracking-widest text-primary">' + escapeHtml(game.competicao || "Futebol do Brasil") + '</p>' +
          '<h3 class="mt-2 flex items-center gap-2 text-base font-extrabold">' + winnerCrown + '<span class="truncate">' + escapeHtml(game.time_casa) + ' x ' + escapeHtml(game.time_visitante) + '</span></h3></div>' +
          '<div class="rounded-xl bg-slate-50 px-3 py-2 text-xl font-extrabold text-slate-900">' + scoreHtml + '</div>' +
          '</div>' +
          '<div class="mt-auto flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">' + cardPhotoHtml +
          '<div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">' + escapeHtml(item.usuario_nome || "Usuario") + '</p>' + cardRoleHtml + '</div></div>' +
          '<div class="flex items-center gap-2 text-xs font-bold text-slate-500"><span class="material-symbols-outlined text-base">schedule</span>' + escapeHtml(formatDateTime(item.enviado_em_iso)) + '</div>' +
          '</article>';
      }

      return '<article class="' + articleClass + '">' +
        '<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">' +
        '<div><p class="text-xs font-bold uppercase tracking-widest text-primary">' + escapeHtml(game.competicao || "Futebol do Brasil") + '</p>' +
        '<h3 class="mt-1 flex flex-wrap items-center gap-2 text-lg font-extrabold">' + winnerCrown + '<span>' + escapeHtml(game.time_casa) + ' ' + scoreHtml + ' ' + escapeHtml(game.time_visitante) + '</span></h3>' +
        '<div class="mt-2 flex items-center gap-2">' + photoHtml + 
        '<p class="text-sm font-semibold text-slate-500">Enviado por <strong class="text-slate-800">' + escapeHtml(item.usuario_nome || "Usuário") + '</strong>' + roleHtml + '</p></div></div>' +
        '<div class="rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"><span class="material-symbols-outlined mr-1 align-middle text-base">schedule</span>' + escapeHtml(formatDateTime(item.enviado_em_iso)) + '</div>' +
        '</div></article>';
    }).join("");
  }

  function renderWinnersHistory() {
    if (!winnersHistoryList) return;
    const finishedGames = games.filter(function (game) {
      const result = game.resultado || {};
      return result.definido || result.ganhador_selecionado;
    });
    finishedGames.sort(function (left, right) {
      const leftResult = left.resultado || {};
      const rightResult = right.resultado || {};
      const leftWinner = leftResult.ganhador_selecionado || {};
      const rightWinner = rightResult.ganhador_selecionado || {};
      const leftDate = Date.parse(leftWinner.selecionado_em_iso || leftResult.definido_em_iso || left.inicio_iso || "");
      const rightDate = Date.parse(rightWinner.selecionado_em_iso || rightResult.definido_em_iso || right.inicio_iso || "");
      return rightDate - leftDate;
    });

    if (!finishedGames.length) {
      winnersHistoryList.innerHTML = '<div class="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center font-semibold text-slate-500">Nenhum ganhador selecionado ainda.</div>';
      return;
    }

    winnersHistoryList.innerHTML = finishedGames.map(function (game) {
      const result = game.resultado || {};
      const selectedWinner = result.ganhador_selecionado || null;
      const winners = selectedWinner ? [selectedWinner] : (Array.isArray(result.ganhadores) ? result.ganhadores : []);
      const outcomeHits = Array.isArray(result.acertos_resultado) ? result.acertos_resultado : [];
      const winnersHtml = winners.length
        ? winners.map(function (item) {
            const photoHtml = userAvatarHtml(item, "h-10 w-10");
            return '<div class="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">' +
              '<span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-yellow-900 shadow-sm">' +
              '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" aria-hidden="true"><path d="M3.7 8.2 8.6 12l3.1-6.4L15.2 12l5.1-3.8-1.6 10.2H5.3L3.7 8.2Z" fill="currentColor"/><path d="M5.4 20h13.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
              '</span>' + photoHtml + '<span>' + escapeHtml(item.usuario_nome || "Usuário") + '</span>' +
              '<span class="rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-xs text-yellow-900">' + escapeHtml(item.gols_casa) + ' x ' + escapeHtml(item.gols_visitante) + '</span></div>';
          }).join("")
        : '<p class="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">Sem ganhador selecionado.</p>';
      const scoreTitle = result.definido
        ? escapeHtml(game.time_casa) + ' ' + escapeHtml(result.gols_casa) + ' x ' + escapeHtml(result.gols_visitante) + ' ' + escapeHtml(game.time_visitante)
        : escapeHtml(game.time_casa) + ' x ' + escapeHtml(game.time_visitante);
      const prizeHistoryHtml = game.descricao_premio
        ? '<div class="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950"><span class="material-symbols-outlined mr-1 align-middle text-base text-amber-700">redeem</span>' + multilineHtml(game.descricao_premio) + '</div>'
        : "";

      return '<article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">' +
        '<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">' +
        '<div><p class="text-xs font-bold uppercase tracking-widest text-primary">' + escapeHtml(game.competicao || "Futebol do Brasil") + '</p>' +
        '<h3 class="mt-1 text-lg font-extrabold">' + scoreTitle + '</h3>' +
        '<p class="mt-1 text-sm font-semibold text-slate-500">' + escapeHtml(formatDate(game.data_jogo)) + ' às ' + escapeHtml(game.horario_jogo) + '</p></div>' +
        '<div class="rounded-xl bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-900">' +
        Number(winners.length) + ' ganhador selecionado / ' + Number(outcomeHits.length) + ' acerto(s) do resultado</div>' +
        '</div>' + prizeHistoryHtml + '<div class="mt-4 flex flex-wrap gap-2">' + winnersHtml + '</div></article>';
    }).join("");
  }

  async function loadGames() {
    gamesList.innerHTML = '<p class="text-slate-500 font-semibold">Carregando jogos...</p>';
    try {
      const payload = await api("/api/dinamicas-pop/jogos");
      games = Array.isArray(payload.jogos) ? payload.jogos : [];
      isDeveloper = Boolean(payload.is_developer);
      developerPanel.classList.toggle("hidden", !isDeveloper);
      renderGames();
      renderSentPredictions();
      renderWinnersHistory();
    } catch (error) {
      gamesList.innerHTML = '<div class="rounded-2xl bg-red-50 p-4 font-bold text-red-700">' + escapeHtml(error.message) + '</div>';
    }
  }

  gameForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const body = {
      time_casa: homeTeamInput.value,
      time_visitante: awayTeamInput.value,
      imagem_time_casa: homeTeamImageInput.value,
      imagem_time_visitante: awayTeamImageInput.value,
      data_jogo: matchDateInput.value,
      horario_jogo: matchTimeInput.value,
      data_inicio_palpites: predictionStartDateInput.value,
      horario_inicio_palpites: predictionStartTimeInput.value,
      data_fim_palpites: predictionEndDateInput.value,
      horario_fim_palpites: predictionEndTimeInput.value,
      competicao: competitionInput.value,
      descricao_premio: prizeDescriptionInput ? prizeDescriptionInput.value : "",
      regras: rulesInput ? rulesInput.value : ""
    };
    try {
      await api("/api/dinamicas-pop/jogos" + (editingGameId ? "/" + encodeURIComponent(editingGameId) : ""), {
        method: editingGameId ? "PUT" : "POST",
        body: JSON.stringify(body)
      });
      resetForm();
      await loadGames();
    } catch (error) {
      setGameFormExpanded(true);
      showFormMessage(error.message, true);
    }
  });

  if (firstGoalPeriodForm) {
    firstGoalPeriodForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        await api("/api/primeiro-gol/periodo", {
          method: "PUT",
          body: JSON.stringify({
            data_inicio_palpites: firstGoalStartDateInput ? firstGoalStartDateInput.value : "",
            horario_inicio_palpites: firstGoalStartTimeInput ? firstGoalStartTimeInput.value : "",
            data_fim_palpites: firstGoalEndDateInput ? firstGoalEndDateInput.value : "",
            horario_fim_palpites: firstGoalEndTimeInput ? firstGoalEndTimeInput.value : "",
            descricao_premio: firstGoalPrizeInput ? firstGoalPrizeInput.value : "",
            regras: firstGoalRulesInput ? firstGoalRulesInput.value : ""
          })
        });
        showFirstGoalFormMessage("Período salvo com sucesso.", false);
        await loadFirstGoal();
      } catch (error) {
        showFirstGoalFormMessage(error.message, true);
      }
    });
  }

  if (firstGoalPlayerForm) {
    firstGoalPlayerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const body = {
        nome: firstGoalPlayerNameInput ? firstGoalPlayerNameInput.value : "",
        foto_url: firstGoalPlayerPhotoInput ? firstGoalPlayerPhotoInput.value : ""
      };
      try {
        await api("/api/primeiro-gol/jogadores" + (editingFirstGoalPlayerId ? "/" + encodeURIComponent(editingFirstGoalPlayerId) : ""), {
          method: editingFirstGoalPlayerId ? "PUT" : "POST",
          body: JSON.stringify(body)
        });
        resetFirstGoalPlayerForm();
        await loadFirstGoal();
      } catch (error) {
        showFirstGoalFormMessage(error.message, true);
      }
    });
  }

  if (firstGoalPlayersList) {
    firstGoalPlayersList.addEventListener("submit", async function (event) {
      const form = event.target.closest(".first-goal-prediction-form");
      if (!form) return;
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      const message = form.querySelector(".first-goal-message");
      const selectedPlayer = (firstGoalData.jogadores || []).find(function (item) {
        return item.id === form.dataset.playerId;
      });
      const playerName = selectedPlayer && selectedPlayer.nome || "jogador selecionado";
      if (!window.confirm("Você está enviando o palpite de que quem fará o primeiro gol do Brasil será " + playerName + ". Depois de confirmar, não será possível alterar. Confirmar envio?")) {
        return;
      }
      if (button) button.disabled = true;
      try {
        await api("/api/primeiro-gol/palpite", {
          method: "POST",
          body: JSON.stringify({ jogador_id: form.dataset.playerId })
        });
        showFirstGoalSuccess(selectedPlayer);
        await loadFirstGoal();
      } catch (error) {
        if (button) button.disabled = false;
        if (message) {
          message.textContent = error.message;
          message.className = "first-goal-message mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700";
        }
      }
    });

    firstGoalPlayersList.addEventListener("click", async function (event) {
      const editButton = event.target.closest("[data-edit-first-goal-player]");
      const deleteButton = event.target.closest("[data-delete-first-goal-player]");
      if (editButton) {
        const player = (firstGoalData.jogadores || []).find(function (item) {
          return item.id === editButton.dataset.editFirstGoalPlayer;
        });
        if (!player) return;
        editingFirstGoalPlayerId = player.id;
        if (firstGoalPlayerNameInput) firstGoalPlayerNameInput.value = player.nome || "";
        if (firstGoalPlayerPhotoInput) firstGoalPlayerPhotoInput.value = player.foto_url || "";
        if (firstGoalSavePlayerLabel) firstGoalSavePlayerLabel.textContent = "Salvar alteracoes";
        if (firstGoalCancelEditBtn) firstGoalCancelEditBtn.classList.remove("hidden");
        if (firstGoalDeveloperPanel) firstGoalDeveloperPanel.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (deleteButton) {
        if (!window.confirm("Excluir este jogador e as escolhas vinculadas a ele?")) return;
        try {
          await api("/api/primeiro-gol/jogadores/" + encodeURIComponent(deleteButton.dataset.deleteFirstGoalPlayer), {
            method: "DELETE"
          });
          await loadFirstGoal();
        } catch (error) {
          window.alert(error.message);
        }
      }
    });
  }

  if (firstGoalVotesList) {
    firstGoalVotesList.addEventListener("click", async function (event) {
      const selectWinnerButton = event.target.closest("[data-select-first-goal-winner]");
      if (selectWinnerButton) {
        event.preventDefault();
        if (!window.confirm("Marcar este palpite como ganhador?")) return;
        try {
          await api("/api/primeiro-gol/ganhador/" + encodeURIComponent(selectWinnerButton.dataset.selectFirstGoalWinner), {
            method: "PUT",
            body: JSON.stringify({})
          });
          await loadFirstGoal();
        } catch (error) {
          window.alert(error.message);
        }
        return;
      }

      const deleteButton = event.target.closest("[data-delete-first-goal-vote]");
      if (!deleteButton) return;
      if (!window.confirm("Excluir a escolha deste colaborador?")) return;
      try {
        await api("/api/primeiro-gol/palpites/" + encodeURIComponent(deleteButton.dataset.deleteFirstGoalVote), {
          method: "DELETE"
        });
        await loadFirstGoal();
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  if (firstGoalWaitCloseBtn) {
    firstGoalWaitCloseBtn.addEventListener("click", function() {
      if (!firstGoalWaitModal || !firstGoalWaitModalCard) return;
      firstGoalWaitModal.classList.add("opacity-0");
      firstGoalWaitModalCard.classList.remove("scale-100");
      firstGoalWaitModalCard.classList.add("scale-95");
      setTimeout(() => firstGoalWaitModal.classList.add("hidden"), 300);
      if (firstGoalWaitInterval) clearInterval(firstGoalWaitInterval);
    });
  }

  function showFirstGoalWaitModal() {
    if (!firstGoalWaitModal || !firstGoalWaitModalCard) return;
    const status = firstGoalData.status_palpites || "nao_configurado";
    if (status !== "aguardando") return;

    const startText = formatDateTime(firstGoalData.inicio_palpites_iso);
    const endText = formatDateTime(firstGoalData.fim_palpites_iso);
    if (firstGoalWaitPeriod) firstGoalWaitPeriod.innerHTML = escapeHtml(startText) + " até " + escapeHtml(endText);
    
    const prize = String(firstGoalData.descricao_premio || "").trim();
    if (firstGoalWaitPrize) {
      if (prize) {
        firstGoalWaitPrize.innerHTML = '<p class="text-xs font-extrabold uppercase tracking-widest text-amber-700"><span class="material-symbols-outlined text-sm align-middle mr-1">redeem</span>Premiação</p><p class="mt-1 text-sm font-bold text-amber-950">' + multilineHtml(prize) + '</p>';
      } else {
        firstGoalWaitPrize.innerHTML = "";
      }
    }
    
    const rules = String(firstGoalData.regras || "").trim();
    if (firstGoalWaitRules) {
      if (rules) {
        firstGoalWaitRules.innerHTML = '<p class="text-xs font-extrabold uppercase tracking-widest text-slate-600"><span class="material-symbols-outlined text-sm align-middle mr-1">rule</span>Regras</p><p class="mt-1 text-sm font-semibold text-slate-700">' + multilineHtml(rules) + '</p>';
      } else {
        firstGoalWaitRules.innerHTML = "";
      }
    }

    firstGoalWaitModal.classList.remove("hidden");
    void firstGoalWaitModal.offsetWidth;
    firstGoalWaitModal.classList.remove("opacity-0");
    firstGoalWaitModalCard.classList.remove("scale-95");
    firstGoalWaitModalCard.classList.add("scale-100");

    if (firstGoalWaitInterval) clearInterval(firstGoalWaitInterval);
    
    function updateCountdown() {
      if (!firstGoalWaitCountdown) return;
      const now = new Date();
      const start = new Date(firstGoalData.inicio_palpites_iso);
      const diff = start.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(firstGoalWaitInterval);
        firstGoalWaitCountdown.innerHTML = "00:00:00";
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      firstGoalWaitCountdown.innerHTML = 
        String(hours).padStart(2, '0') + ":" + 
        String(mins).padStart(2, '0') + ":" + 
        String(secs).padStart(2, '0');
    }
    
    updateCountdown();
    firstGoalWaitInterval = setInterval(updateCountdown, 1000);
  }

  gamesList.addEventListener("submit", async function (event) {
    const developerForm = event.target.closest(".developer-prediction-form");
    if (developerForm) {
      event.preventDefault();
      try {
        await api("/api/dinamicas-pop/jogos/" + encodeURIComponent(developerForm.dataset.gameId) +
          "/palpites/" + encodeURIComponent(developerForm.dataset.predictionId), {
          method: "PUT",
          body: JSON.stringify({
            gols_casa: developerForm.elements.gols_casa.value,
            gols_visitante: developerForm.elements.gols_visitante.value
          })
        });
        await loadGames();
      } catch (error) {
        window.alert(error.message);
      }
      return;
    }

    const resultForm = event.target.closest(".developer-result-form");
    if (resultForm) {
      event.preventDefault();
      try {
        await api("/api/dinamicas-pop/jogos/" + encodeURIComponent(resultForm.dataset.gameId) + "/resultado", {
          method: "PUT",
          body: JSON.stringify({
            gols_casa: resultForm.elements.gols_casa.value,
            gols_visitante: resultForm.elements.gols_visitante.value
          })
        });
        await loadGames();
      } catch (error) {
        window.alert(error.message);
      }
      return;
    }

    const form = event.target.closest(".prediction-form");
    if (!form) return;
    event.preventDefault();
    const message = form.querySelector(".prediction-message");
    const button = form.querySelector("button[type=submit]");
    const homeScore = form.elements.gols_casa.value;
    const awayScore = form.elements.gols_visitante.value;
    const submittedGame = games.find(function (item) {
      return item.id === form.dataset.gameId;
    });
    button.disabled = true;
    try {
      await api("/api/dinamicas-pop/jogos/" + encodeURIComponent(form.dataset.gameId) + "/palpite", {
        method: "POST",
        body: JSON.stringify({
          gols_casa: homeScore,
          gols_visitante: awayScore
        })
      });
      showPredictionSuccess(submittedGame, homeScore, awayScore);
      await loadGames();
    } catch (error) {
      button.disabled = false;
      message.textContent = error.message;
      message.className = "prediction-message mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-700";
    }
  });

  gamesList.addEventListener("click", async function (event) {
    const selectWinnerButton = event.target.closest("[data-select-winner]");
    if (selectWinnerButton) {
      event.preventDefault();
      const form = selectWinnerButton.closest(".developer-prediction-form");
      if (!form || !window.confirm("Marcar este palpite como ganhador?")) return;
      try {
        await api("/api/dinamicas-pop/jogos/" + encodeURIComponent(form.dataset.gameId) +
          "/ganhador/" + encodeURIComponent(form.dataset.predictionId), {
            method: "PUT",
            body: JSON.stringify({})
          });
        await loadGames();
      } catch (error) {
        window.alert(error.message);
      }
      return;
    }

    const deletePredictionButton = event.target.closest("[data-delete-prediction]");
    if (deletePredictionButton) {
      event.preventDefault();
      const form = deletePredictionButton.closest(".developer-prediction-form");
      if (!form || !window.confirm("Excluir o palpite deste usuário?")) return;
      try {
        await api("/api/dinamicas-pop/jogos/" + encodeURIComponent(form.dataset.gameId) +
          "/palpites/" + encodeURIComponent(form.dataset.predictionId) + (form.dataset.deleteQuery || ""), {
            method: "DELETE"
          });
        await loadGames();
      } catch (error) {
        window.alert(error.message);
      }
      return;
    }

    const editButton = event.target.closest("[data-edit-game]");
    const deleteButton = event.target.closest("[data-delete-game]");
    if (editButton) {
      const game = games.find(function (item) { return item.id === editButton.dataset.editGame; });
      if (!game) return;
      editingGameId = game.id;
      homeTeamInput.value = game.time_casa;
      awayTeamInput.value = game.time_visitante;
      homeTeamImageInput.value = game.imagem_time_casa || "";
      awayTeamImageInput.value = game.imagem_time_visitante || "";
      matchDateInput.value = game.data_jogo;
      matchTimeInput.value = game.horario_jogo;
      const predictionStart = splitIsoDateTime(game.inicio_palpites_iso);
      const predictionEnd = splitIsoDateTime(game.fim_palpites_iso);
      predictionStartDateInput.value = predictionStart.date;
      predictionStartTimeInput.value = predictionStart.time;
      predictionEndDateInput.value = predictionEnd.date;
      predictionEndTimeInput.value = predictionEnd.time;
      competitionInput.value = game.competicao || "";
      if (prizeDescriptionInput) prizeDescriptionInput.value = game.descricao_premio || "";
      if (rulesInput) rulesInput.value = game.regras || "";
      saveGameLabel.textContent = "Salvar alterações";
      cancelEditBtn.classList.remove("hidden");
      setGameFormExpanded(true);
      developerPanel.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (deleteButton) {
      if (!window.confirm("Excluir este jogo e todos os palpites enviados?")) return;
      try {
        await api("/api/dinamicas-pop/jogos/" + encodeURIComponent(deleteButton.dataset.deleteGame), {
          method: "DELETE"
        });
        await loadGames();
      } catch (error) {
        window.alert(error.message);
      }
    }
  });

  async function refreshDynamics() {
    await Promise.all([loadGames(), loadFirstGoal()]);
  }

  cancelEditBtn.addEventListener("click", resetForm);
  if (gameFormToggleBtn) {
    gameFormToggleBtn.addEventListener("click", function () {
      setGameFormExpanded(gameFormToggleBtn.getAttribute("aria-expanded") !== "true");
    });
  }
  if (sentPredictionsToggleBtn) {
    sentPredictionsToggleBtn.addEventListener("click", function () {
      setSentPredictionsExpanded(sentPredictionsToggleBtn.getAttribute("aria-expanded") !== "true");
    });
  }
  if (sentFirstGoalToggleBtn) {
    sentFirstGoalToggleBtn.addEventListener("click", function () {
      const expanded = sentFirstGoalToggleBtn.getAttribute("aria-expanded") === "true";
      sentFirstGoalContent.classList.toggle("hidden", expanded);
      sentFirstGoalToggleBtn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (sentFirstGoalToggleIcon) sentFirstGoalToggleIcon.textContent = expanded ? "expand_more" : "expand_less";
    });
  }
  if (firstGoalCancelEditBtn) firstGoalCancelEditBtn.addEventListener("click", resetFirstGoalPlayerForm);
  refreshGamesBtn.addEventListener("click", refreshDynamics);
  predictionSuccessCloseBtn.addEventListener("click", closePredictionSuccess);
  predictionSuccessModal.addEventListener("click", function (event) {
    if (event.target === predictionSuccessModal) {
      closePredictionSuccess();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && predictionSuccessModal.classList.contains("is-open")) {
      closePredictionSuccess();
    }
  });
  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selected = button.dataset.tabButton;
      tabButtons.forEach(function (item) {
        const active = item.dataset.tabButton === selected;
        item.classList.toggle("border-primary", active);
        item.classList.toggle("text-primary", active);
        item.classList.toggle("border-transparent", !active);
        item.classList.toggle("text-slate-500", !active);
      });
      tabPanels.forEach(function (panel) {
        panel.classList.toggle("hidden", panel.dataset.tabPanel !== selected);
      });
    });
  });
  setupSentViewControls();
  refreshDynamics();
});
