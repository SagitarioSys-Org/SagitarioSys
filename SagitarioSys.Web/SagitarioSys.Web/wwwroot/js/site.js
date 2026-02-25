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
function renderizarMenuDinamico(tipoNegocio) {
    const $menuContainer = $("#menuDinamico");

    // Converte para minúsculo para facilitar a comparação
    const tipo = tipoNegocio ? tipoNegocio.toLowerCase() : "";
    let menuHtml = "";

    // 🛠️ MENUS DA OFICINA MECÂNICA
    if (tipo === "oficina") {
        menuHtml += `
            <li class="nav-header">OFICINA MECÂNICA</li>
            <li class="nav-item">
                <a href="/Clientes/Index" class="nav-link">
                    <i class="nav-icon fas fa-users"></i>
                    <p>Clientes</p>
                </a>
            </li>
            <li class="nav-item">
                <a href="/Veiculos/Index" class="nav-link">
                    <i class="nav-icon fas fa-car"></i>
                    <p>Veículos</p>
                </a>
            </li>
            <li class="nav-item">
                <a href="/Estoque/Index" class="nav-link">
                    <i class="nav-icon fas fa-boxes"></i>
                    <p>Estoque & Peças</p>
                </a>
            </li>
            <li class="nav-item">
                <a href="/OS/Index" class="nav-link">
                    <i class="nav-icon fas fa-clipboard-list"></i>
                    <p>Ordens de Serviço <span class="badge badge-info right">Novo</span></p>
                </a>
            </li>
            <li class="nav-header">FINANCEIRO</li>
            <li class="nav-item">
                <a href="/Financeiro/LucroReal" class="nav-link">
                    <i class="nav-icon fas fa-chart-line"></i>
                    <p>Lucro Real</p>
                </a>
            </li>
        `;
    }
    // 🍦 MENUS DA SORVETERIA (Exemplo futuro)
    else if (tipo === "sorveteria") {
        menuHtml += `
            <li class="nav-header">FRENTE DE CAIXA</li>
            <li class="nav-item">
                <a href="/PDV/Index" class="nav-link">
                    <i class="nav-icon fas fa-cash-register"></i>
                    <p>Ponto de Venda (PDV)</p>
                </a>
            </li>
            <li class="nav-item">
                <a href="/Produtos/Index" class="nav-link">
                    <i class="nav-icon fas fa-ice-cream"></i>
                    <p>Sabores e Produtos</p>
                </a>
            </li>
        `;
    }
    // 🩺 MENUS DO CONSULTÓRIO (Exemplo futuro)
    else if (tipo === "consultorio") {
        menuHtml += `
            <li class="nav-header">ATENDIMENTO</li>
            <li class="nav-item">
                <a href="/Agenda/Index" class="nav-link">
                    <i class="nav-icon fas fa-calendar-alt"></i>
                    <p>Agenda</p>
                </a>
            </li>
            <li class="nav-item">
                <a href="/Pacientes/Index" class="nav-link">
                    <i class="nav-icon fas fa-user-injured"></i>
                    <p>Pacientes</p>
                </a>
            </li>
        `;
    }

    // Injeta o HTML gerado dentro da Sidebar
    $menuContainer.append(menuHtml);

    // Lógica para marcar o menu atual como "Ativo" (azulzinho)
    const currentPath = window.location.pathname.toLowerCase();
    $menuContainer.find('.nav-link').each(function () {
        if ($(this).attr('href').toLowerCase() === currentPath) {
            // Remove o active do Dashboard (que vem por padrão)
            $menuContainer.find('.nav-link').removeClass('active');
            // Adiciona o active no menu atual
            $(this).addClass('active');
        }
    });
}
