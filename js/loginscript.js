 const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  togglePassword.addEventListener("click", function () {
    // Tukar type antara password <-> text
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Tukar icon ikut state
    this.textContent = type === "password" ? "👁" : "🙈";
  });