using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SagitarioSys.Api.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthRepository _repository;
        private readonly IConfiguration _configuration;

        public AuthController(AuthRepository repository, IConfiguration configuration)
        {
            _repository = repository;
            _configuration = configuration;
        }

        // Classe auxiliar para receber os dados do Swagger/Frontend
        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // 1. Busca o usuário no banco
            var usuario = await _repository.ObterUsuarioPorEmailAsync(request.Email);
            if (usuario == null) return Unauthorized(new { message = "E-mail ou senha incorretos." });

            // 2. Verifica a senha com o BCrypt
            bool senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);
            if (!senhaValida) return Unauthorized(new { message = "E-mail ou senha incorretos." });

            // 3. Gera o Token JWT contendo o TipoNegocio e o EmpresaId
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:SecurityKey"]!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                    new Claim(ClaimTypes.Email, usuario.Email),
                    new Claim(ClaimTypes.Role, usuario.Role),
                    new Claim("EmpresaId", usuario.EmpresaId.ToString()),
                    new Claim("TipoNegocio", usuario.TipoNegocio) // Oficina, Sorveteria, etc
                }),
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiryInMinutes"])),
                Issuer = _configuration["JwtSettings:Issuer"],
                Audience = _configuration["JwtSettings:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtStr = tokenHandler.WriteToken(token);

            return Ok(new
            {
                Token = jwtStr,
                Usuario = usuario.Nome,
                Empresa = usuario.NomeFantasia,
                Tipo = usuario.TipoNegocio
            });
        }

        // ENDPOINT PARA TESTE: Gera um usuário no banco com a senha já com Hash
        [HttpPost("setup-teste")]
        public async Task<IActionResult> SetupTeste()
        {
            try
            {
                // Gera o hash da senha "123456"
                string senhaHash = BCrypt.Net.BCrypt.HashPassword("123456");
                await _repository.CriarUsuarioDeTesteAsync(senhaHash);
                return Ok(new { message = "Usuário de teste criado! Email: admin@teste.com | Senha: 123456" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erro (talvez o usuário já exista).", detalhe = ex.Message });
            }
        }
    }
}