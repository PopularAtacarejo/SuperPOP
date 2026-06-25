document.addEventListener("DOMContentLoaded", function () {
  const authTopActions = document.getElementById("authTopActions");
  const authUserBtn = document.getElementById("authUserBtn");
  const authUserDropdown = document.getElementById("authUserDropdown");
  const authLogoutBtn = document.getElementById("authLogoutBtn");
  const authUserMenu = document.getElementById("authUserMenu");
  const onlineUsersBtn = document.getElementById("onlineUsersBtn");
  const onlineUsersDropdown = document.getElementById("onlineUsersDropdown");
  const onlineUsersCount = document.getElementById("onlineUsersCount");
  const onlineUsersStatus = document.getElementById("onlineUsersStatus");
  const onlineUsersList = document.getElementById("onlineUsersList");
  const manageUsersQuickLink = document.getElementById("manageUsersQuickLink");
  const editUsersQuickLink = document.getElementById("editUsersQuickLink");
  const analyticsNavItem = document.getElementById("analyticsNavItem");
  const manageUsersNavItem = document.getElementById("manageUsersNavItem");
  const editUsersNavItem = document.getElementById("editUsersNavItem");
  const updatesEditorNavItem = document.getElementById("updatesEditorNavItem");
  let analyticsSection = document.getElementById("analyticsSection");
  const sidebarNav = document.querySelector(".sidebar-nav");
  const authUserAvatar = document.querySelector(".auth-user-avatar");
  const authUserAvatarImage = document.getElementById("authUserAvatarImage");
  const authUserAvatarFallback = document.getElementById("authUserAvatarFallback");
  const nameTargets = [
    document.getElementById("authUserName"),
    document.getElementById("authUserNameDetail"),
  ];
  const roleTargets = [
    document.getElementById("authUserRole"),
    document.getElementById("authUserRoleDetail"),
  ];
  let authUserFunctionDetail = null;
  let authAvatarViewer = null;
  let authAvatarViewerImage = null;
  let authAvatarViewerFallback = null;
  let authAvatarViewerName = null;
  let authAvatarViewerRole = null;
  const apiBase = String(
    window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com"
  ).replace(/\/+$/, "");
  const frontendBase = String(
    window.SUPERPOP_FRONTEND_URL || "https://popularatacarejo.github.io/SuperPOP"
  ).replace(/\/+$/, "");
  const allowAnonymousAuth = Boolean(
    (window.SUPERPOP_ALLOW_ANON_AUTH === true || window.SUPERPOP_ALLOW_ANON_AUTH === "true") ||
    (document.body && document.body.dataset && document.body.dataset.allowAnonymousAuth === "true")
  );

  if (!authUserBtn || !authUserDropdown || !authLogoutBtn) {
    return;
  }

  const presenceHeartbeatIntervalMs = 25000;
  const presenceRefreshIntervalMs = 30000;
  const notificationsRefreshIntervalMs = 45000;

  let currentAuthenticatedUserId = "";
  let presenceHeartbeatTimer = 0;
  let presenceRefreshTimer = 0;
  let notificationsRefreshTimer = 0;
  let notificationsLoading = false;
  let employeeTagPromise = null;
  let employeeTagMap = null;

  const NOTIFICATIONS_TEMPLATE = `
<div class="notifications-menu" id="notificationsMenu">
  <button type="button" class="notifications-btn" aria-expanded="false" id="notificationBtn">
    <span class="material-symbols-outlined">notifications</span>
    <span class="online-users-count" id="notificationCount">0</span>
  </button>
  <div class="notifications-dropdown" id="notificationsDropdown">
    <p class="online-users-dropdown-title">Super POPs do dia</p>
    <p class="online-users-dropdown-subtitle" id="notificationStatus">Carregando...</p>
    <div class="notifications-list" id="notificationsList">
      <p class="text-sm text-slate-500">Carregando...</p>
    </div>
    <div class="notifications-actions">
      <button type="button" class="secondary" id="markAllNotificationsBtn">Marcar todos como vistos</button>
      <button type="button" class="primary" id="showSuperpopsBtn">Mostrar Super POP</button>
    </div>
  </div>
</div>`;

  function ensureNotificationsMenu() {
    if (!authTopActions) {
      return null;
    }
    const existing = document.getElementById("notificationsMenu");
    if (existing) {
      return existing;
    }
    if (!authUserMenu) {
      authTopActions.insertAdjacentHTML("beforeend", NOTIFICATIONS_TEMPLATE);
      return document.getElementById("notificationsMenu");
    }
    const template = document.createElement("div");
    template.innerHTML = NOTIFICATIONS_TEMPLATE.trim();
    const node = template.firstElementChild;
    if (node) {
      authTopActions.insertBefore(node, authUserMenu);
    }
    return document.getElementById("notificationsMenu");
  }

  function ensureCreateUsersNavItem() {
    if (!sidebarNav) {
      return null;
    }
    const existing = document.getElementById("createUsersNavItem");
    if (existing) {
      const managementSection = ensureManagementSection();
      if (managementSection && existing.parentElement !== managementSection) {
        managementSection.appendChild(existing);
      }
      return existing;
    }
    const managementSection = ensureManagementSection();
    if (!managementSection) {
      return null;
    }
    const anchor = document.createElement("a");
    anchor.id = "createUsersNavItem";
    anchor.className = "menu-item group hidden";
    anchor.href = "criar-usuarios.html";
    anchor.title = "Criar usuários";
    anchor.innerHTML =
      '<span class="material-symbols-outlined shrink-0">person_add</span>' +
      '<span class="menu-item-label ml-3 sidebar-content-fade whitespace-nowrap">Criar usuários</span>';
    managementSection.appendChild(anchor);
    return anchor;
  }

  function ensureDynamicsNavItem() {
    if (!sidebarNav) {
      return null;
    }
    const existing = document.getElementById("dynamicsPopNavItem");
    if (existing) {
      return existing;
    }
    const generalSection = sidebarNav.querySelector(".space-y-1");
    if (!generalSection) {
      return null;
    }
    const anchor = document.createElement("a");
    anchor.id = "dynamicsPopNavItem";
    anchor.className = "menu-item group";
    anchor.href = "dinamicas-pop.html";
    anchor.title = "Dinâmicas POP";
    anchor.innerHTML =
      '<span class="material-symbols-outlined shrink-0">sports_soccer</span>' +
      '<span class="menu-item-label ml-3 sidebar-content-fade whitespace-nowrap">Dinâmicas POP</span>';
    const rankItem = generalSection.querySelector('a[href="rank.html"]');
    if (rankItem) {
      generalSection.insertBefore(anchor, rankItem);
    } else {
      generalSection.appendChild(anchor);
    }
    const currentPath = String(window.location.pathname || "").replace(/^\/+/, "").toLowerCase();
    if (currentPath === "dinamicas-pop" || currentPath === "dinamicas-pop.html") {
      generalSection.querySelectorAll(".menu-item.active").forEach(function (item) {
        item.classList.remove("active");
      });
      anchor.classList.add("active");
    }
    return anchor;
  }

  function ensureManagementSection() {
    if (!sidebarNav) return null;
    let section = document.getElementById("analyticsSection")
      || document.getElementById("pagePermissionsSection");
    if (!section) {
      const existingManagementLink = sidebarNav.querySelector(
        'a[href="analise.html"],a[href="usuarios.html"],a[href="editar-usuarios.html"],a[href="criar-usuarios.html"],a[href="atualizacoes-editor.html"],a[href="permissoes-paginas.html"]'
      );
      if (existingManagementLink) {
        section = existingManagementLink.closest(".space-y-1");
      }
    }
    if (!section) {
      section = document.createElement("div");
      section.id = "analyticsSection";
      section.className = "space-y-1 pt-2 border-t border-slate-100 hidden";
      section.innerHTML =
        '<div class="px-3 mb-2 sidebar-content-fade"><span class="menu-section-title">Gestão</span></div>';
      sidebarNav.appendChild(section);
    } else if (section.id !== "analyticsSection") {
      section.id = "analyticsSection";
    }
    Array.from(sidebarNav.children).forEach(function (candidate) {
      if (
        candidate !== section &&
        candidate.classList &&
        candidate.classList.contains("space-y-1") &&
        candidate.querySelector('a[href="analise.html"],a[href="usuarios.html"],a[href="editar-usuarios.html"],a[href="criar-usuarios.html"],a[href="atualizacoes-editor.html"],a[href="permissoes-paginas.html"]')
      ) {
        candidate.querySelectorAll("a.menu-item").forEach(function (anchor) {
          section.appendChild(anchor);
        });
        candidate.remove();
      }
    });
    analyticsSection = section;
    return section;
  }

  const MANAGEMENT_NAV_ITEMS = [
    { id: "analyticsNavItem", href: "analise.html", icon: "monitoring", label: "Análise de Dados" },
    { id: "manageUsersNavItem", href: "usuarios.html", icon: "groups", label: "Usuários cadastrados" },
    { id: "editUsersNavItem", href: "editar-usuarios.html", icon: "edit_square", label: "Editar usuários" },
    { id: "createUsersNavItem", href: "criar-usuarios.html", icon: "person_add", label: "Criar usuários" },
    { id: "updatesEditorNavItem", href: "atualizacoes-editor.html", icon: "edit_note", label: "Gerenciar atualizações" },
    { id: "pagePermissionsNavItem", href: "permissoes-paginas.html", icon: "admin_panel_settings", label: "Permissões" }
  ];

  function ensureManagementNavItems() {
    const section = ensureManagementSection();
    if (!section) return [];
    const currentPath = String(window.location.pathname || "").replace(/^\/+/, "").toLowerCase();
    const items = [];
    MANAGEMENT_NAV_ITEMS.forEach(function (spec) {
      let anchor = document.getElementById(spec.id)
        || sidebarNav.querySelector('a[href="' + spec.href + '"]');
      if (!anchor) {
        anchor = document.createElement("a");
        anchor.id = spec.id;
        anchor.className = "menu-item group hidden";
        anchor.href = spec.href;
        anchor.title = spec.label;
        anchor.innerHTML =
          '<span class="material-symbols-outlined shrink-0">' + spec.icon + '</span>' +
          '<span class="menu-item-label ml-3 sidebar-content-fade whitespace-nowrap">' + spec.label + '</span>';
      }
      anchor.id = spec.id;
      anchor.classList.add("menu-item", "group");
      if (anchor.parentElement !== section) {
        section.appendChild(anchor);
      } else {
        section.appendChild(anchor);
      }
      anchor.classList.toggle(
        "active",
        currentPath === spec.href || currentPath === spec.href.replace(/\.html$/, "")
      );
      items.push(anchor);
    });
    return items;
  }

  function ensurePagePermissionsNavItem() {
    if (!sidebarNav) return null;
    const existing = document.getElementById("pagePermissionsNavItem");
    if (existing) {
      const managementSection = ensureManagementSection();
      if (managementSection && existing.parentElement !== managementSection) {
        managementSection.appendChild(existing);
      }
      return existing;
    }
    const managementSection = ensureManagementSection();
    if (!managementSection) return null;
    const anchor = document.createElement("a");
    anchor.id = "pagePermissionsNavItem";
    anchor.className = "menu-item group hidden";
    anchor.href = "permissoes-paginas.html";
    anchor.title = "Permissões de páginas";
    anchor.innerHTML =
      '<span class="material-symbols-outlined shrink-0">admin_panel_settings</span>' +
      '<span class="menu-item-label ml-3 sidebar-content-fade whitespace-nowrap">Permissões</span>';
    managementSection.appendChild(anchor);
    return anchor;
  }

  const SIDEBAR_ICON_PATHS = {
    send: '<path d="M4 4l17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    cake: '<path d="M5 10h14v10H5z"/><path d="M3 14h18"/><path d="M8 10V7m4 3V5m4 5V7"/><path d="M8 7c1-1 1-2 0-3-1 1-1 2 0 3Zm4-2c1-1 1-2 0-3-1 1-1 2 0 3Zm4 2c1-1 1-2 0-3-1 1-1 2 0 3Z"/>',
    sports_soccer: '<circle cx="12" cy="12" r="9"/><path d="m9 9 3-2 3 2-1 4h-4L9 9Zm-4 1 4-1m6 0 4 1m-9 3-2 4m6-4 2 4m-8 0h8"/>',
    leaderboard: '<path d="M4 20h16"/><path d="M5 17h4V9H5v8Zm10 0h4V5h-4v12Zm-5 0h4V2h-4v15Z"/>',
    workspace_premium: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-3 4.5 3-1-9"/><path d="m12 5 .9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3L12 5Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7h.01"/>',
    campaign: '<path d="M4 10v4h4l7 4V6l-7 4H4Z"/><path d="m8 14 1 6h3l-1-5"/><path d="M18 9c1 1 1 5 0 6m2-8c2 2 2 8 0 10"/>',
    monitoring: '<path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/><path d="m3 8 5-4 5 6 7-8"/>',
    groups: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7"/><path d="M14 14c4-1 7 2 7 6"/>',
    edit_square: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 16 1-4 7-7 3 3-7 7-4 1Z"/><path d="m14 7 3 3"/>',
    edit_note: '<path d="M4 5h10M4 10h8M4 15h6"/><path d="m13 18 1-4 5-5 3 3-5 5-4 1Z"/>',
    person_add: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-5 3-8 7-8 2 0 4 .8 5.5 2.2"/><path d="M18 14v7m-3.5-3.5h7"/>',
    account_circle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6.5 18c1.2-3 3-4.5 5.5-4.5s4.3 1.5 5.5 4.5"/>',
    admin_panel_settings: '<path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c.7-2 2-3 4-3s3.3 1 4 3"/>'
  };

  function sidebarSvg(pathMarkup) {
    return '<svg aria-hidden="true" class="sidebar-menu-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      pathMarkup + '</svg>';
  }

  function enhanceSidebarIcons() {
    if (!sidebarNav) return;
    sidebarNav.querySelectorAll(".menu-item > .material-symbols-outlined").forEach(function (icon) {
      if (icon.dataset.svgEnhanced === "1") return;
      const iconName = String(icon.textContent || "").trim();
      const pathMarkup = SIDEBAR_ICON_PATHS[iconName];
      if (!pathMarkup) return;
      icon.dataset.iconName = iconName;
      icon.dataset.svgEnhanced = "1";
      icon.innerHTML = sidebarSvg(pathMarkup);
    });
  }

  function syncActiveSidebarItem() {
    if (!sidebarNav) return;
    const currentPath = String(window.location.pathname || "")
      .replace(/^\/+/, "")
      .toLowerCase();
    const normalizedCurrent = currentPath || "superpop.html";
    sidebarNav.querySelectorAll("a.menu-item[href]").forEach(function (anchor) {
      const href = String(anchor.getAttribute("href") || "")
        .split("?")[0]
        .replace(/^.*\//, "")
        .toLowerCase();
      const hrefWithoutExtension = href.replace(/\.html$/, "");
      const currentWithoutExtension = normalizedCurrent.replace(/\.html$/, "");
      anchor.classList.toggle(
        "active",
        Boolean(href) && (href === normalizedCurrent || hrefWithoutExtension === currentWithoutExtension)
      );
    });
  }

  const PAGE_KEY_BY_PATH = {
    "superpop.html": "superpop",
    "meus-superpops.html": "meus_superpops",
    "aniversariantes.html": "aniversariantes",
    "dinamicas-pop.html": "dinamicas_pop",
    "rank.html": "rank",
    "ganhadores.html": "ganhadores",
    "sobre.html": "sobre",
    "atualizacoes.html": "atualizacoes",
    "perfil.html": "perfil",
    "analise.html": "analise",
    "usuarios.html": "usuarios",
    "editar-usuarios.html": "editar_usuarios",
    "criar-usuarios.html": "criar_usuarios",
    "atualizacoes-editor.html": "atualizacoes_editor",
    "permissoes-paginas.html": "permissoes_paginas"
  };

  function applyPageAccess(pageAccess) {
    if (!sidebarNav || !pageAccess || typeof pageAccess !== "object") return;
    sidebarNav.querySelectorAll("a[href]").forEach(function (anchor) {
      const href = String(anchor.getAttribute("href") || "").split("?")[0].replace(/^.*\//, "").toLowerCase();
      const pageKey = PAGE_KEY_BY_PATH[href];
      if (!pageKey) return;
      anchor.classList.toggle("hidden", pageAccess[pageKey] !== true);
    });
    const managementSection = ensureManagementSection();
    if (managementSection) {
      const visibleManagementItems = Array.from(managementSection.querySelectorAll("a.menu-item"))
        .some(function (anchor) { return !anchor.classList.contains("hidden"); });
      managementSection.classList.toggle("hidden", !visibleManagementItems);
    }
  }

  ensureNotificationsMenu();
  enhanceAuthUserDropdown();
  ensureAvatarViewer();
  ensureManagementNavItems();
  ensureCreateUsersNavItem();
  ensureDynamicsNavItem();
  ensurePagePermissionsNavItem();
  syncActiveSidebarItem();
  enhanceSidebarIcons();

  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationsDropdown");
  const notificationCount = document.getElementById("notificationCount");
  const notificationStatus = document.getElementById("notificationStatus");
  const notificationsList = document.getElementById("notificationsList");
  const showSuperpopsBtn = document.getElementById("showSuperpopsBtn");
  const markAllNotificationsBtn = document.getElementById("markAllNotificationsBtn");

  function enhanceAuthUserDropdown() {
    if (!authUserDropdown || authUserDropdown.dataset.enhanced) {
      return;
    }
    const nameDetail = document.getElementById("authUserNameDetail");
    const roleDetail = document.getElementById("authUserRoleDetail");
    if (!nameDetail || !roleDetail) {
      return;
    }
    const detailWrapper = document.createElement("div");
    detailWrapper.className = "auth-user-dropdown-detail";
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined auth-user-dropdown-detail-icon";
    icon.textContent = "badge";
    detailWrapper.appendChild(icon);
    detailWrapper.appendChild(nameDetail);
    detailWrapper.appendChild(roleDetail);
    authUserDropdown.prepend(detailWrapper);
    const functionWrapper = document.createElement("div");
    functionWrapper.className = "auth-user-dropdown-function";
    functionWrapper.innerHTML = '<span class="material-symbols-outlined">work</span><strong id="authUserFunctionDetail">Função: Perfil</strong>';
    detailWrapper.after(functionWrapper);
    authUserFunctionDetail = document.getElementById("authUserFunctionDetail");
    authUserDropdown.dataset.enhanced = "1";
  }

  function closeAuthAvatarViewer() {
    if (!authAvatarViewer) return;
    authAvatarViewer.classList.remove("open");
  }

  function openAuthAvatarViewer() {
    if (!authAvatarViewer) return;
    authAvatarViewer.classList.add("open");
  }

  function updateAvatarViewerContent(photo, name, role) {
    if (!authAvatarViewer) return;
    const safePhoto = String(photo || "").trim();
    if (safePhoto && authAvatarViewerImage) {
      authAvatarViewerImage.src = safePhoto;
      authAvatarViewerImage.classList.remove("hidden");
      if (authAvatarViewerFallback) {
        authAvatarViewerFallback.classList.add("hidden");
      }
    } else if (authAvatarViewerFallback) {
      authAvatarViewerFallback.textContent = initialsFromName(name);
      authAvatarViewerFallback.classList.remove("hidden");
      if (authAvatarViewerImage) {
        authAvatarViewerImage.removeAttribute("src");
        authAvatarViewerImage.classList.add("hidden");
      }
    }
    if (authAvatarViewerName) {
      authAvatarViewerName.textContent = String(name || "Usuário");
    }
    if (authAvatarViewerRole) {
      authAvatarViewerRole.textContent = String(role || "Sem função");
    }
  }

  function ensureAvatarViewer() {
    if (allowAnonymousAuth) {
      return null;
    }
    if (authAvatarViewer) return authAvatarViewer;
    const container = document.createElement("div");
    container.id = "authAvatarViewer";
    container.className = "auth-avatar-viewer";
    container.innerHTML = `
      <div class="auth-avatar-viewer-card">
        <button class="auth-avatar-viewer-close" type="button" aria-label="Fechar">
          <span class="material-symbols-outlined">close</span>
        </button>
        <div class="auth-avatar-viewer-photo">
          <img id="authAvatarViewerImage" alt="Foto ampliada do usuário"/>
          <span id="authAvatarViewerFallback">SP</span>
        </div>
        <p class="auth-avatar-viewer-name" id="authAvatarViewerName">Carregando...</p>
        <p class="auth-avatar-viewer-role" id="authAvatarViewerRole">Perfil</p>
      </div>
    `;
    document.body.appendChild(container);
    authAvatarViewer = container;
    authAvatarViewerImage = container.querySelector("#authAvatarViewerImage");
    authAvatarViewerFallback = container.querySelector("#authAvatarViewerFallback");
    authAvatarViewerName = container.querySelector("#authAvatarViewerName");
    authAvatarViewerRole = container.querySelector("#authAvatarViewerRole");
    const closeButton = container.querySelector(".auth-avatar-viewer-close");
    if (closeButton) {
      closeButton.addEventListener("click", function () {
        closeAuthAvatarViewer();
      });
    }
    container.addEventListener("click", function (event) {
      if (event.target === container) {
        closeAuthAvatarViewer();
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && container.classList.contains("open")) {
        closeAuthAvatarViewer();
      }
    });
    return container;
  }

  function normalizeTagsForUser(user) {
    const gather = function (value) {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        return value
          .split(/[,;|]/)
          .map(function (segment) { return segment.trim(); })
          .filter(Boolean);
      }
      return [];
    };
    const rawTags = [].concat(
      gather(user && user.tags_acesso),
      gather(user && user.tags),
      gather(user && user.tagsAcesso),
      gather(user && user.tagsAcessos),
      gather(user && user.tagsAccess)
    );
    const normalized = rawTags
      .map(function (tag) { return String(tag || "").trim().toLowerCase(); })
      .filter(Boolean);
    const seen = [];
    return normalized.filter(function (tag) {
      if (seen.indexOf(tag) >= 0) return false;
      seen.push(tag);
      return true;
    });
  }

  function userHasTag(user, targets) {
    const normalized = normalizeTagsForUser(user);
    if (!normalized.length) return false;
    const candidates = Array.isArray(targets) ? targets : [targets];
    return candidates.some(function (target) {
      const value = String(target || "").trim().toLowerCase();
      return value && normalized.indexOf(value) >= 0;
    });
  }

  function buildEmployeeTagMap(users) {
    if (!Array.isArray(users) || !users.length) return null;
    const map = {};
    users.forEach(function (user) {
      const id = String(user && user.id || "").trim();
      if (!id) return;
      map[id] = {
        tags_acesso: Array.isArray(user.tags_acesso) ? user.tags_acesso.slice() : [],
        tags: Array.isArray(user.tags) ? user.tags.slice() : [],
        tagsAcesso: Array.isArray(user.tagsAcesso) ? user.tagsAcesso.slice() : [],
        tagsAcessos: Array.isArray(user.tagsAcessos) ? user.tagsAcessos.slice() : [],
        tagsAccess: Array.isArray(user.tagsAccess) ? user.tagsAccess.slice() : [],
        permissoes: user.permissoes && typeof user.permissoes === "object"
          ? Object.assign({}, user.permissoes)
          : null
      };
    });
    return Object.keys(map).length ? map : null;
  }

  function enrichOnlineUser(user) {
    if (!user || !user.id || !employeeTagMap) return user;
    const id = String(user.id || "").trim();
    const meta = employeeTagMap[id];
    if (!meta) return user;
    const clone = Object.assign({}, user);
    if (!Array.isArray(clone.tags) && Array.isArray(meta.tags) && meta.tags.length) {
      clone.tags = meta.tags.slice();
    }
    if (!Array.isArray(clone.tags_acesso) && Array.isArray(meta.tags_acesso) && meta.tags_acesso.length) {
      clone.tags_acesso = meta.tags_acesso.slice();
    }
    if (!Array.isArray(clone.tagsAcesso) && Array.isArray(meta.tagsAcesso) && meta.tagsAcesso.length) {
      clone.tagsAcesso = meta.tagsAcesso.slice();
    }
    if (!Array.isArray(clone.tagsAcessos) && Array.isArray(meta.tagsAcessos) && meta.tagsAcessos.length) {
      clone.tagsAcessos = meta.tagsAcessos.slice();
    }
    if (!Array.isArray(clone.tagsAccess) && Array.isArray(meta.tagsAccess) && meta.tagsAccess.length) {
      clone.tagsAccess = meta.tagsAccess.slice();
    }
    if (!clone.permissoes && meta.permissoes) {
      clone.permissoes = Object.assign({}, meta.permissoes);
    }
    return clone;
  }

  function ensureEmployeeTagsLoaded() {
    if (employeeTagMap) {
      return Promise.resolve(employeeTagMap);
    }
    if (employeeTagPromise) {
      return employeeTagPromise;
    }
    employeeTagPromise = (async function () {
      const candidates = [
        apiBase + "/Funcioinarios.json",
        buildFrontendUrl("Funcioinarios.json"),
        "Funcioinarios.json"
      ];
      for (let i = 0; i < candidates.length; i += 1) {
        const url = String(candidates[i] || "").trim();
        if (!url) continue;
        try {
          const response = await fetch(url, { cache: "no-store", credentials: "omit" });
          if (!response.ok) {
            continue;
          }
          const payload = await response.json().catch(function () { return null; });
          const map = buildEmployeeTagMap(payload);
          if (map) {
            employeeTagMap = map;
            return map;
          }
        } catch (_err) {
          continue;
        }
      }
      return null;
    })();
    employeeTagPromise.finally(function () {
      if (!employeeTagMap) {
        employeeTagPromise = null;
      }
    });
    return employeeTagPromise;
  }

  function resolveOrigin(urlValue) {
    try {
      return new URL(String(urlValue || "")).origin.toLowerCase();
    } catch (_err) {
      return "";
    }
  }

  function buildFrontendUrl(path) {
    const cleanPath = String(path || "").replace(/^\/+/, "");
    const currentOrigin = String(window.location.origin || "").toLowerCase();
    const apiOrigin = resolveOrigin(apiBase);
    if (apiOrigin && currentOrigin && apiOrigin === currentOrigin) {
      return cleanPath ? ("/" + cleanPath) : "/";
    }
    return frontendBase ? frontendBase + (cleanPath ? ("/" + cleanPath) : "") : (cleanPath || "");
  }

  function initialsFromName(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) {
      return "SP";
    }
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

  function setUserView(userOrNome, funcao) {
    const user = userOrNome && typeof userOrNome === "object"
      ? userOrNome
      : { nome: userOrNome, funcao: funcao };
    const safeNome = String(user && user.nome || "").trim() || "Usuário";
    const safeFuncao = String(user && user.funcao || "").trim() || "Sem função";
    currentAuthenticatedUserId = String(user && user.id || "").trim();
    nameTargets.forEach(function (el) { if (el) el.textContent = safeNome; });
    roleTargets.forEach(function (el) { if (el) el.textContent = safeFuncao; });
    renderUserAvatar(user && user.foto_perfil_data_url, safeNome);
    if (authUserFunctionDetail) {
      authUserFunctionDetail.textContent = "Função: " + safeFuncao;
    }
    updateAvatarViewerContent(user && user.foto_perfil_data_url, safeNome, safeFuncao);
  }

  function closeAuthDropdown() {
    authUserDropdown.classList.remove("open");
    authUserBtn.setAttribute("aria-expanded", "false");
  }

  function closeOnlineDropdown() {
    if (!onlineUsersDropdown || !onlineUsersBtn) return;
    onlineUsersDropdown.classList.remove("open");
    onlineUsersBtn.setAttribute("aria-expanded", "false");
  }

  function closeNotificationDropdown() {
    if (!notificationDropdown || !notificationBtn) return;
    notificationDropdown.classList.remove("open");
    notificationBtn.setAttribute("aria-expanded", "false");
  }

  function setOnlineUsersCount(value) {
    if (!onlineUsersCount || !onlineUsersBtn) return;
    const numericValue = Number(value);
    const safeCount = Number.isFinite(numericValue) && numericValue >= 0
      ? Math.floor(numericValue)
      : 0;
    onlineUsersCount.textContent = String(safeCount);
    onlineUsersBtn.title = safeCount === 1
      ? "1 usuario online"
      : (safeCount + " usuarios online");
  }

  function setOnlineUsersStatus(text) {
    if (onlineUsersStatus) {
      onlineUsersStatus.textContent = String(text || "");
    }
  }

  function appendEmptyOnlineRow(text) {
    if (!onlineUsersList) return;
    const row = document.createElement("li");
    row.className = "online-user-item empty";
    row.textContent = String(text || "Sem usuarios online agora.");
    onlineUsersList.appendChild(row);
  }

  function formatOnlineLastSeen(lastSeenIso) {
    const parsedTime = Date.parse(String(lastSeenIso || ""));
    if (!Number.isFinite(parsedTime)) {
      return "ativo recentemente";
    }
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - parsedTime) / 1000));
    if (elapsedSeconds < 45) {
      return "ativo agora";
    }
    if (elapsedSeconds < 90) {
      return "ativo ha 1 min";
    }
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) {
      return elapsedMinutes === 1 ? "ativo ha 1 min" : ("ativo ha " + elapsedMinutes + " min");
    }
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return elapsedHours === 1 ? "ativo ha 1 hora" : ("ativo ha " + elapsedHours + " horas");
    }
    const elapsedDays = Math.floor(elapsedHours / 24);
    return elapsedDays === 1 ? "ativo ha 1 dia" : ("ativo ha " + elapsedDays + " dias");
  }

  function buildOnlineAvatarNode(photoDataUrl, name) {
    const avatarNode = document.createElement("span");
    avatarNode.className = "online-user-avatar";
    const safePhoto = String(photoDataUrl || "").trim();
    if (safePhoto) {
      const imageNode = document.createElement("img");
      imageNode.alt = "Avatar";
      imageNode.src = safePhoto;
      avatarNode.appendChild(imageNode);
    } else {
      avatarNode.textContent = initialsFromName(name);
    }
    return avatarNode;
  }

  function buildOnlineRoleIcon(roleKind) {
    const wrapper = document.createElement("span");
    wrapper.className = "online-user-role-tag-icon";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "online-role-svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = roleKind === "developer"
      ? '<path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/><circle cx="12" cy="12" r="10"/>'
      : '<path d="M12 3 4.5 6v5.2c0 4.6 3.1 8 7.5 9.8 4.4-1.8 7.5-5.2 7.5-9.8V6L12 3Z"/><path d="m9.4 12 1.7 1.7 3.8-4"/>';
    wrapper.appendChild(svg);
    return wrapper;
  }

  function renderOnlineUsers(users) {
    if (!onlineUsersList || !onlineUsersCount) return;
    onlineUsersList.innerHTML = "";

    const safeUsers = Array.isArray(users)
      ? users.filter(function (item) { return item && typeof item === "object"; })
      : [];
    setOnlineUsersCount(safeUsers.length);

    if (!safeUsers.length) {
      setOnlineUsersStatus("Nenhum usuario online agora.");
      appendEmptyOnlineRow("Nenhum usuario online agora.");
      return;
    }

    setOnlineUsersStatus(
      safeUsers.length === 1
        ? "1 usuario ativo agora."
        : (safeUsers.length + " usuarios ativos agora.")
    );

    safeUsers.forEach(function (item) {
      const user = enrichOnlineUser(item);
      const userId = String(user.id || "").trim();
      const userName = String(user.nome || "").trim() || "Usuario";
      const userRole = String(user.funcao || "").trim() || "Sem funcao";
      const userPresence = formatOnlineLastSeen(user.last_seen_iso);
      const userIsCurrent = Boolean(userId && currentAuthenticatedUserId && userId === currentAuthenticatedUserId);
      const row = document.createElement("li");
      row.className = "online-user-item";
      const roleLabel = userRole.toLowerCase();
      const hasAdminTag = userHasTag(user, "admin");
      const hasDeveloperTag = userHasTag(user, ["developer", "dev"]);
      const isAdmin = Boolean(
        hasAdminTag ||
        (user.permissoes && user.permissoes.manage_users) ||
        roleLabel.indexOf("admin") >= 0
      );
      const isDeveloper = Boolean(
        hasDeveloperTag ||
        (user.permissoes && user.permissoes.edit_users) ||
        roleLabel.indexOf("dev") >= 0 ||
        roleLabel.indexOf("desenvolvedor") >= 0
      );
      if (isDeveloper) {
        row.classList.add("developer");
      } else if (isAdmin) {
        row.classList.add("admin");
      }
      row.appendChild(buildOnlineAvatarNode(user.foto_perfil_data_url, userName));

      const meta = document.createElement("div");
      meta.className = "online-user-meta";
      const title = document.createElement("strong");
      title.textContent = userName + (userIsCurrent ? " (voce)" : "");
      const subtitle = document.createElement("small");
      subtitle.textContent = userRole + " | " + userPresence;
      meta.appendChild(title);
      if (isAdmin || isDeveloper) {
        const tag = document.createElement("span");
        const roleKind = isDeveloper ? "developer" : "admin";
        tag.className = "online-user-role-tag " + roleKind;
        tag.appendChild(buildOnlineRoleIcon(roleKind));
        tag.appendChild(document.createTextNode(roleKind === "developer" ? "Desenvolvedor" : "Administrador"));
        meta.appendChild(tag);
      }
      meta.appendChild(subtitle);
      row.appendChild(meta);
      onlineUsersList.appendChild(row);
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function callAuthApi(path, options) {
    const cleanPath = path.startsWith("/") ? path : ("/" + path);
    const requestOptions = Object.assign(
      { cache: "no-store", credentials: "include" },
      options && typeof options === "object" ? options : {}
    );
    const response = await fetch(apiBase + cleanPath, requestOptions);
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok || !payload || !payload.ok) {
      const message = payload && payload.error
        ? String(payload.error)
        : ("Falha na solicitacao (HTTP " + response.status + ").");
      const error = new Error(message);
      if (response.status === 401) {
        error.authReason = "unauthorized";
      }
      throw error;
    }
    return payload;
  }

  function callPresenceEndpoint(path, options) {
    return callAuthApi(path, options);
  }

  function handlePresenceError(error) {
    const unauthorizedCheck = window.__superpopIsUnauthorizedAuthError;
    const isUnauthorized = typeof unauthorizedCheck === "function"
      ? unauthorizedCheck(error) || Boolean(error && error.authReason === "unauthorized")
      : Boolean(error && error.authReason === "unauthorized");
    if (isUnauthorized) {
      if (!allowAnonymousAuth) {
        window.location.href = buildFrontendUrl("index.html");
      }
      return true;
    }
    return false;
  }

  async function sendPresenceHeartbeat() {
    if (!onlineUsersBtn || document.visibilityState === "hidden") return;
    try {
      const payload = await callPresenceEndpoint("/api/presence/heartbeat", { method: "POST" });
      if (payload && typeof payload.online_count !== "undefined") {
        setOnlineUsersCount(payload.online_count);
      }
    } catch (error) {
      handlePresenceError(error);
    }
  }

  async function refreshOnlineUsers() {
    if (!onlineUsersList || document.visibilityState === "hidden") return;
    try {
      const payload = await callPresenceEndpoint("/api/presence/online");
      const onlineUsers = Array.isArray(payload && payload.online_users) ? payload.online_users : [];
      await ensureEmployeeTagsLoaded().catch(function () {});
      renderOnlineUsers(onlineUsers);
      if (payload && typeof payload.online_count !== "undefined") {
        setOnlineUsersCount(payload.online_count);
      }
    } catch (error) {
      if (handlePresenceError(error)) return;
      setOnlineUsersStatus("Nao foi possivel atualizar agora.");
    }
  }

  function stopPresenceRefreshLoop() {
    if (presenceHeartbeatTimer) {
      window.clearInterval(presenceHeartbeatTimer);
      presenceHeartbeatTimer = 0;
    }
    if (presenceRefreshTimer) {
      window.clearInterval(presenceRefreshTimer);
      presenceRefreshTimer = 0;
    }
  }

  function startPresenceRefreshLoop() {
    if (!onlineUsersBtn || !onlineUsersDropdown || document.visibilityState === "hidden") return;
    stopPresenceRefreshLoop();
    ensureEmployeeTagsLoaded().catch(function () {});
    sendPresenceHeartbeat();
    refreshOnlineUsers();
    presenceHeartbeatTimer = window.setInterval(sendPresenceHeartbeat, presenceHeartbeatIntervalMs);
    presenceRefreshTimer = window.setInterval(refreshOnlineUsers, presenceRefreshIntervalMs);
  }

  function setNotificationCount(value) {
    if (!notificationCount || !notificationBtn) return;
    const numericValue = Number(value);
    const safeCount = Number.isFinite(numericValue) && numericValue >= 0
      ? Math.floor(numericValue)
      : 0;
    notificationCount.textContent = String(safeCount);
    notificationBtn.title = safeCount === 1
      ? "1 Super POP recebido hoje"
      : (safeCount + " Super POPs recebidos hoje");
  }

  function setNotificationStatus(message, isError) {
    if (!notificationStatus) return;
    const text = String(message || "").trim() || "Sem notificacoes";
    notificationStatus.textContent = text;
    notificationStatus.classList.toggle("text-red-600", Boolean(isError));
    notificationStatus.classList.toggle("text-slate-500", !Boolean(isError));
  }

  function renderNotifications(payload) {
    const entries = Array.isArray(payload && payload.notifications) ? payload.notifications : [];
    const unreadCount = Number.isFinite(payload && payload.unread) ? Math.max(0, Math.floor(payload.unread)) : 0;
    setNotificationCount(unreadCount);
    if (!notificationsList) return;
    if (!entries.length) {
      notificationsList.innerHTML = '<p class="text-sm text-slate-500">Você ainda não recebeu Super POPs hoje.</p>';
      return;
    }
    notificationsList.innerHTML = entries.map(function (item) {
      const sender = (item && item.remetente && item.remetente.nome) ? item.remetente.nome : "Colega";
      const funcao = (item && item.remetente && item.remetente.funcao) ? item.remetente.funcao : "Super POP";
      const dia = String(item && item.dia || "").trim();
      const horario = String(item && item.horario || "").trim();
      const timeLabel = [dia, horario].filter(Boolean).join(" às ");
      const message = String(item && item.mensagem || "").trim();
      const values = Array.isArray(item && item.valores) ? item.valores.filter(Boolean) : [];
      const valuesHtml = values.length
        ? '<p class="text-xs text-gray-500">' + escapeHtml(values.join(", ")) + '</p>'
        : "";
      const cardId = String(item && item.card_id || "").trim();
      const logId = String(item && item.id || "").trim();
      return '' +
        '<div class="notification-item">' +
          '<strong>' + escapeHtml("Recebido de " + sender) + '</strong>' +
          '<div class="notification-meta">' +
            '<span>' + escapeHtml(funcao) + '</span>' +
            '<span>' + escapeHtml(timeLabel || "Hoje") + '</span>' +
          '</div>' +
          (message ? '<p>' + escapeHtml(message) + '</p>' : '') +
          valuesHtml +
          '<div class="notification-actions">' +
            '<button type="button" class="primary" data-show-superpop="' + escapeHtml(cardId) + '" data-mark-log-id="' + escapeHtml(logId) + '">Mostrar Super POP</button>' +
            '<button type="button" class="secondary" data-mark-log-id="' + escapeHtml(logId) + '">Marcar como visto</button>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  async function loadNotifications() {
    if (!notificationStatus || !notificationsList || notificationsLoading) return;
    notificationsLoading = true;
    setNotificationStatus("Carregando...");
    notificationsList.innerHTML = '<p class="text-sm text-slate-500">Carregando...</p>';
    try {
      const payload = await callAuthApi("/api/me/notifications/superpops");
      renderNotifications(payload);
      if (payload && payload.total) {
        setNotificationStatus(payload.total === payload.unread
          ? `Você tem ${payload.total} Super POPs novos hoje.`
          : `${payload.total} Super POPs no dia, ${payload.unread || 0} não lidos.`);
      } else {
        setNotificationStatus("Nenhum Super POP novo hoje.");
      }
    } catch (error) {
      if (handlePresenceError(error)) return;
      const message = String(error && error.message ? error.message : "Erro ao carregar notificações.");
      setNotificationStatus(message, true);
      notificationsList.innerHTML = '<p class="text-sm text-red-600">Não foi possível carregar as notificações.</p>';
    } finally {
      notificationsLoading = false;
    }
  }

  async function markNotification(logId) {
    if (!logId) return;
    try {
      await callAuthApi("/api/me/notifications/superpops/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: logId }),
      });
      await loadNotifications();
    } catch (error) {
      if (handlePresenceError(error)) return;
      setNotificationStatus(String(error && error.message ? error.message : "Erro ao marcar como visto."), true);
    }
  }

  async function markAllNotifications() {
    try {
      await callAuthApi("/api/me/notifications/superpops/mark-all", { method: "POST" });
      await loadNotifications();
    } catch (error) {
      if (handlePresenceError(error)) return;
      setNotificationStatus(String(error && error.message ? error.message : "Erro ao marcar todos."), true);
    }
  }

  async function showSuperpopFromNotification(logId, cardId) {
    if (logId) {
      try {
        await callAuthApi("/api/me/notifications/superpops/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ log_id: logId }),
        });
      } catch (error) {
        if (handlePresenceError(error)) return;
        console.warn("Falha ao marcar Super POP como visto.", error);
      }
    }
    closeNotificationDropdown();
    const target = buildFrontendUrl("meus-superpops.html") + (cardId ? "?card_id=" + encodeURIComponent(cardId) : "");
    window.location.href = target;
  }

  function stopNotificationsRefreshLoop() {
    if (notificationsRefreshTimer) {
      window.clearInterval(notificationsRefreshTimer);
      notificationsRefreshTimer = 0;
    }
  }

  function startNotificationsRefreshLoop() {
    stopNotificationsRefreshLoop();
    loadNotifications();
    notificationsRefreshTimer = window.setInterval(loadNotifications, notificationsRefreshIntervalMs);
  }

  async function loadUserFromSession() {
    const response = await fetch(apiBase + "/api/auth/me", { cache: "no-store", credentials: "include" });
    if (!response.ok) throw new Error("Não autenticado");
    const payload = await response.json();
    if (!payload || !payload.ok || !payload.usuario) throw new Error("Sessão inválida");
    setUserView(payload.usuario);
    if (analyticsSection && payload.permissoes && payload.permissoes.analytics) {
      analyticsSection.classList.remove("hidden");
    }
    if (analyticsNavItem && payload.permissoes && payload.permissoes.analytics) {
      analyticsNavItem.classList.remove("hidden");
    }
    const hasAdminTag = userHasTag(payload.usuario, "admin");
    const hasDeveloperTag = userHasTag(payload.usuario, ["developer", "dev"]);
    const pageAccess = payload.permissoes && payload.permissoes.page_access
      ? payload.permissoes.page_access
      : null;
    const showManageItems = hasAdminTag || hasDeveloperTag;
    if (manageUsersQuickLink && showManageItems) {
      manageUsersQuickLink.classList.remove("hidden");
    }
    if (manageUsersNavItem && showManageItems) {
      manageUsersNavItem.classList.remove("hidden");
    }
    if (editUsersQuickLink && hasDeveloperTag) {
      editUsersQuickLink.classList.remove("hidden");
    }
    if (editUsersNavItem && hasDeveloperTag) {
      editUsersNavItem.classList.remove("hidden");
      if (updatesEditorNavItem) updatesEditorNavItem.classList.remove("hidden");
    }
    const createUsersNavItem = ensureCreateUsersNavItem();
    if (createUsersNavItem) {
      createUsersNavItem.classList.toggle("hidden", !hasDeveloperTag);
      const currentPath = String(window.location.pathname || "").replace(/^\/+/, "").toLowerCase();
      const isCreatePage =
        currentPath === "criar-usuarios" || currentPath === "criar-usuarios.html";
      createUsersNavItem.classList.toggle("active", isCreatePage);
    }
    const pagePermissionsNavItem = ensurePagePermissionsNavItem();
    if (pagePermissionsNavItem) {
      pagePermissionsNavItem.classList.toggle("hidden", !hasDeveloperTag);
      const currentPath = String(window.location.pathname || "").replace(/^\/+/, "").toLowerCase();
      pagePermissionsNavItem.classList.toggle(
        "active",
        currentPath === "permissoes-paginas" || currentPath === "permissoes-paginas.html"
      );
    }
    applyPageAccess(pageAccess);
  }

  authUserBtn.addEventListener("click", function () {
    const isOpen = authUserDropdown.classList.contains("open");
    authUserDropdown.classList.toggle("open", !isOpen);
    authUserBtn.setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) {
      closeOnlineDropdown();
      closeNotificationDropdown();
    }
  });

  if (authUserAvatar) {
    authUserAvatar.addEventListener("click", function (event) {
      event.stopPropagation();
      ensureAvatarViewer();
      openAuthAvatarViewer();
    });
  }

  if (onlineUsersBtn && onlineUsersDropdown) {
    onlineUsersBtn.addEventListener("click", function () {
      const isOpen = onlineUsersDropdown.classList.contains("open");
      onlineUsersDropdown.classList.toggle("open", !isOpen);
      onlineUsersBtn.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen) {
        closeAuthDropdown();
        closeNotificationDropdown();
        refreshOnlineUsers();
      }
    });
  }

  if (notificationBtn && notificationDropdown) {
    notificationBtn.addEventListener("click", function () {
      const isOpen = notificationDropdown.classList.contains("open");
      notificationDropdown.classList.toggle("open", !isOpen);
      notificationBtn.setAttribute("aria-expanded", String(!isOpen));
      if (!isOpen) {
        closeAuthDropdown();
        closeOnlineDropdown();
        loadNotifications();
      }
    });
  }

  if (notificationsList) {
    notificationsList.addEventListener("click", function (event) {
      const showButton = event.target.closest("[data-show-superpop]");
      if (showButton) {
        const logId = showButton.getAttribute("data-mark-log-id");
        const cardId = showButton.getAttribute("data-show-superpop");
        showSuperpopFromNotification(logId, cardId);
        return;
      }
      const markButton = event.target.closest("[data-mark-log-id]");
      if (markButton) {
        const logId = markButton.getAttribute("data-mark-log-id");
        markNotification(logId);
      }
    });
  }

  if (markAllNotificationsBtn) {
    markAllNotificationsBtn.addEventListener("click", function () {
      markAllNotifications();
    });
  }

  if (showSuperpopsBtn) {
    showSuperpopsBtn.addEventListener("click", async function () {
      await markAllNotifications();
      closeNotificationDropdown();
      window.location.href = buildFrontendUrl("meus-superpops.html");
    });
  }

  document.addEventListener("click", function (event) {
    if (!authUserDropdown.contains(event.target) && !authUserBtn.contains(event.target)) {
      closeAuthDropdown();
    }
    if (
      onlineUsersDropdown
      && onlineUsersBtn
      && !onlineUsersDropdown.contains(event.target)
      && !onlineUsersBtn.contains(event.target)
    ) {
      closeOnlineDropdown();
    }
    if (
      notificationDropdown
      && notificationBtn
      && !notificationDropdown.contains(event.target)
      && !notificationBtn.contains(event.target)
    ) {
      closeNotificationDropdown();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      stopPresenceRefreshLoop();
      stopNotificationsRefreshLoop();
      return;
    }
    startPresenceRefreshLoop();
    startNotificationsRefreshLoop();
  });

  authLogoutBtn.addEventListener("click", async function () {
    stopPresenceRefreshLoop();
    stopNotificationsRefreshLoop();
    try {
      await fetch(apiBase + "/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (_err) {}
    try {
      localStorage.removeItem("superpop_auth_user");
    } catch (_err) {}
    window.location.href = buildFrontendUrl("index.html");
  });

  function handleSessionError(error) {
    const cachedReader = window.__superpopGetCachedAuthUser;
    const cachedUser = typeof cachedReader === "function" ? cachedReader() : null;
    if (cachedUser) {
      setUserView(cachedUser);
      return Promise.resolve();
    }
    const unauthorizedCheck = window.__superpopIsUnauthorizedAuthError;
    const isUnauthorized = typeof unauthorizedCheck === "function"
      ? unauthorizedCheck(error)
      : Boolean(error && error.message === "Não autenticado");
    if (isUnauthorized) {
      if (!allowAnonymousAuth) {
        window.location.href = buildFrontendUrl("index.html");
      } else {
        setOnlineUsersStatus("Faça login para ver quem está online.");
        setNotificationStatus("Faça login para ver as notificações.");
      }
      return Promise.resolve();
    }
    console.warn("Falha temporaria ao validar sessao no menu do usuario.", error);
    return Promise.resolve();
  }

  loadUserFromSession()
    .then(function () {
      startPresenceRefreshLoop();
      startNotificationsRefreshLoop();
    })
    .catch(function (error) {
      handleSessionError(error).then(function () {
        startPresenceRefreshLoop();
        startNotificationsRefreshLoop();
      });
    });

  setOnlineUsersCount(0);
  setNotificationCount(0);
  setOnlineUsersStatus("Carregando usuarios online...");
  setNotificationStatus("Carregando...");
});
