/**
 * ARQUIVO: gerar-distribuicao.js
 * DESCRIÇÃO: A partir do envios_<stamp>.json (gerado por preparar-envios.js), monta um
 * JSON de DISTRIBUIÇÃO legível: quem (aluno/email) recebe qual email e qual formulário,
 * organizado por turma. Serve para conferência humana antes do disparo.
 *
 *   1783 → só a SOL          → form T1-SOL
 *   1955 → só o TUTOR online → form T2-Humano
 *   1956 → SOL + TUTOR       → form T3-Híbrido
 *
 * Uso:
 *   node src/envios/gerar-distribuicao.js src/envios/saidas/envios_<stamp>.json
 *   (sem argumento, usa o envios_*.json mais recente da pasta saidas/)
 */
const fs = require('fs');
const path = require('path');

const { TURMAS } = require('./config-turmas');

const SAIDA_DIR = path.resolve(__dirname, 'saidas');

// Descrição amigável de qual assistente cada tipo de turma teve.
const ASSISTENTE = {
    sol: 'Apenas a Sol (tutora virtual com IA)',
    tutor: 'Apenas o Tutor online (humano)',
    hibrido: 'Sol (IA) + Tutor online (humano)',
};

function arquivoMaisRecente() {
    const arquivos = fs.readdirSync(SAIDA_DIR)
        .filter(f => /^envios_.*\.json$/.test(f))
        .map(f => ({ f, t: fs.statSync(path.join(SAIDA_DIR, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t);
    if (!arquivos.length) throw new Error('Nenhum envios_*.json encontrado em saidas/. Rode preparar-envios.js antes.');
    return path.join(SAIDA_DIR, arquivos[0].f);
}

function main() {
    const arg = process.argv[2];
    const origem = arg ? path.resolve(arg) : arquivoMaisRecente();
    const data = JSON.parse(fs.readFileSync(origem, 'utf-8'));

    const turmas = {};
    for (const courseId of Object.keys(TURMAS)) {
        const t = TURMAS[courseId];
        turmas[courseId] = {
            curso: Number(courseId),
            grupo: t.grupo,
            turno: t.turno,
            assistente: ASSISTENTE[t.tipo],
            formulario: t.formUrl,
            assunto_email: t.assunto,
            total_alunos: 0,
            alunos: [],
        };
    }

    for (const e of data.envios) {
        const bloco = turmas[e.curso];
        if (!bloco) continue;
        bloco.alunos.push({ nome: e.nome, email: e.email, turno: e.turno });
        bloco.total_alunos += 1;
    }

    for (const k of Object.keys(turmas)) {
        turmas[k].alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }

    const out = {
        gerado_em: new Date().toISOString(),
        origem: path.basename(origem),
        total_alunos: data.envios.length,
        turmas: Object.values(turmas),
    };

    const destino = path.join(SAIDA_DIR, 'distribuicao.json');
    fs.writeFileSync(destino, JSON.stringify(out, null, 2), 'utf-8');

    console.log(`Distribuição gerada: ${path.relative(process.cwd(), destino)}`);
    console.log(`Total de alunos: ${out.total_alunos}`);
    for (const t of out.turmas) {
        console.log(`  Curso ${t.curso} (${t.grupo}, ${t.turno}): ${t.total_alunos} alunos — ${t.assistente}`);
    }
}

if (require.main === module) main();
