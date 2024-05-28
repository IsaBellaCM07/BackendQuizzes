const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
const port = 3001;
app.use(cors());
app.use(express.json())

// Configura la conexión a la base de datos Oracle
const connectionConfig = {
    user: 'ISABELLA',
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
                const result = await connection.execute('SELECT id_estudiante, nombre, apellido FROM Estudiante WHERE id_estudiante = :id', [studentId]);
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

        // Obtener exámenes pendientes para un estudiante específico
        app.get('/api/examsPend/:id/:idGrupo', async (req, res) => {
            try {
                const studentId = req.params.id;
                const grupoId = req.params.idGrupo;
                const query = `
                    SELECT e.*, pe.*, d.NOMBRE AS DOCENTE_NOMBRE, d.APELLIDO as DOCENTE_APELLIDO
                    FROM EXAMEN e
                             JOIN DOCENTE d ON e.DOCENTE_ID_DOCENTE = d.ID_DOCENTE
                             JOIN PRESENTACION_ESTUDIANTE pe ON e.ID_EXAMEN = pe.EXAMEN_ID_EXAMEN
                             JOIN ESTUDIANTE est ON pe.ESTUDIANTE_ID_ESTUDIANTE = est.ID_ESTUDIANTE
                             JOIN ESTUDIANTE_GRUPO eg ON est.ID_ESTUDIANTE = eg.ESTUDIANTE_ID_ESTUDIANTE
                             JOIN GRUPO g ON eg.GRUPO_ID_GRUPO = g.ID_GRUPO
                    WHERE est.ID_ESTUDIANTE = :id
                      AND g.ID_GRUPO = :idGrupo
                      AND pe.ESTADO_PRESENTACION = 'Pendiente'`;

                const result = await connection.execute(query, [studentId, grupoId]);

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
        app.get('/api/examsPres/:id/:idGrupo', async (req, res) => {
            try {
                const studentId = req.params.id;
                const grupoId = req.params.idGrupo;
                const query = `
                    SELECT e.*, pe.*, d.NOMBRE AS DOCENTE_NOMBRE, d.APELLIDO as DOCENTE_APELLIDO
                    FROM EXAMEN e
                             JOIN DOCENTE d ON e.DOCENTE_ID_DOCENTE = d.ID_DOCENTE
                             JOIN PRESENTACION_ESTUDIANTE pe ON e.ID_EXAMEN = pe.EXAMEN_ID_EXAMEN
                             JOIN ESTUDIANTE est ON pe.ESTUDIANTE_ID_ESTUDIANTE = est.ID_ESTUDIANTE
                             JOIN ESTUDIANTE_GRUPO eg ON est.ID_ESTUDIANTE = eg.ESTUDIANTE_ID_ESTUDIANTE
                             JOIN GRUPO g ON eg.GRUPO_ID_GRUPO = g.ID_GRUPO
                    WHERE est.ID_ESTUDIANTE = :id
                      AND g.ID_GRUPO = :idGrupo
                      AND pe.ESTADO_PRESENTACION = 'Finalizado'`;
                const result = await connection.execute(query, [studentId, grupoId]);

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
        app.get('/api/preguntas-examen/:examenId/:presId', async (req, res) => {
            try {
                const examenId = req.params.examenId;
                const presId = req.params.presId;

                // Llamar a la función PL/SQL y obtener el cursor de resultados
                const result = await connection.execute(
                    `BEGIN
                :cursor := escoger_preguntas_presentacion(:presId, :examenId);
            END;`,
                    {
                        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
                        presId: presId,
                        examenId: examenId
                    }
                );

                // Obtener las preguntas del cursor de resultados
                const cursor = result.outBinds.cursor;
                const preguntas = [];

                let row;
                while ((row = await cursor.getRow())) {
                    preguntas.push(row[0]);
                }

                // Cerrar el cursor
                await cursor.close();

                // Enviar las preguntas al cliente
                res.json(preguntas);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener datos de las preguntas del examen' });
            }
        });

        // Obtener los cursos de un estudiante específico
        app.get('/api/cursos-estudiante/:idEstudiante', async (req, res) => {
            try {
                const studentId = req.params.idEstudiante;
                const result = await connection.execute(`SELECT DISTINCT c.*, g.nombre as nombre_grupo, d.nombre AS nombre_docente, g.id_grupo
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
                    id_grupo: row[6]
                }));

                res.json(cursos);
            } catch (error) {
                console.error('Error al ejecutar la consulta:', error);
                res.status(500).json({ error: 'Error al obtener los cursos del estudiante' });
            }
        });

        // Obtener los cursos de un estudiante específico
        app.get('/api/grupos-estudiante/:idEstudiante', async (req, res) => {
            try {
                const studentId = req.params.idEstudiante;
                const result = await connection.execute(`SELECT DISTINCT g.*,  d.nombre AS nombre_docente, d.apellido as apellido_docente
                                                         FROM curso c
                                                                  JOIN grupo g ON c.id_curso = g.curso_id_curso
                                                                  JOIN profe_grupo pg ON g.id_grupo = pg.grupo_id_grupo
                                                                  JOIN docente d ON pg.docente_id_docente = d.id_docente
                                                                  JOIN estudiante_grupo eg ON g.id_grupo = eg.grupo_id_grupo
                                                        WHERE eg.estudiante_id_estudiante = :idEstudiante`, [studentId]);
                const grupos = result.rows.map(row => ({
                    id_grupo: row[0],
                    nombre: row[1],
                    jornada: row[2],
                    curso_id_curso: row[3],
                    nombre_docente: row[4],
                    apellido_docente: row[5],
                }));

                res.json(grupos);
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

        // Crear un examen
        app.post('/api/examenes/crear', async (req, res) => {
            try {
                // Extraer los datos del cuerpo de la solicitud
                const newExam = req.body;

                const id_examen = await connection.execute(`SELECT obtener_nuevo_id((SELECT id_examen
                                                                                     FROM (SELECT id_examen FROM examen ORDER BY id_examen DESC) WHERE ROWNUM = 1)) as nuevo_id from dual`);

                const query = `BEGIN INSERT INTO examen (id_examen, nombre, descripcion, tiempo, num_preguntas, num_preguntas_aleatorias, fecha_y_hora_disponible, tema_titulo, docente_id_docente) VALUES (:id_examen, :nombre, :descripcion, :tiempo, :num_preguntas, :num_preguntas_aleatorias, :fecha_y_hora_disponible, :tema_titulo, :docente_id_docente); COMMIT; END;`;

                const tiempoo = new Date(newExam.tiempo);
                const f_disponible = new Date(newExam.fecha_y_hora_disponible);
                const preguntas = Number(newExam.num_preguntas);
                const aleatorias = Number(newExam.num_preguntas_aleatorias);
                const idd_examen = String(id_examen.rows.pop().toString()); // Asegúrate de obtener el valor correcto
                const nombree = String(newExam.nombre);
                const descrip = String(newExam.descripcion);
                const tema = String(newExam.tema_titulo);
                const docente = String(newExam.docente_id_docente);

                const values = {
                    id_examen: { val: idd_examen, type: oracledb.STRING },
                    nombre: { val: nombree, type: oracledb.STRING }, // Usa la variable nombree
                    descripcion: { val: descrip, type: oracledb.STRING }, // Usa la variable descrip
                    tiempo: { val: tiempoo, type: oracledb.DATE },
                    num_preguntas: { val: preguntas, type: oracledb.NUMBER },
                    num_preguntas_aleatorias: { val: aleatorias, type: oracledb.NUMBER },
                    fecha_y_hora_disponible: { val: f_disponible, type: oracledb.DATE },
                    tema_titulo: { val: tema, type: oracledb.STRING }, // Usa la variable tema
                    docente_id_docente: { val: docente, type: oracledb.STRING } // Usa la variable docente
                };

                // Ejecuta el bloque PL/SQL
                await connection.execute(query, values);

                res.status(201).json({ message: 'Examen creado con éxito' });

            } catch (error) {
                console.error('Error al crear el examen:', error);
                res.status(500).json({ error: 'Error al crear el examen' });
            }
        });

        app.post(`/api/preguntas/escoger/:nombre`, async (req, res) => {
            try {
                // Extraer los datos del cuerpo de la solicitud
                const nombre = req.params.nombre;

                const preguntas = req.body;

                const id_preguntas = await connection.execute(`SELECT p.id_preguntas_examen FROM preguntas_total_examen p  JOIN examen e ON p.examen_id_examen = e.id_examen WHERE e.nombre = :nombre`,[nombre]);

                const idd_preguntas = String(id_preguntas.rows.pop().toString());

                for (let i = 0; i > preguntas.length; i++){
                    const id_pregunta = String(preguntas[i]);
                    const values = {
                        pregunta_id_pregunta: { val: id_pregunta, type: oracledb.STRING },
                        preguntas_total_id: { val: idd_preguntas, type: oracledb.STRING }
                    }
                    const query = `BEGIN INSERT INTO pregunta_banco(pregunta_id_pregunta, preguntas_total_id) VALUES (:pregunta_id_pregunta, :preguntas_total_id); COMMIT; END;`;
                    await connection.execute(query, values);
                }

                res.status(201).json({ message: 'Examen creado con éxito' });

            } catch (error) {
                console.error('Error al crear el examen:', error);
                res.status(500).json({ error: 'Error al crear el examen' });
            }
        });


// Obtener exámenes faltantes para un estudiante específico en un grupo
        app.get('/api/missing-exams/:studentId/:groupId', async (req, res) => {
            let connection;
            try {
                // Obtén los parámetros de la solicitud
                const studentId = req.params.studentId;
                const groupId = req.params.groupId;

                // Conéctate a la base de datos
                connection = await oracledb.getConnection(connectionConfig);

                // Define la consulta para llamar a la función
                const result = await connection.execute(
                    `BEGIN
                :cursor := get_missing_exams(:groupId, :studentId);
            END;`,
                    {
                        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
                        groupId: groupId,
                        studentId: studentId
                    }
                );

                const cursor = result.outBinds.cursor;
                const exams = [];

                let row;
                while ((row = await cursor.getRow())) {
                    exams.push(row);
                }

                // Cierra el cursor
                await cursor.close();

                // Envía la respuesta al cliente
                res.json({ missingExams: exams });
            } catch (err) {
                console.error(err);
                res.status(500).send('Error al obtener los exámenes faltantes.');
            } finally {
                if (connection) {
                    try {
                        await connection.close();
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        });


        // Obtener todas las categorias
        app.get('/api/examenes/:examenId', async (req, res) => {
            try {
                const examenId = req.params.examenId;

                const result = await connection.execute(
                    `SELECT * FROM EXAMEN where ID_EXAMEN =:examenId`, [examenId]
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
                console.error('Error al obtener los examenes:', error);
                res.status(500).json({ error: 'Error al obtener datos de los examenes' });
            }
        });

        // Ruta para registrar la presentación del examen
        app.post('/api/registrar-presentacion', async (req, res) => {
            let connection;
            try {
                // Extrae los datos del cuerpo de la solicitud
                const { studentId, examenId, groupId } = req.body;

                // Conecta a la base de datos
                connection = await oracledb.getConnection(connectionConfig);

                // Inicia una transacción si está disponible
                if (connection.beginTransaction) {
                    await connection.beginTransaction();
                }

                // Crea un nuevo registro de presentación del examen
                const result = await connection.execute(
                    `INSERT INTO presentacion_estudiante (tiempo, numero_preguntas, calificacion, fecha_presentacion, examen_id_examen, estudiante_id_estudiante, estado_presentacion)
             VALUES (NULL, NULL, NULL, SYSDATE, :examenId, :studentId, 'Pendiente')`,
                    [examenId, studentId]
                );

                // Verifica si se insertó correctamente
                if (result.rowsAffected && result.rowsAffected === 1) {
                    // Realiza el commit de la transacción si está disponible
                    if (connection.commit) {
                        await connection.commit();
                    }
                    res.status(201).json({ message: 'Presentación del examen registrada exitosamente' });
                } else {
                    // Revierte la transacción en caso de error si está disponible
                    if (connection.rollback) {
                        await connection.rollback();
                    }
                    res.status(500).json({ error: 'Error al registrar la presentación del examen' });
                }
            } catch (error) {
                console.error('Error al registrar la presentación del examen:', error);
                // Revierte la transacción en caso de error si está disponible
                if (connection && connection.rollback) {
                    try {
                        await connection.rollback();
                    } catch (rollbackError) {
                        console.error('Error al hacer rollback:', rollbackError);
                    }
                }
                res.status(500).json({ error: 'Error al registrar la presentación del examen' });
            } finally {
                // Cierra la conexión a la base de datos
                if (connection) {
                    try {
                        await connection.close();
                    } catch (closeError) {
                        console.error('Error al cerrar la conexión:', closeError);
                    }
                }
            }
        });

        app.get('/api/preguntas/:tema', async (req, res) => {
            try {
                const tema = req.params.tema
                console.log(tema)
                const resultPre = await connection.execute(`SELECT * FROM pregunta WHERE tema_titulo = :tema AND privacidad = 'Pública'`,[tema]);
                const preguntas = resultPre.rows.map(row => ({
                    ID_PREGUNTA: row[0],
                    PRIVACIDAD: row[1],
                    DESCRIPCION: row[2]
                }));
                res.json(preguntas);
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
