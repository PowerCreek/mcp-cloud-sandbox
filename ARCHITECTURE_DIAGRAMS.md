# MCP Cloud Sandbox Architecture Diagrams

This document contains comprehensive diagrams showing the structure, dependencies, and data flow of the MCP Cloud Development Sandbox.

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "VS Code Environment"
        VSCode[VS Code]
        MCPExt[MCP Extension]
        Agent[GitHub Copilot Agent]
    end
    
    subgraph "MCP Gateway Layer"
        Gateway[MCP Gateway :8080]
        EventBus[Event Bus Logger]
        CapMgr[Capability Manager]
    end
    
    subgraph "MCP Services Layer"
        SeqThink[Sequential Thinking :3006]
        Neo4jMem[Neo4j Memory :3001]
        Neo4jCypher[Neo4j Cypher :3002]
        Neo4jModel[Neo4j Modeling :3003]
        Neo4jAura[Neo4j Aura :3004]
        Supabase[Supabase :3005]
    end
    
    subgraph "Infrastructure Layer"
        Docker[Docker Engine]
        Compose[Docker Compose]
        Network[ai-net Docker Network]
    end
    
    subgraph "External Services"
        Neo4jDB[(Neo4j Database)]
        SupabaseDB[(Supabase Database)]
        Neo4jCloud[(Neo4j Aura Cloud)]
    end
    
    %% VS Code connections
    VSCode --> MCPExt
    MCPExt --> Agent
    Agent --> Gateway
    
    %% Gateway connections
    Gateway --> EventBus
    Gateway --> CapMgr
    Gateway --> SeqThink
    Gateway --> Neo4jMem
    Gateway --> Neo4jCypher
    Gateway --> Neo4jModel
    Gateway --> Neo4jAura
    Gateway --> Supabase
    
    %% Infrastructure connections
    Compose --> Docker
    Docker --> Network
    Network --> Gateway
    Network --> SeqThink
    Network --> Neo4jMem
    Network --> Neo4jCypher
    Network --> Neo4jModel
    Network --> Neo4jAura
    Network --> Supabase
    
    %% External service connections
    Neo4jMem --> Neo4jDB
    Neo4jCypher --> Neo4jDB
    Neo4jModel --> Neo4jDB
    Neo4jAura --> Neo4jCloud
    Supabase --> SupabaseDB
    
    %% Styling
    classDef vscode fill:#007ACC,stroke:#005c99,stroke-width:2px,color:#fff
    classDef gateway fill:#FF6B35,stroke:#cc5429,stroke-width:2px,color:#fff
    classDef service fill:#4CAF50,stroke:#45a049,stroke-width:2px,color:#fff
    classDef infra fill:#9C27B0,stroke:#7b1f87,stroke-width:2px,color:#fff
    classDef external fill:#FFC107,stroke:#ffb300,stroke-width:2px,color:#000
    
    class VSCode,MCPExt,Agent vscode
    class Gateway,EventBus,CapMgr gateway
    class SeqThink,Neo4jMem,Neo4jCypher,Neo4jModel,Neo4jAura,Supabase service
    class Docker,Compose,Network infra
    class Neo4jDB,SupabaseDB,Neo4jCloud external
```

## 🔄 Request Flow Sequence

```mermaid
sequenceDiagram
    participant VSCode as VS Code
    participant Gateway as MCP Gateway
    participant EventBus as Event Bus
    participant Service as MCP Service
    participant Backend as Backend Service
    
    Note over VSCode,Backend: Initialization Phase
    VSCode->>Gateway: POST /mcp/service (initialize)
    Gateway->>EventBus: log(initialize-start)
    Gateway->>Service: initialize request
    Service->>Gateway: capabilities response
    Gateway->>Service: tools/list request
    Service->>Gateway: tools array
    Gateway->>EventBus: log(initialize-complete)
    Gateway->>VSCode: aggregated capabilities
    
    Note over VSCode,Backend: Tool Execution Phase
    VSCode->>Gateway: POST /mcp/service (tools/call)
    Gateway->>EventBus: log(route)
    Gateway->>EventBus: log(proxy-request)
    Gateway->>Service: proxy request
    Service->>Backend: execute tool logic
    Backend->>Service: result data
    Service->>Gateway: tool response
    Gateway->>EventBus: log(proxy-response)
    Gateway->>VSCode: final result
