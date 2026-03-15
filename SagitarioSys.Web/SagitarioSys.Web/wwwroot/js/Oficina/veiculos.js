const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1/carros/marcas";

var _todosClientes = [];

$(document).ready(function () {
    carregarClientesCache();
    carregarMarcasFipe();
    carregarVeiculos();

    // Máscaras locais para o modal rápido de cliente
    var cpfCnpjBehaviorCR = function (val) {
        return val.replace(/\D/g, '').length <= 11 ? '000.000.000-009' : '00.000.000/0000-00';
    };
    var cpfCnpjOptionsCR = {
        onKeyPress: function (val, e, field, options) {
            field.mask(cpfCnpjBehaviorCR.apply({}, arguments), options);
        }
    };

    var telBehaviorCR = function (val) {
        return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
    };
    var telOptionsCR = {
        onKeyPress: function (val, e, field, options) {
            field.mask(telBehaviorCR.apply({}, arguments), options);
        }
    };


    // Quando o usuário escolhe uma MARCA na FIPE
    $("#ddlMarca").on("change", function () {
        var marcaId = $(this).val();
        $("#txtMarcaNome").val($("#ddlMarca option:selected").text()); // Guarda o nome (Ex: Honda)

        $("#ddlModelo").html('<option value="">Carregando...</option>').prop("disabled", true);
        $("#ddlAno").html('<option value="">Selecione...</option>').prop("disabled", true);

        if (marcaId) {
            $.get(`${FIPE_BASE}/${marcaId}/modelos`, function (data) {
                var html = '<option value="">Selecione o Modelo</option>';
                data.modelos.forEach(m => html += `<option value="${m.codigo}">${m.nome}</option>`);
                $("#ddlModelo").html(html).prop("disabled", false);
            });
        }
    });

    // Quando o usuário escolhe um MODELO na FIPE
    $("#ddlModelo").on("change", function () {
        var marcaId = $("#ddlMarca").val();
        var modeloId = $(this).val();

        $("#ddlAno").html('<option value="">Carregando...</option>').prop("disabled", true);

        if (modeloId) {
            $.get(`${FIPE_BASE}/${marcaId}/modelos/${modeloId}/anos`, function (data) {
                var html = '<option value="">Selecione o Ano</option>';
                data.forEach(function (a) {
                    if (a.codigo === "32000-1" || a.nome.startsWith("32000")) return; // ← filtro
                    let anoReal = a.nome.substring(0, 4);
                    html += `<option value="${anoReal}">${a.nome}</option>`;
                });
                $("#ddlAno").html(html).prop("disabled", false);
            });
        }
    });


    // Quando escolhe o ANO
    $("#ddlAno").on("change", function () {
        $("#txtAnoValor").val($(this).val());
    });

    $("#formVeiculo").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });

    $(document).on("blur", "#txtCepCR", function () {
        var cep = $(this).val().replace(/\D/g, '');
        if (cep.length === 8) {
            buscarCepCR();
        }
    });


    $(document).on("click", function (e) {
        if (!$(e.target).closest("#txtBuscaCliente, #dropdownClientes").length) {
            $("#dropdownClientes").hide();
        }
    });

    $("#txtBuscaCliente").on("input", function () {
        var termo = $(this).val().trim().toLowerCase();
        if (termo.length < 2) {
            $("#dropdownClientes").hide();
            return;
        }

        var filtrados = _todosClientes.filter(function (c) {
            var tel = "";
            if (c.contatos && c.contatos.length > 0) tel = c.contatos[0].contato || "";
            return c.nome.toLowerCase().includes(termo)
                || (c.cpfCnpj && c.cpfCnpj.includes(termo))
                || tel.includes(termo);
        });

        if (filtrados.length === 0) {
            $("#dropdownClientes").html(`
            <div class="list-group-item text-muted d-flex justify-content-between align-items-center">
                <span><i class="fas fa-user-slash mr-2"></i>Nenhum cliente encontrado.</span>
                <button type="button" class="btn btn-sm text-white font-weight-bold" 
                        style="background-color:var(--emerald-500);border-radius:6px;"
                        onclick="abrirModalNovoClienteVeiculo()">
                    <i class="fas fa-user-plus mr-1"></i> Cadastrar
                </button>
            </div>
        `).show();
            return;
        }

        var html = "";
        filtrados.slice(0, 8).forEach(function (c) {
            var tel = (c.contatos && c.contatos.length > 0) ? (c.contatos[0].contato || "") : "";
            html += `
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onclick="selecionarCliente('${c.id}', '${c.nome.replace(/'/g, "\\'")}')">
                <div>
                    <strong>${c.nome}</strong>
                    ${tel ? `<small class="text-muted ml-2"><i class="fas fa-phone mr-1"></i>${tel}</small>` : ""}
                </div>
                <small class="text-muted">${c.cpfCnpj || ""}</small>
            </button>
        `;
        });
        $("#dropdownClientes").html(html).show();
    });

    $("#modalClienteRapido").on("hidden.bs.modal", function () {
        // Remove backdrops extras, mantém o do modal de veículo
        setTimeout(function () {
            $(".modal-backdrop").not(":first").remove();
            if ($("#modalVeiculo").hasClass("show")) {
                $("body").addClass("modal-open");
            }
        }, 100);
    });

});

