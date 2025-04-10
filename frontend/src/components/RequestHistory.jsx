/**
 * Request History Component
 * ========================
 * 
 * This component displays a history of weather data requests made by the user.
 * It shows the request ID, zipcode, status (fulfilled or pending), and timestamp.
 * Users can click on a request to view the weather data.
 */

import React from 'react';
import '../styles/request-history.css';

function RequestHistory({ requests, isLoading, selectedRequest, onSelectRequest }) {
    // Format timestamp to readable date/time
    const formatTimestamp = (timestamp) => {
        if (!timestamp || timestamp === '0') return 'N/A';

        try {
            const date = new Date(Number(timestamp) * 1000);
            return date.toLocaleString();
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid timestamp';
        }
    };

    // If loading, show loading indicator
    if (isLoading) {
        return (
            <div className="request-history">
                <h3>Request History</h3>
                <div className="loading-indicator">Loading request history...</div>
            </div>
        );
    }

    // If no requests, show empty state
    if (!requests || requests.length === 0) {
        return (
            <div className="request-history">
                <h3>Request History</h3>
                <div className="empty-state">
                    <p>No weather requests found.</p>
                    <p>Use the form above to request weather data for a zipcode.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="request-history">
            <h3>Request History</h3>
            <div className="request-list">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className={`request-item ${selectedRequest && selectedRequest.id === request.id ? 'selected' : ''} ${request.fulfilled ? 'fulfilled' : 'pending'}`}
                        onClick={() => onSelectRequest(request)}
                    >
                        <div className="request-header">
                            <div className="request-zipcode">
                                {request.zipcode}
                            </div>
                            <div className="request-status">
                                {request.fulfilled ? 'Fulfilled' : 'Pending'}
                            </div>
                        </div>
                        <div className="request-details">
                            <div className="request-id">
                                ID: {request.id}
                            </div>
                            <div className="request-timestamp">
                                {request.fulfilled
                                    ? formatTimestamp(request.timestamp)
                                    : 'Waiting for oracle...'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="history-info">
                <p>
                    Click on a request to view its weather data.
                    Pending requests are waiting for the oracle to fulfill them.
                </p>
            </div>
        </div>
    );
}

export default RequestHistory;