```

## 📁 Code Structure Dependency Graph

```mermaid
graph TD
    subgraph "Root Directory"
        Root["/workspaces/cloud-dev"]
        GitIgnore[".gitignore"]
        Readme["README.md"]
        VSCodeConfig[".vscode/mcp.json"]
    end
    
    subgraph "Sandbox Runtime"
        SandboxDir["sandbox/"]
        BuildScript["build.sh"]
        DockerCompose["docker-compose.yml"]
        MCPServices["docker-compose.mcp-services.yml"]
        EnvExample[".env.example"]
    end
    
    subgraph "Template Layer"
        TemplateDir["sandbox-template/"]
        GatewayDir["mcp-gateway/"]
        BridgeDir["mcp-http-bridge/"]
        DockerfileMCP["Dockerfile.mcp-service"]
        Entrypoints["entrypoint-*.sh"]
    end
    
    subgraph "Gateway Components"
        GatewayServer["server.js"]
        GatewayPkg["package.json"]
        GatewayEventBus["eventBus.js"]
    end
    
    subgraph "Bridge Components"
        BridgeIndex["index.js"]
        BridgePkg["package.json"]
        BridgeEventBus["eventBus.js"]
    end
    
    subgraph "Infrastructure Scripts"
        InitDir["init/"]
        RunScripts["run-*-mcp.sh"]
        ValidationScript["validate-sandbox.sh"]
    end
    
    %% Dependencies
    Root --> SandboxDir
    Root --> TemplateDir
    Root --> InitDir
    Root --> VSCodeConfig
    
    SandboxDir --> BuildScript
    SandboxDir --> DockerCompose
    SandboxDir --> MCPServices
    SandboxDir --> EnvExample
    
    TemplateDir --> GatewayDir
    TemplateDir --> BridgeDir
    TemplateDir --> DockerfileMCP
    TemplateDir --> Entrypoints
    
    GatewayDir --> GatewayServer
    GatewayDir --> GatewayPkg
    GatewayDir --> GatewayEventBus
    
    BridgeDir --> BridgeIndex
    BridgeDir --> BridgePkg
    BridgeDir --> BridgeEventBus
    
    InitDir --> RunScripts
    Root --> ValidationScript
    
    %% Build Dependencies
    BuildScript --> DockerCompose
    BuildScript --> MCPServices
    DockerCompose --> TemplateDir
    MCPServices --> DockerfileMCP
    DockerfileMCP --> GatewayDir
    DockerfileMCP --> BridgeDir
    
    %% Runtime Dependencies
    VSCodeConfig --> GatewayServer
    GatewayServer --> BridgeIndex
    Entrypoints --> RunScripts
    
    %% Styling
    classDef config fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    classDef runtime fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef template fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef component fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    classDef script fill:#FFEBEE,stroke:#D32F2F,stroke-width:2px
    
    class Root,GitIgnore,Readme,VSCodeConfig config
    class SandboxDir,BuildScript,DockerCompose,MCPServices,EnvExample runtime
    class TemplateDir,GatewayDir,BridgeDir,DockerfileMCP,Entrypoints template
    class GatewayServer,GatewayPkg,GatewayEventBus,BridgeIndex,BridgePkg,BridgeEventBus component
    class InitDir,RunScripts,ValidationScript script
