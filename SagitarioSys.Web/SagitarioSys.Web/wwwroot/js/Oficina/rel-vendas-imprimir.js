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
        url: `${_url}api/Oficina/Relatorios/vendas?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (dados) {
            montarRelatorio(dados, dtInicio, dtFim);
        },
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
    const periodoFormatado = `${new Date(dtInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(dtFim + 'T00:00:00').toLocaleDateString('pt-BR')}`;

    var total = dados.length;
    var faturamento = dados.reduce((acc, os) => acc + os.valortotal, 0);
    var ticket = total > 0 ? faturamento / total : 0;

    var itensHtml = "";
    dados.forEach(function (os) {
        var dataPgto = os.datapagamento ? new Date(os.datapagamento).toLocaleDateString('pt-BR') : '-';
        var numero = String(os.numeroos).padStart(4, '0');
        itensHtml += `
            <tr>
                <td><strong>OS #${numero}</strong></td>
                <td>${dataPgto}</td>
                <td>${os.nomecliente}</td>
                <td>${os.placa} - ${os.marca} ${os.modelo}</td>
                <td>${os.formapagamento || '-'}</td>
                <td class="text-right"><strong>R$ ${os.valortotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
            </tr>
        `;
    });

    var html = `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
            <div>
                ${EmpresaNomeLogo}
                <p class="text-muted mb-0">Relatório de Vendas por Período</p>
                <small class="text-muted">Período: <strong>${periodoFormatado}</strong></small>
            </div>
            <div class="text-right">
                <small class="text-muted">Gerado em: ${dataGeracao}</small>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-4 text-center border-right">
                <div class="font-weight-bold" style="font-size:1.5rem;">${total}</div>
                <small class="text-muted">OS Faturadas</small>
            </div>
            <div class="col-4 text-center border-right">
                <div class="font-weight-bold text-success" style="font-size:1.2rem;">${formatarMoeda(faturamento)}</div>
                <small class="text-muted">Faturamento Total</small>
            </div>
            <div class="col-4 text-center">
                <div class="font-weight-bold text-primary" style="font-size:1.2rem;">${formatarMoeda(ticket)}</div>
                <small class="text-muted">Ticket Médio</small>
            </div>
        </div>

        <div class="section-title">Detalhamento das OS Faturadas</div>
        <table class="table table-sm table-bordered" style="font-size:0.82rem;">
            <thead class="thead-dark">
                <tr>
                    <th>Nº OS</th>
                    <th>Data Pgto.</th>
                    <th>Cliente</th>
                    <th>Veículo</th>
                    <th>Forma Pgto.</th>
                    <th class="text-right">Valor</th>
                </tr>
            </thead>
            <tbody>${itensHtml}</tbody>
            <tfoot>
                <tr style="background:#f8f9fa;">
                    <td colspan="5" class="text-right font-weight-bold">TOTAL</td>
                    <td class="text-right font-weight-bold text-success">${formatarMoeda(faturamento)}</td>
                </tr>
            </tfoot>
        </table>

        <div class="text-center text-muted mt-4" style="font-size:0.75rem;">
            Documento gerado pelo sistema SagitarioSys em ${dataGeracao}.
        </div>
    `;

    $("#conteudoFolha").html(html);
}

function imprimir() {
    $("#divBotoes").hide();
    setTimeout(function () {
        window.print();
        $("#divBotoes").show();
    }, 300);
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
