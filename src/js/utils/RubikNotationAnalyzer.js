const NORMAL_MOVE_PATTERN = /[FRUBLDMESxyz]/i;

class Token { constructor(t,v){this.type=t;this.value=v;} }

function OperationArrayPrime(operations) {
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
            if(NORMAL_MOVE_PATTERN.test(c)){
                const move = this.advance();
                t.push(new Token("MOVE",/[xyz]/i.test(move) ? move.toLowerCase() : move.toUpperCase()));
                continue;
            }
            if(c==="w"){t.push(new Token("WIDE",this.advance()));continue;}
            if(c==="'"){t.push(new Token("PRIME",this.advance()));continue;}
            if(c==="["){t.push(new Token("LBRACKET",this.advance()));continue;}
            if(c==="]"){t.push(new Token("RBRACKET",this.advance()));continue;}
            if(c===","){t.push(new Token("COMMA",this.advance()));continue;}
            if(/[0-9]/.test(c)){
                let n="";
                while(!this.isEOF()&&/[0-9]/.test(this.peek()))n+=this.advance();
                t.push(new Token("NUMBER",parseInt(n,10)));continue;
            }
            if("(){}".includes(c)){t.push(new Token("SYMBOL",this.advance()));continue;}
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
            if(t.type==="MOVE"){ops.push(this.parseMove());continue;}
            if(t.type==="LBRACKET"){ops.push(...this.parseCommutator());continue;}
            if(t.type==="RBRACKET") throw new Error("対応する [ がない ] です");
            if(t.type==="COMMA") throw new Error("コミュテータ外に , があります");
            if(t.type==="SYMBOL") throw new Error("特殊構文は未実装です");
            throw new Error(`予期しないトークン: ${t.type}`);
        }
        return ops;
    }
    parseCommutator(){
        this.expect("LBRACKET");

        const a = this.parseSequence(["COMMA", "RBRACKET"]);
        if(a.length === 0) throw new Error("コミュテータの左辺が空です");

        if(this.isEOF()) throw new Error("コミュテータの , と ] がありません");
        if(this.peek().type !== "COMMA") throw new Error("コミュテータには , が必要です");
        this.advance();

        const b = this.parseSequence(["RBRACKET"]);
        if(b.length === 0) throw new Error("コミュテータの右辺が空です");

        if(this.isEOF()) throw new Error("コミュテータの ] がありません");
        this.expect("RBRACKET");

        return [
            ...a,
            ...b,
            ...OperationArrayPrime(a),
            ...OperationArrayPrime(b)
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
            if(n.type==="WIDE"){
                if(["x","y","z"].includes(op.base)) {
                    throw new Error(`${op.base} はワイドムーブにできません`);
                }
                op.wide=true;this.advance();continue;
            }
            if(n.type==="PRIME"){op.prime=true;this.advance();continue;}
            if(n.type==="NUMBER"){op.amount=n.value;this.advance();continue;}
            break;
        }
        return op;
    }
}
