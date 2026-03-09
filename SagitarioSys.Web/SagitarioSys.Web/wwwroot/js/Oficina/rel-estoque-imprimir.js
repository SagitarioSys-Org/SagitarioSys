$(document).ready(function () {
    const token = localStorage.getItem("jwt_token");

    $.ajax({
        url: _url + "api/Oficina/Relatorios/estoque",
        type: "GET",
        headers: { "Authorization": "Bearer " + token },
        success: function (dados) { montarRelatorio(dados); },
        error: function () {
            $("#conteudoFolha").html('<div class="alert alert-danger text-center">Erro ao carregar dados.</div>');
        }
    });
});

function montarRelatorio(dados) {
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

    var totalItens = dados.length;
    var valorCusto = dados.reduce((acc, p) => acc + (p.custo * p.quantidade), 0);
    var valorVenda = dados.reduce((acc, p) => acc + (p.precovenda * p.quantidade), 0);
    var criticos = dados.filter(p => p.quantidade <= p.estoqueminimo).length;

    var itensHtml = "";
    dados.forEach(function (p) {
        var margem = p.custo > 0 ? (((p.precovenda - p.custo) / p.custo) * 100).toFixed(1) : "0.0";
        var critico = p.quantidade <= p.estoqueminimo;
        itensHtml += `
            <tr style="${critico ? 'background:#fff5f5;' : ''}">
                <td>${p.nome}</td>
                <td>${p.sku || '-'}</td>
                <td>${p.fornecedor || '-'}</td>
                <td class="text-right">${formatarMoeda(p.custo)}</td>
                <td class="text-right">${formatarMoeda(p.precovenda)}</td>
                <td class="text-right">${margem}%</td>
                <td class="text-center"><strong>${p.quantidade}</strong></td>
                <td class="text-center">${p.estoqueminimo}</td>
                <td class="text-center"><span class="${critico ? 'badge-critico' : 'badge-normal'}">${critico ? '⚠ Crítico' : '✓ Normal'}</span></td>
            </tr>
        `;
    });

    $("#conteudoFolha").html(`
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
            <div>
                 ${EmpresaNomeLogo}
                <p class="text-muted mb-0">Relatório de Estoque Atualizado</p>
            </div>
            <div class="text-right"><small class="text-muted">Gerado em: ${dataGeracao}</small></div>
        </div>

        <div class="row mb-4">
            <div class="col-3 text-center border-right">
                <div class="font-weight-bold" style="font-size:1.5rem;">${totalItens}</div>
                <small class="text-muted">Total de Itens</small>
            </div>
            <div class="col-3 text-center border-right">
                <div class="font-weight-bold text-primary" style="font-size:1.1rem;">${formatarMoeda(valorCusto)}</div>
                <small class="text-muted">Valor em Custo</small>
            </div>
            <div class="col-3 text-center border-right">
                <div class="font-weight-bold text-success" style="font-size:1.1rem;">${formatarMoeda(valorVenda)}</div>
                <small class="text-muted">Valor em Venda</small>
            </div>
            <div class="col-3 text-center">
                <div class="font-weight-bold text-danger" style="font-size:1.5rem;">${criticos}</div>
                <small class="text-muted">Itens Críticos</small>
            </div>
        </div>

        <div class="section-title">Lista Completa de Peças</div>
        <table class="table table-sm table-bordered" style="font-size:0.82rem;">
            <thead class="thead-dark">
                <tr>
                    <th>Nome</th>
                    <th>SKU</th>
                    <th>Fornecedor</th>
                    <th class="text-right">Custo</th>
                    <th class="text-right">Venda</th>
                    <th class="text-right">Margem</th>
                    <th class="text-center">Qtd</th>
                    <th class="text-center">Mín.</th>
                    <th class="text-center">Situação</th>
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
