document.addEventListener("DOMContentLoaded", function () {

  // ================= MODAL =================
  const settingsBtn = document.getElementById("settingsBtn");
  const modal = document.getElementById("settingsModal");
  const closeModal = document.getElementById("closeModal");

  settingsBtn.addEventListener("click", function () {
    modal.classList.add("active");
  });

  closeModal.addEventListener("click", function () {
    modal.classList.remove("active");
  });

  // Закрытие по клику вне окна
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // ================= DARK MODE =================
  const themeToggle = document.getElementById("themeToggle");
  const icon = themeToggle.querySelector("i");

  // Проверка сохранённой темы
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");

    // Меняем иконку
    if (isDark) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }

    // Анимация
    themeToggle.classList.add("active");
    setTimeout(function () {
      themeToggle.classList.remove("active");
    }, 400);

    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  
  // ================= DRAG & DROP =================
  const blocks = document.querySelectorAll(".sidebar .block");
  const workspace = document.querySelector(".workspace");
  const resetBtn = document.getElementById("resetBtn");

  blocks.forEach(block => {
    block.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", block.textContent);
    });
  });

  workspace.addEventListener("dragover", function (e) {
    e.preventDefault();
  });

  workspace.addEventListener("drop", function (e) {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");

    createWorkspaceBlock(text);
    saveWorkspace();
  });

  function createWorkspaceBlock(text) {
    const newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.textContent = text;
    workspace.appendChild(newBlock);
  }

  // ================= SAVE =================
  function saveWorkspace() {
    const workspaceBlocks = workspace.querySelectorAll(".block");
    const data = [];

    workspaceBlocks.forEach(block => {
      data.push(block.textContent);
    });

    localStorage.setItem("workspaceBlocks", JSON.stringify(data));
  }

  function loadWorkspace() {
    const data = JSON.parse(localStorage.getItem("workspaceBlocks"));

    if (data) {
      data.forEach(text => {
        createWorkspaceBlock(text);
      });
    }
  }

  loadWorkspace();

  // ================= RESET =================
  resetBtn.addEventListener("click", function () {
    workspace.innerHTML = "<h2>Workspace</h2>";
    localStorage.removeItem("workspaceBlocks");
  });

});