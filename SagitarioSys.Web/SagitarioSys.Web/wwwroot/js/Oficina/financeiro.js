const API_FINANCEIRO = _url + "api/Financeiro";
const API_CATEGORIAS = _url + "api/CategoriasFinanceiras";
var categoriasGlobais = [];
var filtroPor = "vencimento";

// ✅ JWT global para todos os $.ajax da página
$.ajaxSetup({
    headers: { "Authorization": "Bearer " + localStorage.getItem("jwt_token") }
});

$(document).ready(function () {
    // Período padrão: mês atual
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    $("#dtInicio").val(primeiroDia.toISOString().split('T')[0]);
    $("#dtFim").val(ultimoDia.toISOString().split('T')[0]);

    carregarLancamentos();
    carregarCategorias();

    $("#formFinanceiro").on("submit", function (e) {
        e.preventDefault();
        salvar();
    });

    $("#ddlTipo").on("change", function () { ajustarTelaPorTipo(); });
    $("#ddlStatus").on("change", function () { ajustarDataPorStatus(); });
});

function alternarFiltroPor(opcao) {
    filtroPor = opcao;

    if (opcao === "vencimento") {
        $("#btnFiltroVencimento").css({ "background-color": "var(--zinc-900)", "color": "white" });
        $("#btnFiltroPagamento").css({ "background-color": "var(--zinc-200)", "color": "var(--zinc-700)" });
        $("#thDataColuna").html('<i class="fas fa-calendar-alt mr-1"></i> Vencimento');
    } else {
        $("#btnFiltroPagamento").css({ "background-color": "var(--zinc-900)", "color": "white" });
        $("#btnFiltroVencimento").css({ "background-color": "var(--zinc-200)", "color": "var(--zinc-700)" });
        $("#thDataColuna").html('<i class="fas fa-check-circle mr-1"></i> Pagamento');
    }

    // ✅ Zera tudo para forçar nova busca
    $("#tbFinanceiro tbody").html('<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fas fa-search mr-2"></i> Clique em Filtrar para buscar.</td></tr>');
    $("#lblTotalReceitas").text("R$ 0,00");
    $("#lblTotalDespesas").text("R$ 0,00");
    $("#lblSaldoTotal").text("R$ 0,00");
}