$.ajaxSetup({
    beforeSend: function (xhr) {
        if (!this.url.includes("parallelum.com") && !this.url.includes("viacep.com")) {
            try {
                var token = localStorage.getItem("jwt_token");
                if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);
            } catch (e) {
                console.warn("Token não disponível:", e);
            }
        }
    }
});



function carregarMarcasFipe() {
    $.get(FIPE_BASE, function (dados) {
        var html = '<option value="">Selecione a Marca</option>';
        dados.forEach(m => html += `<option value="${m.codigo}">${m.nome}</option>`);
        $("#ddlMarca").html(html);
    });
}

function carregarVeiculos() {
    $.ajax({
        url: _url + "api/Oficina/Veiculos",
        type: "GET",
        success: function (dados) {
            var html = "";
            dados.forEach(function (v) {
                html += `
                 <tr style="border-bottom: 1px solid var(--zinc-100);">
            <td class="pl-4 py-3 align-middle">
                <span class="plate-badge">${v.placa}</span>
            </td>
            <td class="py-3 align-middle">
                <div class="font-weight-bold" style="color: var(--zinc-900);">${v.marca} ${v.modelo}</div>
            </td>
            <td class="py-3 text-muted align-middle">${v.anoFabricacao}/${v.anoModelo} <span class="badge bg-light border ml-1">${v.cor}</span></td>
            <td class="py-3 font-weight-bold text-muted align-middle"><i class="fas fa-user-circle mr-1"></i> ${v.nomeCliente}</td>
            <td class="py-3 text-center align-middle">
                <button class="btn btn-sm btn-light border shadow-sm text-primary mr-1" onclick="editar('${v.id}')"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="deletar('${v.id}', '${v.placa}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
                `;
            });
            $("#tbVeiculos tbody").html(html || '<tr><td colspan="5" class="text-center py-4">Nenhum veículo encontrado.</td></tr>');
        }
    });
}

function abrirModal() {
    $("#formVeiculo")[0].reset();
    $("#txtId").val("");
    // Limpa busca cliente
    $("#hdnClienteId").val("");
    $("#txtBuscaCliente").val("");
    $("#clienteSelecionadoBadge").hide();
    $("#dropdownClientes").hide();

    $("#ddlModelo, #ddlAno").html('<option value="">Selecione a marca primeiro</option>').prop("disabled", true);
    $("#modalTitle").html('<i class="fas fa-plus mr-2"></i> Novo Veículo');
    $("#modalVeiculo").modal("show");
}


function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    // Como usamos o select da Fipe que mistura nome e código, precisamos extrair apenas os nomes pro banco
    var textoMarca = $("#ddlMarca option:selected").text();
    var textoModelo = $("#ddlModelo option:selected").text();
    var textoAno = $("#ddlAno option:selected").text();

    var anoFab = 0;
    var anoMod = 0;

    if (textoAno.includes("Gasolina") || textoAno.includes("Diesel") || textoAno.includes("Alcool") || textoAno.includes("Flex")) {
        var partesAno = textoAno.split(" ");
        anoFab = parseInt(partesAno[0]);
        anoMod = parseInt(partesAno[0]);
    } else {
        anoFab = 2024; // fallback se falhar a API
        anoMod = 2024;
    }
  
    var dados = {
        clienteId: $("#hdnClienteId").val(),
        placa: $("#txtPlaca").val(),
        marca: isEdicao && textoMarca === "Selecione a Marca" ? $("#ddlMarca").data("nome-antigo") : textoMarca,
        modelo: isEdicao && textoModelo === "Selecione a marca primeiro" ? $("#ddlModelo").data("nome-antigo") : textoModelo,
        anoFabricacao: anoFab,
        anoModelo: anoMod,
        cor: $("#txtCor").val(),
        observacoes: $("#txtObs").val(),
        kmAtual: parseInt($("#txtKm").val()) || 0 // Puxa o KM da tela
    };

    if (isEdicao) {
        dados.id = id;
    }

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({        
        url: isEdicao ? `${_url}api/Oficina/Veiculos/${id}` : `${_url}api/Oficina/Veiculos`,
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalVeiculo").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Veículo salvo.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarVeiculos();
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível salvar.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('Salvar Veículo');
        }
    });
}

