export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, system } = req.body;

    // Debug: kiểm tra env var
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: { message: 'GEMINI_API_KEY chưa được cấu hình trên server' } });
    }

    if (!messages || !system) {
        return res.status(400).json({ error: 'Missing messages or system prompt' });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: system }] },
                    contents: messages
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: { message: 'Internal server error: ' + err.message } });
    }
}
