const API_MENUS = "https://localhost:44373/api/Menus";
const API_SEGMENTOS = "https://localhost:44373/api/Segmentos"; // Pega todos os segmentos (para o CEO)
const API_ASSINANTES = "https://localhost:44373/api/Assinantes";

$(document).ready(function () {
    // Carrega tudo ao iniciar a tela
    carregarListasAuxiliares();
    carregarMenus();

    // Evento para atualizar o ícone visualmente enquanto você digita no input
    $("#txtIcone").on("keyup", function () {
        var iconeClasse = $(this).val();
        $("#iconePreview").attr("class", iconeClasse);
    });

    $("#formMenu").on("submit", function (e) {
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

// Preenche os dois <select> do Modal
function carregarListasAuxiliares() {
    // 1. Carrega os Segmentos
    $.get(API_SEGMENTOS, function (dados) {
        var html = '<option value="">Selecione o Segmento...</option>';
        dados.forEach(seg => html += `<option value="${seg.id}">${seg.nome}</option>`);
        $("#ddlSegmento").html(html);
    });

    // 2. Carrega as Empresas (Assinantes)
    $.get(API_ASSINANTES, function (dados) {
        var html = '<option value="">Não (Menu Global para o segmento)</option>';
        dados.forEach(emp => html += `<option value="${emp.id}">${emp.nomeFantasia} (CNPJ: ${emp.cnpjCpf})</option>`);
        $("#ddlEmpresa").html(html);
    });
}

function carregarMenus() {
    $.ajax({
        url: API_MENUS,
        type: "GET",
        success: function (dados) {
            var html = "";
            var segmentoAtual = ""; // Variável para rastrear a quebra de grupo

            if (dados.length === 0) {
                html = '<tr><td colspan="6" class="text-center py-4">Nenhum menu cadastrado.</td></tr>';
            } else {
                dados.forEach(function (m) {

                    // MÁGICA DO AGRUPAMENTO: Se o segmento mudou, cria uma linha divisória de destaque!
                    if (m.nomeSegmento !== segmentoAtual) {
                        html += `
                            <tr style="background-color: #e9ecef;">
                                <td colspan="6" class="text-left font-weight-bold text-uppercase text-primary py-2" style="border-top: 2px solid #dee2e6; font-size: 1.05em;">
                                    <i class="fas fa-folder-open mr-2"></i> Segmento: ${m.nomeSegmento}
                                </td>
                            </tr>
                        `;
                        segmentoAtual = m.nomeSegmento; // Atualiza o rastreador
                    }

                    // Monta o visual se for um menu VIP
                    var vip = m.empresaId
                        ? `<span class="badge badge-warning"><i class="fas fa-crown mr-1"></i> ${m.nomeEmpresa}</span>`
                        : '<span class="text-muted">Global</span>';

                    // Linha normal do Menu (agora com um recuo visual - pl-4 - no título)
                    html += `
                        <tr>
                            <td class="text-center align-middle"><i class="${m.icone} fa-lg text-secondary"></i></td>
                            <td class="font-weight-bold align-middle pl-4">${m.titulo}</td>
                            <td class="align-middle text-primary"><code>${m.rota}</code></td>
                            <td class="align-middle">${vip}</td>
                            <td class="text-center align-middle font-weight-bold">${m.ordem}</td>
                            <td class="text-center align-middle">
                                <button class="btn btn-sm btn-outline-info mr-1" onclick="editar('${m.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deletar('${m.id}', '${m.titulo}')" title="Deletar"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }

            $("#tbMenus tbody").html(html);
        },
        error: function () {
            $("#tbMenus tbody").html('<tr><td colspan="6" class="text-center text-danger py-4">Erro ao carregar os menus.</td></tr>');
        }
    });
}

function abrirModal() {
    $("#formMenu")[0].reset();
    $("#txtId").val("");
    $("#iconePreview").attr("class", "fas fa-circle text-muted");
    $("#modalTitle").html('<i class="fas fa-plus mr-2"></i> Adicionar Menu');
    $("#modalMenu").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    // Tratamento crucial: Se o ddlEmpresa estiver vazio, envia NULL para o C#
    var empresaSelecionada = $("#ddlEmpresa").val();

    var dados = {
        titulo: $("#txtTitulo").val(),
        icone: $("#txtIcone").val(),
        rota: $("#txtRota").val(),
        ordem: parseInt($("#txtOrdem").val()),
        segmentoId: $("#ddlSegmento").val(),
        empresaId: empresaSelecionada === "" ? null : empresaSelecionada
    };

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${API_MENUS}/${id}` : API_MENUS,
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalMenu").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Menu configurado.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarMenus();
        },
        error: function (xhr) {
            Swal.fire('Erro!', 'Erro ao salvar o menu.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar Menu');
        }
    });
}

function editar(id) {
    $.get(`${API_MENUS}/${id}`, function (m) {
        $("#txtId").val(m.id);
        $("#txtTitulo").val(m.titulo);
        $("#txtIcone").val(m.icone);
        $("#iconePreview").attr("class", m.icone); // Atualiza preview
        $("#txtRota").val(m.rota);
        $("#txtOrdem").val(m.ordem);
        $("#ddlSegmento").val(m.segmentoId);

        // Se for null, seta string vazia para o combo voltar a opção "Não (Global)"
        $("#ddlEmpresa").val(m.empresaId || "");

        $("#modalTitle").html('<i class="fas fa-edit mr-2"></i> Editar Menu');
        $("#modalMenu").modal("show");
    });
}

function deletar(id, titulo) {
    Swal.fire({
        title: 'Deletar Menu?',
        text: `O menu "${titulo}" vai sumir imediatamente da tela dos usuários.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, deletar!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${API_MENUS}/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Deletado!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarMenus();
                }
            });
        }
    });
}