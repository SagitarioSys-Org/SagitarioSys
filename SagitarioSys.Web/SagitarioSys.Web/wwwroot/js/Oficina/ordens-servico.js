
let listaTodosVeiculos = []; // Guardamos na memória para filtrar rápido
let listaTodosClientes = [];
const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1/carros/marcas";

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

    $("#txtBuscaCliente").on("keypress", function (e) {
        if (e.which === 13) { e.preventDefault(); buscarCliente(); }
    });
    $("#txtBuscaVeiculo").on("keypress", function (e) {
        if (e.which === 13) { e.preventDefault(); buscarVeiculo(); }
    });

    // Máscara CPF/CNPJ no campo de busca de cliente
    $('#txtBuscaCliente').on('input', function () {
        let v = $(this).val().replace(/\D/g, '');
        if (v.length <= 11) {
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
            v = v.replace(/(\d{4})(\d)/, '$1-$2');
        }
        $(this).val(v);
    });

});


// ========================================
// MÁSCARAS — copiado do clientes.js
// ========================================
var cpfCnpjBehavior = function (val) {
    return val.replace(/\D/g, '').length <= 11 ? '000.000.000-009' : '00.000.000/0000-00';
};
var cpfCnpjOptions = {
    onKeyPress: function (val, e, field, options) {
        field.mask(cpfCnpjBehavior.apply({}, arguments), options);
    }
};

