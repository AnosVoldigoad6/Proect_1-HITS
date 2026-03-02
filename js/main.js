


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
      <span >var</span>
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

function createWorkspaceBlock(type) {
  const el = document.createElement("div");
  el.className = "ws-block";
  el.dataset.type = type;

  el.innerHTML = renderBlockContent(type);

  el.draggable = true;

  return el;
}

let draggedBlock = null;

// Когда начинаем тащить блок внутри workspace
workspace.addEventListener("dragstart", e => {
  if (e.target.classList.contains("ws-block")) {
    draggedBlock = e.target;
    e.dataTransfer.effectAllowed = "move";
  }
});



// Пока тащим над workspace
workspace.addEventListener("dragover", e => {
  e.preventDefault();

  const afterElement = getDragAfterElement(workspace, e.clientY);

  if (afterElement == null) {
    workspace.appendChild(draggedBlock);
  } else {
    workspace.insertBefore(draggedBlock, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".ws-block:not(.dragging)")
  ];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}


let runBtn =document.getElementById("runBtn")

let memory = {};

document.getElementById("runBtn").addEventListener("click", executeProgram);


function executeProgram(){

  memory = {};

  const blocks = workspace.querySelectorAll(".ws-block")

  blocks.forEach(block =>{
    const type = block.dataset.type;

    if (type === "declare"){
      handleDeclare(block)
    }

    if (type === "assign"){
      handleAssign(block)
    }


  })

  console.log("Memory: ", memory)
}


function handleDeclare(block){

  const inp = block.querySelector("input")
  if(!inp) return;

  const val = inp.value;
  if(!val) return;
  
  const names = val.split(",");

  names.forEach((name)=>{
    const clearName = name.trim();
    if(clearName){
      memory[clearName] = 0;
    }
  })

}

function handleAssign(block) {

  const inputs = block.querySelectorAll("input");

  const variableName = inputs[0].value.trim();
  const expression = inputs[1].value.trim();

  if (!memory.hasOwnProperty(variableName)) {
    alert("Переменная не объявлена: " + variableName);
    return;
  }

  const result = evaluateExpression(expression);

  memory[variableName] = result;
}


function evaluateExpression(expression) {

  // заменяем переменные на их значения
  Object.keys(memory).forEach(name => {
    const value = memory[name];
    const regex = new RegExp("\\b" + name + "\\b", "g");
    expression = expression.replace(regex, value);
  });

  try {
    return Math.floor(eval(expression));
  } catch (e) {
    alert("Ошибка в выражении: " + expression);
    return 0;
  }
}