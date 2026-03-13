
// разбивает строку на токены
export function tokenize(expr) {
  const regex = /\d+|[a-zA-Z_]\w*|>=|<=|!=|==|[><()+\-*/%\[\]]/g;
  return expr.match(regex) ?? [];
}

// приоритет арифметических операторов
const ARITH_PREC = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };

// перевод выражения в RPN
function toArithRPN(tokens) {
  const output = [];
  const operators = [];

  for (const tok of tokens) {

    if (/^\d+$/.test(tok) || /^[a-zA-Z_]\w*$/.test(tok)) {
      output.push(tok);

    } else if (tok in ARITH_PREC) {

      while (
        operators.length &&
        operators[operators.length - 1] in ARITH_PREC &&
        ARITH_PREC[operators[operators.length - 1]] >= ARITH_PREC[tok]
      ) {
        output.push(operators.pop());
      }

      operators.push(tok);

    } else if (tok === "(") {
      operators.push(tok);

    } else if (tok === ")") {

      while (operators.length && operators[operators.length - 1] !== "(") {
        output.push(operators.pop());
      }

      operators.pop();
    }
  }

  while (operators.length) output.push(operators.pop());

  return output;
}

// обработка arr[i]
function expandArrayAccess(tokens, memory) {

  const result = [];
  let i = 0;

  while (i < tokens.length) {

    const tok = tokens[i];

    if (
      /^[a-zA-Z_]\w*$/.test(tok) &&
      tokens[i + 1] === "["
    ) {

      i += 2;

      let depth = 1;
      const indexTokens = [];

      while (i < tokens.length && depth > 0) {

        if (tokens[i] === "[") depth++;
        else if (tokens[i] === "]") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }

        indexTokens.push(tokens[i]);
        i++;
      }

      const expandedIndex = expandArrayAccess(indexTokens, memory);
      const idx = evalArithRPN(toArithRPN(expandedIndex), memory);

      result.push(String(memory.getArray(tok, idx)));

    } else {

      result.push(tok);
      i++;

    }
  }

  return result;
}

// вычисление RPN
function evalArithRPN(rpn, memory) {

  const stack = [];

  for (const tok of rpn) {

    if (/^\d+$/.test(tok)) {

      stack.push(parseInt(tok, 10));

    } else if (/^[a-zA-Z_]\w*$/.test(tok)) {

      stack.push(memory.getVar(tok));

    } else {

      const b = stack.pop();
      const a = stack.pop();

      if (a === undefined || b === undefined) {
        throw new Error("Некорректное выражение");
      }

      switch (tok) {

        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;

        case "/":
          if (b === 0) throw new Error("Деление на ноль");
          stack.push(Math.trunc(a / b));
          break;

        case "%":
          stack.push(a % b);
          break;

      }
    }
  }

  const result = stack.pop();

  if (result === undefined) throw new Error("Пустое выражение");

  return result;
}

// вычисление арифметического выражения
export function evalArith(expression, memory) {

  const tokens = tokenize(expression);
  const expanded = expandArrayAccess(tokens, memory);
  const rpn = toArithRPN(expanded);

  return evalArithRPN(rpn, memory);
}

// операторы сравнения
const CMP_OPS = new Set([">", "<", "==", "!=", ">=", "<="]);

// вычисление логического условия
export function evalCondition(condition, memory) {

  const tokens = tokenize(condition);

  const parser = new ConditionParser(tokens, memory);

  const result = parser.parseExpr();

  return Boolean(result);
}

class ConditionParser {

  constructor(tokens, memory) {
    this.tokens = tokens;
    this.pos = 0;
    this.memory = memory;
  }

  peek() {
    return this.tokens[this.pos] ?? null;
  }

  consume() {
    return this.tokens[this.pos++];
  }

  parseExpr() {

    let left = this.parseTerm();

    while (this.peek()?.toUpperCase() === "OR") {

      this.consume();

      const right = this.parseTerm();

      left = left || right;
    }

    return left;
  }

  parseTerm() {

    let left = this.parseFactor();

    while (this.peek()?.toUpperCase() === "AND") {

      this.consume();

      const right = this.parseFactor();

      left = left && right;
    }

    return left;
  }

  parseFactor() {

    if (this.peek()?.toUpperCase() === "NOT") {

      this.consume();

      return !this.parseFactor();

    }

    if (this.peek() === "(") {

      this.consume();

      const val = this.parseExpr();

      this.consume();

      return val;
    }

    return this.parseComparison();
  }

// сравнение выражений
  parseComparison() {

    const leftToks = [];
    const rightToks = [];
    let op = null;

    while (this.pos < this.tokens.length) {

      const tok = this.peek();

      if (tok === null) break;

      const up = tok.toUpperCase();

      if (up === "AND" || up === "OR" || up === "NOT" || tok === ")") break;

      if (CMP_OPS.has(tok)) {
        op = this.consume();
        break;
      }

      leftToks.push(this.consume());
    }

    if (op === null) {

      return evalArith(leftToks.join(""), this.memory) !== 0;
    }

    while (this.pos < this.tokens.length) {

      const tok = this.peek();

      if (tok === null) break;

      const up = tok.toUpperCase();

      if (up === "AND" || up === "OR" || up === "NOT" || tok === ")") break;

      rightToks.push(this.consume());
    }

    const left = evalArith(leftToks.join(""), this.memory);
    const right = evalArith(rightToks.join(""), this.memory);

    switch (op) {

      case ">": return left > right;
      case "<": return left < right;
      case "==": return left === right;
      case "!=": return left !== right;
      case ">=": return left >= right;
      case "<=": return left <= right;
      default: return false;

    }
  }
}
