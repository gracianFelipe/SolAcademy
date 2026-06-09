/**
 * ARQUIVO: preparar-envios.js
 * DESCRIÇÃO: Prepara a base de envio dos emails de pesquisa.
 *   1. Para cada curso (1783/1955/1956), busca os alunos matriculados no Moodle
 *      (core_enrol_get_enrolled_users) — esta é a fonte de QUEM está no curso.
 *   2. Cruza com o SEI por CPF (Moodle username = CPF) para obter o email OFICIAL.
 *      Se o aluno não casar no SEI ou não tiver email lá, usa o email do Moodle.
 *   3. Salva tudo em src/envios/saidas/envios_<stamp>.json para conferência e envio.
 *
 * Uso:
 *   node src/envios/preparar-envios.js
 *   node src/envios/preparar-envios.js --curso 1783   (só uma turma)
 */
const fs = require('fs');
const path = require('path');

// Carrega o .env da raiz do projeto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // certificado do atp.esup não valida

const { TURMAS, CURSOS_IDS } = require('./config-turmas');
const { buscarEmailsPorCpf } = require('../services/sei');

const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;
const SAIDA_DIR = path.resolve(__dirname, 'saidas');

async function moodleAPI(fn, params = {}) {
    let url = `${MOODLE_URL}?moodlewsrestformat=json&wsfunction=${fn}&wstoken=${MOODLE_TOKEN}`;
    for (const k of Object.keys(params)) url += `&${k}=${encodeURIComponent(params[k])}`;
    const data = await (await fetch(url)).json();
    if (data && data.exception) throw new Error(`Moodle (${fn}): ${data.message}`);
    return data;
}

function soDigitos(s) { return String(s || '').replace(/\D/g, ''); }

/** Timestamp local no formato YYYYMMDD_HHMMSS. */
function stampLocal(d = new Date()) {
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_`
        + `${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
}

async function prepararCurso(courseId) {
    const turma = TURMAS[courseId];
    const inscritos = await moodleAPI('core_enrol_get_enrolled_users', { courseid: courseId });
    const alunos = inscritos.filter(u => u.roles && u.roles.some(r => r.shortname === 'student'));

    // CPFs (username) para consultar o SEI em batch
    const cpfs = alunos.map(a => soDigitos(a.username)).filter(c => c.length === 11);
    let emailsSei = new Map();
    try {
        emailsSei = await buscarEmailsPorCpf(cpfs);
    } catch (e) {
        console.warn(`   [aviso] SEI indisponível (${e.message}). Usando email do Moodle como fallback.`);
    }

    const envios = [];
    const semEmail = [];
    for (const a of alunos) {
        const cpf = soDigitos(a.username);
        const dadosSei = cpf.length === 11 ? emailsSei.get(cpf) : null;
        const emailMoodle = (a.email || '').trim().toLowerCase();
        const email = (dadosSei && dadosSei.email) || emailMoodle;
        const origem = (dadosSei && dadosSei.email) ? 'sei' : (emailMoodle ? 'moodle' : 'nenhum');

        if (!email) { semEmail.push({ moodle_id: a.id, nome: a.fullname }); continue; }

        envios.push({
            moodle_id: a.id,
            cpf: cpf || null,
            nome: (dadosSei && dadosSei.nome) || a.fullname,
            email,
            origem_email: origem,
            curso: courseId,
            turno: turma.turno,
            grupo: turma.grupo,
            tipo: turma.tipo,
        });
    }

    envios.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
    return { envios, semEmail, total_moodle: alunos.length };
}

async function main() {
    const argv = process.argv.slice(2);
    const idxCurso = argv.indexOf('--curso');
    const cursos = idxCurso >= 0 ? [Number(argv[idxCurso + 1])] : CURSOS_IDS;

    if (!MOODLE_URL || !MOODLE_TOKEN) {
        console.error('[ERRO] MOODLE_URL / MOODLE_TOKEN ausentes no .env.');
        process.exit(1);
    }

    const todos = [];
    const meta = { gerado_em: new Date().toISOString(), por_curso: {} };
    let totalSemEmail = 0;

    for (const courseId of cursos) {
        if (!TURMAS[courseId]) { console.warn(`[aviso] curso ${courseId} não está em config-turmas.js, pulando.`); continue; }
        console.log(`\n📚 Curso ${courseId} (${TURMAS[courseId].grupo})...`);
        const { envios, semEmail, total_moodle } = await prepararCurso(courseId);
        const viaSei = envios.filter(e => e.origem_email === 'sei').length;
        console.log(`   ${total_moodle} alunos no Moodle → ${envios.length} com email `
            + `(${viaSei} via SEI, ${envios.length - viaSei} via Moodle), ${semEmail.length} sem email.`);
        meta.por_curso[courseId] = { total_moodle, com_email: envios.length, via_sei: viaSei, sem_email: semEmail.length };
        totalSemEmail += semEmail.length;
        todos.push(...envios);
        if (semEmail.length) meta.por_curso[courseId].alunos_sem_email = semEmail;
    }

    fs.mkdirSync(SAIDA_DIR, { recursive: true });
    const jsonPath = path.join(SAIDA_DIR, `envios_${stampLocal()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({ meta, envios: todos }, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log(`  Total de envios preparados: ${todos.length}`);
    console.log(`  Sem email (conferir manualmente): ${totalSemEmail}`);
    console.log(`  Arquivo: ${path.relative(process.cwd(), jsonPath)}`);
    console.log('='.repeat(60));
}

if (require.main === module) {
    main().catch(e => { console.error('🚨', e.message); process.exit(1); });
}

module.exports = { prepararCurso };
