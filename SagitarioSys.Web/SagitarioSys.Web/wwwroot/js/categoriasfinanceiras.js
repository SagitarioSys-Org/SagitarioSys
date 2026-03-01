const API_CATEGORIAS = _url + "api/CategoriasFinanceiras";

$(document).ready(function () {
    carregarCategorias();
    $("#formCategoria").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });
});

function carregarCategorias() {
    $.ajax({
        url: API_CATEGORIAS,
        type: "GET",
        success: function (dados) {

            // 1. Destrói o paginador antigo se ele já existir na tela
            if ($.fn.DataTable.isDataTable('#tbCategorias')) {
                $('#tbCategorias').DataTable().destroy();
            }

            var html = "";
            if (dados.length === 0) {
                html = '<tr><td colspan="3" class="text-center text-muted">Nenhuma categoria cadastrada.</td></tr>';
            } else {
                dados.forEach(function (c) {
                    let corTipo = c.tipo === "Receita" ? "text-success" : "text-danger";
                    let iconeTipo = c.tipo === "Receita" ? "fa-arrow-up" : "fa-arrow-down";

                    // Removemos aqueles paddings imensos (py-3) para a tabela ficar compacta
                    html += `
                        <tr>
                            <td class="align-middle font-weight-bold ${corTipo}"><i class="fas ${iconeTipo} mr-1"></i> ${c.tipo.toUpperCase()}</td>
                            <td class="align-middle">${c.nome}</td>
                            <td class="text-center align-middle">
                                <button class="btn btn-sm btn-primary mr-1" onclick="editar('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger" onclick="deletar('${c.id}')" title="Deletar"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }

            // 2. Injeta o HTML limpo
            $("#tbCategorias tbody").html(html);

            // 3. MÁGICA: Acorda o DataTables para transformar o HTML numa tabela profissional
            if (dados.length > 0) {
                $('#tbCategorias').DataTable({
                    "language": {
                        "url": "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json" // Traduz tudo para Português
                    },
                    "paging": true,        // Liga a paginação
                    "lengthChange": true,  // Deixa escolher "Mostrar 10, 25, 50"
                    "searching": true,     // Cria a barra de busca rápida
                    "ordering": true,      // Permite clicar no cabeçalho para ordenar
                    "info": true,          // Mostra "Exibindo de 1 até 10"
                    "autoWidth": false,
                    "responsive": true
                });
            }
        }
    });
}

function abrirModal() {
    $("#formCategoria")[0].reset();
    $("#txtId").val("");
    $("#modalTitle").html('<i class="fas fa-plus mr-2"></i> Nova Categoria');
    $("#modalCategoria").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    var dados = {
        tipo: $("#ddlTipoCategoria").val(),
        nome: $("#txtNome").val()
    };

    if (isEdicao) dados.id = id;

    $.ajax({
        url: isEdicao ? `${API_CATEGORIAS}/${id}` : API_CATEGORIAS,
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalCategoria").modal("hide");
            Swal.fire({ title: 'Sucesso!', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarCategorias();
        }
    });
}

function editar(id) {
    $.get(`${API_CATEGORIAS}/${id}`, function (c) {
        $("#txtId").val(c.id);
        $("#ddlTipoCategoria").val(c.tipo);
        $("#txtNome").val(c.nome);
        $("#modalTitle").html('<i class="fas fa-edit mr-2 text-primary"></i> Editar Categoria');
        $("#modalCategoria").modal("show");
    });
}

function deletar(id) {
    Swal.fire({
        title: 'Excluir?',
        text: "Essa categoria vai sumir das opções de lançamento.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${API_CATEGORIAS}/${id}`,
                type: "DELETE",
                success: function () { carregarCategorias(); }
            });
        }
    });
}