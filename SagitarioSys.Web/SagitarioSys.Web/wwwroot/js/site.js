if (window.location.pathname.toLowerCase().indexOf("/home/login") === -1) {
    if (!localStorage.getItem("jwt_token")) {
        window.location.href = "/Home/Login";
    }
}

// ==========================================
// 🛡️ INJETA O TOKEN APENAS NA NOSSA API
// ==========================================
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        // Verifica se a requisição está a ir para a nossa própria API ou se é uma rota local.
        // Se for para um site externo (como DataTables ou ViaCEP), não envia o Token!
        if (settings.url.indexOf("http") === -1 || settings.url.indexOf(_url) !== -1) {
            var token = localStorage.getItem("jwt_token");
            if (token) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            }
        }
    }
});

// ==========================================
// 🚨 INTERCEPTADOR GLOBAL DE SESSÃO EXPIRADA
// ==========================================
$(document).ajaxError(function (event, jqxhr, settings, thrownError) {
    if (jqxhr.status === 401) {
        console.warn("Sessão expirada! Redirecionando para a tela de login...");
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/Home/Login";
    }
});

$(document).ready(function () {
    if (window.location.pathname.toLowerCase().indexOf("/home/login") !== -1) {
        return;
    }

    // 2. PREENCHER DADOS DO USUÁRIO NA SIDEBAR
    const userName = localStorage.getItem("user_nome") || "Usuário";
    const userTipo = localStorage.getItem("user_tipo") || "Convidado";

    $("#lblNomeUsuario").text(userName);
    $("#lblTipoEmpresa").text(userTipo.toUpperCase());

    // 3. CONSTRUÇÃO DINÂMICA DO MENU
    renderizarMenuDinamico(userTipo);
});

// Função de Logout
function sairSistema() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/Home/Login";
}

// ==========================================
// RENDERIZAÇÃO DINÂMICA DO MENU (MULTI-TENANT)
// ==========================================
function renderizarMenuDinamico(nomeSegmento) {
    const $menuContainer = $("#menuDinamico");

    // 1. TENTA LER O MENU DA MEMÓRIA INSTANTÂNEA
    const menuCache = sessionStorage.getItem("menu_html_cache");

    if (menuCache) {
        $menuContainer.html(menuCache);
        marcarMenuAtivo();
        // LINHA REMOVIDA AQUI: O AdminLTE já escuta os cliques naturalmente!
        return;
    }

    $menuContainer.html('<li class="nav-item"><a href="#" class="nav-link"><i class="fas fa-spinner fa-spin nav-icon"></i><p>Carregando menus...</p></a></li>');

    if (!nomeSegmento) return;

    $.ajax({
        url: `${_url}api/Menus/meus-menus?segmento=${encodeURIComponent(nomeSegmento)}`,
        type: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("jwt_token") },
        success: function (menus) {
            let menuHtml = `
                <li class="nav-header">${nomeSegmento.toUpperCase()}</li>
            `;

            const menusPrincipais = menus.filter(m => !m.menuPaiId);
            const menusFilhos = menus.filter(m => m.menuPaiId);

            menusPrincipais.forEach(function (pai) {
                const filhosDestePai = menusFilhos.filter(f => f.menuPaiId === pai.id);

                if (filhosDestePai.length > 0) {
                    menuHtml += `
                        <li class="nav-item has-treeview">
                            <a href="#" class="nav-link">
                                <i class="nav-icon ${pai.icone}"></i>
                                <p>
                                    ${pai.titulo}
                                    <i class="right fas fa-angle-left"></i>
                                </p>
                            </a>
                            <ul class="nav nav-treeview">
                    `;

                    filhosDestePai.forEach(function (filho) {
                        menuHtml += `
                                <li class="nav-item">
                                    <a href="${filho.rota}" class="nav-link">
                                        <i class="nav-icon ${filho.icone}"></i>
                                        <p>${filho.titulo}</p>
                                    </a>
                                </li>
                        `;
                    });

                    menuHtml += `
                            </ul>
                        </li>
                    `;
                } else {
                    menuHtml += `
                        <li class="nav-item">
                            <a href="${pai.rota}" class="nav-link">
                                <i class="nav-icon ${pai.icone}"></i>
                                <p>${pai.titulo}</p>
                            </a>
                        </li>
                    `;
                }
            });

            // SALVA NA MEMÓRIA PARA AS PRÓXIMAS TELAS!
            sessionStorage.setItem("menu_html_cache", menuHtml);

            $menuContainer.html(menuHtml);
            marcarMenuAtivo();
            // LINHA REMOVIDA AQUI TAMBÉM!
        },
        error: function () {
            $menuContainer.html('<li class="nav-item"><a href="#" class="nav-link text-danger"><i class="fas fa-exclamation-triangle nav-icon"></i><p>Erro nos menus</p></a></li>');
        }
    });
}

// ==========================================
// MANTÉM O MENU ABERTO NA PÁGINA ATUAL
// ==========================================
function marcarMenuAtivo() {
    var pathAtual = window.location.pathname.toLowerCase();

    if (pathAtual === "/" || pathAtual === "") return;

    $(".nav-sidebar a.nav-link").each(function () {
        var href = $(this).attr("href");

        if (href && href !== "#" && pathAtual.includes(href.toLowerCase())) {

            // 1. Marca o link atual de verde
            $(this).addClass("active");

            // 2. Acha a "pasta pai"
            var $menuPai = $(this).closest(".has-treeview");

            if ($menuPai.length > 0) {
                // 3. Adiciona as classes do AdminLTE
                $menuPai.addClass("menu-open");
                $menuPai.children("a.nav-link").addClass("active");

                // 4. Força a visualização no CSS para a animação de fechar poder ler a altura real
                $menuPai.children(".nav-treeview").css("display", "block");
            }
        }
    });
}