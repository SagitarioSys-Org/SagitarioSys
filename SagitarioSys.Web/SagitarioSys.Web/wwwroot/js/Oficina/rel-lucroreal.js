let graficoLucro = null;

$(document).ready(function () {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    $("#dtInicio").val(primeiroDia.toISOString().split('T')[0]);
    $("#dtFim").val(ultimoDia.toISOString().split('T')[0]);

    carregarLucro();
});

function carregarLucro() {
    var dtInicio = $("#dtInicio").val();
    var dtFim = $("#dtFim").val();

    if (!dtInicio || !dtFim) {
        Swal.fire('Atenção', 'Selecione as datas.', 'warning');
        return;
    }

    var $btn = $("#btnFiltrar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Calculando...');

    $("#btnImprimir").attr("href", `/Oficina/Relatorios/ImprimirLucroReal?dtInicio=${dtInicio}&dtFim=${dtFim}`);

    $.ajax({
        url: `${_url}api/Relatorios/lucrorial?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        success: function (data) {
            montarKpis(data);
            montarTabelaDespesas(data.despesas);
            montarGrafico(data.porDia);
        },
        error: function () {
            Swal.fire('Erro', 'Não foi possível calcular o lucro.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-search mr-2"></i> Calcular');
        }
    });
}

function montarKpis(data) {
    $("#kpiFaturamento").text(formatarMoeda(data.faturamento));
    $("#kpiCustoPecas").text("- " + formatarMoeda(data.custoPecas));
    $("#kpiDespesas").text("- " + formatarMoeda(data.totalDespesas));
    $("#kpiLucro").text(formatarMoeda(data.lucroReal));
    $("#kpiMargem").text(`Margem: ${data.margemLucro}%`);

    // Cor do card de lucro conforme resultado
    var cor = data.lucroReal >= 0 ? '#10b981' : '#ef4444';
    $("#kpiLucro").css("color", cor);
    $("#cardLucro").css("border-color", cor);
}

function montarTabelaDespesas(despesas) {
    if (!despesas || despesas.length === 0) {
        $("#tbDespesas tbody").html('<tr><td colspan="5" class="text-center py-4 text-muted">Nenhuma despesa registrada no período.</td></tr>');
        return;
    }

    var html = "";
    despesas.forEach(function (d) {
        var data = d.datapagamento ? new Date(d.datapagamento).toLocaleDateString('pt-BR') : '-';
        html += `
            <tr>
                <td class="pl-4">${data}</td>
                <td><span class="badge badge-light border">${d.categoria || '-'}</span></td>
                <td>${d.descricao || '-'}</td>
                <td>${d.formapagamento || '-'}</td>
                <td class="text-right pr-4 font-weight-bold text-danger">${formatarMoeda(d.valor)}</td>
            </tr>
        `;
    });

    $("#tbDespesas tbody").html(html);
}

function montarGrafico(porDia) {
    if (graficoLucro) graficoLucro.destroy();

    if (!porDia || porDia.length === 0) return;

    graficoLucro = new Chart(document.getElementById("graficoLucro"), {
        type: "line",
        data: {
            labels: porDia.map(d => new Date(d.dia).toLocaleDateString('pt-BR')),
            datasets: [{
                label: "Faturamento",
                data: porDia.map(d => d.faturamento),
                borderColor: "rgba(16, 185, 129, 1)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: "rgba(16, 185, 129, 1)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: val => 'R$ ' + val.toLocaleString('pt-BR') }
                }
            }
        }
    });
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
