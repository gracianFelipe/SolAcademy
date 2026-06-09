/**
 * ARQUIVO: sei.js
 * DESCRIÇÃO: Serviço de consulta ao banco do SEI (PostgreSQL, usuário apenas-leitura).
 * Usado pelo módulo de envio de emails para completar/validar o email OFICIAL de cada
 * aluno a partir do CPF (o Moodle entrega o CPF no campo username).
 *
 * O CPF no SEI está formatado (049.814.391-05); a busca normaliza para só dígitos.
 * Regra de email: pessoa.email (principal) com pessoa.email2 como fallback.
 *
 * Configuração: SEI_DB_URL no .env (postgresql://...:50007/seibd).
 */
const { Client } = require('pg');

const SEI_DB_URL = process.env.SEI_DB_URL;

/**
 * Busca no SEI os dados oficiais (nome + email) de uma lista de CPFs.
 * @param {string[]} cpfs CPFs só com dígitos (11 caracteres).
 * @returns {Promise<Map<string,{nome:string,email:string}>>} mapa cpf -> dados.
 */
async function buscarEmailsPorCpf(cpfs) {
    const limpos = [...new Set((cpfs || []).map(c => String(c).replace(/\D/g, '')).filter(c => c.length === 11))];
    if (!limpos.length) return new Map();
    if (!SEI_DB_URL) throw new Error('SEI_DB_URL não configurado no .env.');

    const client = new Client({ connectionString: SEI_DB_URL });
    await client.connect();
    try {
        const { rows } = await client.query(
            `SELECT regexp_replace(cpf, '[^0-9]', '', 'g') AS cpf_limpo,
                    nome, email, email2
             FROM pessoa
             WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = ANY($1::text[])`,
            [limpos],
        );
        const out = new Map();
        for (const r of rows) {
            const email = (r.email || '').trim() || (r.email2 || '').trim();
            // Em duplicidade de CPF, mantém o primeiro com email válido.
            if (!out.has(r.cpf_limpo) || (!out.get(r.cpf_limpo).email && email)) {
                out.set(r.cpf_limpo, { nome: (r.nome || '').trim(), email: email.toLowerCase() });
            }
        }
        return out;
    } finally {
        await client.end();
    }
}

module.exports = { buscarEmailsPorCpf };
