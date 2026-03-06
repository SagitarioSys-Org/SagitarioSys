
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

    $("#formFaturarOS").on("submit", function (e) {
        e.preventDefault();
        confirmarFaturamento();
    });

    $("#txtBuscaOS").on("keyup", filtrarOS);
    $("#ddlFiltroStatus").on("change", filtrarOS);
});

function filtrarOS() {
    var termo = $("#txtBuscaOS").val().toLowerCase();
    var statusSelecionado = $("#ddlFiltroStatus").val().toLowerCase();

    $("#tbOS tbody tr").each(function () {
        // Se for a linha de "Carregando", ignora
        if ($(this).find("td").length === 1) return;

        var textoLinha = $(this).text().toLowerCase();
        var statusLinha = $(this).data("status") ? $(this).data("status").toLowerCase() : "";

        // Verifica se o texto digitado existe na linha
        var matchTexto = textoLinha.indexOf(termo) > -1;

        // Verifica se o status do dropdown bate com o status da linha (ou se está vazio/Todos)
        var matchStatus = (statusSelecionado === "") || (statusLinha === statusSelecionado) || (statusLinha.indexOf(statusSelecionado) > -1);

        // Só mostra a linha se passar nos dois testes
        if (matchTexto && matchStatus) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

// ==========================================
// 1. CARREGAMENTO E FILTROS (Clientes e Veículos)
// ==========================================
function carregarListasAuxiliares() {
    // Busca Clientes
    $.get(_url + "api/Oficina/Clientes", function (dados) {
        var html = '<option value="">Selecione o Cliente...</option>';
        dados.forEach(c => html += `<option value="${c.id}">${c.nome}</option>`);
        $("#ddlCliente").html(html);
    });

    // Busca Veículos e guarda na memória
    $.get(_url + "api/Oficina/Veiculos", function (dados) {
        listaTodosVeiculos = dados;
    });

    $.get(_url + "api/Oficina/Estoque", function (dados) {
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
    var veiculosDoCliente = listaTodosVeiculos.filter(v =>
        String(v.clienteId).toLowerCase() === String(clienteId).toLowerCase()
    );

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
        url: _url + "api/Oficina/OrdensServico",
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
                // Adicionando uma cor diferente caso já esteja Faturada
                if (os.status === "Faturada") badgeClass = "badge-info";

                let dataAbertura = new Date(os.dataAbertura).toLocaleDateString('pt-BR');

                // ✨ NOVO: Verifica se o status permite faturar
                let btnFaturar = "";
                if (os.status !== "Faturada" && os.status !== "Cancelada") {
                    btnFaturar = `<button class="btn btn-sm btn-success mr-1 shadow-sm" onclick="abrirModalFaturar('${os.id}', ${os.valorTotal})" title="Faturar e Receber OS"><i class="fas fa-dollar-sign"></i></button>`;
                }

                html += `
                    <tr data-status="${os.status}">
                        <td class="font-weight-bold" style="font-family: 'JetBrains Mono';">#${os.numeroOS.toString().padStart(4, '0')}</td>
                        <td>
                            <div class="font-weight-bold">${os.nomeCliente}</div>
                            <div class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-car mr-1"></i> ${os.modeloVeiculo} (${os.placaVeiculo})</div>
                            <span style="display:none;">${os.cpfCnpj || os.clienteCpfCnpj || ''}</span>
                        </td>
                        <td>${dataAbertura}</td>
                        <td><span class="badge ${badgeClass} px-2 py-1" style="font-size: 0.75rem;">${os.status.toUpperCase()}</span></td>
                        <td class="text-right font-weight-bold text-success">${formatarMoeda(os.valorTotal)}</td>
                        <td class="text-center">
                            ${btnFaturar}
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
    $("#txtKmAtual").val("");
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
        kmAtual: $("#txtKmAtual").val() ? parseInt($("#txtKmAtual").val()) : null,
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
        url: isEdicao ? `${_url}api/Oficina/OrdensServico/${id}` : _url + "api/Oficina/OrdensServico",
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalOS").modal("hide");
            Swal.fire({ title: 'Salvo!', text: 'A O.S foi registrada com sucesso.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarOrdens();
        },
        error: function (xhr) {
            // Imprime o erro técnico completo no console para podermos investigar
            console.error("ERRO 400 COMPLETO:", xhr.responseText);

            // Tenta ler a mensagem amigável que o C# mandou
            var msg = "Erro ao salvar a O.S. (Verifique o console para detalhes).";

            if (xhr.responseJSON) {
                if (xhr.responseJSON.message) {
                    msg = xhr.responseJSON.message; // Mensagem do nosso Controller
                } else if (xhr.responseJSON.errors) {
                    msg = "Faltam campos obrigatórios no formulário. Verifique o console."; // Erro automático do ASP.NET
                }
            }

            Swal.fire('Erro!', msg, 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-check mr-2"></i> Salvar O.S.');
        }
    });
}

function editar(id) {
    $.get(`${_url}api/Oficina/OrdensServico/${id}`, function (os) {
        $("#txtId").val(os.id);
        $("#ddlCliente").val(os.clienteId);

        // Carrega os veículos daquele cliente e já deixa o dele selecionado
        filtrarVeiculos(os.clienteId, os.veiculoId);

        $("#txtKmAtual").val(os.kmAtual);
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
        if (os.status === "Faturada") {
            // 1. Desativa todos os campos de texto e selects
            $("#formOS input, #formOS select, #formOS textarea").prop("disabled", true);

            // 2. Esconde os botões de ação (Salvar, Adicionar Item e os "X" vermelhos dos itens)
            $("#btnSalvar").hide();
            $("#btnAdicionarItemOS").hide();

            // Um pequeno delay para dar tempo do HTML dos itens ser desenhado antes de esconder os botões de apagar
            setTimeout(() => { $(".btn-outline-danger").hide(); }, 100);

            // 3. Muda o título para deixar claro que é apenas visualização
            $("#modalTitle").html(`<i class="fas fa-lock text-warning mr-2"></i> Visualizar O.S #${os.numeroOS.toString().padStart(4, '0')} (Fechada)`);
        } else {
            // Se não for faturada, destrava tudo (caso o utilizador tenha aberto uma faturada antes)
            $("#formOS input, #formOS select, #formOS textarea").prop("disabled", false);
            $("#btnSalvar").show();
            $("#btnAdicionarItemOS").show();
            setTimeout(() => { $(".btn-outline-danger").show(); }, 100);

            $("#modalTitle").html(`<i class="fas fa-edit mr-2"></i> Editar O.S #${os.numeroOS.toString().padStart(4, '0')}`);
        }

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
                url: `${_url}api/Oficina/OrdensServico/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Cancelada!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarOrdens();
                }
            });
        }
    });
}

// ==========================================
// 💰 INTEGRAÇÃO COM O FLUXO DE CAIXA
// ==========================================

function abrirModalFaturar(id, valorTotal) {
    // Limpa o formulário
    $("#formFaturarOS")[0].reset();

    // Guarda o ID da OS escondido
    $("#txtFaturarOsId").val(id);

    // Mostra o valor de forma amigável
    $("#lblValorFaturar").text(parseFloat(valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    // Já sugere a data de hoje para agilizar o trabalho do mecânico
    document.getElementById('txtDataPgtoOS').valueAsDate = new Date();

    // Abre a tela
    $("#modalFaturarOS").modal("show");
}

function confirmarFaturamento() {
    var idOS = $("#txtFaturarOsId").val();

    var dados = {
        formaPagamento: $("#ddlFormaPgtoOS").val(),
        dataPagamento: $("#txtDataPgtoOS").val()
    };

    var $btn = $("#btnConfirmarFaturamento");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Processando...');

    $.ajax({
        // A rota que criámos no backend!
        url: _url + `api/Oficina/OrdensServico/${idOS}/faturar`,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function (resposta) {
            $("#modalFaturarOS").modal("hide");

            Swal.fire({
                title: 'OS Faturada!',
                text: 'O dinheiro já está no Fluxo de Caixa.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
          
            carregarOrdens();
        },
        error: function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.message : "Erro ao faturar.";
            Swal.fire('Atenção!', msg, 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-check mr-1"></i> Confirmar e Lançar no Caixa');
        }
    });
}