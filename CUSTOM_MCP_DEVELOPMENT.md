# Custom MCP Development Environment Architecture

This document outlines the architecture for developing custom MCP servers in a containerized development environment with dynamic service registration.

## 🏗️ Custom MCP Development Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        subgraph "Custom MCP Directory"
            CustomDir["sandbox/custom-mcps/"]
            HelloWorld["hello-world/"]
            Calculator["calculator/"]
            FileManager["file-manager/"]
            CustomN["custom-n/"]
        end
        
        subgraph "Custom MCP Projects"
            subgraph "hello-world Project"
                HWPackage["package.json"]
                HWIndex["index.js"]
                HWServer["MCP Server Implementation"]
            end
            
            subgraph "calculator Project"
                CalcPackage["package.json"]
                CalcIndex["index.js"] 
                CalcServer["MCP Server Implementation"]
            end
            
            subgraph "Other Projects"
                OtherServers["... additional custom servers"]
            end
        end
    end
    
    subgraph "Docker Infrastructure"
        subgraph "Dev MCP Container"
            DevService["dev-mcp-service"]
            ServiceLoader["Service Loader"]
            PortManager["Port Manager"]
            ProxyUpdater["Proxy Updater"]
        end
        
        subgraph "Gateway Integration"
            MCPGateway["MCP Gateway"]
            Discovery["Discovery Manager"]
            DevNamespace["dev/* namespace"]
        end
    end
    
    subgraph "Service Registration Flow"
        AutoScan["Auto-scan custom-mcps/"]
        LoadProjects["Load Node.js projects"]
        StartServers["Start MCP servers"]
        RegisterServices["Register with gateway"]
        UpdateProxy["Update proxy routes"]
    end
    
    %% Directory structure
    CustomDir --> HelloWorld
    CustomDir --> Calculator
    CustomDir --> FileManager
    CustomDir --> CustomN
    
    %% Project contents
    HelloWorld --> HWPackage
    HelloWorld --> HWIndex
    HelloWorld --> HWServer
    
    Calculator --> CalcPackage
    Calculator --> CalcIndex
    Calculator --> CalcServer
    
    %% Docker integration
    CustomDir -.->|"Volume Mount"| DevService
    DevService --> ServiceLoader
    DevService --> PortManager
    DevService --> ProxyUpdater
    
    %% Service flow
    ServiceLoader --> AutoScan
    AutoScan --> LoadProjects
    LoadProjects --> StartServers
    StartServers --> RegisterServices
    RegisterServices --> UpdateProxy
    
    %% Gateway integration
    DevService --> MCPGateway
    MCPGateway --> Discovery
    Discovery --> DevNamespace
    
    %% Styling
    classDef dev fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    classDef project fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef docker fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef flow fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    classDef gateway fill:#FFEBEE,stroke:#D32F2F,stroke-width:2px
    
    class CustomDir,HelloWorld,Calculator,FileManager,CustomN dev
    class HWPackage,HWIndex,HWServer,CalcPackage,CalcIndex,CalcServer,OtherServers project
    class DevService,ServiceLoader,PortManager,ProxyUpdater docker
    class AutoScan,LoadProjects,StartServers,RegisterServices,UpdateProxy flow
    class MCPGateway,Discovery,DevNamespace gateway
```

## 🔄 Development Workflow Sequence

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CustomDir as custom-mcps/
    participant DevService as dev-mcp-service
    participant Gateway as MCP Gateway
    participant VSCode as VS Code
    
    Note over Dev,VSCode: Development Phase
    Dev->>CustomDir: Create new-mcp-project/
    Dev->>CustomDir: Write package.json + index.js
    Dev->>DevService: Restart container
    
    Note over DevService,Gateway: Auto-Discovery Phase
    DevService->>CustomDir: Scan for package.json files
    DevService->>DevService: Load and validate projects
    DevService->>DevService: Start MCP servers on available ports
    DevService->>Gateway: Register dev/new-mcp-project
    
    Note over Gateway,VSCode: Service Integration
    Gateway->>Gateway: Update service map
    Gateway->>VSCode: Expose dev/new-mcp-project endpoint
    
    Note over Dev,VSCode: Testing Phase
    VSCode->>Gateway: /mcp/dev/new-mcp-project
    Gateway->>DevService: Route to specific port
    DevService->>DevService: Forward to MCP server
    DevService->>Gateway: Return response
    Gateway->>VSCode: Tool response
    
    Note over Dev,VSCode: Development Iteration
    Dev->>CustomDir: Modify code
    DevService->>DevService: Hot reload (optional)
    DevService->>Gateway: Re-register if needed
```

## 📁 Directory Structure

```mermaid
graph TD
    subgraph "sandbox/custom-mcps/"
        subgraph "hello-world/"
            HWPkg["package.json<br/>📦 MCP server config"]
            HWIdx["index.js<br/>🔧 MCP implementation"]
            HWRead["README.md<br/>📖 Documentation"]
        end
        
        subgraph "calculator/"
            CalcPkg["package.json<br/>📦 Math operations MCP"]
            CalcIdx["index.js<br/>➕ Calculator logic"]
            CalcUtils["utils/<br/>🧮 Helper functions"]
        end
        
        subgraph "file-manager/"
            FilePkg["package.json<br/>📦 File operations MCP"]
            FileIdx["index.js<br/>📂 File system tools"]
            FileTypes["types/<br/>📝 TypeScript definitions"]
        end
        
        subgraph "shared/"
            SharedUtils["utils.js<br/>🔧 Common utilities"]
            SharedTypes["types.js<br/>📋 Shared interfaces"]
            SharedConfig["config.js<br/>⚙️ Default configurations"]
        end
    end
    
    %% Styling
    classDef project fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    classDef file fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef shared fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    
    class HWPkg,CalcPkg,FilePkg project
    class HWIdx,HWRead,CalcIdx,CalcUtils,FileIdx,FileTypes file
    class SharedUtils,SharedTypes,SharedConfig shared
```

