// 1. VERIFICAÇÃO DE ROTA DE LOGIN
if (window.location.pathname.toLowerCase().indexOf("/admin/home/login") === -1) {
    if (!localStorage.getItem("jwt_token")) {
        window.location.href = "/Admin/Home/Login";
    }
}

// ==========================================
// 🛡️ INJETA O TOKEN APENAS NA NOSSA API
// ==========================================
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
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
        localStorage.clear();
        sessionStorage.clear();
        Swal.fire({
            title: 'Sessão Expirada',
            text: 'Sua sessão expirou. Faça login novamente.',
            icon: 'warning',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = "/Admin/Home/Login";
        });
    }
});


$(document).ready(function () {
    // Evita rodar a lógica de menu se estiver na tela de login
    if (window.location.pathname.toLowerCase().indexOf("/admin/home/login") !== -1) {
        return;
    }

    // 2. PREENCHER DADOS DO USUÁRIO NA SIDEBAR
    const userName = localStorage.getItem("user_empresa") || "Usuário";
    const userTipo = localStorage.getItem("user_tipo") || "Convidado";

    // Sempre define o texto (mesmo que fique oculto)
    $("#lblNomeUsuario").text(userName);
    $("#lblTipoEmpresa").text(userTipo.toUpperCase()); 

    var TemLogo = localStorage.getItem("empresa_logo");

    var UrlSemBarraNoFinal =  _url.slice(0, -1);

    var logo = UrlSemBarraNoFinal + localStorage.getItem("empresa_logo");  

    if (TemLogo && TemLogo.trim() !== "") {
        $("#imgLogoSidebar").attr("src", logo).show();
        $("#lblNomeUsuario").hide();
        $("#lblTipoEmpresa").hide();
    } else {
        $("#imgLogoSidebar").hide();
        $("#lblNomeUsuario").show();
        $("#lblTipoEmpresa").show();
    } 

    // 3. CONSTRUÇÃO DINÂMICA DO MENU
    renderizarMenuDinamico(userTipo);
});

// Função de Logout
function sairSistema() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/Admin/Home/Login";
}

// ==========================================
// RENDERIZAÇÃO DINÂMICA DO MENU (MULTI-TENANT)
// ==========================================
function renderizarMenuDinamico(nomeSegmento) {
    const $menuContainer = $("#menuDinamico");

    const menuCache = sessionStorage.getItem("menu_html_cache");

    if (menuCache) {
        $menuContainer.html(menuCache);
        marcarMenuAtivo();
        return;
    }

    $menuContainer.html('<li class="nav-item"><a href="#" class="nav-link"><i class="fas fa-spinner fa-spin nav-icon"></i><p>Carregando menus...</p></a></li>');

    if (!nomeSegmento) return;

    $.ajax({
        url: `${_url}api/Admin/Menus/meus-menus?segmento=${encodeURIComponent(nomeSegmento)}`,
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

            sessionStorage.setItem("menu_html_cache", menuHtml);
            $menuContainer.html(menuHtml);
            marcarMenuAtivo();
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
            $(this).addClass("active");

            var $menuPai = $(this).closest(".has-treeview");

            if ($menuPai.length > 0) {
                $menuPai.addClass("menu-open");
                $menuPai.children("a.nav-link").addClass("active");
                $menuPai.children(".nav-treeview").css("display", "block");
            }
        }
    });
}