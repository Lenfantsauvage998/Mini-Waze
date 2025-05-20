// index.js con ES Modules
import express from 'express';
import dijkstraRoutes from './routes/dijkstra.routes.js';
import sortRoutes from './routes/sort.routes.js';
import routeRoutes from './routes/route.routes.js';
import cors from 'cors';
import graphRoutes from './routes/graph.routes.js';


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use('/api/dijkstra', dijkstraRoutes);
app.use('/api/sort', sortRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/graph', graphRoutes);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '✅ API Express funcionando con ES Modules' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
