let listaPecas = [];

$(document).ready(function () {
    carregarPecas();

    // Filtro na barra de busca (Instantâneo)
    $("#txtBusca").on("keyup", function () {
        var termo = $(this).val().toLowerCase();
        $("#tbEstoque tbody tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(termo) > -1)
        });
    });

    $("#formPeca").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });
});


function carregarPecas() {
    $.ajax({
        url: _url + "api/Oficina/Estoque",
        type: "GET",
        success: function (dados) {
            listaPecas = dados;
            renderizarTabela(dados);
            atualizarCardsResumo(dados);
        }
    });
}

function renderizarTabela(dados) {
    var html = "";
    dados.forEach(function (p) {
        // 1. Calcula Margem de Lucro (%)
        let margem = 0;
        if (p.custo > 0) {
            margem = ((p.precoVenda - p.custo) / p.custo) * 100;
        }

        // 2. Define o Status e a Cor da Quantidade
        let statusBadge = "";
        let corQtd = "color: var(--zinc-800);";

        if (p.quantidade <= 0) {
            statusBadge = `<span class="badge" style="background-color: #fef2f2; color: #ef4444; border: 1px solid #fecaca; font-weight: 600;">SEM ESTOQUE</span>`;
            corQtd = "color: #ef4444; font-weight: bold;";
        } else if (p.quantidade <= p.estoqueMinimo) {
            statusBadge = `<span class="badge" style="background-color: #fffbeb; color: #f59e0b; border: 1px solid #fde68a; font-weight: 600;"><i class="fas fa-exclamation-circle mr-1"></i> ESTOQUE BAIXO</span>`;
            corQtd = "color: #f59e0b; font-weight: bold;";
        } else {
            statusBadge = `<span class="badge" style="background-color: #f0fdf4; color: #22c55e; border: 1px solid #bbf7d0; font-weight: 600;">EM ESTOQUE</span>`;
        }

        html += `
            <tr style="border-bottom: 1px solid var(--zinc-100);">
                <td class="pl-4 py-3">
                    <div class="font-weight-bold" style="color: var(--zinc-900);">${p.nome}</div>
                    <div style="font-size: 0.75rem; color: var(--zinc-400);">${p.sku || 'Sem SKU'}</div>
                </td>
                <td class="py-3" style="${corQtd}">${p.quantidade} unidades</td>
                <td class="py-3 text-muted">${formatarMoeda(p.custo)}</td>
                <td class="py-3 font-weight-bold" style="color: var(--zinc-900);">${formatarMoeda(p.precoVenda)}</td>
                <td class="py-3 font-weight-bold" style="color: #10b981;">${margem.toFixed(0)}%</td>
                <td class="py-3 text-center">${statusBadge}</td>
                <td class="py-3 text-center">
                    <button class="btn btn-sm btn-light border shadow-sm text-primary mr-1" onclick="editar('${p.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                    <button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="deletar('${p.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    $("#tbEstoque tbody").html(html || '<tr><td colspan="7" class="text-center py-5 text-muted">Nenhuma peça cadastrada.</td></tr>');
}

function atualizarCardsResumo(dados) {
    let valorTotal = 0;
    let itensBaixos = 0;

    dados.forEach(p => {
        valorTotal += (p.quantidade * p.custo); // Valor do patrimônio no estoque
        if (p.quantidade <= p.estoqueMinimo) itensBaixos++;
    });

    $("#cardValorTotal").text(formatarMoeda(valorTotal));
    $("#cardEstoqueBaixo").text(itensBaixos);
    $("#cardTotalItens").text(dados.length);
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function abrirModal() {
    $("#formPeca")[0].reset();
    $("#txtId").val("");
    $("#modalPeca").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    var dados = {
        nome: $("#txtNome").val(),
        sku: $("#txtSku").val(),
        fornecedor: $("#txtFornecedor").val(),
        quantidade: parseFloat($("#txtQtd").val()) || 0,
        estoqueMinimo: parseFloat($("#txtQtdMinima").val()) || 0,
        custo: parseFloat($("#txtCusto").val()) || 0,
        precoVenda: parseFloat($("#txtVenda").val()) || 0
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${_url}api/Oficina/Estoque/${id}` : _url + "api/Oficina/Estoque",
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalPeca").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Peça atualizada no estoque.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarPecas();
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível salvar.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('Salvar Peça');
        }
    });
}

function editar(id) {
    $.get(`${_url}api/Oficina/Estoque/${id}`, function (p) {
        $("#txtId").val(p.id);
        $("#txtNome").val(p.nome);
        $("#txtSku").val(p.sku);
        $("#txtFornecedor").val(p.fornecedor);
        $("#txtQtd").val(p.quantidade);
        $("#txtQtdMinima").val(p.estoqueMinimo);
        $("#txtCusto").val(p.custo);
        $("#txtVenda").val(p.precoVenda);
        $("#modalPeca").modal("show");
    });
}

function deletar(id) {
    Swal.fire({
        title: 'Excluir Peça?',
        text: `Aviso: Se esta peça já foi usada em Ordens de Serviço, excluí-la pode gerar erros históricos.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${_url}api/Oficina/Estoque/${id}`,
                type: "DELETE",
                success: function () {
                    carregarPecas();
                }
            });
        }
    });
}