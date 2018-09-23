const sudoku = newSudoku();


function newSudoku() {
    const blocks = initBlocks();
    build();

    return Object.freeze({
        print,
        getNumbers
    });


    function getNumbers() {
        return seq(81).reduce((acc, i) => {
            const iBlock = getBlockIndex(i);
            const block = blocks[iBlock];
            const entries = Object.entries(block.numbers).filter(entry => entry[1].y === Math.floor(i / 9) % 3).sort((a, b) => a[1].x - b[1].x);

            return acc.concat(parseInt(entries[i % 3][0]));
        }, []);

    }

    function initBlocks() {
        // blocks are the 3x3 sections
        return seq(9).map(() => ({
            numbers: seq(9).reduce((acc, i) => {
                acc[i] = { x: NaN, y: NaN };
                return acc;
            }, {}),
            available: {
                ys: seq(9).map(i => Math.floor(i / 3))
            }
        }));
    }

    function build() {
        seq(3).forEach(iBlockRow => {
            const firstBlock = blocks[iBlockRow * 3];
            const secondBlock = blocks[iBlockRow * 3 + 1];
            const thirdBlock = blocks[iBlockRow * 3 + 2];

            seq(9).forEach(num => setupYsForNumber(firstBlock, secondBlock, thirdBlock, num));
        });

        seq(3).forEach(iBlockCol => {
            const firstBlock = wrapBlock(blocks[iBlockCol]);
            const secondBlock = wrapBlock(blocks[iBlockCol + 3]);
            const thirdBlock = wrapBlock(blocks[iBlockCol + 6]);

            setupXs(firstBlock, secondBlock, thirdBlock);
        });

        return undefined;


        function wrapBlock(block) {
            return {
                getNumber: num => block.numbers[num],
                getRows: () => seq(3).map(getEntriesInRow)
            };

            function getEntriesInRow(row) {
                return Object.entries(block.numbers)
                    .filter(entry => entry[1].y === row)
                    .map(entry => ({ value: parseInt(entry[0]), pos: entry[1] }));
            }
        }

        function setupYsForNumber(firstBlock, secondBlock, thirdBlock, num) {
            // TODO method could need a rework to no longer depend on param num and to streamline initBlocks()
            const ys = [0, 1, 2];

            const yFirst = getRandomElement(firstBlock.available.ys);

            ys.splice(ys.findIndex(y => y === yFirst), 1);

            const secondBlockEmptyYs = ys.reduce((acc, y) => secondBlock.available.ys.some(ay => ay === y) ? acc.concat(y) : acc, []);
            if (secondBlockEmptyYs.length === 0) {
                throw new Error(`No space available for ys`);
            }
            const ySecondOnly = secondBlockEmptyYs.length === 1 ? secondBlockEmptyYs[0] : undefined;
            if (secondBlockEmptyYs.length === 1) {
                ys.splice(ys.findIndex(y => y === ySecondOnly), 1);
            }

            const thirdBlockEmptyYs = ys.reduce((acc, y) => thirdBlock.available.ys.some(ay => ay === y) ? acc.concat(y) : acc, []);
            if (thirdBlockEmptyYs.length === 0) {
                throw new Error(`No space available for ys`);
            }

            const yThird = getRandomElement(thirdBlockEmptyYs);
            thirdBlock.numbers[num].y = yThird;
            thirdBlock.available.ys.splice(thirdBlock.available.ys.findIndex(y => y === yThird), 1);
            ys.splice(ys.findIndex(y => y === yThird), 1);

            const ySecond = ySecondOnly === undefined ? ys[0] : ySecondOnly;
            secondBlock.numbers[num].y = ySecond;
            secondBlock.available.ys.splice(secondBlock.available.ys.findIndex(y => y === ySecond), 1);

            firstBlock.numbers[num].y = yFirst;
            firstBlock.available.ys.splice(firstBlock.available.ys.findIndex(y => y === yFirst), 1);
        }

        function setupXs(firstBlock, secondBlock, thirdBlock) {
            const rowsFirstBlock = firstBlock.getRows();
            const rowsSecondBlock = secondBlock.getRows();
            const rowsThirdBlock = thirdBlock.getRows();

            const permutationsPerRow = rowsFirstBlock.concat(rowsSecondBlock, rowsThirdBlock)
                .map(row => getPermutations(row.map(entry => entry.value)))
                .map(shuffleElements);


            const validPermutations = getValidPermutations(permutationsPerRow);

            validPermutations.slice(0, 3).forEach(nums => nums.forEach((num, col) => firstBlock.getNumber(num).x = col));
            validPermutations.slice(3, 6).forEach(nums => nums.forEach((num, col) => secondBlock.getNumber(num).x = col));
            validPermutations.slice(6, 9).forEach(nums => nums.forEach((num, col) => thirdBlock.getNumber(num).x = col));


            return undefined;


            function getValidPermutations(permutationsPerRow) {
                const ppr = permutationsPerRow;
                const activePerms = Array.from({ length: ppr.length }, () => 0);
                const startRow = 3;  // starting at 3 as any combination of the first three rows is valid

                setStateToValidPerms(startRow);

                return ppr.map((row, i) => row[activePerms[i]]);


                function setStateToValidPerms(currentRow) {
                    if (currentRow === ppr.length) return;

                    const nextRow = checkColsUntilCurrentRow(currentRow)
                        ? currentRow + 1
                        : rotateNextPerm(currentRow);

                    return setStateToValidPerms(nextRow);
                }

                function checkColsUntilCurrentRow(row) {
                    const stats = seq(row + 1).reduce((cols, r) => {
                        const perm = ppr[r][activePerms[r]];
                        seq(3).forEach(i => {
                            cols[i][perm[i]] = (cols[i][perm[i]] || 0) + 1;
                        });
                        return cols;
                    }, { 0: {}, 1: {}, 2: {} });

                    return Object.values(stats).every(rowStats => Object.values(rowStats).every(val => val === 1));
                }

                function rotateNextPerm(currentRow) {
                    activePerms[currentRow]++;

                    if (activePerms[currentRow] < ppr[currentRow].length)
                        return currentRow;

                    activePerms[currentRow] = 0;
                    return rotateNextPerm(currentRow - 1);
                }
            }
        }
    }

    function print() {
        seq(3).forEach(iBlockRow => {
            seq(3).forEach(iRow => {
                const firstBlock = blocks[iBlockRow * 3];
                const secondBlock = blocks[iBlockRow * 3 + 1];
                const thirdBlock = blocks[iBlockRow * 3 + 2];

                const firstNums = Object.entries(firstBlock.numbers).filter(entry => entry[1].y === iRow).sort(byX).map(entry => entry[0]).join(` `);
                const secondNums = Object.entries(secondBlock.numbers).filter(entry => entry[1].y === iRow).sort(byX).map(entry => entry[0]).join(` `);
                const thirdNums = Object.entries(thirdBlock.numbers).filter(entry => entry[1].y === iRow).sort(byX).map(entry => entry[0]).join(` `);

                console.log(`${firstNums}  ${secondNums}  ${thirdNums}`);
            });
            console.log();
        });

        function byX(a, b) {
            return a[1].x - b[1].x;
        }
    }
}

