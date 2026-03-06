// Arquivo: Models/ContatoCliente.cs
namespace SagitarioSys.Api.Models.Oficina
{
    public class ContatoCliente
    {
        public Guid Id { get; set; }
        public Guid ClienteId { get; set; }
        public string? Contato { get; set; }
        public string? Email { get; set; }
        public string? Observacao { get; set; }
    }
}