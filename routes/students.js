const express = require('express');
const router = express.Router();

module.exports = function(connection) {
    // Obtener todos los estudiantes
    router.get('/', async (req, res) => {
        try {
            const resultEst = await connection.execute('SELECT * FROM Estudiante');
            const estudiantes = resultEst.rows.map(row => ({
                ID_ESTUDIANTE: row[0],
                NOMBRE: row[1],
                APELLIDO: row[2],
            }));
            res.json(estudiantes);
        } catch (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).json({ error: 'Error al obtener datos' });
        }
    });

    // Obtener un estudiante específico por ID
    router.get('/:id', async (req, res) => {
        try {
            const studentId = req.params.id;
            const result = await connection.execute('SELECT * FROM Estudiante WHERE id_estudiante = :id', [studentId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Estudiante no encontrado' });
                return;
            }
            const student = {
                ID_ESTUDIANTE: result.rows[0][0],
                NOMBRE: result.rows[0][1],
                APELLIDO: result.rows[0][2],
            };
            res.json(student);
        } catch (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).json({ error: 'Error al obtener datos' });
        }
    });

    return router;
}
