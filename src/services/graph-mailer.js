/**
 * ARQUIVO: graph-mailer.js
 * DESCRIÇÃO: Port em JavaScript/Node do MicrosoftGraphMailer.php/.py do AutoProvas.
 * Envia emails via Microsoft Graph API usando OAuth Client Credentials Flow
 * (sem usuário interativo). Inclui retry exponencial em 429 (throttling) e 5xx.
 *
 * Configuração por variáveis de ambiente (.env do projeto):
 *   M365_TENANT_ID      — ID do tenant Azure AD
 *   M365_CLIENT_ID      — Client ID do app registrado
 *   M365_CLIENT_SECRET  — Client Secret do app
 *   M365_SENDER_EMAIL   — Email da caixa que envia (precisa de Mail.Send)
 *
 * Uso:
 *   const { MicrosoftGraphMailer } = require('./services/graph-mailer');
 *   const mailer = MicrosoftGraphMailer.fromEnv();
 *   await mailer.sendHtml([{ email: 'aluno@x.com', name: 'Fulano' }], 'Assunto', '<p>oi</p>');
 */
const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const LOGIN_BASE = 'https://login.microsoftonline.com';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

class MicrosoftGraphMailerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MicrosoftGraphMailerError';
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

class MicrosoftGraphMailer {
    constructor(tenantId, clientId, clientSecret, senderEmail) {
        this.tenantId = (tenantId || '').trim();
        this.clientId = (clientId || '').trim();
        this.clientSecret = (clientSecret || '').trim();
        this.senderEmail = (senderEmail || '').trim();
        this._accessToken = null;
    }

    static fromEnv() {
        return new MicrosoftGraphMailer(
            process.env.M365_TENANT_ID || '',
            process.env.M365_CLIENT_ID || '',
            process.env.M365_CLIENT_SECRET || '',
            process.env.M365_SENDER_EMAIL || '',
        );
    }

    isConfigured() {
        return Boolean(this.tenantId) && Boolean(this.clientId)
            && Boolean(this.clientSecret) && EMAIL_RE.test(this.senderEmail);
    }

    sendText(to, subject, text) {
        return this.send(to, subject, text, 'Text');
    }

    sendHtml(to, subject, html, attachments = []) {
        return this.send(to, subject, html, 'HTML', attachments);
    }

    /**
     * @param {Array} attachments lista de anexos. Cada item:
     *   { name, contentType, contentBytes(base64), contentId?, isInline? }
     *   Para imagem inline no HTML, defina contentId e isInline:true e use
     *   <img src="cid:SEU_CONTENT_ID"> no corpo.
     */
    async send(to, subject, body, contentType = 'HTML', attachments = []) {
        if (!this.isConfigured()) {
            throw new MicrosoftGraphMailerError(
                'Microsoft 365 mailer não está configurado. Defina M365_TENANT_ID, '
                + 'M365_CLIENT_ID, M365_CLIENT_SECRET, M365_SENDER_EMAIL no .env.',
            );
        }

        const recipients = MicrosoftGraphMailer._normalizeRecipients(to);
        if (!recipients.length) throw new Error('Nenhum destinatário válido.');

        const message = {
            subject,
            body: {
                contentType: contentType.toUpperCase() === 'TEXT' ? 'Text' : 'HTML',
                content: body,
            },
            toRecipients: recipients,
        };

        const anexos = MicrosoftGraphMailer._normalizeAttachments(attachments);
        if (anexos.length) message.attachments = anexos;

        const payload = { message, saveToSentItems: true };
        const url = `${GRAPH_BASE}/users/${encodeURIComponent(this.senderEmail)}/sendMail`;
        await this._postJson(url, payload, 202);
    }

    // ----- internals -----

    async _access() {
        if (this._accessToken) return this._accessToken;
        const url = `${LOGIN_BASE}/${encodeURIComponent(this.tenantId)}/oauth2/v2.0/token`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials',
                scope: GRAPH_SCOPE,
            }),
        });
        if (resp.status !== 200) {
            const txt = await resp.text();
            throw new MicrosoftGraphMailerError(
                `Falha obtendo token (HTTP ${resp.status}): ${txt.slice(0, 500)}`,
            );
        }
        const token = (await resp.json()).access_token;
        if (!token) throw new MicrosoftGraphMailerError('Microsoft Graph não retornou access_token.');
        this._accessToken = token;
        return token;
    }

    /**
     * POST com retry exponencial em 429 (throttling) e 5xx (transient).
     * Respeita o header Retry-After quando presente.
     */
    async _postJson(url, payload, expectedStatus) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this._access()}`,
        };
        const maxTentativas = 4;
        let tentativas = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            tentativas += 1;
            const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
            if (resp.status === expectedStatus) {
                const txt = await resp.text();
                if (!txt) return {};
                try { return JSON.parse(txt); } catch { return {}; }
            }
            if ([429, 500, 502, 503, 504].includes(resp.status) && tentativas < maxTentativas) {
                const retryAfter = resp.headers.get('Retry-After');
                const espera = retryAfter ? Number(retryAfter) : (2 ** tentativas);
                await sleep(Math.min(espera, 30) * 1000);
                continue;
            }
            const txt = await resp.text();
            throw new MicrosoftGraphMailerError(`Microsoft Graph HTTP ${resp.status}: ${txt.slice(0, 500)}`);
        }
    }

    static _normalizeAttachments(attachments) {
        const out = [];
        for (const att of (attachments || [])) {
            if (!att || !att.contentBytes) continue;
            const item = {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: att.name || 'anexo',
                contentType: att.contentType || 'application/octet-stream',
                contentBytes: att.contentBytes,
            };
            if (att.contentId) item.contentId = att.contentId;
            if (att.isInline) item.isInline = true;
            out.push(item);
        }
        return out;
    }

    static _normalizeRecipients(to) {
        const items = Array.isArray(to) ? to : [to];
        const out = [];
        for (const item of items) {
            let email; let name = '';
            if (item && typeof item === 'object') {
                email = (item.email || item.address || '').trim().toLowerCase();
                name = (item.name || '').trim();
            } else {
                email = String(item).trim().toLowerCase();
            }
            if (!EMAIL_RE.test(email)) continue;
            const ea = { address: email };
            if (name) ea.name = name;
            out.push({ emailAddress: ea });
        }
        return out;
    }
}

module.exports = { MicrosoftGraphMailer, MicrosoftGraphMailerError, GRAPH_BASE };
