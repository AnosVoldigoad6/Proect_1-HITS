// --- MODAL ---
const settingsBtn = document.getElementById("settingsBtn");
const modal = document.getElementById("settingsModal");
const closeModal = document.getElementById("closeModal");

settingsBtn.onclick = function () {
  modal.classList.add("active");
};

closeModal.onclick = function () {
  modal.classList.remove("active");
};


 

// --- DARK MODE ---
const themeToggle = document.getElementById("themeToggle");
const icon = themeToggle.querySelector("i");

// Проверка сохранённой темы при загрузке
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  icon.classList.remove("fa-moon");
  icon.classList.add("fa-sun");
}

// Переключение темы
themeToggle.onclick = function () {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  if (isDark) {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  } else {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }

  // Добавляем анимацию кнопке
  themeToggle.classList.add("active");
  setTimeout(function () {
    themeToggle.classList.remove("active");
  }, 500);

  // Сохраняем выбор
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

// --- CONSOLE ---
// const input = document.getElementById("consoleInput");
// const output = document.getElementById("consoleOutput");

// input.onkeydown = function (e) {
//   if (e.key === "Enter") {
//     const value = input.value.trim();
//     if (value === "") return;

    // Команда clear
    // if (value.toLowerCase() === "clear") {
    //   output.innerHTML = "";
    //   input.value = "";
    //   return;
    // }

    // Добавляем введённую строку
    // const line = document.createElement("div");
    // line.innerHTML = `<span style="color:#22c55e">></span> ${value}`;
    // output.appendChild(line);

    // Пример ответа
//     const response = document.createElement("div");
//     response.textContent = "Output: " + value;
//     response.style.color = "#38bdf8";
//     output.appendChild(response);

//     input.value = "";

//     // Автоскролл вниз
//     output.scrollTop = output.scrollHeight;
//   }
// };

const blocks = document.querySelectorAll(".block");
const workspace = document.getElementById("workspace");

blocks.forEach(block => {
  block.addEventListener("dragstart", e => {
    // передаём тип блока
    e.dataTransfer.setData("block-type", block.dataset.type);
  });
});

// разрешаем сброс
workspace.addEventListener("dragover", e => {
  e.preventDefault();
});

// обработка drop
workspace.addEventListener("drop", e => {
  e.preventDefault();

  const type = e.dataTransfer.getData("block-type");
  if (!type) return;

  const block = createWorkspaceBlock(type);
  workspace.appendChild(block);
});

function createWorkspaceBlock(type) {
  const el = document.createElement("div");
  el.className = "ws-block";
  el.dataset.type = type;

  el.innerHTML = renderBlockContent(type);

  return el;
}

function renderBlockContent(type) {

  if (type === "declare") {
    return `
      <span>var</span>
      <input placeholder="x">
    `;
  }

  if (type === "assign") {
    return `
      <input placeholder="x">
      <span>=</span>
      <input placeholder="5">
    `;
  }

  if (type === "if") {
    return `
      <span>IF (</span>
      <input placeholder="x > 0">
      <span>)</span>
    `;
  }

  if (type === "while") {
    return `
      <span>WHILE (</span>
      <input placeholder="x < 10">
      <span>)</span>
    `;
  }
}