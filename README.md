# Weather Oracle Example

This project demonstrates how to create and deploy a weather oracle using VIA's messaging protocol. The oracle allows smart contracts to request weather data for a zipcode, which is fetched by an off-chain node and returned to the contract.

## Prerequisites

Before you begin, make sure you have:

- Node.js (v22+) and npm
- Git
- A private key with testnet funds for deployment
- Testnet tokens for [Avalanche Testnet](https://faucet.avax.network/)

## Project Structure

```
quickstart-oracle/
├── contracts/
│   └── WeatherOracle.sol    # The oracle contract with request/response functionality
├── scripts/
│   ├── deploy.js            # Deploy script using ethers v6
│   └── request-weather.js   # Script to request weather data
├── oracle/
│   ├── index.js             # VIA Project Node implementation
│   └── features/
│       ├── index.js         # Features registry
│       └── WeatherOracle.js # Weather oracle feature implementation
├── frontend/                # React frontend for interacting with the oracle
├── network.config.js        # Network configuration
├── package.json             # Project dependencies
├── .env.example             # Example environment variables
└── README.md                # Project documentation
```

## Step 1: Clone & Setup

```bash
# Clone the repository
git clone https://github.com/VIALabs-io/quickstart-oracle.git && cd quickstart-oracle

# Install dependencies
npm install

# Create a .env file with your private keys
cp .env.example .env
```

Edit the `.env` file and add:
- Your private key for deploying contracts (PRIVATE_KEY)
- Your node private key for running the oracle node (NODE_PRIVATE_KEY)
- Optionally, your OpenWeatherMap API key (WEATHER_API_KEY)

## Step 2: Deploy Your Oracle Contract

```bash
node scripts/deploy.js
```

This script will:
1. Compile the WeatherOracle.sol contract
2. Deploy the contract to Avalanche Testnet
3. Configure the oracle for on-chain to off-chain communication
4. Save deployment information for the frontend

## Step 3: Run the Oracle Node

```bash
node oracle/index.js
```

## Step 4: Request Weather Data

```bash
node scripts/request-weather.js 90210
```

This command requests weather data for the zipcode 90210 (Beverly Hills). The script will:
1. Send a transaction to the WeatherOracle contract
2. Wait for the transaction to be confirmed
3. Poll for the weather data to be received
4. Display the weather data when it's available

## Step 5: Use the Frontend

```bash
# Start the frontend
cd frontend
npm install
npm run dev
```

## How It Works

### On-Chain Contract

The `WeatherOracle` contract:
- Allows users to request weather data for a zipcode
- Generates a unique request ID for each request
- Sends a message to the off-chain node
- Processes incoming messages containing weather data
- Stores the weather data on-chain
- Provides functions to retrieve weather data by request ID

### Off-Chain Node

The off-chain node:
- Listens for weather data requests from the contract
- Extracts the zipcode from the request
- Fetches weather data from the OpenWeatherMap API (or uses static data)
- Sends the weather data back to the contract

### On-Chain to Off-Chain Communication Flow

1. A user calls `requestWeather(zipcode)` on the WeatherOracle contract
2. The contract generates a unique request ID and emits a WeatherRequested event
3. The contract sends a message to the off-chain node using feature ID 1
4. The node receives the message, fetches the weather data, and sends it back
5. The contract receives the data, stores it, and emits a WeatherReceived event
6. The user can retrieve the weather data using the request ID

## Customizing the Oracle

You can customize the oracle by modifying:

- The `WeatherOracle.sol` contract to store additional data or add new functionality
- The `oracle/features/WeatherOracle.js` file to fetch different types of data or use a different API
- The frontend components to display the data in a different way
