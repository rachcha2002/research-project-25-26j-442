const axios = require('axios');

class RAGService {
    constructor() {
        this.baseURL = process.env.RAG_SERVICE_URL || 'http://localhost:3002';
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Retrieve relevant documents from the RAG service
     * @param {string} query - User's query
     * @param {number} topK - Number of documents to retrieve
     * @param {number} similarityThreshold - Minimum similarity score
     * @returns {Promise<Object>} Retrieved documents and context
     */
    async retrieveDocuments(query, topK = 5, similarityThreshold = 0.0) {
        try {
            console.log(`📚 RAG: Retrieving documents for query: "${query.substring(0, 50)}..."`);
            
            const response = await this.client.post('/api/rag/retrieve', {
                query,
                top_k: topK,
                similarity_threshold: similarityThreshold
            });

            if (response.data.success) {
                console.log(`✅ RAG: Retrieved ${response.data.count} documents`);
                return {
                    success: true,
                    documents: response.data.documents,
                    context: response.data.context,
                    count: response.data.count
                };
            } else {
                throw new Error('RAG retrieval failed');
            }
        } catch (error) {
            console.error('❌ RAG Service Error:', error.message);
            
            // If RAG service is unavailable, return empty context
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                console.warn('⚠️  RAG service unavailable, proceeding without context');
                return {
                    success: false,
                    documents: [],
                    context: '',
                    count: 0,
                    error: 'RAG service unavailable'
                };
            }
            
            throw error;
        }
    }

    /**
     * Get RAG service health status
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return {
                available: true,
                status: response.data.status,
                service: response.data.service,
                version: response.data.version
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Get RAG service statistics
     * @returns {Promise<Object>} Service statistics
     */
    async getStats() {
        try {
            const response = await this.client.get('/api/rag/stats');
            return response.data;
        } catch (error) {
            console.error('Failed to get RAG stats:', error.message);
            return null;
        }
    }
}

// Singleton instance
let ragServiceInstance = null;

function getRagService() {
    if (!ragServiceInstance) {
        ragServiceInstance = new RAGService();
    }
    return ragServiceInstance;
}

module.exports = { RAGService, getRagService };
