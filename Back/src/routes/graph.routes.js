// backend/src/routes/graph.routes.js
import express from 'express';
import haversine from 'haversine-distance';

const router = express.Router();

// Grafo en memoria
let nodes = {};
let edges = {};

// GET /api/graph — devuelve el grafo completo
router.get('/', (req, res) => {
  res.json({ nodes, edges });
});

// POST /api/graph/node — añade un nodo
// Body: { id: string, lat: number, lng: number }
router.post('/node', (req, res) => {
  const { id, lat, lng } = req.body;
  if (!id || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }
  if (nodes[id]) {
    return res.status(409).json({ error: 'Nodo ya existe' });
  }
  nodes[id] = { lat, lng };
  edges[id] = {};
  res.status(201).json({ id, lat, lng });
});

function isConnected(nodes, edges) {
  const all = Object.keys(nodes);
  if (!all.length) return true;
  const visited = new Set();
  const stack = [all[0]];
  while (stack.length) {
    const u = stack.pop();
    if (!visited.has(u)) {
      visited.add(u);
      for (let v in edges[u]) {
        if (!visited.has(v)) stack.push(v);
      }
    }
  }
  return visited.size === all.length;
}


// DELETE /api/graph/node/:id — elimina un nodo y todas sus aristas
router.delete('/node/:id', (req, res) => {
  const { id } = req.params;
  if (!nodes[id]) {
    return res.status(404).json({ error: 'Nodo no existe' });
  }
  delete nodes[id];
  delete edges[id];
  // eliminar aristas entrantes
  for (let u in edges) {
    delete edges[u][id];
  }
  res.status(204).end();
});

// POST /api/graph/edge — añade o actualiza una arista
// Body: { from: string, to: string, weight?: number }
router.post('/edge', (req, res) => {
  const { from, to, weight } = req.body;
  if (!nodes[from] || !nodes[to]) {
    return res.status(404).json({ error: 'Nodo origen o destino no existe' });
  }
  // si no se pasa peso, lo calculamos con haversine
  const w = typeof weight === 'number'
    ? weight
    : haversine(nodes[from], nodes[to]);
  edges[from][to] = w;
  edges[to][from] = w;
  res.status(201).json({ from, to, weight: w });
});

// PUT /api/graph/node/:id — editar nombre, lat y lng de un nodo
router.put('/node/:id', (req, res) => {
  const oldId = req.params.id;
  const { id, lat, lng } = req.body;
  if (!nodes[oldId]) return res.status(404).json({ error: 'Nodo no existe' });
  if (!id || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }
  // evitar colisiones de ID
  if (id !== oldId && nodes[id]) {
    return res.status(409).json({ error: 'Nuevo ID ya existe' });
  }
  // renombrar clave si cambió
  if (id !== oldId) {
    nodes[id] = { ...nodes[oldId] };
    edges[id] = edges[oldId];
    delete nodes[oldId];
    delete edges[oldId];
    // actualizar aristas entrantes
    for (let u in edges) {
      if (edges[u][oldId] !== undefined) {
        edges[u][id] = edges[u][oldId];
        delete edges[u][oldId];
      }
    }
  }
  // actualizar coordenadas
  nodes[id] = { lat, lng };
  res.json({ id, lat, lng });
});

// DELETE /api/graph/edge — elimina una arista bidireccional
// Query params: ?from=N1&to=N2
router.delete('/edge', (req, res) => {
  const { from, to } = req.query;
  if (!nodes[from] || !nodes[to] || !edges[from] || edges[from][to] === undefined) {
    return res.status(404).json({ error: 'Arista no existe' });
  }
  delete edges[from][to];
  delete edges[to][from];
  res.status(204).end();
});

export default router;
