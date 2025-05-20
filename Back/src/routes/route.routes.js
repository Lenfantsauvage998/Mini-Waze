// backend/src/routes/route.routes.js
import express from 'express';
import fetch from 'node-fetch';
import { runDijkstra } from '../utils/dijkstra.js';

const router = express.Router();

// Helper: cálculo de distancias Haversine
function haversine(a, b) {
  const R = 6371000; // m
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

router.post('/', async (req, res) => {
  const { startLat, startLng, endLat, endLng, radius = 1000 } = req.body;
  if (![startLat, startLng, endLat, endLng].every(v => typeof v === 'number')) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  // 1) Overpass QL: vías en un radio alrededor de start
  const query = `
    [out:json][timeout:25];
    (
      way(around:${radius},${startLat},${startLng})[highway];
    );
    (._;>;);
    out body;
  `;
  const url = 'https://overpass-api.de/api/interpreter';
  const response = await fetch(url, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' }
  });
  const data = await response.json();
  // 2) Separa nodos y vías
  const nodes = {};
  const ways = [];
  for (let el of data.elements) {
    if (el.type === 'node') {
      nodes[el.id] = { lat: el.lat, lng: el.lon };
    } else if (el.type === 'way') {
      ways.push(el);
    }
  }
  // 3) Construye lista de adyacencia con pesos
  const graph = {};
  for (let way of ways) {
    const nds = way.nodes;
    for (let i = 0; i < nds.length - 1; i++) {
      const u = nds[i], v = nds[i+1];
      if (!graph[u]) graph[u] = {};
      if (!graph[v]) graph[v] = {};
      const duv = haversine(nodes[u], nodes[v]);
      graph[u][v] = duv;
      graph[v][u] = duv;
    }
  }

  // 4) Función para encontrar nodo OSM más cercano
  const findNearest = ({lat,lng}) => {
    let best, bestD = Infinity;
    for (let id in nodes) {
      const d = haversine({lat,lng}, nodes[id]);
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  };
  const startNode = findNearest({ lat: startLat, lng: startLng });
  const endNode   = findNearest({ lat: endLat,   lng: endLng   });

  // 5) Correr Dijkstra
  const { path } = runDijkstra(graph, startNode, endNode);

  // 6) Mapear path a coordenadas
  const pathCoords = path.map(id => [nodes[id].lat, nodes[id].lng]);

  res.json({ pathCoords });
});

export default router;
