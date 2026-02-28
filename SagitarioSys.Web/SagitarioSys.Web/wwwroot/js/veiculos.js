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
        dados.forEach(c => {
            // MÁGICA AQUI: O banco agora devolve uma lista de "Contatos" pra cada cliente.
            // Nós tentamos pegar o primeiro contato disponível (telefone ou email).
            let contatoPrincipal = "Sem Tel";
            if (c.contatos && c.contatos.length > 0) {
                contatoPrincipal = c.contatos[0].contato || c.contatos[0].email || "Sem Tel";
            }

            html += `<option value="${c.id}">${c.nome} (${contatoPrincipal})</option>`;
        });
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
        clienteId: $("#ddlCliente").val(),
        placa: $("#txtPlaca").val(),
        marca: isEdicao && textoMarca === "Selecione a Marca" ? $("#ddlMarca").data("nome-antigo") : textoMarca,
        modelo: isEdicao && textoModelo === "Selecione a marca primeiro" ? $("#ddlModelo").data("nome-antigo") : textoModelo,
        anoFabricacao: anoFab,
        anoModelo: anoMod,
        cor: $("#txtCor").val(),
        observacoes: $("#txtObs").val(),
        kmAtual: parseInt($("#txtKm").val()) || 0 // Puxa o KM da tela
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${API_VEICULOS}/${id}` : API_VEICULOS,
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
    $.get(`${API_VEICULOS}/${id}`, function (v) {
        $("#txtId").val(v.id);
        $("#ddlCliente").val(v.clienteId);

        // Joga a placa e garante o texto em maiúsculo (com a nova classe)
        $("#txtPlaca").val(v.placa.toUpperCase());

        $("#txtCor").val(v.cor);
        $("#txtObs").val(v.observacoes);
        $("#txtKm").val(v.kmAtual);

        $("#ddlMarca").html(`<option value="${v.marca}">${v.marca}</option>`);

        $("#ddlModelo").html(`<option value="${v.modelo}">${v.modelo}</option>`)
            .prop("disabled", false); // Habilita o campo

        $("#ddlAno").html(`<option value="${v.anoFabricacao} ${v.anoModelo}">${v.anoFabricacao}/${v.anoModelo}</option>`)
            .prop("disabled", false); // Habilita o campo


        $("#modalTitle").html(`<i class="fas fa-car-side mr-2 text-emerald-500"></i> Editar Veículo`);
        $("#modalVeiculo").modal("show");
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