function editar(id) {
    $.get(`${_url}api/Oficina/Veiculos/${id}`, function (v) {

        // --- IDs e campos simples ---
        $("#txtId").val(v.id);
        $("#txtPlaca").val(v.placa.toUpperCase());
        $("#txtCor").val(v.cor);
        $("#txtObs").val(v.observacoes);
        $("#txtKm").val(v.kmAtual);

        // --- Proprietário ---
        var clienteId = v.clienteId;
        var nomeCliente = v.nomeCliente || v.clienteNome || v.cliente || "";

        // Tenta buscar no cache local se não veio da API
        if (!nomeCliente && clienteId) {
            var clienteCache = _todosClientes.find(function (c) { return c.id == clienteId; });
            if (clienteCache) nomeCliente = clienteCache.nome;
        }

        // Último recurso: busca direto na API de forma síncrona
        if (!nomeCliente && clienteId) {
            $.ajax({
                url: `${_url}api/Oficina/Clientes/${clienteId}`,
                async: false,
                success: function (c) { nomeCliente = c.nome; }
            });
        }

        $("#hdnClienteId").val(clienteId);
        $("#txtBuscaCliente").val(nomeCliente);
        $("#clienteSelecionadoNome").text(nomeCliente);
        if (nomeCliente) {
            $("#clienteSelecionadoBadge").show();
        }

        // --- Marca / Modelo / Ano via FIPE ---
        carregarMarcasParaEdicao(v.marca, v.modelo, v.anoFabricacao);

        // --- Abre o modal ---
        $("#modalTitle").html(`<i class="fas fa-car-side mr-2 text-emerald-500"></i> Editar Veículo`);
        $("#modalVeiculo").modal("show");
    });
}

function carregarMarcasParaEdicao(marcaNome, modeloNome, anoFab) {
    $("#ddlMarca").html('<option value="">Carregando marcas...</option>').prop("disabled", true);
    $("#ddlModelo").html('<option value="">Aguardando...</option>').prop("disabled", true);
    $("#ddlAno").html('<option value="">Aguardando...</option>').prop("disabled", true);

    $.get(FIPE_BASE, function (marcas) {
        var htmlMarcas = '<option value="">Selecione a Marca</option>';
        var marcaId = null;

        marcas.forEach(function (m) {
            var selected = m.nome === marcaNome ? 'selected' : '';
            if (m.nome === marcaNome) marcaId = m.codigo;
            htmlMarcas += `<option value="${m.codigo}" ${selected}>${m.nome}</option>`;
        });

        $("#ddlMarca").html(htmlMarcas).prop("disabled", false);

        if (!marcaId) return; // marca não encontrada na FIPE, encerra aqui

        // Carrega modelos da marca encontrada
        $.get(`${FIPE_BASE}/${marcaId}/modelos`, function (data) {
            var htmlModelos = '<option value="">Selecione o Modelo</option>';
            var modeloId = null;

            data.modelos.forEach(function (m) {
                var selected = m.nome === modeloNome ? 'selected' : '';
                if (m.nome === modeloNome) modeloId = m.codigo;
                htmlModelos += `<option value="${m.codigo}" ${selected}>${m.nome}</option>`;
            });

            $("#ddlModelo").html(htmlModelos).prop("disabled", false);

            if (!modeloId) return; // modelo não encontrado, encerra aqui

            // Carrega anos do modelo encontrado
            $.get(`${FIPE_BASE}/${marcaId}/modelos/${modeloId}/anos`, function (anos) {
                var htmlAnos = '<option value="">Selecione o Ano</option>';

                anos.forEach(function (a) {
                    // Ignora o "Zero KM" que a FIPE representa como 32000
                    if (a.codigo === "32000-1" || a.nome.startsWith("32000")) return;

                    var anoReal = a.nome.substring(0, 4);
                    var selected = parseInt(anoReal) === parseInt(anoFab) ? 'selected' : '';
                    htmlAnos += `<option value="${anoReal}" ${selected}>${a.nome}</option>`;
                });

                $("#ddlAno").html(htmlAnos).prop("disabled", false);
            });
        });
    });
}


