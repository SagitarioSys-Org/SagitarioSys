let graficoPecas = null;

$(document).ready(function () {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    $("#dtInicio").val(primeiroDia.toISOString().split('T')[0]);
    $("#dtFim").val(ultimoDia.toISOString().split('T')[0]);

    carregarPecas();
});

function carregarPecas() {
    var dtInicio = $("#dtInicio").val();
    var dtFim = $("#dtFim").val();

    if (!dtInicio || !dtFim) {
        Swal.fire('Atenção', 'Selecione as datas.', 'warning');
        return;
    }

    var $btn = $("#btnFiltrar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Carregando...');

    $("#btnImprimir").attr("href", `/Oficina/Relatorios/ImprimirPecas?dtInicio=${dtInicio}&dtFim=${dtFim}`);

    $.ajax({
        url: `${_url}api/Oficina/Relatorios/pecas?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        success: function (dados) {
            montarKpis(dados);
            montarTabela(dados);
            montarGrafico(dados);
        },
        error: function () {
            Swal.fire('Erro', 'Não foi possível carregar os dados.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-search mr-2"></i> Filtrar');
        }
    });
}

function montarKpis(dados) {
    var totalTipos = dados.length;
    var totalUnidades = dados.reduce((acc, p) => acc + p.totalquantidade, 0);
    var totalFaturado = dados.reduce((acc, p) => acc + p.totalfaturado, 0);
    var totalCusto = dados.reduce((acc, p) => acc + p.totalcusto, 0);
    var lucro = totalFaturado - totalCusto;

    $("#kpiTipos").text(totalTipos);
    $("#kpiUnidades").text(totalUnidades);
    $("#kpiFaturado").text(formatarMoeda(totalFaturado));
    $("#kpiLucro").text(formatarMoeda(lucro));
}

function montarTabela(dados) {
    if (!dados || dados.length === 0) {
        $("#tbPecas tbody").html('<tr><td colspan="8" class="text-center py-4 text-muted">Nenhuma peça encontrada no período.</td></tr>');
        return;
    }

    var html = "";
    dados.forEach(function (p, i) {
        var lucro = p.totalfaturado - p.totalcusto;
        var medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;

        html += `
            <tr>
                <td class="pl-4 text-center font-weight-bold">${medalha}</td>
                <td class="font-weight-bold">${p.descricao}</td>
                <td class="text-center">
                    <span class="badge badge-warning px-2 py-1" style="font-size:0.85rem;">${p.totalquantidade} un.</span>
                </td>
                <td class="text-right text-muted">${formatarMoeda(p.custo)}</td>
                <td class="text-right">${formatarMoeda(p.valormediounitario)}</td>
                <td class="text-right text-danger">${formatarMoeda(p.totalcusto)}</td>
                <td class="text-right text-success font-weight-bold">${formatarMoeda(p.totalfaturado)}</td>
                <td class="text-right pr-4 font-weight-bold" style="color: ${lucro >= 0 ? '#10b981' : '#ef4444'}">
                    ${formatarMoeda(lucro)}
                </td>
            </tr>
        `;
    });

    $("#tbPecas tbody").html(html);
}

function montarGrafico(dados) {
    var top10 = dados.slice(0, 10);

    if (graficoPecas) graficoPecas.destroy();

    graficoPecas = new Chart(document.getElementById("graficoPecas"), {
        type: "bar",
        data: {
            labels: top10.map(p => p.descricao.length > 25 ? p.descricao.substring(0, 25) + '...' : p.descricao),
            datasets: [{
                label: "Qtd Vendida",
                data: top10.map(p => p.totalquantidade),
                backgroundColor: "rgba(245, 158, 11, 0.7)",
                borderColor: "rgba(245, 158, 11, 1)",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
