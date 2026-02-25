namespace SagitarioSys.Api.Models
{
    public class Menu
    {
        public Guid Id { get; set; }
        public Guid SegmentoId { get; set; }

        // Nullable (Guid?) porque a maioria dos menus não é exclusivo de uma empresa
        public Guid? EmpresaId { get; set; }

        public string Titulo { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
        public string Rota { get; set; } = string.Empty;
        public int Ordem { get; set; }

        // Propriedades auxiliares para exibirmos nomes bonitos na tela do CEO
        public string NomeSegmento { get; set; } = string.Empty;
        public string NomeEmpresa { get; set; } = string.Empty;
    }
}