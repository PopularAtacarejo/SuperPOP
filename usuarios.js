document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("usersTableBody");
  const searchInput = document.getElementById("searchInput");
  const usersCountEl = document.getElementById("usersCount");
  const sourceInfoEl = document.getElementById("sourceInfo");
  const lastUpdateEl = document.getElementById("lastUpdate");
  const refreshBtn = document.getElementById("refreshBtn");
  const refreshBtnLabel = document.getElementById("refreshBtnLabel");

  if (!tableBody) {
    return;
  }

  const apiBase = String(window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com").replace(/\/+$/, "");
  function buildApiUrl(path) {
    const cleanPath = path.startsWith("/") ? path : ("/" + path);
    return apiBase + cleanPath;
  }
  const USER_DATA_SOURCES = [
    "https://raw.githubusercontent.com/PopularAtacarejo/SuperPOP/main/Funcioinarios.json",
    apiBase + "/Funcioinarios.json",
    "./Funcioinarios.json",
  ];

  let state = {
    users: [],
    generatedAt: "",
    sourceCount: 0,
  };

  function setLoading(isLoading) {
    if (refreshBtn) refreshBtn.disabled = isLoading;
    if (refreshBtnLabel) refreshBtnLabel.textContent = isLoading ? "Atualizando..." : "Atualizar";
  }

  function showTableMessage(message, variant = "text-slate-400") {
    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td class="py-10 text-center ${variant}" colspan="4">${message}</td></tr>`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateTime(value) {
    if (!value) return "--/--/----";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--/--/----";
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function renderSourceInfo(payload) {
    if (!sourceInfoEl || !payload) return;
    const source = payload.fonte && payload.fonte.usuarios ? payload.fonte.usuarios : {};
    const typeLabel = String(source.tipo || "Local").toUpperCase();
    const total = Number(source.local_total || state.sourceCount || 0);
    sourceInfoEl.textContent = total
      ? `Fonte: ${typeLabel} • ${total} registros`
      : `Fonte: ${typeLabel}`;
  }

  function renderUsersList() {
    if (!tableBody) return;
    const term = String(searchInput && searchInput.value || "").trim().toLowerCase();
    const filtered = state.users.filter(function (user) {
      if (!term) return true;
      const haystack = [
        user.nome,
        user.telefone,
        user.funcao,
        user.email
      ].map(function (value) { return String(value || "").toLowerCase(); });
      return haystack.some(function (value) { return value.includes(term); });
    });
    usersCountEl.textContent = String(filtered.length || state.users.length);
    if (!filtered.length) {
      showTableMessage("Nenhum usuário encontrado.", "text-slate-500");
      return;
    }
    tableBody.innerHTML = filtered
      .map(function (user) {
        return (
          '<tr class="bg-white transition-colors hover:bg-slate-50">' +
            '<td class="py-4 pr-4 align-top">' + escapeHtml(user.nome || "-") + "</td>" +
            '<td class="py-4 pr-4 align-top font-semibold text-slate-600">' + escapeHtml(user.telefone || "-") + "</td>" +
            '<td class="py-4 pr-4 align-top font-semibold text-slate-600">' + escapeHtml(user.funcao || "-") + "</td>" +
            '<td class="py-4 align-top font-semibold text-slate-600">' + escapeHtml(user.email || "-") + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  async function fetchFirstJsonArray(sources) {
    for (const source of (Array.isArray(sources) ? sources : [])) {
      if (!source) continue;
      try {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) continue;
        const payload = await response.json().catch(function () { return null; });
        if (!payload) continue;
        if (Array.isArray(payload)) {
          return payload;
        }
        if (payload && Array.isArray(payload.funcionarios)) {
          return payload.funcionarios;
        }
      } catch (_err) {
        /* try next source */
      }
    }
    throw new Error("Nenhuma fonte local disponível.");
  }

  async function loadLocalUsers() {
    const entries = await fetchFirstJsonArray(USER_DATA_SOURCES);
    const safeEntries = Array.isArray(entries) ? entries : [];
    state = {
      users: safeEntries,
      generatedAt: new Date().toISOString(),
      sourceCount: safeEntries.length,
    };
    renderUsersList();
    renderSourceInfo({
      fonte: {
        usuarios: {
          tipo: "Local",
          total: safeEntries.length,
          local_total: safeEntries.length,
        },
      },
    });
    if (lastUpdateEl) {
      lastUpdateEl.textContent = formatDateTime(state.generatedAt);
    }
  }

  async function fetchUsers() {
    setLoading(true);
    showTableMessage("Carregando usuários...");
    try {
      const response = await fetch(buildApiUrl("/api/admin/users"), { credentials: "include", cache: "no-store" });
      if (response.status === 401) {
        throw new Error("Não autenticado");
      }
      if (response.status === 403) {
        throw new Error("Sem permição");
      }
      const payload = await response.json().catch(function () { return {}; });
      if (!payload.ok) {
        throw new Error(payload.error || "Erro ao carregar usuários.");
      }
      state = {
        users: Array.isArray(payload.usuarios) ? payload.usuarios : [],
        generatedAt: String(payload.gerado_em || ""),
        sourceCount: (payload.resumo && Number(payload.resumo.total_usuarios)) || (payload.usuarios || []).length,
      };
      renderUsersList();
      renderSourceInfo(payload);
      if (lastUpdateEl) {
        lastUpdateEl.textContent = formatDateTime(state.generatedAt);
      }
    } catch (error) {
      console.warn("Falha ao carregar usuários via API:", error);
      showTableMessage("Não foi possível carregar a API. Exibindo dados locais.", "text-slate-500");
      try {
        await loadLocalUsers();
      } catch (localError) {
        console.error(localError);
        showTableMessage(localError && localError.message ? escapeHtml(localError.message) : "Não foi possível carregar os usuários.", "text-red-600");
      }
    } finally {
      setLoading(false);
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      fetchUsers();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderUsersList();
    });
  }

  fetchUsers();
});
