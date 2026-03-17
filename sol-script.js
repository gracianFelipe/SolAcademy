(function(){
    // =========================================================================
    // 0. ROTEADOR CENTRAL DE CURSOS E TRAVA DE SEGURANÇA
    // =========================================================================
    var ROTEADOR_SOL = window.ROTEADOR_SOL || {};
    var COURSE_ID = (window.M && M.cfg && M.cfg.courseId) ? parseInt(M.cfg.courseId, 10) : 0;

    // Se o curso atual não estiver no roteador (ou se o aluno estiver no Painel Inicial), o script morre.
    if (!ROTEADOR_SOL[COURSE_ID]) {
        console.log("🌞 Sol Academy: Oculta nesta página (Curso " + COURSE_ID + " não está no roteador).");
        return; 
    }

    // =========================================================================
    // 1. IDENTIDADE DO ALUNO E PREPARAÇÃO DO LINK
    // =========================================================================
    var USER_ID = (window.M && M.cfg && M.cfg.userid) ? parseInt(window.M.cfg.userid, 10) : Math.floor(Math.random() * 100000);
    var USER_NAME = (window.M && M.cfg && M.cfg.fullname) ? window.M.cfg.fullname : "Aluno Moodle";

    var customDataObj = { userId: USER_ID, userData: JSON.stringify({ name: USER_NAME, curso: COURSE_ID }) };
    var encodedCustomData = encodeURIComponent(JSON.stringify(customDataObj));
    var CHAT_URL_ESPECIFICO = ROTEADOR_SOL[COURSE_ID] + "?custom=" + encodedCustomData;

    console.log("🌞 Sol Academy: Modo Widget ativado para o curso " + COURSE_ID);
    
    var CONFIG = window.SOL_CONFIG || { TOKEN: '' };
    var ROOT  = (window.M && M.cfg && M.cfg.wwwroot) ? M.cfg.wwwroot : window.location.origin;

    // Evita botões duplicados
    if (document.getElementById('kai-sol-fab')) return;

    // =========================================================================
    // 2. ESTILOS VISUAIS (CSS)
    // =========================================================================
    var style = document.createElement('style');
    style.innerHTML = `
        /* 1. Aumentamos o tamanho da letra (font-size: 16px) dos dois botões aqui */
        .kai-nav-btn { cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 16px; }
        
        /* 2. Aumentamos um pouco o tamanho do Sol para acompanhar a letra (22px) */
        .kai-nav-btn .sol-icon { display: inline-block; font-size: 22px; transition: filter 0.3s ease, transform 0.3s ease; animation: sol-pulse 2.5s ease-in-out infinite; }
        
        /* 3. Aumentamos o brilho quando passa o mouse por cima (de 14px para 22px de espalhamento) */
        .kai-nav-btn:hover .sol-icon { filter: drop-shadow(0 0 8px #facc15) drop-shadow(0 0 22px #fbbf24); transform: scale(1.2); animation: none; }
        
        /* 4. Aumentamos o brilho do pulsar natural (de 5px para 12px) */
        @keyframes sol-pulse { 
            0%, 100% { filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.3)); } 
            50% { filter: drop-shadow(0 0 12px #f97316); } 
        }
        
        .kai-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999999; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
        .kai-modal { background: #fff; width: 95%; max-width: 960px; height: 90vh; max-height: 850px; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); transform: translateY(20px); transition: transform 0.3s ease; font-family: system-ui,-apple-system,sans-serif; }
        .kai-header { padding: 16px 24px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
        .kai-header h2 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 5px;}
        .kai-close { background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; padding: 0; line-height: 1; }
        .kai-close:hover { opacity: 1; }
        .kai-body { padding: 24px; overflow-y: auto; flex: 1; background: #f8fafc; }
    `;
    document.head.appendChild(style);

    // =========================================================================
    // 3. CONSTRUÇÃO DO WIDGET DA SOL ACADEMY
    // =========================================================================
    var solOverlayContainer = document.createElement('div');
    solOverlayContainer.innerHTML = `
        <div id="kai-sol-overlay" class="kai-overlay">
            <div id="kai-sol-modal" class="kai-modal">
                <div class="kai-header" style="background: #1e3a8a;">
                    <h2><span>🌞</span> Sol Academy</h2>
                    <button id="kai-sol-close" class="kai-close">&times;</button>
                </div>
                <div class="kai-body">
                    <div id="kai-reminders" style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div id="kai-motivacional" style="min-height: 20px;"></div>
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 10px;">
                            <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Lembretes desta semana</h3>
                            <div id="kai-presenca" style="min-height: 36px;"></div>
                        </div>
                        <div id="kai-sub" style="color: #64748b; margin: 10px 0; font-size: 14px;">Carregando pendências…</div>
                        <div id="kai-tasks"></div>
                        <div id="kai-events"></div>
                    </div>
                    <iframe id="widget-iframe" style="border: 1px solid #e2e8f0; width: 100%; height: 600px; min-height: 60vh; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);" src="${CHAT_URL_ESPECIFICO}"></iframe>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(solOverlayContainer);

    var sOverlay = document.getElementById('kai-sol-overlay');
    var sModal = document.getElementById('kai-sol-modal');
    var sCloseBtn = document.getElementById('kai-sol-close');

    function openSol() { sOverlay.style.display = 'flex'; setTimeout(() => { sOverlay.style.opacity = '1'; sModal.style.transform = 'translateY(0)'; }, 10); loadReminders(); }
    function closeSol() { sOverlay.style.opacity = '0'; sModal.style.transform = 'translateY(20px)'; setTimeout(() => { sOverlay.style.display = 'none'; }, 300); }
    sCloseBtn.addEventListener('click', closeSol);
    sOverlay.addEventListener('click', function(e){ if(e.target === this) closeSol(); });

    // =========================================================================
    // 4. CONSTRUÇÃO DO WIDGET DA PROFESSORA (APENAS CURSO 1956)
    // =========================================================================
    if (COURSE_ID === 1956) {
        var tutorOverlayContainer = document.createElement('div');
        tutorOverlayContainer.innerHTML = `
            <div id="kai-tutor-overlay" class="kai-overlay">
                <div id="kai-tutor-modal" class="kai-modal" style="max-width: 800px; height: 85vh;">
                    <div class="kai-header" style="background: #0f47ad;">
                        <h2 style="gap: 8px;">🎓 Fale com o Tutor</h2>
                        <button id="kai-tutor-close" class="kai-close">&times;</button>
                    </div>
                    <div class="kai-body" style="padding: 0; position: relative;">
                        <iframe id="kai-tutor-iframe" style="width: 100%; height: 100%; border: none;" src="https://atp.esup.edu.br/message/index.php?id=687"></iframe>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(tutorOverlayContainer);

        var tOverlay = document.getElementById('kai-tutor-overlay');
        var tModal = document.getElementById('kai-tutor-modal');
        var tCloseBtn = document.getElementById('kai-tutor-close');
        var tIframe = document.getElementById('kai-tutor-iframe'); // Pegamos o iframe!

        // 🎯 A MÁGICA: Quando o iframe carregar, injetamos CSS para esconder o Moodle!
        tIframe.onload = function() {
            try {
                var iframeDoc = tIframe.contentDocument || tIframe.contentWindow.document;
                var style = iframeDoc.createElement('style');
                style.innerHTML = `
                    /* 1. Esconde cabeçalho, rodapé e menus do Moodle */
                    header, footer, nav, #page-header, #page-footer, #nav-drawer, .navbar, .fixed-top, .secondary-navigation, [data-region="drawer"] { 
                        display: none !important; 
                    }
                    /* 2. Tira margens do Moodle */
                    #page, #page-wrapper, #page-content, #region-main, #region-main-box { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        border: none !important; 
                        background: #fff !important; 
                    }
                    /* 3. A MÁGICA DO CHAT: Esconde a lista de contatos/grupos (Esquerda) */
                    .message-app [data-region="view-overview"], 
                    .message-app .list-group { 
                        display: none !important; 
                    }
                    /* 4. Expande o Chat da Professora para 100% da tela (Direita) */
                    .message-app [data-region="view-conversation"] { 
                        width: 100% !important; 
                        max-width: 100% !important;
                        flex: 1 1 100% !important; 
                    }
                `;
                iframeDoc.head.appendChild(style);
            } catch (e) {
                console.log("🌞 Sol Academy: Aviso - Não foi possível esconder o layout do Moodle no iframe.");
            }
        };

        window.openTutor = function() { tOverlay.style.display = 'flex'; setTimeout(() => { tOverlay.style.opacity = '1'; tModal.style.transform = 'translateY(0)'; }, 10); };
        window.closeTutor = function() { tOverlay.style.opacity = '0'; tModal.style.transform = 'translateY(20px)'; setTimeout(() => { tOverlay.style.display = 'none'; }, 300); };
        
        tCloseBtn.addEventListener('click', window.closeTutor);
        tOverlay.addEventListener('click', function(e){ if(e.target === this) window.closeTutor(); });
    }

    // =========================================================================
    // 5. INJEÇÃO DOS BOTÕES NO MENU DO MOODLE
    // =========================================================================
    function injectNavItem() {
        var navUl = document.querySelector('nav.moremenu ul[role="menubar"]');
        if (!navUl) return false;

        var moreDropdown = navUl.querySelector('li[data-region="morebutton"]');

        // Botão da Sol (Para todos os cursos autorizados)
        if (!document.getElementById('kai-sol-fab')) {
            var solLi = document.createElement('li');
            solLi.className = 'nav-item';
            solLi.setAttribute('role', 'none');
            solLi.innerHTML = '<a role="menuitem" id="kai-sol-fab" class="nav-link kai-nav-btn" href="javascript:void(0)" tabindex="-1"><span class="sol-icon">🌞</span> Sol Academy</a>';
            if (moreDropdown) navUl.insertBefore(solLi, moreDropdown); else navUl.appendChild(solLi);
            document.getElementById('kai-sol-fab').addEventListener('click', openSol);
        }

        // Botão do Tutor (Apenas 1956)
        if (COURSE_ID === 1956 && !document.getElementById('kai-tutor-fab')) {
            var tutorLi = document.createElement('li');
            tutorLi.className = 'nav-item';
            tutorLi.setAttribute('role', 'none');
            tutorLi.innerHTML = '<a role="menuitem" id="kai-tutor-fab" class="nav-link kai-nav-btn" href="javascript:void(0)" tabindex="-1" style="color: #000000;">🎓 Fale com o Tutor</a>';
            if (moreDropdown) navUl.insertBefore(tutorLi, moreDropdown); else navUl.appendChild(tutorLi);
            document.getElementById('kai-tutor-fab').addEventListener('click', window.openTutor);
        }

        return true;
    }

    if (!injectNavItem()) {
        var navObserver = new MutationObserver(function() { if (injectNavItem()) navObserver.disconnect(); });
        navObserver.observe(document.body, { childList: true, subtree: true });
    }

    // =========================================================================
    // 6. LÓGICA DE LEMBRETES E PAINEL (MANTIDA INTACTA)
    // =========================================================================
    var TOKEN = CONFIG.TOKEN;
    var BASE  = ROOT + '/webservice/rest/server.php';
    var WINDOW_DAYS = 20;
    var ABSENCE_SECONDS = 3 * 24 * 60 * 60; 

    function mostrarFraseMotivacional(userId){
      var box = document.getElementById('kai-motivacional');
      if (!box) return; 
      var uid = userId || 'visitante';
      var key = 'kai.motivacional.last.user.'+uid+'.course.'+COURSE_ID;
      localStorage.setItem(key, String(Date.now()));
  
      var frases = window.SOL_FRASES || ["Siga em frente, você está indo muito bem! 🌞"];
      var frase = frases[Math.floor(Math.random()*frases.length)];
  
      var div = document.createElement('div');
      div.style.cssText = "margin:10px 0; padding:12px 16px; background:#fff7ed; color:#1e3a8a; border-left:4px solid #1e3a8a; border-radius:0 8px 8px 0; font-size:14px; font-weight:500; opacity:1; transition:opacity 3s ease-out;";
      div.textContent = "💡 " + frase;
      box.innerHTML = ''; box.appendChild(div);
  
      setTimeout(function(){
        div.style.opacity = "0"; 
        setTimeout(function(){ 
            if(div.parentNode) div.parentNode.removeChild(div); 
            var sol = document.createElement('div');
            sol.style.cssText = "font-size: 28px; text-align: center; opacity: 0; transition: opacity 2s ease-in; margin: 10px 0;";
            sol.textContent = "🌞";
            box.appendChild(sol);
            setTimeout(function() { sol.style.opacity = "1"; }, 50);
        }, 3000); 
      }, 10000); 
    }
  
    function apiUrl(fn, params){
      if (!TOKEN) return ''; 
      var u = BASE + '?moodlewsrestformat=json&wsfunction=' + encodeURIComponent(fn) + '&wstoken=' + encodeURIComponent(TOKEN);
      for (var k in params){ if (Object.prototype.hasOwnProperty.call(params,k)){ u += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])); } }
      return u;
    }
    
    function fmtDate(ts){ var d=new Date(ts*1000), z=n=>(n<10?'0':'')+n; return z(d.getDate())+'/'+z(d.getMonth()+1)+' às '+z(d.getHours())+':'+z(d.getMinutes()); }
    
    function cleanTitle(title){ 
      return (title||'').replace(/deve estar conclu[ií]do?/i,'').replace(/entrega/i,'').replace(/está marcado\(a\) para esta data/i, '').replace(/is due/i, '').trim(); 
    }
    
    function setSub(t){ var el=document.getElementById('kai-sub'); if(el) el.textContent=t; }
  
    function resolveCurrentUser(){
      if (window.M && M.cfg && M.cfg.userid){ return Promise.resolve({ userid: parseInt(M.cfg.userid,10), fullname: String(M.cfg.fullname||'') }); }
      return Promise.resolve({ userid:0, fullname:'' });
    }
  
    function showPresenceBanner(){
      var box=document.getElementById('kai-presenca'); if(!box) return;
      var banner=document.createElement('div');
      banner.style.cssText="padding:8px 12px;border:1px solid #f59e0b;border-radius:12px;color:#92400e;background:#fffbeb;font-size:13px;line-height:1.25;opacity:1;transition:opacity 7s ease-out;";
      banner.innerHTML='<span>⏳</span> Senti sua falta! Vamos retomar? — <b>Sol</b> 🌞';
      box.innerHTML=''; box.appendChild(banner);
      setTimeout(function(){ banner.style.opacity="0"; setTimeout(function(){ banner.remove(); },7000); },10000);
    }

    function presenceFlowForCurrentUser(){
      resolveCurrentUser().then(function(info){
        var uid = info.userid; if(!uid) return;
        var key = 'kai.lastSeen.course.'+COURSE_ID+'.user.'+uid, now = Math.floor(Date.now()/1000), last = parseInt(localStorage.getItem(key)||'0',10);
        if(last && (now-last)>=ABSENCE_SECONDS) showPresenceBanner();
        localStorage.setItem(key, String(now));
      });
    }
  
    function resolveCmid(it){
      if (it && Number.isInteger(it.cmid)) return it.cmid;
      var u = it && (it.link||it.url); if(!u) return null;
      try{ var id=new URL(u, ROOT).searchParams.get('id'); return id?Number(id):null; }catch(e){ return null; }
    }
  
    function renderItem(it){
      var left = it.link ? '<a href="'+it.link+'" target="_blank" rel="noopener" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">'+cleanTitle(it.title)+'</a>'
                         : (it.url  ? '<a href="'+it.url+'" target="_blank" rel="noopener" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">'+cleanTitle(it.title)+'</a>'
                                    : cleanTitle(it.title));
      return '<div style="margin:10px 0; padding:12px 16px; background:#fff7ed; border-left:4px solid #1e3a8a; border-radius:0 8px 8px 0; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">'
           +   '<div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; font-size:14px;">' + left + '</div>'
           +   '<span style="color:#64748b;font-size:12px;flex-shrink:0; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Até '+it.when+'</span>'
           + '</div>';
    }
  
    function loadReminders(){
      if (!TOKEN) { setSub('Erro: Sem autorização.'); return; }

      var now = Math.floor(Date.now()/1000);
      var inWindow = now + WINDOW_DAYS*24*60*60;
      var urlCal = apiUrl('core_calendar_get_calendar_events', {'events[courseids][0]': COURSE_ID, 'options[timestart]': now, 'options[timeend]': inWindow});
  
      resolveCurrentUser().then(async function(info){
        var userId = info.userid || 0;
        let c; try { c = await fetch(urlCal).then(r=>r.json()); } catch(e) { c = {}; }
        var events = [];
  
        try{
          var evs = (c && c.events) ? c.events : [];
          for (var j=0; j<evs.length; j++){
            var ev = evs[j], ts = parseInt(ev.timestart||0,10);
            if (ts < now || ts > inWindow) continue;
            var title = ev.name || 'Atividade';
            var cmid = ev.cmid;
            if (!cmid && ev.coursemodule) cmid = (typeof ev.coursemodule === 'object') ? ev.coursemodule.id : ev.coursemodule;
            var link = ev.url;
            if (!link && ev.action && ev.action.url) link = ev.action.url; 
            if (!link && cmid && ev.modulename) link = ROOT + '/mod/' + ev.modulename + '/view.php?id=' + cmid;
            if (!link) link = ROOT + '/course/view.php?id=' + COURSE_ID;
            if (ev.modulename === 'assign' && link && !link.includes('action=editsubmission')) link = link + (link.includes('?') ? '&' : '?') + 'action=editsubmission';
            events.push({ type:'event', title, when:fmtDate(ts), ts, url: link, cmid, link });
          }
        }catch(e){}
  
        if (userId){
          try{
            var comp = await fetch(apiUrl('core_completion_get_activities_completion_status', { courseid: COURSE_ID, userid: userId })).then(r=>r.json());
            var completed = new Set((comp.statuses||[]).filter(s=>s && s.state==1 && Number.isInteger(s.cmid)).map(s=>s.cmid));
            events = events.filter(it => { var cmid = resolveCmid(it); return !(cmid && completed.has(cmid)); });
          }catch(e){}
        }
        
        events.sort((x,y)=>x.ts-y.ts);
        
        var listTasks  = document.getElementById('kai-tasks');
        var listEvents = document.getElementById('kai-events');
        
        if (!events.length){ 
            setSub('Nenhuma pendência para os próximos ' + WINDOW_DAYS + ' dias. Ótimo trabalho!'); 
            listTasks.innerHTML=''; listEvents.innerHTML=''; 
            mostrarFraseMotivacional(userId); 
            return; 
        }
        
        var totalPendencias = events.length;
        setSub(totalPendencias === 1 ? '1 atividade pendente:' : totalPendencias + ' atividades pendentes:');
        mostrarFraseMotivacional(userId); 
        listTasks.innerHTML  = '';
        listEvents.innerHTML = '<h4 style="margin-top:16px; color:#333; font-size:16px;">📖 Próximas Entregas</h4>'+events.map(renderItem).join('');
      }).catch(function(err){ setSub('Erro ao carregar os lembretes.'); });
    }
  
    presenceFlowForCurrentUser();
})();