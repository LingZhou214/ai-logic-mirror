// api/recommend.js

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Get the user's search term from the frontend
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    // 2. Access your hidden API Key stored in Vercel's Environment Variables
    const API_KEY = process.env.GEMINI_API_KEY; 

    if (!API_KEY) {
         return res.status(500).json({ error: 'API key is not configured on the server' });
    }

    // The instruction set for the AI
    const prompt = `
        You are a sophisticated video recommendation algorithm designed to maximize watch time. 
        The user just searched for: "${query}".
        
        Generate 3 highly engaging, slightly escalated video recommendations related to this topic. 
        Do not use generic templates. Make them specific to the nuances of "${query}".
        
        Return the result strictly as a JSON array of objects. 
        Do not include markdown blocks like \`\`\`json. Just the raw array.
        Format:
        [
          {
            "title": "A highly clickable title",
            "desc": "A brief, compelling video description",
            "logic": "The psychological or algorithmic reason you chose to recommend this specific video next."
          }
        ]
    `;

    try {
        // 3. Make the request to the AI using your secure key
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        
        // Handle potential errors from Google's API
        if (data.error) {
             console.error("Gemini API Error:", data.error);
             return res.status(500).json({ error: 'Failed to generate content from AI' });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        
        // Clean and parse the JSON output from the AI
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedRecommendations = JSON.parse(cleanJson);
        
        // 4. Send the safe data back to your user's browser
        res.status(200).json(parsedRecommendations);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Failed to generate recommendations" });
    }
}