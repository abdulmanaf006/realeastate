FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

COPY . .

EXPOSE 10000

ENTRYPOINT ["dotnet", "RealEstate.Web.dll"]