var telBehavior = function (val) {
    return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
};
var telOptions = {
    onKeyPress: function (val, e, field, options) {
        field.mask(telBehavior.apply({}, arguments), options);
    }
};

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

    $.get(_url + "api/oficina/Clientes", function (dados) {
        listaTodosClientes = dados;  // ← só guarda, sem montar select
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
    $("#hdfClienteId").val("");
    $("#hdfVeiculoId").val("");

    // Reseta o fluxo de busca
    $("#cardClienteEncontrado").addClass("d-none");
    $("#txtBuscaCliente").closest(".col-md-6").removeClass("d-none").find("input").val("");
    $("#blocoVeiculo").addClass("d-none");
    $("#blocoDetalhes").addClass("d-none");
    limparVeiculo();
    $("#resultadoBuscaCliente").hide();

    $("#boxItensOS").empty();
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
        clienteId: $("#hdfClienteId").val(),
        veiculoId: $("#hdfVeiculoId").val(),
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

        // Preenche os cards de Cliente/Veículo no novo fluxo de busca
        const cpfCnpjCliente = os.clienteCpfCnpj || os.cpfCnpj || "";
        selecionarCliente(os.clienteId, os.nomeCliente || "Cliente", cpfCnpjCliente);
        selecionarVeiculo(os.veiculoId, os.modeloVeiculo || "Veículo", os.placaVeiculo || "", os.kmAtual || 0);

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

// ========================================
// BUSCA DE CLIENTE
// ========================================
function buscarCliente() {
    const termo = $("#txtBuscaCliente").val().trim();
    if (!termo) return;

    const termoLimpo = termo.replace(/\D/g, '');

    const resultados = listaTodosClientes.filter(c =>
        c.nome.toLowerCase().includes(termo.toLowerCase()) ||
        (c.cpfCnpj && c.cpfCnpj.replace(/\D/g, '').includes(termoLimpo))
    );

    if (resultados.length === 0) {
        $("#listaClientes").html(`
            <div class="p-3 text-muted text-center">
                <i class="fas fa-user-slash mr-1"></i> Nenhum cliente encontrado.
            </div>`);
    } else {
        let html = "";
        resultados.forEach(c => {
            html += `
                <div class="p-2 border-bottom cliente-resultado" 
                     style="cursor:pointer;" 
                     onclick="selecionarCliente('${c.id}', '${c.nome}', '${c.cpfCnpj || ''}')">
                    <div class="font-weight-bold">${c.nome}</div>
                    <small class="text-muted">${c.cpfCnpj || 'Sem CPF/CNPJ'}</small>
                </div>`;
        });
        $("#listaClientes").html(html);
    }

    $("#resultadoBuscaCliente").show();
}

function formatarCpfCnpj(v) {
    if (!v) return 'Sem CPF/CNPJ';
    v = v.replace(/\D/g, '');
    if (v.length <= 11) {
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
}

function selecionarCliente(id, nome, cpf) {
    $("#hdfClienteId").val(id);
    $("#cardClienteNome").text(nome);
    $("#cardClienteCpf").text(formatarCpfCnpj(cpf));
    $("#blocoInputCliente").hide();
    $("#cardClienteEncontrado").removeClass("d-none");
    $("#resultadoBuscaCliente").hide();

    // ✅ Garante que o bloco do veículo aparece
    $("#blocoVeiculo").removeClass("d-none").show();
    $("#blocoInputVeiculo").show();
    $("#cardVeiculoEncontrado").addClass("d-none");
    $("#txtBuscaVeiculo").val("").focus();
}



function limparCliente() {
    $("#hdfClienteId").val("");
    $("#cardClienteEncontrado").addClass("d-none");
    $("#blocoInputCliente").show();
    $("#txtBuscaCliente").val("").focus();
    $("#blocoDetalhes").addClass("d-none");
    limparVeiculo();
}

// ========================================
// BUSCA DE VEÍCULO
// ========================================
function buscarVeiculo() {

    const placa = $("#txtBuscaVeiculo").val().trim().toUpperCase();
    const clienteId = $("#hdfClienteId").val();
    if (!clienteId) {
        Swal.fire('Atenção', 'Selecione o cliente primeiro.', 'warning');
        return;
    }

    if (!placa) return;

    // Busca só nos veículos do cliente selecionado
    const resultados = listaTodosVeiculos.filter(v =>
        String(v.clienteId).toLowerCase() === clienteId.toLowerCase() &&
        v.placa.toUpperCase().includes(placa)
    );

    if (resultados.length === 0) {
        $("#listaVeiculos").html(`
            <div class="p-3 text-muted text-center">
                <i class="fas fa-car mr-1"></i> Nenhum veículo encontrado para este cliente.
            </div>`);
    } else {
        let html = "";
        resultados.forEach(v => {
            html += `
                <div class="p-2 border-bottom" style="cursor:pointer;"
                     onclick="selecionarVeiculo('${v.id}', '${v.marca} ${v.modelo}', '${v.placa}', ${v.kmAtual || 0})">
                    <div class="font-weight-bold">${v.marca} ${v.modelo}</div>
                    <small class="text-muted">
                        <i class="fas fa-id-card mr-1"></i>${v.placa} 
                        &nbsp;|&nbsp; 
                        <i class="fas fa-tachometer-alt mr-1"></i>Último KM: ${(v.kmAtual || 0).toLocaleString('pt-BR')}
                    </small>
                </div>`;
        });
        $("#listaVeiculos").html(html);
    }

    $("#resultadoBuscaVeiculo").show();
}

function selecionarVeiculo(id, nome, placa, ultimoKm) {
    $("#hdfVeiculoId").val(id);
    $("#cardVeiculoNome").text(nome);
    $("#cardVeiculoPlaca").text(placa);
    $("#blocoInputVeiculo").hide();
    $("#cardVeiculoEncontrado").removeClass("d-none");
    $("#resultadoBuscaVeiculo").hide();
    if (ultimoKm > 0) {
        $("#lblUltimoKm").text(`Último registrado: ${ultimoKm.toLocaleString('pt-BR')} km`);
    }
    $("#blocoDetalhes").removeClass("d-none");
    $("#txtKmAtual").focus();
}

function limparVeiculo() {
    $("#hdfVeiculoId").val("");
    $("#cardVeiculoEncontrado").addClass("d-none");
    $("#blocoInputVeiculo").show();
    $("#txtBuscaVeiculo").val("");
    $("#blocoDetalhes").addClass("d-none");
    $("#resultadoBuscaVeiculo").hide();
    $("#lblUltimoKm").text("");
}

// ========================================
// MODAL CADASTRO RÁPIDO — CLIENTE
// ========================================
function abrirModalCadastroCliente() {
    $("#formCadastroRapidoCliente")[0].reset();
    $("#crBoxContatos").empty();
    adicionarContatoRapido(); // já inicia com uma linha
    $("#modalCadastroCliente").modal("show");
}

function fecharModalCliente() {
    $("#modalCadastroCliente").modal("hide");
}

function adicionarContatoRapido(tel = "", email = "", obs = "") {
    var idLinha = 'crcontato_' + Math.random().toString(36).substr(2, 9);
    var html = `
        <div class="row mb-2 align-items-center linha-contato-rapido" id="${idLinha}">
            <div class="col-md-3">
                <input type="text" class="form-control form-control-sm cr-tel" 
                       placeholder="Telefone/Celular" value="${tel}" style="border-radius: 6px;">
            </div>
            <div class="col-md-4">
                <input type="email" class="form-control form-control-sm cr-email" 
                       placeholder="E-mail" value="${email}" style="border-radius: 6px;">
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm cr-obs" 
                       placeholder="Ex: Falar com a esposa" value="${obs}" style="border-radius: 6px;">
            </div>
            <div class="col-md-1 text-center">
                <button type="button" class="btn btn-sm btn-outline-danger border-0 shadow-none" 
                        onclick="$('#${idLinha}').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    $("#crBoxContatos").append(html);

    // Aplica máscara de telefone igual à tela original
    $(`#${idLinha} .cr-tel`).mask(telBehavior, telOptions);
}

function buscarCepRapido() {
    var cep = $("#crCep").val().replace(/\D/g, '');
    if (cep.length !== 8) return;

    $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function (dados) {
        if (!("erro" in dados)) {
            $("#crLogradouro").val(dados.logradouro);
            $("#crBairro").val(dados.bairro);
            $("#crCidade").val(dados.localidade);
            $("#crUf").val(dados.uf);
            $("#crNumero").focus();
        } else {
            Swal.fire('CEP não encontrado', 'Verifique o número digitado.', 'warning');
        }
    });
}

// Máscara CEP e CPF/CNPJ igual à tela de clientes
$("#crCep").on("blur", function () {
    var cep = $(this).val().replace(/\D/g, '');
    if (cep.length === 8) buscarCepRapido();
});

$(document).ready(function () {
    $('#crCep').mask('00000-000');
    $('#crCpfCnpj').mask(cpfCnpjBehavior, cpfCnpjOptions);
});

$("#formCadastroRapidoCliente").on("submit", function (e) {
    e.preventDefault();
    const btn = $("#btnSalvarClienteRapido");
    btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...');

    let listaContatos = [];
    $(".linha-contato-rapido").each(function () {
        let tel = $(this).find(".cr-tel").val().replace(/\D/g, '');
        let email = $(this).find(".cr-email").val();
        let obs = $(this).find(".cr-obs").val();
        if (tel !== "" || email !== "") {
            listaContatos.push({ contato: tel, email: email, observacao: obs });
        }
    });

    const dados = {
        nome: $("#crNome").val(),
        cpfCnpj: $("#crCpfCnpj").val().replace(/\D/g, ''),
        cep: $("#crCep").val().replace(/\D/g, ''),
        logradouro: $("#crLogradouro").val(),
        numero: $("#crNumero").val(),
        bairro: $("#crBairro").val(),
        cidade: $("#crCidade").val(),
        uf: $("#crUf").val(),
        contatos: listaContatos
    };

    $.ajax({
        url: _url + "api/Oficina/Clientes",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function (novoCliente) {
            listaTodosClientes.push(novoCliente);
            selecionarCliente(novoCliente.id, novoCliente.nome, novoCliente.cpfCnpj);
            fecharModalCliente();
            Swal.fire({ title: 'Cliente cadastrado!', icon: 'success', timer: 1500, showConfirmButton: false });
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.message || "Erro ao cadastrar cliente.";
            Swal.fire('Erro!', msg, 'error');
        },
        complete: function () {
            btn.prop("disabled", false).html('<i class="fas fa-check mr-2"></i> Salvar e Selecionar');
        }
    });
});

// ========================================
// MODAL CADASTRO RÁPIDO — VEÍCULO
// ========================================
function abrirModalCadastroVeiculo() {
    $("#formCadastroRapidoVeiculo")[0].reset();
    $("#crVeiculoClienteNome").text($("#cardClienteNome").text());
    $("#crPlaca").val($("#txtBuscaVeiculo").val().toUpperCase());
    $("#crModelo, #crAno").html('<option value="">Selecione a marca primeiro</option>').prop("disabled", true);

    // Carrega marcas FIPE se ainda não carregou
    if ($("#crMarca option").length <= 1) {
        carregarMarcasFipeModal();
    }

    $("#modalCadastroVeiculo").modal("show");
}

function fecharModalVeiculo() {
    $("#modalCadastroVeiculo").modal("hide");
}

function carregarMarcasFipeModal() {
    $.get(FIPE_BASE, function (dados) {
        var html = '<option value="">Selecione a Marca</option>';
        dados.forEach(m => html += `<option value="${m.codigo}">${m.nome}</option>`);
        $("#crMarca").html(html);
    });
}

// Cascata Marca → Modelo → Ano (igual ao veiculos.js)
$("#crMarca").on("change", function () {
    var marcaId = $(this).val();
    $("#crModelo").html('<option value="">Carregando...</option>').prop("disabled", true);
    $("#crAno").html('<option value="">Aguardando...</option>').prop("disabled", true);

    if (marcaId) {
        $.get(`${FIPE_BASE}/${marcaId}/modelos`, function (data) {
            var html = '<option value="">Selecione o Modelo</option>';
            data.modelos.forEach(m => html += `<option value="${m.codigo}">${m.nome}</option>`);
            $("#crModelo").html(html).prop("disabled", false);
        });
    }
});

$("#crModelo").on("change", function () {
    var marcaId = $("#crMarca").val();
    var modeloId = $(this).val();
    $("#crAno").html('<option value="">Carregando...</option>').prop("disabled", true);

    if (modeloId) {
        $.get(`${FIPE_BASE}/${marcaId}/modelos/${modeloId}/anos`, function (data) {
            var html = '<option value="">Selecione o Ano</option>';
            data.forEach(a => {
                let anoReal = a.nome.substring(0, 4);
                html += `<option value="${anoReal}">${a.nome}</option>`;
            });
            $("#crAno").html(html).prop("disabled", false);
        });
    }
});

$("#formCadastroRapidoVeiculo").on("submit", function (e) {
    e.preventDefault();
    const btn = $("#btnSalvarVeiculoRapido");
    btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...');

    var textoMarca = $("#crMarca option:selected").text();
    var textoModelo = $("#crModelo option:selected").text();
    var anoVal = $("#crAno").val() || "0";

    const dados = {
        clienteId: $("#hdfClienteId").val(),
        placa: $("#crPlaca").val().toUpperCase(),
        marca: textoMarca,
        modelo: textoModelo,
        anoFabricacao: parseInt(anoVal) || 0,
        anoModelo: parseInt(anoVal) || 0,
        cor: $("#crCor").val(),
        observacoes: $("#crObsVeiculo").val(),
        kmAtual: parseInt($("#crKmAtual").val()) || 0
    };

    $.ajax({
        url: _url + "api/Oficina/Veiculos",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function (novoVeiculo) {
            listaTodosVeiculos.push(novoVeiculo);
            selecionarVeiculo(
                novoVeiculo.id,
                `${novoVeiculo.marca} ${novoVeiculo.modelo}`,
                novoVeiculo.placa,
                novoVeiculo.kmAtual || 0
            );
            fecharModalVeiculo();
            Swal.fire({ title: 'Veículo cadastrado!', icon: 'success', timer: 1500, showConfirmButton: false });
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.message || "Erro ao cadastrar veículo.";
            Swal.fire('Erro!', msg, 'error');
        },
        complete: function () {
            btn.prop("disabled", false).html('<i class="fas fa-check mr-2"></i> Salvar e Selecionar');
        }
    });
});


