
$(document).ready(function () {
    // Lê o ID que o C# deixou no campo hidden do HTML
    const osId = $("#hdfOsId").val();
    const token = localStorage.getItem("jwt_token");

    if (!token) {
        alert("Você precisa estar logado para imprimir.");
        window.close();
        return;
    }

    // Busca os dados completos da OS na API
    $.ajax({
        url: _url + 'api/OrdensServico/' + osId,
        type: 'GET',
        headers: { "Authorization": "Bearer " + token },
        success: function (os) {
            montarDocumento(os);
        },
        error: function () {
            $("#conteudoFolha").html('<div class="alert alert-danger text-center">Erro ao carregar a Ordem de Serviço. Verifique sua conexão.</div>');
        }
    });
});

function montarDocumento(os) {
    const nomeOficina = localStorage.getItem("user_nome") || "Sagitario Sys";
    const dataAbertura = new Date(os.dataAbertura).toLocaleDateString('pt-BR');
    const numeroFormatado = String(os.numeroOS).padStart(5, '0');
    const statusOS = os.status.toUpperCase();

    let html = `
        <div class="row header-os align-items-center">
            <div class="col-8">
                <h2 class="font-weight-bold mb-0 text-dark">${nomeOficina}</h2>
                <p class="text-muted m-0">Ordem de Serviço de Manutenção</p>
            </div>
            <div class="col-4 text-right">
                <h4 class="font-weight-bold text-primary m-0">O.S. #${numeroFormatado}</h4>
                <span class="badge badge-secondary" style="font-size: 0.9rem;">STATUS: ${statusOS}</span>
            </div>
        </div>

        <div class="row">
            <div class="col-6">
                <div class="section-title">Dados do Cliente</div>
                <div class="box-info">
                    <span><strong>Nome:</strong> ${os.nomeCliente}</span>
                    <span><strong>CPF/CNPJ:</strong> ${os.clienteCpfCnpj || 'Não informado'}</span>
                    <span><strong>Telefone:</strong> ${os.clienteTelefone || 'Não informado'}</span>
                </div>
            </div>
            <div class="col-6">
                <div class="section-title">Dados do Veículo</div>
                <div class="box-info">
                    <span><strong>Marca/Modelo:</strong> ${os.marcaVeiculo || ''} ${os.modeloVeiculo}</span>
                    <span><strong>Placa:</strong> ${os.placaVeiculo}</span>
                    <span><strong>KM Registrado:</strong> ${os.kmAtual ? os.kmAtual.toLocaleString('pt-BR') + ' km' : 'Não informado'}</span> <span><strong>Data de Entrada:</strong> ${dataAbertura}</span>
                </div>
            </div>
        </div>

        <div class="section-title">Relato e Observações</div>
        <div class="box-info mb-4">
            <p class="mb-2"><strong>Relato do Cliente:</strong><br> ${os.relatoCliente || 'Nenhum relato fornecido.'}</p>
            <hr class="my-2">
            <p class="mb-0"><strong>Diagnóstico / Obs do Mecânico:</strong><br> ${os.observacoesInternas || '-'}</p>
        </div>

        <div class="section-title">Peças e Serviços Executados</div>
        <table class="table table-sm table-itens border">
            <thead>
                <tr>
                    <th width="15%">TIPO</th>
                    <th width="45%">DESCRIÇÃO</th>
                    <th width="10%" class="text-center">QTD</th>
                    <th width="15%" class="text-right">VALOR UNIT.</th>
                    <th width="15%" class="text-right">SUBTOTAL</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (os.itens && os.itens.length > 0) {
        os.itens.forEach(function (item) {
            let subtotal = item.quantidade * item.valorUnitario;
            html += `
                <tr>
                    <td>${item.tipo === 'Peca' ? 'Peça' : 'Serviço'}</td>
                    <td>${item.descricao}</td>
                    <td class="text-center">${item.quantidade}</td>
                    <td class="text-right">${formatarMoeda(item.valorUnitario)}</td>
                    <td class="text-right font-weight-bold">${formatarMoeda(subtotal)}</td>
                </tr>
            `;
        });
    } else {
        html += '<tr><td colspan="5" class="text-center py-3">Nenhum item adicionado a esta O.S.</td></tr>';
    }

    html += `
            </tbody>
        </table>

        <div class="row justify-content-end mt-4">
            <div class="col-5">
                <table class="table table-borderless table-sm">
                    <tr class="border-top border-bottom" style="font-size: 1.2rem;">
                        <td class="font-weight-bold">TOTAL DA O.S:</td>
                        <td class="text-right font-weight-bold text-success">${formatarMoeda(os.valorTotal)}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="row mt-5 pt-5">
            <div class="col-6 assinatura-box">
                <div class="linha-assinatura"></div>
                <span class="font-weight-bold">${nomeOficina}</span><br>
                <small class="text-muted">Responsável Técnico</small>
            </div>
            <div class="col-6 assinatura-box">
                <div class="linha-assinatura"></div>
                <span class="font-weight-bold">${os.nomeCliente}</span><br>
                <small class="text-muted">Assinatura do Cliente</small>
            </div>
        </div>
        
        <div class="text-center text-muted mt-5" style="font-size: 0.8rem;">
            Documento gerado pelo sistema SagitarioSys em ${new Date().toLocaleString('pt-BR')}.
        </div>
    `;

    $("#conteudoFolha").html(html);

    // Abre a janela de impressão automaticamente!
    setTimeout(() => { window.print(); }, 500);
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}