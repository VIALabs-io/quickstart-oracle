/**
 * Weather Oracle Interface
 * ===============================
 * 
 * This is the main application component for the weather oracle interface.
 * It provides a clean interface for interacting with the WeatherOracle contract,
 * allowing users to request weather data for specific zipcodes and view the results.
 * 
 * Key features:
 * - Modern, intuitive oracle UI
 * - Wallet connection
 * - Weather data requests
 * - Request history display
 * - Real-time request status updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import WalletConnect from './components/WalletConnect.jsx';
import WeatherRequestForm from './components/WeatherRequestForm.jsx';
import WeatherDisplay from './components/WeatherDisplay.jsx';
import RequestHistory from './components/RequestHistory.jsx';
import {
  connectWallet,
  switchNetwork,
  getOracleContract,
  getNetworkByChainId,
  getAllNetworks,
  listenForWalletEvents,
  requestWeatherData,
  getWeatherData,
  getRequestsByAddress
} from './utils/blockchain';
import {
  deploymentsExist,
  getDeploymentByChainId,
  getDeploymentErrorMessage
} from './utils/deployments';
import { ethers } from 'ethers';

// Import styles
import './styles/base.css';

function App() {
  // ======== State Management ========

  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(null);
  const [signer, setSigner] = useState(null);

  // Network state
  const [currentNetwork, setCurrentNetwork] = useState('');

  // Oracle state
  const [oracleContract, setOracleContract] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Polling state
  const [pollingInterval, setPollingInterval] = useState(null);

  // Get all available networks
  const networks = getAllNetworks();

  // Check if deployments exist
  const deploymentError = getDeploymentErrorMessage();

  // ======== Oracle Contract ========

  // Initialize Oracle contract
  const initOracleContract = useCallback(async (customSigner, customChainId) => {
    const signerToUse = customSigner || signer;
    const chainIdToUse = customChainId || chainId;

    if (!signerToUse || !chainIdToUse || !deploymentsExist()) return;

    const deployment = getDeploymentByChainId(chainIdToUse);
    if (!deployment) {
      console.error(`No deployment found for chain ID ${chainIdToUse}`);
      return;
    }

    try {
      // Create contract instance
      const contract = getOracleContract(deployment.address, signerToUse);
      setOracleContract(contract);

      // Fetch request history
      fetchRequestHistory(contract, signerToUse.address);

      return contract;
    } catch (error) {
      console.error('Error initializing contract:', error);
      return null;
    }
  }, [signer, chainId]);

  // Fetch request history
  const fetchRequestHistory = useCallback(async (contract, userAddress) => {
    if (!contract || !userAddress) return;

    setIsLoadingHistory(true);

    try {
      // Get all request IDs for this user
      const requestIds = await getRequestsByAddress(contract, userAddress);

      // Get weather data for each request
      const requests = await Promise.all(
        requestIds.map(async (id) => {
          try {
            const data = await getWeatherData(contract, id);
            return {
              id: id.toString(),
              zipcode: data.zipcode,
              temperature: data.temperature,
              conditions: data.conditions,
              location: data.location,
              timestamp: data.timestamp.toString(),
              fulfilled: data.fulfilled
            };
          } catch (error) {
            console.error(`Error fetching data for request ${id}:`, error);
            return {
              id: id.toString(),
              zipcode: 'Error',
              temperature: '',
              conditions: '',
              location: '',
              timestamp: '0',
              fulfilled: false
            };
          }
        })
      );

      // Sort by timestamp (most recent first)
      const sortedRequests = requests.sort((a, b) => {
        return Number(b.timestamp) - Number(a.timestamp);
      });

      setRequestHistory(sortedRequests);
    } catch (error) {
      console.error('Error fetching request history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // ======== Wallet Connection ========

  // Connect to wallet
  const handleConnect = useCallback(async () => {
    try {
      const { signer, address, chainId } = await connectWallet();
      setSigner(signer);
      setAddress(address);
      setChainId(chainId);
      setIsConnected(true);

      // Set up event listeners
      listenForWalletEvents(handleWalletEvent);

      // Find the network key for the current chain ID
      const network = getNetworkByChainId(chainId);
      if (network && network.key) {
        setCurrentNetwork(network.key);
      }

      return { signer, address, chainId };
    } catch (error) {
      console.error('Connection error:', error);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle wallet events
  const handleWalletEvent = useCallback(async (event) => {
    if (event.type === 'accountsChanged') {
      if (event.accounts.length === 0) {
        // User disconnected
        setIsConnected(false);
        setAddress('');
        setSigner(null);
        setOracleContract(null);
        setSelectedRequest(null);
        setWeatherData(null);

        // Clear polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else {
        // User switched accounts
        setAddress(event.accounts[0]);
        setSelectedRequest(null);
        setWeatherData(null);
        handleConnect();
      }
    } else if (event.type === 'chainChanged') {
      // User switched networks
      const newChainId = event.chainId;
      console.log(`Chain changed to ${newChainId}, updating network`);
      setChainId(newChainId);
      setSelectedRequest(null);
      setWeatherData(null);

      if (isConnected) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await provider.getSigner();
        setSigner(newSigner);

        // Update current network
        const network = getNetworkByChainId(newChainId);
        if (network && network.key) {
          console.log(`Setting current network to ${network.key}`);
          setCurrentNetwork(network.key);
        } else {
          console.warn(`No network found for chain ID ${newChainId}`);
        }

        // Initialize contract
        initOracleContract(newSigner, newChainId);
      }
    }
  }, [isConnected, handleConnect, initOracleContract, pollingInterval]);

  // ======== Network Management ========

  // Handle network change
  const handleNetworkChange = useCallback((networkKey) => {
    // Always update the UI immediately
    setCurrentNetwork(networkKey);
    setSelectedRequest(null);
    setWeatherData(null);

    // If we're connected, automatically switch networks
    if (isConnected) {
      const network = networks[networkKey];
      if (network && network.chainId !== Number(chainId)) {
        // Directly switch network without confirmation
        switchNetwork(networkKey).catch(error => {
          console.error('Network switch error:', error);
          // If network switch fails, we might need to revert the UI
          const currentNetwork = getNetworkByChainId(chainId);
          if (currentNetwork && currentNetwork.key) {
            setCurrentNetwork(currentNetwork.key);
          }
        });
        // We've already updated the UI, and the chainChanged event
        // will handle any further updates if needed
      }
    }
  }, [isConnected, chainId, networks]);

  // ======== Weather Request ========

  // Handle weather request
  const handleWeatherRequest = useCallback(async (zipcode) => {
    if (!isConnected || !oracleContract) {
      console.error('Wallet not connected');
      return;
    }

    setIsRequesting(true);

    try {
      console.log(`Requesting weather data for zipcode: ${zipcode}`);
      const { receipt, requestId } = await requestWeatherData(oracleContract, zipcode);
      console.log(`Weather request sent with ID: ${requestId}`);

      // Refresh request history
      fetchRequestHistory(oracleContract, address);

      // Set up polling for this request
      setupPollingForRequest(requestId);

      return { receipt, requestId };
    } catch (error) {
      console.error('Weather request error:', error);
    } finally {
      setIsRequesting(false);
    }
  }, [isConnected, oracleContract, fetchRequestHistory, address]);

  // Set up polling for a specific request
  const setupPollingForRequest = useCallback((requestId) => {
    // Clear any existing polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Set up new polling interval
    const interval = setInterval(async () => {
      if (!oracleContract) {
        clearInterval(interval);
        return;
      }

      try {
        // Check if request is fulfilled
        const data = await getWeatherData(oracleContract, requestId);

        // If fulfilled, update the request history and clear the interval
        if (data.fulfilled) {
          fetchRequestHistory(oracleContract, address);
          clearInterval(interval);
          setPollingInterval(null);

          // If this is the selected request, update the weather data
          if (selectedRequest && selectedRequest.id === requestId.toString()) {
            setWeatherData({
              id: requestId.toString(),
              zipcode: data.zipcode,
              temperature: data.temperature,
              conditions: data.conditions,
              location: data.location,
              timestamp: data.timestamp.toString(),
              fulfilled: data.fulfilled
            });
          }
        }
      } catch (error) {
        console.error(`Error polling for request ${requestId}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [oracleContract, fetchRequestHistory, address, selectedRequest]);

  // ======== Request Selection ========

  // Handle request selection
  const handleSelectRequest = useCallback(async (request) => {
    setSelectedRequest(request);

    // If the request is fulfilled, get the weather data
    if (request.fulfilled) {
      setWeatherData(request);
    } else {
      setWeatherData(null);

      // Set up polling for this request
      setupPollingForRequest(request.id);
    }
  }, [setupPollingForRequest]);

  // ======== Effect Hooks ========

  // Single effect for wallet connection and setup
  useEffect(() => {
    // Connect wallet on mount
    const setupWallet = async () => {
      try {
        // Connect wallet
        const { signer, address, chainId } = await connectWallet();
        setSigner(signer);
        setAddress(address);
        setChainId(chainId);
        setIsConnected(true);

        // Set up event listeners
        listenForWalletEvents(handleWalletEvent);

        // Find the network key for the current chain ID
        const network = getNetworkByChainId(chainId);
        if (network && network.key) {
          setCurrentNetwork(network.key);
        }

        // Initialize contract
        if (chainId) {
          const deployment = getDeploymentByChainId(chainId);
          if (deployment) {
            const contract = getOracleContract(deployment.address, signer);
            setOracleContract(contract);

            // Fetch request history
            fetchRequestHistory(contract, address);
          }
        }
      } catch (error) {
        console.log('Wallet setup failed:', error);
      }
    };

    setupWallet();

    // Set up periodic request history refresh (every 30 seconds)
    const historyInterval = setInterval(() => {
      if (oracleContract && address) {
        fetchRequestHistory(oracleContract, address);
      }
    }, 30000);

    return () => {
      // Clean up intervals
      clearInterval(historyInterval);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // We're using an empty dependency array to avoid re-running this effect

  // ======== Render UI ========

  // If there's a deployment error, show error message
  if (deploymentError) {
    return (
      <div className="oracle-container">
        <div className="oracle-header">
          <h1>Weather Oracle</h1>
          <p className="powered-by">Powered by VIA Protocol</p>
        </div>

        <div className="error-container">
          <h2>Deployment Not Found</h2>
          <p>{deploymentError}</p>
          <p>Please run the deployment script first:</p>
          <pre>node scripts/deploy.js</pre>
          <p>This will deploy the WeatherOracle contract to the configured networks and set up the oracle.</p>
        </div>
      </div>
    );
  }

  // Get current network name
  const currentNetworkName = getNetworkByChainId(chainId)?.name || 'Unknown Network';

  return (
    <div className="oracle-container">
      <div className="oracle-header">
        <div className="title-wrapper">
          <h1>Weather Oracle</h1>
          <p className="powered-by">Powered by VIA Protocol</p>
        </div>
        <div className="wallet-section">
          <WalletConnect
            isConnected={isConnected}
            address={address}
            chainId={chainId}
            networkName={currentNetworkName}
            onConnect={handleConnect}
          />
        </div>
      </div>

      <div className="oracle-main">
        <div className="oracle-card">
          <div className="oracle-form-container">
            <div className="oracle-intro">
              <h2>Cross-Chain Weather Oracle</h2>
              <p>Request real-time weather data from any location using a zipcode.</p>
              <p>The data is fetched by an off-chain oracle node and delivered on-chain.</p>
            </div>

            {isConnected ? (
              <WeatherRequestForm
                onSubmit={handleWeatherRequest}
                isRequesting={isRequesting}
              />
            ) : (
              <div className="connect-prompt">
                <p>Connect your wallet to request weather data</p>
              </div>
            )}

            {weatherData && (
              <WeatherDisplay data={weatherData} />
            )}

            {isConnected && (
              <RequestHistory
                requests={requestHistory}
                isLoading={isLoadingHistory}
                selectedRequest={selectedRequest}
                onSelectRequest={handleSelectRequest}
              />
            )}

            <div className="oracle-footer">
              <img src="/logo-black.svg" alt="VIA Protocol" className="via-logo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
