module Sudoku.Validation (isValid) where

import Prelude (otherwise, ($), (&&), (<#>), (<>), (==))
import Data.Array (any, catMaybes, drop, head, length, nub, null, snoc, tail, take)
import Data.Foldable (all)


-- public stuff


isValid :: Array Int -> Boolean
isValid nums
  | length nums == 81 = rowsValid nums && colsValid nums && blocksValid nums
  | otherwise         = false


-- private stuff


rowsValid :: Array Int -> Boolean
rowsValid []  = false
rowsValid arr = rowsValid' arr
  where
  rowsValid' []  = true
  rowsValid' xs
    | validSudokuSeq (take 9 xs) = rowsValid' $ drop 9 xs
    | otherwise = false


colsValid :: Array Int -> Boolean
colsValid []  = false
colsValid arr = colsValid' $ toRows arr
  where
  colsValid' rows
    | any null rows                              = true
    | validSudokuSeq $ catMaybes $ rows <#> head = colsValid' $ catMaybes $ rows <#> tail
    | otherwise                                  = false


blocksValid :: Array Int -> Boolean
blocksValid []  = false
blocksValid arr = blocksValid' arr
  where
  blocksValid' [] = true
  blocksValid' xs
    | all ((==) true) (gatherBlocks (take 27 xs) <#> validSudokuSeq) = blocksValid' $ drop 27 xs
    | otherwise                                                      = false


-- specific utils


validSudokuSeq :: Array Int -> Boolean
validSudokuSeq xs = length (nub xs) == 9


toRows :: Array Int -> Array (Array Int)
toRows arr = toRows' [] arr
  where
  toRows' acc [] = acc
  toRows' acc xs = let splitXs = splitAt 9 xs
                   in toRows' (snoc acc splitXs.before) splitXs.after


gatherBlocks :: Array Int -> Array (Array Int)
gatherBlocks nums = gatherBlocks' [[],[],[]] nums
  where
  gatherBlocks' :: Array (Array Int) -> Array Int -> Array (Array Int)
  gatherBlocks' acc       [] = acc
  gatherBlocks' [a, b, c] xs = gatherBlocks' [b, c, a <> take 3 xs] $ drop 3 xs
  gatherBlocks' _ _ = []


-- generic utils


splitAt :: forall a. Int -> Array a -> { before :: Array a, after :: Array a }
splitAt i arr = { before: take i arr
                , after: drop i arr }

