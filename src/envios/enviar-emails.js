/**
 * ARQUIVO: enviar-emails.js
 * DESCRIÇÃO: Dispara em massa os emails de pesquisa usando o MicrosoftGraphMailer.
 * Lê o envios_<stamp>.json gerado por preparar-envios.js e envia 1 email por aluno,
 * com o corpo e o formulário corretos para a turma dele (config-turmas.js).
 *
 * Configuração: variáveis M365_* no .env da raiz do projeto.
 *
 * Uso:
 *   node src/envios/enviar-emails.js src/envios/saidas/envios_<stamp>.json --dry-run
 *   node src/envios/enviar-emails.js src/envios/saidas/envios_<stamp>.json --limite 3
 *   node src/envios/enviar-emails.js src/envios/saidas/envios_<stamp>.json
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { MicrosoftGraphMailer, MicrosoftGraphMailerError } = require('../services/graph-mailer');
const { TURMAS } = require('./config-turmas');
const { montarCorpoHtml, getImagemInline } = require('./templates');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function parseArgs(argv) {
    const out = { json: null, dryRun: false, limite: null, pausa: 0.5 };
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === '--dry-run') out.dryRun = true;
        else if (a === '--limite') { out.limite = Number(argv[i + 1]); i += 1; }
        else if (a === '--pausa') { out.pausa = Number(argv[i + 1]); i += 1; }
        else if (!a.startsWith('--')) out.json = a;
    }
    return out;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.json) {
        console.error('Uso: node src/envios/enviar-emails.js <envios.json> [--dry-run] [--limite N] [--pausa S]');
        process.exit(1);
    }

    const jsonPath = path.resolve(args.json);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    let envios = data.envios || [];
    if (args.limite) envios = envios.slice(0, args.limite);
    console.log(`[*] ${envios.length} envios a processar  (dry_run=${args.dryRun})`);

    let mailer = null;
    if (!args.dryRun) {
        mailer = MicrosoftGraphMailer.fromEnv();
        if (!mailer.isConfigured()) {
            console.error('[ERRO] Mailer não configurado (M365_* faltando no .env).');
            process.exit(1);
        }
        console.log(`[OK] Mailer configurado, remetente: ${mailer.senderEmail}`);
    }

    // Imagem da tutora (cabeçalho) carregada uma vez e reaproveitada em todos os envios.
    const imagemInline = args.dryRun ? null : getImagemInline();

    const falhasLog = [];
    let enviados = 0;
    let falhas = 0;

    for (let i = 0; i < envios.length; i += 1) {
        const aluno = envios[i];
        const turma = TURMAS[aluno.curso];
        if (!turma) {
            falhas += 1;
            console.log(`[${i + 1}] ${aluno.nome} [FALHA] curso ${aluno.curso} sem config.`);
            continue;
        }
        const assunto = turma.assunto;
        const html = montarCorpoHtml(aluno, turma);
        const prefix = `[${String(i + 1).padStart(4)}/${envios.length}] ${aluno.nome.padEnd(34).slice(0, 34)} ${aluno.email.padEnd(34).slice(0, 34)}`;

        try {
            if (args.dryRun) {
                console.log(`${prefix} [DRY] (${turma.grupo}) ${assunto}`);
            } else {
                await mailer.sendHtml([{ email: aluno.email, name: aluno.nome }], assunto, html, [imagemInline]);
                console.log(`${prefix} [OK] (${turma.grupo})`);
                enviados += 1;
                await sleep(args.pausa * 1000); // throttle defensivo
            }
        } catch (exc) {
            falhas += 1;
            console.log(`${prefix} [FALHA] ${exc.message}`);
            falhasLog.push({ moodle_id: aluno.moodle_id, nome: aluno.nome, email: aluno.email, erro: exc.message });
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`  Enviados: ${enviados}`);
    console.log(`  Falhas:   ${falhas}`);
    console.log('='.repeat(60));

    if (falhasLog.length) {
        const z = n => String(n).padStart(2, '0');
        const d = new Date();
        const stamp = `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
        const fp = path.join(path.dirname(jsonPath), `falhas_${stamp}.json`);
        fs.writeFileSync(fp, JSON.stringify(falhasLog, null, 2), 'utf-8');
        console.log(`  Log de falhas: ${path.relative(process.cwd(), fp)}`);
    }

    process.exit(falhas === 0 ? 0 : 1);
}

if (require.main === module) {
    main().catch(e => {
        if (e instanceof MicrosoftGraphMailerError) console.error('🚨 Graph:', e.message);
        else console.error('🚨', e.message);
        process.exit(1);
    });
}
