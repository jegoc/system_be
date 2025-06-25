const express = require('express');
const router = express.Router();
const { getEmbedding } = require('./embedding');
const { index } = require('./pinecone'); // Adjust path based on your structure

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const embedding = await getEmbedding(query);

    const result = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });

    res.json(result.matches);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
