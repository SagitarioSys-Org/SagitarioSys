const API_CLIENTES = "https://localhost:44373/api/Clientes";

$(document).ready(function () {
    carregarClientes();

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
                    $("#txtEstado").val(dados.uf);
                    $("#txtNumero").focus(); // Joga o cursor para o número
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
});

$.ajaxSetup({
    beforeSend: function (xhr) {
        if (!this.url.includes("viacep.com")) {
            var token = localStorage.getItem("jwt_token");
            if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
    }
});

// ==========================================
// LÓGICA DAS LINHAS DINÂMICAS DE CONTATO
// ==========================================
function adicionarLinhaContato(contato = "", email = "", obs = "") {
    var html = `
        <div class="row contato-row mb-2">
            <div class="col-md-3">
                <input type="text" class="form-control form-control-sm txtTel" placeholder="Telefone/Celular" value="${contato}">
            </div>
            <div class="col-md-4">
                <input type="email" class="form-control form-control-sm txtEmail" placeholder="E-mail" value="${email}">
            </div>
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm txtObs" placeholder="Observação (Ex: Recado)" value="${obs}">
            </div>
            <div class="col-md-1 text-center">
                <button type="button" class="btn btn-danger btn-sm" onclick="removerLinha(this)" title="Remover"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    $("#boxContatos").append(html);
}

function removerLinha(botao) {
    $(botao).closest('.contato-row').remove();
}

// ==========================================
// CRUD PRINCIPAL
// ==========================================
function carregarClientes() {
    $.ajax({
        url: API_CLIENTES,
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

    // MÁGICA: Varre todas as linhas de contato e monta o Array
    var listaContatos = [];
    $(".contato-row").each(function () {
        var tel = $(this).find(".txtTel").val();
        var email = $(this).find(".txtEmail").val();
        var obs = $(this).find(".txtObs").val();

        // Só adiciona se o cara digitou o telefone OU o email
        if (tel !== "" || email !== "") {
            listaContatos.push({
                contato: tel,
                email: email,
                observacao: obs
            });
        }
    });

    var dados = {
        nome: $("#txtNome").val(),
        cpfCnpj: $("#txtCpfCnpj").val(),
        cep: $("#txtCep").val(),
        logradouro: $("#txtLogradouro").val(),
        numero: $("#txtNumero").val(),
        bairro: $("#txtBairro").val(),
        cidade: $("#txtCidade").val(),
        estado: $("#txtEstado").val(),
        contatos: listaContatos // Envia a lista para a API (Transaction C# vai cuidar do resto)
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${API_CLIENTES}/${id}` : API_CLIENTES,
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
    $.get(`${API_CLIENTES}/${id}`, function (c) {
        $("#txtId").val(c.id);
        $("#txtNome").val(c.nome);
        $("#txtCpfCnpj").val(c.cpfCnpj);
        $("#txtCep").val(c.cep);
        $("#txtLogradouro").val(c.logradouro);
        $("#txtNumero").val(c.numero);
        $("#txtBairro").val(c.bairro);
        $("#txtCidade").val(c.cidade);
        $("#txtEstado").val(c.estado);

        // Limpa a caixa e recria as linhas baseadas no que veio do banco
        $("#boxContatos").empty();
        if (c.contatos && c.contatos.length > 0) {
            c.contatos.forEach(contato => {
                adicionarLinhaContato(contato.contato, contato.email, contato.observacao);
            });
        } else {
            adicionarLinhaContato(); // Se não tiver nada, bota uma linha vazia
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
                url: `${API_CLIENTES}/${id}`,
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