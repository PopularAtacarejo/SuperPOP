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
          '<tr class="hover:bg-slate-50 dark:hover:bg-gray-800">' +
            '<td class="py-4 pr-4 align-top">' + escapeHtml(user.nome || "-") + "</td>" +
            '<td class="py-4 pr-4 align-top font-semibold text-slate-600">' + escapeHtml(user.telefone || "-") + "</td>" +
            '<td class="py-4 pr-4 align-top font-semibold text-slate-600">' + escapeHtml(user.funcao || "-") + "</td>" +
            '<td class="py-4 align-top font-semibold text-slate-600">' + escapeHtml(user.email || "-") + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function fetchUsers() {
    setLoading(true);
    showTableMessage("Carregando usuários...");
    fetch("/api/admin/users", { credentials: "include", cache: "no-store" })
      .then(function (response) {
        if (response.status === 401) {
          window.location.href = "index.html";
          return null;
        }
        if (response.status === 403) {
          window.location.href = "superpop.html";
          return null;
        }
        return response.json().catch(function () { return {}; });
      })
      .then(function (payload) {
        if (!payload) return;
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
      })
      .catch(function (error) {
        console.error(error);
        showTableMessage(error && error.message ? escapeHtml(error.message) : "Não foi possível carregar os usuários.", "text-red-600");
      })
      .finally(function () {
        setLoading(false);
      });
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