function carregarMarcasParaEdicao(marcaNome, modeloNome, anoFab) {
    $.get(FIPE_BASE, function (marcas) {
        // Monta o select de marcas completo
        var htmlMarcas = '<option value="">Selecione a Marca</option>';
        var marcaId = null;

        marcas.forEach(function (m) {
            var selected = m.nome === marcaNome ? 'selected' : '';
            if (m.nome === marcaNome) marcaId = m.codigo;
            htmlMarcas += `<option value="${m.codigo}" ${selected}>${m.nome}</option>`;
        });

        $("#ddlMarca").html(htmlMarcas);

        // Se encontrou a marca, carrega os modelos dela
        if (marcaId) {
            $("#ddlModelo").html('<option value="">Carregando...</option>').prop("disabled", true);
            $("#ddlAno").html('<option value="">Aguardando...</option>').prop("disabled", true);

            $.get(`${FIPE_BASE}/${marcaId}/modelos`, function (data) {
                var htmlModelos = '<option value="">Selecione o Modelo</option>';
                var modeloId = null;

                data.modelos.forEach(function (m) {
                    var selected = m.nome === modeloNome ? 'selected' : '';
                    if (m.nome === modeloNome) modeloId = m.codigo;
                    htmlModelos += `<option value="${m.codigo}" ${selected}>${m.nome}</option>`;
                });

                $("#ddlModelo").html(htmlModelos).prop("disabled", false);

                // Se encontrou o modelo, carrega os anos
                if (modeloId) {
                    $.get(`${FIPE_BASE}/${marcaId}/modelos/${modeloId}/anos`, function (anos) {
                        var htmlAnos = '<option value="">Selecione o Ano</option>';

                        anos.forEach(function (a) {
                            // Ignora o "Zero KM" que a FIPE representa como 32000
                            if (a.codigo === "32000-1" || a.nome.startsWith("32000")) return;

                            let anoReal = a.nome.substring(0, 4);
                            let selected = parseInt(anoReal) === anoFab ? 'selected' : '';
                            htmlAnos += `<option value="${anoReal}" ${selected}>${a.nome}</option>`;
                        });


                        $("#ddlAno").html(htmlAnos).prop("disabled", false);
                    });
                }
            });
        }
    });
}


