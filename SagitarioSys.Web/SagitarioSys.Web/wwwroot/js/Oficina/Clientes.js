
$(document).ready(function () {
    carregarClientes();

    // INTEGRAÇÃO VIACEP
    // INTEGRAÇÃO VIACEP
    $("#txtCep").on("blur", function () {
        var cep = $(this).val().replace(/\D/g, '');
        if (cep !== "" && cep.length === 8) {
            $("#iconeCep").html('<i class="fas fa-spinner fa-spin text-primary"></i>');

            $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function (dados) {
                if (!("erro" in dados)) {
                    $("#txtLogradouro").val(dados.logradouro);
                    $("#txtBairro").val(dados.bairro);
                    $("#txtCidade").val(dados.localidade);
                    $("#txtUf").val(dados.uf); // CORREÇÃO AQUI: txtUf
                    $("#txtNumero").focus();
                } else {
                    Swal.fire('CEP não encontrado', 'Verifique o número digitado.', 'warning');
                }
            }).always(function () {
                $("#iconeCep").html('<i class="fas fa-search"></i>');
            });
        }
    });

    $("#formCliente").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });

    $('#txtCep').mask('00000-000');
    $('#txtCpfCnpj').mask(cpfCnpjBehavior, cpfCnpjOptions);
});

// ==========================================
// CONFIGURAÇÕES DAS MÁSCARAS INTELIGENTES
// ==========================================
var cpfCnpjBehavior = function (val) {
    return val.replace(/\D/g, '').length <= 11 ? '000.000.000-009' : '00.000.000/0000-00';
},
    cpfCnpjOptions = {
        onKeyPress: function (val, e, field, options) {
            field.mask(cpfCnpjBehavior.apply({}, arguments), options);
        }
    };

var telBehavior = function (val) {
    return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
},
    telOptions = {
        onKeyPress: function (val, e, field, options) {
            field.mask(telBehavior.apply({}, arguments), options);
        }
    };



