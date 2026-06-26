document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.getElementById("usersTableBody");
  const searchInput = document.getElementById("searchInput");
  const usersCountEl = document.getElementById("usersCount");
  const sourceInfoEl = document.getElementById("sourceInfo");
  const lastUpdateEl = document.getElementById("lastUpdate");
  const refreshBtn = document.getElementById("refreshBtn");
  const refreshBtnLabel = document.getElementById("refreshBtnLabel");
  const usersEmailCountEl = document.getElementById("usersEmailCount");
  const usersRolesCountEl = document.getElementById("usersRolesCount");

  if (!tableBody) {
    return;
  }

  const apiBase = String(window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com").replace(/\/+$/, "");
  function buildApiUrl(path) {
    const cleanPath = path.startsWith("/") ? path : ("/" + path);
    return apiBase + cleanPath;
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

  function userInitials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (!parts.length) return "SP";
    return parts.map(function (part) { return part.charAt(0).toUpperCase(); }).join("");
  }

  function isPendingRole(role) {
    const normalized = String(role || "").trim().toLowerCase();
    return !normalized || normalized === "função pendente" || normalized === "funcao pendente";
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
    if (usersCountEl) usersCountEl.textContent = String(filtered.length || state.users.length);
    if (usersEmailCountEl) {
      usersEmailCountEl.textContent = String(filtered.filter(function (user) {
        const email = String(user.email || "").trim();
        return email && email !== "-";
      }).length);
    }
    if (usersRolesCountEl) {
      const roles = new Set(filtered
        .map(function (user) { return String(user.funcao || "").trim(); })
        .filter(function (role) { return role && !isPendingRole(role); })
        .map(function (role) { return role.toLowerCase(); }));
      usersRolesCountEl.textContent = String(roles.size);
    }
    if (!filtered.length) {
      showTableMessage("Nenhum usuário encontrado.", "text-slate-500");
      return;
    }
    tableBody.innerHTML = filtered
      .map(function (user) {
        const phone = String(user.telefone || "").trim();
        const email = String(user.email || "").trim();
        const rolePending = isPendingRole(user.funcao);
        return (
          '<tr>' +
            '<td class="py-4 pl-5 pr-4 align-top">' +
              '<div class="flex min-w-[220px] items-center gap-3">' +
                '<span class="user-avatar">' + escapeHtml(userInitials(user.nome)) + '</span>' +
                '<div class="min-w-0">' +
                  '<p class="truncate font-extrabold text-slate-900">' + escapeHtml(user.nome || "-") + '</p>' +
                  '<p class="mt-0.5 text-xs font-bold text-slate-400">Usuário cadastrado</p>' +
                '</div>' +
              '</div>' +
            "</td>" +
            '<td class="py-4 pr-4 align-top">' +
              '<span class="contact-pill' + (phone ? "" : " empty") + '">' + escapeHtml(phone || "-") + '</span>' +
            "</td>" +
            '<td class="py-4 pr-4 align-top">' +
              '<span class="role-pill' + (rolePending ? " pending" : "") + '">' + escapeHtml(user.funcao || "Função pendente") + '</span>' +
            "</td>" +
            '<td class="py-4 pr-5 align-top">' +
              '<span class="font-bold ' + (email && email !== "-" ? "text-slate-700" : "text-slate-400") + '">' + escapeHtml(email || "-") + '</span>' +
            "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function fetchUsers() {
    setLoading(true);
    showTableMessage("Carregando usuários...");
    fetch(buildApiUrl("/api/admin/users"), { credentials: "include", cache: "no-store" })
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