function deletar(id, placa) {
    Swal.fire({
        title: 'Remover Veículo?',
        text: `A placa ${placa} será removida do sistema.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, remover!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${_url}api/Oficina/Veiculos/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Removido!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarVeiculos();
                }
            });
        }
    });
}

function carregarClientesCache() {
    $.get(_url + "api/Oficina/Clientes", function (dados) {
        _todosClientes = dados;
    });
}

function selecionarCliente(id, nome) {
    $("#hdnClienteId").val(id);
    $("#txtBuscaCliente").val(nome);
    $("#clienteSelecionadoNome").text(nome);
    $("#clienteSelecionadoBadge").show();
    $("#dropdownClientes").hide();
}

function limparClienteSelecionado() {
    $("#hdnClienteId").val("");
    $("#txtBuscaCliente").val("").focus();
    $("#clienteSelecionadoBadge").hide();
}

// ============================================================
// MODAL RÁPIDO DE CADASTRO DE CLIENTE (dentro de veiculos.js)
// ============================================================

function abrirModalNovoClienteVeiculo() {
    $("#formClienteRapido")[0].reset();
    $("#txtIdCR").val("");
    $("#boxContatosCR").empty();
    adicionarLinhaContatoCR();

    $("#modalClienteRapido").modal({ backdrop: false, keyboard: false });
    $("#modalClienteRapido").modal("show");
    $("body").addClass("modal-open");

    // Aplica máscaras APÓS abrir o modal
    setTimeout(function () {
        $('#txtCepCR').mask('00000-000');
        $('#txtCpfCnpjCR').mask(cpfCnpjBehaviorCR, cpfCnpjOptionsCR); // ← CR
    }, 400);

}


function fecharModalClienteRapido() {
    $("#modalClienteRapido").modal("hide");

    // Força limpeza do backdrop duplicado
    setTimeout(function () {
        $(".modal-backdrop").not(":first").remove();
        $("body").addClass("modal-open"); // mantém o modal de veículo ativo
    }, 300);
}

function adicionarLinhaContatoCR(tel = "", email = "", obs = "") {
    var idLinha = 'contatoCR_' + Math.random().toString(36).substr(2, 9);

    var telFormatado = formatarTelExibicao(tel);

    var html = `
        <div class="row mb-2 align-items-center linha-contato-cr" id="${idLinha}">
            <div class="col-md-3">
                <input type="text" class="form-control form-control-sm txt-tel-cr" 
                       placeholder="(00) 00000-0000" value="${telFormatado}" 
                       style="border-radius:6px;" maxlength="15">
            </div>
            <div class="col-md-4">
                <input type="email" class="form-control form-control-sm txt-email-cr" 
                       placeholder="E-mail" value="${email}" style="border-radius:6px;">
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm txt-obs-cr" 
                       placeholder="Ex: Falar com a esposa" value="${obs}" style="border-radius:6px;">
            </div>
            <div class="col-md-1 text-center">
                <button type="button" class="btn btn-sm btn-outline-danger border-0" 
                        onclick="$('#${idLinha}').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    $("#boxContatosCR").append(html);

    $(`#${idLinha} .txt-tel-cr`).mask(telBehaviorCR, telOptionsCR);
}

// Formata número limpo do banco para exibição: "11999998888" → "(11) 99999-8888"
function formatarTelExibicao(tel) {
    if (!tel) return "";
    var limpo = tel.replace(/\D/g, '');
    if (limpo.length === 11) {
        return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (limpo.length === 10) {
        return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return tel; // retorna como veio se não bater o tamanho
}


function buscarCepCR() {
    var cep = $("#txtCepCR").val().replace(/\D/g, ''); // \D sem escape duplo
    if (cep.length === 8) {
        $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function (dados) {
            if (!("erro" in dados)) {
                $("#txtLogradouroCR").val(dados.logradouro);
                $("#txtBairroCR").val(dados.bairro);
                $("#txtCidadeCR").val(dados.localidade);
                $("#txtUfCR").val(dados.uf);
                $("#txtNumeroCR").focus();
            } else {
                Swal.fire('CEP não encontrado', 'Verifique o número digitado.', 'warning');
            }
        }).fail(function () {
            Swal.fire('Erro', 'Não foi possível consultar o CEP.', 'error');
        });
    }
}


$("#formClienteRapido").on("submit", function (e) {
    e.preventDefault();
    salvarClienteRapido();
});

function salvarClienteRapido() {
    var listaContatos = [];
    $(".linha-contato-cr").each(function () {
        var tel = $(this).find(".txt-tel-cr").val().replace(/\D/g, ''); // ← limpo
        var email = $(this).find(".txt-email-cr").val();
        var obs = $(this).find(".txt-obs-cr").val();

        if (tel !== "" || email !== "") {
            listaContatos.push({ contato: tel, email: email, observacao: obs });
        }
    });


    var dados = {
        nome: $("#txtNomeCR").val(),
        cpfCnpj: $("#txtCpfCnpjCR").val().replace(/\D/g, ''),
        cep: $("#txtCepCR").val().replace(/\D/g, ''),
        logradouro: $("#txtLogradouroCR").val(),
        numero: $("#txtNumeroCR").val(),
        bairro: $("#txtBairroCR").val(),
        cidade: $("#txtCidadeCR").val(),
        estado: $("#txtUfCR").val(),
        contatos: listaContatos
    };

    var $btn = $("#btnSalvarCR");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: _url + "api/Oficina/Clientes",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function (novoCliente) {
            // Atualiza o cache
            _todosClientes.push(novoCliente);

            // Seleciona automaticamente o cliente recém-criado
            selecionarCliente(novoCliente.id, novoCliente.nome);

            fecharModalClienteRapido();
            Swal.fire({ title: 'Cliente cadastrado!', text: `${novoCliente.nome} selecionado.`, icon: 'success', timer: 1800, showConfirmButton: false });
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível salvar o cliente.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar e Selecionar');
        }
    });
}
