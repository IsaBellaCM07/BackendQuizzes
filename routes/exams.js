const express = require('express');
const router = express.Router();

module.exports = function(connection) {
    // Obtener exámenes disponibles para un estudiante específico
    router.get('/disponibles/:id', async (req, res) => {
        try {
            const studentId = req.params.id;
            const result = await connection.execute(`SELECT * FROM presentacion_Estudiante p JOIN examen e ON p.examen_id_examen = e.id_examen
                                                    WHERE p.presentado = 'N' AND p.estudiante_id_estudiante = :id`, [studentId]);

            const columns = result.metaData.map(col => col.name);

            const presentacion = result.rows.map(row => {
                let rowObj = {};
                columns.forEach((col, index) => {
                    rowObj[col] = row[index];
                });
                return rowObj;
            });

            res.json(presentacion);
        } catch (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).json({ error: 'Error al obtener datos' });
        }
    });

    // Obtener exámenes presentados para un estudiante específico
    router.get('/presentados/:id', async (req, res) => {
        try {
            const studentId = req.params.id;
            const result = await connection.execute(`SELECT * FROM presentacion_Estudiante p 
                                                    JOIN examen e ON p.examen_id_examen = e.id_examen
                                                    WHERE p.presentado = 'S' AND p.estudiante_id_estudiante = :id`, [studentId]);

            const columns = result.metaData.map(col => col.name);

            const presentacion = result.rows.map(row => {
                let rowObj = {};
                columns.forEach((col, index) => {
                    rowObj[col] = row[index];
                });
                return rowObj;
            });

            res.json(presentacion);
        } catch (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).json({ error: 'Error al obtener datos' });
        }
    });

    return router;
}
