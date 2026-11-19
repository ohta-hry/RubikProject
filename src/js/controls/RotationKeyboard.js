import { OptionalExclusiveToggleGroup } from './OptionalExclusiveToggleGroup.js';
import { resolveKey } from './KeyMapping.js';

/** 長押しで連続入力するキー（バックスペース・カーソル移動）の、開始までの待ちと繰り返し間隔 */
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 60;

/** 特殊構文キーが入力する文字と、入力後のカーソル位置（挿入位置からの文字数。1 = 開き括弧の直後） */
const TEMPLATES = {
    bracket: { text: '[,]', caret: 1 },
    brace:   { text: '{,}', caret: 1 }
};

/**
 * 回転動作キーボード（U / L / B / F / R / D の6キー ＋ 修飾トグル ＋ 右側の編集キー4つ）。
 * 押したキーの文字を「最後に選択されたテキストボックス」のカーソル位置へ挿入する。
 * 一度も選択されていない場合は、回転動作欄の末尾へ入力する。
 *
 * 右側の編集キー：バックスペース / カーソル左右（＜ ＞） / [ , ] / { , }。
 * バックスペースとカーソル移動は長押しで連続動作する。
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
        this.#bindEditKeys();

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                this.#lastInput = input;
                this.#touched.add(input);
            });
        });

        // キーやトグルを押してもテキストボックスのフォーカス（カーソル）を奪わない
        panel.addEventListener('mousedown', event => {
            if (event.target.closest('.kb-key, .toggle-btn, .kb-side-btn')) {
                event.preventDefault();
            }
        });
        // 長押しでの文字選択メニュー等を出さない
        panel.addEventListener('contextmenu', event => {
            if (event.target.closest('.kb-key, .toggle-btn, .kb-side-btn')) {
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

    /**
     * キーボードを開いたときに呼ぶ。入力先のテキストボックスへフォーカスを戻し、カーソルを見える状態にする。
     * （ソフトキーボードは setNativeKeyboardEnabled(false) で出さない）
     * 一度も選択されていない欄では、カーソルは末尾。
     */
    focusTarget() {
        const target = this.#resolveTarget();
        const { start, end } = this.#selectionOf(target);

        this.#touched.add(target);
        target.focus({ preventScroll: true });
        target.setSelectionRange(start, end);
    }

    /**
     * 選択範囲（なければカーソル位置）を text で置き換える。
     * @param {string} text
     * @param {number} [caretOffset]  入力後のカーソル位置（挿入位置からの文字数）。省略時は入力した文字の直後
     */
    insert(text, caretOffset = text.length) {
        const target = this.#resolveTarget();
        const { start, end } = this.#selectionOf(target);

        target.setRangeText(text, start, end, 'end');
        this.#commit(target, start + caretOffset);
    }

    /** バックスペース：範囲選択中はその範囲を、そうでなければカーソルの直前の1文字を消す */
    backspace() {
        const target = this.#resolveTarget();
        const { start, end } = this.#selectionOf(target);

        if (start !== end) {
            target.setRangeText('', start, end, 'end');
            this.#commit(target, start);
        } else if (start > 0) {
            // サロゲートペア（絵文字など）は2単位まとめて消す
            const isPair = start >= 2
                && isLowSurrogate(target.value.charCodeAt(start - 1))
                && isHighSurrogate(target.value.charCodeAt(start - 2));
            const from = start - (isPair ? 2 : 1);
            target.setRangeText('', from, start, 'end');
            this.#commit(target, from);
        } else {
            this.#focusAt(target, 0);
        }
    }

    /** カーソルを左（-1）／右（+1）へ1文字動かす。範囲選択中は、その端へカーソルを畳む */
    moveCursor(direction) {
        const target = this.#resolveTarget();
        const { start, end } = this.#selectionOf(target);

        let position;
        if (start !== end) {
            position = direction < 0 ? start : end;
        } else {
            position = Math.min(Math.max(start + direction, 0), target.value.length);
        }
        this.#focusAt(target, position);
    }

    /** 一度も選択されていない欄は、保持しているカーソル位置を信用せず末尾とみなす */
    #selectionOf(target) {
        if (!this.#touched.has(target)) {
            const length = target.value.length;
            return { start: length, end: length };
        }
        return { start: target.selectionStart, end: target.selectionEnd };
    }

    /** 値を書き換えたあとの後始末：input を流し、フォーカスとカーソル位置を整える */
    #commit(target, caret) {
        // 高さの自動調整・自動反映など、既存の input リスナーを動かす
        target.dispatchEvent(new Event('input', { bubbles: true }));
        this.#focusAt(target, caret);
    }

    #focusAt(target, caret) {
        this.#touched.add(target);
        target.focus({ preventScroll: true });
        target.setSelectionRange(caret, caret);
    }

    /** 右側の編集キー4つの配線。長押し連続動作はポインタ、キーボード操作（Enter / Space）は click で受ける */
    #bindEditKeys() {
        const actions = {
            backspace: { run: () => this.backspace(), repeat: true },
            left:      { run: () => this.moveCursor(-1), repeat: true },
            right:     { run: () => this.moveCursor(1), repeat: true },
            bracket:   { run: () => this.insert(TEMPLATES.bracket.text, TEMPLATES.bracket.caret), repeat: false },
            brace:     { run: () => this.insert(TEMPLATES.brace.text, TEMPLATES.brace.caret), repeat: false }
        };

        this.#panel.querySelectorAll('.kb-side-btn').forEach(button => {
            const action = actions[button.dataset.action];
            if (!action) {
                return;
            }

            if (!action.repeat) {
                button.addEventListener('click', action.run);
                return;
            }

            let delayTimer = null;
            let repeatTimer = null;
            const stop = () => {
                clearTimeout(delayTimer);
                clearInterval(repeatTimer);
                delayTimer = repeatTimer = null;
            };

            button.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) {
                    return;
                }
                stop();
                action.run();
                delayTimer = setTimeout(() => {
                    repeatTimer = setInterval(action.run, REPEAT_INTERVAL_MS);
                }, REPEAT_DELAY_MS);
            });
            ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => button.addEventListener(type, stop));
            window.addEventListener('blur', stop);

            // ポインタ操作の click はすでに pointerdown で処理済み。detail === 0 はキーボード操作
            button.addEventListener('click', event => {
                if (event.detail === 0) {
                    action.run();
                }
            });
        });
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

function isHighSurrogate(code) {
    return code >= 0xD800 && code <= 0xDBFF;
}

function isLowSurrogate(code) {
    return code >= 0xDC00 && code <= 0xDFFF;
}
