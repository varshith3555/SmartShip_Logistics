using System.Text;
using System.Security.Claims;
using System.Linq;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace SmartShip.Core.Authentication;

public static class JwtExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = new JwtSettings();
        configuration.GetSection("Jwt").Bind(jwtSettings);
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));

        var extraAudienceKeys = configuration.GetSection("Jwt")
            .GetChildren()
            .Where(c =>
                c.Key.StartsWith("Aud", StringComparison.OrdinalIgnoreCase)
                && c.Key.Length > 3
                && c.Key.Substring(3).All(char.IsDigit)
                && !string.IsNullOrWhiteSpace(c.Value))
            .Select(c => c.Value!.Trim());

        var validAudiences = (jwtSettings.Audiences ?? new List<string>())
            .Concat(new[] { jwtSettings.Aud1, jwtSettings.Aud2 })
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(a => a!.Trim())
            .Concat(extraAudienceKeys)
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (validAudiences.Length == 0 && !string.IsNullOrWhiteSpace(jwtSettings.Audience))
        {
            validAudiences = new[] { jwtSettings.Audience.Trim() };
        }

        if (validAudiences.Length == 0)
        {
            throw new InvalidOperationException("JWT audience validation is enabled but no audience was configured. Set Jwt:Audience or Jwt:Audiences in configuration.");
        }

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),

                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,

                ValidateAudience = true,
                ValidAudiences = validAudiences,

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,

                NameClaimType = ClaimTypes.NameIdentifier,
                RoleClaimType = ClaimTypes.Role
            };

            // ADD THIS BLOCK (CRITICAL FIX)
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    var identity = context.Principal?.Identity as ClaimsIdentity;

                    if (identity != null)
                    {
                        var nameId = identity.FindFirst("nameid");
                        if (nameId != null)
                        {
                            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, nameId.Value));
                        }

                        var role = identity.FindFirst("role");
                        if (role != null)
                        {
                            identity.AddClaim(new Claim(ClaimTypes.Role, role.Value));
                        }
                    }

                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();
        return services;
    }
}