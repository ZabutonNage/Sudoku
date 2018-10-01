const SudokuJS = (function () {
    return Object.freeze({
        generate,
        getRemovableIndices
    });


    function generate() {
        const cols = transpose(getPartialBlockRows()).map(getValidColumnPermutation);
        return cols[0].reduce((acc, _, i) => acc.concat(cols.reduce((row, col) => row.concat(col[i]), [])), []);


        function getPartialBlockRows() {
            return seq(3).reduce(acc => {
                const first = [];
                const second = [];
                const third = [];

                seq(9).map(add(1)).forEach(num => {
                    const y1 = get1stBlockY(first);
                    const y3 = get3rdBlockY(third, y1, get2ndBlockPossibleYs(second, y1));
                    const y2 = get2ndBlockY(second, y1, y3);

                    first.push({ num, y: y1 });
                    second.push({ num, y: y2 });
                    third.push({ num, y: y3 });
                });

                return acc.concat([[first, second, third]]);
            }, []);
        }
        function getValidColumnPermutation(partialBlockColumn) {
            const allPermutations = partialBlockColumn.reduce(
                (acc, block) => acc.concat(
                    seq(3).map(y => getPermutations(block.filter(partial => partial.y === y).map(partial => partial.num))))
                , []);

            return getValidPermutation(allPermutations);
        }

        function get1stBlockY(partialBlock) {
            return getRandomElement(availableYs(partialBlock));
        }
        function get2ndBlockPossibleYs(partialBlock, y1) {
            const available = new Set(availableYs(partialBlock));
            available.delete(y1);
            return Array.from(available);
        }
        function get2ndBlockY(partialBlock, y1, y3) {
            return difference(nub(availableYs(partialBlock)), [y1, y3])[0];
        }
        function get3rdBlockY(partialBlock, y1, possibleY2s) {
            const occupiedYs = possibleY2s.length === 1 ? [possibleY2s[0], y1] : [y1];
            const possibleY3s = availableYs(partialBlock).filter(y => !occupiedYs.includes(y));
            return getRandomElement(possibleY3s);
        }

        function availableYs(partialBlock) {
            return difference(seq(9).map(mod(3)), partialBlock.map(num => num.y));
        }
        function getValidPermutation(permutationsPerRow) {
            const ppr = permutationsPerRow;
            const activePerms = seq(ppr.length).map(() => 0);
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

        function transpose(arr) {
            return arr[0].map((_, i) => arr.map(nested => nested[i]));
        }
        function difference(minuendArr, subtrahendArr) {
            const minuend = minuendArr.slice(0);
            subtrahendArr.forEach(x => {
                const i = minuend.findIndex(eq(x));
                minuend.splice(i >= 0 ? i : Infinity, 1);
            });
            return minuend;
        }
        function nub(arr) {
            return Array.from(new Set(arr));
        }
        function add(x) {
            return y => x + y;
        }
        function mod(y) {
            return x => x % y;
        }
        function eq(x) {
            return y => x === y;
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
        function arrAND(arr, ...arrs) {
            return arr.filter(el => arrs.every(a => a.includes(el)));
        }
    }

    function seq(length) {
        return Array.from({ length }, (_, i) => i);
    }
    function getRandomElement(arr) {
        return arr[randInt(arr.length)];
    }
    function randInt(length) {
        return Math.floor(Math.random() * length);
    }
}());
