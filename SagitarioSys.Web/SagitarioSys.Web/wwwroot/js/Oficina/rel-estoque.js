let dadosEstoque = [];

$(document).ready(function () {
    carregarEstoque();
    $("#txtFiltro").on("keyup", filtrarTabela);
});

function carregarEstoque() {
    $.ajax({
        url: _url + "api/Relatorios/estoque",
        type: "GET",
        success: function (dados) {
            dadosEstoque = dados;
            montarKpis(dados);
            montarTabela(dados);
            montarGraficoBarras(dados);
            montarGraficoPizza(dados);

        },
        error: function () {
            Swal.fire('Erro', 'Não foi possível carregar o estoque.', 'error');
        }
    });
}

function montarKpis(dados) {
    var totalItens = dados.length;
    var valorCusto = dados.reduce((acc, p) => acc + (p.custo * p.quantidade), 0);
    var valorVenda = dados.reduce((acc, p) => acc + (p.precovenda * p.quantidade), 0);
    var criticos = dados.filter(p => p.quantidade <= p.estoqueminimo).length;

    $("#kpiTotalItens").text(totalItens);
    $("#kpiValorCusto").text(formatarMoeda(valorCusto));
    $("#kpiValorVenda").text(formatarMoeda(valorVenda));
    $("#kpiEstoqueCritico").text(criticos);

    if (criticos > 0) {
        $("#kpiEstoqueCritico").closest(".glass-card").css("border", "2px solid #dc3545");
    }
}

function montarTabela(dados) {
    if (!dados || dados.length === 0) {
        $("#tbEstoque tbody").html('<tr><td colspan="9" class="text-center py-4 text-muted">Nenhuma peça cadastrada.</td></tr>');
        return;
    }

    var html = "";
    dados.forEach(function (p) {
        var margem = p.custo > 0 ? (((p.precovenda - p.custo) / p.custo) * 100).toFixed(1) : 0;
        var critico = p.quantidade <= p.estoqueminimo;
        var badge = critico
            ? '<span class="badge badge-danger px-2 py-1">⚠ Crítico</span>'
            : '<span class="badge badge-success px-2 py-1">Normal</span>';

        html += `
            <tr style="${critico ? 'background-color: #fff5f5;' : ''}">
                <td class="pl-4 font-weight-bold">${p.nome}</td>
                <td class="text-muted">${p.sku || '-'}</td>
                <td class="text-muted">${p.fornecedor || '-'}</td>
                <td class="text-right">${formatarMoeda(p.custo)}</td>
                <td class="text-right text-success font-weight-bold">${formatarMoeda(p.precovenda)}</td>
                <td class="text-right">${margem}%</td>
                <td class="text-center font-weight-bold ${critico ? 'text-danger' : ''}">${p.quantidade}</td>
                <td class="text-center text-muted">${p.estoqueminimo}</td>
                <td class="text-center">${badge}</td>
            </tr>
        `;
    });

    $("#tbEstoque tbody").html(html);
}

function montarGraficoBarras(dados) {
    var top10 = [...dados].sort((a, b) => b.quantidade - a.quantidade).slice(0, 10);

    new Chart(document.getElementById("graficoEstoque"), {
        type: "bar",
        data: {
            labels: top10.map(p => p.nome.length > 20 ? p.nome.substring(0, 20) + '...' : p.nome),
            datasets: [{
                label: "Quantidade em Estoque",
                data: top10.map(p => p.quantidade),
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
            scales: { y: { beginAtZero: true } }
        }
    });
}

function montarGraficoPizza(dados) {
    var normais = dados.filter(p => p.quantidade > p.estoqueminimo).length;
    var criticos = dados.filter(p => p.quantidade > 0 && p.quantidade <= p.estoqueminimo).length;
    var zerados = dados.filter(p => p.quantidade <= 0).length;

    new Chart(document.getElementById("graficoPizza"), {
        type: "doughnut",
        data: {
            labels: ["Normal", "Estoque Crítico", "Zerado"],
            datasets: [{
                data: [normais, criticos, zerados],
                backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

function filtrarTabela() {
    var termo = $("#txtFiltro").val().toLowerCase();
    var filtrado = dadosEstoque.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        (p.sku && p.sku.toLowerCase().includes(termo))
    );
    montarTabela(filtrado);
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
