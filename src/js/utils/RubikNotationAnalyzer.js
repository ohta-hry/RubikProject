const MOVE_PATTERN = /([FBUDLRMES])(w)?(\d+)?(')?/gy;

export class RubikNotationAnalyzer {
    /**
     * @param {string} text
     * @returns {Operation[]}
     */
    static analyze(text) {
        if (typeof text !== 'string') {
            throw new TypeError('text must be a string');
        }

        const operations = [];
        let index = 0;

        while (index < text.length) {
            const char = text[index];

            if (/\s/.test(char)) {
                index++;
                continue;
            }

            MOVE_PATTERN.lastIndex = index;
            const match = MOVE_PATTERN.exec(text);

            if (!match) {
                throw new Error(`Invalid token near: ${text.slice(index)}`);
            }

            operations.push({
                base: match[1],
                wide: Boolean(match[2]),
                prime: Boolean(match[4]),
                amount: match[3] ? Number(match[3]) : 1
            });

            index = MOVE_PATTERN.lastIndex;
        }

        return operations;
    }
}
