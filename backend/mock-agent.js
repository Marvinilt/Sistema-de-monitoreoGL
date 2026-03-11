const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 9000;

app.use(cors());

app.get('/metrics', async (req, res) => {
    const recursos = {
        cpuPorcentaje: Math.random() * 100,
        ramPorcentaje: Math.random() * 100,
        discoPorcentaje: Math.random() * 100,
        timestamp: new Date().toISOString()
    };
    res.json(recursos);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mock Agente de Monitoreo corriendo en el puerto ${PORT}`);
});
