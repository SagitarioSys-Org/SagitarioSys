namespace SagitarioSys.Api.Models.Oficina
{
    public class Veiculo
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public Guid ClienteId { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int AnoFabricacao { get; set; }
        public int AnoModelo { get; set; }
        public string? Cor { get; set; }
        public string? Observacoes { get; set; }

        public int KmAtual { get; set; }

        // Auxiliares
        public string NomeCliente { get; set; } = string.Empty;
        public string TelefoneCliente { get; set; } = string.Empty;
    }
}