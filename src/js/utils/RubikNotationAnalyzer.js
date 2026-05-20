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

class Token { constructor(t,v){this.type=t;this.value=v;} }

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
        const tokens = lexer.tokenize();

        const parser = new RubikParser(tokens);
        const operations = parser.parse();
        
        return operations;
    }
}

class RubikLexer {
    constructor(i){this.input=i;this.index=0;}
    isEOF(){return this.index>=this.input.length;}
    peek(){return this.input[this.index];}
    advance(){return this.input[this.index++];}
    tokenize(){
        const t=[];
        while(!this.isEOF()){
            const c=this.peek();
            if(/\s/.test(c)){this.advance();continue;}
            if(MOVE_PATTERN.test(c)){
                const move = this.advance();
                t.push(new Token(TOKEN_TYPES.MOVE,XYZ_BASES.includes(move.toLowerCase()) ? move.toLowerCase() : move.toUpperCase()));
                continue;
            }
            if(c==="w"){t.push(new Token(TOKEN_TYPES.WIDE,this.advance()));continue;}
            if(c==="'"){t.push(new Token(TOKEN_TYPES.PRIME,this.advance()));continue;}
            if(c==="["){t.push(new Token(TOKEN_TYPES.LBRACKET,this.advance()));continue;}
            if(c==="]"){t.push(new Token(TOKEN_TYPES.RBRACKET,this.advance()));continue;}
            if(c==="{"){t.push(new Token(TOKEN_TYPES.LBRACE,this.advance()));continue;}
            if(c==="}"){t.push(new Token(TOKEN_TYPES.RBRACE,this.advance()));continue;}
            if(c===","){t.push(new Token(TOKEN_TYPES.COMMA,this.advance()));continue;}
            if(/[0-9]/.test(c)){
                let n="";
                while(!this.isEOF()&&/[0-9]/.test(this.peek()))n+=this.advance();
                t.push(new Token(TOKEN_TYPES.NUMBER,parseInt(n,10)));continue;
            }
            if(GROUP_SYMBOLS.includes(c)){t.push(new Token(TOKEN_TYPES.SYMBOL,this.advance()));continue;}
            throw new Error(`不明な文字: ${c}`);
        }
        return t;
    }
}

class RubikParser {
    constructor(t){this.tokens=t;this.index=0;}
    isEOF(){return this.index>=this.tokens.length;}
    peek(){return this.tokens[this.index];}
    advance(){return this.tokens[this.index++];}
    parse(){
        return this.parseSequence();
    }
    parseSequence(stopTypes = []){
        const ops = [];
        while(!this.isEOF()){
            const t = this.peek();
            if(stopTypes.includes(t.type)) break;
            if(t.type===TOKEN_TYPES.MOVE){ops.push(this.parseMove());continue;}
            if(t.type===TOKEN_TYPES.LBRACKET){ops.push(...this.parsePairExpression(PAIR_KINDS.COMMUTATOR));continue;}
            if(t.type===TOKEN_TYPES.LBRACE){ops.push(...this.parsePairExpression(PAIR_KINDS.SETUP));continue;}
            if(t.type===TOKEN_TYPES.RBRACKET) throw new Error("対応する [ がない ] です");
            if(t.type===TOKEN_TYPES.RBRACE) throw new Error("対応する { がない } です");
            if(t.type===TOKEN_TYPES.COMMA) throw new Error("特殊構文外に , があります");
            if(t.type===TOKEN_TYPES.SYMBOL) throw new Error("特殊構文は未実装です");
            throw new Error(`予期しないトークン: ${t.type}`);
        }
        return ops;
    }
    parsePairExpression(kind){
        const syntax = PAIR_SYNTAX[kind];
        const isCommutator = kind === PAIR_KINDS.COMMUTATOR;
        const { openType, closeType, label, closeSymbol } = syntax;

        this.expect(openType);

        const a = this.parseSequence([TOKEN_TYPES.COMMA, closeType]);
        if(a.length === 0) throw new Error(`${label}の左辺が空です`);

        if(this.isEOF()) throw new Error(`${label}の , と ${closeSymbol} がありません`);
        if(this.peek().type !== TOKEN_TYPES.COMMA) throw new Error(`${label}には , が必要です`);
        this.advance();

        const b = this.parseSequence([closeType]);
        if(b.length === 0) throw new Error(`${label}の右辺が空です`);

        if(this.isEOF()) throw new Error(`${label}の ${closeSymbol} がありません`);
        this.expect(closeType);

        if(isCommutator) {
            return [
                ...a,
                ...b,
                ...invertOperationSequence(a),
                ...invertOperationSequence(b)
            ];
        }

        return [
            ...a,
            ...b,
            ...invertOperationSequence(a)
        ];
    }
    expect(type){
        if(this.isEOF()) throw new Error(`${type} が必要ですが入力が終了しました`);
        const t = this.advance();
        if(t.type !== type) throw new Error(`${type} が必要ですが ${t.type} が見つかりました`);
        return t;
    }
    parseMove(){
        const m=this.advance();
        const op={base:m.value,wide:false,prime:false,amount:1};
        while(!this.isEOF()){
            const n=this.peek();
            if(n.type===TOKEN_TYPES.WIDE){
                if(XYZ_BASES.includes(op.base)) {
                    throw new Error(`${op.base} はワイドムーブにできません`);
                }
                op.wide=true;this.advance();continue;
            }
            if(n.type===TOKEN_TYPES.PRIME){op.prime=true;this.advance();continue;}
            if(n.type===TOKEN_TYPES.NUMBER){op.amount=n.value;this.advance();continue;}
            break;
        }
        return op;
    }
}
