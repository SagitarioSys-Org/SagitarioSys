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

    $("#ddlSegmento").on("change", function () {
        atualizarComboMenuPai($(this).val(), $("#txtId").val());
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

// Substitua sua função carregarMenus por esta:
var todosOsMenus = []; // Variável global para guardar a lista

function carregarMenus() {
    $.ajax({
        url: API_MENUS,
        type: "GET",
        success: function (dados) {
            todosOsMenus = dados; // Guarda para usarmos no modal
            var html = "";
            var segmentoAtual = "";

            if (dados.length === 0) {
                html = '<tr><td colspan="6" class="text-center py-4">Nenhum menu cadastrado.</td></tr>';
            } else {
                dados.forEach(function (m) {
                    if (m.nomeSegmento !== segmentoAtual) {
                        html += `
                            <tr style="background-color: #e9ecef;">
                                <td colspan="6" class="text-left font-weight-bold text-uppercase text-primary py-2" style="border-top: 2px solid #dee2e6;">
                                    <i class="fas fa-folder-open mr-2"></i> Segmento: ${m.nomeSegmento}
                                </td>
                            </tr>
                        `;
                        segmentoAtual = m.nomeSegmento;
                    }

                    var vip = m.empresaId ? `<span class="badge badge-warning"><i class="fas fa-crown"></i> ${m.nomeEmpresa}</span>` : '<span class="text-muted">Global</span>';

                    // Se for filho, adiciona um visual de "Sub-item"
                    var tituloVisual = m.menuPaiId
                        ? `<span class="text-muted mr-1">↳</span> ${m.titulo} <small class="text-info">(de ${m.nomeMenuPai})</small>`
                        : `<span class="font-weight-bold">${m.titulo}</span>`;

                    html += `
                        <tr>
                            <td class="text-center align-middle"><i class="${m.icone} fa-lg text-secondary"></i></td>
                            <td class="align-middle pl-4">${tituloVisual}</td>
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
        }
    });
}

function atualizarComboMenuPai(segmentoIdSelecionado, idMenuAtual = null) {
    var html = '<option value="">Nenhum (É um menu principal)</option>';

    // Filtra para mostrar apenas menus do mesmo segmento que NÃO são filhos (evita menu infinito)
    // E garante que um menu não pode ser pai dele mesmo (idMenuAtual)
    var menusPrincipais = todosOsMenus.filter(m => m.segmentoId === segmentoIdSelecionado && !m.menuPaiId && m.id !== idMenuAtual);

    menusPrincipais.forEach(m => html += `<option value="${m.id}">${m.titulo}</option>`);
    $("#ddlMenuPai").html(html);
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
    var empresaSelecionada = $("#ddlEmpresa").val();
    var paiSelecionado = $("#ddlMenuPai").val(); // NOVO

    var dados = {
        titulo: $("#txtTitulo").val(),
        icone: $("#txtIcone").val(),
        rota: $("#txtRota").val(),
        ordem: parseInt($("#txtOrdem").val()),
        segmentoId: $("#ddlSegmento").val(),
        empresaId: empresaSelecionada === "" ? null : empresaSelecionada,
        menuPaiId: paiSelecionado === "" ? null : paiSelecionado // NOVO
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
        $("#iconePreview").attr("class", m.icone);
        $("#txtRota").val(m.rota);
        $("#txtOrdem").val(m.ordem);
        $("#ddlSegmento").val(m.segmentoId);
        $("#ddlEmpresa").val(m.empresaId || "");

        // Carrega as opções de pai primeiro, e depois seleciona o valor
        atualizarComboMenuPai(m.segmentoId, m.id);
        $("#ddlMenuPai").val(m.menuPaiId || "");

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