const API_VEICULOS = "https://localhost:44373/api/Veiculos";
const API_CLIENTES = "https://localhost:44373/api/Clientes"; // Precisamos do endpoint de clientes!
const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1/carros/marcas";

$(document).ready(function () {
    carregarClientes();
    carregarMarcasFipe();
    carregarVeiculos();

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
        $("#txtModeloNome").val($("#ddlModelo option:selected").text()); // Guarda o nome (Ex: City)

        $("#ddlAno").html('<option value="">Carregando...</option>').prop("disabled", true);

        if (modeloId) {
            $.get(`${FIPE_BASE}/${marcaId}/modelos/${modeloId}/anos`, function (data) {
                var html = '<option value="">Selecione o Ano</option>';
                data.forEach(a => {
                    // A FIPE retorna o ano no formato "2023-1". Vamos pegar só os 4 primeiros dígitos.
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
});

$.ajaxSetup({
    beforeSend: function (xhr) {
        // Envia o token para a nossa API, mas não para a API da FIPE
        if (!this.url.includes("parallelum.com")) {
            var token = localStorage.getItem("jwt_token");
            if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
    }
});

function carregarClientes() {
    $.get(API_CLIENTES, function (dados) {
        var html = '<option value="">Selecione o proprietário...</option>';
        dados.forEach(c => html += `<option value="${c.id}">${c.nome} (${c.telefone || 'Sem Tel'})</option>`);
        $("#ddlCliente").html(html);
    });
}

function carregarMarcasFipe() {
    $.get(FIPE_BASE, function (dados) {
        var html = '<option value="">Selecione a Marca</option>';
        dados.forEach(m => html += `<option value="${m.codigo}">${m.nome}</option>`);
        $("#ddlMarca").html(html);
    });
}

function carregarVeiculos() {
    $.ajax({
        url: API_VEICULOS,
        type: "GET",
        success: function (dados) {
            var html = "";
            dados.forEach(function (v) {
                html += `
                    <tr>
                        <td class="font-weight-bold align-middle">
                            <span class="border rounded p-1 bg-white text-dark">${v.placa.toUpperCase()}</span>
                        </td>
                        <td class="align-middle text-primary font-weight-bold">${v.marca} ${v.modelo}</td>
                        <td class="align-middle">${v.ano} • ${v.cor || 'N/I'}</td>
                        <td class="align-middle"><i class="fas fa-user-circle mr-1 text-muted"></i> ${v.nomeCliente}</td>
                        <td class="text-center align-middle">
                            <button class="btn btn-sm btn-outline-danger" onclick="deletar('${v.id}', '${v.placa}')"><i class="fas fa-trash"></i></button>
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
    $("#ddlModelo, #ddlAno").html('<option value="">Selecione a marca primeiro</option>').prop("disabled", true);
    $("#modalTitle").html('<i class="fas fa-plus mr-2"></i> Novo Veículo');
    $("#modalVeiculo").modal("show");
}

function salvar() {
    var dados = {
        clienteId: $("#ddlCliente").val(),
        marca: $("#txtMarcaNome").val(), // Salva o nome amigável e não o ID da FIPE
        modelo: $("#txtModeloNome").val(),
        ano: parseInt($("#txtAnoValor").val()),
        placa: $("#txtPlaca").val().toUpperCase(),
        cor: $("#txtCor").val(),
        observacoes: $("#txtObs").val()
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: API_VEICULOS,
        type: "POST",
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
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar Veículo');
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
                url: `${API_VEICULOS}/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Removido!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarVeiculos();
                }
            });
        }
    });
}