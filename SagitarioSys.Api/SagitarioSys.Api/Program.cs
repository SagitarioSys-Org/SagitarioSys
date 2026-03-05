using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Repositories;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFront", policy =>
    {
        policy.WithOrigins(
            "https://localhost:44372",        // Front em desenvolvimento
            "https://www.sagitariosys.com.br" // Front em produção
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});


// 1. Configurar a Injeção de Dependência da nossa conexão com o banco
builder.Services.AddSingleton<IDbConnectionFactory, PgSqlConnectionFactory>();
builder.Services.AddScoped<AuthRepository>();
builder.Services.AddScoped<ClienteRepository>();
builder.Services.AddScoped<AssinanteRepository>();
builder.Services.AddScoped<SegmentoRepository>();
builder.Services.AddScoped<MenuRepository>();
builder.Services.AddScoped<VeiculoRepository>();
builder.Services.AddScoped<OrdemServicoRepository>();
builder.Services.AddScoped<PecaRepository>();
builder.Services.AddScoped<FinanceiroRepository>();
builder.Services.AddScoped<CategoriaFinanceiraRepository>();

// 2. Adicionar os Controllers
builder.Services.AddControllers();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", opt =>
    {
        opt.PermitLimit = 5;           // máximo 5 tentativas
        opt.Window = TimeSpan.FromMinutes(1); // por minuto
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429; // Too Many Requests
});

// 3. Configurar a Autenticação JWT
var jwtKey = builder.Configuration["JwtSettings:SecurityKey"];
var keyBytes = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // O token expira exatamente no tempo definido
    };
});

// Swagger para testar a API facilmente
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Adiciona o botão "Authorize" no Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT gerado no endpoint de login."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();



// Configuração do Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("PermitirFront");

// Importante: A ordem aqui importa! Autenticação sempre antes de Autorização.
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();