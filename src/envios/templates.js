/**
 * ARQUIVO: templates.js
 * DESCRIÇÃO: Templates HTML dos emails de pesquisa final do experimento de IA na EAD.
 * Há um corpo distinto por tipo de turma (sol / tutor / hibrido). Todos terminam com
 * o botão para o formulário específico daquela turma (definido em config-turmas.js).
 *
 * O cabeçalho exibe a imagem da tutora (corte redondo) embutida como anexo inline (cid:).
 * Use getImagemInline() para gerar o anexo correspondente ao enviar.
 *
 * Identidade visual: azul #1e3a8a, laranja #f97316. Sem emojis no corpo (exceto o
 * coração azul 💙 ao final).
 */
const fs = require('fs');
const path = require('path');

// Imagem da tutora usada no cabeçalho (anexo inline via Content-ID).
const IMAGEM_TUTORA_PATH = path.resolve(__dirname, 'WhatsApp Image 2026-03-16 at 13.02.20.jpeg');
const IMAGEM_TUTORA_CID = 'tutora-esup';

/** Gera o anexo inline (CID) da imagem da tutora para passar ao mailer.sendHtml(). */
function getImagemInline() {
    const bytes = fs.readFileSync(IMAGEM_TUTORA_PATH);
    return {
        name: 'tutora-esup.jpeg',
        contentType: 'image/jpeg',
        contentBytes: bytes.toString('base64'),
        contentId: IMAGEM_TUTORA_CID,
        isInline: true,
    };
}

