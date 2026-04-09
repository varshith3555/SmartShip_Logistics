FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["gateway/SmartShip.Gateway/SmartShip.Gateway.csproj", "gateway/SmartShip.Gateway/"]
COPY ["shared/SmartShip.Core/SmartShip.Core.csproj", "shared/SmartShip.Core/"]
COPY ["shared/SmartShip.Contracts/SmartShip.Contracts.csproj", "shared/SmartShip.Contracts/"]
RUN dotnet restore "gateway/SmartShip.Gateway/SmartShip.Gateway.csproj"
COPY . .
WORKDIR "/src/gateway/SmartShip.Gateway"
RUN dotnet build "SmartShip.Gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SmartShip.Gateway.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SmartShip.Gateway.dll"]
