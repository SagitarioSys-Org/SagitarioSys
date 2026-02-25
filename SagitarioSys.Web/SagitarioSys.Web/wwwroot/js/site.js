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

// Função placeholder para renderizar menus (vamos implementar em breve)
// ==========================================
// RENDERIZAÇÃO DINÂMICA DO MENU (MULTI-TENANT)
// ==========================================
// ==========================================
// RENDERIZAÇÃO DINÂMICA DO MENU (VIA BANCO DE DADOS)
// ==========================================
function renderizarMenuDinamico(nomeSegmento) {
    const $menuContainer = $("#menuDinamico");

    // Mostra um loading rápido
    $menuContainer.append('<li class="nav-item"><a href="#" class="nav-link"><i class="fas fa-spinner fa-spin nav-icon"></i><p>Carregando menus...</p></a></li>');

    // Se não tiver segmento, não carrega (segurança extra)
    if (!nomeSegmento) return;

    // Faz a requisição para a nossa API buscar os botões
    $.ajax({
        // IMPORTANTE: Envia o nome do segmento na URL para a API filtrar
        url: `https://localhost:44373/api/Menus/meus-menus?segmento=${encodeURIComponent(nomeSegmento)}`,
        type: "GET",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("jwt_token")
        },
        success: function (menus) {
            // Limpa o loading e o botão de Dashboard padrão (vamos recriar)
            $menuContainer.empty();

            // 1. Dashboard Fixo (Sempre o primeiro)
            let menuHtml = `
                <li class="nav-item">
                    <a href="/Home/Index" class="nav-link">
                        <i class="nav-icon fas fa-tachometer-alt"></i>
                        <p>Dashboard</p>
                    </a>
                </li>
                <li class="nav-header">${nomeSegmento.toUpperCase()}</li>
            `;

            // 2. Itera sobre os menus que vieram do PostgreSQL
            menus.forEach(function (menu) {
                menuHtml += `
                    <li class="nav-item">
                        <a href="${menu.rota}" class="nav-link">
                            <i class="nav-icon ${menu.icone}"></i>
                            <p>${menu.titulo}</p>
                        </a>
                    </li>
                `;
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
