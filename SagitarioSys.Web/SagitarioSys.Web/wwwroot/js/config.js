// ==========================================
// 🌍 CONFIGURAÇÃO GLOBAL DE AMBIENTE
// ==========================================
// Troque para "PROD" quando for publicar o sistema no servidor oficial!
const AMBIENTE_ATUAL = "DEV";

function GetUrl() {
    if (AMBIENTE_ATUAL === "DEV") {
        return "https://localhost:44373/";
    } else {
        return "https://api.sagitariosys.com.br/";
    }
}

const _url = GetUrl();