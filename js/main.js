// --- MODAL ---
const settingsBtn = document.getElementById("settingsBtn");
const modal = document.getElementById("settingsModal");
const closeModal = document.getElementById("closeModal");

settingsBtn.addEventListener("click", () => {
  modal.classList.add("active");
});

closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
});

// --- DARK MODE ---
const themeToggle = document.getElementById("themeToggle");
const icon = themeToggle.querySelector("i");

// Проверка localStorage при загрузке
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  icon.classList.replace("fa-moon", "fa-sun");
}

// Переключение темы
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  icon.classList.toggle("fa-moon", !isDark);
  icon.classList.toggle("fa-sun", isDark);

  localStorage.setItem("theme", isDark ? "dark" : "light");
});