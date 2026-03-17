require('dotenv').config();
const ROTEADOR_SOL = require('../../sol-cursos.js'); // Puxa o arquivo central

module.exports = {
    TOKEN: process.env.MOODLE_TOKEN,
    BASE_URL: process.env.MOODLE_URL,
    
    // Extrai os IDs magicamente: Transforma { "1783": "link", "1956": "link" } em [1783, 1956]
    CURSOS_IDS: Object.keys(ROTEADOR_SOL).map(Number)
};