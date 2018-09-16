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
          class="selectable-number"
          :class="{ active: num === activeNumber }"
          @click="selectionChanged(num)"
    >{{num}}</span>
</div>
`
});


(PS => {
    // TODO implement some sort of check button to conclude the game
    // TODO implement eraser for when you want to clear several differing numbers

    const Sudoku = PS[`Sudoku.Generation`];

    new Vue({
        el: `#app`,
        data: {
            msg: `fghdoikdjfg`,
            numbers: undefined,
            inputNumbers: Array.from({ length: 9 }, (_, i) => i + 1),
            activeNumber: 1,
            emptyRate: .55,
            isRevealed: false
        },
        methods: {
            editableClick(numObj) {
                numObj.playerValue = this.activeNumber === numObj.playerValue ? undefined : this.activeNumber;
            },
            selectionChanged(num) {
                this.activeNumber = num;
            },
            clearInputs() {
                this.numbers.forEach(num => num.editable && (num.playerValue = undefined));
            },
            toggleReveal() {
                this.isRevealed = !this.isRevealed;
            }
        },
        created() {
            const numbers = Sudoku.generate();
            // const numbers = newSudoku().getNumbers();

            // TODO high amounts of indices to remove don't reliably result in a unique puzzle
            const removableIndices = getRemovableIndices(numbers, 42);  // 57 seems max, 56 is reasonably likely to succeed

            this.numbers = numbers.map((value, i) => {
                const editable = removableIndices.includes(i);
                return {
                    value,
                    playerValue: editable ? undefined : value,
                    editable
                };
            });
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
    </div>
    <button @click="clearInputs">Clear</button>
    <button @click="toggleReveal">{{isRevealed ? 'Conceal' : 'Reveal'}}</button>
</div>
`
    });
})(PS);
