/**
 * 回転動作キーボード（U / L / B / F / R / D の6キー）。
 * 押したキーの文字を「最後に選択されたテキストボックス」のカーソル位置へ挿入する。
 * 一度も選択されていない場合は、回転動作欄の末尾へ入力する。
 */
export class RotationKeyboard {
    #panel;
    #inputs;
    #fallbackInput;
    #isUsable;
    #lastInput;
    #touched = new WeakSet();

    /**
     * @param {object} options
     * @param {HTMLElement} options.panel       キーボード本体
     * @param {HTMLTextAreaElement[]} options.inputs  入力先になるテキストボックス
     * @param {HTMLTextAreaElement} options.fallbackInput  選択履歴がないときの入力先
     * @param {(input: HTMLTextAreaElement) => boolean} [options.isUsable]  入力先として使えるか
     */
    constructor({ panel, inputs, fallbackInput, isUsable = () => true }) {
        this.#panel = panel;
        this.#inputs = inputs;
        this.#fallbackInput = fallbackInput;
        this.#isUsable = isUsable;
        this.#lastInput = fallbackInput;

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.#lastInput = input;
                this.#touched.add(input);
            });
        });

        // キーを押してもテキストボックスのフォーカス（カーソル）を奪わない
        panel.addEventListener('mousedown', event => {
            if (event.target.closest('.kb-key')) {
                event.preventDefault();
            }
        });

        panel.addEventListener('click', event => {
            const key = event.target.closest('.kb-key');
            if (key) {
                this.insert(key.dataset.move);
            }
        });
    }

    /** キーボード表示中は端末のソフトキーボードを出さない（カーソル移動のためにタップしても被らないように） */
    setNativeKeyboardEnabled(enabled) {
        this.#inputs.forEach(input => {
            if (enabled) {
                input.removeAttribute('inputmode');
            } else {
                input.setAttribute('inputmode', 'none');
            }
        });
    }

    insert(text) {
        const target = this.#resolveTarget();
        const length = target.value.length;

        // 一度も選択されていない欄は、保持しているカーソル位置を信用せず末尾へ
        const start = this.#touched.has(target) ? target.selectionStart : length;
        const end = this.#touched.has(target) ? target.selectionEnd : length;

        target.setRangeText(text, start, end, 'end');
        this.#touched.add(target);

        // 高さの自動調整など、既存の input リスナーを動かす
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.focus({ preventScroll: true });
        target.setSelectionRange(target.selectionStart, target.selectionEnd);
    }

    #resolveTarget() {
        return this.#isUsable(this.#lastInput) ? this.#lastInput : this.#fallbackInput;
    }
}
