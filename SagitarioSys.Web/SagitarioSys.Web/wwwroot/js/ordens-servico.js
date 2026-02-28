const API_OS = "https://localhost:44373/api/OrdensServico";
const API_CLIENTES = "https://localhost:44373/api/Clientes";
const API_VEICULOS = "https://localhost:44373/api/Veiculos";
const API_ESTOQUE = "https://localhost:44373/api/Estoque";

let listaTodosVeiculos = []; // Guardamos na memória para filtrar rápido

$(document).ready(function () {
    carregarListasAuxiliares();
    carregarOrdens();

    // Quando mudar o Cliente, filtra os veículos dele!
    $("#ddlCliente").on("change", function () {
        var clienteId = $(this).val();
        filtrarVeiculos(clienteId);
    });

    $("#formOS").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });
});

$.ajaxSetup({
    beforeSend: function (xhr) {
        var token = localStorage.getItem("jwt_token");
        if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);
    }
});

// ==========================================
// 1. CARREGAMENTO E FILTROS (Clientes e Veículos)
// ==========================================
function carregarListasAuxiliares() {
    // Busca Clientes
    $.get(API_CLIENTES, function (dados) {
        var html = '<option value="">Selecione o Cliente...</option>';
        dados.forEach(c => html += `<option value="${c.id}">${c.nome}</option>`);
        $("#ddlCliente").html(html);
    });

    // Busca Veículos e guarda na memória
    $.get(API_VEICULOS, function (dados) {
        listaTodosVeiculos = dados;
    });

    $.get(API_ESTOQUE, function (dados) {
        listaEstoque = dados;
    });
}

function filtrarVeiculos(clienteId, veiculoSelecionadoId = null) {
    var $ddlVeiculo = $("#ddlVeiculo");

    if (!clienteId) {
        $ddlVeiculo.html('<option value="">Selecione o cliente primeiro</option>').prop("disabled", true);
        return;
    }

    // Filtra no JS os veículos que pertencem ao cliente escolhido
    var veiculosDoCliente = listaTodosVeiculos.filter(v => v.clienteId === clienteId);

    var html = '<option value="">Selecione o Veículo...</option>';
    veiculosDoCliente.forEach(v => {
        html += `<option value="${v.id}">${v.marca} ${v.modelo} (${v.placa})</option>`;
    });

    $ddlVeiculo.html(html).prop("disabled", false);

    if (veiculoSelecionadoId) {
        $ddlVeiculo.val(veiculoSelecionadoId);
    }
}

// ==========================================
// 2. MATEMÁTICA E ITENS DINÂMICOS
// ==========================================
function adicionarItemOS(tipo = "Servico", desc = "", qtd = 1, valor = 0, pecaId = null) {
    var idLinha = 'item_' + Math.random().toString(36).substr(2, 9);

    // Monta as opções do select de peças
    var optionsPecas = '<option value="">Selecione a peça...</option>';
    listaEstoque.forEach(p => {
        let selecionado = (p.id === pecaId) ? "selected" : "";
        optionsPecas += `<option value="${p.id}" data-preco="${p.precoVenda}" data-nome="${p.nome}" ${selecionado}>${p.nome} (Qtd: ${p.quantidade}) - R$ ${p.precoVenda}</option>`;
    });

    // Se for serviço, mostra o texto. Se for peça, mostra o select.
    var displayTexto = tipo === 'Servico' ? 'block' : 'none';
    var displaySelect = tipo === 'Peca' ? 'block' : 'none';

    var html = `
        <div class="row item-os mb-2 align-items-center" id="${idLinha}">
            <div class="col-md-2">
                <select class="form-control form-control-sm item-tipo" onchange="mudarTipoItem('${idLinha}')">
                    <option value="Servico" ${tipo === 'Servico' ? 'selected' : ''}>Serviço</option>
                    <option value="Peca" ${tipo === 'Peca' ? 'selected' : ''}>Peça</option>
                </select>
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control form-control-sm item-desc-texto" placeholder="Ex: Mão de Obra" value="${desc}" style="display: ${displayTexto};">
                
                <select class="form-control form-control-sm item-desc-select" style="display: ${displaySelect};" onchange="selecionarPeca('${idLinha}')">
                    ${optionsPecas}
                </select>
            </div>
            <div class="col-md-1">
                <input type="number" class="form-control form-control-sm item-qtd text-center" min="0.1" step="0.1" value="${qtd}" onchange="calcularTotalOS()" onkeyup="calcularTotalOS()" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control form-control-sm item-valor text-right" min="0" step="0.01" value="${valor}" onchange="calcularTotalOS()" onkeyup="calcularTotalOS()" required>
            </div>
            <div class="col-md-1 text-right font-weight-bold text-success item-subtotal" style="font-size: 0.9rem;">R$ 0,00</div>
            <div class="col-md-1 text-center">
                <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="removerItemOS('${idLinha}')"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `;
    $("#boxItensOS").append(html);
    calcularTotalOS();
}

