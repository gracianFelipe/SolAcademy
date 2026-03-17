const { TOKEN, BASE_URL } = require('../config/env');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // 🛡️ Ignora bloqueios de segurança do Node

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

module.exports = { moodleAPI };