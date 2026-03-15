using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        } 

        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = await _repository.ObterUsuarioPorEmailAsync(request.Email);
            if (usuario == null) return Unauthorized(new { message = "E-mail ou senha incorretos." });

            bool senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, usuario.SenhaHash);
            if (!senhaValida) return Unauthorized(new { message = "E-mail ou senha incorretos." });

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
                    new Claim("TipoNegocio", usuario.TipoNegocio)
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
                Tipo = usuario.TipoNegocio,
                RotaDashboard = usuario.RotaDashboard,
                Logomarca = usuario.Logomarca
            });
        }

        [HttpGet("validar")]
        [Authorize]
        public IActionResult Validar()
        {
            return Ok(new { valid = true });
        }
    }
}