function primeiroNome(nomeCompleto) {
    const n = (nomeCompleto || '').trim().split(/\s+/)[0] || 'Aluno(a)';
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

/** Botão/CTA padrão que leva ao formulário da turma. */
function botaoPesquisa(formUrl) {
    return `
  <div style="text-align:center; margin:32px 0;">
    <a href="${formUrl}" target="_blank"
       style="display:inline-block; background:#f97316; color:#ffffff; text-decoration:none;
              font-weight:700; font-size:17px; padding:14px 34px; border-radius:30px;
              box-shadow:0 6px 16px rgba(249,115,22,0.35);">
      Responder a pesquisa
    </a>
  </div>
  <p style="font-size:13px; color:#64748b; text-align:center; margin-top:-12px;">
    Leva menos de 5 minutos e é totalmente anônima.
  </p>
  <p style="font-size:13px; color:#94a3b8; text-align:center; word-break:break-all;">
    Caso o botão não funcione, copie e cole este link no navegador:<br>
    <a href="${formUrl}" style="color:#1e3a8a;">${formUrl}</a>
  </p>`;
}

/**
 * Esqueleto comum: cabeçalho com a imagem redonda da tutora, miolo (varia) e rodapé.
 * @param {string} imagemSrc origem da <img> do cabeçalho (cid: no envio ou caminho na prévia).
 */
function montarHtml(nome, miolo, formUrl, imagemSrc) {
    return `<!DOCTYPE html>
<html lang="pt-BR"><body style="margin:0; padding:0; background:#f1f5f9;">
<div style="max-width:600px; margin:0 auto; background:#ffffff; font-family:Arial, sans-serif; color:#334155; line-height:1.6;">
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#312e81 100%); padding:28px 32px; text-align:center;">
    <img src="${imagemSrc}" alt="Tutora ESUP" width="96" height="96"
         style="width:96px; height:96px; border-radius:50%; object-fit:cover;
                border:3px solid rgba(255,255,255,0.9); display:block; margin:0 auto;">
    <h1 style="color:#ffffff; font-size:22px; margin:14px 0 4px;">Sol Academy</h1>
    <span style="color:#cbd5e1; font-size:14px; letter-spacing:1px;">EAD ESUP</span>
  </div>
  <div style="padding:32px;">
    <p style="font-size:17px;">Olá <b>${primeiroNome(nome)}</b>, tudo bem?</p>
    ${miolo}
    ${botaoPesquisa(formUrl)}
    <hr style="border:none; border-top:1px solid #e2e8f0; margin:28px 0;">
    <p style="font-size:13px; color:#64748b; margin:0;">
      Sua participação é muito importante para entendermos como apoiar melhor cada aluno
      na sua jornada de estudos. Obrigado por caminhar com a gente! 💙
    </p>
    <p style="font-size:14px; margin-top:20px;">
      Atenciosamente,<br>
      <b>Núcleo de Tecnologias Educacionais</b><br>
      Faculdade ESUP / NTE
    </p>
  </div>
  <div style="background:#0f172a; padding:16px 32px; text-align:center;">
    <span style="color:#94a3b8; font-size:12px;">Sol Academy · Faculdade ESUP</span>
  </div>
</div>
</body></html>`;
}

// --- Miolos por tipo de turma ---

function mioloSol() {
    return `
    <p>Durante este semestre, no seu curso na modalidade <b>EAD da Faculdade ESUP</b>, você
    contou com a <b>Sol</b>, a nossa tutora virtual com inteligência artificial, disponível
    dentro do ambiente do curso para tirar dúvidas, lembrar prazos e te dar aquele incentivo
    nos estudos.</p>
    <p>Chegamos à <b>fase final</b> da nossa pesquisa acadêmica sobre o uso da IA na EAD,
    e queremos muito ouvir <b>você</b>: como foi conviver com a Sol no seu dia a dia de estudante?</p>
    <p>Suas respostas vão nos ajudar a entender o que funcionou, o que pode melhorar e como
    a tecnologia pode apoiar de verdade quem estuda a distância.</p>`;
}

function mioloTutor() {
    return `
    <p>Durante este semestre, no seu curso na modalidade <b>EAD da Faculdade ESUP</b>, você
    contou com o apoio do <b>Tutor</b>, sempre disponível no ambiente do curso para tirar suas
    dúvidas, te orientar nas atividades e acompanhar a sua caminhada nos estudos.</p>
    <p>Chegamos à <b>fase final</b> da nossa pesquisa acadêmica sobre o uso da IA na EAD,
    e queremos muito ouvir <b>você</b>: como foi contar com esse acompanhamento ao longo do semestre?</p>
    <p>Suas respostas vão nos ajudar a entender o que funcionou, o que pode melhorar e como
    apoiar cada vez melhor quem estuda a distância.</p>`;
}

function mioloHibrido() {
    return `
    <p>Durante este semestre, no seu curso na modalidade <b>EAD da Faculdade ESUP</b>, você teve
    um apoio completo no ambiente do curso: a <b>Sol</b>, nossa tutora virtual com inteligência
    artificial, e também o <b>Tutor</b>, prontos para tirar dúvidas, lembrar prazos e acompanhar
    a sua jornada de estudos.</p>
    <p>Chegamos à <b>fase final</b> da nossa pesquisa acadêmica sobre o uso da IA na EAD,
    e queremos muito ouvir <b>você</b>: como foi contar com a Sol e o Tutor juntos no seu dia a dia?</p>
    <p>Suas respostas vão nos ajudar a entender o que funcionou, o que pode melhorar e como
    unir o melhor da tecnologia e do acompanhamento humano para quem estuda a distância.</p>`;
}

const MIOLOS = { sol: mioloSol, tutor: mioloTutor, hibrido: mioloHibrido };

/**
 * Monta o HTML completo do email de um aluno, de acordo com a config da turma.
 * @param {{nome:string}} aluno
 * @param {{tipo:'sol'|'tutor'|'hibrido', formUrl:string}} turma
 * @param {object} [opts] { imagemSrc } — origem da imagem do cabeçalho.
 *   Padrão: 'cid:tutora-esup' (anexo inline, para envio real).
 *   Na prévia HTML local, passe o caminho/URL do arquivo da imagem.
 */
function montarCorpoHtml(aluno, turma, opts = {}) {
    const miolo = (MIOLOS[turma.tipo] || mioloSol)();
    const imagemSrc = opts.imagemSrc || `cid:${IMAGEM_TUTORA_CID}`;
    return montarHtml(aluno.nome, miolo, turma.formUrl, imagemSrc);
}

module.exports = {
    montarCorpoHtml, primeiroNome, getImagemInline,
    IMAGEM_TUTORA_PATH, IMAGEM_TUTORA_CID,
};
