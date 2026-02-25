using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Esta linha mágica bloqueia todo o Controller. Só passa quem tiver um JWT válido.
    public class SistemaController : ControllerBase
    {
        [HttpGet("meus-dados")]
        public IActionResult GetMeusDados()
        {
            // O ASP.NET Core automaticamente lê o Token e preenche o objeto "User" para nós.
            // Aqui estamos extraindo os dados de dentro do Token criptografado:
            var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var empresaId = User.FindFirst("EmpresaId")?.Value;
            var tipoNegocio = User.FindFirst("TipoNegocio")?.Value;

            return Ok(new
            {
                Mensagem = "Se você está vendo isso, a autorização funcionou perfeitamente!",
                InstrucaoFrontEnd = $"O frontend deve montar os menus do tipo: {tipoNegocio}",
                SessaoAtual = new
                {
                    UsuarioId = usuarioId,
                    Email = email,
                    Perfil = role,
                    EmpresaId = empresaId,
                    ModuloAtivo = tipoNegocio
                }
            });
        }
    }
}