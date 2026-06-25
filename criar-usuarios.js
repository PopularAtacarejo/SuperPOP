document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("createUserForm");
  const nomeInput = document.getElementById("nomeInput");
  const telefoneInput = document.getElementById("telefoneInput");
  const funcaoInput = document.getElementById("funcaoInput");
  const emailInput = document.getElementById("emailInput");
  const dataNascimentoInput = document.getElementById("dataNascimentoInput");
  const mostrarAniversarioInput = document.getElementById("mostrarAniversarioInput");
  const birthDateHint = document.getElementById("birthDateHint");
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnLabel = document.getElementById("submitBtnLabel");
  const errorBox = document.getElementById("formError");
  const successBox = document.getElementById("formSuccess");
  const accountCreatedModal = document.getElementById("accountCreatedModal");
  const accountCreatedCloseBtn = document.getElementById("accountCreatedCloseBtn");
  const accountCreatedUser = document.getElementById("accountCreatedUser");
  const accountCreatedConfetti = document.getElementById("accountCreatedConfetti");

  if (!form || !nomeInput || !telefoneInput || !submitBtn || !submitBtnLabel || !errorBox || !successBox) {
    return;
  }

  const PHONE_REGEX = /^\(\d{2}\)\s9\s\d{4}\s-\s\d{4}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const apiBase = String(window.SUPERPOP_API_URL || "https://superpopbackend.onrender.com").replace(/\/+$/, "");

  function normalizeLabel(value) {
    return String(value || "").trim();
  }

  function formatPhoneMask(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return "(" + digits;
    if (digits.length <= 3) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    if (digits.length <= 7) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 3) + " " + digits.slice(3);
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 3) + " " + digits.slice(3, 7) + " - " + digits.slice(7, 11);
  }

  function shouldFormatPhone(value) {
    return /^[\d()\s-]*$/.test(String(value || ""));
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtnLabel.textContent = isLoading ? "Registrando..." : "Registrar";
  }

  function clearStatus() {
    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");
    errorBox.textContent = "";
    successBox.textContent = "";
  }

  function showError(message) {
    successBox.classList.add("hidden");
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  }

  function showSuccess(message) {
    errorBox.classList.add("hidden");
    successBox.textContent = message;
    successBox.classList.remove("hidden");
  }

  function buildAccountConfetti() {
    if (!accountCreatedConfetti) return;
    accountCreatedConfetti.innerHTML = "";
    const colors = ["#e63946", "#ffb703", "#ffffff", "#fb7185", "#facc15"];
    for (let index = 0; index < 52; index += 1) {
      const piece = document.createElement("span");
      piece.className = "account-confetti-piece";
      piece.style.left = Math.floor(Math.random() * 100) + "%";
      piece.style.backgroundColor = colors[index % colors.length];
      piece.style.setProperty("--duration", (2.1 + Math.random() * 1.8).toFixed(2) + "s");
      piece.style.setProperty("--delay", (Math.random() * 0.5).toFixed(2) + "s");
      piece.style.setProperty("--drift", (Math.random() * 180 - 90).toFixed(0) + "px");
      piece.style.setProperty("--rotation", (Math.random() * 900 - 450).toFixed(0) + "deg");
      accountCreatedConfetti.appendChild(piece);
    }
  }

  function showAccountCreated(userName) {
    if (!accountCreatedModal) return;
    if (accountCreatedUser) {
      accountCreatedUser.textContent = String(userName || "Novo colaborador");
    }
    buildAccountConfetti();
    accountCreatedModal.classList.add("is-open");
    accountCreatedModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(function () {
      if (accountCreatedCloseBtn) accountCreatedCloseBtn.focus();
    }, 250);
  }

  function closeAccountCreated() {
    if (!accountCreatedModal) return;
    accountCreatedModal.classList.remove("is-open");
    accountCreatedModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    nomeInput.focus();
  }

  function todayIso() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function validateBirthDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return { valid: true, iso: "" };
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return { valid: false, error: "Selecione uma data de nascimento válida." };
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return { valid: false, error: "A data de nascimento informada não existe." };
    }
    if (year < 1900) {
      return { valid: false, error: "Informe uma data de nascimento a partir de 1900." };
    }
    if (raw > todayIso()) {
      return { valid: false, error: "A data de nascimento não pode estar no futuro." };
    }
    return { valid: true, iso: raw };
  }

  if (dataNascimentoInput) {
    dataNascimentoInput.max = todayIso();
    dataNascimentoInput.addEventListener("change", function () {
      const result = validateBirthDate(dataNascimentoInput.value);
      dataNascimentoInput.setCustomValidity(result.valid ? "" : result.error);
      if (birthDateHint) {
        birthDateHint.textContent = result.valid && result.iso
          ? "Data selecionada: " + new Date(result.iso + "T12:00:00").toLocaleDateString("pt-BR")
          : (result.error || "Selecione dia, mês e ano.");
        birthDateHint.classList.toggle("text-red-600", !result.valid);
        birthDateHint.classList.toggle("text-slate-500", result.valid);
      }
    });
  }

  telefoneInput.addEventListener("input", function () {
    const currentValue = telefoneInput.value;
    if (!shouldFormatPhone(currentValue)) {
      return;
    }
    const cursorEnd = telefoneInput.selectionStart === telefoneInput.value.length;
    telefoneInput.value = formatPhoneMask(currentValue);
    if (cursorEnd) {
      telefoneInput.setSelectionRange(telefoneInput.value.length, telefoneInput.value.length);
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearStatus();

    const nome = normalizeLabel(nomeInput.value);
    const telefone = normalizeLabel(telefoneInput.value);
    const funcao = normalizeLabel(funcaoInput.value);
    const email = normalizeLabel(emailInput.value).toLowerCase();
    const birthDate = validateBirthDate(dataNascimentoInput && dataNascimentoInput.value);

    if (nome.length < 3) {
      showError("Informe um nome válido com pelo menos 3 caracteres.");
      return;
    }
    if (!PHONE_REGEX.test(telefone)) {
      showError("Número de celular inválido. Use o formato (xx) 9 0000 - 0000.");
      return;
    }
    if (email && !EMAIL_REGEX.test(email)) {
      showError("Informe um e-mail válido.");
      return;
    }
    if (!birthDate.valid) {
      showError(birthDate.error);
      if (dataNascimentoInput) dataNascimentoInput.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiBase + "/api/dev/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          numero_celular: telefone,
          funcao: funcao,
          email: email,
          data_nascimento: birthDate.iso,
          mostrar_aniversario: Boolean(mostrarAniversarioInput && mostrarAniversarioInput.checked),
        }),
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Não foi possível criar o usuário.");
      }

      const createdUserName = nome;
      form.reset();
      const synced = payload.github_sync && payload.github_sync.synced;
      let successMessage = "Usuário criado com sucesso e sincronizado.";
      if (!synced) {
        const reason = payload.github_sync && payload.github_sync.reason;
        successMessage = reason
          ? `Usuário registrado localmente, mas a sincronização falhou (${reason}).`
          : "Usuário registrado localmente, mas a sincronização com o GitHub não foi concluída.";
      }
      showSuccess(successMessage);
      showAccountCreated(createdUserName);
    } catch (err) {
      showError(String((err && err.message) || "Erro inesperado ao criar o usuário."));
    } finally {
      setLoading(false);
    }
  });

  if (accountCreatedCloseBtn) {
    accountCreatedCloseBtn.addEventListener("click", closeAccountCreated);
  }
  if (accountCreatedModal) {
    accountCreatedModal.addEventListener("click", function (event) {
      if (event.target === accountCreatedModal) closeAccountCreated();
    });
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && accountCreatedModal && accountCreatedModal.classList.contains("is-open")) {
      closeAccountCreated();
    }
  });
});
