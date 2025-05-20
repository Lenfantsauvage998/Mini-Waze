export function runDijkstra(graph, startNode, endNode) {
  const distances = {};
  const previous  = {};
  const pq = new Set(Object.keys(graph));

  // Inicialización
  for (let node of pq) {
    distances[node] = Infinity;
    previous[node]  = null;
  }
  distances[startNode] = 0;

  // Bucle principal
  while (pq.size > 0) {
    // nodo con distancia mínima
    let current = [...pq].reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    );
    pq.delete(current);

    // Si llegamos a destino, podemos parar
    if (current === endNode) break;

    for (let neighbor in graph[current]) {
      let alt = distances[current] + graph[current][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor]  = current;
      }
    }
  }

  // Reconstruir camino desde endNode hacia atrás
  const path = [];
  let u = endNode;
  while (u) {
    path.unshift(u);
    u = previous[u];
  }
  // Si el primer elemento no es startNode, no hay camino
  if (path[0] !== startNode) path.length = 0;

  return { distances, path };
}
