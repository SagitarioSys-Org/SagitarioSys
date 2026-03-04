$(document).ready(function () {
    carregarSegmentos(); // Busca "Oficina, Loja de Roupas" direto do banco
    carregarAssinantes();

    $("#formAssinante").on("submit", function (e) {
        e.preventDefault();
        salvarAssinante();
    });

    $("#formResetSenha").on("submit", function (e) {
        e.preventDefault();
        salvarNovaSenha();
    });
});

// ==========================================
// PREENCHIMENTO E LISTAGEM
// ==========================================
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
            // Destrói a tabela velha para recriar
            if ($.fn.DataTable.isDataTable('#tabelaAssinantes')) {
                $('#tabelaAssinantes').DataTable().destroy();
            }

            var html = "";
            if (dados.length === 0) {
                html = '<tr><td colspan="6" class="text-center py-4">Nenhuma empresa cadastrada.</td></tr>';
            } else {
                dados.forEach(function (empresa) {
                    // Lógica visual do Status
                    var statusBadge = empresa.ativo
                        ? '<span class="badge badge-success px-2 py-1"><i class="fas fa-check-circle mr-1"></i> Ativo</span>'
                        : '<span class="badge badge-danger px-2 py-1"><i class="fas fa-lock mr-1"></i> Bloqueado</span>';

                    // Lógica do Botão de Bloquear/Desbloquear
                    var btnBloqueio = empresa.ativo
                        ? `<button class="btn btn-sm btn-outline-danger shadow-sm" onclick="alternarStatus('${empresa.id}', '${empresa.nomeFantasia}', true)" title="Bloquear Sistema"><i class="fas fa-ban"></i></button>`
                        : `<button class="btn btn-sm btn-outline-success shadow-sm" onclick="alternarStatus('${empresa.id}', '${empresa.nomeFantasia}', false)" title="Desbloquear Sistema"><i class="fas fa-unlock"></i></button>`;

                    var btnSenha = `<button class="btn btn-sm btn-warning shadow-sm mr-1" onclick="abrirModalSenha('${empresa.id}', '${empresa.nomeFantasia}')" title="Resetar Senha"><i class="fas fa-key text-dark"></i></button>`;

                    // Linha com estilo cinza se estiver bloqueada
                    var linhaClass = empresa.ativo ? "" : "text-muted bg-light";

                    html += `
                        <tr class="${linhaClass}">
                            <td class="align-middle font-weight-bold">${empresa.nomeFantasia}</td>
                            <td class="align-middle">${empresa.cnpjCpf}</td>
                            <td class="align-middle text-primary font-weight-bold">${empresa.emailAdmin || '-'}</td>
                            <td class="align-middle">${empresa.nomeSegmento}</td> 
                            <td class="text-center align-middle">${statusBadge}</td>
                            <td class="text-center align-middle">
                                ${btnSenha} 
                                <button class="btn btn-sm btn-primary shadow-sm mr-1" onclick="editar('${empresa.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                                ${btnBloqueio}
                            </td>
                        </tr>
                    `;
                });
            }

            $("#tabelaAssinantes tbody").html(html);

            // Inicia o DataTables
            if (dados.length > 0) {
                $('#tabelaAssinantes').DataTable({
                    "language": { "url": "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json" },
                    "ordering": true,
                    "info": true,
                    "autoWidth": false,
                    "responsive": true
                });
            }
        }
    });
}

