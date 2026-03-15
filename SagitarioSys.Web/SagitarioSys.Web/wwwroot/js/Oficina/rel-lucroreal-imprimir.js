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
        url: `${_url}api/Oficina/Relatorios/lucrorial?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (data) { montarRelatorio(data, dtInicio, dtFim); },
        error: function () {
            $("#conteudoFolha").html('<div class="alert alert-danger text-center">Erro ao carregar dados.</div>');
        }
    });
});

function montarRelatorio(data, dtInicio, dtFim) {
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

    var despesasHtml = "";
    if (data.despesas && data.despesas.length > 0) {
        data.despesas.forEach(function (d) {
            var dt = d.datapagamento ? new Date(d.datapagamento).toLocaleDateString('pt-BR') : '-';
            despesasHtml += `
                <tr>
                    <td>${dt}</td>
                    <td>${d.categoria || '-'}</td>
                    <td>${d.descricao || '-'}</td>
                    <td>${d.formapagamento || '-'}</td>
                    <td class="text-right text-danger"><strong>${formatarMoeda(d.valor)}</strong></td>
                </tr>
            `;
        });
    } else {
        despesasHtml = '<tr><td colspan="5" class="text-center text-muted">Nenhuma despesa no período.</td></tr>';
    }

    var corLucro = data.lucroReal >= 0 ? '#28a745' : '#dc3545';

    $("#conteudoFolha").html(`
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
            <div>
                ${EmpresaNomeLogo}
                <p class="text-muted mb-0">Demonstrativo de Lucro Real</p>
                <small class="text-muted">Período: <strong>${periodo}</strong></small>
            </div>
            <div class="text-right"><small class="text-muted">Gerado em: ${dataGeracao}</small></div>
        </div>

        <div class="row mb-4">
            <div class="col-8">
                <table class="table table-sm table-bordered mb-0">
                    <tbody>
                        <tr class="table-primary">
                            <td class="font-weight-bold">✚ Faturamento Bruto (OS Faturadas)</td>
                            <td class="text-right font-weight-bold">${formatarMoeda(data.faturamento)}</td>
                        </tr>
                        <tr class="table-danger">
                            <td>✖ Custo das Peças Utilizadas</td>
                            <td class="text-right text-danger">- ${formatarMoeda(data.custoPecas)}</td>
                        </tr>
                        <tr class="table-danger">
                            <td>✖ Total de Despesas</td>
                            <td class="text-right text-danger">- ${formatarMoeda(data.totalDespesas)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="col-4">
                <div class="lucro-box" style="border-color: ${corLucro};">
                    <div class="text-muted" style="font-size:0.8rem; text-transform:uppercase;">Lucro Real</div>
                    <div class="font-weight-bold" style="font-size:1.8rem; color:${corLucro};">${formatarMoeda(data.lucroReal)}</div>
                    <div class="text-muted" style="font-size:0.85rem;">Margem: ${data.margemLucro}%</div>
                </div>
            </div>
        </div>

        <div class="section-title">Despesas Detalhadas</div>
        <table class="table table-sm table-bordered" style="font-size:0.82rem;">
            <thead class="thead-dark">
                <tr>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Forma Pgto.</th>
                    <th class="text-right">Valor</th>
                </tr>
            </thead>
            <tbody>${despesasHtml}</tbody>
            <tfoot>
                <tr style="background:#fff5f5; font-weight:bold;">
                    <td colspan="4" class="text-right">TOTAL DESPESAS</td>
                    <td class="text-right text-danger">${formatarMoeda(data.totalDespesas)}</td>
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
