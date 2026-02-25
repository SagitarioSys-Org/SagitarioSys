namespace SagitarioSys.Api.Models
{
    public class DispositivoUsuario
    {
        public Guid Id { get; set; }
        public Guid UsuarioId { get; set; }
        public string DeviceFingerprint { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime DataExpiracao { get; set; }
        public bool IsConfiavel { get; set; }
        public DateTime DataRegistro { get; set; }
    }
}