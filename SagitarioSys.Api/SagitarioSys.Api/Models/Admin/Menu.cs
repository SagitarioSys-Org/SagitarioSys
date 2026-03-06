namespace SagitarioSys.Api.Models.Admin
{
    public class Menu
    {
        public Guid Id { get; set; }
        public Guid SegmentoId { get; set; }
        public Guid? EmpresaId { get; set; }

        // NOVO: Referência para o menu pai
        public Guid? MenuPaiId { get; set; }

        public string Titulo { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
        public string Rota { get; set; } = string.Empty;
        public int Ordem { get; set; }

        public string NomeSegmento { get; set; } = string.Empty;
        public string NomeEmpresa { get; set; } = string.Empty;

        // NOVO: Apenas para mostrar bonitinho na tabela do CEO
        public string NomeMenuPai { get; set; } = string.Empty;
    }
}