export class Pattern {
  constructor(query) {
    this.query = query;
  }
  // part is the region of the hap that is active during the query
  queryWithParts(a, b) {
    return this.query(a, b).map((hap) => ({
      ...hap,
      _a: Math.max(hap.a, a),
      _b: Math.min(hap.b, b),
    }));
  }
}
export const P = (q) => new Pattern(q);

export const cycle = (callback) =>
  P((a, b) => {
    a = Math.floor(a);
    b = Math.ceil(b);
    let bag = [];
    while (a < b) {
      bag = bag.concat(callback(a, a + 1));
      a++;
    }
    return bag;
  });

export const repeat = (value) => cycle((a, b) => [{ a, b, value }]);
export const nest = (value, a, b) => {
  if (value instanceof Pattern) {
    return value.query(a, b);
  }
  return [{ a, b, value }];
};

export const cat = (...values) =>
  cycle((a, b) => {
    let value = values[a % values.length];
    return nest(value, a, b);
  });

export const stack = (...values) =>
  cycle((a, b) => values.map((value) => nest(value, a, b)).flat());

export const seq = (...values) => fast(values.length, cat(...values));

export function minifyArgs(args) {
  return args.map((arg) => {
    if (typeof arg === "string") {
      return mini(arg);
    }
    return arg;
  });
}

export const registerPattern = (name, fn) => {
  //let q = (...args) => patternifyArgs(fn, args);
  let q = (...args) => fn(...minifyArgs(args));
  Pattern.prototype[name] = function (...args) {
    return q(...args, this);
  };
  String.prototype[name] = function (...args) {
    return q(...args, mini(this));
  };
  return q;
};

export const fast = registerPattern("fast", (factor, pat) =>
  P((a, b) =>
    pat.query(a * factor, b * factor).map((hap) => ({
      a: hap.a / factor,
      b: hap.b / factor,
      value: hap.value,
    }))
  )
);

export const slow = registerPattern("slow", (factor, pat) =>
  fast(1 / factor, pat)
);

export const firstOf = registerPattern("firstOf", (n, fn, pat) =>
  cycle((a, b) => (a % n === 0 ? fn(pat) : pat).query(a, b))
);
export const lastOf = registerPattern("lastOf", (n, fn, pat) =>
  cycle((a, b) => (a % n === n - 1 ? fn(pat) : pat).query(a, b))
);

// value ops
export const withValue = registerPattern("withValue", (fn, pat) =>
  P((a, b) => pat.query(a, b).map((hap) => ({ ...hap, value: fn(hap.value) })))
);

export const add = registerPattern("add", (n, pat) =>
  pat.withValue((v) => v + n)
);
export const sub = registerPattern("sub", (n, pat) =>
  pat.withValue((v) => v - n)
);
export const mul = registerPattern("mul", (n, pat) =>
  pat.withValue((v) => v * n)
);
export const div = registerPattern("div", (n, pat) =>
  pat.withValue((v) => v / n)
);
export const mod = registerPattern("mod", (n, pat) =>
  pat.withValue((v) => v % n)
);

export const reify = (value) =>
  value instanceof Pattern ? value : repeat(value);

// parser

let token_types = {
  open_cat: /^\</,
  close_cat: /^\>/,
  open_seq: /^\[/,
  close_seq: /^\]/,
  plain: /^[a-zA-Z0-9\.\#\-]+/,
};
function next_token(code) {
  for (let type in token_types) {
    const match = code.match(token_types[type]);
    if (match) {
      return { type, value: match[0] };
    }
  }
  throw new Error(`could not match "${code}"`);
}

function tokenize(code) {
  let tokens = [];
  while (code.length > 0) {
    code = code.trim();
    const token = next_token(code);
    code = code.slice(token.value.length);
    tokens.push(token);
  }
  return tokens;
}

class Parser {
  parse(code) {
    this.tokens = tokenize(code);
    const args = this.parse_args();
    if (args.length > 1) {
      // "a b c" === "[a b c]"
      return { type: "seq", args };
    }
    return args[0];
  }
  consume(type) {
    const token = this.tokens.shift();
    if (token.type !== type) {
      throw new Error(`expected token type ${type}, got ${token.type}`);
    }
    return token;
  }
  parse_expr() {
    let next = this.tokens[0]?.type;
    if (next === "open_cat") {
      return this.parse_cat();
    }
    if (next === "open_seq") {
      return this.parse_seq();
    }
    if (next === "plain") {
      return this.consume("plain");
    }
    throw new Error(
      `unexpected token "${this.tokens[0].value}" of type ${this.tokens[0].type}`
    );
  }
  parse_args(close_type) {
    const args = [];
    while (this.tokens[0]?.type !== close_type) {
      args.push(this.parse_expr());
    }
    return args;
  }
  parse_seq() {
    this.consume("open_seq");
    const args = this.parse_args("close_seq");
    this.consume("close_seq");
    return { type: "seq", args };
  }
  parse_cat() {
    this.consume("open_cat");
    const args = this.parse_args("close_cat");
    this.consume("close_cat");
    return { type: "cat", args };
  }
}

function patternifyTree(tree) {
  if (tree.type === "cat") {
    const args = tree.args.map((arg) => patternifyTree(arg));
    return cat(...args);
  }
  if (tree.type === "seq") {
    const args = tree.args.map((arg) => patternifyTree(arg));
    return seq(...args);
  }
  if (tree.type === "plain") {
    return tree.value;
  }
}

const parser = new Parser();

export let mini = (code) => {
  const tree = parser.parse(code);
  const pat = patternifyTree(tree);
  return reify(pat);
};

export const $ = (ministring) => {
  ministring = Array.isArray(ministring) ? ministring[0] : ministring;
  const pat = mini(ministring);
  const latency = 0.1;
  let f = 4,
    dur = 1 / f;
  let phi;
  return impulse(f).signal((t, id) => {
    let begin = phi || t,
      end = t + dur;
    const haps = pat.query(begin, end);
    phi = end;
    const events = haps
      .filter((hap) => hap.a >= t && hap.a < end)
      .map((hap) => ({
        id,
        value: Number(hap.value),
        time: hap.a + latency - t,
      }));
    if (events.length) {
      // console.log(t.toFixed(2), begin.toFixed(2), end.toFixed(2), events);
      repl.audio.setControls(events);
    }
  });
};
