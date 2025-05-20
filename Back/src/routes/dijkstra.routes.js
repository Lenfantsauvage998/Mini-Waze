import express from 'express';
import { runDijkstra } from '../utils/dijkstra.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { graph, startNode, endNode } = req.body;
  if (!graph || !startNode || !endNode) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }
  try {
    const result = runDijkstra(graph, startNode, endNode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
