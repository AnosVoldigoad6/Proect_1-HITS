// AST УЗЛЫ ─────────────────────────────────────────────

export class DeclareNode {
  constructor(variables) {
    this.type      = "declare";
    this.variables = variables; 
  }
}

export class DeclareArrayNode {
  constructor(name, size) {
    this.type = "declareArray";
    this.name = name;  
    this.size = size;   
  }
}

export class AssignNode {
  constructor(variable, expression) {
    this.type       = "assign";
    this.variable   = variable;   
    this.expression = expression; 
  }
}

export class AssignArrayNode {
  constructor(name, index, expression) {
    this.type       = "assignArray";
    this.name       = name;
    this.index      = index;     
    this.expression = expression;
  }
}

export class IfNode {
  constructor(condition, bodyTrue, bodyFalse = []) {
    this.type      = "if";
    this.condition = condition; 
    this.bodyTrue  = bodyTrue;  
    this.bodyFalse = bodyFalse; 
  }
}

export class WhileNode {
  constructor(condition, body) {
    this.type      = "while";
    this.condition = condition;
    this.body      = body;
  }
}

export class ForNode {
  constructor(initVar, initExpr, condition, stepVar, stepExpr, body) {
    this.type     = "for";
    this.initVar  = initVar;
    this.initExpr = initExpr;
    this.condition = condition;
    this.stepVar  = stepVar;
    this.stepExpr = stepExpr;
    this.body     = body;
  }
}

// ПАМЯТЬ 

export class Memory {
  constructor() {
    this.vars   = new Map(); 
    this.arrays = new Map(); 
  }

  declareVar(name) {
    if (!this.vars.has(name)) this.vars.set(name, 0);
  }

  declareArray(name, size) {
    this.arrays.set(name, new Array(size).fill(0));
  }

  getVar(name) {
    if (!this.vars.has(name)) throw new Error("Переменная не объявлена: " + name);
    return this.vars.get(name);
  }

  setVar(name, value) {
    if (!this.vars.has(name)) throw new Error("Переменная не объявлена: " + name);
    this.vars.set(name, value);
  }

  getArray(name, index) {
    if (!this.arrays.has(name)) throw new Error("Массив не объявлен: " + name);
    const arr = this.arrays.get(name);
    if (index < 0 || index >= arr.length) throw new Error(`Индекс ${index} за пределами массива ${name}`);
    return arr[index];
  }

  setArray(name, index, value) {
    if (!this.arrays.has(name)) throw new Error("Массив не объявлен: " + name);
    const arr = this.arrays.get(name);
    if (index < 0 || index >= arr.length) throw new Error(`Индекс ${index} за пределами массива ${name}`);
    arr[index] = value;
  }

  hasVar(name)   { return this.vars.has(name); }
  hasArray(name) { return this.arrays.has(name); }
}