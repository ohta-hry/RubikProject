const MOVE_PATTERN = /[FRUBLDMESxyz]/i;
const XYZ_BASES = ['x', 'y', 'z'];
const GROUP_SYMBOLS = '()';

const PAIR_KINDS = {
    COMMUTATOR: 'commutator',
    SETUP: 'setup'
};

const TOKEN_TYPES = {
    MOVE: 'MOVE',
    WIDE: 'WIDE',
    PRIME: 'PRIME',
    NUMBER: 'NUMBER',
    SYMBOL: 'SYMBOL',
    COMMA: 'COMMA',
    LBRACKET: 'LBRACKET',
    RBRACKET: 'RBRACKET',
    LBRACE: 'LBRACE',
    RBRACE: 'RBRACE'
};

const PAIR_SYNTAX = {
    [PAIR_KINDS.COMMUTATOR]: {
        openType: TOKEN_TYPES.LBRACKET,
        closeType: TOKEN_TYPES.RBRACKET,
        label: 'コミュテータ',
        closeSymbol: ']'
    },
    [PAIR_KINDS.SETUP]: {
        openType: TOKEN_TYPES.LBRACE,
        closeType: TOKEN_TYPES.RBRACE,
        label: 'セットアップ',
        closeSymbol: '}'
    }
};

class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

function invertOperationSequence(operations) {
    return [...operations].reverse().map(operation => ({
        ...operation,
        prime: !operation.prime
    }));
}

export class RubikNotationAnalyzer {
    /**
     * @param {string} text
     * @returns {Operation[]}
     */
    static analyze(text) {
        if (typeof text !== 'string') {
            throw new TypeError('text must be string');
        }

        const lexer = new RubikLexer(text);
        const parser = new RubikParser(lexer.tokenize());
        return parser.parse();
    }
}

class RubikLexer {
    constructor(input) {
        this.input = input;
        this.index = 0;
    }

    isEOF() {
        return this.index >= this.input.length;
    }

    peek() {
        return this.input[this.index];
    }

    advance() {
        return this.input[this.index++];
    }

    tokenize() {
        const tokens = [];

        while (!this.isEOF()) {
            const char = this.peek();

            if (/\s/.test(char)) {
                this.advance();
                continue;
            }

            if (MOVE_PATTERN.test(char)) {
                tokens.push(new Token(TOKEN_TYPES.MOVE, this.#normalizeMove(this.advance())));
                continue;
            }

            if (char === 'w') {
                tokens.push(new Token(TOKEN_TYPES.WIDE, this.advance()));
                continue;
            }

            if (char === "'") {
                tokens.push(new Token(TOKEN_TYPES.PRIME, this.advance()));
                continue;
            }

            if (char === '[') {
                tokens.push(new Token(TOKEN_TYPES.LBRACKET, this.advance()));
                continue;
            }

            if (char === ']') {
                tokens.push(new Token(TOKEN_TYPES.RBRACKET, this.advance()));
                continue;
            }

            if (char === '{') {
                tokens.push(new Token(TOKEN_TYPES.LBRACE, this.advance()));
                continue;
            }

            if (char === '}') {
                tokens.push(new Token(TOKEN_TYPES.RBRACE, this.advance()));
                continue;
            }

            if (char === ',') {
                tokens.push(new Token(TOKEN_TYPES.COMMA, this.advance()));
                continue;
            }

            if (/[0-9]/.test(char)) {
                tokens.push(new Token(TOKEN_TYPES.NUMBER, this.#readNumber()));
                continue;
            }

            if (GROUP_SYMBOLS.includes(char)) {
                tokens.push(new Token(TOKEN_TYPES.SYMBOL, this.advance()));
                continue;
            }

            throw new Error(`不明な文字: ${char}`);
        }

        return tokens;
    }

    #normalizeMove(move) {
        return XYZ_BASES.includes(move.toLowerCase()) ? move.toLowerCase() : move.toUpperCase();
    }

    #readNumber() {
        let numberText = '';

        while (!this.isEOF() && /[0-9]/.test(this.peek())) {
            numberText += this.advance();
        }

        return parseInt(numberText, 10);
    }
}

class RubikParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }

