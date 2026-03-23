const { CURSOS_IDS } = require('./config/env');
const { moodleAPI } = require('./services/moodle');
const { formatarData, extrairLinkAtividade } = require('./utils/helpers');
const FRASES_MOTIVACIONAIS = require('../sol-frases.js'); // Volta uma pasta para achar as frases

const ALUNOS_TESTE_IDS = []; // Deixe vazio para rodar para todos

async function rodarSolAtiva() {
    console.log(`🌞 Iniciando motor da Sol Ativa para os cursos: ${CURSOS_IDS.join(', ')}...`);

    try {
        for (let COURSE_ID of CURSOS_IDS) {
            console.log(`\n==========================================================`);
            console.log(`📚 INICIANDO ANÁLISE DO CURSO: ${COURSE_ID}`);
            console.log(`==========================================================`);

            let enrolledUsers = await moodleAPI('core_enrol_get_enrolled_users', { 'courseid': COURSE_ID });
            let alunos = enrolledUsers.filter(user => {
                if (ALUNOS_TESTE_IDS.length > 0 && !ALUNOS_TESTE_IDS.includes(user.id)) return false;
                let isStudent = user.roles && user.roles.some(role => role.shortname === 'student');
                return isStudent || ALUNOS_TESTE_IDS.includes(user.id);
            });

            console.log(`✅ Encontrados ${alunos.length} alunos no curso ${COURSE_ID}.`);

            const now = Math.floor(Date.now() / 1000);
            const in15Days = now + (15 * 24 * 60 * 60);
            const trintaDiasAtras = now - (30 * 24 * 60 * 60);

            let calendarData = await moodleAPI('core_calendar_get_calendar_events', {
                'events[courseids][0]': COURSE_ID,
                'options[timestart]': trintaDiasAtras,
                'options[timeend]': in15Days
            });
            let eventos = calendarData.events || [];

            for (let aluno of alunos) {
                console.log(`\n👨‍🎓 Analisando: ${aluno.fullname}`);

                let diasAusente = 0;
                if (aluno.lastcourseaccess) {
                    diasAusente = Math.floor((now - aluno.lastcourseaccess) / 86400);
                }

                const hoje = new Date().getDay();
                let isDiaDeRotina = (hoje === 1 || hoje === 5);
                let isDiaDeAusencia = (diasAusente === 3);

                if (!isDiaDeRotina && !isDiaDeAusencia) {
                    console.log(`⏩ Pulando ${aluno.fullname.split(' ')[0]}: Não é dia de rotina nem ausência.`);
                    continue;
                }

                let completionStatus = await moodleAPI('core_completion_get_activities_completion_status', {
                    'courseid': COURSE_ID, 'userid': aluno.id
                });
                let completedCmids = new Set();
                if (completionStatus.statuses) {
                    completionStatus.statuses.forEach(s => {
                        if (s.state === 1 && s.cmid) completedCmids.add(s.cmid);
                    });
                }

                let atividadesPendentes = eventos.filter(ev => {
                    return !(ev.cmid && completedCmids.has(ev.cmid));
                });

                let primeiroNome = aluno.fullname.split(' ')[0];
                let fraseMotivacional = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];

                let htmlMsg = `<p>Olá, <b>${primeiroNome}</b>! 🌞</p><p>Aqui é a <b>Sol Academy</b>, sua tutora virtual da ESUP.</p>`;

                if (isDiaDeAusencia) {
                    htmlMsg += `<p>Estou sentindo sua falta! Notei que não nos vemos no ambiente do curso há <b>3 dias</b>. Por isso, passei para ver se está tudo bem e te atualizar sobre as suas atividades:</p>`;
                } else if (isDiaDeRotina) {
                    htmlMsg += `<p>Passando aqui no nosso dia de rotina para te lembrar das suas entregas e te desejar bons estudos!</p>`;
                }

                if (atividadesPendentes.length > 0) {
                    htmlMsg += `<ul>`;
                    atividadesPendentes.forEach(ativ => {
                        let nomeLimpo = ativ.name.replace(/deve estar concluído/i, '').trim();
                        let dataFormatada = formatarData(ativ.timestart);
                        let link = extrairLinkAtividade(ativ, COURSE_ID); // Chamando a função limpa (DRY)

                        htmlMsg += `<li style="margin-bottom: 10px;">
                                        <b>${nomeLimpo}</b><br>
                                        📅 Prazo: ${dataFormatada}<br>
                                        <a href="${link}">🔗 Clique aqui para acessar a atividade</a>
                                    </li>`;
                    });
                    htmlMsg += `</ul><p>Se estiver com alguma dúvida sobre o conteúdo, clique no menu Sol Academy no ambiente do curso e vamos conversar! Estarei aqui para te ajudar. 🚀</p>`;
                } else {
                    htmlMsg = `<p>Olá, <b>${primeiroNome}</b>! 🌞</p><p>Aqui é a <b>Sol Academy</b>, sua tutora virtual da ESUP.</p><p>Passei aqui só para te dar os <b>parabéns</b>! 🎉 Analisei seu perfil e vi que você está com todas as suas atividades e fóruns em dia no curso.</p><p>Caso queira revisar alguma matéria ou aprofundar os estudos, estarei te esperando no chat. Aproveite a semana!</p>`;
                }

                htmlMsg += `<br><p><i>💡 Lembre-se: ${fraseMotivacional}</i></p>`;

                console.log(`✉️ Enviando mensagem para ${primeiroNome}...`);
                let sendResult = await moodleAPI('core_message_send_instant_messages', {
                    'messages[0][touserid]': aluno.id,
                    'messages[0][text]': htmlMsg,
                    'messages[0][textformat]': 1
                });

                if (sendResult[0] && sendResult[0].msgid) {
                    console.log(`✅ Sucesso!`);
                } else {
                    console.log(`❌ Erro no envio.`);
                }
            }
        }
        console.log("\n🏁 Varredura multi-cursos finalizada com sucesso!");
    } catch (erro) {
        console.error("🚨 Erro:", erro.message);
    }
}

rodarSolAtiva();