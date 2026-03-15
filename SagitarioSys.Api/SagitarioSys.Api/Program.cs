using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Repositories;
using SagitarioSys.Api.Repositories.Admin;
using SagitarioSys.Api.Repositories.Oficina;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFront", policy =>
    {
        policy.WithOrigins(
            "https://localhost:44372",
            "https://www.sagitariosys.com.br"
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

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
builder.Services.AddScoped<ProntuarioRepository>();
builder.Services.AddScoped<RelatoriosRepository>();
builder.Services.AddScoped<FornecedorRepository>();

builder.Services.AddControllers();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

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
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var pastaLogos = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "logos");
if (!Directory.Exists(pastaLogos))
{
    Directory.CreateDirectory(pastaLogos);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(pastaLogos),
    RequestPath = "/logos"
});

app.UseCors("PermitirFront");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();
