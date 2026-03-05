const API_FINANCEIRO = _url + "api/Financeiro";
const API_CATEGORIAS = _url + "api/CategoriasFinanceiras"; // Nova rota
var categoriasGlobais = []; // Guarda as categorias na memória

$(document).ready(function () {
    carregarLancamentos();
    carregarCategorias();

    $("#formFinanceiro").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });

    // ✨ NOVO: Fica escutando a troca entre Receita e Despesa
    $("#ddlTipo").on("change", function () {
        ajustarTelaPorTipo();
    });

    // ✨ NOVO: Fica escutando a troca de Status
    $("#ddlStatus").on("change", function () {
        ajustarDataPorStatus();
    });
});

function formatarMoeda(valor) {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarLancamentos() {
    $.ajax({
        url: API_FINANCEIRO,
        type: "GET",
        success: function (dados) {
            var html = "";
            var totalReceitas = 0;
            var totalDespesas = 0;

            if (dados.length === 0) {
                html = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum lançamento encontrado.</td></tr>';
            } else {
                dados.forEach(function (f) {

                    // Somatória para o Dashboard
                    if (f.status === "Pago") {
                        if (f.tipo === "Receita") totalReceitas += f.valor;
                        if (f.tipo === "Despesa") totalDespesas += f.valor;
                    }

                    // Formatação de Datas
                    let vencimento = new Date(f.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

                    // Badges Visuais
                    let corTipo = f.tipo === "Receita" ? "text-success" : "text-danger";
                    let iconeTipo = f.tipo === "Receita" ? "fa-arrow-up" : "fa-arrow-down";

                    let badgeStatus = "badge-secondary";
                    if (f.status === "Pago") badgeStatus = "badge-success";
                    if (f.status === "Pendente") badgeStatus = "badge-warning";
                    if (f.status === "Atrasado") badgeStatus = "badge-danger";

                    html += `
                        <tr style="border-bottom: 1px solid var(--zinc-100);">
                            <td class="pl-4 py-3 font-weight-bold">${vencimento}</td>
                            <td class="py-3">
                                <div class="font-weight-bold" style="color: var(--zinc-900);">${f.descricao}</div>
                                <div class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-tag mr-1"></i> ${f.categoria}</div>
                            </td>
                            <td class="py-3 font-weight-bold ${corTipo}">
                                <i class="fas ${iconeTipo} mr-1"></i> ${f.tipo}
                            </td>
                            <td class="py-3">
                                <span class="badge ${badgeStatus} px-2 py-1">${f.status.toUpperCase()}</span>
                            </td>
                            <td class="py-3 text-right font-weight-bold ${corTipo}">
                                ${formatarMoeda(f.valor)}
                            </td>
                            <td class="text-center py-3">
                                <button class="btn btn-sm btn-light border shadow-sm text-primary mr-1" onclick="editar('${f.id}')"><i class="fas fa-pen"></i></button>
                                <button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="deletar('${f.id}')"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
            }

            $("#tbFinanceiro tbody").html(html);

            // Atualiza os Cards do Topo
            $("#lblTotalReceitas").text(formatarMoeda(totalReceitas));
            $("#lblTotalDespesas").text(formatarMoeda(totalDespesas));
            $("#lblSaldoTotal").text(formatarMoeda(totalReceitas - totalDespesas));
        },
        error: function () {
            $("#tbFinanceiro tbody").html('<tr><td colspan="6" class="text-center py-4 text-danger">Erro ao carregar o fluxo de caixa.</td></tr>');
        }
    });
}

function abrirModal() {
    $("#formFinanceiro")[0].reset();
    $("#txtId").val("");

    // Sugere a data de hoje por padrão
    document.getElementById('txtVencimento').valueAsDate = new Date();

    ajustarTelaPorTipo();

    $("#modalTitle").html('<i class="fas fa-plus mr-2"></i> Novo Lançamento');
    $("#modalFinanceiro").modal("show");
}

function salvar() {
    var id = $("#txtId").val();
    var isEdicao = id !== "";

    var dados = {
        tipo: $("#ddlTipo").val(),
        categoria: $("#ddlCategoria").val(),
        descricao: $("#txtDescricao").val(),
        valor: parseFloat($("#txtValor").val()),
        dataVencimento: $("#txtVencimento").val(),
        dataPagamento: $("#txtPagamento").val() ? $("#txtPagamento").val() : null,
        status: $("#ddlStatus").val(),
        formaPagamento: $("#ddlFormaPgto").val()
    };

    if (isEdicao) {
        dados.id = id;
    }

    var $btn = $("#btnSalvar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Salvando...');

    $.ajax({
        url: isEdicao ? `${API_FINANCEIRO}/${id}` : API_FINANCEIRO,
        type: isEdicao ? "PUT" : "POST",
        contentType: "application/json",
        data: JSON.stringify(dados),
        success: function () {
            $("#modalFinanceiro").modal("hide");
            Swal.fire({ title: 'Sucesso!', text: 'Lançamento salvo.', icon: 'success', timer: 1500, showConfirmButton: false });
            carregarLancamentos();
        },
        error: function () {
            Swal.fire('Erro!', 'Não foi possível salvar.', 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar Lançamento');
        }
    });
}

function editar(id) {
    $.get(`${API_FINANCEIRO}/${id}`, function (f) {
        $("#txtId").val(f.id);
        $("#ddlTipo").val(f.tipo);
        atualizarComboCategoria(f.categoria);
        $("#txtDescricao").val(f.descricao);
        $("#txtValor").val(f.valor);

        // Converte as datas para o formato yyyy-MM-dd do input date
        if (f.dataVencimento) $("#txtVencimento").val(f.dataVencimento.split('T')[0]);
        if (f.dataPagamento) $("#txtPagamento").val(f.dataPagamento.split('T')[0]);
        else $("#txtPagamento").val("");

        $("#ddlStatus").val(f.status);
        $("#ddlFormaPgto").val(f.formaPagamento || "");

        $("#modalTitle").html('<i class="fas fa-edit mr-2 text-primary"></i> Editar Lançamento');
        $("#modalFinanceiro").modal("show");
    });
}

function deletar(id) {
    Swal.fire({
        title: 'Excluir Lançamento?',
        text: `Esta ação vai alterar o saldo do seu caixa!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${API_FINANCEIRO}/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Excluído!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarLancamentos();
                }
            });
        }
    });
}

// ==========================================
// 🎨 UX: ADAPTA A TELA CONFORME O TIPO
// ==========================================
function ajustarTelaPorTipo() {
    var tipo = $("#ddlTipo").val();

    if (tipo === "Receita") {
        // Se for dinheiro entrando, muda o vocabulário para fazer mais sentido
        $("#lblVencimento").text("Previsão de Recebimento *");
        $("#lblPagamento").text("Data do Recebimento");

        // Sugere o Status como Pago imediatamente para Entradas
        if (!$("#txtId").val()) {
            $("#ddlStatus").val("Pago");
            ajustarDataPorStatus();
        }
    } else {
        // Se for Despesa, volta ao vocabulário clássico de contas a pagar
        $("#lblVencimento").text("Data de Vencimento *");
        $("#lblPagamento").text("Data do Pagamento");  

        // Sugere como Pendente
        if (!$("#txtId").val()) {
            $("#ddlStatus").val("Pendente");
            ajustarDataPorStatus();
        }
    }

    atualizarComboCategoria();
}

// ==========================================
// 🎨 UX: PREENCHE DATAS AUTOMATICAMENTE
// ==========================================
function ajustarDataPorStatus() {
    var status = $("#ddlStatus").val();

    if (status === "Pago") {
        // Se marcou como Pago, já preenche a Data de Pagamento com a data de hoje para não ter que digitar
        if (!$("#txtPagamento").val()) {
            document.getElementById('txtPagamento').valueAsDate = new Date();
        }
    } else {
        // Se está pendente ou cancelado, apaga a data de pagamento
        $("#txtPagamento").val("");
    }
}

function carregarCategorias() {
    $.get(API_CATEGORIAS, function (dados) {
        categoriasGlobais = dados;
        atualizarComboCategoria(); // Preenche o dropdown pela primeira vez
    });
}

function atualizarComboCategoria(categoriaSelecionada = "") {
    var tipoAtual = $("#ddlTipo").val(); // Pega se é Receita ou Despesa

    // Filtra as categorias da memória pelo tipo escolhido
    var categoriasFiltradas = categoriasGlobais.filter(c => c.tipo === tipoAtual);

    var html = '<option value="">Selecione...</option>';
    categoriasFiltradas.forEach(function (c) {
        html += `<option value="${c.nome}">${c.nome}</option>`;
    });

    $("#ddlCategoria").html(html);

    // Se veio um valor na edição, seleciona ele
    if (categoriaSelecionada) {
        $("#ddlCategoria").val(categoriaSelecionada);
    }
}