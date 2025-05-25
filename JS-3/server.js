const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const API_URL = 'http://localhost:8082/api';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', async (req, res) => {
  try {
    // Fetch categories and artifacts in parallel
    const [categoriesResponse, artifactsResponse] = await Promise.all([
      axios.get(`${API_URL}/Categories`),
      axios.get(`${API_URL}/Artifacts`)
    ]);
    
    res.render('index', { 
      categories: categoriesResponse.data,
      artifacts: artifactsResponse.data
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.render('index', { 
      categories: [],
      artifacts: [],
      error: 'Failed to load data from API'
    });
  }
});

// API proxy routes for Artifacts
app.get('/api/artifacts', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/Artifacts`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/api/artifacts', async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/Artifacts`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/artifacts/:id', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/Artifacts/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.put('/api/artifacts/:id', async (req, res) => {
  try {
    const response = await axios.put(`${API_URL}/Artifacts/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.delete('/api/artifacts/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${API_URL}/Artifacts/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.put('/api/artifacts/:id/move', async (req, res) => {
  try {
    const response = await axios.put(`${API_URL}/Artifacts/${req.params.id}/move`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/api/artifacts/:id/versions', async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/Artifacts/${req.params.id}/versions`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// API proxy routes for Categories
app.get('/api/categories', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/Categories`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/Categories`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const response = await axios.put(`${API_URL}/Categories/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${API_URL}/Categories/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.put('/api/categories/:id/move-to', async (req, res) => {
  try {
    const response = await axios.put(`${API_URL}/Categories/${req.params.id}/move-to`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
  console.log(`Connected to API at ${API_URL}`);
});
