namespace SagitarioSys.Api.Models
{
    public class Segmento
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public bool Ativo { get; set; }
    }
}