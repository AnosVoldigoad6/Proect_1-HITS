/************************************************************
 *                 1. DRAG & DROP ЛОГИКА
 ************************************************************/

// Блоки в палитре
const blocks = document.querySelectorAll(".block");

// Рабочая область
const workspace = document.getElementById("workspace");

// Передаём тип блока при начале перетаскивания
blocks.forEach(block => {
  block.addEventListener("dragstart", e => {
    e.dataTransfer.setData("block-type", block.dataset.type);
  });
});

// Разрешаем drop в workspace
workspace.addEventListener("dragover", e => {
  e.preventDefault();
});

// Создание блока при drop
workspace.addEventListener("drop", e => {
  e.preventDefault();

  const type = e.dataTransfer.getData("block-type");
  if (!type) return;

  const block = createWorkspaceBlock(type);
  workspace.appendChild(block);
});

// Создание блока в рабочей области
function createWorkspaceBlock(type) {
  const el = document.createElement("div");
  el.className = "ws-block";
  el.dataset.type = type;
  el.innerHTML = renderBlockContent(type);
  el.draggable = true;
  return el;
}

// Визуальное содержимое блоков
function renderBlockContent(type) {

  if (type === "declare") {
    return `<span>var</span> <input placeholder="x, y">`;
  }

  if (type === "assign") {
    return `<input placeholder="x"> <span>=</span> <input placeholder="5 + 3">`;
  }

  return "";
}


/************************************************************
 *                2. ПАМЯТЬ ПРОГРАММЫ
 ************************************************************/

// Хранилище переменных
let memory = {};


/************************************************************
 *                3. ЗАПУСК ПРОГРАММЫ
 ************************************************************/

document.getElementById("runBtn").addEventListener("click", executeProgram);

/**
 * Главная функция:
 * 1. Очищает память
 * 2. Строит AST
 * 3. Выполняет AST
 * 4. Выводит результат
 */
function executeProgram() {
  memory = {};
  clearConsole();

  const ast = buildAST();
  executeAST(ast);

  renderConsole();
  console.log("Memory: ", memory);
}


/************************************************************
 *                4. ПОСТРОЕНИЕ AST
 ************************************************************/

/**
 * Преобразует DOM-блоки в абстрактное синтаксическое дерево
 */
function buildAST() {

  const blocks = workspace.querySelectorAll(".ws-block");
  const ast = [];

  blocks.forEach(block => {

    const type = block.dataset.type;

    // Узел объявления переменных
    if (type === "declare") {
      const input = block.querySelector("input");
      const names = input.value
        .split(",")
        .map(n => n.trim())
        .filter(n => n);

      ast.push({
        type: "declare",
        variables: names
      });
    }

    // Узел присваивания
    if (type === "assign") {
      const inputs = block.querySelectorAll("input");

      ast.push({
        type: "assign",
        variable: inputs[0].value.trim(),
        expression: inputs[1].value.trim()
      });
    }

  });

  return ast;
}


/************************************************************
 *                5. ИНТЕРПРЕТАЦИЯ AST
 ************************************************************/

/**
 * Выполняет каждый узел дерева
 */
function executeAST(ast) {

  ast.forEach(node => {

    // Объявление переменных
    if (node.type === "declare") {
      node.variables.forEach(name => {
        if (!memory.hasOwnProperty(name)) {
          memory[name] = 0;
        }
      });
    }

    // Присваивание
    if (node.type === "assign") {

      if (!memory.hasOwnProperty(node.variable)) {
        printError("Переменная не объявлена: " + node.variable);
        return;
      }

      const value = evaluateExpression(node.expression);
      memory[node.variable] = value;
    }

  });
}


/************************************************************
 *          6. СОБСТВЕННЫЙ ПАРСЕР ВЫРАЖЕНИЙ
 ************************************************************/

/**
 * Разбивает выражение на токены
 */
function tokenize(expression) {
  const regex = /\d+|[a-zA-Z]+|[()+\-*/%]/g;
  return expression.match(regex) || [];
}

/**
 * Преобразует выражение в обратную польскую запись (RPN)
 * Используется алгоритм сортировочной станции
 */
function toRPN(tokens) {

  const output = [];
  const operators = [];

  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "%": 2
  };

  tokens.forEach(token => {

    if (/^\d+$/.test(token) || /^[a-zA-Z]+$/.test(token)) {
      output.push(token);
    }

    else if ("+-*/%".includes(token)) {

      while (
        operators.length &&
        precedence[operators[operators.length - 1]] >= precedence[token]
      ) {
        output.push(operators.pop());
      }

      operators.push(token);
    }

    else if (token === "(") {
      operators.push(token);
    }

    else if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        output.push(operators.pop());
      }
      operators.pop();
    }

  });

  while (operators.length) {
    output.push(operators.pop());
  }

  return output;
}

/**
 * Вычисляет выражение в RPN
 */
function evaluateRPN(rpn) {

  const stack = [];

  rpn.forEach(token => {

    if (/^\d+$/.test(token)) {
      stack.push(parseInt(token));
    }

    else if (/^[a-zA-Z]+$/.test(token)) {

      if (!memory.hasOwnProperty(token)) {
        throw new Error("Переменная не объявлена: " + token);
      }

      stack.push(memory[token]);
    }

    else {

      const b = stack.pop();
      const a = stack.pop();

      switch (token) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/": stack.push(Math.floor(a / b)); break;
        case "%": stack.push(a % b); break;
      }
    }

  });

  return stack.pop();
}

/**
 * Главная функция вычисления выражения
 */
function evaluateExpression(expression) {

  try {
    const tokens = tokenize(expression);
    const rpn = toRPN(tokens);
    return evaluateRPN(rpn);
  } catch (e) {
    printError(e.message);
    return 0;
  }
}


/************************************************************
 *                7. КОНСОЛЬ
 ************************************************************/

function clearConsole() {
  document.getElementById("consoleOutput").innerHTML = "";
}

function renderConsole() {

  const consoleOutput = document.getElementById("consoleOutput");

  if (Object.keys(memory).length === 0) {
    consoleOutput.innerHTML = "<div>No variables</div>";
    return;
  }

  Object.keys(memory).forEach(name => {
    const line = document.createElement("div");
    line.innerHTML = `
    <span style="color:#4fc3f7">${name}</span>
    <span style="color:white"> = </span>
    <span style="color:#ffd54f">${memory[name]}</span>
  `;
    consoleOutput.appendChild(line);
  });
}

function printError(message) {
  const consoleOutput = document.getElementById("consoleOutput");
  const line = document.createElement("div");
  line.style.color = "red";
  line.textContent = "Error: " + message;
  consoleOutput.appendChild(line);
}