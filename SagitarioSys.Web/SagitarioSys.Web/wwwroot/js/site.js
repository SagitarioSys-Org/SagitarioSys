// ==================================================
// LÓGICA GLOBAL DO PAINEL ADMINISTRATIVO
// ==================================================

// 1. PROTEÇÃO DE ROTA IMEDIATA
// Se não estiver na tela de login E não tiver token, expulsa.
if (window.location.pathname.toLowerCase().indexOf("/home/login") === -1) {
    if (!localStorage.getItem("jwt_token")) {
        console.warn("Tentativa de acesso não autorizado. Redirecionando para login.");
        window.location.href = "/Home/Login";
    }
}

$(document).ready(function () {
    // Se estivermos na tela de login, não executa o resto do script do painel
    if (window.location.pathname.toLowerCase().indexOf("/home/login") !== -1) {
        return;
    }

    // 2. PREENCHER DADOS DO USUÁRIO NA SIDEBAR
    const userName = localStorage.getItem("user_nome") || "Usuário";
    const userTipo = localStorage.getItem("user_tipo") || "Convidado";

    // Atualiza os elementos no _Sidebar.cshtml
    $("#lblNomeUsuario").text(userName);
    $("#lblTipoEmpresa").text(userTipo.toUpperCase());

    // 3. CONSTRUÇÃO DINÂMICA DO MENU (Opcional para este passo, mas já deixamos pronto)
    renderizarMenuDinamico(userTipo);
});

// Função de Logout
function sairSistema() {
    // Limpa os dados sensíveis
    localStorage.clear();
    // Redireciona para o login
    window.location.href = "/Home/Login";
}


// ==========================================
// RENDERIZAÇÃO DINÂMICA DO MENU (MULTI-TENANT)
// ==========================================
function renderizarMenuDinamico(nomeSegmento) {
    const $menuContainer = $("#menuDinamico");
    $menuContainer.append('<li class="nav-item"><a href="#" class="nav-link"><i class="fas fa-spinner fa-spin nav-icon"></i><p>Carregando menus...</p></a></li>');

    if (!nomeSegmento) return;

    $.ajax({
        url: `https://localhost:44373/api/Menus/meus-menus?segmento=${encodeURIComponent(nomeSegmento)}`,
        type: "GET",
        headers: { "Authorization": "Bearer " + localStorage.getItem("jwt_token") },
        success: function (menus) {
            $menuContainer.empty();

            let menuHtml = `
                <li class="nav-item">
                    <a href="/Home/Index" class="nav-link">
                        <i class="nav-icon fas fa-tachometer-alt"></i>
                        <p>Dashboard</p>
                    </a>
                </li>
                <li class="nav-header">${nomeSegmento.toUpperCase()}</li>
            `;

            // SEPARA OS MENUS EM DUAS LISTAS: PAIS e FILHOS
            const menusPrincipais = menus.filter(m => !m.menuPaiId);
            const menusFilhos = menus.filter(m => m.menuPaiId);

            menusPrincipais.forEach(function (pai) {
                // Procura os filhos deste pai específico
                const filhosDestePai = menusFilhos.filter(f => f.menuPaiId === pai.id);

                if (filhosDestePai.length > 0) {
                    // É UM MENU "PASTA" (COM SUB-MENUS)
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
                                        <i class="nav-icon ${filho.icone} ml-3" style="font-size: 0.8em;"></i>
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
                    // É UM MENU NORMAL (SEM FILHOS)
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

            $menuContainer.append(menuHtml);
            marcarMenuAtivo($menuContainer);
        },
        error: function () {
            $menuContainer.html('<li class="nav-item"><a href="#" class="nav-link text-danger"><i class="fas fa-exclamation-triangle nav-icon"></i><p>Erro nos menus</p></a></li>');
        }
    });
}


function marcarMenuAtivo($menuContainer) {
    const currentPath = window.location.pathname.toLowerCase();
    $menuContainer.find('.nav-link').each(function () {
        if ($(this).attr('href').toLowerCase() === currentPath) {
            $menuContainer.find('.nav-link').removeClass('active');
            $(this).addClass('active');
        }
    });
}
