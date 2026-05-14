const NORMAL_MOVE_PATTERN = /[FRUBLDMES]/i;

class Token { constructor(t,v){this.type=t;this.value=v;} }

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
            if(NORMAL_MOVE_PATTERN.test(c)){t.push(new Token("MOVE",this.advance()));continue;}
            if(c==="w"){t.push(new Token("WIDE",this.advance()));continue;}
            if(c==="'"){t.push(new Token("PRIME",this.advance()));continue;}
            if(/[0-9]/.test(c)){
                let n="";
                while(!this.isEOF()&&/[0-9]/.test(this.peek()))n+=this.advance();
                t.push(new Token("NUMBER",parseInt(n,10)));continue;
            }
            if("[](){}".includes(c)){t.push(new Token("SYMBOL",this.advance()));continue;}
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
        const ops=[];
        while(!this.isEOF()){
            const t=this.peek();
            if(t.type==="MOVE"){ops.push(this.parseMove());continue;}
            if(t.type==="SYMBOL") throw new Error("特殊構文は未実装です");
            throw new Error(`予期しないトークン: ${t.type}`);
        }
        return ops;
    }
    parseMove(){
        const m=this.advance();
        const op={base:m.value,wide:false,prime:false,amount:1};
        while(!this.isEOF()){
            const n=this.peek();
            if(n.type==="WIDE"){op.wide=true;this.advance();continue;}
            if(n.type==="PRIME"){op.prime=true;this.advance();continue;}
            if(n.type==="NUMBER"){op.amount=n.value;this.advance();continue;}
            break;
        }
        return op;
    }
}