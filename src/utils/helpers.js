function formatarData(timestamp) {
    const d = new Date(timestamp * 1000);
    const z = n => (n < 10 ? '0' : '') + n;
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()} às ${z(d.getHours())}:${z(d.getMinutes())}`;
}

function extrairLinkAtividade(ativ, courseId) {
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
    if (!link && ativ.instance && ativ.modulename) {
        let atalho = ativ.modulename === 'forum' ? 'f' : (ativ.modulename === 'assign' ? 'a' : 'id');
        link = `https://atp.esup.edu.br/mod/${ativ.modulename}/view.php?${atalho}=${ativ.instance}`;
    }
    if (!link) {
        link = `https://atp.esup.edu.br/course/view.php?id=${courseId}`;
    }
    return link;
}

module.exports = { formatarData, extrairLinkAtividade };