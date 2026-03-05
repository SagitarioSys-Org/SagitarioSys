const AMBIENTE_ATUAL = "DEV";
function GetUrl() {
    if (AMBIENTE_ATUAL === "DEV") {
        return "https://localhost:44373/";
    } else {
        return "https://api.sagitariosys.com.br/";
    }
}
const _url = GetUrl();
