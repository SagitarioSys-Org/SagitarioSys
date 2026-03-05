
$(document).ready(function () {
    carregarSegmentos();

    $("#formSegmento").on("submit", function (e) {
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

function carregarSegmentos() {
    $.ajax({
        url: _url + "api/Segmentos",
        type: "GET",
        success: function (dados) {
            var html = "";
            dados.forEach(function (seg) {
                var status = seg.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-danger">Inativo</span>';
                html += `
                    <tr>
                        <td class="font-weight-bold align-middle">${seg.nome}</td>
                        <td class="text-center align-middle">${status}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-info mr-1" onclick="editar('${seg.id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deletar('${seg.id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
            $("#tbSegmentos tbody").html(html);
        }
    });
}

function abrirModal() {
    $("#formSegmento")[0].reset();
    $("#txtId").val("");
    $("#chkAtivo").prop("checked", true);
    $("#modalTitle").html('<i class="fas fa-plus mr-2"></i> Novo Segmento');
    $("#modalSegmento").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    var dados = {
        nome: $("#txtNome").val(),
        ativo: $("#chkAtivo").is(":checked")
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${_url}api/Segmentos/${id}` : _url + "api/Segmentos",
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalSegmento").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Salvo com sucesso.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarSegmentos();
        },
        error: function (xhr) {
            Swal.fire('Erro!', xhr.responseJSON?.message || 'Erro ao salvar.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar');
        }
    });
}

function editar(id) {
    $.get(`${_url}/api/Segmentos/${id}`, function (seg) {
        $("#txtId").val(seg.id);
        $("#txtNome").val(seg.nome);
        $("#chkAtivo").prop("checked", seg.ativo);
        $("#modalTitle").html('<i class="fas fa-edit mr-2"></i> Editar Segmento');
        $("#modalSegmento").modal("show");
    });
}

function deletar(id) {
    Swal.fire({
        title: 'Tem certeza?',
        text: "O segmento será inativado.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, inativar!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${_url}api/Segmentos/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Inativado!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarSegmentos();
                },
                error: function (xhr) {
                    Swal.fire('Erro!', xhr.responseJSON?.message || 'Erro ao excluir.', 'error');
                }
            });
        }
    });
}