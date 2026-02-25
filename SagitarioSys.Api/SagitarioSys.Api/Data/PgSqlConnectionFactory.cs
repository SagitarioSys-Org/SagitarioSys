using Npgsql;
using System.Data;

namespace SagitarioSys.Api.Data
{
    public class PgSqlConnectionFactory : IDbConnectionFactory
    {
        private readonly string _connectionString;

        public PgSqlConnectionFactory(IConfiguration configuration)
        {
            // Pega a string de conexão do appsettings.json
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public IDbConnection CreateConnection()
        {
            return new NpgsqlConnection(_connectionString);
        }
    }
}