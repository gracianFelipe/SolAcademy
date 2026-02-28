(function(){
    console.log("🌞 Sol Academy conectada! Carregando variáveis do Moodle de forma segura...");
    
    // =========================================================================
    // 0. CARREGANDO O COFRE DE SEGURANÇA (Vindo do Moodle)
    // =========================================================================
    // Se o window.SOL_CONFIG não existir, ele cria variáveis vazias para não quebrar o código
    var CONFIG = window.SOL_CONFIG || { TOKEN: '', CHAT_URL: '' };

    // =========================================================================
    // 1. INJEÇÃO DO HTML
    // =========================================================================
    var root = document.getElementById('kai-sol-root');
    if (root) {
        root.innerHTML = `
            <div id="kai-reminders" style="max-width: 920px; font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial; background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #eee; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    <h3 style="margin: 0; color: #1e3a8a;">🌞 Lembretes desta semana</h3>
                    <div id="kai-presenca" style="min-height: 36px;"></div>
                </div>
                <div id="kai-sub" style="color: #666; margin: 10px 0;">Carregando lembretes…</div>
                <div id="kai-motivacional" style="min-height: 20px;"></div>
                <div id="kai-tasks"></div>
                <div id="kai-events"></div>
            </div>
            <p style="display: flex; justify-content: center;">
                <iframe id="widget-iframe" style="border: 1px solid #ddd; width: 100%; max-width: 920px; height: 600px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" src="${CONFIG.CHAT_URL}"></iframe>
            </p>
        `;
    } else {
        return;
    }

    try {
        var dlg = document.querySelector('.moodle-dialogue-base .moodle-dialogue, .modal-dialog');
        if (dlg) { dlg.style.maxWidth = '1200px'; dlg.style.width = '95%'; }
    } catch(e){}

    // =========================================================================
    // 2. LÓGICA DA SOL ACADEMY
    // =========================================================================
    // O Token agora vem da variável segura do Moodle
    var TOKEN = CONFIG.TOKEN;
    var ROOT  = (window.M && M.cfg && M.cfg.wwwroot) ? M.cfg.wwwroot : window.location.origin;
    var BASE  = ROOT + '/webservice/rest/server.php';
  
    var COURSE_ID   = (window.M && M.cfg && M.cfg.courseId) ? parseInt(M.cfg.courseId,10) : 1279;
    var WINDOW_DAYS = 7;
    var ABSENCE_SECONDS = 3 * 24 * 60 * 60; 
    var DEBUG_MODE = true;
  
    var frases = [
      "Você está progredindo! Cada esforço de hoje é uma conquista para seu futuro. 😊",
      "Seu potencial é maior do que você imagina. Continue avançando! 😊",
      "Cada página lida é um passo a mais em direção ao seu sonho. 😊",
      "Persistir é transformar pequenas vitórias em grandes conquistas. 😊",
      "O estudo de hoje é a liberdade de escolha de amanhã. 😊",
      "Você não precisa ser perfeito, só precisa continuar. 😊",
      "O conhecimento que você busca hoje será sua força no futuro. 😊",
      "Sua mente é como um músculo: quanto mais você a treina, mais forte ela fica. 😊",
      "O esforço de hoje constrói as oportunidades de amanhã. 😊",
      "Errar é parte do aprendizado, mas desistir nunca será. 😊",
      "Grandes conquistas começam com pequenos hábitos de estudo. 😊",
      "O futuro agradece o aluno dedicado que você escolhe ser hoje. 😊",
      "Aprender é plantar sementes que darão frutos para a vida inteira. 😊",
      "O conhecimento é a única riqueza que ninguém pode tirar de você. 😊",
      "O cansaço passa, mas o orgulho de ter conseguido fica para sempre. 😊",
      "Concentre-se no processo, e o resultado virá como consequência. 😊",
      "Cada desafio vencido mostra que você está mais preparado do que pensa. 😊",
      "Não compare sua jornada, cada aluno tem seu próprio ritmo. 😊",
      "Avançar um pouco todos os dias vale mais do que parar esperando o momento perfeito. 😊",
      "Você é capaz de aprender qualquer coisa, basta acreditar e praticar. 😊",
      "Sua determinação é a chave que abre portas que parecem fechadas. 😊",
      "Quando você estuda, está construindo pontes para seus sonhos. 😊",
      "A disciplina é o caminho mais curto entre você e seu objetivo. 😊",
      "Aprender é investir em si mesmo, e você é seu maior patrimônio. 😊",
      "Lembre-se: você não está começando do zero, mas de onde parou ontem. 😊",
      "Cada dúvida superada é uma vitória sobre o medo de errar. 😊",
      "Não desista: até o passo mais lento ainda é movimento para frente. 😊",
      "Cada dia de estudo é um tijolo no castelo dos seus sonhos. 😊",
      "Estudar é transformar esforço em poder. 😊",
      "Hoje pode ser difícil, mas você já está mais perto da sua vitória. 😊",
      "O conhecimento abre portas que a força jamais conseguiria. 😊",
      "Pequenos avanços diários constroem grandes resultados. 😊",
      "Todo especialista já foi um iniciante que não desistiu. 😊",
      "Estudar é acreditar que o amanhã pode ser melhor. 😊",
      "Seu foco define sua direção, continue firme! 😊",
      "A cada página estudada, um futuro mais claro se desenha. 😊",
      "Estudar é um ato de coragem e amor próprio. 😊",
      "A paciência e a disciplina sempre vencem a pressa. 😊",
      "Nada pode parar um aluno determinado. 😊",
      "Seus sonhos merecem a sua dedicação de hoje. 😊",
      "O esforço pode ser silencioso, mas os resultados serão barulhentos. 😊",
      "Grandes vitórias nascem da persistência em dias comuns. 😊",
      "Não estude para passar, estude para aprender. 😊",
      "Você já percorreu um longo caminho, siga em frente! 😊",
      "A chave do sucesso é começar antes de se sentir pronto. 😊",
      "Você é mais forte que as dificuldades que encontra. 😊",
      "O saber é uma chama que nunca se apaga. 😊",
      "Se você pode imaginar, também pode aprender. 😊",
      "Estudar é plantar hoje para colher amanhã. 😊",
      "O tempo dedicado ao aprendizado nunca é perdido. 😊",
      "A educação é o passaporte para o futuro. 😊",
      "Cada desafio enfrentado é uma prova de que você está evoluindo. 😊",
      "Estudar é transformar curiosidade em poder. 😊",
      "Você tem tudo o que precisa para conquistar o que deseja. 😊",
      "O hábito de estudar hoje é o sucesso de amanhã. 😊",
      "Quem estuda sempre encontra novos caminhos. 😊",
      "Seu esforço é invisível para muitos, mas essencial para você. 😊",
      "Estudar é acreditar no seu próprio crescimento. 😊",
      "Nunca subestime o poder de uma hora bem estudada. 😊",
      "Você está construindo um futuro brilhante, passo a passo. 😊"
    ];
  
    function mostrarFraseMotivacional(userId){
      var box = document.getElementById('kai-motivacional');
      if (!box) {
          console.log("❌ Erro: Caixa da frase não encontrada.");
          return; 
      }
  
      var uid = userId || 'visitante';
      var key = 'kai.motivacional.last.user.'+uid+'.course.'+COURSE_ID;
      var last = parseInt(localStorage.getItem(key)||'0',10);
      var now = Date.now();
      
      // TRAVA DE 2 HORAS (Para teste imediato, coloque // no início da linha abaixo)
      if (now - last < 2 * 60 * 60 * 1000) return;
      
      localStorage.setItem(key, String(now));
  
      var frase = frases[Math.floor(Math.random()*frases.length)];
      console.log("💡 Frase sorteada agora:", frase); 
  
      var div = document.createElement('div');
      div.style.cssText = "margin:10px 0; padding:12px 16px; background:#fff7ed; color:#ea580c; border-left:4px solid #f97316; border-radius:0 8px 8px 0; font-size:14px; font-weight:500; opacity:1; transition:opacity 3s ease-out;";
      div.textContent = "💡 " + frase;
      
      box.innerHTML = '';
      box.appendChild(div);
  
      setTimeout(function(){
        div.style.opacity = "0";
        setTimeout(function(){ if(div.parentNode) div.parentNode.removeChild(div); }, 3000);
      }, 10000);
    }
  
    function apiUrl(fn, params){
      // Previne erro se o token não existir
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
      banner.innerHTML='<span>⏳</span> Olá aluno(a), notei que você não acessa a plataforma há algum tempo. Vamos retomar? — Sou a <b>Sol</b>, sua Tutora 😊';
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
      var left = it.link ? '<a href="'+it.link+'" target="_blank" rel="noopener" style="color: #ea580c; font-weight: 600; text-decoration: none;">'+cleanTitle(it.title)+'</a>'
                         : (it.url  ? '<a href="'+it.url+'" target="_blank" rel="noopener" style="color: #ea580c; font-weight: 600; text-decoration: none;">'+cleanTitle(it.title)+'</a>'
                                    : cleanTitle(it.title));
      return '<div style="margin:8px 0; padding:12px; border-left:4px solid #f97316; background:#fcfcfc; border-radius:0 8px 8px 0; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">'
           +   '<div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
           +     left
           +   '</div>'
           +   '<span style="color:#666;font-size:12px;flex-shrink:0; background: #eee; padding: 4px 8px; border-radius: 4px;">Até '+it.when+'</span>'
           + '</div>';
    }
  
    function loadReminders(){
      // Se o token não estiver carregado, cancela a busca para não dar erro na tela do aluno
      if (!TOKEN) {
          setSub('Erro de configuração: Token da Sol Academy ausente.');
          return;
      }

      var now = Math.floor(Date.now()/1000);
      var in7 = now + WINDOW_DAYS*24*60*60;
  
      var urlAssign   = apiUrl('mod_assign_get_assignments', {'courseids[0]': COURSE_ID});
      var urlCal      = apiUrl('core_calendar_get_calendar_events', {'events[courseids][0]': COURSE_ID, 'options[timestart]': now, 'options[timeend]': in7});
      var urlContents = apiUrl('core_course_get_contents', {courseid: COURSE_ID});
  
      resolveCurrentUser().then(async function(info){
        var userId = info.userid || 0;
  
        var [a, c, contents] = await Promise.all([
          fetch(urlAssign).then(r=>r.json()).catch(()=>({})),
          fetch(urlCal).then(r=>r.json()).catch(()=>({})),
          fetch(urlContents).then(r=>r.json()).catch(()=>([]))
        ]);
  
        var tasks=[], events=[];
        var nameToCmid={};
  
        try{
          (contents||[]).forEach(sec=>{
            (sec.modules||[]).forEach(mod=>{
              if(mod.modname==='assign'){ nameToCmid[norm(mod.name)] = mod.id; }
            });
          });
        }catch(e){}
  
        try{
          var courses = Array.isArray(a.courses) ? a.courses : [];
          var courseBlock = courses.find(cc=>Number(cc.id)===Number(COURSE_ID)) || courses[0];
          var assigns = (courseBlock && Array.isArray(courseBlock.assignments)) ? courseBlock.assignments : [];
          for (var i=0;i<assigns.length;i++){
            var asg = assigns[i], due = parseInt(asg.duedate||0,10);
            if (due >= now && due <= in7){
              tasks.push({
                type:'assign', cmid: asg.cmid||null, url: asg.url||null,
                title: asg.name||'Tarefa', when: fmtDate(due), ts: due,
                link: asg.cmid ? linkEditSubmissionByCmid(asg.cmid)
                               : (asg.url && /\/mod\/assign\//.test(asg.url) ? linkEditSubmissionFromURL(asg.url) : null)
              });
            }
          }
        }catch(e){}
  
        try{
          var evs = (c && c.events) ? c.events : [];
          for (var j=0;j<evs.length;j++){
            var ev = evs[j], ts = parseInt(ev.timestart||0,10);
            if (ts < now || ts > in7) continue;
  
            var title = ev.name || 'Evento';
            var cmid  = Number.isInteger(ev.cmid) ? ev.cmid : guessCmidFromName(title, nameToCmid);
            var link  = ev.url && /\/mod\/assign\//.test(ev.url)
                          ? linkEditSubmissionFromURL(ev.url)
                          : (cmid ? linkEditSubmissionByCmid(cmid)
                                  : ROOT + '/mod/assign/index.php?id=' + COURSE_ID);
  
            events.push({ type:'event', title, when:fmtDate(ts), ts, url: ev.url||null, cmid, link });
          }
        }catch(e){}
  
        tasks  = dedupeByCmid(tasks);
        events = dedupeByCmid(events);

        var taskCmids = new Set(tasks.map(t => resolveCmid(t)).filter(id => id));
        var taskNames = new Set(tasks.map(t => norm(cleanTitle(t.title))));
        
        events = events.filter(function(ev){
            var evCmid = resolveCmid(ev);
            if (evCmid && taskCmids.has(evCmid)) return false;
            if (taskNames.has(norm(cleanTitle(ev.title)))) return false;
            return true;
        });
  
        if (userId){
          try{
            var comp = await fetch(apiUrl('core_completion_get_activities_completion_status', { courseid: COURSE_ID, userid: userId })).then(r=>r.json());
            var completed = new Set((comp.statuses||[]).filter(s=>s && s.state==1 && Number.isInteger(s.cmid)).map(s=>s.cmid));
  
            function hideIfCompletedFactory(){
              return function(it){
                var cmid = resolveCmid(it);
                if (!cmid) return true;
                if (completed.has(cmid)) return false;
                return true;
              };
            }
  
            tasks  = tasks.filter(hideIfCompletedFactory());
            events = events.filter(hideIfCompletedFactory());
          }catch(e){ if (DEBUG_MODE) console.warn('Falha ao ler conclusões', e); }
        }
  
        tasks.sort((x,y)=>x.ts-y.ts);
        events.sort((x,y)=>x.ts-y.ts);
  
        var listTasks  = document.getElementById('kai-tasks');
        var listEvents = document.getElementById('kai-events');
  
        if (!tasks.length && !events.length){
          setSub('Nenhuma pendência para os próximos 7 dias. Ótimo trabalho!');
          listTasks.innerHTML=''; listEvents.innerHTML='';
          mostrarFraseMotivacional(userId);
          return;
        }
  
        var totalPendencias = tasks.length + events.length;
        var textoSub = totalPendencias === 1 ? '1 atividade pendente:' : totalPendencias + ' atividades pendentes:';
        setSub(textoSub);

        mostrarFraseMotivacional(userId);
  
        listTasks.innerHTML  = tasks.length  ? '<h4 style="margin-top:16px; color:#333;">📖 Tarefas</h4>'+tasks.map(renderItem).join('')  : '';
        listEvents.innerHTML = events.length ? '<h4 style="margin-top:16px; color:#333;">📅 Eventos</h4>'+events.map(renderItem).join('') : '';
      })
      .catch(function(err){
        if (DEBUG_MODE) console.error('[DEBUG] Falha no loadReminders', err);
        setSub('Erro ao carregar os lembretes.');
      });
    }
  
    // Inicia tudo
    presenceFlowForCurrentUser();
    loadReminders();
})();