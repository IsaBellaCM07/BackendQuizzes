const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
const port = 3001;
app.use(cors());

// Configura la conexión a la base de datos Oracle
const connectionConfig = {
    user: 'PROYECTO',
    password: '123',
    connectString: '//localhost:1522/xepdb1'
};

// Variable global para la conexión
let connection;

// Define una función asíncrona para conectar a la base de datos
async function connectToDatabase() {
    try {
        connection = await oracledb.getConnection(connectionConfig);
        console.log('Conexión a la base de datos establecida!');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        throw error;
    }
}

// Llama a la función para conectar a la base de datos antes de iniciar el servidor
connectToDatabase()
    .then(() => {
        // Define las rutas después de que se haya establecido la conexión

        // Obtener todos los estudiantes
        app.get('/api/estudiantes', async (req, res) => {
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
        app.get('/api/estudiantes/:id', async (req, res) => {
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
                console.log(student)

                res.json(student);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos' });
            }
        });

        // Obtener exámenes disponibles para un estudiante específico
        app.get('/api/examsDis/:id', async (req, res) => {
            try {
                const studentId = req.params.id;
                const result = await connection.execute(`SELECT * FROM presentacion_Estudiante p JOIN examen e ON p.examen_id_examen = e.id_examen WHERE p.presentado = 'N' AND p.estudiante_id_estudiante = :id`, [studentId]);

                const presentacion = result.rows.map(row => ({
                    ID_PRESENTACION: row[0],
                    TIEMPO: row[1],
                    NUMERO_PREGUNTAS: row[2],
                    CALIFICACION: row[3],
                    FECHA_PRESENTACION: row[4],
                    PRESENTADO: row[5],
                    EXAMEN_ID_EXAMEN: row[6],
                    ESTUDIANTE_ID_ESTUDIANTE: row[7],
                    ID_EXAMEN: row[8],
                    NOMBRE: row[9],
                    // Agrega otras columnas según sea necesario
                }));
                res.json(presentacion);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos' });
            }
        });

        // Obtener exámenes presentados para un estudiante específico
        app.get('/api/examsPres/:id', async (req, res) => {
            try {
                const studentId = req.params.id;
                const result = await connection.execute(`SELECT * FROM presentacion_Estudiante p JOIN examen e ON p.examen_id_examen = e.id_examen WHERE p.presentado = 'S' AND p.estudiante_id_estudiante = :id`, [studentId]);

                const presentacion = result.rows.map(row => ({
                    ID_PRESENTACION: row[0],
                    TIEMPO: row[1],
                    NUMERO_PREGUNTAS: row[2],
                    CALIFICACION: row[3],
                    FECHA_PRESENTACION: row[4],
                    PRESENTADO: row[5],
                    EXAMEN_ID_EXAMEN: row[6],
                    ESTUDIANTE_ID_ESTUDIANTE: row[7],
                    ID_EXAMEN: row[8],
                    NOMBRE: row[9],
                    // Agrega otras columnas según sea necesario
                }));
                res.json(presentacion);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos' });
            }
        });

        // Inicia el servidor Express
        app.listen(port, () => {
            console.log(`Servidor Express iniciado en http://localhost:${port}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1); // Termina la aplicación si hay un error de conexión
    });
