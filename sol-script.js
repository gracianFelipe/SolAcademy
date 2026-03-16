(function(){
    // =========================================================================
    // 0. ROTEADOR DE CURSOS E BASES DE CONHECIMENTO (A Trava Inteligente)
    // =========================================================================
    var ROTEADOR_SOL = {
        1279: "https://platform.zaia.app/embed/chat/63480", // Curso de Teste
        1783: "https://platform.zaia.app/embed/chat/63480", // Educação em Direitos Humanos - M 
        1956: "https://platform.zaia.app/embed/chat/63480", // Educação em Direitos Humanos - M
    };

    var COURSE_ID = (window.M && M.cfg && M.cfg.courseId) ? parseInt(M.cfg.courseId, 10) : 0;

    // Se o curso atual não estiver no roteador, o script morre e não aparece.
    if (!ROTEADOR_SOL[COURSE_ID]) {
        return; 
    }

    // =========================================================================
    // 1. IDENTIDADE DO ALUNO (Histórico Pessoal na Zaia)
    // =========================================================================
    // Pega o ID e o Nome do aluno logado no Moodle
    var USER_ID = (window.M && M.cfg && M.cfg.userid) ? parseInt(window.M.cfg.userid, 10) : Math.floor(Math.random() * 100000);
    var USER_NAME = (window.M && M.cfg && M.cfg.fullname) ? window.M.cfg.fullname : "Aluno Moodle";

    // Monta o pacote de dados EXATAMENTE como a Zaia exige
    var customDataObj = {
        userId: USER_ID,
        userData: JSON.stringify({
            name: USER_NAME,
            curso: COURSE_ID
        })
    };

    // Codifica o pacote para poder colocar no link sem quebrar a internet
    var encodedCustomData = encodeURIComponent(JSON.stringify(customDataObj));

    // Monta o link final com o pacote customizado
    var CHAT_URL_ESPECIFICO = ROTEADOR_SOL[COURSE_ID] + "?custom=" + encodedCustomData;

    console.log("🌞 Sol Academy: Modo Widget ativado para o curso " + COURSE_ID);
    console.log("👤 Aluno identificado: " + USER_NAME + " (ID: " + USER_ID + ")");
    console.log("🔗 Link da Zaia carregado: " + CHAT_URL_ESPECIFICO);
    
    var CONFIG = window.SOL_CONFIG || { TOKEN: '' };

    // Evita que o botão seja criado duas vezes caso o Moodle recarregue a página por trás
    if (document.getElementById('kai-sol-fab')) {
        return;
    }

    // =========================================================================
    // 1. CONSTRUÇÃO DO WIDGET FLUTUANTE (Menu Moodle)
    // =========================================================================
    var style = document.createElement('style');
    style.innerHTML = `
        #kai-sol-fab {
            cursor: pointer;
            display: flex; align-items: center; gap: 6px;
            font-weight: 600;
        }
        #kai-sol-fab .sol-icon {
            display: inline-block;
            font-size: 20px;
            transition: filter 0.3s ease, transform 0.3s ease;
            animation: sol-pulse 2.5s ease-in-out infinite;
        }
        #kai-sol-fab:hover .sol-icon {
            filter: drop-shadow(0 0 6px #facc15) drop-shadow(0 0 14px #fbbf24);
            transform: scale(1.2);
            animation: none;
        }
        @keyframes sol-pulse {
            0%, 100% { filter: drop-shadow(0 0 0px transparent); }
            50% { filter: drop-shadow(0 0 5px #f97316); }
        }
        
        #kai-sol-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            z-index: 999999; display: none; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s ease;
        }
        
        #kai-sol-modal {
            background: #fff; width: 95%; max-width: 960px; height: 90vh; max-height: 850px;
            border-radius: 16px; display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3); transform: translateY(20px); transition: transform 0.3s ease;
            font-family: system-ui,-apple-system,sans-serif;
        }
        
        #kai-sol-header {
            background: #1e3a8a; padding: 16px 24px; color: #fff;
            display: flex; justify-content: space-between; align-items: center;
        }
        #kai-sol-header h2 { margin: 0; color: #fff; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 5px;}
        #kai-sol-close {
            background: none; border: none; color: #fff; font-size: 28px;
            cursor: pointer; opacity: 0.8; transition: opacity 0.2s; padding: 0; line-height: 1;
        }
        #kai-sol-close:hover { opacity: 1; }
        
        #kai-sol-body { padding: 24px; overflow-y: auto; flex: 1; background: #f8fafc; }
    `;
    document.head.appendChild(style);

    // Overlay/modal on document.body (available immediately)
    var overlayContainer = document.createElement('div');
    overlayContainer.innerHTML = `
        <div id="kai-sol-overlay">
            <div id="kai-sol-modal">
                <div id="kai-sol-header">
                    <h2><span>🌞</span> Sol Academy</h2>
                    <button id="kai-sol-close">&times;</button>
                </div>
                <div id="kai-sol-body">
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
    document.body.appendChild(overlayContainer);

    var overlay = document.getElementById('kai-sol-overlay');
    var modal = document.getElementById('kai-sol-modal');
    var closeBtn = document.getElementById('kai-sol-close');

    function openSol() {
        overlay.style.display = 'flex';
        setTimeout(() => { 
            overlay.style.opacity = '1'; 
            modal.style.transform = 'translateY(0)'; 
        }, 10);
        loadReminders(); 
    }

    function closeSol() {
        overlay.style.opacity = '0';
        modal.style.transform = 'translateY(20px)';
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }

    closeBtn.addEventListener('click', closeSol);
    overlay.addEventListener('click', function(e){
        if(e.target === this) closeSol(); 
    });

    // Inject the nav item into Moodle's secondary navigation <ul>
    // Uses MutationObserver to wait for the nav to be rendered
    function injectNavItem() {
        var navUl = document.querySelector('nav.moremenu ul[role="menubar"]');
        if (!navUl) return false;

        var solLi = document.createElement('li');
        solLi.setAttribute('data-key', 'solacademy');
        solLi.className = 'nav-item';
        solLi.setAttribute('role', 'none');
        solLi.setAttribute('data-forceintomoremenu', 'false');
        solLi.innerHTML = '<a role="menuitem" id="kai-sol-fab" class="nav-link" href="javascript:void(0)" tabindex="-1"><span class="sol-icon">🌞</span> Sol Academy</a>';

        var moreDropdown = navUl.querySelector('li[data-region="morebutton"]');
        if (moreDropdown) {
            navUl.insertBefore(solLi, moreDropdown);
        } else {
            navUl.appendChild(solLi);
        }

        document.getElementById('kai-sol-fab').addEventListener('click', openSol);
        return true;
    }

    if (!injectNavItem()) {
        var navObserver = new MutationObserver(function() {
            if (injectNavItem()) {
                navObserver.disconnect();
            }
        });
        navObserver.observe(document.body, { childList: true, subtree: true });
    }

    // =========================================================================
    // 2. LÓGICA DA SOL ACADEMY (Tarefas e Lembretes)
    // =========================================================================
    var TOKEN = CONFIG.TOKEN;
    var ROOT  = (window.M && M.cfg && M.cfg.wwwroot) ? M.cfg.wwwroot : window.location.origin;
    var BASE  = ROOT + '/webservice/rest/server.php';
  
    var WINDOW_DAYS = 20;
    var ABSENCE_SECONDS = 3 * 24 * 60 * 60; 
    var DEBUG_MODE = true;

    function mostrarFraseMotivacional(userId){
      var box = document.getElementById('kai-motivacional');
      if (!box) return; 
  
      var uid = userId || 'visitante';
      var key = 'kai.motivacional.last.user.'+uid+'.course.'+COURSE_ID;
      var last = parseInt(localStorage.getItem(key)||'0',10);
      var now = Date.now();
      
      localStorage.setItem(key, String(now));
  
      // 👇 A MÁGICA ACONTECE AQUI: Ela só puxa o banco de dados na hora de mostrar!
      var frases = window.SOL_FRASES || ["Siga em frente, você está indo muito bem! 🌞"];
      var frase = frases[Math.floor(Math.random()*frases.length)];
  
      var div = document.createElement('div');
      div.style.cssText = "margin:10px 0; padding:12px 16px; background:#fff7ed; color:#1e3a8a; border-left:4px solid #1e3a8a; border-radius:0 8px 8px 0; font-size:14px; font-weight:500; opacity:1; transition:opacity 3s ease-out;";
      div.textContent = "💡 " + frase;
      
      box.innerHTML = '';
      box.appendChild(div);
  
      // O TEMPORIZADOR DUPLO (Fade Out da frase -> Fade In do Sol)
      setTimeout(function(){
        div.style.opacity = "0"; // 1. A frase começa a sumir devagar
        
        setTimeout(function(){ 
            if(div.parentNode) div.parentNode.removeChild(div); // 2. Remove a frase
            
            // 3. Cria o Sol invisível
            var sol = document.createElement('div');
            sol.style.cssText = "font-size: 28px; text-align: center; opacity: 0; transition: opacity 2s ease-in; margin: 10px 0;";
            sol.textContent = "🌞";
            box.appendChild(sol);
            
            // 4. Dá um peteleco no navegador para ele iniciar o Fade In
            setTimeout(function() {
                sol.style.opacity = "1"; 
            }, 50);

        }, 3000); // Tempo do Fade Out da frase (3 segundos)
      }, 10000); // Tempo que a frase fica na tela (10 segundos)
    }
  
    function apiUrl(fn, params){
      if (!TOKEN) return ''; 
      var u = BASE + '?moodlewsrestformat=json&wsfunction=' + encodeURIComponent(fn) + '&wstoken=' + encodeURIComponent(TOKEN);
      for (var k in params){ if (Object.prototype.hasOwnProperty.call(params,k)){ u += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k])); } }
      return u;
    }
    
    function fmtDate(ts){ var d=new Date(ts*1000), z=n=>(n<10?'0':'')+n; return z(d.getDate())+'/'+z(d.getMonth()+1)+' às '+z(d.getHours())+':'+z(d.getMinutes()); }
    function norm(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
    
    function cleanTitle(title){ 
      return (title||'')
        .replace(/deve estar conclu[ií]do?/i,'')
        .replace(/entrega/i,'')
        .replace(/está marcado\(a\) para esta data/i, '')
        .replace(/is due/i, '')
        .trim(); 
    }
    
    function linkEditSubmissionByCmid(cmid){ return ROOT + '/mod/assign/view.php?id=' + cmid + '&action=editsubmission'; }
    function linkEditSubmissionFromURL(url){ return url + (url.includes('?') ? '&' : '?') + 'action=editsubmission'; }
    function setSub(t){ var el=document.getElementById('kai-sub'); if(el) el.textContent=t; }
  
    function resolveCurrentUser(){
      if (window.M && M.cfg && M.cfg.userid){ return Promise.resolve({ userid: parseInt(M.cfg.userid,10), fullname: String(M.cfg.fullname||'') }); }
      var a = document.querySelector('.usermenu a[href*="/user/profile.php?id="], a[href*="/user/profile.php?id="]');
      if (a){
        try{
          var u = new URL(a.href, location.origin);
          var id = parseInt(u.searchParams.get('id')||'0',10);
          return Promise.resolve({ userid:id, fullname:(a.textContent||'').trim() });
        }catch(e){}
      }
      return Promise.resolve({ userid:0, fullname:'' });
    }
  
    function presenceKey(uid){ return 'kai.lastSeen.course.'+COURSE_ID+'.user.'+uid; }
    function showPresenceBanner(){
      var box=document.getElementById('kai-presenca'); if(!box) return;
      var banner=document.createElement('div');
      banner.style.cssText="padding:8px 12px;border:1px solid #f59e0b;border-radius:12px;color:#92400e;background:#fffbeb;font-size:13px;line-height:1.25;opacity:1;transition:opacity 7s ease-out;";
      banner.innerHTML='<span>⏳</span> Olá aluno(a), notei que você não acessa a plataforma há algum tempo. Vamos retomar? — Sou a <b>Sol</b>, sua Tutora 🌞';
      box.innerHTML=''; box.appendChild(banner);
      setTimeout(function(){ banner.style.opacity="0"; setTimeout(function(){ banner.remove(); },7000); },10000);
    }
    function presenceFlowForCurrentUser(){
      resolveCurrentUser().then(function(info){
        var uid = info.userid; if(!uid) return;
        var key = presenceKey(uid), now = Math.floor(Date.now()/1000), last = parseInt(localStorage.getItem(key)||'0',10);
        if(last && (now-last)>=ABSENCE_SECONDS) showPresenceBanner();
        localStorage.setItem(key, String(now));
      });
    }
  
    function resolveCmid(it){
      if (it && Number.isInteger(it.cmid)) return it.cmid;
      var u = it && (it.link||it.url); if(!u) return null;
      try{ var id=new URL(u, ROOT).searchParams.get('id'); return id?Number(id):null; }catch(e){ return null; }
    }
    
    function dedupeByCmid(list){
      var seen = new Set();
      return list.filter(function(it){
        var cmid = resolveCmid(it);
        if (!cmid) return true;
        if (seen.has(cmid)) return false;
        seen.add(cmid); return true;
      });
    }
    
    function guessCmidFromName(evName, nameToCmid){
      var n = norm(String(evName));
      if (nameToCmid[n]) return nameToCmid[n];
      var best=null, keys=Object.keys(nameToCmid);
      for (var i=0;i<keys.length;i++){ var k=keys[i]; if(n.indexOf(k)>=0){ if(!best || k.length>best.len) best={id:nameToCmid[k], len:k.length}; } }
      return best?best.id:null;
    }
  
    function renderItem(it){
      // 1. Mudando a cor do texto do NOME da atividade (Link) para o seu azul escuro (#1e3a8a)
      var left = it.link ? '<a href="'+it.link+'" target="_blank" rel="noopener" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">'+cleanTitle(it.title)+'</a>'
                         : (it.url  ? '<a href="'+it.url+'" target="_blank" rel="noopener" style="color: #1e3a8a; font-weight: 600; text-decoration: none;">'+cleanTitle(it.title)+'</a>'
                                    : cleanTitle(it.title));
                                    
      // 2. Aplicando a sua barrinha azul (#1e3a8a) e o fundo creme (#fff7ed) na caixa
      return '<div style="margin:10px 0; padding:12px 16px; background:#fff7ed; border-left:4px solid #1e3a8a; border-radius:0 8px 8px 0; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">'
           +   '<div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; font-size:14px;">'
           +     left
           +   '</div>'
           +   '<span style="color:#64748b;font-size:12px;flex-shrink:0; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: 500;">Até '+it.when+'</span>'
           + '</div>';
    }
  
    function loadReminders(){
      if (!TOKEN) {
          setSub('Erro: Sem autorização para buscar tarefas.');
          return;
      }

      var now = Math.floor(Date.now()/1000);
      var inWindow = now + WINDOW_DAYS*24*60*60;
      var urlCal = apiUrl('core_calendar_get_calendar_events', {'events[courseids][0]': COURSE_ID, 'options[timestart]': now, 'options[timeend]': inWindow});
  
      resolveCurrentUser().then(async function(info){
        var userId = info.userid || 0;
        
        let c;
        try { c = await fetch(urlCal).then(r=>r.json()); } catch(e) { c = {}; }
        
        var events = [];
  
        try{
          var evs = (c && c.events) ? c.events : [];
          for (var j=0; j<evs.length; j++){
            var ev = evs[j], ts = parseInt(ev.timestart||0,10);
            if (ts < now || ts > inWindow) continue;
            
            var title = ev.name || 'Atividade';
            
            // 💡 EXTRATOR UNIVERSAL DE CMID (ID da atividade)
            var cmid = ev.cmid;
            if (!cmid && ev.coursemodule) {
                cmid = (typeof ev.coursemodule === 'object') ? ev.coursemodule.id : ev.coursemodule;
            }
            
            // 💡 EXTRATOR UNIVERSAL DE LINKS (Acha o link do Fórum na gaveta escondida)
            var link = ev.url;
            if (!link && ev.action && ev.action.url) {
                link = ev.action.url; 
            }
            if (!link && cmid && ev.modulename) {
                link = ROOT + '/mod/' + ev.modulename + '/view.php?id=' + cmid;
            }
            if (!link) {
                link = ROOT + '/course/view.php?id=' + COURSE_ID;
            }

            // Se for tarefa (assign), tenta mandar direto para a tela de entrega
            if (ev.modulename === 'assign' && link && !link.includes('action=editsubmission')) {
                link = link + (link.includes('?') ? '&' : '?') + 'action=editsubmission';
            }
            
            events.push({ type:'event', title, when:fmtDate(ts), ts, url: link, cmid, link });
          }
        }catch(e){}
  
        // Ocultar atividades que o aluno já completou
        if (userId){
          try{
            var comp = await fetch(apiUrl('core_completion_get_activities_completion_status', { courseid: COURSE_ID, userid: userId })).then(r=>r.json());
            var completed = new Set((comp.statuses||[]).filter(s=>s && s.state==1 && Number.isInteger(s.cmid)).map(s=>s.cmid));
            events = events.filter(it => {
                var cmid = resolveCmid(it);
                return !(cmid && completed.has(cmid));
            });
          }catch(e){}
        }
        
        events.sort((x,y)=>x.ts-y.ts);
        
        var listTasks  = document.getElementById('kai-tasks');
        var listEvents = document.getElementById('kai-events');
        
        if (!events.length){ 
            setSub('Nenhuma pendência para os próximos ' + WINDOW_DAYS + ' dias. Ótimo trabalho!'); 
            listTasks.innerHTML=''; 
            listEvents.innerHTML=''; 
            mostrarFraseMotivacional(userId); // Mostra a frase motivacional se não tiver tarefa
            return; 
        }
        
        var totalPendencias = events.length;
        setSub(totalPendencias === 1 ? '1 atividade pendente:' : totalPendencias + ' atividades pendentes:');
        
        mostrarFraseMotivacional(userId); // Mostra a frase motivacional se tiver tarefa
        
        // Limpa a tela e coloca Fóruns, Tarefas e Questionários tudo na mesma lista de Entregas
        listTasks.innerHTML  = '';
        listEvents.innerHTML = '<h4 style="margin-top:16px; color:#333; font-size:16px;">📖 Próximas Entregas</h4>'+events.map(renderItem).join('');
      }).catch(function(err){ 
          if (DEBUG_MODE) console.error('[DEBUG] Falha no loadReminders', err);
          setSub('Erro ao carregar os lembretes.'); 
      });
    }
  
    // Inicia verificação de presença em background
    presenceFlowForCurrentUser();

})();