// MAIN 

import { buildAST, executeProgram } from "./interpreter.js";
import { Memory }                   from "./nodes.js";

// DOM

const workspace     = document.getElementById("workspace");
const trashBtn      = document.getElementById("trashBtn");
const runBtn        = document.getElementById("runBtn");
const resetBtn      = document.getElementById("resetBtn");
const consoleOutput = document.getElementById("consoleOutput");
const settingsBtn   = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeModal    = document.getElementById("closeModal");
const themeToggle   = document.getElementById("themeToggle");

// СОСТОЯНИЕ 

let draggedBlock = null;

const dropPlaceholder = document.createElement("div");
dropPlaceholder.className = "drop-placeholder";

// КОНСОЛЬ 

function clearConsole() {
  consoleOutput.innerHTML = "";
}

function renderMemory(memory) {
  if (memory.vars.size === 0 && memory.arrays.size === 0) {
    consoleOutput.innerHTML = "<div>No variables</div>";
    return;
  }

  for (const [name, value] of memory.vars) {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="variable-name">${name}</span>
      <span> = </span>
      <span class="variable-value">${value}</span>`;
    consoleOutput.appendChild(line);
  }

  for (const [name, arr] of memory.arrays) {
    const line = document.createElement("div");
    line.innerHTML = `
      <span class="variable-name">${name}</span>
      <span> = </span>
      <span class="variable-value">[${arr.join(", ")}]</span>`;
    consoleOutput.appendChild(line);
  }
}

function printError(message) {
  const line = document.createElement("div");
  line.className   = "console-error";
  line.textContent = "Error: " + message;
  consoleOutput.appendChild(line);
}

// МОДАЛКА / ТЕМА 

settingsBtn.addEventListener("click", () => settingsModal.classList.add("active"));
closeModal.addEventListener("click",  () => settingsModal.classList.remove("active"));
settingsModal.addEventListener("click", e => {
  if (e.target === settingsModal) settingsModal.classList.remove("active");
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.classList.add("active");
  const icon = themeToggle.querySelector("i");
  icon.className = document.body.classList.contains("dark")
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
  setTimeout(() => themeToggle.classList.remove("active"), 500);
});

// ЗАПУСК / СБРОС 

runBtn.addEventListener("click", () => {
  clearConsole();
  const memory = new Memory();

  try {
    const { ast } = buildAST(workspace);
    executeProgram(ast, memory, printError);
    renderMemory(memory);
  } catch (e) {
    printError(e.message);
  }
});

resetBtn.addEventListener("click", () => {
  workspace.innerHTML = "";
  clearConsole();
});

// ПАЛИТРА 

for (const item of document.querySelectorAll(".block")) {
  item.addEventListener("dragstart", e => {
    draggedBlock = null;
    e.dataTransfer.setData("block-type", item.dataset.type);
  });
}

// WORKSPACE drag

workspace.addEventListener("dragover", e => {
  e.preventDefault();
  const target = getDropTarget(e.clientY, workspace);
  target
    ? workspace.insertBefore(dropPlaceholder, target)
    : workspace.appendChild(dropPlaceholder);
});

workspace.addEventListener("dragleave", e => {
  if (!workspace.contains(e.relatedTarget)) dropPlaceholder.remove();
});

workspace.addEventListener("drop", e => {
  e.preventDefault();
  dropPlaceholder.remove();

  if (draggedBlock !== null) {
    const target = getDropTarget(e.clientY, workspace);
    if (!draggedBlock.contains(target)) {
      target
        ? workspace.insertBefore(draggedBlock, target)
        : workspace.appendChild(draggedBlock);
    }
    return;
  }

  const type = e.dataTransfer.getData("block-type");
  if (!type) return;
  workspace.appendChild(createWorkspaceBlock(type));
});

// КОРЗИНА

trashBtn.addEventListener("dragover", e => {
  e.preventDefault();
  trashBtn.classList.add("trash-active");
});

trashBtn.addEventListener("dragleave", () => {
  trashBtn.classList.remove("trash-active");
});

trashBtn.addEventListener("drop", e => {
  e.preventDefault();
  trashBtn.classList.remove("trash-active");
  dropPlaceholder.remove();
  if (draggedBlock !== null) {
    draggedBlock.remove();
    draggedBlock = null;
  }
});

// HELPERS

function getDropTarget(clientY, container) {
  const children = [...container.children].filter(
    el => el !== dropPlaceholder && el !== draggedBlock
  );
  for (const child of children) {
    const { top, height } = child.getBoundingClientRect();
    if (clientY < top + height / 2) return child;
  }
  return null;
}

function bindInner(inner) {
  inner.addEventListener("dragover", e => {
    e.preventDefault();
    e.stopPropagation();
    const target = getDropTarget(e.clientY, inner);
    target
      ? inner.insertBefore(dropPlaceholder, target)
      : inner.appendChild(dropPlaceholder);
  });

  inner.addEventListener("dragleave", e => {
    if (!inner.contains(e.relatedTarget)) dropPlaceholder.remove();
  });

  inner.addEventListener("drop", e => {
    e.preventDefault();
    e.stopPropagation();
    dropPlaceholder.remove();

    if (draggedBlock !== null) {
      if (draggedBlock.contains(inner)) return;
      const target = getDropTarget(e.clientY, inner);
      target
        ? inner.insertBefore(draggedBlock, target)
        : inner.appendChild(draggedBlock);
      return;
    }

    const blockType = e.dataTransfer.getData("block-type");
    if (!blockType) return;
    inner.appendChild(createWorkspaceBlock(blockType));
  });
}

// СОЗДАНИЕ БЛОКА

function createWorkspaceBlock(type) {
  const el = document.createElement("div");
  el.className    = "ws-block";
  el.dataset.type = type;
  el.draggable    = true;
  el.innerHTML    = renderBlockContent(type);

  el.addEventListener("dragstart", e => {
    e.stopPropagation();
    draggedBlock = el;
    e.dataTransfer.setData("block-type", "");
    setTimeout(() => el.classList.add("dragging"), 0);
  });

  el.addEventListener("dragend", () => {
    el.classList.remove("dragging");
    draggedBlock = null;
    dropPlaceholder.remove();
    trashBtn.classList.remove("trash-active");
  });

  for (const inner of el.querySelectorAll(".inner-blocks, .inner-true, .inner-false")) {
    bindInner(inner);
  }

  return el;
}

// ШАБЛОНЫ БЛОКОВ

const CMP_SELECT = `
  <select>
    <option value=">">></option>
    <option value="<">&lt;</option>
    <option value="==">=</option>
    <option value="!=">!=</option>
    <option value=">=">>=</option>
    <option value="<="><=</option>
  </select>`;

function renderBlockContent(type) {
  switch (type) {

    case "declare":
      return `
        <span class="block-label">var</span>
        <input type="text" placeholder="x, y, z">`;

    case "declareArray":
      return `
        <span class="block-label">array</span>
        <input type="text" placeholder="arr">
        <span class="block-label">[</span>
        <input type="text" placeholder="10">
        <span class="block-label">]</span>`;

    case "assign":
      return `
        <input type="text" placeholder="x">
        <span class="block-label">=</span>
        <input type="text" placeholder="x + 1">`;

    case "assignArray":
      return `
        <input type="text" placeholder="arr">
        <span class="block-label">[</span>
        <input type="text" placeholder="i">
        <span class="block-label">]</span>
        <span class="block-label">=</span>
        <input type="text" placeholder="arr[i] + 1">`;

    case "if":
      return `
        <div class="block-row">
          <span class="block-label">if</span>
          <input class="cond-input wide" type="text" placeholder="x > 0 AND y != 0">
        </div>
        <div class="block-section">
          <span class="section-label">then</span>
          <div class="inner-blocks inner-true"></div>
        </div>
        <div class="block-section">
          <span class="section-label">else</span>
          <div class="inner-blocks inner-false"></div>
        </div>`;

    case "while":
      return `
        <div class="block-row">
          <span class="block-label">while</span>
          <input class="cond-input wide" type="text" placeholder="i < 10">
        </div>
        <div class="inner-blocks"></div>`;

    case "for":
      return `
        <div class="block-row for-row">
          <span class="block-label">for</span>
          <input type="text" placeholder="i" class="for-var">
          <span class="block-label">=</span>
          <input type="text" placeholder="0">
          <span class="block-label">;</span>
          <input class="cond-input" type="text" placeholder="i < 10">
          <span class="block-label">;</span>
          <input type="text" placeholder="i">
          <span class="block-label">=</span>
          <input type="text" placeholder="i + 1">
        </div>
        <div class="inner-blocks"></div>`;

    default:
      return "";
  }
}