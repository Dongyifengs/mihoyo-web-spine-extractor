import { parse } from 'acorn';

// Decode data literals only. Never execute a remote activity script.
export function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') {
    const value = Object.create(null);
    for (const property of node.properties) {
      if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') {
        throw new Error('资源包含不支持的动态属性');
      }
      const key = property.key.name ?? property.key.value;
      Object.defineProperty(value, key, { value: literal(property.value), enumerable: true });
    }
    return value;
  }
  if (node.type === 'UnaryExpression' && ['-', '+', '!'].includes(node.operator)) {
    const value = literal(node.argument);
    return node.operator === '-' ? -value : node.operator === '+' ? +value : !value;
  }
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
    && !node.callee.computed && node.callee.object.name === 'JSON'
    && node.callee.property.name === 'parse' && node.arguments.length === 1
    && node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'string') {
    return JSON.parse(node.arguments[0].value);
  }
  throw new Error(`资源包含动态表达式：${node.type}`);
}

export function decodeBundle(source, keys) {
  const wanted = new Set(keys);
  const values = new Map();
  const stack = [parse(source, { ecmaVersion: 'latest', sourceType: 'script' })];
  while (stack.length) {
    const node = stack.pop();
    if (node.type === 'Property' && !node.computed && node.kind === 'init') {
      const key = node.key.value ?? node.key.name;
      if (wanted.has(key)) {
        if (values.has(key)) throw new Error(`资源定位不唯一：${key}`);
        values.set(key, literal(node.value));
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child.type === 'string') stack.push(child);
      } else if (value && typeof value.type === 'string') stack.push(value);
    }
  }
  for (const key of wanted) if (!values.has(key)) throw new Error(`官方脚本中未找到资源：${key}`);
  return values;
}

export function atlasPages(text) {
  return text.replace(/\r/g, '').split(/\n\s*\n/).map((part) => part.trim().split('\n')[0]).filter(Boolean);
}
