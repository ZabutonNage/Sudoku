if (!window.PS) throw new Error(`PureScript dependencies must be loaded first.`);


Vue.component(`number-selector`, {
    props: {
        inputNumbers: {
            type: Array,
            required: true
        },
        activeNumber: {
            type: Number,
            required: true
        }
    },
    methods: {
        selectionChanged(num) {
            this.$emit(`selection-changed`, num);
        }
    },
    template: `
<div class="number-selector">
    <span v-for="num in inputNumbers"
          class="square-box"
          :class="{ active: num === activeNumber }"
          @click="selectionChanged(num)"
    >{{num}}</span>
</div>
`
});


(PS => {
    const Sudoku = {
        generate: PS[`Sudoku.Generation`].generate,
        isValid: PS[`Sudoku.Validation`].isValid
    };

    new Vue({
        el: `#app`,
        data: {
            numbers: undefined,
            inputNumbers: Array.from({ length: 9 }, (_, i) => i + 1),
            activeNumber: 1,
            isRevealed: false,
            boardFeedback : {
                correct: false,
                wrong: false
            },
            eraseMode: false
        },
        created() {
            const numbers = Sudoku.generate();

            // TODO high amounts of indices to remove don't reliably result in a unique puzzle
            const removableIndices = SudokuJS.getRemovableIndices(numbers, 42);  // 57 seems max, 56 is reasonably likely to succeed

            this.numbers = numbers.map((value, i) => {
                const editable = removableIndices.includes(i);
                return {
                    value,
                    playerValue: undefined,
                    editable
                };
            });
        },
        computed: {
            isFilledOut() {
                return this.editableNums.filter(numObj => numObj.playerValue === undefined).length === 0;
            },
            editableNums() {
                return this.numbers.filter(numObj => numObj.editable);
            },
            isBoardEmpty() {
                return this.editableNums.filter(numObj => numObj.playerValue !== undefined).length === 0;
            }
        },
        methods: {
            editableClick(numObj) {
                numObj.playerValue = this.eraseMode || this.activeNumber === numObj.playerValue ? undefined : this.activeNumber;
                if (this.isBoardEmpty) {
                    this.eraseMode = false;
                }
            },
            selectionChanged(num) {
                this.activeNumber = num;
            },
            clearInputs() {
                this.numbers.forEach(num => num.editable && (num.playerValue = undefined));
            },
            toggleReveal() {
                this.isRevealed = !this.isRevealed;
            },
            checkBoard() {
                const numsOnBoard = this.numbers.map(num => num.editable ? num.playerValue : num.value);
                this.showFeedback(Sudoku.isValid(numsOnBoard));
            },
            showFeedback(correct) {
                if (correct) {
                    this.boardFeedback.correct = true;
                }
                else {
                    this.boardFeedback.wrong = true;
                }

                setTimeout(() => {
                    this.boardFeedback.correct = this.boardFeedback.wrong = false;
                }, 3000);
            },
            toggleEraseMode() {
                this.eraseMode = !this.eraseMode;
            }
        },
        template: `
<div>
    <div class="sudoku-container">
        <div class="sudoku-field">
            <span v-for="num in numbers" class="number-box" :class="{ editable: num.editable }">
                <span v-if="num.editable" @click="editableClick(num)">{{isRevealed ? num.value : num.playerValue}}</span>
                <span v-else>{{num.value}}</span>
            </span>
        </div>
        <number-selector class="vertical" :input-numbers="inputNumbers" :activeNumber="activeNumber" @selection-changed="selectionChanged"></number-selector>
        <number-selector :input-numbers="inputNumbers" :activeNumber="activeNumber" @selection-changed="selectionChanged"></number-selector>
        <span class="square-box" :class="{ eraseMode }" @click="toggleEraseMode">X</span>
    </div>
    <button @click="clearInputs">Clear</button>
    <button @click="toggleReveal">{{isRevealed ? 'Conceal' : 'Reveal'}}</button>
    <button v-if="isFilledOut" @click="checkBoard">Check</button>
    <span v-show="boardFeedback.correct">Correct!</span>
    <span v-show="boardFeedback.wrong">Board has errors</span>
</div>
`
    });
})(PS);
