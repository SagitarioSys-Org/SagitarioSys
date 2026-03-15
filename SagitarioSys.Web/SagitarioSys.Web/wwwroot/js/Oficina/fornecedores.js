let listaFornecedores = [];

$(document).ready(function () {
    carregarFornecedores();

    $('#txtBuscaFornecedor').on('keyup', function () {
        const termo = $(this).val().toLowerCase();
        $('#tbFornecedores tbody tr').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(termo) > -1);
        });
    });

    $('#formFornecedor').on('submit', function (e) {
        e.preventDefault();
        salvarFornecedor();
    });
});

function carregarFornecedores() {
    $.get(`${_url}api/Oficina/Fornecedores`, function (dados) {
        listaFornecedores = dados || [];
        renderFornecedores();
    });
}

function renderFornecedores() {
    let html = '';
    listaFornecedores.forEach(f => {
        html += `<tr>
            <td class="pl-4 py-3"><strong>${f.nomeFantasia}</strong><div class="text-muted small">${f.razaoSocial || '-'}</div></td>
            <td class="py-3">${f.documento}</td>
            <td class="py-3">${f.telefone || '-'}<div class="text-muted small">${f.email || '-'}</div></td>
            <td class="py-3">${f.cidade || '-'}${f.estado ? '/' + f.estado : ''}</td>
            <td class="py-3">${f.ativo ? '<span class="badge badge-success">ATIVO</span>' : '<span class="badge badge-secondary">INATIVO</span>'}</td>
            <td class="py-3 text-center"><button class="btn btn-sm btn-light border" onclick="editarFornecedor('${f.id}')"><i class="fas fa-pen"></i></button></td>
        </tr>`;
    });

    $('#tbFornecedores tbody').html(html || '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum fornecedor cadastrado.</td></tr>');
}

function abrirModalFornecedor() {
    $('#formFornecedor')[0].reset();
    $('#txtFornecedorId').val('');
    $('#chkFornecedorAtivo').prop('checked', true);
    $('#modalFornecedor').modal('show');
}

function editarFornecedor(id) {
    $.get(`${_url}api/Oficina/Fornecedores/${id}`, function (f) {
        $('#txtFornecedorId').val(f.id);
        $('#txtNomeFantasia').val(f.nomeFantasia);
        $('#txtRazaoSocial').val(f.razaoSocial);
        $('#txtDocumento').val(f.documento);
        $('#txtEmailFornecedor').val(f.email);
        $('#txtTelefoneFornecedor').val(f.telefone);
        $('#txtWhatsappFornecedor').val(f.whatsapp);
        $('#txtCepFornecedor').val(f.cep);
        $('#txtLogradouroFornecedor').val(f.logradouro);
        $('#txtNumeroFornecedor').val(f.numero);
        $('#txtBairroFornecedor').val(f.bairro);
        $('#txtCidadeFornecedor').val(f.cidade);
        $('#txtEstadoFornecedor').val(f.estado);
        $('#txtObsFornecedor').val(f.observacoes);
        $('#chkFornecedorAtivo').prop('checked', f.ativo);
        $('#modalFornecedor').modal('show');
    });
}

function salvarFornecedor() {
    const id = $('#txtFornecedorId').val();
    const isEdicao = id !== '';
    const dados = {
        id: id || undefined,
        nomeFantasia: $('#txtNomeFantasia').val(),
        razaoSocial: $('#txtRazaoSocial').val(),
        documento: $('#txtDocumento').val(),
        email: $('#txtEmailFornecedor').val(),
        telefone: $('#txtTelefoneFornecedor').val(),
        whatsapp: $('#txtWhatsappFornecedor').val(),
        cep: $('#txtCepFornecedor').val(),
        logradouro: $('#txtLogradouroFornecedor').val(),
        numero: $('#txtNumeroFornecedor').val(),
        bairro: $('#txtBairroFornecedor').val(),
        cidade: $('#txtCidadeFornecedor').val(),
        estado: $('#txtEstadoFornecedor').val(),
        observacoes: $('#txtObsFornecedor').val(),
        ativo: $('#chkFornecedorAtivo').is(':checked')
    };

    $.ajax({
        url: isEdicao ? `${_url}api/Oficina/Fornecedores/${id}` : `${_url}api/Oficina/Fornecedores`,
        type: isEdicao ? 'PUT' : 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function () {
            $('#modalFornecedor').modal('hide');
            Swal.fire('Sucesso!', 'Fornecedor salvo com sucesso.', 'success');
            carregarFornecedores();
        },
        error: function (xhr) {
            Swal.fire('Erro', xhr.responseJSON?.message || 'Não foi possível salvar o fornecedor.', 'error');
        }
    });
}
