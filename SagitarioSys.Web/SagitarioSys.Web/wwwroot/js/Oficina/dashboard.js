$(document).ready(function () {
    // 1. Inicia os Widgets de Entretenimento e Utilidade
    iniciarRelogio();   
    carregarClimaEInfoLocal();

    // 2. Traz o Nome do Usuário Logado
    var nomeUsuario = localStorage.getItem("usuario_nome");
    if (nomeUsuario) {
        $("#lblNomeUsuario").text(nomeUsuario);
    }

    // 3. Inicia o Cérebro de Gestão da Oficina (O Novo Motor!)
    carregarDadosDashboardGestao();
});


// ==========================================
// 🚀 BLOCO DE GESTÃO: FINANCEIRO, ESTOQUE E O.S. (NOVO)
// ==========================================
function carregarDadosDashboardGestao() {
    $.when(
        $.get(_url + "api/Oficina/OrdensServico"),
        $.get(_url + "api/Oficina/Estoque")
    ).done(function (osResponse, estoqueResponse) {

        const ordens = osResponse[0];
        const estoque = estoqueResponse[0];

        processarEstoque(estoque);
        processarFinanceiroEOs(ordens, estoque);

    }).fail(function () {
        console.error("Erro ao carregar dados de gestão do dashboard.");
    });
}

function processarEstoque(estoque) {
    let qtdItensBaixo = 0;
    let htmlLista = "";

    $("#dashTotalPecas").text(estoque.length);

    estoque.forEach(p => {
        if (p.quantidade <= p.estoqueMinimo) {
            qtdItensBaixo++;
            htmlLista += `
                <div class="p-3 mb-2 rounded" style="background-color: #fffbeb; border: 1px solid #fde68a;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="font-weight-bold" style="color: #b45309; font-size: 0.9rem;">${p.nome}</div>
                            <div style="color: #d97706; font-size: 0.75rem;">Qtd: ${p.quantidade} / Min: ${p.estoqueMinimo}</div>
                        </div>
                        <a href="/Estoque/Index" class="btn btn-sm bg-white font-weight-bold shadow-sm" style="color: #d97706; border: 1px solid #fde68a; font-size: 0.75rem;">Repor</a>
                    </div>
                </div>
            `;
        }
    });

    $("#dashAlertasEstoque").text(qtdItensBaixo);

    if (qtdItensBaixo > 0) {
        $("#listaEstoqueBaixo").html(htmlLista);
    } else {
        $("#listaEstoqueBaixo").html('<div class="text-center text-muted mt-4"><i class="fas fa-check-circle text-success mb-2" style="font-size: 2rem;"></i><br>Estoque sob controle!</div>');
    }
}

function processarFinanceiroEOs(ordens, estoque) {
    let osPendentes = 0;
    let receitaMes = 0;
    let custoPecasMes = 0;
    let despesas = 0;

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    ordens.forEach(os => {
        if (os.status !== "Concluida" && os.status !== "Cancelada") {
            osPendentes++;
        }

        const dataOS = new Date(os.dataAbertura);
        if (dataOS.getMonth() === mesAtual && dataOS.getFullYear() === anoAtual) {
            receitaMes += os.valorTotal;

            if (os.itens) {
                os.itens.forEach(item => {
                    if (item.tipo === "Peca" && item.pecaId) {
                        let pecaEstoque = estoque.find(p => p.id === item.pecaId);
                        if (pecaEstoque) {
                            custoPecasMes += (item.quantidade * pecaEstoque.custo);
                        }
                    }
                });
            }
        }
    });

    $("#dashOsPendentes").text(osPendentes);

    let lucroLiquido = receitaMes - custoPecasMes - despesas;
    $("#dashLucro").text(lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    desenharGrafico(receitaMes, custoPecasMes, despesas, lucroLiquido);
}

function desenharGrafico(receita, custo, despesas, lucro) {
    const ctx = document.getElementById('graficoFinanceiro').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Receita', 'Custo Peças', 'Despesas', 'Lucro Líquido'],
            datasets: [{
                label: 'Valores em R$',
                data: [receita, custo, despesas, lucro],
                backgroundColor: [
                    '#10b981', '#f59e0b', '#ef4444',
                    lucro >= 0 ? '#059669' : '#dc2626'
                ],
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [5, 5], color: '#e4e4e7' },
                    ticks: { callback: function (value) { return 'R$ ' + value; } }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ==========================================
// 📰 BLOCO DE WIDGETS: CLIMA E NOTÍCIAS (LEGADO MANTIDO)
// ==========================================
function iniciarRelogio() {
    setInterval(function () {
        const agora = new Date();
        const opcoesData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let dataFormatada = agora.toLocaleDateString('pt-BR', opcoesData);
        dataFormatada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
        const horaFormatada = agora.toLocaleTimeString('pt-BR');

        $("#lblDataAtual").text(dataFormatada);
        $("#lblHoraAtual").text(horaFormatada);
    }, 1000);
}

function carregarClimaEInfoLocal() {
    $("#weatherContent").hide();
    $("#weatherLoading").show();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                buscarDadosClima(position.coords.latitude, position.coords.longitude);
                buscarCidadeENoticias(position.coords.latitude, position.coords.longitude);
            },
            function (error) {
                buscarDadosClima(-23.5505, -46.6333);
                buscarCidadeENoticias(null, null);
            }
        );
    } else {
        buscarDadosClima(-23.5505, -46.6333);
        buscarCidadeENoticias(null, null);
    }
}

