module Sudoku.Generation (generate) where

import Prelude
import Data.Array (fromFoldable)
import Data.List (List(..), catMaybes, concatMap, elem, filter, foldr, head, index, length, nub, reverse, snoc, (..), (:), (\\))
import Data.Maybe (Maybe(..), fromMaybe)
import Effect.Random (randomInt)
import Effect.Unsafe (unsafePerformEffect)



data Triple a = Triple a a a

data PartialNum = PartialNum Int Int

type PartialBlock = List PartialNum

data PartialBlockRow = PartialBlockRow PartialBlock PartialBlock PartialBlock

data PartialBlockColumn = PartialBlockColumn PartialBlock PartialBlock PartialBlock



generate :: Unit -> Array Int
generate _ = fromFoldable $ fromMaybe Nil $ columnsToSudoku cols
  where
  cols = rowsToColumns (Triple r1 r2 r3)
  r1 = createPartialBlockRow unit
  r2 = createPartialBlockRow unit
  r3 = createPartialBlockRow unit


-- private stuff from here


columnsToSudoku :: Triple PartialBlockColumn -> Maybe (List Int)
columnsToSudoku (Triple c1 c2 c3) = maybesToTriple (getValidPermutation c1) (getValidPermutation c2) (getValidPermutation c3) <#> partialColsToList


partialColsToList:: Triple (List (Triple PartialNum)) -> List Int
partialColsToList (Triple c1 c2 c3) = buildList Nil c1 c2 c3
  where
  buildList acc (x:xs) (y:ys) (z:zs) = buildList (acc `appendNums` x `appendNums` y `appendNums` z) xs ys zs
  buildList acc _      _      _      = reverse acc  -- TODO check if reversing is necessary
  appendNums ls (Triple (PartialNum n1 _) (PartialNum n2 _) (PartialNum n3 _)) = ls `snoc` n1 `snoc` n2 `snoc` n3


getValidPermutation :: PartialBlockColumn -> Maybe (List (Triple PartialNum))
getValidPermutation col = getPerms Nil permutations
  where
  permutations = getPermutationsOfColumn col
  getPerms selected ((cur:row):rows) | hasValidSolution (cur:selected) rows = getPerms (cur:selected) rows
                                     | otherwise                            = getPerms selected       (row:rows)
  getPerms selected Nil              = Just $ reverse selected  -- TODO check if reversing is necessary
  getPerms _        (Nil:rows)       = Nothing  -- shouldn't happen because valid solutions are checked in advance, but needed for exhaustive patterns


hasValidSolution :: List (Triple PartialNum) -> List (List (Triple PartialNum)) -> Boolean
hasValidSolution selected ((next:row):rows) | not $ isValidColumn selected          = false
                                            | hasValidSolution (next:selected) rows = true
                                            | otherwise                             = hasValidSolution selected (row:rows)
hasValidSolution _        (Nil:_)           = false
hasValidSolution selected Nil               = isValidColumn selected


isValidColumn :: List (Triple PartialNum) -> Boolean
isValidColumn rows = isValidColumn' rows Nil Nil Nil
  where
  isValidColumn' ((Triple (PartialNum x _) (PartialNum y _) (PartialNum z _)):rs) c1 c2 c3
    | x `elem` c1 || y `elem` c2 || z `elem` c3 = false
    | otherwise                                 = isValidColumn' rs (x:c1) (y:c2) (z:c3)
  isValidColumn' Nil _  _  _  = true


getPermutationsOfColumn :: PartialBlockColumn -> List (List (Triple PartialNum))
getPermutationsOfColumn (PartialBlockColumn top mid bot) = allRows <#> getPermutations
  where
  allRows = (rowsFromPartialBlock top) <> (rowsFromPartialBlock mid) <> (rowsFromPartialBlock bot)


rowsFromPartialBlock :: PartialBlock -> List (Triple PartialNum)
rowsFromPartialBlock ls = catMaybes $ (1..3) <#> (\row -> toTriple $ getNumsOfRow row)  -- catMaybes is a bit filthy
  where
  getNumsOfRow r       = filter (\(PartialNum _ y) -> y == r) ls
  toTriple (x:y:z:Nil) = Just (Triple x y z)
  toTriple _           = Nothing


rowsToColumns :: Triple PartialBlockRow -> Triple PartialBlockColumn
rowsToColumns (Triple r1 r2 r3) = rowsToCols r1 r2 r3
  where
  rowsToCols (PartialBlockRow x1 y1 z1) (PartialBlockRow x2 y2 z2) (PartialBlockRow x3 y3 z3) = Triple (PartialBlockColumn x1 x2 x3) (PartialBlockColumn y1 y2 y3) (PartialBlockColumn z1 z2 z3)


createPartialBlockRow :: Unit -> PartialBlockRow
createPartialBlockRow _ = foldr addPartialNum (PartialBlockRow Nil Nil Nil) (1..9)


addPartialNum :: Int -> PartialBlockRow -> PartialBlockRow
addPartialNum num blocks = appendYs blocks num (getYs blocks)


appendYs :: PartialBlockRow -> Int -> Triple Int -> PartialBlockRow
appendYs (PartialBlockRow block1 block2 block3) num (Triple y1 y2 y3) =
    PartialBlockRow ((PartialNum num y1):block1) ((PartialNum num y2):block2) ((PartialNum num y3):block3)

getYs :: PartialBlockRow -> Triple Int
getYs (PartialBlockRow block1 block2 block3) = Triple y1 y2 y3
  where
  y1 = get1stBlockY block1
  y3 = get3rdBlockY y1 block3 $ get2ndBlockPossibleYs block2 y1
  y2 = get2ndBlockY block2 y1 y3


get1stBlockY :: PartialBlock -> Int
get1stBlockY block = randomElement $ availableYs block

get2ndBlockPossibleYs :: PartialBlock -> Int -> List Int
get2ndBlockPossibleYs block y1 = nub $ filter (notEq y1) $ availableYs block

get2ndBlockY :: PartialBlock -> Int -> Int -> Int
get2ndBlockY block y1 y3 = fromMaybe 0 $ head $ nub (availableYs block) \\ (y1:y3:Nil)

get3rdBlockY :: Int -> PartialBlock -> List Int -> Int
get3rdBlockY y1 block3 (y2:Nil) = fromMaybe 0 $ head $ nub (availableYs block3) \\ (y1:y2:Nil)
get3rdBlockY y1 block3 _        = randomElement $ filter (notEq y1) $ availableYs block3



availableYs :: PartialBlock -> List Int
availableYs block = allYs \\ occupied
  where
  allYs                 = concatMap (\x -> x:x:x:Nil) (1..3)
  occupied              = block <#> getY
  getY (PartialNum _ y) = y


randomElement :: List Int -> Int
randomElement list = fromMaybe 0 $ index list rndIndex
  where
  rndIndex = unsafePerformEffect $ randomInt 0 (length list - 1)



maybesToTriple :: forall a. Maybe a -> Maybe a -> Maybe a -> Maybe (Triple a)
maybesToTriple (Just x) (Just y) (Just z) = Just (Triple x y z)
maybesToTriple _        _        _        = Nothing


getPermutations :: forall a. Triple a -> List (Triple a)
getPermutations triple = getPerms Nil triple 5
  where
  getPerms acc trpl           0 = trpl:acc
  getPerms acc (Triple x y z) i
    | i `mod` 2 == 0 = getPerms ((Triple x y z):acc) (Triple y x z) (i - 1)
    | otherwise      = getPerms ((Triple x y z):acc) (Triple x z y) (i - 1)
