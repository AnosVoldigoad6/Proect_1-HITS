const blocks = document.querySelectorAll(".block");
const workspace = document.getElementById("workspace");

blocks.forEach(block => {
  block.addEventListener("dragstart", e => {
    e.dataTransfer.setData("block-type", block.dataset.type);
  });
});

workspace.addEventListener("dragover", e => {
  e.preventDefault();
});

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

  const inner = el.querySelector(".inner-blocks");

  if (inner) {

    inner.addEventListener("dragover", e => {
      e.preventDefault();
    });

    inner.addEventListener("drop", e => {
      e.preventDefault();
      e.stopPropagation();

      const type = e.dataTransfer.getData("block-type");
      if (!type) return;

      const newBlock = createWorkspaceBlock(type);
      inner.appendChild(newBlock);
    });
  }

  return el;
}

function renderBlockContent(type) {

  if (type === "declare") {
    return `
      <span>variables</span>
      <input placeholder="variable names">`;
  }

  else if (type === "assign") {
    return `
      <input placeholder="variable">
      <span>=</span>
      <input placeholder="arithmetic expression">`;
  }

  else if (type === "if") {
    return `
      <div class="condition">
        <input placeholder="arithmetic expression">
        <select>
          <option value=">">></option>
          <option value="<"><</option>
          <option value="==">=</option>
          <option value="!=">!=</option>
          <option value=">=">>=</option>
          <option value="<="><=</option>
        </select>
        <input placeholder="arithmetic expression">
      </div>
      <div class="inner-blocks"></div>`;
  }

  else if (type === "while") {
    return `
      <div class="condition">
        <input placeholder="arithmetic expression">
        <select>
          <option value=">">></option>
          <option value="<"><</option>
          <option value="==">=</option>
          <option value="!=">!=</option>
          <option value=">=">>=</option>
          <option value="<="><=</option>
        </select>
        <input placeholder="arithmetic expression">
      </div>
      <div class="inner-blocks"></div>`;
  }

  return ;
}

function evaluateCondition(leftExpr, operator, rightExpr) {

  const left = evaluateExpression(leftExpr);
  const right = evaluateExpression(rightExpr);

  switch (operator) {
    case ">": return left > right;
    case "<": return left < right;
    case "==": return left === right;
    case "!=": return left !== right;
    case ">=": return left >= right;
    case "<=": return left <= right;
    default: return false;
  }
}


let memory = {};


document.getElementById("runBtn").addEventListener("click", executeProgram);


function executeProgram() {
  memory = {};
  clearConsole();

  const ast = buildAST();
  executeAST(ast);

  renderConsole();
  console.log("Memory: ", memory);
}



function buildAST(container = workspace) {

  const blocks = container.children;
  const ast = [];

  Array.from(blocks).forEach(block => {

    const type = block.dataset.type;

    if (type === "declare") {
      const input = block.querySelector("input");

      ast.push({
        type: "declare",
        variables: input.value
          .split(",")
          .map(n => n.trim())
          .filter(n => n)
      });
    }

    else if (type === "assign") {
      const inputs = block.querySelectorAll("input");

      ast.push({
        type: "assign",
        variable: inputs[0].value.trim(),
        expression: inputs[1].value.trim()
      });
    }

    else if (type === "if") {

      const inputs = block.querySelectorAll(".condition input");
      const operator = block.querySelector("select").value;

      ast.push({
        type: "if",
        left: inputs[0].value.trim(),
        operator,
        right: inputs[1].value.trim(),
        body: buildAST(block.querySelector(".inner-blocks"))
      });
    }

    else if (type === "while") {

      const inputs = block.querySelectorAll(".condition input");
      const operator = block.querySelector("select").value;

      ast.push({
        type: "while",
        left: inputs[0].value.trim(),
        operator,
        right: inputs[1].value.trim(),
        body: buildAST(block.querySelector(".inner-blocks"))
      });
    }

  });

  return ast;
}


function executeAST(ast) {

  ast.forEach(node => {

    if (node.type === "declare") {
      node.variables.forEach(name => {
        if (!memory.hasOwnProperty(name)) {
          memory[name] = 0;
        }
      });
    }

    if (node.type === "assign") {

      if (!memory.hasOwnProperty(node.variable)) {
        printError("Переменная не объявлена: " + node.variable);
        return;
      }

      memory[node.variable] =
        evaluateExpression(node.expression);
    }

    if (node.type === "if") {

      if (evaluateCondition(node.left, node.operator, node.right)) {
        executeAST(node.body);
      }
    }

    if (node.type === "while") {

      let safety = 0;

      while (evaluateCondition(node.left, node.operator, node.right)) {

        executeAST(node.body);

        safety++;
        if (safety > 1000) {
          printError("Бесконечный цикл остановлен");
          break;
        }
      }
    }

  });
}


function tokenize(expression) {
  const regex = /\d+|[a-zA-Z]+|[()+\-*/%]/g;
  return expression.match(regex) || [];
}

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