function getRemovableIndices(numbers, amount) {
    if ((numbers || []).length !== 81) throw new Error(`'numbers' must be an array with 81 elements`);

    // TODO develop an algorithm that reliably creates valid solution even with high amounts of numbers to be removed
    const testSudoku = numbers.slice(0);
    const indices = seq(81);
    const maxTries = 1000;
    const removableIndices = _getRemovableIndices(amount, [], maxTries);

    return removableIndices.length === amount
        ? removableIndices
        : [];


    function _getRemovableIndices(remaining, acc, remainingTries) {
        if (remaining === 0) return acc;
        if (remainingTries === 0) {
            console.warn(`Sudoku: Couldn't find a unique solution`);
            return [];
        }

        const index = getRandomElement(indices);
        const candidate = testSudoku[index];

        testSudoku[index] = undefined;

        if (hasUniqueSolution(testSudoku)) {
            indices.splice(indices.indexOf(index), 1);
            return _getRemovableIndices(remaining - 1, acc.concat(index), maxTries);
        }

        testSudoku[index] = candidate;
        return _getRemovableIndices(remaining, acc, remainingTries - 1);
    }
}
function hasUniqueSolution(numbers) {
    if ((numbers || []).length !== 81) throw new Error(`'numbers' must be an array of 81 elements`);

    const allNums = seq(9);
    return placeNumbers(numbers);


    function placeNumbers(numbers) {
        const solution = numbers.slice(0);
        const emptyIndices = solution.reduce((acc, num, i) => Number.isInteger(num) ? acc : acc.concat(i), []);

        if (emptyIndices.length === 0) return true;

        const hasProgress = emptyIndices.reduce((hasProgress, index) => {
            const numsInRow = getNumbersInRow(solution, index);
            const missingInRow = getDifference(allNums, numsInRow);

            if (missingInRow.length === 1) {
                solution[index] = missingInRow[0];
                return true;
            }

            const numsInCol = getNumbersInColumn(solution, index);
            const missingInCol = getDifference(allNums, numsInCol);

            if (missingInCol.length === 1) {
                solution[index] = missingInCol[0];
                return true;
            }

            const numsInBlock = getNumbersInBlock(solution, index);
            const missingInBlock = getDifference(allNums, numsInBlock);

            if (missingInBlock.length === 1) {
                solution[index] = missingInBlock[0];
                return true;
            }

            const overlappingNums = arrAND(missingInRow, missingInCol, missingInBlock);

            if (overlappingNums.length === 1) {
                solution[index] = overlappingNums[0];
                return true;
            }

            return hasProgress;
        }, false);

        return hasProgress ? placeNumbers(solution) : false;
    }

    function getNumbersInRow(numbers, index) {
        const start = Math.floor(index / 9) * 9;
        return numbers.slice(start, start + 9).filter(Number.isInteger);
    }

    function getNumbersInColumn(numbers, index) {
        const column = seq(9).map(i => numbers[i * 9 + index % 9]);
        return column.filter(Number.isInteger);
    }

    function getNumbersInBlock(numbers, index) {
        const iBlock = getBlockIndex(index);
        return numbers.filter((num, i) => Number.isInteger(num) && getBlockIndex(i) === iBlock);
    }

    function getDifference(arrBase, arrCompare) {
        return arrBase.filter(x => !arrCompare.includes(x));
    }
}


function getBlockIndex(index) {
    return Math.floor(index / 3) % 3 + Math.floor(index / 27) * 3;
}
function seq(length) {
    return Array.from({ length }, (_, i) => i);
}

function randInt(length) {
    return Math.floor(Math.random() * length);
}

function getRandomElement(arr) {
    return arr[randInt(arr.length)];
}

function removeElement(arr, value) {
    return arr.filter(x => x !== value);
}

function arrAND(arr, ...arrs) {
    return arr.filter(el => arrs.every(a => a.includes(el)));
}

function shuffleElements(arr) {
    return _shuffleElements(seq(arr.length), []);

    function _shuffleElements(indices, acc) {
        if (indices.length === 0) return acc;

        const i = getRandomElement(indices);
        const nextAcc = acc.concat([arr[i]]);
        const nextIndices = removeElement(indices, i);

        return _shuffleElements(nextIndices, nextAcc);
    }
}

function getPermutations(arr) {
    const perms = [arr];

    seq(5).reduce((last, i) => {
        const perm = swap(last, i % 2);
        perms.push(perm);
        return perm;
    }, arr);

    return perms;

    function swap([a, b, c], i) {
        return i === 0
            ? [b, a, c]
            : [a, c, b];
    }
}
