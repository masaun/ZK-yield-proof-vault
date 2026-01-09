# Rarimo Proof Verification Relayer for Mantle

This directory contains the configuration for running the Rarimo proof-verification-relayer service that listens to state updates from Rarimo L2 and replicates them to your RegistrationSMTReplicator contract on Mantle.

## Overview

The relayer service:
1. Listens to `RootUpdated` events from the Rarimo L2 Registration SMT
2. Signs the root state transitions
3. Stores state data in a PostgreSQL database
4. Exposes API endpoints for the frontend to fetch signed states
5. Enables frontend to submit state transitions on-demand

## Prerequisites

- Docker & Docker Compose (recommended) OR Go 1.22+
- PostgreSQL database
- Access to Rarimo L2 RPC
- Your oracle/relayer private key (generated in Step 1)

## Setup

### Option 1: Using Docker (Recommended)

1. **Clone the Rarimo relayer repository**:
   ```bash
   git clone https://github.com/rarimo/proof-verification-relayer.git
   cd proof-verification-relayer
   ```

2. **Copy and configure the environment**:
   ```bash
   cp ../config_mantle.yaml ./config.yaml
   ```

3. **Edit `config.yaml`** with your settings:
   - Set your oracle private key
   - Set the RegistrationSMTReplicator contract address
   - Configure database connection
   - Set RPC URLs

4. **Run with Docker Compose**:
   ```bash
   docker compose up -d
   ```

### Option 2: Build from Source

1. **Clone and build**:
   ```bash
   git clone https://github.com/rarimo/proof-verification-relayer.git
   cd proof-verification-relayer
   go build -o relayer main.go
   ```

2. **Set up database**:
   ```bash
   export KV_VIPER_FILE=../config_mantle.yaml
   ./relayer migrate up
   ```

3. **Run the service**:
   ```bash
   ./relayer run service
   ```

## Configuration

See [`config_mantle.yaml`](./config_mantle.yaml) for the complete configuration.

### Key Configuration Sections

#### Network Configuration
```yaml
network:
  rpc: "https://rpc.rarimo.com"  # Rarimo L2 RPC
  private_key: "0x..."  # Your oracle private key
```

#### Contracts Configuration
```yaml
contracts:
  register2:
    address: "0x479F84502Db545FA8d2275372E0582425204A879"  # Rarimo L2 Registry
```

#### Replicator Configuration
```yaml
replicator:
  address: "0x..."  # Your RegistrationSMTReplicator on Mantle
  source_smt: "0x479F84502Db545FA8d2275372E0582425204A879"
  root_prefix: "Rarimo root"
```

## API Endpoints

Once running, the relayer exposes these endpoints:

### Get Signed State
```
GET /integrations/proof-verification-relayer/v2/state?filter[root]={root}
```

Returns signed state data for a specific root:
```json
{
  "data": {
    "type": "state",
    "attributes": {
      "root": "0x...",
      "timestamp": 1234567890,
      "signature": "0x..."
    }
  }
}
```

## Usage Flow

1. **Relayer runs continuously**, listening for state updates from Rarimo L2
2. **Frontend obtains proof** from verificator-svc with a specific root (11th public signal)
3. **Frontend queries relayer** for signed state by root: `GET /state?filter[root]={root}`
4. **Frontend calls contract** with `transitionRootWithSignature(root, timestamp, signature)`

## Monitoring

Check service health:
```bash
# View logs
docker-compose logs -f

# Check database
psql -U postgres -d relayer
SELECT * FROM states ORDER BY block DESC LIMIT 10;
```

## Troubleshooting

### Service won't start
- Check database connection
- Verify private key is correct
- Ensure RPC URLs are accessible

### No state updates
- Check Rarimo L2 RPC is responding
- Verify contract address is correct
- Check oracle address is funded (for on-chain relaying)

### Frontend can't fetch states
- Verify API endpoint is accessible
- Check CORS configuration
- Ensure database has states

## Security Notes

1. **Private Key**: Store securely, never commit to version control
2. **Database**: Use strong passwords, restrict access
3. **API**: Consider adding authentication for production
4. **Network**: Use HTTPS in production

## Architecture

```
┌─────────────────────┐
│   Rarimo L2         │
│  Registry Contract  │
│  (Source SMT)       │
└──────────┬──────────┘
           │
           │ RootUpdated Events
           ▼
┌─────────────────────────────────┐
│  Proof Verification Relayer     │
│  ┌──────────┐   ┌────────────┐  │
│  │ Listener │──▶│ PostgreSQL │  │
│  └──────────┘   └────────────┘  │
│       │                          │
│       └────▶ Sign State          │
│                                  │
│  ┌──────────────────────┐       │
│  │  API Endpoints       │       │
│  │  - GET /state        │       │
│  └──────────────────────┘       │
└────────────┬────────────────────┘
             │
             │ Signed State
             ▼
      ┌─────────────┐
      │  Frontend   │
      └─────────────┘
             │
             │ transitionRootWithSignature()
             ▼
┌──────────────────────────────────┐
│  RegistrationSMTReplicator       │
│  (Mantle Mainnet/Testnet)        │
└──────────────────────────────────┘
```

## Resources

- [Rarimo Relayer GitHub](https://github.com/rarimo/proof-verification-relayer)
- [Rarimo Documentation](https://docs.rarimo.com/zk-passport/guide-setting-up-cross-chain-replication/)
- [API Documentation](https://rarimo.github.io/proof-verification-relayer/)
