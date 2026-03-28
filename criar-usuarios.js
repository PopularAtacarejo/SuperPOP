document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("createUserForm");
  const nomeInput = document.getElementById("nomeInput");
  const telefoneInput = document.getElementById("telefoneInput");
  const funcaoInput = document.getElementById("funcaoInput");
  const emailInput = document.getElementById("emailInput");
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnLabel = document.getElementById("submitBtnLabel");
  const errorBox = document.getElementById("formError");
  const successBox = document.getElementById("formSuccess");

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
        }),
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Não foi possível criar o usuário.");
      }

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
    } catch (err) {
      showError(String((err && err.message) || "Erro inesperado ao criar o usuário."));
    } finally {
      setLoading(false);
    }
  });
});