```

## 🌐 Network & Service Dependencies

```mermaid
graph LR
    subgraph "Host Network"
        Host[Host Machine :8080]
    end
    
    subgraph "Docker Network: ai-net"
        subgraph "Gateway Container"
            GW[mcp-gateway :8080]
        end
        
        subgraph "MCP Service Containers"
            ST[sequential-thinking :3006]
            NM[neo4j-memory :3001]
            NC[neo4j-cypher :3002]
            NDM[neo4j-data-modeling :3003]
            NA[neo4j-aura :3004]
            SB[supabase :3005]
        end
    end
    
    subgraph "External Networks"
        Neo4jLocal[(Neo4j Local :7687)]
        Neo4jAuraCloud[(Neo4j Aura Cloud)]
        SupabaseCloud[(Supabase Cloud)]
    end
    
    %% Network flow
    Host --> GW
    GW --> ST
    GW --> NM
    GW --> NC
    GW --> NDM
    GW --> NA
    GW --> SB
    
    %% External connections
    NM --> Neo4jLocal
    NC --> Neo4jLocal
    NDM --> Neo4jLocal
    NA --> Neo4jAuraCloud
    SB --> SupabaseCloud
    
    %% Port mappings
    Host -.->|"Port 8080"| GW
    ST -.->|"Port 3006"| Host
    NM -.->|"Port 3001"| Host
    NC -.->|"Port 3002"| Host
    NDM -.->|"Port 3003"| Host
    NA -.->|"Port 3004"| Host
    SB -.->|"Port 3005"| Host
```

## 🔧 MCP Protocol Flow

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    
    Disconnected --> Connecting : VS Code starts
    Connecting --> Initializing : HTTP connection established
    
    Initializing --> CapabilityDiscovery : send initialize()
    CapabilityDiscovery --> ToolDiscovery : get capabilities
    ToolDiscovery --> ResourceDiscovery : list tools
    ResourceDiscovery --> PromptDiscovery : list resources
    PromptDiscovery --> Ready : list prompts
    
    Ready --> ToolExecution : tools/call
    ToolExecution --> Ready : result returned
    
    Ready --> ResourceAccess : resources/read
    ResourceAccess --> Ready : resource returned
    
    Ready --> PromptExecution : prompts/get
    PromptExecution --> Ready : prompt returned
    
    Ready --> Disconnected : VS Code closes
    
    state CapabilityDiscovery {
        [*] --> QueryService
        QueryService --> AggregateCapabilities
        AggregateCapabilities --> [*]
    }
    
    state ToolExecution {
        [*] --> ValidateRequest
        ValidateRequest --> ProxyToService
        ProxyToService --> ExecuteTool
        ExecuteTool --> ReturnResult
        ReturnResult --> [*]
    }
```

## 📊 Event Bus Data Flow

```mermaid
graph TD
    subgraph "Event Sources"
        Gateway[Gateway Server]
        Services[MCP Services]
        VSCode[VS Code Client]
    end
    
    subgraph "Event Bus"
        EventBus[Event Bus Core]
        Listeners[Event Listeners]
        Logger[Console Logger]
    end
    
    subgraph "Event Types"
        Route[route]
        ProxyReq[proxy-request]
        ProxyRes[proxy-response]
        InitStart[initialize-start]
        InitComplete[initialize-complete]
        Error[error]
        Notification[notification]
        Shutdown[shutdown]
    end
    
    subgraph "Event Data"
        ServiceName[serviceName]
        Method[method]
        Params[params]
        ID[id]
        URL[url]
        Result[result]
        Capabilities[capabilities]
        ToolsCount[toolsCount]
        ErrorMsg[error message]
    end
    
    %% Event flow
    Gateway --> EventBus
    Services --> EventBus
    VSCode --> EventBus
    
    EventBus --> Listeners
    Listeners --> Logger
    
    %% Event types
    EventBus --> Route
    EventBus --> ProxyReq
    EventBus --> ProxyRes
    EventBus --> InitStart
    EventBus --> InitComplete
    EventBus --> Error
    EventBus --> Notification
    EventBus --> Shutdown
    
    %% Data attachments
    Route --> ServiceName
    Route --> Method
    Route --> Params
    Route --> ID
    
    ProxyReq --> URL
    ProxyRes --> Result
    InitComplete --> Capabilities
    InitComplete --> ToolsCount
    Error --> ErrorMsg
    
    %% Styling
    classDef source fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    classDef bus fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef event fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef data fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    
    class Gateway,Services,VSCode source
    class EventBus,Listeners,Logger bus
    class Route,ProxyReq,ProxyRes,InitStart,InitComplete,Error,Notification,Shutdown event
    class ServiceName,Method,Params,ID,URL,Result,Capabilities,ToolsCount,ErrorMsg data
```

