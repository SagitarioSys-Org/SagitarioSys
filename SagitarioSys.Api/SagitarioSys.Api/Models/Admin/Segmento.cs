namespace SagitarioSys.Api.Models.Admin
{
    public class Segmento
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public string rotadashboard { get; set; } = string.Empty;
    }
}