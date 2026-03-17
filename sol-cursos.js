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