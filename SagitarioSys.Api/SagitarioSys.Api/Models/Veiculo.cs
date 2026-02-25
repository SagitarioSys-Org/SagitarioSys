namespace SagitarioSys.Api.Models
{
    public class Veiculo
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public Guid ClienteId { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Ano { get; set; }
        public string? Cor { get; set; }
        public string? Observacoes { get; set; }
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }

        // Campos auxiliares (não existem na tabela Veiculos, mas vêm do JOIN com Clientes)
        public string NomeCliente { get; set; } = string.Empty;
        public string TelefoneCliente { get; set; } = string.Empty;
    }
}