## 🏭 Docker Compose Service Dependencies

```mermaid
graph TB
    subgraph "Docker Compose Stack"
        subgraph "Core Services (docker-compose.yml)"
            Neo4jDB[neo4j-db :7687]
            Neo4jDBUI[neo4j-browser :7474]
        end
        
        subgraph "MCP Services (docker-compose.mcp-services.yml)"
            Gateway[mcp-gateway :8080]
            SeqThink[sequential-thinking-service :3006]
            Neo4jMem[neo4j-memory-service :3001]
            Neo4jCypher[neo4j-cypher-service :3002]
            Neo4jModel[neo4j-data-modeling-service :3003]
            Neo4jAura[neo4j-aura-service :3004]
            Supabase[supabase-service :3005]
        end
        
        subgraph "Development Services (docker-compose.dev.yml)"
            AgenticSandbox[agentic-sandbox]
        end
    end
    
    subgraph "Build Dependencies"
        DockerfileMCP[Dockerfile.mcp-service]
        GatewayCode[mcp-gateway/]
        BridgeCode[mcp-http-bridge/]
        Entrypoints[entrypoint-*.sh]
    end
    
    subgraph "Runtime Dependencies"
        EnvFile[.env]
        InitScripts[deps/init/]
        Network[ai-net]
    end
    
    %% Build dependencies
    Gateway --> DockerfileMCP
    SeqThink --> DockerfileMCP
    Neo4jMem --> DockerfileMCP
    Neo4jCypher --> DockerfileMCP
    Neo4jModel --> DockerfileMCP
    Neo4jAura --> DockerfileMCP
    Supabase --> DockerfileMCP
    
    DockerfileMCP --> GatewayCode
    DockerfileMCP --> BridgeCode
    DockerfileMCP --> Entrypoints
    
    %% Runtime dependencies
    Gateway --> EnvFile
    SeqThink --> InitScripts
    Neo4jMem --> InitScripts
    Neo4jCypher --> InitScripts
    Neo4jModel --> InitScripts
    Neo4jAura --> InitScripts
    Supabase --> InitScripts
    
    %% Network dependencies
    Gateway --> Network
    SeqThink --> Network
    Neo4jMem --> Network
    Neo4jCypher --> Network
    Neo4jModel --> Network
    Neo4jAura --> Network
    Supabase --> Network
    Neo4jDB --> Network
    
    %% Service dependencies
    Neo4jMem --> Neo4jDB
    Neo4jCypher --> Neo4jDB
    Neo4jModel --> Neo4jDB
    AgenticSandbox --> Gateway
    
    %% Styling
    classDef core fill:#E3F2FD,stroke:#1976D2,stroke-width:3px
    classDef mcp fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef dev fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef build fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    classDef runtime fill:#FFEBEE,stroke:#D32F2F,stroke-width:2px
    
    class Neo4jDB,Neo4jDBUI core
    class Gateway,SeqThink,Neo4jMem,Neo4jCypher,Neo4jModel,Neo4jAura,Supabase mcp
    class AgenticSandbox dev
    class DockerfileMCP,GatewayCode,BridgeCode,Entrypoints build
    class EnvFile,InitScripts,Network runtime
```

## 🔍 Dynamic Service Discovery Architecture