    isEOF() {
        return this.index >= this.tokens.length;
    }

    peek() {
        return this.tokens[this.index];
    }

    advance() {
        return this.tokens[this.index++];
    }

    parse() {
        return this.#parseSequence();
    }

    #parseSequence(stopTypes = []) {
        const operations = [];

        while (!this.isEOF()) {
            const token = this.peek();

            if (stopTypes.includes(token.type)) {
                break;
            }

            if (token.type === TOKEN_TYPES.MOVE) {
                operations.push(this.#parseMove());
                continue;
            }

            if (token.type === TOKEN_TYPES.LBRACKET) {
                operations.push(...this.#parsePairExpression(PAIR_KINDS.COMMUTATOR));
                continue;
            }

            if (token.type === TOKEN_TYPES.LBRACE) {
                operations.push(...this.#parsePairExpression(PAIR_KINDS.SETUP));
                continue;
            }

            if (token.type === TOKEN_TYPES.RBRACKET) {
                throw new Error('対応する [ がない ] です');
            }

            if (token.type === TOKEN_TYPES.RBRACE) {
                throw new Error('対応する { がない } です');
            }

            if (token.type === TOKEN_TYPES.COMMA) {
                throw new Error('特殊構文外に , があります');
            }

            if (token.type === TOKEN_TYPES.SYMBOL) {
                throw new Error('特殊構文は未実装です');
            }

            throw new Error(`予期しないトークン: ${token.type}`);
        }

        return operations;
    }

    #parsePairExpression(kind) {
        const syntax = PAIR_SYNTAX[kind];
        const isCommutator = kind === PAIR_KINDS.COMMUTATOR;
        const { openType, closeType, label, closeSymbol } = syntax;

        this.#expect(openType);

        const setup = this.#parseSequence([TOKEN_TYPES.COMMA, closeType]);
        if (setup.length === 0) {
            throw new Error(`${label}の左辺が空です`);
        }

        if (this.isEOF()) {
            throw new Error(`${label}の , と ${closeSymbol} がありません`);
        }

        if (this.peek().type !== TOKEN_TYPES.COMMA) {
            throw new Error(`${label}には , が必要です`);
        }
        this.advance();

        const interchange = this.#parseSequence([closeType]);
        if (interchange.length === 0) {
            throw new Error(`${label}の右辺が空です`);
        }

        if (this.isEOF()) {
            throw new Error(`${label}の ${closeSymbol} がありません`);
        }

        this.#expect(closeType);

        if (isCommutator) {
            return [
                ...setup,
                ...interchange,
                ...invertOperationSequence(setup),
                ...invertOperationSequence(interchange)
            ];
        }

        return [
            ...setup,
            ...interchange,
            ...invertOperationSequence(setup)
        ];
    }

    #expect(type) {
        if (this.isEOF()) {
            throw new Error(`${type} が必要ですが入力が終了しました`);
        }

        const token = this.advance();
        if (token.type !== type) {
            throw new Error(`${type} が必要ですが ${token.type} が見つかりました`);
        }

        return token;
    }

    #parseMove() {
        const move = this.advance();
        const operation = { base: move.value, wide: false, prime: false, amount: 1 };

        while (!this.isEOF()) {
            const token = this.peek();

            if (token.type === TOKEN_TYPES.WIDE) {
                if (XYZ_BASES.includes(operation.base)) {
                    throw new Error(`${operation.base} はワイドムーブにできません`);
                }

                operation.wide = true;
                this.advance();
                continue;
            }

            if (token.type === TOKEN_TYPES.PRIME) {
                operation.prime = true;
                this.advance();
                continue;
            }

            if (token.type === TOKEN_TYPES.NUMBER) {
                operation.amount = token.value;
                this.advance();
                continue;
            }

            break;
        }

        return operation;
    }
}