// ==========================================
// CRUD (CRIAR E EDITAR) - ATUALIZADO COM NOVOS CAMPOS
// ==========================================
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

    // Puxamos os dados comuns a ambos (Novo e Edição)
    var dados = {
        nomeFantasia: $("#txtNomeFantasia").val(),
        razaoSocial: $("#txtRazaoSocial").val(),
        cnpjCpf: $("#txtCnpj").val(),
        inscricaoEstadual: $("#txtIE").val(),
        segmentoId: $("#ddlSegmento").val(),
        cep: $("#txtCep").val(),
        logradouro: $("#txtLogradouro").val(),
        numero: $("#txtNumero").val(),
        complemento: $("#txtComplemento").val(),
        bairro: $("#txtBairro").val(),
        cidade: $("#txtCidade").val(),
        uf: $("#ddlUf").val()
    };

    if (isEdicao) {
        // Se for EDIÇÃO, o C# (Empresa.cs) exige os nomes curtos
        dados.telefone = $("#txtTelefoneEmpresa").val();
        dados.emailContato = $("#txtEmailEmpresa").val();
    } else {
        // Se for NOVO, o C# (NovoAssinanteRequest.cs) exige os nomes compridos
        dados.telefoneEmpresa = $("#txtTelefoneEmpresa").val();
        dados.emailContatoEmpresa = $("#txtEmailEmpresa").val();

        // E também manda os dados do gestor (Primeiro Acesso)
        dados.nomeAdmin = $("#txtNomeAdmin").val();
        dados.cpfAdmin = $("#txtCpfAdmin").val();
        dados.telefoneAdmin = $("#txtTelAdmin").val();
        dados.emailAdmin = $("#txtEmailAdmin").val();
        dados.senhaAdmin = $("#txtSenhaAdmin").val();
    }

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
            console.error("ERRO AO SALVAR:", xhr.responseText);
            var msg = xhr.responseJSON ? xhr.responseJSON.message : "Erro interno ao salvar. Verifique o preenchimento.";
            Swal.fire('Atenção!', msg, 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Salvar e Registrar');
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

            // Preenche os dados da empresa
            $("#txtNomeFantasia").val(empresa.nomeFantasia);
            $("#txtRazaoSocial").val(empresa.razaoSocial);
            $("#txtCnpj").val(empresa.cnpjCpf);
            $("#txtIE").val(empresa.inscricaoEstadual);
            $("#ddlSegmento").val(empresa.segmentoId);
            $("#txtTelefoneEmpresa").val(empresa.telefone);
            $("#txtEmailEmpresa").val(empresa.emailContato);

            // Preenche o endereço
            $("#txtCep").val(empresa.cep);
            $("#txtLogradouro").val(empresa.logradouro);
            $("#txtNumero").val(empresa.numero);
            $("#txtComplemento").val(empresa.complemento);
            $("#txtBairro").val(empresa.bairro);
            $("#txtCidade").val(empresa.cidade);
            $("#ddlUf").val(empresa.uf);

            $("#modalTitle").html('<i class="fas fa-edit mr-2"></i> Editar Empresa');

            // Esconde os dados do Admin na edição
            $("#areaUsuarioAdmin").hide();
            $("#txtEmailAdmin, #txtSenhaAdmin, #txtNomeAdmin").prop("required", false);

            $("#modalAssinante").modal("show");
        }
    });
}

// ==========================================
// LÓGICA DE BLOQUEIO E SENHA
// ==========================================
function alternarStatus(id, nome, estaAtivo) {
    var acao = estaAtivo ? "Bloquear" : "Desbloquear";
    var corBotao = estaAtivo ? "#d33" : "#28a745";
    var icone = estaAtivo ? "warning" : "question";
    var textoAlerta = estaAtivo
        ? `A empresa <b>${nome}</b> perderá acesso imediato ao sistema.`
        : `A empresa <b>${nome}</b> voltará a ter acesso ao sistema.`;

    Swal.fire({
        title: `${acao} Assinante?`,
        html: textoAlerta,
        icon: icone,
        showCancelButton: true,
        confirmButtonColor: corBotao,
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Sim, ${acao}!`
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${_url}api/Assinantes/${id}/status`,
                type: "PATCH",
                success: function (resposta) {
                    Swal.fire({
                        title: 'Sucesso!',
                        text: resposta.message,
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    carregarAssinantes();
                },
                error: function (xhr) {
                    var msg = xhr.responseJSON ? xhr.responseJSON.message : "Erro ao alterar status.";
                    Swal.fire('Atenção!', msg, 'error');
                }
            });
        }
    });
}

function abrirModalSenha(id, nomeFantasia) {
    $("#formResetSenha")[0].reset();
    $("#txtResetEmpresaId").val(id);
    $("#lblNomeEmpresaReset").text(nomeFantasia);
    $("#modalResetSenha").modal("show");
}

function salvarNovaSenha() {
    var idEmpresa = $("#txtResetEmpresaId").val();
    var novaSenha = $("#txtNovaSenha").val();

    var $btn = $("#btnSalvarSenha");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Alterando...');

    $.ajax({
        url: `${_url}api/Assinantes/${idEmpresa}/reset-senha`,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ novaSenha: novaSenha }),
        success: function (resposta) {
            $("#modalResetSenha").modal("hide");
            Swal.fire({
                title: 'Senha Alterada!',
                text: resposta.message,
                icon: 'success',
                confirmButtonColor: '#28a745'
            });
        },
        error: function (xhr) {
            var msg = xhr.responseJSON ? xhr.responseJSON.message : "Erro ao alterar a senha.";
            Swal.fire('Atenção!', msg, 'error');
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-save mr-1"></i> Confirmar');
        }
    });
}

// ==========================================
// INTEGRAÇÃO VIACEP (NOVO)
// ==========================================
function buscarCep() {
    var cep = $("#txtCep").val().replace(/\D/g, '');
    if (cep.length === 8) {
        $("#txtLogradouro").val("Buscando...");
        $.getJSON(`https://viacep.com.br/ws/${cep}/json/?callback=?`, function (dados) {
            if (!("erro" in dados)) {
                $("#txtLogradouro").val(dados.logradouro);
                $("#txtBairro").val(dados.bairro);
                $("#txtCidade").val(dados.localidade);
                $("#ddlUf").val(dados.uf);
                $("#txtNumero").focus();
            } else {
                $("#txtLogradouro").val("");
                Swal.fire('Atenção', 'CEP não encontrado.', 'warning');
            }
        });
    }
}