```mermaid
graph TB
    subgraph "Service Registration Methods"
        subgraph "Static Registration"
            StaticConfig[Static Services Config]
            SeqThinking[sequential-thinking :3006]
            Neo4jMem[neo4j-memory :3001]
            Other[... other static services]
        end
        
        subgraph "Dynamic Registration"
            DiscoveryAPI[Discovery API Endpoints]
            POSTRegister[POST /discovery/register]
            GETServices[GET /discovery/services]
            SeqThinkingV2[sequential-thinking-v2 :3006]
        end
    end
    
    subgraph "MCP Gateway with Discovery"
        subgraph "Discovery Manager"
            ServiceDiscovery[MCPServiceDiscovery]
            ServiceMap[Services Map]
            DiscoveryEndpoints[Discovery Endpoints Set]
            AutoRefresh[Auto Refresh Timer]
        end
        
        subgraph "API Layer"
            ProxyEndpoint[/mcp/:service]
            HealthEndpoint[/health]
            StatsEndpoint[/discovery/stats]
            RegisterEndpoint[/discovery/register]
            UnregisterEndpoint[DELETE /discovery/services/:name]
        end
        
        subgraph "Event Bus Integration"
            DiscoveryEvents[Discovery Events]
            ServiceEvents[Service Registration Events]
            HealthEvents[Health Check Events]
        end
    end
    
    subgraph "VS Code Integration"
        VSCodeMCP[VS Code MCP]
        StaticMCPConfig[sequential-thinking-http]
        DynamicMCPConfig[sequential-thinking-v2-http]
    end
    
    subgraph "External Discovery Sources"
        CloudRegistry[Cloud Service Registry]
        K8sServices[Kubernetes Services]
        ConsulRegistry[Consul Registry]
        CustomAPI[Custom Discovery API]
    end
    
    %% Static registration flow
    StaticConfig --> ServiceDiscovery
    StaticConfig --> SeqThinking
    StaticConfig --> Neo4jMem
    StaticConfig --> Other
    
    %% Dynamic registration flow
    POSTRegister --> ServiceDiscovery
    GETServices --> ServiceDiscovery
    ServiceDiscovery --> SeqThinkingV2
    
    %% Discovery manager internals
    ServiceDiscovery --> ServiceMap
    ServiceDiscovery --> DiscoveryEndpoints
    ServiceDiscovery --> AutoRefresh
    
    %% API integration
    ProxyEndpoint --> ServiceMap
    HealthEndpoint --> ServiceMap
    StatsEndpoint --> ServiceDiscovery
    RegisterEndpoint --> ServiceDiscovery
    UnregisterEndpoint --> ServiceDiscovery
    
    %% Event integration
    ServiceDiscovery --> DiscoveryEvents
    ServiceDiscovery --> ServiceEvents
    ServiceDiscovery --> HealthEvents
    
    %% VS Code integration
    VSCodeMCP --> StaticMCPConfig
    VSCodeMCP --> DynamicMCPConfig
    StaticMCPConfig --> ProxyEndpoint
    DynamicMCPConfig --> ProxyEndpoint
    
    %% External discovery
    AutoRefresh --> CloudRegistry
    AutoRefresh --> K8sServices
    AutoRefresh --> ConsulRegistry
    AutoRefresh --> CustomAPI
    
    %% Service connections
    SeqThinking -.->|"same backend"| SeqThinkingV2
    
    %% Styling
    classDef static fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
    classDef dynamic fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    classDef discovery fill:#E8F5E8,stroke:#388E3C,stroke-width:2px
    classDef api fill:#FFF3E0,stroke:#F57C00,stroke-width:2px
    classDef vscode fill:#FFEBEE,stroke:#D32F2F,stroke-width:2px
    classDef external fill:#F1F8E9,stroke:#689F38,stroke-width:2px
    
    class StaticConfig,SeqThinking,Neo4jMem,Other,StaticMCPConfig static
    class DiscoveryAPI,POSTRegister,GETServices,SeqThinkingV2,DynamicMCPConfig dynamic
    class ServiceDiscovery,ServiceMap,DiscoveryEndpoints,AutoRefresh,DiscoveryEvents,ServiceEvents,HealthEvents discovery
    class ProxyEndpoint,HealthEndpoint,StatsEndpoint,RegisterEndpoint,UnregisterEndpoint api
    class VSCodeMCP vscode
    class CloudRegistry,K8sServices,ConsulRegistry,CustomAPI external
```

