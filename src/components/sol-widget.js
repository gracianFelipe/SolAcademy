/**
 * ARQUIVO: sol-widget.js
 * DESCRIÇÃO: Componente de visualização (HTML Template) para o modal da Sol Academy.
 */
if (typeof window !== 'undefined') {
    window.SOL_TEMPLATES = window.SOL_TEMPLATES || {};
    window.SOL_TEMPLATES.solOverlay = function(chatUrl) {
        return `
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
                    <iframe id="widget-iframe" style="border: 1px solid #e2e8f0; width: 100%; height: 600px; min-height: 60vh; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.04);" src="${chatUrl}"></iframe>
                </div>
            </div>
        </div>
        `;
    };
}
