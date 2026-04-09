FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["services/SmartShip.IdentityService/SmartShip.IdentityService.csproj", "services/SmartShip.IdentityService/"]
COPY ["shared/SmartShip.Core/SmartShip.Core.csproj", "shared/SmartShip.Core/"]
COPY ["shared/SmartShip.Contracts/SmartShip.Contracts.csproj", "shared/SmartShip.Contracts/"]
RUN dotnet restore "services/SmartShip.IdentityService/SmartShip.IdentityService.csproj"
COPY . .
WORKDIR "/src/services/SmartShip.IdentityService"
RUN dotnet build "SmartShip.IdentityService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SmartShip.IdentityService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SmartShip.IdentityService.dll"]