function formatarMoeda(valor) {
    return parseFloat(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarLancamentos() {
    var dtInicio = $("#dtInicio").val();
    var dtFim = $("#dtFim").val();

    var $btn = $("#btnFiltrar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Filtrando...');

    $.ajax({
        url: `${API_FINANCEIRO}?dataInicio=${dtInicio}&dataFim=${dtFim}&filtroPor=${filtroPor}`,
        type: "GET",
        success: function (dados) {
            var html = "";
            var totalReceitas = 0;
            var totalDespesas = 0;

            if (dados.length === 0) {
                html = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum lançamento no período.</td></tr>';
            } else {
                var hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                dados.forEach(function (f) {
                    if (f.status === "Pago") {
                        if (f.tipo === "Receita") totalReceitas += f.valor;
                        if (f.tipo === "Despesa") totalDespesas += f.valor;
                    }

                    // ============================================
                    // Data exibida conforme o toggle ativo
                    // ============================================
                    var dataExibir = filtroPor === "pagamento"
                        ? (f.dataPagamento ? new Date(f.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-')
                        : new Date(f.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

                    // ============================================
                    // Tipo: cor e ícone
                    // ============================================
                    var corTipo = f.tipo === "Receita" ? "text-success" : "text-danger";
                    var iconeTipo = f.tipo === "Receita" ? "fa-arrow-up" : "fa-arrow-down";

                    // ============================================
                    // Status: detecta atrasado automaticamente
                    // ============================================
                    var dtVenc = new Date(f.dataVencimento);
                    var badgeStatus = "badge-secondary";
                    var labelStatus = f.status.toUpperCase();

                    if (f.status === "Pago") {
                        badgeStatus = "badge-success";
                    } else if (f.status === "Cancelado") {
                        badgeStatus = "badge-secondary";
                    } else if (f.status === "Atrasado" || (f.status === "Pendente" && dtVenc < hoje)) {
                        badgeStatus = "badge-danger";
                        labelStatus = "ATRASADO";
                    } else if (f.status === "Pendente") {
                        badgeStatus = "badge-warning";
                    }

                    // ============================================
                    // Ações: bloqueia editar/deletar se veio de OS
                    // ============================================
                    var acoes = "";
                    if (f.ordemServicoId || f.ordemservicoid) {
                        acoes = `<span class="badge badge-light border text-muted px-2 py-1" 
                                       title="Gerado automaticamente pela OS">
                                    <i class="fas fa-lock mr-1"></i> OS
                                 </span>`;
                    } else {
                        acoes = `
                            <button class="btn btn-sm btn-light border shadow-sm text-primary mr-1" onclick="editar('${f.id}')">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn btn-sm btn-light border shadow-sm text-danger" onclick="deletar('${f.id}')">
                                <i class="fas fa-trash"></i>
                            </button>`;
                    }

                    html += `
                        <tr style="border-bottom: 1px solid var(--zinc-100);">
                            <td class="pl-4 py-3 font-weight-bold">${dataExibir}</td>
                            <td class="py-3">
                                <div class="font-weight-bold" style="color: var(--zinc-900);">${f.descricao}</div>
                                <div class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-tag mr-1"></i> ${f.categoria}</div>
                            </td>
                            <td class="py-3 font-weight-bold ${corTipo}">
                                <i class="fas ${iconeTipo} mr-1"></i> ${f.tipo}
                            </td>
                            <td class="py-3">
                                <span class="badge ${badgeStatus} px-2 py-1">${labelStatus}</span>
                            </td>
                            <td class="py-3 text-right font-weight-bold ${corTipo}">${formatarMoeda(f.valor)}</td>
                            <td class="text-center py-3">${acoes}</td>
                        </tr>`;
                });
            }

            $("#tbFinanceiro tbody").html(html);
            $("#lblTotalReceitas").text(formatarMoeda(totalReceitas));
            $("#lblTotalDespesas").text(formatarMoeda(totalDespesas));
            $("#lblSaldoTotal").text(formatarMoeda(totalReceitas - totalDespesas));
        },
        error: function () {
            $("#tbFinanceiro tbody").html('<tr><td colspan="6" class="text-center py-4 text-danger">Erro ao carregar o fluxo de caixa.</td></tr>');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-search mr-1"></i> Filtrar');
        }
    });
}


function abrirModal() {
    $("#formFinanceiro")[0].reset();
    $("#txtId").val("");
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
        dataPagamento: $("#txtPagamento").val() || null,
        status: $("#ddlStatus").val(),
        formaPagamento: $("#ddlFormaPgto").val()
    };

    if (isEdicao) dados.id = id;

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
        error: function (xhr) {
            var msg = xhr.responseJSON?.message || 'Não foi possível salvar.';
            Swal.fire('Erro!', msg, 'error');
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
        text: 'Esta ação vai alterar o saldo do seu caixa!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${API_FINANCEIRO}/${id}`,
                type: "DELETE",
                success: function () {
                    Swal.fire({ title: 'Excluído!', icon: 'success', timer: 1500, showConfirmButton: false });
                    carregarLancamentos();
                },
                error: function (xhr) {
                    var msg = xhr.responseJSON?.message || 'Não foi possível excluir.';
                    Swal.fire('Erro!', msg, 'error');
                }
            });
        }
    });
}

function ajustarTelaPorTipo() {
    var tipo = $("#ddlTipo").val();
    if (tipo === "Receita") {
        $("#lblVencimento").text("Previsão de Recebimento *");
        $("#lblPagamento").text("Data do Recebimento");
        if (!$("#txtId").val()) { $("#ddlStatus").val("Pago"); ajustarDataPorStatus(); }
    } else {
        $("#lblVencimento").text("Data de Vencimento *");
        $("#lblPagamento").text("Data do Pagamento");
        if (!$("#txtId").val()) { $("#ddlStatus").val("Pendente"); ajustarDataPorStatus(); }
    }
    atualizarComboCategoria();
}

function ajustarDataPorStatus() {
    var status = $("#ddlStatus").val();
    if (status === "Pago") {
        if (!$("#txtPagamento").val())
            document.getElementById('txtPagamento').valueAsDate = new Date();
    } else {
        $("#txtPagamento").val("");
    }
}

function carregarCategorias() {
    $.get(API_CATEGORIAS, function (dados) {
        categoriasGlobais = dados;
        atualizarComboCategoria();
    });
}

function atualizarComboCategoria(categoriaSelecionada = "") {
    var tipoAtual = $("#ddlTipo").val();
    var filtradas = categoriasGlobais.filter(c => c.tipo === tipoAtual);

    var html = '<option value="">Selecione...</option>';
    filtradas.forEach(function (c) {
        html += `<option value="${c.nome}">${c.nome}</option>`;
    });

    $("#ddlCategoria").html(html);
    if (categoriaSelecionada) $("#ddlCategoria").val(categoriaSelecionada);
}
