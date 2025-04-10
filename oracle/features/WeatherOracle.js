/**
 * Ultra-Simplified Weather Private Oracle
 * 
 * This Private Oracle fetches weather data from wttr.in API and returns it to the oracle contract.
 * It only processes requests from the hardcoded contract address.
 */

import { ethers } from 'ethers';
import axios from 'axios';

/**
 * Weather Oracle feature that implements the IFeature interface from node-core.
 * This feature processes weather data requests and returns static weather data.
 */
class WeatherOracle {
    // Feature identification properties required by IFeature
    featureId = 1; // ID 1 for Private Oracle
    featureName = 'WeatherOracle';
    featureDescription = 'Private Oracle that returns static weather data';

    // Track processed requests to avoid duplicates
    processedRequests = new Set();

    // Hardcoded address of the deployed WeatherOracle contract on Avalanche testnet
    // This is the address we'll accept requests from
    deployedAddress = '';

    constructor() {
        if (this.deployedAddress === '') {
            throw new Error('WeatherOracle contract address not set. Please check the deployments/ directory for the deployed contract address and set it in the deployedAddress variable.');
        }
    }

    /**
     * Process a message from the blockchain
     * This is called when the WeatherOracle contract requests weather data
     * 
     * @param {object} driver - The blockchain driver handling the message
     * @param {object} message - The message containing feature data
     * @returns {object} The processed message with feature reply
     */
    async process(driver, message) {
        const txId = message.values?.txId;
        console.log(`[WeatherOracle] Processing request: ${txId}`);

        // Check if we've already processed this request
        if (this.processedRequests.has(txId)) {
            console.log(`[WeatherOracle] Already processed request: ${txId}, skipping`);
            return message;
        }

        // Mark this request as processed
        this.processedRequests.add(txId);

        try {
            // We MUST decode the requestId from featureData
            if (!message.featureData) {
                throw new Error("No featureData found in message");
            }

            // The contract encodes (requestId, zipcode) in featureData
            const abiCoder = new ethers.AbiCoder();
            const decoded = abiCoder.decode(
                ['uint256', 'string'],
                message.featureData
            );
            const requestId = decoded[0]; // Extract requestId
            const zipcode = decoded[1]; // Extract zipcode

            console.log(`[WeatherOracle] Decoded requestId: ${requestId}, zipcode: ${zipcode}`);

            // Fetch real weather data from wttr.in
            const response = await axios.get(`https://wttr.in/${zipcode}?format=j1`);
            const weatherData = response.data;

            // Extract current temperature, conditions and location info
            const currentTemp = weatherData.current_condition[0].temp_F;
            const currentConditions = weatherData.current_condition[0].weatherDesc[0].value;
            const location = `${weatherData.nearest_area[0].areaName[0].value}, ${weatherData.nearest_area[0].region[0].value}, ${weatherData.nearest_area[0].country[0].value}`;

            // Encode the real weather data - MUST match contract's expected format
            // Format: (uint requestId, string temperature, string conditions, string location)
            const featureReply = abiCoder.encode(
                ['uint256', 'string', 'string', 'string'],
                [
                    requestId,
                    `${currentTemp}F`,
                    currentConditions,
                    location
                ]
            );

            // Set the feature reply on the message
            message.featureReply = featureReply;

            // CRITICAL: Ensure featureId is set on the message
            // This is needed by the executor to properly build the process args
            message.featureId = this.featureId;

            console.log(`[WeatherOracle] Static response encoded and ready to send for requestId: ${requestId}`);
            console.log(`[WeatherOracle] Message properties set: featureId=${message.featureId}, has featureReply=${!!message.featureReply}`);
            return message;
        } catch (error) {
            console.error(`[WeatherOracle] Error processing message:`, error);
            // If we can't decode the message, we can't process it
            // Just return the message without a featureReply
            return message;
        }
    }

    /**
     * Validate a message from the blockchain
     * This is called before process() to allow custom security checks
     * 
     * @param {object} driver - The blockchain driver handling the message
     * @param {object} message - The message to validate
     * @returns {boolean} Whether the message is valid for this feature
     */
    async isMessageValid(driver, message) {
        // Check if the sender matches our hardcoded deployed address
        if (message.sender && message.sender.toLowerCase() !== this.deployedAddress.toLowerCase()) {
            console.log(`[WeatherOracle] Ignoring request from non-deployed contract: ${message.sender}`);
            return false;
        }

        console.log(`[WeatherOracle] Valid request from deployed contract: ${message.sender}`);
        return true;
    }
}

export default WeatherOracle;