// Lógicas de interação na tela:
function mudarTipoItem(idLinha) {
    let tipo = $(`#${idLinha} .item-tipo`).val();
    if (tipo === 'Servico') {
        $(`#${idLinha} .item-desc-texto`).show().val('');
        $(`#${idLinha} .item-desc-select`).hide().val('');
        $(`#${idLinha} .item-valor`).val(0);
    } else {
        $(`#${idLinha} .item-desc-texto`).hide().val('');
        $(`#${idLinha} .item-desc-select`).show();
        $(`#${idLinha} .item-valor`).val(0);
    }
    calcularTotalOS();
}

function selecionarPeca(idLinha) {
    let $select = $(`#${idLinha} .item-desc-select`);
    let preco = $select.find(':selected').data('preco');
    if (preco) {
        $(`#${idLinha} .item-valor`).val(preco);
    } else {
        $(`#${idLinha} .item-valor`).val(0);
    }
    calcularTotalOS();
}

function removerItemOS(idLinha) {
    $("#" + idLinha).remove();
    calcularTotalOS();
}

function calcularTotalOS() {
    let totalOS = 0;

    $(".item-os").each(function () {
        let qtd = parseFloat($(this).find(".item-qtd").val()) || 0;
        let valorUnit = parseFloat($(this).find(".item-valor").val()) || 0;

        let subtotal = qtd * valorUnit;
        totalOS += subtotal;

        // Atualiza o subtotal da linha
        $(this).find(".item-subtotal").text(formatarMoeda(subtotal));
    });

    // Atualiza o Total Gigante
    $("#lblTotalOS").text(formatarMoeda(totalOS));
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// 3. CRUD PRINCIPAL E LISTAGEM
// ==========================================
function carregarOrdens() {
    $.ajax({
        url: API_OS,
        type: "GET",
        success: function (dados) {
            var html = "";
            dados.forEach(function (os) {
                // Monta o Badge (Etiqueta de Status) Premium
                let badgeClass = "badge-secondary";
                if (os.status === "Aberta") badgeClass = "badge-primary";
                if (os.status === "Em Andamento") badgeClass = "badge-warning";
                if (os.status === "Concluida") badgeClass = "badge-success";
                if (os.status === "Cancelada") badgeClass = "badge-danger";

                let dataAbertura = new Date(os.dataAbertura).toLocaleDateString('pt-BR');

                html += `
                    <tr>
                        <td class="font-weight-bold" style="font-family: 'JetBrains Mono';">#${os.numeroOS.toString().padStart(4, '0')}</td>
                        <td>
                            <div class="font-weight-bold">${os.nomeCliente}</div>
                            <div class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-car mr-1"></i> ${os.modeloVeiculo} (${os.placaVeiculo})</div>
                        </td>
                        <td>${dataAbertura}</td>
                        <td><span class="badge ${badgeClass} px-2 py-1" style="font-size: 0.75rem;">${os.status.toUpperCase()}</span></td>
                        <td class="text-right font-weight-bold text-success">${formatarMoeda(os.valorTotal)}</td>
                       <td class="text-center">
           <a href="/OrdensServico/Imprimir/${os.id}" target="_blank" class="btn btn-sm btn-light border shadow-sm mr-1" title="Imprimir PDF"><i class="fas fa-file-pdf text-danger"></i></a>
            <button class="btn btn-sm btn-light border shadow-sm text-primary mr-1" onclick="editar('${os.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="deletar('${os.id}')"><i class="fas fa-trash"></i></button>
        </td>
                    </tr>
                `;
            });
            $("#tbOS tbody").html(html || '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhuma Ordem de Serviço encontrada.</td></tr>');
        }
    });
}

function abrirModal() {
    $("#formOS")[0].reset();
    $("#txtId").val("");
    $("#boxItensOS").empty();
    $("#ddlVeiculo").html('<option value="">Selecione o cliente primeiro</option>').prop("disabled", true);

    // Adiciona uma linha em branco pro cara já começar a digitar
    adicionarItemOS();

    $("#modalTitle").text("Nova Ordem de Serviço");
    $("#modalOS").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    // Pega os itens da tela
    var listaItens = [];
    $(".item-os").each(function () {
        let tipo = $(this).find(".item-tipo").val();
        let pecaId = null;
        let desc = "";

        if (tipo === 'Servico') {
            desc = $(this).find(".item-desc-texto").val();
        } else {
            let valorSelect = $(this).find(".item-desc-select").val();
            // CORREÇÃO 1: Garante que se não tiver peça, mande explicitamente 'null' e não texto vazio.
            pecaId = valorSelect ? valorSelect : null;
            desc = $(this).find(".item-desc-select option:selected").data('nome');
        }

        if (desc && desc.trim() !== "") {
            listaItens.push({
                tipo: tipo,
                pecaId: pecaId,
                descricao: desc,
                quantidade: parseFloat($(this).find(".item-qtd").val()) || 0,
                valorUnitario: parseFloat($(this).find(".item-valor").val()) || 0
            });
        }
    });

    if (listaItens.length === 0) {
        Swal.fire('Atenção', 'Adicione pelo menos um item (Peça ou Serviço) na OS.', 'warning');
        return;
    }

    var dados = {
        clienteId: $("#ddlCliente").val(),
        veiculoId: $("#ddlVeiculo").val(),
        status: $("#ddlStatus").val(),
        relatoCliente: $("#txtRelato").val(),
        observacoesInternas: $("#txtObs").val(),
        itens: listaItens
    };

    // CORREÇÃO 2: A API exige o ID dentro do corpo para saber que não é uma tentativa de fraude de URL
    if (isEdicao) {
        dados.id = id;
    }

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${API_OS}/${id}` : API_OS,
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalOS").modal("hide");
            Swal.fire({ title: 'Salvo!', text: 'A O.S foi registrada com sucesso.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarOrdens();
        },
        error: function () {
            Swal.fire('Erro!', 'Erro ao salvar a O.S. (Verifique o console para mais detalhes)', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-check mr-2"></i> Salvar O.S.');
        }
    });
}

function editar(id) {
    $.get(`${API_OS}/${id}`, function (os) {
        $("#txtId").val(os.id);
        $("#ddlCliente").val(os.clienteId);

        // Carrega os veículos daquele cliente e já deixa o dele selecionado
        filtrarVeiculos(os.clienteId, os.veiculoId);

        $("#ddlStatus").val(os.status);
        $("#txtRelato").val(os.relatoCliente);
        $("#txtObs").val(os.observacoesInternas);

        // Recria a grade de itens
        $("#boxItensOS").empty();
        if (os.itens && os.itens.length > 0) {
            os.itens.forEach(i => {
                // Passa o PecaId no final para pré-selecionar o select!
                adicionarItemOS(i.tipo, i.descricao, i.quantidade, i.valorUnitario, i.pecaId);
            });
        }

        $("#modalTitle").text(`Editar O.S #${os.numeroOS.toString().padStart(4, '0')}`);
        $("#modalOS").modal("show");
    });
}

function deletar(id) {
    Swal.fire({
        title: 'Cancelar O.S?',
        text: `A ordem de serviço será marcada como Cancelada.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, cancelar!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${API_OS}/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Cancelada!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarOrdens();
                }
            });
        }
    });
}