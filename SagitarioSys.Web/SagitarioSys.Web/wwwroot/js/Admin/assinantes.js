$(document).ready(function () {
    carregarSegmentos();
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

function montarUrlLogo(caminhoLogo) {
    if (!caminhoLogo || caminhoLogo.trim() === "") return "";
    return _url.replace(/\/$/, "") + caminhoLogo;
}

function resetarEstadoLogo() {
    $("#inputLogo").val("");
    $("#btnEnviarLogo").hide();
    $("#previewLogo").hide().attr("src", "");
    $("#boxSemLogo").show();
}

function exibirLogo(caminhoLogo) {
    const logoUrl = montarUrlLogo(caminhoLogo);

    if (logoUrl) {
        $("#previewLogo")
            .attr("src", logoUrl + "?t=" + Date.now())
            .show();
        $("#boxSemLogo").hide();
    } else {
        $("#previewLogo").hide().attr("src", "");
        $("#boxSemLogo").show();
    }
}

function carregarSegmentos() {
    $.ajax({
        url: _url + "api/Admin/Segmentos/ativos",
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
        url: _url + "api/Admin/Assinantes",
        type: "GET",
        success: function (dados) {
            if ($.fn.DataTable.isDataTable('#tabelaAssinantes')) {
                $('#tabelaAssinantes').DataTable().destroy();
            }

            var html = "";
            if (dados.length === 0) {
                html = '<tr><td colspan="6" class="text-center py-4">Nenhuma empresa cadastrada.</td></tr>';
            } else {
                dados.forEach(function (empresa) {
                    var statusBadge = empresa.ativo
                        ? '<span class="badge badge-success px-2 py-1"><i class="fas fa-check-circle mr-1"></i> Ativo</span>'
                        : '<span class="badge badge-danger px-2 py-1"><i class="fas fa-lock mr-1"></i> Bloqueado</span>';

                    var btnBloqueio = empresa.ativo
                        ? `<button class="btn btn-sm btn-outline-danger shadow-sm" onclick="alternarStatus('${empresa.id}', '${empresa.nomeFantasia}', true)" title="Bloquear Sistema"><i class="fas fa-ban"></i></button>`
                        : `<button class="btn btn-sm btn-outline-success shadow-sm" onclick="alternarStatus('${empresa.id}', '${empresa.nomeFantasia}', false)" title="Desbloquear Sistema"><i class="fas fa-unlock"></i></button>`;

                    var btnSenha = `<button class="btn btn-sm btn-warning shadow-sm mr-1" onclick="abrirModalSenha('${empresa.id}', '${empresa.nomeFantasia}')" title="Resetar Senha"><i class="fas fa-key text-dark"></i></button>`;
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

            if (dados.length > 0) {
                $('#tabelaAssinantes').DataTable({
                    language: { url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json" },
                    ordering: true,
                    info: true,
                    autoWidth: false,
                    responsive: true
                });
            }
        }
    });
}

function abrirModalNovo() {
    $("#txtEmpresaId").val("");
    $("#formAssinante")[0].reset();
    $("#modalTitle").html('<i class="fas fa-building mr-2"></i> Novo Assinante');
    $("#areaUsuarioAdmin").show();
    $("#txtEmailAdmin, #txtSenhaAdmin, #txtNomeAdmin").prop("required", true);

    resetarEstadoLogo();
    $("#areaUploadLogo").hide();
    $("#msgSemLogo").show();

    $("#modalAssinante").modal("show");
}

function salvarAssinante() {
    var id = $("#txtEmpresaId").val();
    var isEdicao = id !== "";
    var metodo = isEdicao ? "PUT" : "POST";
    var url = isEdicao ? `${_url}api/Admin/Assinantes/${id}` : _url + "api/Admin/Assinantes";

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
        dados.telefone = $("#txtTelefoneEmpresa").val();
        dados.emailContato = $("#txtEmailEmpresa").val();
    } else {
        dados.telefoneEmpresa = $("#txtTelefoneEmpresa").val();
        dados.emailContatoEmpresa = $("#txtEmailEmpresa").val();
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
    resetarEstadoLogo();

    $.ajax({
        url: `${_url}api/Admin/Assinantes/${id}`,
        type: "GET",
        success: function (empresa) {
            $("#txtEmpresaId").val(empresa.id);

            exibirLogo(empresa.logomarca);
            $("#areaUploadLogo").show();
            $("#msgSemLogo").hide();

            $("#txtNomeFantasia").val(empresa.nomeFantasia);
            $("#txtRazaoSocial").val(empresa.razaoSocial);
            $("#txtCnpj").val(empresa.cnpjCpf);
            $("#txtIE").val(empresa.inscricaoEstadual);
            $("#ddlSegmento").val(empresa.segmentoId);
            $("#txtTelefoneEmpresa").val(empresa.telefone);
            $("#txtEmailEmpresa").val(empresa.emailContato);
            $("#txtCep").val(empresa.cep);
            $("#txtLogradouro").val(empresa.logradouro);
            $("#txtNumero").val(empresa.numero);
            $("#txtComplemento").val(empresa.complemento);
            $("#txtBairro").val(empresa.bairro);
            $("#txtCidade").val(empresa.cidade);
            $("#ddlUf").val(empresa.uf);

            $("#modalTitle").html('<i class="fas fa-edit mr-2"></i> Editar Empresa');
            $("#areaUsuarioAdmin").hide();
            $("#txtEmailAdmin, #txtSenhaAdmin, #txtNomeAdmin").prop("required", false);

            $("#modalAssinante").modal("show");
        }
    });
}

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
                url: `${_url}api/Admin/Assinantes/${id}/status`,
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
        url: `${_url}api/Admin/Assinantes/${idEmpresa}/reset-senha`,
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

function preVisualizarLogo(input) {
    if (input.files && input.files[0]) {
        var arquivo = input.files[0];
        var tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

        if (!tiposPermitidos.includes(arquivo.type)) {
            Swal.fire('Atenção!', 'Selecione uma imagem PNG, JPG, JPEG ou WEBP.', 'warning');
            $("#inputLogo").val("");
            $("#btnEnviarLogo").hide();
            return;
        }

        if (arquivo.size > 2 * 1024 * 1024) {
            Swal.fire('Atenção!', 'A logo deve ter no máximo 2 MB.', 'warning');
            $("#inputLogo").val("");
            $("#btnEnviarLogo").hide();
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            $("#previewLogo").attr("src", e.target.result).show();
            $("#boxSemLogo").hide();
            $("#btnEnviarLogo").show();
        };
        reader.readAsDataURL(arquivo);
    }
}

function enviarLogo() {
    var id = $("#txtEmpresaId").val();
    var arquivo = $("#inputLogo")[0].files[0];

    if (!id) {
        Swal.fire('Atenção!', 'Salve a empresa antes de enviar a logo.', 'warning');
        return;
    }

    if (!arquivo) {
        Swal.fire('Atenção!', 'Selecione uma imagem antes de enviar.', 'warning');
        return;
    }

    var formData = new FormData();
    formData.append("arquivo", arquivo);

    $("#btnEnviarLogo")
        .prop("disabled", true)
        .html('<i class="fas fa-spinner fa-spin mr-1"></i> Enviando...');

    $.ajax({
        url: `${_url}api/Admin/Assinantes/${id}/logo`,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (resp) {
            exibirLogo(resp.url);
            $("#inputLogo").val("");
            $("#btnEnviarLogo").hide();

            Swal.fire({
                title: 'Logo salva!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.message || "Erro ao enviar logo.";
            Swal.fire('Erro!', msg, 'error');
        },
        complete: function () {
            $("#btnEnviarLogo")
                .prop("disabled", false)
                .html('<i class="fas fa-check mr-1"></i> Salvar Logo');
        }
    });
}
