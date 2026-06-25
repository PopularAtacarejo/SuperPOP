document.addEventListener("DOMContentLoaded", function () {
  const apiBase = String(window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com").replace(/\/+$/, "");
  const tableHead = document.getElementById("permissionsHead");
  const tableBody = document.getElementById("permissionsBody");
  const saveButton = document.getElementById("savePermissionsBtn");
  const saveLabel = document.getElementById("savePermissionsLabel");
  const message = document.getElementById("permissionsMessage");
  let tags = [];
  let pages = [];
  let permissions = {};

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function api(path, options) {
    const response = await fetch(apiBase + path, Object.assign({
      cache: "no-store",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    }, options || {}));
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok || !payload.ok) {
      throw new Error(String(payload.error || "Não foi possível concluir a solicitação."));
    }
    return payload;
  }

  function showMessage(text, error) {
    message.textContent = String(text || "");
    message.className = "rounded-2xl px-4 py-3 text-sm font-bold " +
      (error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700");
    message.classList.toggle("hidden", !text);
  }

  function render() {
    tableHead.innerHTML = '<tr><th class="min-w-[240px] px-4 py-4 text-left">Página</th>' +
      tags.map(function (tag) {
        return '<th class="min-w-[160px] px-4 py-4 text-center"><strong class="block text-slate-800">' +
          escapeHtml(tag.label) + '</strong><small class="mt-1 block normal-case tracking-normal text-slate-400">' +
          escapeHtml(tag.description) + '</small></th>';
      }).join("") + '</tr>';

    let currentCategory = "";
    const rows = [];
    pages.forEach(function (page) {
      if (page.category !== currentCategory) {
        currentCategory = page.category;
        rows.push('<tr class="permission-category-row"><td class="px-4 py-3" colspan="' + (tags.length + 1) + '">' + escapeHtml(currentCategory) + '</td></tr>');
      }
      rows.push('<tr class="border-b border-slate-100"><td class="px-4 py-4"><strong class="block text-slate-800">' +
        escapeHtml(page.label) + '</strong><small class="text-slate-400">' + escapeHtml(page.path) + '</small></td>' +
        tags.map(function (tag) {
          const checked = Array.isArray(permissions[tag.key]) && permissions[tag.key].indexOf(page.key) >= 0;
          const locked = Boolean(page.developer_only);
          return '<td class="px-4 py-4 text-center"><input class="permission-checkbox" data-page-key="' +
            escapeHtml(page.key) + '" data-tag-key="' + escapeHtml(tag.key) + '" type="checkbox"' +
            (checked ? " checked" : "") + (locked ? " disabled" : "") + '/></td>';
        }).join("") + '</tr>');
    });
    tableBody.innerHTML = rows.join("");
  }

  function collectPermissions() {
    const result = {};
    tags.forEach(function (tag) { result[tag.key] = []; });
    tableBody.querySelectorAll(".permission-checkbox:checked").forEach(function (checkbox) {
      const tagKey = checkbox.dataset.tagKey;
      const pageKey = checkbox.dataset.pageKey;
      if (result[tagKey]) result[tagKey].push(pageKey);
    });
    return result;
  }

  async function loadPermissions() {
    try {
      const payload = await api("/api/dev/page-permissions");
      tags = Array.isArray(payload.tags) ? payload.tags : [];
      pages = Array.isArray(payload.pages) ? payload.pages : [];
      permissions = payload.permissions || {};
      render();
    } catch (error) {
      tableBody.innerHTML = '<tr><td class="px-4 py-10 text-center font-bold text-red-600">' + escapeHtml(error.message) + '</td></tr>';
    }
  }

  saveButton.addEventListener("click", async function () {
    saveButton.disabled = true;
    saveLabel.textContent = "Salvando...";
    showMessage("", false);
    try {
      const payload = await api("/api/dev/page-permissions", {
        method: "PUT",
        body: JSON.stringify({ permissions: collectPermissions() })
      });
      permissions = payload.permissions || {};
      render();
      showMessage("Permissões atualizadas com sucesso.", false);
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      saveButton.disabled = false;
      saveLabel.textContent = "Salvar permissões";
    }
  });

  loadPermissions();
});
