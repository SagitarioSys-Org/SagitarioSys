let listaPecas = [];

$(document).ready(function () {
    carregarPecas();

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

    $("#formAjuste").on("submit", function (e) {
        e.preventDefault();
        aplicarAjuste();
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
            preencherComboAjuste(dados);
        }
    });
}

function renderizarTabela(dados) {
    var html = "";
    dados.forEach(function (p) {
        let margem = 0;
        if (p.custo > 0) {
            margem = ((p.precoVenda - p.custo) / p.custo) * 100;
        }

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
                    <div style="font-size: 0.75rem; color: var(--zinc-400);">${p.fornecedor || 'Sem fornecedor informado'}</div>
                </td>
                <td class="py-3"><code>${p.sku || '-'}</code></td>
                <td class="py-3" style="${corQtd}">${p.quantidade} unidades</td>
                <td class="py-3 text-muted">${formatarMoeda(p.custo)}</td>
                <td class="py-3 font-weight-bold" style="color: var(--zinc-900);">${formatarMoeda(p.precoVenda)}</td>
                <td class="py-3 font-weight-bold" style="color: #10b981;">${margem.toFixed(0)}%</td>
                <td class="py-3 text-center">${statusBadge}</td>
                <td class="py-3 text-center">
                    <button class="btn btn-sm btn-light border shadow-sm text-primary" onclick="editar('${p.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                </td>
            </tr>
        `;
    });

    $("#tbEstoque tbody").html(html || '<tr><td colspan="8" class="text-center py-5 text-muted">Nenhum produto cadastrado.</td></tr>');
}

function atualizarCardsResumo(dados) {
    let valorTotal = 0;
    let itensBaixos = 0;

    dados.forEach(p => {
        valorTotal += (p.quantidade * p.custo);
        if (p.quantidade <= p.estoqueMinimo) itensBaixos++;
    });

    $("#cardValorTotal").text(formatarMoeda(valorTotal));
    $("#cardEstoqueBaixo").text(itensBaixos);
    $("#cardTotalItens").text(dados.length);
}

function preencherComboAjuste(dados) {
    const $combo = $("#selPecaAjuste");
    $combo.empty();
    $combo.append('<option value="">Selecione um produto...</option>');
    dados.forEach(p => {
        $combo.append(`<option value="${p.id}">${p.nome} (${p.sku || 'sem código'}) - Saldo: ${p.quantidade}</option>`);
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function abrirModal() {
    $("#formPeca")[0].reset();
    $("#txtId").val("");
    $("#modalPeca").modal("show");
}

function abrirModalAjuste() {
    $("#formAjuste")[0].reset();
    $("#modalAjuste").modal("show");
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

    if (!dados.sku || dados.sku.trim().length < 2) {
        Swal.fire('Validação', 'Informe um código de produto (SKU) válido.', 'warning');
        return;
    }

    if (isEdicao)
        dados.id = id;

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${_url}api/Oficina/Estoque/${id}` : _url + "api/Oficina/Estoque",
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalPeca").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Produto salvo no estoque.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarPecas();
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível salvar.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('Salvar Produto');
        }
    });
}

function aplicarAjuste() {
    const id = $("#selPecaAjuste").val();
    const tipo = $("#selTipoAjuste").val();
    const quantidade = parseFloat($("#txtQtdAjuste").val()) || 0;

    if (!id || quantidade <= 0) {
        Swal.fire('Validação', 'Selecione um produto e informe uma quantidade válida.', 'warning');
        return;
    }

    const peca = listaPecas.find(x => x.id === id);
    if (!peca) {
        Swal.fire('Erro', 'Produto não encontrado para ajuste.', 'error');
        return;
    }

    let novaQtd = peca.quantidade;
    if (tipo === 'entrada') {
        novaQtd = peca.quantidade + quantidade;
    } else if (tipo === 'saida') {
        novaQtd = peca.quantidade - quantidade;
    } else {
        novaQtd = quantidade;
    }

    if (novaQtd < 0) {
        Swal.fire('Validação', 'A saída não pode deixar o estoque negativo.', 'warning');
        return;
    }

    const dados = {
        id: peca.id,
        nome: peca.nome,
        sku: peca.sku,
        fornecedor: peca.fornecedor,
        quantidade: novaQtd,
        estoqueMinimo: peca.estoqueMinimo,
        custo: peca.custo,
        precoVenda: peca.precoVenda
    };

    const $btn = $("#btnSalvarAjuste");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Processando...');

    $.ajax({
        url: `${_url}api/Oficina/Estoque/${id}`,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalAjuste").modal("hide");
            Swal.fire({ title: 'Ajuste aplicado!', text: 'Saldo atualizado com sucesso.', icon: 'success', timer: 1600, showConfirmButton: false });
            carregarPecas();
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível aplicar o ajuste.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('Aplicar Ajuste');
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
