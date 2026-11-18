import { OptionalExclusiveToggleGroup } from './OptionalExclusiveToggleGroup.js';
import { resolveKey } from './KeyMapping.js';

/**
 * 回転動作キーボード（U / L / B / F / R / D の6キー ＋ 修飾トグル）。
 * 押したキーの文字を「最後に選択されたテキストボックス」のカーソル位置へ挿入する。
 * 一度も選択されていない場合は、回転動作欄の末尾へ入力する。
 *
 * 下段の2つのトグル（回転量 ' / 2、層・軸 w / xyz / MES）に応じて、
 * 6キーのラベルと入力内容が変わる。対応表は KeyMapping.js。
 * 対応するキーがない組み合わせでは、そのキーは文字なし・押せない状態になる。
 */
export class RotationKeyboard {
    #panel;
    #inputs;
    #fallbackInput;
    #isUsable;
    #lastInput;
    #touched = new WeakSet();

    #keys;
    #turn;    // 回転量トグル（' / 2）
    #layer;   // 層・軸トグル（w / xyz / MES）

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

        this.#keys = Array.from(panel.querySelectorAll('.kb-key'));
        const onToggle = () => this.#refreshKeys();
        this.#turn = new OptionalExclusiveToggleGroup(panel.querySelector('[data-toggle="turn"]'), onToggle);
        this.#layer = new OptionalExclusiveToggleGroup(panel.querySelector('[data-toggle="layer"]'), onToggle);
        this.#refreshKeys();

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.#lastInput = input;
                this.#touched.add(input);
            });
        });

        // キーやトグルを押してもテキストボックスのフォーカス（カーソル）を奪わない
        panel.addEventListener('mousedown', event => {
            if (event.target.closest('.kb-key, .toggle-btn')) {
                event.preventDefault();
            }
        });

        panel.addEventListener('click', event => {
            const key = event.target.closest('.kb-key');
            if (key && !key.disabled) {
                this.insert(resolveKey(key.dataset.move, this.#toggleState()).text);
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

    #toggleState() {
        return { layer: this.#layer.value, turn: this.#turn.value };
    }

    /** 現在のトグル状態を6キーの表示（ラベル・押せるか・読み上げ名）へ反映する */
    #refreshKeys() {
        const state = this.#toggleState();

        this.#keys.forEach(key => {
            const base = key.dataset.move;
            const { text, enabled } = resolveKey(base, state);

            key.disabled = !enabled;
            key.textContent = text;
            key.setAttribute('aria-label', enabled ? `${text} を入力` : `${base} は使えません`);
            key.style.setProperty('--label-len', String(Math.max(text.length, 1)));   // 長いラベルは CSS 側で文字を縮める
        });
    }

    #resolveTarget() {
        return this.#isUsable(this.#lastInput) ? this.#lastInput : this.#fallbackInput;
    }
}
