namespace SagitarioSys.Api.Models.Admin
{
    public class Usuario
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; } // Vínculo com o Tenant
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string SenhaHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Usuario"; // Para controle de acesso (Admin, etc)
        public string? TwoFactorSecret { get; set; }
        public bool Is2FaAtivo { get; set; }
        public DateTime DataCriacao { get; set; }
    }
}