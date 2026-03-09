$(document).ready(function () {
    const token = localStorage.getItem("jwt_token");
    const params = new URLSearchParams(window.location.search);
    const dtInicio = params.get("dtInicio");
    const dtFim = params.get("dtFim");

    if (!dtInicio || !dtFim) {
        $("#conteudoFolha").html('<div class="alert alert-warning text-center">Período não informado.</div>');
        return;
    }

    $.ajax({
        url: `${_url}api/Oficina/Relatorios/servicos?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (dados) { montarRelatorio(dados, dtInicio, dtFim); },
        error: function () {
            $("#conteudoFolha").html('<div class="alert alert-danger text-center">Erro ao carregar dados.</div>');
        }
    });
});

function montarRelatorio(dados, dtInicio, dtFim) {
    const nomeEmpresa = localStorage.getItem("user_empresa") || "SagitarioSys";

    var UrlSemBarraNoFinal = _url.slice(0, -1);
    var logo = UrlSemBarraNoFinal + localStorage.getItem("empresa_logo");

    var EmpresaNomeLogo = "";

    if (logo) {
        EmpresaNomeLogo = `<img id="imgLogoRel" src="${logo}" style="max-height: 120px; object-fit: contain;">`;
    }
    else {
        EmpresaNomeLogo = `<h3 class="font-weight-bold mb-0">${nomeEmpresa}</h3>`;
    }

    const dataGeracao = new Date().toLocaleString('pt-BR');
    const periodo = `${new Date(dtInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(dtFim + 'T00:00:00').toLocaleDateString('pt-BR')}`;

    var totalFaturado = dados.reduce((acc, s) => acc + s.totalfaturado, 0);
    var totalExecucoes = dados.reduce((acc, s) => acc + s.totalvezes, 0);

    var itensHtml = "";
    dados.forEach(function (s, i) {
        itensHtml += `
            <tr>
                <td class="text-center font-weight-bold">${i + 1}º</td>
                <td>${s.descricao}</td>
                <td class="text-center">${s.totalvezes}x</td>
                <td class="text-center">${s.totalquantidade}</td>
                <td class="text-right">${formatarMoeda(s.valormediounitario)}</td>
                <td class="text-right"><strong>${formatarMoeda(s.totalfaturado)}</strong></td>
            </tr>
        `;
    });

    $("#conteudoFolha").html(`
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
            <div>
                ${EmpresaNomeLogo}
                <p class="text-muted mb-0">Ranking de Serviços Mais Realizados</p>
                <small class="text-muted">Período: <strong>${periodo}</strong></small>
            </div>
            <div class="text-right"><small class="text-muted">Gerado em: ${dataGeracao}</small></div>
        </div>

        <div class="row mb-4">
            <div class="col-4 text-center border-right">
                <div class="font-weight-bold" style="font-size:1.5rem;">${dados.length}</div>
                <small class="text-muted">Tipos de Serviço</small>
            </div>
            <div class="col-4 text-center border-right">
                <div class="font-weight-bold text-primary" style="font-size:1.5rem;">${totalExecucoes}</div>
                <small class="text-muted">Total de Execuções</small>
            </div>
            <div class="col-4 text-center">
                <div class="font-weight-bold text-success" style="font-size:1.2rem;">${formatarMoeda(totalFaturado)}</div>
                <small class="text-muted">Total Faturado</small>
            </div>
        </div>

        <div class="section-title">Ranking de Serviços</div>
        <table class="table table-sm table-bordered" style="font-size:0.82rem;">
            <thead class="thead-dark">
                <tr>
                    <th class="text-center">#</th>
                    <th>Serviço</th>
                    <th class="text-center">Execuções</th>
                    <th class="text-center">Qtd Total</th>
                    <th class="text-right">Valor Médio</th>
                    <th class="text-right">Total Faturado</th>
                </tr>
            </thead>
            <tbody>${itensHtml}</tbody>
        </table>

        <div class="text-center text-muted mt-4" style="font-size:0.75rem;">
            Documento gerado pelo sistema SagitarioSys em ${dataGeracao}.
        </div>
    `);
}

function imprimir() {
    $("#divBotoes").hide();
    setTimeout(function () { window.print(); $("#divBotoes").show(); }, 300);
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