function buscarDadosClima(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    $.get(url, function (data) {
        if (data && data.current_weather) {
            const clima = data.current_weather;
            $("#lblTemp").text(Math.round(clima.temperature));
            $("#lblVento").text(Math.round(clima.windspeed) + " km/h");

            let condicao = "Céu Limpo";
            let icone = "fas fa-sun text-warning";

            if (clima.weathercode >= 1 && clima.weathercode <= 3) {
                condicao = "Nublado"; icone = "fas fa-cloud-sun text-secondary";
            } else if (clima.weathercode >= 45 && clima.weathercode <= 48) {
                condicao = "Neblina"; icone = "fas fa-smog text-secondary";
            } else if (clima.weathercode >= 51 && clima.weathercode <= 67) {
                condicao = "Chuva"; icone = "fas fa-cloud-rain text-primary";
            } else if (clima.weathercode >= 71 && clima.weathercode <= 86) {
                condicao = "Frio Extremo"; icone = "fas fa-temperature-low text-info";
            } else if (clima.weathercode >= 95) {
                condicao = "Tempestade"; icone = "fas fa-bolt text-danger";
            }

            $("#lblCondicao").text(condicao);
            $("#iconeClima").attr("class", `${icone} fa-4x mb-3 mt-2`);
            $("#weatherLoading").hide();
            $("#weatherContent").fadeIn();
        }
    });
}

function buscarCidadeENoticias(lat, lon) {
    if (lat && lon) {
        const urlGeo = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
        $.get(urlGeo, function (data) {
            const cidade = data.city || data.locality || "Presidente Prudente";

            $("#lblCidadeNoticias").text(cidade);

            carregarFeedDeNoticias(cidade, "local");
            carregarFeedDeNoticias("esportes", "esportes");
        });
    } else {
        $("#lblCidadeNoticias").text("Brasil");
        carregarFeedDeNoticias("Brasil", "local");
        carregarFeedDeNoticias("esportes", "esportes");
    }
}

function carregarFeedDeNoticias(query, tipo) {
    let rssUrl = "";
    let targetDiv = "";
    let corIcone = "";

    if (tipo === "local") {
        rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        targetDiv = "#boxNoticiasLocais";
        corIcone = "text-info";
    } else if (tipo === "esportes") {
        rssUrl = "https://news.google.com/news/rss/headlines/section/topic/SPORTS?hl=pt-BR&gl=BR&ceid=BR:pt-419";
        targetDiv = "#boxNoticiasEsportes";
        corIcone = "text-success";
    }

    const urlRss2Json = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    $.get(urlRss2Json, function (data) {
        let html = "";
        if (data && data.status === 'ok' && data.items) {
            const topNoticias = data.items.slice(0, 3);

            topNoticias.forEach(n => {
                let tituloLimpo = n.title.split(" - ")[0];
                const dataPublicacao = new Date(n.pubDate.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

                html += `
                <div class="mb-3 border-bottom pb-2">
                    <h6 class="font-weight-bold text-dark mb-1" style="font-size: 0.95rem; line-height: 1.3;">
                        <a href="${n.link}" target="_blank" class="text-dark text-decoration-none">
                            <i class="fas fa-angle-right ${corIcone} mr-1"></i> ${tituloLimpo}
                        </a>
                    </h6>
                    <small class="text-muted" style="font-size: 0.75rem;"><i class="far fa-clock mr-1"></i> ${dataPublicacao}</small>
                </div>`;
            });
            $(targetDiv).html(html);
        }
    }).fail(function () {
        $(targetDiv).html('<p class="text-danger text-center mt-3"><i class="fas fa-exclamation-triangle mr-1"></i> Erro ao carregar as notícias.</p>');
    });
}