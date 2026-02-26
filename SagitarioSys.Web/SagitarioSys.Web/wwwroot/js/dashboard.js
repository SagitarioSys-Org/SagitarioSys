$(document).ready(function () {
    iniciarRelogio();
    carregarFraseDoDia();
    carregarClimaEInfoLocal();

    var nomeUsuario = localStorage.getItem("usuario_nome");
    if (nomeUsuario) {
        $("#lblNomeUsuario").text(nomeUsuario);
    }
});

// ==========================================
// 1. RELÓGIO E DATA
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

// ==========================================
// 2. FRASES MOTIVACIONAIS EM PORTUGUÊS (API DocApi.dev)
// ==========================================
function carregarFraseDoDia() {
    $("#lblQuote").text("Buscando inspiração...");
    $("#lblQuoteAuthor").text("");

    // Usando a API nativa em Português sugerida por você!
    const urlApi = "https://frases.docapi.dev/frase/obter";

    $.ajax({
        url: urlApi,
        type: "GET",
        // Ignora a injeção do token JWT do seu sistema para essa requisição pública
        beforeSend: function (xhr) { },
        success: function (data) {
            // A API retorna um objeto com a propriedade "resposta" contendo um array de frases
            if (data && data.resposta && data.resposta.length > 0) {

                // Sorteia uma frase aleatória do banco de dados deles
                const indexAleatorio = Math.floor(Math.random() * data.resposta.length);
                const fraseEscolhida = data.resposta[indexAleatorio];

                $("#lblQuote").text(`"${fraseEscolhida.frase}"`);

                // Previne que o autor venha vazio ou nulo
                let autor = fraseEscolhida.nomeAutor;
                if (!autor || autor.trim() === "") {
                    autor = "Autor Desconhecido";
                }
                $("#lblQuoteAuthor").text(`- ${autor}`);
            } else {
                chamarFraseFallback();
            }
        },
        error: function () {
            // Se a API externa cair ou o usuário estiver sem internet, aciona o plano B
            chamarFraseFallback();
        }
    });
}

// PLANO B: Rede de segurança local para o painel nunca ficar vazio
function chamarFraseFallback() {
    const frasesFallback = [
        { q: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", a: "Robert Collier" },
        { q: "A inovação distingue um líder de um seguidor.", a: "Steve Jobs" },
        { q: "Não tenha medo de desistir do bom para perseguir o ótimo.", a: "John D. Rockefeller" }
    ];
    const index = Math.floor(Math.random() * frasesFallback.length);
    $("#lblQuote").text(`"${frasesFallback[index].q}"`);
    $("#lblQuoteAuthor").text(`- ${frasesFallback[index].a}`);
}

// ==========================================
// 3. GEOLOCALIZAÇÃO: CLIMA E NOTÍCIAS G1
// ==========================================
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
                buscarDadosClima(-23.5505, -46.6333); // Padrão: SP
                buscarCidadeENoticias(null, null);
            }
        );
    } else {
        buscarDadosClima(-23.5505, -46.6333);
        buscarCidadeENoticias(null, null);
    }
}

// Clima (Mantido o mesmo)
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

// O NOVO HACK DAS NOTÍCIAS DO G1
// O NOVO MOTOR DUPLO DE NOTÍCIAS
function buscarCidadeENoticias(lat, lon) {
    if (lat && lon) {
        const urlGeo = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
        $.get(urlGeo, function (data) {
            const cidade = data.city || data.locality || "Brasil";

            $("#lblCidadeNoticias").text(cidade);

            // Dispara as duas buscas separadas
            carregarFeedDeNoticias(cidade, "local");
            carregarFeedDeNoticias("esportes", "esportes");
        });
    } else {
        $("#lblCidadeNoticias").text("Brasil");
        carregarFeedDeNoticias("Brasil", "local");
        carregarFeedDeNoticias("esportes", "esportes");
    }
}

// Função genérica que busca e desenha o feed na tela
// Função genérica que busca e desenha o feed na tela
function carregarFeedDeNoticias(query, tipo) {
    let rssUrl = "";
    let targetDiv = "";
    let corIcone = "";

    if (tipo === "local") {
        // Usa o Google News para pesquisar notícias exatamente sobre a sua cidade
        rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        targetDiv = "#boxNoticiasLocais";
        corIcone = "text-info";
    } else if (tipo === "esportes") {
        // Usa a categoria oficial de Esportes Nacionais do Google News (Agrega GE, UOL, ESPN, etc)
        rssUrl = "https://news.google.com/news/rss/headlines/section/topic/SPORTS?hl=pt-BR&gl=BR&ceid=BR:pt-419";
        targetDiv = "#boxNoticiasEsportes";
        corIcone = "text-success";
    }

    const urlRss2Json = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    $.get(urlRss2Json, function (data) {
        let html = "";
        if (data && data.status === 'ok' && data.items) {
            // Pegamos as 3 primeiras notícias
            const topNoticias = data.items.slice(0, 3);

            topNoticias.forEach(n => {
                // Limpa o título (Remove o nome do site que o Google anexa no final, ex: " - ge.globo")
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