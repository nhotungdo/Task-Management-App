using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace TaskManagementApp.Services;

public interface ITokenService
{
    string CreateToken(IEnumerable<Claim> claims);
}

public class TokenService : ITokenService
{
    private readonly string _issuer;
    private readonly string _audience;
    private readonly SigningCredentials _credentials;

    public TokenService(string issuer, string audience, SecurityKey key)
    {
        _issuer = issuer;
        _audience = audience;
        _credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public string CreateToken(IEnumerable<Claim> claims)
    {
        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: _credentials
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}


