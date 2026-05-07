# Pre-built publish output (no .csproj in this repo) — runtime only
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY . .

EXPOSE 8080
# Render (and similar) set PORT at runtime; default 8080 for local runs
CMD dotnet RealEstate.Web.dll --urls "http://0.0.0.0:${PORT:-8080}"
