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
        url: `${_url}api/Relatorios/pecas?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (dados) { montarRelatorio(dados, dtInicio, dtFim); },
        error: function () {
            $("#conteudoFolha").html('<div class="alert alert-danger text-center">Erro ao carregar dados.</div>');
        }
    });
});

function montarRelatorio(dados, dtInicio, dtFim) {
    const nomeEmpresa = localStorage.getItem("user_nome") || "SagitarioSys";
    const dataGeracao = new Date().toLocaleString('pt-BR');
    const periodo = `${new Date(dtInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(dtFim + 'T00:00:00').toLocaleDateString('pt-BR')}`;

    var totalFaturado = dados.reduce((acc, p) => acc + p.totalfaturado, 0);
    var totalCusto = dados.reduce((acc, p) => acc + p.totalcusto, 0);
    var totalLucro = totalFaturado - totalCusto;
    var totalUnidades = dados.reduce((acc, p) => acc + p.totalquantidade, 0);

    var itensHtml = "";
    dados.forEach(function (p, i) {
        var lucro = p.totalfaturado - p.totalcusto;
        itensHtml += `
            <tr>
                <td class="text-center">${i + 1}º</td>
                <td>${p.descricao}</td>
                <td class="text-center">${p.totalquantidade} un.</td>
                <td class="text-right">${formatarMoeda(p.custo)}</td>
                <td class="text-right">${formatarMoeda(p.valormediounitario)}</td>
                <td class="text-right">${formatarMoeda(p.totalcusto)}</td>
                <td class="text-right"><strong>${formatarMoeda(p.totalfaturado)}</strong></td>
                <td class="text-right" style="color:${lucro >= 0 ? '#28a745' : '#dc3545'}"><strong>${formatarMoeda(lucro)}</strong></td>
            </tr>
        `;
    });

    $("#conteudoFolha").html(`
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
            <div>
                <h3 class="font-weight-bold mb-0">${nomeEmpresa}</h3>
                <p class="text-muted mb-0">Relatório de Peças Mais Vendidas</p>
                <small class="text-muted">Período: <strong>${periodo}</strong></small>
            </div>
            <div class="text-right"><small class="text-muted">Gerado em: ${dataGeracao}</small></div>
        </div>

        <div class="row mb-4">
            <div class="col-3 text-center border-right">
                <div class="font-weight-bold" style="font-size:1.5rem;">${totalUnidades}</div>
                <small class="text-muted">Unidades Vendidas</small>
            </div>
            <div class="col-3 text-center border-right">
                <div class="font-weight-bold text-danger" style="font-size:1.1rem;">${formatarMoeda(totalCusto)}</div>
                <small class="text-muted">Total em Custo</small>
            </div>
            <div class="col-3 text-center border-right">
                <div class="font-weight-bold text-success" style="font-size:1.1rem;">${formatarMoeda(totalFaturado)}</div>
                <small class="text-muted">Total Faturado</small>
            </div>
            <div class="col-3 text-center">
                <div class="font-weight-bold" style="font-size:1.1rem; color:#f59e0b;">${formatarMoeda(totalLucro)}</div>
                <small class="text-muted">Lucro em Peças</small>
            </div>
        </div>

        <div class="section-title">Ranking de Peças</div>
        <table class="table table-sm table-bordered" style="font-size:0.78rem;">
            <thead class="thead-dark">
                <tr>
                    <th class="text-center">#</th>
                    <th>Peça</th>
                    <th class="text-center">Qtd</th>
                    <th class="text-right">Custo Un.</th>
                    <th class="text-right">Preço Médio</th>
                    <th class="text-right">Total Custo</th>
                    <th class="text-right">Total Faturado</th>
                    <th class="text-right">Lucro</th>
                </tr>
            </thead>
            <tbody>${itensHtml}</tbody>
            <tfoot>
                <tr style="background:#f8f9fa; font-weight:bold;">
                    <td colspan="5" class="text-right">TOTAL</td>
                    <td class="text-right text-danger">${formatarMoeda(totalCusto)}</td>
                    <td class="text-right text-success">${formatarMoeda(totalFaturado)}</td>
                    <td class="text-right" style="color:#f59e0b;">${formatarMoeda(totalLucro)}</td>
                </tr>
            </tfoot>
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
