// Arquivo: Models/Cliente.cs
namespace SagitarioSys.Api.Models.Oficina
{
    public class Cliente
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? Cep { get; set; }
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }

        // A lista que vai carregar os múltiplos contatos
        public List<ContatoCliente> Contatos { get; set; } = new List<ContatoCliente>();
    }
}