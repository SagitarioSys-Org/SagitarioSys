
$(document).ready(function () {
    carregarSegmentos(); // Busca "Oficina, Loja de Roupas" direto do banco
    carregarAssinantes();

    $("#formAssinante").on("submit", function (e) {
        e.preventDefault();
        salvarAssinante();
    });
});

$.ajaxSetup({
    beforeSend: function (xhr) {
        var token = localStorage.getItem("jwt_token");
        if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);
    }
});

// NOVO: Preenche o <select> do Modal dinamicamente
function carregarSegmentos() {
    $.ajax({
        url: _url + "api/Segmentos/ativos",
        type: "GET",
        success: function (dados) {
            var html = '<option value="">Selecione...</option>';
            dados.forEach(function (seg) {
                html += `<option value="${seg.id}">${seg.nome}</option>`;
            });
            $("#ddlSegmento").html(html);
        }
    });
}

function carregarAssinantes() {
    $.ajax({
        url: _url + "api/Assinantes",
        type: "GET",
        success: function (dados) {
            var html = "";
            if (dados.length === 0) {
                html = '<tr><td colspan="5" class="text-center py-3">Nenhuma empresa cadastrada.</td></tr>';
            } else {
                dados.forEach(function (empresa) {
                    var status = empresa.ativo
                        ? '<span class="badge badge-success">Ativo</span>'
                        : '<span class="badge badge-danger">Inativo</span>';

                    html += `
                        <tr>
                            <td class="font-weight-bold">${empresa.nomeFantasia}</td>
                            <td>${empresa.cnpjCpf}</td>
                            <td>${empresa.nomeSegmento}</td> <td>${status}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-info mr-1" onclick="editar('${empresa.id}')"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deletar('${empresa.id}', '${empresa.nomeFantasia}')"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }
            $("#tabelaAssinantes tbody").html(html);
        }
    });
}

function abrirModalNovo() {
    $("#txtEmpresaId").val("");
    $("#formAssinante")[0].reset();
    $("#modalTitle").html('<i class="fas fa-building mr-2"></i> Novo Assinante');
    $("#areaUsuarioAdmin").show();
    $("#txtEmailAdmin, #txtSenhaAdmin, #txtNomeAdmin").prop("required", true);
    $("#modalAssinante").modal("show");
}

function salvarAssinante() {
    var id = $("#txtEmpresaId").val();
    var isEdicao = id !== "";
    var metodo = isEdicao ? "PUT" : "POST";
    var url = isEdicao ? `${_url}api/Assinantes/${id}` : _url + "api/Assinantes";

    var dados = {
        nomeFantasia: $("#txtNomeFantasia").val(),
        cnpjCpf: $("#txtCnpj").val(),
        segmentoId: $("#ddlSegmento").val(), // CORRIGIDO AQUI
        nomeAdmin: $("#txtNomeAdmin").val(),
        emailAdmin: $("#txtEmailAdmin").val(),
        senhaAdmin: $("#txtSenhaAdmin").val()
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: url,
        type: metodo,
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalAssinante").modal("hide");
            Swal.fire('Sucesso!', 'Empresa salva com sucesso.', 'success');
            carregarAssinantes();
        },
        error: function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.message : "Erro ao salvar.";
            Swal.fire('Erro!', msg, 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar Empresa');
        }
    });
}

function editar(id) {
    $("#formAssinante")[0].reset();
    $.ajax({
        url: `${_url}api/Assinantes/${id}`,
        type: "GET",
        success: function (empresa) {
            $("#txtEmpresaId").val(empresa.id);
            $("#txtNomeFantasia").val(empresa.nomeFantasia);
            $("#txtCnpj").val(empresa.cnpjCpf);
            $("#ddlSegmento").val(empresa.segmentoId); // CORRIGIDO AQUI

            $("#modalTitle").html('<i class="fas fa-edit mr-2"></i> Editar Empresa');
            $("#areaUsuarioAdmin").hide();
            $("#txtEmailAdmin, #txtSenhaAdmin, #txtNomeAdmin").prop("required", false);
            $("#modalAssinante").modal("show");
        }
    });
}

function deletar(id, nome) {
    Swal.fire({
        title: 'Você tem certeza?',
        text: `Deseja inativar a empresa ${nome}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, inativar!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${_url}api/Assinantes/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire('Inativado!', 'A empresa foi inativada.', 'success');
                    carregarAssinantes();
                }
            });
        }
    });
}