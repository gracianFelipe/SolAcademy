/**
 * ARQUIVO: config-turmas.js
 * DESCRIÇÃO: Configuração das 3 turmas-teste do experimento "Uso da IA na EAD".
 * Cada curso do Moodle tem um tipo de assistente diferente e, por isso, um
 * formulário de pesquisa diferente. Este mapa é a fonte única de verdade do envio.
 *
 *   1783 (Matutino)  → só a SOL (IA)        → form T1-SOL
 *   1955 (Noturno A) → só o TUTOR (humano)  → form T2-Humano
 *   1956 (Noturno B) → SOL + TUTOR (híbrido)→ form T3-Híbrido
 */

const TURMAS = {
    1783: {
        turno: 'Matutino',
        tipo: 'sol',            // só a Sol
        grupo: 'T1 - SOL',
        formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfJc-rcktUV_uZNRUW2bXlpDzhWp5A4U1TfHnI3BTPEaWs3lg/viewform',
        assunto: 'Pesquisa Final — Sua experiência com a Sol Academy',
    },
    1955: {
        turno: 'Noturno',
        tipo: 'tutor',          // só o tutor humano
        grupo: 'T2 - Humano',
        formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdlUKBZtF2YGTzAI9Zwhuzg0a2ivmbJ_y8epMgP-ofTrUN6qw/viewform',
        assunto: 'Pesquisa Final — Sua experiência com o Tutor',
    },
    1956: {
        turno: 'Noturno',
        tipo: 'hibrido',        // Sol + Tutor
        grupo: 'T3 - Híbrido',
        formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSedfMKmNwPyuz70zDAvLzoF_boA3Y5pwy9UZAbq1K42FwH-Jg/viewform',
        assunto: 'Pesquisa Final — Sua experiência com a Sol e o Tutor',
    },
};

const CURSOS_IDS = Object.keys(TURMAS).map(Number);

module.exports = { TURMAS, CURSOS_IDS };
