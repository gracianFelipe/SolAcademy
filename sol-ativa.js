process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // 🛡️ Ignora bloqueios de segurança do Node
// ============================================================================
// MOTOR DA SOL ATIVA v3 - Multi-Cursos e Extrator Universal
// ============================================================================

const TOKEN = "172f53a7717fe262495ba22c1b06cbad"; // ⚠️ Não esqueça do Token!
const BASE_URL = "https://atp.esup.edu.br/webservice/rest/server.php";

// 🛑 LISTA DE CURSOS: Coloque quantos IDs de curso quiser aqui, separados por vírgula.
const CURSOS_IDS = [1783, 1956]; 

// 🛑 TRAVA DE SEGURANÇA: Mantenha seu ID aqui para testar.
const ALUNOS_TESTE_IDS = []; 

const FRASES_MOTIVACIONAIS = require('./sol-frases.js');

function formatarData(timestamp) {
    const d = new Date(timestamp * 1000);
    const z = n => (n < 10 ? '0' : '') + n;
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()} às ${z(d.getHours())}:${z(d.getMinutes())}`;
}

async function moodleAPI(functionName, params = {}) {
    let url = `${BASE_URL}?moodlewsrestformat=json&wsfunction=${functionName}&wstoken=${TOKEN}`;
    for (let key in params) {
        url += `&${key}=${encodeURIComponent(params[key])}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    if (data.exception) throw new Error(`Moodle negou acesso (${functionName}): ${data.message}`);
    return data;
}

async function rodarSolAtiva() {
    console.log(`🌞 Iniciando motor da Sol Ativa para os cursos: ${CURSOS_IDS.join(', ')}...`);

    try {
        // 🔄 O LOOP MÁGICO: Roda a análise para cada curso da lista
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
            const trintaDiasAtras = now - (30 * 24 * 60 * 60); // 💡 Olha para o passado para achar os atrasados!
            
            let calendarData = await moodleAPI('core_calendar_get_calendar_events', { 
                'events[courseids][0]': COURSE_ID,
                'options[timestart]': trintaDiasAtras, // 💡 Mudamos aqui
                'options[timeend]': in15Days
            });
            let eventos = calendarData.events || [];

            for (let aluno of alunos) {
                console.log(`\n👨‍🎓 Analisando: ${aluno.fullname}`);

                let diasAusente = 0;
                if (aluno.lastcourseaccess) {
                    diasAusente = Math.floor((now - aluno.lastcourseaccess) / 86400);
                }

                // =========================================================
                // 🛑 LÓGICA DE DISPARO INTELIGENTE
                // =========================================================
                const hoje = new Date().getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
                let isDiaDeRotina = (hoje === 1 || hoje === 5); // Segunda ou Sexta
                let isDiaDeAusencia = (diasAusente === 3); // Exatos 3 dias sumido (recebe no 4º dia)

                // Se não for Seg/Sex e ele não estiver sumido há exatos 3 dias, pula esse aluno!
                if (!isDiaDeRotina && !isDiaDeAusencia) {
                    console.log(`⏩ Pulando ${aluno.fullname.split(' ')[0]}: Não é dia de rotina nem dia de alerta de ausência.`);
                    continue; // Vai direto para o próximo aluno da lista
                }
                // =========================================================

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
                    if (ev.cmid && completedCmids.has(ev.cmid)) return false;
                    return true;
                });

                let primeiroNome = aluno.fullname.split(' ')[0];
                let fraseMotivacional = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];
                
                let htmlMsg = `<p>Olá, <b>${primeiroNome}</b>! 🌞</p>`;
                htmlMsg += `<p>Aqui é a <b>Sol Academy</b>, sua tutora virtual da ESUP.</p>`;

                if (isDiaDeAusencia) {
                    htmlMsg += `<p>Estou sentindo sua falta! Notei que não nos vemos no ambiente do curso há <b>3 dias</b>. Por isso, passei para ver se está tudo bem e te atualizar sobre as suas atividades:</p>`;
                } else if (isDiaDeRotina) {
                    htmlMsg += `<p>Passando aqui no nosso dia de rotina para te lembrar das suas entregas e te desejar bons estudos!</p>`;
                }

                if (atividadesPendentes.length > 0) {
                    htmlMsg += `<ul>`;
                    
                    atividadesPendentes.forEach(ativ => {
                        // console.log("\n🔍 DADOS CRUS DO EVENTO:", ativ); // (Pode apagar ou comentar isso aqui se não quiser mais poluir a tela)
                        let nomeLimpo = ativ.name.replace(/deve estar concluído/i, '').trim();
                        let dataFormatada = formatarData(ativ.timestart);
                        
                        // 💡 EXTRATOR UNIVERSAL DE LINKS (Agora com a Regra da Instância!)
                        let cmid = ativ.cmid;
                        if (!cmid && ativ.coursemodule) {
                            cmid = (typeof ativ.coursemodule === 'object') ? ativ.coursemodule.id : ativ.coursemodule;
                        }
                        
                        let link = ativ.url;
                        if (!link && ativ.action && ativ.action.url) {
                            link = ativ.action.url; 
                        }
                        if (!link && cmid && ativ.modulename) {
                            link = `https://atp.esup.edu.br/mod/${ativ.modulename}/view.php?id=${cmid}`;
                        }
                        // 🔥 A PEÇA QUE FALTAVA: Acesso direto pela INSTÂNCIA secreta do Moodle!
                        if (!link && ativ.instance && ativ.modulename) {
                            let atalho = ativ.modulename === 'forum' ? 'f' : (ativ.modulename === 'assign' ? 'a' : 'id');
                            link = `https://atp.esup.edu.br/mod/${ativ.modulename}/view.php?${atalho}=${ativ.instance}`;
                        }
                        if (!link) {
                            link = `https://atp.esup.edu.br/course/view.php?id=${COURSE_ID}`;
                        }

                        htmlMsg += `<li style="margin-bottom: 10px;">
                                        <b>${nomeLimpo}</b><br>
                                        📅 Prazo: ${dataFormatada}<br>
                                        <a href="${link}">🔗 Clique aqui para acessar a atividade</a>
                                    </li>`;
                    });
                    
                    htmlMsg += `</ul>`;
                    htmlMsg += `<p>Se estiver com alguma dúvida na matéria para fazer essas entregas, clique no meu botão lá no ambiente do curso e vamos bater um papo! Estou aqui para te ajudar. 🚀</p>`;
                } else {
                    htmlMsg = `<p>Olá, <b>${primeiroNome}</b>! 🌞</p>`;
                    htmlMsg += `<p>Aqui é a <b>Sol Academy</b>, sua tutora virtual da ESUP.</p>`;
                    htmlMsg += `<p>Passei aqui só para te dar os <b>parabéns</b>! 🎉 Analisei seu perfil e vi que você está com todas as suas atividades e fóruns em dia no curso.</p>`;
                    htmlMsg += `<p>Caso queira revisar alguma matéria ou aprofundar os estudos, estarei te esperando no chat. Aproveite a semana!</p>`;
                }

                htmlMsg += `<br><p><i>💡 Lembre-se: ${fraseMotivacional}</i></p>`;

                console.log(`✉️ Enviando e-mail/mensagem para ${primeiroNome}...`);
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
        } // Fim do loop de cursos

        console.log("\n🏁 Varredura multi-cursos finalizada com sucesso!");

    } catch (erro) {
        console.error("🚨 Erro:", erro.message);
    }
}

rodarSolAtiva();