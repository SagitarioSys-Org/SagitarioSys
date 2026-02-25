namespace SagitarioSys.Api.Models
{
    public class Cliente
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; } // O vínculo vital com o inquilino (Tenant)
        public string Nome { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string? WhatsApp { get; set; }
        public string? Observacoes { get; set; }
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }
    }
}