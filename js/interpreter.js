// Здесь строится AST из блоков на странице и потом выполняется программа

import {
  DeclareNode, DeclareArrayNode,
  AssignNode, AssignArrayNode,
  IfNode, WhileNode, ForNode,
  // Memory
} from "./nodes.js";

import { evalArith, evalCondition } from "./script.js";

// Сборка AST из блоков интерфейса 

export function buildAST(container) {
  const ast      = [];
  const domNodes = [];

  for (const block of container.children) {
    const { type } = block.dataset;
    if (!type) continue;

    domNodes.push(block);

    if (type === "declare") {
      const input     = block.querySelector("input");
      const variables = input.value.split(",").map(n => n.trim()).filter(Boolean);
      ast.push(new DeclareNode(variables));
    }

    else if (type === "declareArray") {
      const [nameInput, sizeInput] = block.querySelectorAll("input");
      ast.push(new DeclareArrayNode(nameInput.value.trim(), sizeInput.value.trim()));
    }

    else if (type === "assign") {
      const [varInput, exprInput] = block.querySelectorAll("input");
      ast.push(new AssignNode(varInput.value.trim(), exprInput.value.trim()));
    }

    else if (type === "assignArray") {
      const [nameInput, idxInput, exprInput] = block.querySelectorAll("input");
      ast.push(new AssignArrayNode(
        nameInput.value.trim(),
        idxInput.value.trim(),
        exprInput.value.trim()
      ));
    }

    else if (type === "if") {
      const condInput  = block.querySelector(".cond-input");
      const trueInner  = block.querySelector(".inner-true");
      const falseInner = block.querySelector(".inner-false");
      const { ast: bodyTrue }  = buildAST(trueInner);
      const { ast: bodyFalse } = falseInner ? buildAST(falseInner) : { ast: [] };
      ast.push(new IfNode(condInput.value.trim(), bodyTrue, bodyFalse));
    }

    else if (type === "while") {
      const condInput = block.querySelector(".cond-input");
      const { ast: body } = buildAST(block.querySelector(".inner-blocks"));
      ast.push(new WhileNode(condInput.value.trim(), body));
    }

    else if (type === "for") {
      const inputs = block.querySelectorAll("input");
      const [initVar, initExpr, condInput, stepVar, stepExpr] = inputs;
      const { ast: body } = buildAST(block.querySelector(".inner-blocks"));
      ast.push(new ForNode(
        initVar.value.trim(),
        initExpr.value.trim(),
        condInput.value.trim(),
        stepVar.value.trim(),
        stepExpr.value.trim(),
        body
      ));
    }
  }

  return { ast, domNodes };
}

// Запуск программы (интерпретатор) 

export function executeProgram(ast, memory, onError) {
  executeAST(ast, memory, onError);
}

// Проходимся по всем узлам AST и выполняем их по очереди
function executeAST(ast, memory, onError) {
  for (const node of ast) {
    try {
      executeNode(node, memory, onError);
    } catch (e) {
      onError(e.message);
      return;
    }
  }
}

// Выполняем один конкретный узел
function executeNode(node, memory, onError) {
  if (node.type === "declare") {
    for (const name of node.variables) {
      memory.declareVar(name);
    }
  }

  else if (node.type === "declareArray") {
    const size = evalArith(node.size, memory);
    if (size <= 0) throw new Error("Размер массива должен быть > 0");
    memory.declareArray(node.name, size);
  }

  else if (node.type === "assign") {
    if (!memory.hasVar(node.variable)) {
      throw new Error("Переменная не объявлена: " + node.variable);
    }
    memory.setVar(node.variable, evalArith(node.expression, memory));
  }

  else if (node.type === "assignArray") {
    const idx = evalArith(node.index, memory);
    const val = evalArith(node.expression, memory);
    memory.setArray(node.name, idx, val);
  }

  else if (node.type === "if") {
    const cond = evalCondition(node.condition, memory);
    if (cond) {
      executeAST(node.bodyTrue,  memory, onError);
    } else {
      executeAST(node.bodyFalse, memory, onError);
    }
  }

  else if (node.type === "while") {
    let safety = 0;
    while (evalCondition(node.condition, memory)) {
      executeAST(node.body, memory, onError);
      if (++safety > 10000) throw new Error("Бесконечный цикл остановлен");
    }
  }

  else if (node.type === "for") {
    memory.declareVar(node.initVar);
    memory.setVar(node.initVar, evalArith(node.initExpr, memory));

    let safety = 0;
    while (evalCondition(node.condition, memory)) {
      executeAST(node.body, memory, onError);
      memory.setVar(node.stepVar, evalArith(node.stepExpr, memory));
      if (++safety > 10000) throw new Error("Бесконечный цикл остановлен");
    }
  }
}