// ==========================================
// LÓGICA DAS LINHAS DINÂMICAS DE CONTATO
// ==========================================
function adicionarLinhaContato(tel = "", email = "", obs = "") {
    var idLinha = 'contato_' + Math.random().toString(36).substr(2, 9);

    // Formata o telefone para exibição se vier do banco (só números)
    var telFormatado = formatarTelExibicao(tel);

    var html = `
        <div class="row mb-2 align-items-center linha-contato" id="${idLinha}">
            <div class="col-md-3">
                <input type="text" class="form-control form-control-sm txt-tel" 
                       placeholder="(00) 00000-0000" value="${telFormatado}" 
                       style="border-radius: 6px;" maxlength="15">
            </div>
            <div class="col-md-4">
                <input type="email" class="form-control form-control-sm txt-email" 
                       placeholder="E-mail" value="${email}" style="border-radius: 6px;">
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm txt-obs" 
                       placeholder="Ex: Falar com a esposa" value="${obs}" style="border-radius: 6px;">
            </div>
            <div class="col-md-1 text-center">
                <button type="button" class="btn btn-sm btn-outline-danger border-0 shadow-none" 
                        onclick="$('#${idLinha}').remove()" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    $("#boxContatos").append(html);

    // Aplica máscara após inserir no DOM
    $(`#${idLinha} .txt-tel`).mask(telBehavior, telOptions);
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

function removerLinha(botao) {
    $(botao).closest('.contato-row').remove();
}

// ==========================================
// CRUD PRINCIPAL
// ==========================================
function carregarClientes() {
    $.ajax({
        url: _url + "api/Oficina/Clientes",
        type: "GET",
        success: function (dados) {
            var html = "";
            dados.forEach(function (c) {
                var local = c.cidade ? `${c.cidade}/${c.estado}` : '<span class="text-muted">Não informado</span>';
                var qtdContatos = c.contatos ? c.contatos.length : 0;

                html += `
                  <tr style="border-bottom: 1px solid var(--zinc-100);">
            <td class="pl-4 py-3 font-weight-bold" style="color: var(--zinc-900);">${c.nome}</td>
            <td class="py-3">${c.cpfCnpj || '-'}</td>
            <td class="py-3 text-muted">${local}</td>
            <td class="py-3 text-center"><span class="badge" style="background-color: #f0fdf4; color: #22c55e; border: 1px solid #bbf7d0; font-weight: 600;">${qtdContatos} Contato(s)</span></td>
            <td class="py-3 text-center">
                <button class="btn btn-sm btn-light border shadow-sm text-primary mr-1" onclick="editar('${c.id}')"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="deletar('${c.id}', '${c.nome}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
                `;
            });
            $("#tbClientes tbody").html(html || '<tr><td colspan="5" class="text-center py-4">Nenhum cliente encontrado.</td></tr>');
        }
    });
}

function abrirModal() {
    $("#formCliente")[0].reset();
    $("#txtId").val("");
    $("#boxContatos").empty();

    // Inicia com uma linha vazia por padrão
    adicionarLinhaContato();

    $("#modalTitle").html('<i class="fas fa-user-plus mr-2"></i> Novo Cliente');
    $("#modalCliente").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    let cpfCnpjLimpo = $("#txtCpfCnpj").val().replace(/\D/g, '');
    let cepLimpo = $("#txtCep").val().replace(/\D/g, '');

    var listaContatos = [];

    // CORREÇÃO: A classe certa do HTML novo é .linha-contato
    $(".linha-contato").each(function () {
        let telLimpo = $(this).find(".txt-tel").val().replace(/\D/g, '');
        // CORREÇÃO: As classes certas são com traço
        var email = $(this).find(".txt-email").val();
        var obs = $(this).find(".txt-obs").val();

        // CORREÇÃO: Valida usando a variável telLimpo
        if (telLimpo !== "" || email !== "") {
            listaContatos.push({
                contato: telLimpo,
                email: email,
                observacao: obs
            });
        }
    });

    var dados = {
        nome: $("#txtNome").val(),
        cpfCnpj: cpfCnpjLimpo,
        cep: cepLimpo,
        logradouro: $("#txtLogradouro").val(),
        numero: $("#txtNumero").val(),
        bairro: $("#txtBairro").val(),
        cidade: $("#txtCidade").val(),
        estado: $("#txtUf").val(), // CORREÇÃO: Era txtEstado
        contatos: listaContatos
    };

    // CORREÇÃO DO ERRO 400: Adiciona o ID no pacote
    if (isEdicao) {
        dados.id = id;
    }

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${_url}api/Oficina/Clientes/${id}` : _url + "api/Oficina/Clientes",
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalCliente").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Cliente salvo.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarClientes();
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível salvar o cliente.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar Cliente');
        }
    });
}

function editar(id) {
    $.get(`${_url}api/Oficina/Clientes/${id}`, function (c) {
        $("#txtId").val(c.id);
        $("#txtNome").val(c.nome);
        $("#txtCpfCnpj").val(c.cpfCnpj).trigger('input');
        $("#txtCep").val(c.cep).trigger('input');
        $("#txtLogradouro").val(c.logradouro);
        $("#txtNumero").val(c.numero);
        $("#txtBairro").val(c.bairro);
        $("#txtCidade").val(c.cidade);

        // CORREÇÃO: Atualiza o campo txtUf com a propriedade UF (ou estado) que vem da API
        $("#txtUf").val(c.uf || c.estado);

        $("#boxContatos").empty();
        if (c.contatos && c.contatos.length > 0) {
            c.contatos.forEach(contato => {
                adicionarLinhaContato(contato.contato, contato.email, contato.observacao);
            });
        } else {
            adicionarLinhaContato();
        }

        $("#modalTitle").html('<i class="fas fa-user-edit mr-2"></i> Editar Cliente');
        $("#modalCliente").modal("show");
    });
}

function deletar(id, nome) {
    Swal.fire({
        title: 'Excluir Cliente?',
        text: `Tem certeza que deseja inativar ${nome}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${_url}api/Oficina/Clientes/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Excluído!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarClientes();
                },
                error: function () {
                    Swal.fire('Aviso', 'Não foi possível excluir. Este cliente já possui veículos cadastrados.', 'warning');
                }
            });
        }
    });
}