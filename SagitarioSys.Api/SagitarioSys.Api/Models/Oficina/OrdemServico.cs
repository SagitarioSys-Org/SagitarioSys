namespace SagitarioSys.Api.Models.Oficina
{
    public class OrdemServico
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public Guid ClienteId { get; set; }
        public Guid VeiculoId { get; set; }
        public int NumeroOS { get; set; }
        public string Status { get; set; } = "Aberta";
        public string? RelatoCliente { get; set; }
        public string? ObservacoesInternas { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataAbertura { get; set; }
        public DateTime? DataConclusao { get; set; }
        public int? KmAtual { get; set; }

        // Propriedades Auxiliares (Para mostrar na tela)
        public string NomeCliente { get; set; } = string.Empty;
        public string PlacaVeiculo { get; set; } = string.Empty;
        public string ModeloVeiculo { get; set; } = string.Empty;

        public string? ClienteCpfCnpj { get; set; }
        public string? ClienteTelefone { get; set; }
        public string? MarcaVeiculo { get; set; }

        // A Mochila de Itens (Peças e Serviços)
        public List<OrdemServicoItem> Itens { get; set; } = new List<OrdemServicoItem>();
    }
}