## 🔧 Dev MCP Service Architecture

```mermaid
graph TB
    subgraph "dev-mcp-service Container"
        subgraph "Service Manager"
            Scanner["Project Scanner"]
            Loader["Project Loader"]
            Validator["MCP Validator"]
            PortManager["Port Manager"]
        end
        
        subgraph "Runtime Environment"
            ServerPool["MCP Server Pool"]
            Server1["hello-world :3100"]
            Server2["calculator :3101"]
            Server3["file-manager :3102"]
            ServerN["custom-n :310x"]
        end
        
        subgraph "Proxy Layer"
            RequestRouter["Request Router"]
            NamespaceHandler["dev/* Handler"]
            HealthChecker["Health Checker"]
        end
        
        subgraph "Gateway Integration"
            RegistrationAPI["Registration API"]
            ServiceUpdater["Service Updater"]
            DiscoveryClient["Discovery Client"]
        end
    end
    
    subgraph "External Integration"
        CustomMCPs["/custom-mcps Volume"]
        MCPGateway["MCP Gateway"]
        VSCodeMCP["VS Code MCP"]
    end
    
    %% Scanner flow
    Scanner --> CustomMCPs
    Scanner --> Loader
    Loader --> Validator
    Validator --> PortManager
    
    %% Server management
    PortManager --> ServerPool
    ServerPool --> Server1
    ServerPool --> Server2
    ServerPool --> Server3
    ServerPool --> ServerN
    
    %% Request handling
    RequestRouter --> NamespaceHandler
    NamespaceHandler --> Server1
    NamespaceHandler --> Server2
    NamespaceHandler --> Server3
    NamespaceHandler --> ServerN
    
    %% Health monitoring
    HealthChecker --> ServerPool
    
    %% Gateway integration
    RegistrationAPI --> ServiceUpdater
    ServiceUpdater --> DiscoveryClient
    DiscoveryClient --> MCPGateway
    
    %% External connections
    MCPGateway --> VSCodeMCP
    
    %% Styling
    classDef manager fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    classDef runtime fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef proxy fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef integration fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    classDef external fill:#FFEBEE,stroke:#D32F2F,stroke-width:2px
    
    class Scanner,Loader,Validator,PortManager manager
    class ServerPool,Server1,Server2,Server3,ServerN runtime
    class RequestRouter,NamespaceHandler,HealthChecker proxy
    class RegistrationAPI,ServiceUpdater,DiscoveryClient integration
    class CustomMCPs,MCPGateway,VSCodeMCP external
```

## 🚀 Service Registration Protocol

```mermaid
stateDiagram-v2
    [*] --> Scanning
    
    Scanning --> ProjectFound : package.json detected
    Scanning --> Scanning : continue scan
    
    ProjectFound --> Validating : load project
    Validating --> Invalid : validation failed
    Validating --> Valid : MCP server detected
    
    Invalid --> Scanning : skip project
    
    Valid --> PortAllocation : assign port
    PortAllocation --> Starting : port available
    PortAllocation --> PortWait : port busy
    
    PortWait --> PortAllocation : retry
    
    Starting --> Running : server started
    Starting --> Failed : startup error
    
    Failed --> Scanning : mark as failed
    
    Running --> Registering : register with gateway
    Registering --> Active : registration successful
    Registering --> Failed : registration failed
    
    Active --> HealthCheck : periodic check
    HealthCheck --> Active : healthy
    HealthCheck --> Failed : unhealthy
    
    Active --> Stopping : manual stop
    Active --> Updating : code change detected
    
    Stopping --> [*]
    Updating --> Starting : restart server
```

## 🎯 Development Benefits

### **Traditional Approach vs Custom MCP Development**

| Aspect | Traditional | Custom MCP Dev Environment |
|--------|-------------|----------------------------|
| **Setup** | New Docker service per MCP | Single dev service handles all |
| **Development** | Rebuild containers | Hot reload in development |
| **Testing** | Full stack restart | Individual service restart |
| **Discovery** | Manual registration | Automatic discovery |
| **Scaling** | Linear Docker services | Unlimited projects in one service |
| **Debugging** | Container logs only | Direct Node.js debugging |

### **Key Features**

1. **🔧 Rapid Development**
   - Create new MCP server: Just add directory + package.json
   - No Docker Compose changes needed
   - Automatic service discovery and registration

2. **🔍 Development Namespace**
   - All custom services under `dev/*` namespace
   - Clear separation from production services
   - Easy identification in VS Code MCP

3. **📊 Dynamic Port Management**
   - Automatic port allocation (3100, 3101, 3102, ...)
   - Port conflict resolution
   - Health monitoring per service

4. **🚀 Hot Development**
   - File watching for code changes
   - Automatic service restart
   - Re-registration with gateway

5. **🛠️ Shared Resources**
   - Common utilities in `/shared` directory
   - Reusable MCP patterns
   - Consistent project structure

---

*This architecture enables rapid development of custom MCP servers while maintaining production-quality deployment patterns.*
