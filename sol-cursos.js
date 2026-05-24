/**
 * ARQUIVO: sol-cursos.js
 * DESCRIÇÃO: Este script atua como um roteador central para a extensão Sol Academy. 
 * Ele mapeia os IDs dos cursos no Moodle para as URLs específicas dos assistentes virtuais 
 * (chatbots) na plataforma Zaia, garantindo que o aluno seja direcionado ao bot correspondente 
 * ao seu curso. Ele é exportado globalmente para funcionar tanto no navegador quanto em Node.js.
 */
// =========================================================================
// ROTEADOR CENTRAL DE CURSOS E BASES DE CONHECIMENTO (sol-cursos.js)
// =========================================================================

const ROTEADOR_SOL = {
    1279: "https://platform.zaia.app/embed/chat/63480", // Curso de Teste
    1783: "https://platform.zaia.app/embed/chat/63480", // Educação em Direitos Humanos - M 
    1956: "https://platform.zaia.app/embed/chat/63480", // Educação em Direitos Humanos - N
};

// Se estiver rodando no navegador (Sol Passiva / Moodle)
if (typeof window !== 'undefined') {
    window.ROTEADOR_SOL = ROTEADOR_SOL;
}

// Se estiver rodando no terminal pelo Node.js (Sol Ativa)
if (typeof module !== 'undefined') {
    module.exports = ROTEADOR_SOL;
}