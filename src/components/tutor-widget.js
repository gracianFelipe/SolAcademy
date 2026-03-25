/**
 * ARQUIVO: tutor-widget.js
 * DESCRIÇÃO: Componente de visualização (HTML Template) para o modal do Tutor.
 */
if (typeof window !== 'undefined') {
    window.SOL_TEMPLATES = window.SOL_TEMPLATES || {};
    window.SOL_TEMPLATES.tutorOverlay = function() {
        return `
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
    };
}
