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
        // Importa y usa las rutas
        const studentRoutes = require('./routes/students')(connection);
        const examRoutes = require('./routes/exams')(connection);

        app.use('/api/estudiantes', studentRoutes);
        app.use('/api/examenes', examRoutes);

        // Inicia el servidor Express
        app.listen(port, () => {
            console.log(`Servidor Express iniciado en http://localhost:${port}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1); // Termina la aplicación si hay un error de conexión
    });