## 🔄 Discovery Flow Sequence

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant Gateway as MCP Gateway
    participant Discovery as Discovery Manager
    participant ServiceMap as Service Map
    participant EventBus as Event Bus
    participant Backend as Backend Service
    participant VSCode as VS Code
    
    Note over Admin,Backend: Static Service Registration (Startup)
    Gateway->>Discovery: registerStaticServices(config)
    Discovery->>ServiceMap: add static services
    Discovery->>EventBus: emit service-registered (static)
    
    Note over Admin,Backend: Dynamic Service Registration (Runtime)
    Admin->>Gateway: POST /discovery/register
    Gateway->>Discovery: registerDynamicService(name, config)
    Discovery->>Backend: health check
    Backend->>Discovery: health response
    Discovery->>ServiceMap: add dynamic service
    Discovery->>EventBus: emit service-registered (dynamic)
    Gateway->>Admin: registration success
    
    Note over Admin,Backend: Auto-Discovery (Periodic)
    Discovery->>Discovery: auto refresh timer
    Discovery->>Gateway: GET /discovery/services
    Gateway->>Discovery: services list
    loop For each discovered service
        Discovery->>Backend: health check
        Backend->>Discovery: health response
        Discovery->>ServiceMap: register if healthy
        Discovery->>EventBus: emit service-registered (auto)
    end
    
    Note over Admin,Backend: Service Usage (VS Code)
    VSCode->>Gateway: /mcp/sequential-thinking-v2
    Gateway->>ServiceMap: getService(sequential-thinking-v2)
    ServiceMap->>Gateway: service config (dynamic)
    Gateway->>Backend: proxy request
    Backend->>Gateway: response
    Gateway->>VSCode: final response
    Gateway->>EventBus: emit proxy-request/response
```

## 📊 Service Discovery Data Model

```mermaid
erDiagram
    MCPServiceDiscovery {
        Map services
        Set discoveryEndpoints
        number refreshInterval
        number lastRefresh
        Timer refreshTimer
    }
    
    ServiceConfig {
        string url
        string description
        object capabilities
        string type
        string registered
        boolean healthy
        string lastCheck
    }
    
    DiscoveryEndpoint {
        string url
        number timeout
        string method
        object headers
    }
    
    ServiceRegistration {
        string serviceName
        string type
        timestamp registered
        object metadata
    }
    
    HealthCheckResult {
        string serviceName
        boolean healthy
        number status
        string error
        timestamp lastCheck
    }
    
    EventBusEvent {
        string type
        object data
        timestamp timestamp
    }
    
    MCPServiceDiscovery ||--o{ ServiceConfig : manages
    MCPServiceDiscovery ||--o{ DiscoveryEndpoint : queries
    ServiceConfig ||--|| ServiceRegistration : tracked_by
    ServiceConfig ||--|| HealthCheckResult : monitored_by
    MCPServiceDiscovery ||--o{ EventBusEvent : emits
```

## 🎯 Discovery System Benefits

### **Static vs Dynamic Services Comparison**

| Aspect | Static Services | Dynamic Services |
|--------|----------------|------------------|
| **Registration** | Hardcoded in gateway config | API-based registration |
| **Lifecycle** | Startup only | Runtime registration/unregistration |
| **Discovery** | Manual configuration | Automatic discovery via endpoints |
| **Scalability** | Limited to predefined services | Unlimited, cloud-native |
| **Flexibility** | Requires code changes | Zero-downtime service addition |
| **Use Cases** | Core stable services | Experimental, temporary, cloud services |

### **Key Features Implemented**

1. **🔧 Dual Registration Model**
   - Static services: `sequential-thinking` (hardcoded)
   - Dynamic services: `sequential-thinking-v2` (API registered)

2. **🔍 Auto-Discovery**
   - Periodic polling of discovery endpoints
   - Health check validation before registration
   - Automatic service lifecycle management

3. **📊 Service Management APIs**
   - `POST /discovery/register` - Manual registration
   - `DELETE /discovery/services/:name` - Unregistration
   - `GET /discovery/stats` - Discovery statistics
   - `GET /discovery/health` - Service health overview

4. **🚨 Health Monitoring**
   - Continuous health checks for all services
   - Event-driven health status updates
   - Automatic unhealthy service detection

5. **📈 Event Bus Integration**
   - Complete audit trail of service operations
   - Real-time discovery event logging
   - Service registration/unregistration tracking

---
