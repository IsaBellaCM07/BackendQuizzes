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

        // Obtener todos los docentes
        app.get('/api/docentes', async (req, res) => {
            try {
                const resultEst = await connection.execute('SELECT * FROM DOCENTE');
                const docentes = resultEst.rows.map(row => ({
                    ID_DOCENTE: row[0],
                    NOMBRE: row[1],
                    APELLIDO: row[2],
                }));
                res.json(docentes);
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
                res.json(student);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos' });
            }
        });


        // Obtener un docente específico por ID
        app.get('/api/docentes/:id', async (req, res) => {
            try {
                const teacherId = req.params.id;
                const result = await connection.execute('SELECT * FROM Docente WHERE id_docente = :id', [teacherId]);
                if (result.rows.length === 0) {
                    res.status(404).json({ error: 'Docente no encontrado' });
                    return;
                }
                const teacher = {
                    ID_DOCENTE: result.rows[0][0],
                    NOMBRE: result.rows[0][1],
                    APELLIDO: result.rows[0][2],
                };
                res.json(teacher);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos' });
            }
        });

        // Obtener exámenes disponibles para un estudiante específico
        app.get('/api/examsDis/:id', async (req, res) => {
            try {
                const studentId = req.params.id;
                const result = await connection.execute(`SELECT * FROM presentacion_Estudiante p
                                                                           JOIN examen e ON p.examen_id_examen = e.id_examen
                                                                           JOIN docente d on e.docente_id_docente = d.id_docente
                                                         WHERE p.presentado = 'N' AND p.estudiante_id_estudiante = :id`, [studentId]);

                // Asegúrate de que `result.metaData` está disponible y contiene los nombres de las columnas
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
        app.get('/api/examsPres/:id', async (req, res) => {
            try {
                const studentId = req.params.id;
                const result = await connection.execute(`SELECT * FROM presentacion_Estudiante p
                                                                           JOIN examen e ON p.examen_id_examen = e.id_examen
                                                                           JOIN docente d on e.docente_id_docente = d.id_docente
                                                  WHERE p.presentado = 'S' AND p.estudiante_id_estudiante = :id`, [studentId]);

                // Asegúrate de que `result.metaData` está disponible y contiene los nombres de las columnas
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

        // Obtener grupos a los que pertenece un estudiante específico
        app.get('/api/grupos/:id', async (req, res) => {
            try {
                const studentId = req.params.id;
                const result = await connection.execute(`SELECT * FROM grupo g JOIN estudiante_grupo eg on g.id_grupo = eg.grupo_id_grupo
                    WHERE eg.estudiante_id_estudiante = :id`, [studentId]);

                // Asegúrate de que `result.metaData` está disponible y contiene los nombres de las columnas
                const columns = result.metaData.map(col => col.name);

                const grupos = result.rows.map(row => {
                    let rowObj = {};
                    columns.forEach((col, index) => {
                        rowObj[col] = row[index];
                    });
                    return rowObj;
                });

                res.json(grupos);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos' });
            }
        });

// Obtener todas las preguntas asociadas a un examen específico
        app.get('/api/preguntas-examen/:id', async (req, res) => {
            try {
                const examenId = req.params.id;
                const result = await connection.execute(`SELECT DISTINCT 
                            p.id_pregunta,
                            p.descripcion AS pregunta_descripcion,
                            p.porcentaje,
                            p.tema_titulo,
                            p.tipo_id_tipo_pregunta,
                            t.tipo_pregunta,
                            r.id_respuesta_pregunta,
                            r.descripcion AS respuesta_descripcion,
                            r.es_correcta, 
                            e.tiempo
                        FROM 
                            examen e
                        JOIN 
                            preguntas_total_examen pte ON e.id_examen = pte.examen_id_examen
                        JOIN 
                            pregunta_banco pb ON pte.banco_preguntas_id_banco = pb.banco_preguntas_id_banco
                        JOIN 
                            pregunta p ON pb.pregunta_id_pregunta = p.id_pregunta
                        JOIN 
                            respuesta_pregunta r ON p.id_pregunta = r.pregunta_id_pregunta
                        JOIN 
                            tipo t ON p.tipo_id_tipo_pregunta = t.id_tipo_pregunta
                        WHERE 
                            e.id_examen = :examenId`, [ examenId ]);

                // Asegúrate de que `result.metaData` está disponible y contiene los nombres de las columnas
                const columns = result.metaData.map(col => col.name);

                const preguntas = result.rows.map(row => {
                    let rowObj = {};
                    columns.forEach((col, index) => {
                        rowObj[col] = row[index];
                    });
                    return rowObj;
                });

                res.json(preguntas);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos de las preguntas del examen' });
            }
        });


        // Obtener todos los cursos
        app.get('/api/cursos', async (req, res) => {
            try {
                const result = await connection.execute('SELECT * FROM curso');
                const cursos = result.rows.map(row => ({
                    id_curso: row[0],
                    nombre: row[1],
                    unidades: row[2],
                    contenido: row[3],
                }));
                res.json(cursos);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos de los cursos' });
            }
        });

        // Obtener los cursos de un estudiante específico
        app.get('/api/cursos-estudiante/:idEstudiante', async (req, res) => {
            try {
                const studentId = req.params.idEstudiante;
                const result = await connection.execute(`SELECT DISTINCT c.*, g.nombre as nombre_grupo, d.nombre AS nombre_docente
                                                         FROM curso c
                                                                  JOIN grupo g ON c.id_curso = g.curso_id_curso
                                                                  JOIN profe_grupo pg ON g.id_grupo = pg.grupo_id_grupo
                                                                  JOIN docente d ON pg.docente_id_docente = d.id_docente
                                                                  JOIN estudiante_grupo eg ON g.id_grupo = eg.grupo_id_grupo
                                                        WHERE eg.estudiante_id_estudiante = :idEstudiante`, [studentId]);
                const cursos = result.rows.map(row => ({
                    id_curso: row[0],
                    nombre: row[1],
                    unidades: row[2],
                    contenido: row[3],
                    nombre_grupo: row[4],
                    nombre_docente: row[5],
                }));

                res.json(cursos);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener los cursos del estudiante' });
            }
        });

        // Obtener los cursos de un docente específico
        app.get('/api/cursos-docente/:idDocente', async (req, res) => {
            try {
                const teacherId = req.params.idDocente;
                const result = await connection.execute(`SELECT c.id_curso, c.nombre, c.unidades, c.contenido, g.nombre AS nombre_grupo, COUNT(eg.estudiante_id_estudiante) AS numero_estudiantes
                                                         FROM curso c
                                                                  JOIN grupo g ON c.id_curso = g.curso_id_curso
                                                                  JOIN profe_grupo pg ON g.id_grupo = pg.grupo_id_grupo
                                                                  JOIN docente d ON pg.docente_id_docente = d.id_docente
                                                                  LEFT JOIN estudiante_grupo eg ON g.id_grupo = eg.grupo_id_grupo
                                                         WHERE d.id_docente = :teacherId
                                                         GROUP BY c.id_curso, c.nombre, c.unidades, c.contenido, g.nombre`, [teacherId]);
                const cursos = result.rows.map(row => ({
                    id_curso: row[0],
                    nombre: row[1],
                    unidades: row[2],
                    contenido: row[3],
                    nombre_grupo: row[4],
                    numero_estudiantes: row[5],
                }));

                res.json(cursos);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener los cursos del estudiante' });
            }
        });

// Obtener los examenes creados de un curso, por un docente específico
        app.get('/api/examenes-creados/:teacherId/:cursoId', async (req, res) => {
            try {
                const teacherId = req.params.teacherId;
                const cursoId = req.params.cursoId;

                const query = `
            SELECT e.*,
                   d.nombre AS docente_nombre,
                   d.apellido AS docente_apellido,
                   g.nombre AS grupo_nombre
            FROM examen e
            JOIN docente d ON e.docente_id_docente = d.id_docente
            JOIN grupo g ON g.id_grupo = (SELECT gp.grupo_id_grupo 
                                          FROM profe_grupo gp 
                                          WHERE gp.docente_id_docente = d.id_docente
                                          AND gp.grupo_id_grupo = g.id_grupo)
            WHERE d.id_docente = :teacherId
            AND g.curso_id_curso = :cursoId
        `;
                const result = await connection.execute(query, [teacherId, cursoId]);

                // Asegúrate de que `result.metaData` está disponible y contiene los nombres de las columnas
                const columns = result.metaData.map(col => col.name);

                const examenes = result.rows.map(row => {
                    let rowObj = {};
                    columns.forEach((col, index) => {
                        rowObj[col] = row[index];
                    });
                    return rowObj;
                });

                res.json(examenes);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos de los examenes' });
            }
        });

// Obtener los estudiantes de un curso, con un docente específico
        app.get('/api/estudiantes-curso/:teacherId/:cursoId', async (req, res) => {
            try {
                const { teacherId, cursoId } = req.params;
                const result = await connection.execute(
                    `SELECT e.id_estudiante AS id, e.nombre, e.apellido
             FROM estudiante e
             JOIN estudiante_grupo eg ON e.id_estudiante = eg.estudiante_id_estudiante
             JOIN grupo g ON eg.grupo_id_grupo = g.id_grupo
             JOIN profe_grupo pg ON g.id_grupo = pg.grupo_id_grupo
             WHERE pg.docente_id_docente = :teacherId AND g.curso_id_curso = :cursoId`,
                    [teacherId, cursoId]
                );

                const columns = result.metaData.map(col => col.name);
                const students = result.rows.map(row => {
                    let rowObj = {};
                    columns.forEach((col, index) => {
                        rowObj[col.toLowerCase()] = row[index];
                    });
                    return rowObj;
                });

                res.json(students);
            } catch (error) {
                console.error('Error al obtener los estudiantes del curso:', error);
                res.status(500).json({ error: 'Error al obtener datos de los estudiantes' });
            }
        });


        // Obtener todas las categorias
        app.get('/api/temas', async (req, res) => {
            try {
                const result = await connection.execute(
                    `SELECT * FROM TEMA`
                );

                const columns = result.metaData.map(col => col.name);
                const themes = result.rows.map(row => {
                    let rowObj = {};
                    columns.forEach((col, index) => {
                        rowObj[col.toLowerCase()] = row[index];
                    });
                    return rowObj;
                });

                res.json(themes);
            } catch (error) {
                console.error('Error al obtener los estudiantes del curso:', error);
                res.status(500).json({ error: 'Error al obtener datos de los estudiantes' });
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
