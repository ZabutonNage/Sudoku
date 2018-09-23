### General Info

To run **_Sudoku_** it is necessary to setup and build the purescript code as explained below.

Because purescript generates a lot of output it is somewhat encapsulated in a sub-directory to reduce mixing with non-purescript stuff.

### Setup

```
Sudoku/src> npm i
```

**Note:** Make sure you have git on your PATH because bower needs it.
If you don't, you can always start it out of Git Bash.

```
Sudoku/src> npx bower i
```


### Build

Build purescript part with the command below. This will bundle the purescript code into `ps-output.js` which gets referenced in `index.html`. 

```
Sudoku/src> npx pulp build -m Sudoku.Generation --modules Sudoku.Validation -O --skip-entry-point --src-path ./ps-src -o ./ps-output --to ./ps-output.js
```
