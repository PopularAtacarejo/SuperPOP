document.addEventListener("DOMContentLoaded", function () {
  const apiBase = String(window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com").replace(/\/+$/, "");
  const frontendBase = String(window.SUPERPOP_FRONTEND_URL || "https://popularatacarejo.github.io/SuperPOP").replace(/\/+$/, "");
  const PHONE_REGEX = /^\(\d{2}\)\s9\s\d{4}\s-\s\d{4}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const authUserBtn = document.getElementById("authUserBtn");
  const authUserDropdown = document.getElementById("authUserDropdown");
  const authLogoutBtn = document.getElementById("authLogoutBtn");
  const analyticsSection = document.getElementById("analyticsSection");
  const analyticsNavItem = document.getElementById("analyticsNavItem");
  const manageUsersNavItem = document.getElementById("manageUsersNavItem");
  const editUsersNavItem = document.getElementById("editUsersNavItem");
  const authUserAvatarImage = document.getElementById("authUserAvatarImage");
  const authUserAvatarFallback = document.getElementById("authUserAvatarFallback");
  const nameTargets = [document.getElementById("authUserName"), document.getElementById("authUserNameDetail")];
  const roleTargets = [document.getElementById("authUserRole"), document.getElementById("authUserRoleDetail")];
  const usersTableBody = document.getElementById("usersTableBody");
  const usersCount = document.getElementById("usersCount");
  const searchInput = document.getElementById("searchInput");
  const lastUpdate = document.getElementById("lastUpdate");
  const refreshBtn = document.getElementById("refreshBtn");
  const refreshBtnLabel = document.getElementById("refreshBtnLabel");
  const editForm = document.getElementById("editForm");
  const nomeInput = document.getElementById("nomeInput");
  const telefoneInput = document.getElementById("telefoneInput");
  const funcaoInput = document.getElementById("funcaoInput");
  const emailInput = document.getElementById("emailInput");
  const senhaInput = document.getElementById("senhaInput");
  const accessLevelInput = document.getElementById("accessLevelInput");
  const tagsContainer = document.getElementById("tagsContainer");
  const selectedHint = document.getElementById("selectedHint");
  const statusError = document.getElementById("statusError");
  const statusSuccess = document.getElementById("statusSuccess");
  const saveBtn = document.getElementById("saveBtn");
  const saveBtnLabel = document.getElementById("saveBtnLabel");
  const deleteBtn = document.getElementById("deleteBtn");
  const deleteBtnLabel = document.getElementById("deleteBtnLabel");
  const clearBtn = document.getElementById("clearBtn");

  let allUsers = [];
  let selectedUserId = "";

  function resolveOrigin(value) {
    try {
      return new URL(String(value || "")).origin.toLowerCase();
    } catch (_err) {
      return "";
    }
  }

  function buildFrontendUrl(path) {
    const cleanPath = String(path || "").replace(/^\/+/, "");
    const currentOrigin = String(window.location.origin || "").toLowerCase();
    const apiOrigin = resolveOrigin(apiBase);
    if (apiOrigin && currentOrigin && apiOrigin === currentOrigin) return cleanPath ? "/" + cleanPath : "/";
    return frontendBase ? frontendBase + "/" + cleanPath : (cleanPath || ".");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initialsFromName(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return "SP";
    return parts.map(function (part) { return part.charAt(0).toUpperCase(); }).join("");
  }

  function renderUserAvatar(photoDataUrl, name) {
    if (!authUserAvatarImage || !authUserAvatarFallback) return;
    const safePhoto = String(photoDataUrl || "").trim();
    if (safePhoto) {
      authUserAvatarImage.src = safePhoto;
      authUserAvatarImage.classList.remove("hidden");
      authUserAvatarFallback.classList.add("hidden");
      return;
    }
    authUserAvatarImage.removeAttribute("src");
    authUserAvatarImage.classList.add("hidden");
    authUserAvatarFallback.textContent = initialsFromName(name);
    authUserAvatarFallback.classList.remove("hidden");
  }

  function setUserView(user) {
    const safeName = String((user && user.nome) || "").trim() || "Usu\u00e1rio";
    const safeRole = String((user && user.funcao) || "").trim() || "Sem fun\u00e7\u00e3o";
    nameTargets.forEach(function (el) { if (el) el.textContent = safeName; });
    roleTargets.forEach(function (el) { if (el) el.textContent = safeRole; });
    renderUserAvatar(user && user.foto_perfil_data_url, safeName);
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function clearMessages() {
    statusError.classList.add("hidden");
    statusSuccess.classList.add("hidden");
  }

  function showError(message) {
    statusSuccess.classList.add("hidden");
    statusError.textContent = message;
    statusError.classList.remove("hidden");
  }

  function showSuccess(message) {
    statusError.classList.add("hidden");
    statusSuccess.textContent = message;
    statusSuccess.classList.remove("hidden");
  }

  function setLoading(isLoading) {
    refreshBtn.disabled = isLoading;
    refreshBtnLabel.textContent = isLoading ? "Atualizando..." : "Atualizar";
  }

  function setSaving(isSaving) {
    saveBtn.disabled = isSaving || !selectedUserId;
    if (deleteBtn) deleteBtn.disabled = isSaving || !selectedUserId;
    saveBtnLabel.textContent = isSaving ? "Salvando..." : "Salvar altera\u00e7\u00f5es";
    if (deleteBtnLabel && !isSaving) deleteBtnLabel.textContent = "Excluir conta";
  }

  function setDeleting(isDeleting) {
    saveBtn.disabled = isDeleting || !selectedUserId;
    if (deleteBtn) deleteBtn.disabled = isDeleting || !selectedUserId;
    saveBtnLabel.textContent = "Salvar altera\u00e7\u00f5es";
    if (deleteBtnLabel) deleteBtnLabel.textContent = isDeleting ? "Excluindo..." : "Excluir conta";
  }

  function formatPhoneMask(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return "(" + digits;
    if (digits.length <= 3) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    if (digits.length <= 7) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 3) + " " + digits.slice(3);
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 3) + " " + digits.slice(3, 7) + " - " + digits.slice(7, 11);
  }

  function shouldFormatAsPhone(value) {
    return /^[\d()\s-]*$/.test(String(value || ""));
  }

  function getAccessLevelFromTags(tags) {
    const normalizedTags = Array.isArray(tags) ? tags.map(function (tag) {
      return String(tag || "").trim().toLowerCase();
    }) : [];
    if (normalizedTags.indexOf("developer") >= 0 || normalizedTags.indexOf("dev") >= 0) return "dev";
    if (normalizedTags.indexOf("admin") >= 0) return "admin";
    return "user";
  }

  function getTagsFromAccessLevel(level) {
    if (level === "dev") return ["developer"];
    if (level === "admin") return ["admin"];
    return [];
  }

  function formatTagLabel(tag) {
    if (String(tag || "").toLowerCase() === "developer") return "dev";
    return String(tag || "");
  }

  function renderTags(tags) {
    const items = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (!items.length) {
      tagsContainer.innerHTML = '<span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-400">Sem tags</span>';
      return;
    }
    tagsContainer.innerHTML = items.map(function (tag) {
      return '<span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">' + escapeHtml(formatTagLabel(tag)) + "</span>";
    }).join("");
  }

  function currentFilteredUsers() {
    const term = normalizeText(searchInput.value || "").trim();
    if (!term) return allUsers.slice();
    return allUsers.filter(function (user) {
      return [user.nome, user.telefone, user.funcao, user.email].some(function (value) {
        return normalizeText(value).indexOf(term) >= 0;
      });
    });
  }

  function fillForm(user) {
    selectedUserId = String((user && user.id) || "");
    nomeInput.value = String((user && user.nome) || "");
    telefoneInput.value = String((user && user.telefone) || "");
    funcaoInput.value = String((user && user.funcao) || "");
    emailInput.value = String((user && user.email) || "");
    senhaInput.value = "";
    accessLevelInput.value = getAccessLevelFromTags(user && user.tags_acesso);
    selectedHint.textContent = selectedUserId ? "Editando: " + String((user && user.nome) || "Usu\u00e1rio") : "Selecione um usu\u00e1rio na tabela para editar.";
    renderTags(getTagsFromAccessLevel(accessLevelInput.value));
    clearMessages();
    setSaving(false);
  }

  function clearForm() {
    selectedUserId = "";
    nomeInput.value = "";
    telefoneInput.value = "";
    funcaoInput.value = "";
    emailInput.value = "";
    senhaInput.value = "";
    accessLevelInput.value = "user";
    selectedHint.textContent = "Selecione um usu\u00e1rio na tabela para editar.";
    renderTags([]);
    clearMessages();
    setSaving(false);
    renderUsers(currentFilteredUsers());
  }

  function renderUsers(items) {
    const rows = Array.isArray(items) ? items : [];
    usersCount.textContent = String(rows.length);
    if (!rows.length) {
      usersTableBody.innerHTML = '<tr><td class="py-10 text-center text-slate-400" colspan="5">Nenhum usu\u00e1rio encontrado.</td></tr>';
      return;
    }
    usersTableBody.innerHTML = rows.map(function (user) {
      const isSelected = String(user.id || "") === selectedUserId;
      return "<tr class=\"" + (isSelected ? "bg-rose-50/70" : "") + "\">"
        + '<td class="py-4 pr-4 align-top"><div class="font-bold text-slate-900">' + escapeHtml(user.nome || "-") + "</div></td>"
        + '<td class="py-4 pr-4 align-top font-semibold text-slate-500">' + escapeHtml(user.telefone || "-") + "</td>"
        + '<td class="py-4 pr-4 align-top font-semibold text-slate-500">' + escapeHtml(user.funcao || "-") + "</td>"
        + '<td class="py-4 pr-4 align-top font-semibold text-slate-500">' + escapeHtml(user.email || "-") + "</td>"
        + '<td class="py-4 align-top"><button class="inline-flex items-center gap-2 rounded-xl ' + (isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-700") + ' px-3 py-2 text-xs font-bold" data-user-id="' + escapeHtml(user.id || "") + '" type="button"><span class="material-symbols-outlined text-base">edit</span>' + (isSelected ? "Editando" : "Editar") + "</button></td>"
        + "</tr>";
    }).join("");
  }

  async function loadSession() {
    const response = await fetch(apiBase + "/api/auth/me", { cache: "no-store", credentials: "include" });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok || !payload.ok || !payload.usuario) {
      const authError = new Error("N\u00e3o autenticado");
      authError.code = "unauthenticated";
      throw authError;
    }
    if (!payload.permissoes || !payload.permissoes.edit_users) {
      const permissionError = new Error("Sem permiss\u00e3o");
      permissionError.code = "forbidden";
      throw permissionError;
    }
    if (analyticsSection && (payload.permissoes.analytics || payload.permissoes.manage_users || payload.permissoes.edit_users)) {
      analyticsSection.classList.remove("hidden");
    }
    if (analyticsNavItem && payload.permissoes.analytics) analyticsNavItem.classList.remove("hidden");
    if (manageUsersNavItem && payload.permissoes.manage_users) manageUsersNavItem.classList.remove("hidden");
    if (editUsersNavItem && payload.permissoes.edit_users) editUsersNavItem.classList.remove("hidden");
    setUserView(payload.usuario);
  }

  async function loadUsers() {
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(apiBase + "/api/dev/users", { cache: "no-store", credentials: "include" });
      const payload = await response.json().catch(function () { return {}; });
      if (response.status === 403) {
        window.location.href = buildFrontendUrl("superpop.html");
        return;
      }
      if (!response.ok || !payload.ok) throw new Error(String(payload.error || "Falha ao carregar usu\u00e1rios."));
      allUsers = Array.isArray(payload.usuarios) ? payload.usuarios : [];
      lastUpdate.textContent = new Date().toLocaleString("pt-BR");
      renderUsers(currentFilteredUsers());
      if (selectedUserId) {
        const selected = allUsers.find(function (user) { return String(user.id || "") === selectedUserId; });
        if (selected) fillForm(selected);
        else clearForm();
      }
    } catch (err) {
      const message = String((err && err.message) || "Erro inesperado.");
      usersCount.textContent = "0";
      usersTableBody.innerHTML = '<tr><td class="py-10 text-center text-red-500" colspan="5">' + escapeHtml(message) + "</td></tr>";
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSelectedUser() {
    clearMessages();
    if (!selectedUserId) {
      showError("Selecione um usu\u00e1rio para editar.");
      return;
    }

    const nome = String(nomeInput.value || "").trim();
    const telefone = String(telefoneInput.value || "").trim();
    const funcao = String(funcaoInput.value || "").trim();
    const email = String(emailInput.value || "").trim().toLowerCase();
    const senha = String(senhaInput.value || "");
    const tagsAcesso = getTagsFromAccessLevel(accessLevelInput.value);

    if (nome.length < 3) {
      showError("Informe um nome v\u00e1lido com pelo menos 3 caracteres.");
      return;
    }
    if (!PHONE_REGEX.test(telefone)) {
      showError("N\u00famero de celular inv\u00e1lido. Use o formato (xx) 9 0000 - 0000.");
      return;
    }
    if (funcao.length < 2) {
      showError("Informe uma fun\u00e7\u00e3o v\u00e1lida.");
      return;
    }
    if (email && !EMAIL_REGEX.test(email)) {
      showError("Informe um e-mail v\u00e1lido.");
      return;
    }
    if (senha && senha.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(apiBase + "/api/dev/users/" + encodeURIComponent(selectedUserId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: nome,
          numero_celular: telefone,
          funcao: funcao,
          email: email,
          senha: senha,
          tags_acesso: tagsAcesso
        })
      });
      const payload = await response.json().catch(function () { return {}; });
      if (response.status === 403) {
        window.location.href = buildFrontendUrl("superpop.html");
        return;
      }
      if (!response.ok || !payload.ok) throw new Error(String(payload.error || "Falha ao atualizar usu\u00e1rio."));

      const updatedUser = payload.usuario || {};
      allUsers = allUsers.map(function (user) {
        return String(user.id || "") === String(updatedUser.id || "") ? updatedUser : user;
      });
      allUsers.sort(function (a, b) {
        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" });
      });
      fillForm(updatedUser);
      renderUsers(currentFilteredUsers());
      showSuccess(String(payload.warning || "Usu\u00e1rio atualizado com sucesso."));
      lastUpdate.textContent = new Date().toLocaleString("pt-BR");
    } catch (err) {
      showError(String((err && err.message) || "Erro ao atualizar usu\u00e1rio."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedUser() {
    clearMessages();
    if (!selectedUserId) {
      showError("Selecione um usu\u00e1rio para excluir.");
      return;
    }

    const selected = allUsers.find(function (user) {
      return String(user.id || "") === selectedUserId;
    });
    const selectedName = String((selected && selected.nome) || "este usu\u00e1rio");
    const confirmed = window.confirm('Tem certeza que deseja excluir a conta de "' + selectedName + '"? Essa a\u00e7\u00e3o n\u00e3o pode ser desfeita.');
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(apiBase + "/api/dev/users/" + encodeURIComponent(selectedUserId), {
        method: "DELETE",
        credentials: "include"
      });
      const payload = await response.json().catch(function () { return {}; });
      if (response.status === 403) {
        window.location.href = buildFrontendUrl("superpop.html");
        return;
      }
      if (!response.ok || !payload.ok) throw new Error(String(payload.error || "Falha ao excluir usu\u00e1rio."));

      allUsers = allUsers.filter(function (user) {
        return String(user.id || "") !== selectedUserId;
      });
      allUsers.sort(function (a, b) {
        return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" });
      });

      const warning = String(payload.warning || "").trim();
      clearForm();
      renderUsers(currentFilteredUsers());
      showSuccess(warning || ("Conta de " + selectedName + " exclu\u00edda com sucesso."));
      lastUpdate.textContent = new Date().toLocaleString("pt-BR");
    } catch (err) {
      showError(String((err && err.message) || "Erro ao excluir usu\u00e1rio."));
    } finally {
      setDeleting(false);
    }
  }

  authUserBtn.addEventListener("click", function () {
    const isOpen = authUserDropdown.classList.contains("open");
    authUserDropdown.classList.toggle("open", !isOpen);
    authUserBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", function (event) {
    if (!authUserDropdown.contains(event.target) && !authUserBtn.contains(event.target)) {
      authUserDropdown.classList.remove("open");
      authUserBtn.setAttribute("aria-expanded", "false");
    }
  });

  authLogoutBtn.addEventListener("click", async function () {
    try { await fetch(apiBase + "/api/auth/logout", { method: "POST", credentials: "include" }); } catch (_err) {}
    try { localStorage.removeItem("superpop_auth_user"); } catch (_err) {}
    window.location.href = buildFrontendUrl("index.html");
  });

  telefoneInput.addEventListener("input", function () {
    const currentValue = String(telefoneInput.value || "");
    if (currentValue.indexOf("@") >= 0 || !shouldFormatAsPhone(currentValue)) return;
    const cursorAtEnd = telefoneInput.selectionStart === telefoneInput.value.length;
    telefoneInput.value = formatPhoneMask(currentValue);
    if (cursorAtEnd) telefoneInput.setSelectionRange(telefoneInput.value.length, telefoneInput.value.length);
  });

  accessLevelInput.addEventListener("change", function () {
    renderTags(getTagsFromAccessLevel(accessLevelInput.value));
  });

  searchInput.addEventListener("input", function () {
    renderUsers(currentFilteredUsers());
  });

  usersTableBody.addEventListener("click", function (event) {
    const target = event.target.closest("[data-user-id]");
    if (!target) return;
    const wantedId = String(target.getAttribute("data-user-id") || "");
    const selected = allUsers.find(function (user) { return String(user.id || "") === wantedId; });
    if (!selected) return;
    fillForm(selected);
    renderUsers(currentFilteredUsers());
  });

  editForm.addEventListener("submit", function (event) {
    event.preventDefault();
    saveSelectedUser();
  });

  clearBtn.addEventListener("click", clearForm);
  if (deleteBtn) deleteBtn.addEventListener("click", deleteSelectedUser);
  refreshBtn.addEventListener("click", loadUsers);

  setSaving(false);
  renderTags([]);
  loadSession().then(loadUsers).catch(function (err) {
    window.location.href = buildFrontendUrl(err && err.code === "forbidden" ? "superpop.html" : "index.html");
  });
});
