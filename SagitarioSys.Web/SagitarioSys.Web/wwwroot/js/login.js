// Define a URL da API (ajuste a porta se necessário)
const API_URL = "https://localhost:44373/api/Auth/login";

$(document).ready(function () {
    // Se já estiver logado, manda pro Dashboard direto
    if (localStorage.getItem("jwt_token")) {
        window.location.href = "/Home/Index";
        return;
    }

    $("#formLogin").on("submit", function (e) {
        e.preventDefault();
        fazerLogin();
    });
});

function fazerLogin() {
    var email = $("#txtEmail").val();
    var senha = $("#txtSenha").val();
    var $btn = $("#btnEntrar");
    var $alerta = $("#alertaErro");

    $btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Autenticando...');
    $alerta.addClass("d-none");

    $.ajax({
        url: API_URL,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ email: email, senha: senha }),
        success: function (response) {
            // Salva tudo no LocalStorage
            localStorage.setItem("jwt_token", response.token);
            localStorage.setItem("user_nome", response.usuario);
            localStorage.setItem("user_empresa", response.empresa);
            localStorage.setItem("user_tipo", response.tipo);

            // Redireciona com um pequeno delay para ficar elegante
            $btn.removeClass("btn-primary").addClass("btn-success").html('<i class="fas fa-check"></i> Sucesso! Redirecionando...');
            setTimeout(function () {
                window.location.href = "/Home/Index";
            }, 1000);
        },
        error: function (xhr) {
            $btn.prop("disabled", false).html('Entrar');
            var msgErro = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erro ao conectar com o servidor.";
            $alerta.text(msgErro).removeClass("d-none");
        }
    });
}