let graficoServicos = null;

$(document).ready(function () {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    $("#dtInicio").val(formatarDataInput(primeiroDia));
    $("#dtFim").val(formatarDataInput(ultimoDia));

    carregarServicos();
});

function formatarDataInput(data) {
    return data.toISOString().split('T')[0];
}

function carregarServicos() {
    var dtInicio = $("#dtInicio").val();
    var dtFim = $("#dtFim").val();

    if (!dtInicio || !dtFim) {
        Swal.fire('Atenção', 'Selecione as datas.', 'warning');
        return;
    }

    var $btn = $("#btnFiltrar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Carregando...');

    $("#btnImprimir").attr("href", `/Oficina/Relatorios/ImprimirServicos?dtInicio=${dtInicio}&dtFim=${dtFim}`);

    $.ajax({
        url: `${_url}api/Relatorios/servicos?dataInicio=${dtInicio}&dataFim=${dtFim}`,
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
    var totalExecucoes = dados.reduce((acc, s) => acc + s.totalvezes, 0);
    var totalFaturado = dados.reduce((acc, s) => acc + s.totalfaturado, 0);

    $("#kpiTipos").text(totalTipos);
    $("#kpiExecucoes").text(totalExecucoes);
    $("#kpiFaturado").text(formatarMoeda(totalFaturado));
}

function montarTabela(dados) {
    if (!dados || dados.length === 0) {
        $("#tbServicos tbody").html('<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum serviço encontrado no período.</td></tr>');
        return;
    }

    var html = "";
    dados.forEach(function (s, i) {
        var medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
        html += `
            <tr>
                <td class="pl-4 font-weight-bold text-center">${medalha}</td>
                <td class="font-weight-bold">${s.descricao}</td>
                <td class="text-center">
                    <span class="badge badge-primary px-2 py-1" style="font-size:0.85rem;">${s.totalvezes}x</span>
                </td>
                <td class="text-center">${s.totalquantidade}</td>
                <td class="text-right">${formatarMoeda(s.valormediounitario)}</td>
                <td class="text-right pr-4 font-weight-bold text-success">${formatarMoeda(s.totalfaturado)}</td>
            </tr>
        `;
    });

    $("#tbServicos tbody").html(html);
}

function montarGrafico(dados) {
    var top10 = dados.slice(0, 10);

    if (graficoServicos) graficoServicos.destroy();

    graficoServicos = new Chart(document.getElementById("graficoServicos"), {
        type: "bar",
        data: {
            labels: top10.map(s => s.descricao.length > 25 ? s.descricao.substring(0, 25) + '...' : s.descricao),
            datasets: [{
                label: "Nº de Execuções",
                data: top10.map(s => s.totalvezes),
                backgroundColor: "rgba(99, 102, 241, 0.7)",
                borderColor: "rgba(99, 102, 241, 1)",
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
