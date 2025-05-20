import express from 'express';
import { bubbleSort, selectionSort, insertionSort } from '../utils/sort.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { array, algorithm } = req.body;

  let result = [];
  switch (algorithm) {
    case 'bubble':
      result = bubbleSort(array);
      break;
    case 'selection':
      result = selectionSort(array);
      break;
    case 'insertion':
      result = insertionSort(array);
      break;
    default:
      return res.status(400).json({ error: 'Algoritmo no válido' });
  }

  res.json({ result });
});

export default router;
