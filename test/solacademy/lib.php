<?php
/**
 * ARQUIVO: lib.php (Plugin Local Sol Academy)
 * DESCRIÇÃO: Código principal do plugin local do Moodle para a extensão Sol Academy.
 * Através dos "hooks" do Moodle (como o template "before_footer" ou equivalentes), este arquivo
 * injeta na página do usuário as variáveis PHP (como Nome e ID real do aluno, via $USER).
 * Além disso, invoca a criação dinâmica de tags <script> na página, carregando todo
 * o ecossistema (rotas, frases e script central) diretamente pelo repositório GitHub da Sol.
 */
defined('MOODLE_INTERNAL') || die();

function local_solacademy_before_footer()
{
    global $USER;
    $user_id = isset($USER->id) ? $USER->id : 0;
    // Opcionalmente usando as propriedades diretas se o seu editor não reconhece fullname()
    $user_fullname = (isset($USER->id) && $USER->id > 0) ? trim($USER->firstname . ' ' . $USER->lastname) : 'Aluno Moodle';

    // Esse é o SEU código exato que puxa as coisas do GitHub!
    $script = '<script>
    window.SOL_CONFIG = {
        TOKEN: "172f53a7717fe262495ba22c1b06cbad",
        USER_ID: ' . json_encode($user_id) . ',
        USER_NAME: ' . json_encode($user_fullname) . ',
        SUPABASE_URL: "https://qsvfivwnptsqhnmrobbq.supabase.co",
        SUPABASE_KEY: "sb_publishable_zY0h5oUdc6KalFRM_YkiuQ__LItxgLk"
    };

    (function() {
        var carimboTempo = new Date().getTime(); 
        var GITHUB_URL = "https://raw.githack.com/gracianFelipe/SolAcademy/main"; 
        
        var scripts = [
            "/sol-cursos.js",
            "/sol-frases.js",
            "/src/components/sol-widget.js",
            "/src/components/tutor-widget.js",
            "/sol-script.js"
        ];
        
        var i = 0;
        function loadNext() {
            if (i >= scripts.length) return;
            var s = document.createElement("script");
            s.src = GITHUB_URL + scripts[i] + "?nocache=" + carimboTempo;
            s.onload = loadNext;
            document.body.appendChild(s);
            i++;
        }
        loadNext();
    })();
    </script>';

    echo $script;
}