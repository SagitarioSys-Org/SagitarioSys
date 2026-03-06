let dadosVendas = [];
let graficoVendas = null;

$(document).ready(function () {
    // Define o mês atual como default
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    $("#dtInicio").val(formatarDataInput(primeiroDia));
    $("#dtFim").val(formatarDataInput(ultimoDia));

    // Carrega automaticamente ao abrir
    carregarVendas();
});

function formatarDataInput(data) {
    return data.toISOString().split('T')[0];
}

function carregarVendas() {
    var dtInicio = $("#dtInicio").val();
    var dtFim = $("#dtFim").val();

    if (!dtInicio || !dtFim) {
        Swal.fire('Atenção', 'Selecione as datas de início e fim.', 'warning');
        return;
    }

    var $btn = $("#btnFiltrar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Carregando...');

    // Passa as datas para a página de impressão via link
    $("#btnImprimir").attr("href", `/Oficina/Relatorios/ImprimirVendas?dtInicio=${dtInicio}&dtFim=${dtFim}`);

    $.ajax({
        url: `${_url}api/Relatorios/vendas?dataInicio=${dtInicio}&dataFim=${dtFim}`,
        type: "GET",
        success: function (dados) {
            dadosVendas = dados;
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
    var total = dados.length;
    var faturamento = dados.reduce((acc, os) => acc + os.valortotal, 0);
    var ticket = total > 0 ? faturamento / total : 0;
    var maior = total > 0 ? Math.max(...dados.map(os => os.valortotal)) : 0;

    $("#kpiTotal").text(total);
    $("#kpiFaturamento").text(formatarMoeda(faturamento));
    $("#kpiTicket").text(formatarMoeda(ticket));
    $("#kpiMaior").text(formatarMoeda(maior));
}

function montarTabela(dados) {
    if (!dados || dados.length === 0) {
        $("#tbVendas tbody").html('<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma OS faturada no período.</td></tr>');
        return;
    }

    var html = "";
    dados.forEach(function (os) {
        var dataPgto = os.datapagamento ? new Date(os.datapagamento).toLocaleDateString('pt-BR') : '-';
        var numeroFormatado = String(os.numeroos).padStart(4, '0');

        html += `
            <tr>
                <td class="pl-4 font-weight-bold" style="font-family:'JetBrains Mono';">OS #${numeroFormatado}</td>
                <td>${dataPgto}</td>
                <td>${os.nomecliente}</td>
                <td><span class="plate-badge">${os.placa}</span> ${os.marca} ${os.modelo}</td>
                <td><span class="badge badge-light border">${os.formapagamento || '-'}</span></td>
                <td class="text-right pr-4 font-weight-bold text-success">${formatarMoeda(os.valortotal)}</td>
            </tr>
        `;
    });

    $("#tbVendas tbody").html(html);
}

function montarGrafico(dados) {
    // Agrupa por dia
    const porDia = {};
    dados.forEach(function (os) {
        if (!os.datapagamento) return;
        const dia = new Date(os.datapagamento).toLocaleDateString('pt-BR');
        porDia[dia] = (porDia[dia] || 0) + os.valortotal;
    });

    const labels = Object.keys(porDia);
    const valores = Object.values(porDia);

    if (graficoVendas) graficoVendas.destroy();

    graficoVendas = new Chart(document.getElementById("graficoVendas"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Faturamento (R$)",
                data: valores,
                backgroundColor: "rgba(16, 185, 129, 0.7)",
                borderColor: "rgba(16, 185, 129, 1)",
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: val => 'R$ ' + val.toLocaleString('pt-BR')
                    }
                }
            }
        }
    });
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
