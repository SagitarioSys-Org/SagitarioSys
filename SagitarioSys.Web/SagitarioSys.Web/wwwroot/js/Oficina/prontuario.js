$("#txtBuscaPlaca").on("keypress", function (e) {
    if (e.which === 13) buscarProntuario();
});

$("#txtBuscaPlaca").on("input", function () {
    $(this).val($(this).val().toUpperCase());
});

function buscarProntuario() {
    var placa = $("#txtBuscaPlaca").val().trim().replace(/\s/g, "");

    if (!placa || placa.length < 7) {
        Swal.fire('Atenção', 'Digite uma placa válida (mínimo 7 caracteres).', 'warning');
        return;
    }

    var $btn = $("#btnBuscar");
    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Buscando...');
    $("#boxResultado").html('<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>');

    $.ajax({
        url: _url + "api/Oficina/Prontuario/" + encodeURIComponent(placa),
        type: "GET",
        success: function (data) {
            montarResultado(data);
        },
        error: function (xhr) {
            if (xhr.status === 404) {
                $("#boxResultado").html(`
                    <div class="glass-card p-5 text-center text-muted">
                        <i class="fas fa-car fa-3x mb-3"></i>
                        <h5>Nenhum veículo encontrado com a placa <strong>${placa}</strong>.</h5>
                    </div>
                `);
            } else {
                Swal.fire('Erro', 'Não foi possível consultar o prontuário.', 'error');
            }
        },
        complete: function () {
            $btn.prop("disabled", false).html('<i class="fas fa-search mr-2"></i> Buscar');
        }
    });
}

function montarResultado(data) {
    var v = data.veiculo;
    var ordens = data.ordens;

    var html = `
        <div class="glass-card p-4 mb-4 shadow-sm">
            <div class="row align-items-center">
                <div class="col-md-1 text-center">
                    <i class="fas fa-car fa-3x text-muted"></i>
                </div>
                <div class="col-md-3">
                    <span class="plate-badge" style="font-size:1.1rem; padding: 5px 14px;">${v.placa}</span>
                    <div class="mt-1 text-muted" style="font-size:0.85rem;">${v.marca} ${v.modelo}</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="font-weight-bold" style="font-size:1.1rem;">${v.anofabricacao}/${v.anomodelo}</div>
                    <div class="text-muted" style="font-size:0.8rem;">Ano Fab/Mod</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="font-weight-bold text-primary" style="font-size:1.1rem;">${(v.kmatual || 0).toLocaleString('pt-BR')} km</div>
                    <div class="text-muted" style="font-size:0.8rem;">KM Atual</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="font-weight-bold" style="font-size:1.1rem;">${v.cor || '-'}</div>
                    <div class="text-muted" style="font-size:0.8rem;">Cor</div>
                </div>
                <div class="col-md-2 text-center">
                    <div class="font-weight-bold text-success" style="font-size:1rem;">${v.nomecliente}</div>
                    <div class="text-muted" style="font-size:0.8rem;">Proprietário</div>
                </div>
            </div>
        </div>
    `;

    if (!ordens || ordens.length === 0) {
        html += `
            <div class="glass-card p-5 text-center text-muted">
                <i class="fas fa-clipboard fa-3x mb-3"></i>
                <h5>Nenhuma Ordem de Serviço encontrada para este veículo.</h5>
            </div>
        `;
    } else {
        html += `
            <div class="glass-card p-0 overflow-hidden">
                <div class="p-3 border-bottom bg-white d-flex justify-content-between align-items-center">
                    <h6 class="font-weight-bold m-0 text-uppercase" style="color:var(--zinc-500); font-size:0.8rem; letter-spacing:1px;">
                        <i class="fas fa-list mr-2"></i> Histórico de Ordens de Serviço (${ordens.length})
                    </h6>
                    <span class="font-weight-bold text-success">
                        Total gasto: ${formatarMoeda(ordens.reduce((acc, os) => acc + (os.status !== 'Cancelada' ? os.valortotal : 0), 0))}
                    </span>
                </div>
        `;

        ordens.forEach(function (os) {
            let badgeClass = "badge-secondary";
            if (os.status === "Aberta") badgeClass = "badge-primary";
            if (os.status === "Em Andamento") badgeClass = "badge-warning";
            if (os.status === "Concluida") badgeClass = "badge-success";
            if (os.status === "Faturada") badgeClass = "badge-info";
            if (os.status === "Cancelada") badgeClass = "badge-danger";

            let dataAbertura = new Date(os.dataabertura).toLocaleDateString('pt-BR');
            let numeroFormatado = String(os.numeroos).padStart(4, '0');

            let itensHtml = '';
            if (os.itens && os.itens.length > 0) {
                itensHtml += `
                    <table class="table table-sm table-borderless mb-0 mt-3">
                        <thead>
                            <tr style="color:var(--zinc-400); font-size:0.75rem; text-transform:uppercase; border-bottom: 1px solid var(--zinc-200);">
                                <th>Tipo</th><th>Descrição</th>
                                <th class="text-center">Qtd</th>
                                <th class="text-right">Valor Unit.</th>
                                <th class="text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                os.itens.forEach(function (item) {
                    let subtotal = item.quantidade * item.valorunitario;
                    itensHtml += `
                        <tr style="font-size:0.85rem;">
                            <td><span class="badge ${item.tipo === 'Peca' ? 'badge-warning' : 'badge-info'}">${item.tipo === 'Peca' ? 'Peça' : 'Serviço'}</span></td>
                            <td>${item.descricao}</td>
                            <td class="text-center">${item.quantidade}</td>
                            <td class="text-right">${formatarMoeda(item.valorunitario)}</td>
                            <td class="text-right font-weight-bold">${formatarMoeda(subtotal)}</td>
                        </tr>
                    `;
                });
                itensHtml += '</tbody></table>';
            }

            html += `
                <div class="p-4 border-bottom" style="border-left: 4px solid ${os.status === 'Faturada' ? '#17a2b8' : os.status === 'Cancelada' ? '#dc3545' : '#28a745'};">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="font-weight-bold" style="font-family:'JetBrains Mono'; font-size:1rem;">OS #${numeroFormatado}</span>
                            <span class="badge ${badgeClass} ml-2 px-2 py-1" style="font-size:0.75rem;">${os.status.toUpperCase()}</span>
                            <div class="text-muted mt-1" style="font-size:0.85rem;">
                                <i class="fas fa-calendar mr-1"></i> ${dataAbertura}
                                &nbsp;|&nbsp;
                                <i class="fas fa-tachometer-alt mr-1"></i> ${os.kmatual ? os.kmatual.toLocaleString('pt-BR') + ' km' : 'KM não informado'}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-weight-bold text-success" style="font-size:1.2rem;">${formatarMoeda(os.valortotal)}</div>
                            <a href="/Oficina/OrdensServico/Imprimir/${os.id}" target="_blank" 
                               class="btn btn-sm btn-light border mt-1" title="Imprimir OS">
                                <i class="fas fa-file-pdf text-danger mr-1"></i> PDF
                            </a>
                        </div>
                    </div>
                    ${os.relatocliente ? `<div class="mt-2 text-muted" style="font-size:0.85rem;"><strong>Relato:</strong> ${os.relatocliente}</div>` : ''}
                    ${os.observacoesinternas ? `<div class="text-muted" style="font-size:0.85rem;"><strong>Obs. Mecânico:</strong> ${os.observacoesinternas}</div>` : ''}
                    ${itensHtml}
                </div>
            `;
        });

        html += '</div>';
    }

    $("#boxResultado").html(html);
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
